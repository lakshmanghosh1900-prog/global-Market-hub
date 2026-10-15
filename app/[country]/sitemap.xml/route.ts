import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products";
import { siteUrl } from "@/lib/seo";

const xmlEscape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET(_: Request, { params }: { params: { country: string } }) {
  const products = await searchProducts("");
  const base = siteUrl();
  const urls = [
    `/${params.country}/under/under-49`,
    `/${params.country}/under/under-99`,
    `/${params.country}/under/under-199`,
    ...products.map((product) => `/${params.country}/product/${product.slug}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${xmlEscape(`${base}${path}`)}</loc></url>`).join("")}</urlset>`;
  return new NextResponse(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
