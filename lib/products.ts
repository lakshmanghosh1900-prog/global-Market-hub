import { prisma } from "@/lib/db";
import { hasFlipkartCredentials } from "@/lib/config";
import { mockFlipkartProducts } from "@/lib/mock-products";
import type { ListingProduct } from "@/lib/types";

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
});

export async function getProductsForBracket(bracket: string) {
  if (!hasFlipkartCredentials()) {
    return mockFlipkartProducts.filter((product) => product.category === bracket);
  }

  try {
    const priceLimit = bracket.startsWith("under-")
      ? Number(bracket.replace("under-", ""))
      : null;
    const products = await prisma.product.findMany({
      where: {
        ...(priceLimit !== null ? { price: { lte: priceLimit } } : { category: bracket }),
        merchant: "Flipkart",
        isDelisted: false,
      },
      orderBy: [{ price: "asc" }, { lastSync: "desc" }],
    });

    return products.map(toListingProduct);
  } catch (error) {
    console.warn("Flipkart database unavailable; showing Sprint 1 mock products.", error);
    return mockFlipkartProducts.filter((product) => product.category === bracket);
  }
}

export async function getProductBySlug(slug: string) {
  const mock = mockFlipkartProducts.find((product) => product.slug === slug);
  if (!hasFlipkartCredentials()) {
    return mock ?? null;
  }

  try {
    const product = await prisma.product.findUnique({ where: { slug } });
    return product ? toListingProduct(product) : mock ?? null;
  } catch (error) {
    console.warn("Product lookup unavailable; using mock product when available.", error);
    return mock ?? null;
  }
}

export async function searchProducts(query: string, bracket?: string, category?: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const mockResults = mockFlipkartProducts.filter((product) => {
    const matchesQuery = !normalizedQuery ||
      `${product.title} ${product.brand ?? ""} ${product.category}`.toLowerCase().includes(normalizedQuery);
    const matchesBracket = !bracket || product.category === bracket ||
      (bracket.startsWith("under-") && product.price <= Number(bracket.replace("under-", "")));
    const matchesCategory = !category || product.category === category;
    return matchesQuery && matchesBracket && matchesCategory;
  });

  if (!hasFlipkartCredentials()) {
    return mockResults;
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        merchant: "Flipkart",
        isDelisted: false,
        ...(category ? { category } : {}),
        ...(normalizedQuery
          ? { OR: [{ title: { contains: normalizedQuery, mode: "insensitive" } }, { brand: { contains: normalizedQuery, mode: "insensitive" } }] }
          : {}),
      },
      orderBy: [{ inStock: "desc" }, { price: "asc" }],
      take: 12,
    });
    return products.map(toListingProduct);
  } catch (error) {
    console.warn("Product search unavailable; using mock products.", error);
    return mockResults;
  }
}
