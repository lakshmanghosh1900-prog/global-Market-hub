import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  let body: { sessionId?: string; productId?: string; targetPrice?: number; email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sessionId || !body.productId || typeof body.targetPrice !== "number" || body.targetPrice <= 0 ||
      (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))) {
    return NextResponse.json({ error: "A valid session, product, target price, and optional email are required" }, { status: 400 });
  }

  try {
    const alert = await prisma.priceAlert.upsert({
      where: { sessionId_productId_targetPrice: { sessionId: body.sessionId, productId: body.productId, targetPrice: body.targetPrice } },
      create: { sessionId: body.sessionId, productId: body.productId, targetPrice: body.targetPrice, email: body.email?.trim().toLowerCase() },
      update: { active: true, email: body.email?.trim().toLowerCase() },
    });
    return NextResponse.json({ id: alert.id, active: alert.active }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Price alerts require a configured database" }, { status: 503 });
  }
}
