import { NextResponse } from "next/server";
import { searchProductsWithMeta } from "@/lib/products";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const bracket = url.searchParams.get("bracket") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;
  const merchant = url.searchParams.get("merchant") ?? undefined;
  const freshness = url.searchParams.get("freshness") ?? undefined;
  const sort = (url.searchParams.get("sort") as "price_low" | "newest" | "relevance" | null) ?? "relevance";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(48, Math.max(1, Number(url.searchParams.get("pageSize") ?? "12") || 12));
  const result = await searchProductsWithMeta(query, { bracket, category, merchant, freshness, sort, page, pageSize });

  return NextResponse.json({
    country: (url.searchParams.get("country") ?? "IN").toUpperCase(),
    query,
    filters: { category: category ?? null, bracket: bracket ?? null, merchant: merchant ?? null, freshness: freshness ?? null, sort },
    count: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    products: result.products.map((product) => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.image,
      category: product.category,
      merchant: product.merchant,
      inStock: product.inStock,
      isFixture: product.isFixture ?? false,
    })),
  }, { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
