import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/in/", "/in/product/", "/in/under/"], disallow: ["/out", "/api/", "/_next/"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
