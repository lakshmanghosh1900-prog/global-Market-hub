import { NextResponse } from "next/server";
import { isAuthorizedCron, unauthorizedCron } from "@/lib/cron";
import { countCatalogProducts } from "@/lib/catalog-jobs";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return unauthorizedCron();
  try {
    return NextResponse.json({ success: true, indexed: await countCatalogProducts(), mode: "category-map-ready" });
  } catch {
    return NextResponse.json({ success: true, indexed: 0, mode: "mock" });
  }
}
