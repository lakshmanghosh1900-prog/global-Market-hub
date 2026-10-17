import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { searchProductsWithMeta } from "@/lib/products";
import { siteUrl } from "@/lib/seo";
import { isActiveCountry } from "@/lib/catalog-config";
import { canonicalCategories } from "@/lib/taxonomy";

const xmlEscape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET(_: Request, { params }: { params: { country: string } }) {
  const country = params.country.toLowerCase();
  if (!isActiveCountry(country)) notFound();
  const firstPage = await searchProductsWithMeta("", { page: 1, pageSize: 48 });
  const productPages = [firstPage];
  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    productPages.push(await searchProductsWithMeta("", { page, pageSize: 48 }));
  }
  const products = productPages.flatMap((result) => result.products).filter((product) => !product.isFixture);
  const base = siteUrl();
  const urls = [
    `/${country}`,
    `/${country}/categories`,
    `/${country}/under/under-49`,
    `/${country}/under/under-99`,
    `/${country}/under/under-199`,
    `/${country}/under/under-499`,
    ...canonicalCategories.map((term) => `/${country}/c/${term.slug}`),
    `/${country}/hubs/deals`,
    `/${country}/hubs/new-arrivals`,
    ...products.map((product) => `/${country}/product/${product.slug}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${xmlEscape(`${base}${path}`)}</loc></url>`).join("")}</urlset>`;
  return new NextResponse(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
