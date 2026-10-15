import { NextResponse } from "next/server";
import { getCommerceIdentity, setGuestCookie } from "@/lib/commerce-auth";
import { prisma } from "@/lib/db";
import { readCommerceState } from "@/lib/commerce-state";

type MergeBody = {
  cart?: Array<{ productId?: string; id?: string; quantity?: number }>;
  wishlist?: Array<{ productId?: string; id?: string; targetPrice?: number }>;
};

export async function POST(request: Request) {
  const identity = await getCommerceIdentity();
  if (!identity.userId) return NextResponse.json({ error: "Sign in is required before merging commerce data" }, { status: 401 });

  let body: MergeBody = {};
  try {
    body = (await request.json()) as MergeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const cartIds = (body.cart ?? []).map((item) => item.productId ?? item.id).filter((id): id is string => Boolean(id));
      const wishlistIds = (body.wishlist ?? []).map((item) => item.productId ?? item.id).filter((id): id is string => Boolean(id));
      const products = await tx.product.findMany({ where: { id: { in: Array.from(new Set([...cartIds, ...wishlistIds])) }, isDelisted: false } });
      const productById = new Map(products.map((product) => [product.id, product]));

      for (const item of body.cart ?? []) {
        const productId = item.productId ?? item.id;
        const product = productId ? productById.get(productId) : null;
        if (!product) continue;
        const quantity = Math.min(20, Math.max(1, Math.floor(item.quantity ?? 1)));
        const existing = await tx.cartItem.findUnique({ where: { sessionId_productId: { sessionId: identity.sessionId, productId: product.id } } });
        if (existing) {
          await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: Math.min(20, existing.quantity + quantity), userId: identity.userId } });
        } else {
          await tx.cartItem.create({ data: { sessionId: identity.sessionId, userId: identity.userId, productId: product.id, merchant: product.merchant, affiliateUrl: product.affiliateUrl, priceAtAdd: product.price, quantity } });
        }
      }

      for (const item of body.wishlist ?? []) {
        const productId = item.productId ?? item.id;
        const product = productId ? productById.get(productId) : null;
        if (!product) continue;
        await tx.wishlistItem.upsert({
          where: { sessionId_productId: { sessionId: identity.sessionId, productId: product.id } },
          create: { sessionId: identity.sessionId, userId: identity.userId, productId: product.id, targetPrice: item.targetPrice && item.targetPrice > 0 ? item.targetPrice : null },
          update: { userId: identity.userId, targetPrice: item.targetPrice && item.targetPrice > 0 ? item.targetPrice : undefined },
        });
      }

      const [guestCart, userCart] = await Promise.all([
        tx.cartItem.findMany({ where: { sessionId: identity.sessionId } }),
        tx.cartItem.findMany({ where: { userId: identity.userId } }),
      ]);
      const userCartByProduct = new Map(userCart.map((item) => [item.productId, item]));
      for (const guestItem of guestCart) {
        const userItem = userCartByProduct.get(guestItem.productId);
        if (userItem && userItem.id !== guestItem.id) {
          await tx.cartItem.delete({ where: { id: userItem.id } });
          await tx.cartItem.update({ where: { id: guestItem.id }, data: { userId: identity.userId, quantity: Math.min(20, guestItem.quantity + userItem.quantity) } });
        } else {
          await tx.cartItem.update({ where: { id: guestItem.id }, data: { userId: identity.userId } });
        }
      }

      const [guestWishlist, userWishlist] = await Promise.all([
        tx.wishlistItem.findMany({ where: { sessionId: identity.sessionId } }),
        tx.wishlistItem.findMany({ where: { userId: identity.userId } }),
      ]);
      const userWishlistByProduct = new Map(userWishlist.map((item) => [item.productId, item]));
      for (const guestItem of guestWishlist) {
        const userItem = userWishlistByProduct.get(guestItem.productId);
        if (userItem && userItem.id !== guestItem.id) {
          await tx.wishlistItem.delete({ where: { id: userItem.id } });
        }
        await tx.wishlistItem.update({ where: { id: guestItem.id }, data: { userId: identity.userId } });
      }
    });

    const state = await readCommerceState(identity.userId, identity.sessionId);
    const response = NextResponse.json({ ...state, authenticated: true, email: identity.user?.email ?? null });
    if (identity.needsCookie) setGuestCookie(response, identity.sessionId);
    return response;
  } catch {
    return NextResponse.json({ error: "Commerce merge requires the production database migration" }, { status: 503 });
  }
}
