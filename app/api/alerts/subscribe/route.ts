import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  type AlertSubscriptionStore,
  isAlertsDemoMode,
  upsertAlertSubscription,
  validateAlertInput,
} from "@/lib/offer-alerts";

async function postSubscribe(request: Request, store: AlertSubscriptionStore = prisma) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = validateAlertInput(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const now = new Date();
  const verificationToken = randomBytes(32).toString("hex");
  try {
    await upsertAlertSubscription(store, validation.value, now, verificationToken);

    const demoMode = isAlertsDemoMode();
    const responseBody: {
      ok: true;
      message: string;
      mockVerificationUrl?: string;
    } = {
      ok: true,
      message: demoMode
        ? "Subscription saved. No email was sent. Use the mock verification link provided for this demo to activate alerts."
        : "Subscription saved. No email was sent because email delivery is not configured; alerts remain pending verification.",
    };

    if (demoMode) {
      const verificationUrl = new URL(`/api/alerts/verify?token=${encodeURIComponent(verificationToken)}`, request.url).toString();
      responseBody.mockVerificationUrl = verificationUrl;
      console.info(`[alerts] mock verification URL: ${verificationUrl}`);
    }

    return NextResponse.json(responseBody, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Alert subscriptions require the Section 12.8 database migration" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  return postSubscribe(request, prisma);
}
