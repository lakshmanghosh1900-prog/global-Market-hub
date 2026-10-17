import { NextResponse } from "next/server";
import { isAuthorizedCron, unauthorizedCron } from "@/lib/cron";
import { runCategoryHealthCheck } from "@/lib/catalog-jobs";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return unauthorizedCron();
  try {
    return NextResponse.json({ success: true, mode: "category-health-check", ...(await runCategoryHealthCheck()) });
  } catch {
    return NextResponse.json({ success: false, error: "Category reindex failed" }, { status: 500 });
  }
}
