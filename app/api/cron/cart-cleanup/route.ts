import { NextResponse } from "next/server";
import { isAuthorizedCron, unauthorizedCron } from "@/lib/cron";
import { cleanupExpiredCarts } from "@/lib/cart";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return unauthorizedCron();
  try {
    const result = await cleanupExpiredCarts(prisma);
    return NextResponse.json({ success: true, deleted: result.count });
  } catch {
    return NextResponse.json({ success: false, error: "Cart cleanup failed" }, { status: 500 });
  }
}
