import { prisma } from "@/lib/db";
import { cartOwnerWhere } from "@/lib/cart";

export async function readCommerceState(userId: string | null, sessionId: string) {
  const ownerFilter = userId ? { OR: [{ userId }, { sessionId }] } : { sessionId };
  const [carts, wishlistItems, alerts] = await Promise.all([
    prisma.cart.findMany({ where: { ...cartOwnerWhere(userId, sessionId), expiresAt: { gt: new Date() } }, include: { items: { orderBy: { createdAt: "desc" } } }, orderBy: { updatedAt: "desc" } }),
    prisma.wishlistItem.findMany({ where: ownerFilter, include: { product: true }, orderBy: { addedAt: "desc" } }),
    prisma.priceAlert.findMany({ where: ownerFilter, include: { product: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const cartItems = carts.flatMap((cart) => cart.items.map((item) => ({ item, expiresAt: cart.expiresAt })))
    .filter(({ item }, index, all) => all.findIndex((candidate) => candidate.item.productId === item.productId) === index);

  return {
    cart: cartItems.map(({ item, expiresAt }) => ({
      id: item.productId,
      productId: item.productId,
      slug: item.slug,
      title: item.title,
      price: Number(item.price),
      currency: item.currency,
      imageUrl: item.imageUrl,
      merchantId: item.merchantId,
      merchantName: item.merchantName,
      deepLink: item.deepLink,
      freshness: item.freshness,
      inStock: item.inStock,
      expiresAt: expiresAt.toISOString(),
      addedPrice: Number(item.price),
    })),
    wishlist: wishlistItems.map((item) => ({
      id: item.product.id,
      sku: item.product.sku,
      slug: item.product.slug,
      title: item.product.title,
      price: Number(item.product.price),
      mrp: item.product.mrp === null ? null : Number(item.product.mrp),
      brand: item.product.brand,
      image: item.product.image,
      gallery: item.product.gallery,
      description: item.product.description,
      gtin: item.product.gtin,
      affiliateUrl: item.product.affiliateUrl,
      merchant: item.product.merchant,
      inStock: item.product.inStock,
      lastSync: item.product.lastSync,
      category: item.product.category,
      addedPrice: Number(item.product.price),
      targetPrice: item.targetPrice === null ? undefined : Number(item.targetPrice),
    })),
    alerts: alerts.map((alert) => ({
      id: alert.id,
      productId: alert.productId,
      targetPrice: Number(alert.targetPrice),
      active: alert.active,
      triggeredAt: alert.triggeredAt,
      productTitle: alert.product.title,
    })),
  };
}
