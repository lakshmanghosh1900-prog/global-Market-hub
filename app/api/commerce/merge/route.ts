import { NextResponse } from "next/server";
import { getCommerceIdentity, setGuestCookie } from "@/lib/commerce-auth";
import { freshnessFor, getOrCreateActiveCart, MAX_CART_ITEMS, merchantIdFor } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { readCommerceState } from "@/lib/commerce-state";

type MergeBody = {
  cart?: Array<{ productId?: string; id?: string }>;
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
      const cartIds = Array.from(new Set((body.cart ?? []).map((item) => item.productId ?? item.id).filter((id): id is string => Boolean(id)))).slice(0, MAX_CART_ITEMS);
      const wishlistIds = (body.wishlist ?? []).map((item) => item.productId ?? item.id).filter((id): id is string => Boolean(id));
      const products = await tx.product.findMany({ where: { id: { in: Array.from(new Set([...cartIds, ...wishlistIds])) }, isDelisted: false, isFixture: false } });
      const productById = new Map(products.map((product) => [product.id, product]));

      const canonicalCart = await getOrCreateActiveCart(tx, identity.userId, identity.sessionId);
      let cartCount = await tx.cartItem.count({ where: { cartId: canonicalCart.id } });

      for (const productId of cartIds) {
        const product = productById.get(productId);
        if (!product) continue;
        const existing = await tx.cartItem.findUnique({ where: { cartId_productId: { cartId: canonicalCart.id, productId: product.id } } });
        if (existing) continue;
        if (cartCount >= MAX_CART_ITEMS) break;
        await tx.cartItem.create({
          data: {
            cartId: canonicalCart.id,
            productId: product.id,
            slug: product.slug,
            merchantId: merchantIdFor(product.merchant),
            title: product.title,
            price: product.price,
            currency: "INR",
            imageUrl: product.image ?? "",
            merchantName: product.merchant,
            deepLink: product.affiliateUrl,
            freshness: freshnessFor(product.inStock, product.lastSync),
            inStock: product.inStock,
          },
        });
        cartCount += 1;
      }

      const guestCart = await tx.cart.findFirst({
        where: { anonymousId: identity.sessionId, id: { not: canonicalCart.id }, expiresAt: { gt: new Date() } },
        include: { items: true },
      });
      if (guestCart) {
        for (const item of guestCart.items) {
          const existing = await tx.cartItem.findUnique({ where: { cartId_productId: { cartId: canonicalCart.id, productId: item.productId } } });
          if (existing || cartCount >= MAX_CART_ITEMS) continue;
          await tx.cartItem.create({
            data: {
              cartId: canonicalCart.id,
              productId: item.productId,
              slug: item.slug,
              merchantId: item.merchantId,
              title: item.title,
              price: item.price,
              currency: item.currency,
              imageUrl: item.imageUrl,
              merchantName: item.merchantName,
              deepLink: item.deepLink,
              freshness: item.freshness,
              inStock: item.inStock,
              createdAt: item.createdAt,
            },
          });
          cartCount += 1;
        }
        await tx.cart.delete({ where: { id: guestCart.id } });
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

      const [guestWishlist, userWishlist] = await Promise.all([
        tx.wishlistItem.findMany({ where: { sessionId: identity.sessionId } }),
        tx.wishlistItem.findMany({ where: { userId: identity.userId } }),
      ]);
      const userWishlistByProduct = new Map(userWishlist.map((item) => [item.productId, item]));
      for (const guestItem of guestWishlist) {
        const userItem = userWishlistByProduct.get(guestItem.productId);
        if (userItem && userItem.id !== guestItem.id) await tx.wishlistItem.delete({ where: { id: userItem.id } });
        await tx.wishlistItem.update({ where: { id: guestItem.id }, data: { userId: identity.userId } });
      }
    });

    const state = await readCommerceState(identity.userId, identity.sessionId);
    const response = NextResponse.json({ ...state, authenticated: true, email: identity.user?.email ?? null });
    if (identity.needsCookie) setGuestCookie(response, identity.sessionId);
    return response;
  } catch {
    return NextResponse.json({ error: "Commerce merge requires the Section 12.7 database migration" }, { status: 503 });
  }
}
