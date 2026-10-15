import { NextResponse } from "next/server";
import { isAuthorizedCron, unauthorizedCron } from "@/lib/cron";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return unauthorizedCron();
  return NextResponse.json({ success: true, mode: "shared-upsert-policy", delisted: 0 });
}
