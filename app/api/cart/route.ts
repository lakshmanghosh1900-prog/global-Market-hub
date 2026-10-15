import { NextResponse } from "next/server";
import { getCommerceIdentity, setGuestCookie } from "@/lib/commerce-auth";
import { prisma } from "@/lib/db";

type CartBody = { productId?: string; quantity?: number };

function ownerWhere(userId: string | null, sessionId: string) {
  return userId ? { OR: [{ userId }, { sessionId }] } : { sessionId };
}

export async function POST(request: Request) {
  const identity = await getCommerceIdentity();
  let body: CartBody;
  try {
    body = (await request.json()) as CartBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.productId || !Number.isFinite(body.quantity) || (body.quantity ?? 0) < 1) return NextResponse.json({ error: "productId and a positive quantity are required" }, { status: 400 });

  try {
    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product || product.isDelisted || !product.inStock) return NextResponse.json({ error: "Product is unavailable" }, { status: 409 });
    const item = await prisma.cartItem.upsert({
      where: { sessionId_productId: { sessionId: identity.sessionId, productId: product.id } },
      create: { sessionId: identity.sessionId, userId: identity.userId, productId: product.id, merchant: product.merchant, affiliateUrl: product.affiliateUrl, priceAtAdd: product.price, quantity: Math.min(20, Math.floor(body.quantity as number)) },
      update: { userId: identity.userId, quantity: Math.min(20, Math.max(1, Math.floor(body.quantity as number))), priceAtAdd: product.price },
    });
    const response = NextResponse.json({ id: item.id, quantity: item.quantity });
    if (identity.needsCookie) setGuestCookie(response, identity.sessionId);
    return response;
  } catch {
    return NextResponse.json({ error: "Cart persistence is unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  const identity = await getCommerceIdentity();
  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });
  try {
    await prisma.cartItem.deleteMany({ where: { ...ownerWhere(identity.userId, identity.sessionId), productId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
