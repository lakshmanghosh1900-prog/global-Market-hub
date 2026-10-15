import type { MetadataRoute } from "next";

export const activeSitemapPaths = ["/in/sitemap.xml"];

export default function sitemap(): MetadataRoute.Sitemap {
  return activeSitemapPaths.map((path) => ({ url: path, lastModified: new Date() }));
}
