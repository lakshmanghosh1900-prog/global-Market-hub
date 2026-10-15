import { NextResponse } from "next/server";
import { isAuthorizedCron, unauthorizedCron } from "@/lib/cron";
import { runDelistSweep } from "@/lib/catalog-jobs";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return unauthorizedCron();
  try {
    const result = await runDelistSweep();
    return NextResponse.json({ success: true, delisted: result.count });
  } catch {
    return NextResponse.json({ success: false, error: "Delist sweep failed" }, { status: 500 });
  }
}
