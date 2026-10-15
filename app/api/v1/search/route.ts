import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const bracket = url.searchParams.get("bracket") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;
  const merchant = url.searchParams.get("merchant") ?? undefined;
  const freshness = url.searchParams.get("freshness") ?? undefined;
  const sort = (url.searchParams.get("sort") as "price_low" | "newest" | "relevance" | null) ?? "relevance";
  const products = await searchProducts(query, bracket, category, { merchant, freshness, sort });

  return NextResponse.json({
    country: (url.searchParams.get("country") ?? "IN").toUpperCase(),
    query,
    filters: { category: category ?? null, bracket: bracket ?? null, merchant: merchant ?? null, freshness: freshness ?? null, sort },
    count: products.length,
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.image,
      category: product.category,
      merchant: product.merchant,
      inStock: product.inStock,
    })),
  }, { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
