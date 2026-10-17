import { NextResponse } from "next/server";
import { getCommerceIdentity, setGuestCookie } from "@/lib/commerce-auth";
import { prisma } from "@/lib/db";
import { isValidTargetPrice } from "@/lib/price-alerts";

function ownerWhere(userId: string | null, sessionId: string) {
  return userId ? { OR: [{ userId }, { sessionId }] } : { sessionId };
}

export async function GET() {
  const identity = await getCommerceIdentity();
  try {
    const alerts = await prisma.priceAlert.findMany({ where: ownerWhere(identity.userId, identity.sessionId), include: { product: true }, orderBy: { createdAt: "desc" } });
    const response = NextResponse.json({ alerts });
    if (identity.needsCookie) setGuestCookie(response, identity.sessionId);
    return response;
  } catch {
    return NextResponse.json({ alerts: [], mode: "local" });
  }
}

export async function POST(request: Request) {
  const identity = await getCommerceIdentity();
  let body: { productId?: string; targetPrice?: number; email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.productId || !isValidTargetPrice(body.targetPrice) ||
      (body.email && !/^\S+@\S+\.\S+$/.test(body.email))) {
    return NextResponse.json({ error: "A product, target price, and optional valid email are required" }, { status: 400 });
  }

  try {
    const targetPrice = body.targetPrice as number;
    const product = await prisma.product.findUnique({ where: { id: body.productId }, select: { id: true, isFixture: true, isDelisted: true } });
    if (!product || product.isFixture || product.isDelisted) return NextResponse.json({ error: "Price alerts are unavailable for this product" }, { status: 409 });
    const alert = await prisma.priceAlert.upsert({
      where: { sessionId_productId_targetPrice: { sessionId: identity.sessionId, productId: body.productId, targetPrice } },
      create: { sessionId: identity.sessionId, userId: identity.userId, productId: body.productId, targetPrice, email: body.email?.trim().toLowerCase() },
      update: { userId: identity.userId, active: true, email: body.email?.trim().toLowerCase() },
    });
    const response = NextResponse.json({ id: alert.id, active: alert.active }, { status: 201 });
    if (identity.needsCookie) setGuestCookie(response, identity.sessionId);
    return response;
  } catch {
    return NextResponse.json({ error: "Price alerts require a configured database" }, { status: 503 });
  }
}
