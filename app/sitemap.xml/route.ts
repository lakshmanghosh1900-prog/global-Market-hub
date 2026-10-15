import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/seo";
import { activeSitemapPaths } from "@/app/sitemap";

export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${activeSitemapPaths.map((path) => `<sitemap><loc>${siteUrl()}${path}</loc></sitemap>`).join("")}</sitemapindex>`;
  return new NextResponse(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
