import { NextResponse } from "next/server";
import { getCommerceIdentity, setGuestCookie } from "@/lib/commerce-auth";
import { findActiveCart, getOrCreateActiveCart, MAX_CART_ITEMS, merchantIdFor, freshnessFor } from "@/lib/cart";
import { prisma } from "@/lib/db";

type CartBody = { productId?: string; quantity?: number };

export async function POST(request: Request) {
  const identity = await getCommerceIdentity();
  let body: CartBody;
  try {
    body = (await request.json()) as CartBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.productId || (body.quantity !== undefined && (!Number.isFinite(body.quantity) || body.quantity < 1))) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product || product.isDelisted) return NextResponse.json({ error: "Product is unavailable" }, { status: 409 });

    const cart = await getOrCreateActiveCart(prisma, identity.userId, identity.sessionId);
    const existing = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId: product.id } } });
    if (!existing) {
      const itemCount = await prisma.cartItem.count({ where: { cartId: cart.id } });
      if (itemCount >= MAX_CART_ITEMS) {
        return NextResponse.json({ error: "Your saved cart is full", code: "CART_LIMIT", maxItems: MAX_CART_ITEMS }, { status: 409 });
      }
    }

    const item = existing
      ? await prisma.cartItem.update({
          where: { id: existing.id },
          data: {
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
        })
      : await prisma.cartItem.create({
          data: {
            cartId: cart.id,
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

    const response = NextResponse.json({ id: item.id, productId: item.productId, count: await prisma.cartItem.count({ where: { cartId: cart.id } }) });
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
  try {
    const cart = await findActiveCart(prisma, identity.userId, identity.sessionId);
    if (cart) {
      if (productId) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
      } else {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    }
    const response = NextResponse.json({ ok: true });
    if (identity.needsCookie) setGuestCookie(response, identity.sessionId);
    return response;
  } catch {
    return NextResponse.json({ ok: true });
  }
}
