import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { prisma } from "@/lib/db";

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  try {
    const [byMerchant, byProduct] = await Promise.all([
      prisma.clickEvent.groupBy({ by: ["merchant"], _count: { _all: true }, orderBy: { _count: { merchant: "desc" } } }),
      prisma.clickEvent.groupBy({ by: ["productId"], where: { productId: { not: null } }, _count: { _all: true }, orderBy: { _count: { productId: "desc" } }, take: 20 }),
    ]);
    const productIds = byProduct.map((row) => row.productId).filter((id): id is string => Boolean(id));
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true } });
    const names = new Map(products.map((product) => [product.id, product.title]));
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Clicks · Global Market Hub</title><style>body{font:16px system-ui;max-width:900px;margin:3rem auto;padding:0 1rem;color:#172033}table{border-collapse:collapse;width:100%;margin:1rem 0}td,th{border:1px solid #cbd5e1;padding:.6rem;text-align:left}</style></head><body><h1>Affiliate click dashboard</h1><p>Conversion tracking is a placeholder until merchant postbacks are configured.</p><h2>Clicks by merchant</h2><table><tr><th>Merchant</th><th>Clicks</th></tr>${byMerchant.map((row) => `<tr><td>${escapeHtml(row.merchant)}</td><td>${row._count._all}</td></tr>`).join("") || "<tr><td colspan=2>No clicks yet</td></tr>"}</table><h2>Top products</h2><table><tr><th>Product</th><th>Clicks</th></tr>${byProduct.map((row) => `<tr><td>${escapeHtml(row.productId ? names.get(row.productId) ?? row.productId : "Unknown")}</td><td>${row._count._all}</td></tr>`).join("") || "<tr><td colspan=2>No product-attributed clicks yet</td></tr>"}</table></body></html>`;
    return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  } catch {
    return new NextResponse("Click analytics require the production database migration.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}
