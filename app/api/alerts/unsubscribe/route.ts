import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { type AlertSubscriptionStore, unsubscribeAlertSubscription } from "@/lib/offer-alerts";

async function getUnsubscribe(request: Request, store: AlertSubscriptionStore = prisma) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return NextResponse.json({ error: "A valid unsubscribe token is required" }, { status: 400 });

  try {
    const result = await unsubscribeAlertSubscription(store, token);
    if (result.count !== 1) return NextResponse.json({ error: "This unsubscribe link is invalid or has already been used" }, { status: 404 });
    return NextResponse.json({ ok: true, message: "You have been unsubscribed from deal alerts." });
  } catch {
    return NextResponse.json({ error: "Alert subscriptions require the Section 12.8 database migration" }, { status: 503 });
  }
}

export async function GET(request: Request) {
  return getUnsubscribe(request, prisma);
}
