import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sessionId?: string; productId?: string; targetPrice?: number };
    if (!body.sessionId || !body.productId) return NextResponse.json({ error: "sessionId and productId are required" }, { status: 400 });
    const item = await prisma.wishlistItem.upsert({
      where: { sessionId_productId: { sessionId: body.sessionId, productId: body.productId } },
      create: { sessionId: body.sessionId, productId: body.productId, targetPrice: body.targetPrice },
      update: { targetPrice: body.targetPrice },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Wishlist persistence is unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const productId = url.searchParams.get("productId");
  if (!sessionId || !productId) return NextResponse.json({ error: "sessionId and productId are required" }, { status: 400 });
  try {
    await prisma.wishlistItem.delete({ where: { sessionId_productId: { sessionId, productId } } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
