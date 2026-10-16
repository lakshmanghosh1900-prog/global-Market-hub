import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeEmail, type AlertSubscriptionStore, unsubscribeAlertSubscription } from "@/lib/offer-alerts";

async function getUnsubscribe(request: Request, store: AlertSubscriptionStore = prisma) {
  const email = normalizeEmail(new URL(request.url).searchParams.get("email"));
  if (!email) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });

  try {
    await unsubscribeAlertSubscription(store, email);
    return NextResponse.json({ ok: true, message: "You have been unsubscribed from deal alerts." });
  } catch {
    return NextResponse.json({ error: "Alert subscriptions require the Section 12.8 database migration" }, { status: 503 });
  }
}

export async function GET(request: Request) {
  return getUnsubscribe(request, prisma);
}
