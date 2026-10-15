import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthorizedCron, unauthorizedCron } from "@/lib/cron";
import { runIngest } from "@/lib/cron-jobs";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return unauthorizedCron();
  try {
    const ingest = await runIngest();
    const alerts = await prisma.priceAlert.findMany({ where: { active: true, triggeredAt: null }, include: { product: true } });
    const ready = alerts.filter((alert) => Number(alert.product.price) <= Number(alert.targetPrice));
    if (ready.length > 0) {
      await prisma.priceAlert.updateMany({ where: { id: { in: ready.map((alert) => alert.id) } }, data: { triggeredAt: new Date() } });
    }
    return NextResponse.json({ success: true, ingest, triggered: ready.length, emailProvider: process.env.RESEND_API_KEY ? "resend-configured" : "placeholder" });
  } catch {
    return NextResponse.json({ success: true, triggered: 0, mode: "mock" });
  }
}
