import { prisma } from "@/lib/db";
import { mockFlipkartProducts } from "@/lib/mock-products";
import type { ListingProduct } from "@/lib/types";

type SearchOptions = {
  bracket?: string;
  category?: string;
  merchant?: string;
  freshness?: string;
  sort?: "price_low" | "newest" | "relevance";
};

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
  return mockFlipkartProducts.filter((product) => {
    const matchesQuery = !normalizedQuery || `${product.title} ${product.brand ?? ""} ${product.category}`.toLowerCase().includes(normalizedQuery);
    const matchesBracket = !options.bracket || product.category === options.bracket || (options.bracket.startsWith("under-") && product.price <= Number(options.bracket.replace("under-", "")));
    const matchesCategory = !options.category || product.category === options.category;
    const matchesMerchant = !options.merchant || product.merchant === options.merchant;
    return matchesQuery && matchesBracket && matchesCategory && matchesMerchant;
  });
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

export async function getProductsForBracket(bracket: string) {
  try {
    const priceLimit = bracket.startsWith("under-") ? Number(bracket.replace("under-", "")) : null;
    const products = await prisma.product.findMany({
      where: {
        ...(priceLimit !== null ? { price: { lte: priceLimit } } : { category: bracket }),
        isDelisted: false,
      },
      orderBy: [{ price: "asc" }, { lastSync: "desc" }],
    });
    if (products.length) return products.map(toListingProduct);
  } catch (error) {
    console.warn("Catalog database unavailable; showing local fixture products.", error);
  }
  return mockFlipkartProducts.filter((product) => product.category === bracket || (bracket.startsWith("under-") && product.price <= Number(bracket.replace("under-", ""))));
}

export async function getProductBySlug(slug: string) {
  const mock = mockFlipkartProducts.find((product) => product.slug === slug);
  try {
    const product = await prisma.product.findFirst({ where: { slug, isDelisted: false } });
    return product ? toListingProduct(product) : mock ?? null;
  } catch (error) {
    console.warn("Product lookup unavailable; using local fixture when available.", error);
    return mock ?? null;
  }
}

export async function searchProducts(query: string, bracket?: string, category?: string, options: Omit<SearchOptions, "bracket" | "category"> = {}) {
  const searchOptions: SearchOptions = { ...options, bracket, category };
  const fallback = mockMatches(query, searchOptions);
  const priceLimit = bracket?.startsWith("under-") ? Number(bracket.replace("under-", "")) : undefined;
  const freshness = freshnessDate(options.freshness);

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
        ...(category ? { category } : {}),
        ...(options.merchant ? { merchant: options.merchant } : {}),
        ...(freshness ? { lastSync: { gte: freshness } } : {}),
        ...(!ids && query.trim() ? {
          OR: [
            { title: { contains: query.trim(), mode: "insensitive" } },
            { brand: { contains: query.trim(), mode: "insensitive" } },
            { category: { contains: query.trim().toLowerCase(), mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: options.sort === "newest" ? [{ lastSync: "desc" }, { inStock: "desc" }] : [{ inStock: "desc" }, { price: "asc" }],
      take: 48,
    });
    if (products.length) return products.map(toListingProduct);
  } catch (error) {
    console.warn("Product search unavailable; using local fixture products.", error);
  }
  return fallback;
}
