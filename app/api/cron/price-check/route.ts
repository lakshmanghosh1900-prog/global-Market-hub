import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthorizedCron, unauthorizedCron } from "@/lib/cron";
import { isConfiguredValue } from "@/lib/config";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return unauthorizedCron();
  try {
    const alerts = await prisma.priceAlert.findMany({ where: { active: true, triggeredAt: null }, include: { product: true } });
    const ready = alerts.filter((alert) => Number(alert.product.price) <= Number(alert.targetPrice));
    const providerConfigured = isConfiguredValue(process.env.RESEND_API_KEY) && isConfiguredValue(process.env.RESEND_FROM_EMAIL);
    // A price match is not delivery. Keep alerts pending until a compliant
    // dispatcher is configured and has actually completed a send.
    return NextResponse.json({ success: true, matched: ready.length, triggered: 0, delivery: providerConfigured ? "provider-configured-but-dispatch-disabled" : "disabled-provider-not-configured" });
  } catch {
    return NextResponse.json({ success: false, error: "Price check failed" }, { status: 500 });
  }
}
