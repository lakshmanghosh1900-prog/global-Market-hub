import { NextResponse } from "next/server";
import { adminCookieHeader, isAdminRequest } from "@/lib/admin";
import { importCuratedCsv } from "@/lib/curated-upload";

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function uploadPage(message = "") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Curated upload · Global Market Hub</title><style>body{font:16px system-ui;max-width:760px;margin:3rem auto;padding:0 1rem;color:#172033}label{display:block;margin:.8rem 0;font-weight:600}input,button{font:inherit;padding:.7rem}button{background:#0f766e;color:#fff;border:0;border-radius:6px;cursor:pointer}.notice{padding:1rem;background:#ecfdf5;border-radius:6px;white-space:pre-wrap}code{background:#f1f5f9;padding:.15rem .3rem}</style></head><body><h1>Curated CSV upload</h1><p>Amazon and Cuelinks imports are written as <code>source=curated</code> products.</p>${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}<form method="post" enctype="multipart/form-data"><label>CSV file <input type="file" name="file" accept=".csv,text/csv" required></label><button type="submit">Validate and import</button></form><p>Required header: <code>title,brand,price,mrp,image_url,merchant,affiliate_url,gtin,category_slug,bracket</code></p></body></html>`;
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  const response = new NextResponse(uploadPage(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  const cookie = adminCookieHeader();
  if (cookie) response.headers.set("set-cookie", cookie);
  return response;
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  try {
    const result = await importCuratedCsv(await file.text());
    const message = `Imported: ${result.imported}\nRejected: ${result.rejected}${result.errors.length ? `\n\n${result.errors.join("\n")}` : ""}`;
    if (request.headers.get("accept")?.includes("application/json")) return NextResponse.json(result);
    return new NextResponse(uploadPage(message), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "CSV import failed" }, { status: 400 });
  }
}
