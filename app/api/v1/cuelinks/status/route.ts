import { NextResponse } from "next/server";
import { cuelinksStatus } from "@/lib/connectors/cuelinks";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ...cuelinksStatus(),
    campaigns: "available through the official V3 campaigns endpoint when verified",
    offers: "available through the official V3 offers endpoint when verified",
    productFeed: "PRODUCT_FEED_ACCESS_UNKNOWN",
  }, { headers: { "cache-control": "no-store" } });
}
