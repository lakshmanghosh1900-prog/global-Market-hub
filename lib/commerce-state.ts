import { prisma } from "@/lib/db";

export async function readCommerceState(userId: string | null, sessionId: string) {
  const ownerFilter = userId ? { OR: [{ userId }, { sessionId }] } : { sessionId };
  const [cartItems, wishlistItems, alerts] = await Promise.all([
    prisma.cartItem.findMany({ where: ownerFilter, include: { product: true }, orderBy: { addedAt: "desc" } }),
    prisma.wishlistItem.findMany({ where: ownerFilter, include: { product: true }, orderBy: { addedAt: "desc" } }),
    prisma.priceAlert.findMany({ where: ownerFilter, include: { product: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return {
    cart: cartItems.map((item) => ({
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
      addedPrice: Number(item.priceAtAdd),
      quantity: item.quantity,
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
