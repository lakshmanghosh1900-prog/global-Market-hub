import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const bracket = url.searchParams.get("bracket") ?? undefined;
  const products = await searchProducts(query, bracket);

  return NextResponse.json({
    country: (url.searchParams.get("country") ?? "IN").toUpperCase(),
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      merchant: product.merchant,
      inStock: product.inStock,
    })),
  });
}
