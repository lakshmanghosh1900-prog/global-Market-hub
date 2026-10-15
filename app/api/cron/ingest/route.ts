import { NextResponse } from "next/server";
import { runIngest } from "@/lib/cron-jobs";
import { isAuthorizedCron, unauthorizedCron } from "@/lib/cron";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return unauthorizedCron();
  const started = Date.now();
  try {
    const result = await runIngest();
    return NextResponse.json({ success: true, ...result, durationMs: Date.now() - started });
  } catch {
    return NextResponse.json({ success: false, error: "Ingest failed" }, { status: 500 });
  }
}
