import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export const activeSitemapPaths = ["/in/sitemap.xml"];

export default function sitemap(): MetadataRoute.Sitemap {
  return activeSitemapPaths.map((path) => ({ url: `${siteUrl()}${path}`, lastModified: new Date() }));
}
