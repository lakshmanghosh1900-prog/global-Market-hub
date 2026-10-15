import { NextResponse } from "next/server";
import { getCommerceIdentity, setGuestCookie } from "@/lib/commerce-auth";
import { prisma } from "@/lib/db";

function ownerWhere(userId: string | null, sessionId: string) {
  return userId ? { OR: [{ userId }, { sessionId }] } : { sessionId };
}

export async function GET() {
  const identity = await getCommerceIdentity();
  try {
    const items = await prisma.wishlistItem.findMany({ where: ownerWhere(identity.userId, identity.sessionId), include: { product: true }, orderBy: { addedAt: "desc" } });
    const response = NextResponse.json({ items });
    if (identity.needsCookie) setGuestCookie(response, identity.sessionId);
    return response;
  } catch {
    return NextResponse.json({ items: [], mode: "local" });
  }
}

export async function POST(request: Request) {
  const identity = await getCommerceIdentity();
  let body: { productId?: string; targetPrice?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });
  try {
    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product || product.isDelisted) return NextResponse.json({ error: "Product is unavailable" }, { status: 409 });
    const item = await prisma.wishlistItem.upsert({
      where: { sessionId_productId: { sessionId: identity.sessionId, productId: product.id } },
      create: { sessionId: identity.sessionId, userId: identity.userId, productId: product.id, targetPrice: body.targetPrice && body.targetPrice > 0 ? body.targetPrice : null },
      update: { userId: identity.userId, targetPrice: body.targetPrice && body.targetPrice > 0 ? body.targetPrice : undefined },
    });
    const response = NextResponse.json({ item }, { status: 201 });
    if (identity.needsCookie) setGuestCookie(response, identity.sessionId);
    return response;
  } catch {
    return NextResponse.json({ error: "Wishlist persistence is unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const identity = await getCommerceIdentity();
  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });
  try {
    await prisma.wishlistItem.deleteMany({ where: { ...ownerWhere(identity.userId, identity.sessionId), productId } });
  } catch {
    // Local state remains authoritative when the optional database is unavailable.
  }
  return NextResponse.json({ ok: true });
}
