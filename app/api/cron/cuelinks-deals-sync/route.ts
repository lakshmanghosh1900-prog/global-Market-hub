import { NextResponse } from "next/server";
import { isAuthorizedCron, unauthorizedCron } from "@/lib/cron";
import { fetchCuelinksDeals } from "@/lib/connectors/cuelinks";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return unauthorizedCron();
  try {
    const deals = await fetchCuelinksDeals();
    return NextResponse.json({ success: true, mode: "deals-only", synced: deals.length });
  } catch {
    return NextResponse.json({ success: false, error: "Cuelinks deal sync failed" }, { status: 502 });
  }
}
