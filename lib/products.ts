import { prisma } from "@/lib/db";
import { hasFlipkartCredentials } from "@/lib/config";
import { mockFlipkartProducts } from "@/lib/mock-products";
import type { ListingProduct } from "@/lib/types";

const toListingProduct = (product: {
  id: string;
  sku: string;
  title: string;
  price: unknown;
  mrp: unknown;
  brand: string | null;
  image: string | null;
  affiliateUrl: string;
  merchant: string;
  inStock: boolean;
  lastSync: Date;
  category: string;
}): ListingProduct => ({
  id: product.id,
  sku: product.sku,
  title: product.title,
  price: Number(product.price),
  mrp: product.mrp === null ? null : Number(product.mrp),
  brand: product.brand,
  image: product.image,
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
