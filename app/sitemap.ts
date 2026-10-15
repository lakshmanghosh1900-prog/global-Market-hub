import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { searchProducts } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await searchProducts("");
  const base = siteUrl();
  return [
    { url: `${base}/in/sitemap.xml`, lastModified: new Date() },
    { url: `${base}/in/under/under-49`, lastModified: new Date() },
    { url: `${base}/in/under/under-99`, lastModified: new Date() },
    { url: `${base}/in/under/under-199`, lastModified: new Date() },
    { url: `${base}/in/wishlist`, lastModified: new Date() },
    ...products.map((product) => ({ url: `${base}/in/product/${product.slug}`, lastModified: product.lastSync })),
  ];
}
