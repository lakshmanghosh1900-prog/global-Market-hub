import { prisma } from "@/lib/db";
import { mockFlipkartProducts } from "@/lib/mock-products";
import type { ListingProduct } from "@/lib/types";

export type SearchOptions = {
  bracket?: string;
  category?: string;
  merchant?: string;
  freshness?: string;
  sort?: "price_low" | "newest" | "relevance";
  page?: number;
  pageSize?: number;
};

export type ProductSearchResult = {
  products: ListingProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const SEARCH_PAGE_SIZE = 12;
const supportedBrackets = new Set(["under-49", "under-99", "under-199", "under-499"]);

const toListingProduct = (product: {
  id: string;
  sku: string;
  slug: string;
  title: string;
  price: unknown;
  mrp: unknown;
  brand: string | null;
  image: string | null;
  gallery?: string[];
  description?: string | null;
  gtin?: string | null;
  affiliateUrl: string;
  merchant: string;
  inStock: boolean;
  lastSync: Date;
  category: string;
  isFixture?: boolean;
}): ListingProduct => ({
  id: product.id,
  sku: product.sku,
  slug: product.slug,
  title: product.title,
  price: Number(product.price),
  mrp: product.mrp === null ? null : Number(product.mrp),
  brand: product.brand,
  image: product.image,
  gallery: product.gallery ?? (product.image ? [product.image] : []),
  description: product.description,
  gtin: product.gtin,
  affiliateUrl: product.affiliateUrl,
  merchant: product.merchant,
  inStock: product.inStock,
  lastSync: product.lastSync,
  category: product.category,
  isFixture: product.isFixture ?? false,
});

const mockMatches = (query: string, options: SearchOptions = {}) => {
  const normalizedQuery = query.trim().toLowerCase();
  const products = mockFlipkartProducts.filter((product) => {
    const matchesQuery = !normalizedQuery || `${product.title} ${product.brand ?? ""} ${product.category}`.toLowerCase().includes(normalizedQuery);
    const matchesBracket = !options.bracket || (supportedBrackets.has(options.bracket) && product.price <= Number(options.bracket.replace("under-", "")));
    const matchesCategory = !options.category || product.category === options.category;
    const matchesMerchant = !options.merchant || product.merchant.toLowerCase() === options.merchant.toLowerCase();
    const freshness = freshnessDate(options.freshness);
    const matchesFreshness = !freshness || product.lastSync >= freshness;
    return matchesQuery && matchesBracket && matchesCategory && matchesMerchant && matchesFreshness;
  });
  return sortProducts(products, normalizedQuery, options.sort);
};

function freshnessDate(freshness?: string) {
  if (!freshness) return undefined;
  const hours = freshness === "24h" ? 24 : freshness === "7d" ? 24 * 7 : freshness === "30d" ? 24 * 30 : undefined;
  return hours ? new Date(Date.now() - hours * 60 * 60 * 1000) : undefined;
}

async function fullTextIds(query: string) {
  if (!query.trim()) return null;
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "v_visible_listings"
    WHERE to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("category", '') || ' ' || coalesce("brand", ''))
      @@ websearch_to_tsquery('simple', ${query.trim()})
  `;
  return rows.map((row) => row.id);
}

function sortProducts(products: ListingProduct[], query: string, sort: SearchOptions["sort"] = "relevance") {
  return [...products].sort((left, right) => {
    if (sort === "price_low") return left.price - right.price || Number(right.inStock) - Number(left.inStock);
    if (sort === "newest") return right.lastSync.getTime() - left.lastSync.getTime();
    const score = (product: ListingProduct) => {
      if (!query) return 0;
      const title = product.title.toLowerCase();
      const brand = product.brand?.toLowerCase() ?? "";
      const category = product.category.toLowerCase();
      return (title === query ? 100 : title.includes(query) ? 50 : 0) + (brand.includes(query) ? 20 : 0) + (category.includes(query) ? 10 : 0);
    };
    return score(right) - score(left) || Number(right.inStock) - Number(left.inStock) || left.price - right.price;
  });
}

function normalizedPagination(options: SearchOptions) {
  const pageSize = Math.min(48, Math.max(1, Math.floor(options.pageSize ?? SEARCH_PAGE_SIZE)));
  const page = Math.max(1, Math.floor(options.page ?? 1));
  return { page, pageSize };
}

export async function getProductsForBracket(bracket: string) {
  try {
    const priceLimit = supportedBrackets.has(bracket) ? Number(bracket.replace("under-", "")) : null;
    const products = await prisma.product.findMany({
      where: {
        ...(priceLimit !== null ? { price: { lte: priceLimit } } : { category: bracket }),
        isDelisted: false,
      },
      orderBy: [{ price: "asc" }, { lastSync: "desc" }],
    });
    return products.map(toListingProduct);
  } catch (error) {
    console.warn("Catalog database unavailable; showing local fixture products.", error);
  }
  return process.env.NODE_ENV !== "production"
    ? mockFlipkartProducts.filter((product) => product.category === bracket || (supportedBrackets.has(bracket) && product.price <= Number(bracket.replace("under-", ""))))
    : [];
}

export async function getProductBySlug(slug: string) {
  const mock = mockFlipkartProducts.find((product) => product.slug === slug);
  try {
    const product = await prisma.product.findFirst({ where: { slug, isDelisted: false } });
    return product ? toListingProduct(product) : process.env.NODE_ENV !== "production" ? mock ?? null : null;
  } catch (error) {
    console.warn("Product lookup unavailable; using local fixture when available.", error);
    return process.env.NODE_ENV !== "production" ? mock ?? null : null;
  }
}

export async function getProductOffers(product: ListingProduct) {
  if (product.isFixture) return [product];
  try {
    const equivalentWhere = product.gtin
      ? { gtin: product.gtin }
      : { title: product.title, ...(product.brand ? { brand: product.brand } : {}) };
    const matches = await prisma.product.findMany({
      where: { ...equivalentWhere, isDelisted: false },
      orderBy: [{ price: "asc" }, { lastSync: "desc" }],
    });
    const offers = matches.map(toListingProduct);
    return offers.length ? offers : [product];
  } catch (error) {
    console.warn("Offer comparison unavailable; showing the primary merchant offer.", error);
    return [product];
  }
}

export async function searchProducts(query: string, bracket?: string, category?: string, options: Omit<SearchOptions, "bracket" | "category"> = {}) {
  const result = await searchProductsWithMeta(query, { ...options, bracket, category });
  return result.products;
}

export async function searchProductsWithMeta(query: string, options: SearchOptions = {}): Promise<ProductSearchResult> {
  const searchOptions: SearchOptions = { ...options, bracket: options.bracket && supportedBrackets.has(options.bracket) ? options.bracket : undefined };
  const { page, pageSize } = normalizedPagination(searchOptions);
  const fallback = mockMatches(query, searchOptions);
  const totalFallback = fallback.length;
  const fallbackStart = (page - 1) * pageSize;
  const fallbackProducts = fallback.slice(fallbackStart, fallbackStart + pageSize);
  const priceLimit = searchOptions.bracket ? Number(searchOptions.bracket.replace("under-", "")) : undefined;
  const freshness = freshnessDate(searchOptions.freshness);

  try {
    let ids: string[] | null = null;
    try {
      ids = await fullTextIds(query);
    } catch {
      // Prisma contains filters below are the portable fallback when the view
      // or PostgreSQL text-search extensions are not deployed yet.
    }

    const products = await prisma.product.findMany({
      where: {
        isDelisted: false,
        ...(ids ? { id: { in: ids } } : {}),
        ...(priceLimit !== undefined ? { price: { lte: priceLimit } } : {}),
        ...(searchOptions.category ? { category: searchOptions.category } : {}),
        ...(searchOptions.merchant ? { merchant: { equals: searchOptions.merchant, mode: "insensitive" } } : {}),
        ...(freshness ? { lastSync: { gte: freshness } } : {}),
        ...(!ids && query.trim() ? {
          OR: [
            { title: { contains: query.trim(), mode: "insensitive" } },
            { brand: { contains: query.trim(), mode: "insensitive" } },
            { category: { contains: query.trim().toLowerCase(), mode: "insensitive" } },
            { sku: { contains: query.trim(), mode: "insensitive" } },
            { merchant: { contains: query.trim(), mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: searchOptions.sort === "newest" ? [{ lastSync: "desc" }, { inStock: "desc" }] : [{ inStock: "desc" }, { price: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const total = await prisma.product.count({
      where: {
        isDelisted: false,
        ...(ids ? { id: { in: ids } } : {}),
        ...(priceLimit !== undefined ? { price: { lte: priceLimit } } : {}),
        ...(searchOptions.category ? { category: searchOptions.category } : {}),
        ...(searchOptions.merchant ? { merchant: { equals: searchOptions.merchant, mode: "insensitive" } } : {}),
        ...(freshness ? { lastSync: { gte: freshness } } : {}),
        ...(!ids && query.trim() ? {
          OR: [
            { title: { contains: query.trim(), mode: "insensitive" } },
            { brand: { contains: query.trim(), mode: "insensitive" } },
            { category: { contains: query.trim().toLowerCase(), mode: "insensitive" } },
            { sku: { contains: query.trim(), mode: "insensitive" } },
            { merchant: { contains: query.trim(), mode: "insensitive" } },
          ],
        } : {}),
      },
    });
    return { products: products.map(toListingProduct), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  } catch (error) {
    console.warn("Product search unavailable; using local fixture products.", error);
  }
  const localProducts = process.env.NODE_ENV !== "production" ? fallbackProducts : [];
  const localTotal = process.env.NODE_ENV !== "production" ? totalFallback : 0;
  return { products: localProducts, total: localTotal, page, pageSize, totalPages: 1 };
}
