import { NextResponse } from "next/server";
import { searchProductsWithMeta } from "@/lib/products";
import { canonicalCategories } from "@/lib/taxonomy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const rawBracket = url.searchParams.get("bracket") ?? undefined;
  const bracket = rawBracket && ["under-49", "under-99", "under-199", "under-499"].includes(rawBracket) ? rawBracket : undefined;
  const rawCategory = url.searchParams.get("category") ?? undefined;
  const category = rawCategory && canonicalCategories.some((term) => term.slug === rawCategory) ? rawCategory : undefined;
  const merchant = url.searchParams.get("merchant") ?? undefined;
  const freshness = url.searchParams.get("freshness") ?? undefined;
  const rawSort = url.searchParams.get("sort");
  const sort = rawSort === "price_low" || rawSort === "newest" ? rawSort : "relevance";
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
