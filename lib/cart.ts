import type { Prisma, PrismaClient } from "@prisma/client";

export const CART_TTL_DAYS = 30;
export const MAX_CART_ITEMS = 50;

type CartDb = PrismaClient | Prisma.TransactionClient;

export const cartExpiry = (from = new Date()) =>
  new Date(from.getTime() + CART_TTL_DAYS * 24 * 60 * 60 * 1000);

export function cartOwnerWhere(userId: string | null, anonymousId: string) {
  return userId
    ? { OR: [{ userId }, { anonymousId }] }
    : { anonymousId };
}

export async function findActiveCart(
  db: CartDb,
  userId: string | null,
  anonymousId: string,
) {
  const now = new Date();
  const userCart = userId
    ? await db.cart.findFirst({ where: { userId, expiresAt: { gt: now } }, orderBy: { updatedAt: "desc" } })
    : null;
  if (userCart) return userCart;

  return db.cart.findFirst({
    where: { anonymousId, expiresAt: { gt: now } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getOrCreateActiveCart(
  db: CartDb,
  userId: string | null,
  anonymousId: string,
) {
  const existing = await findActiveCart(db, userId, anonymousId);
  if (existing) {
    if (userId && existing.userId !== userId) {
      return db.cart.update({ where: { id: existing.id }, data: { userId } });
    }
    return existing;
  }

  return db.cart.create({
    data: {
      userId,
      anonymousId,
      expiresAt: cartExpiry(),
    },
  });
}

export function merchantIdFor(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function freshnessFor(inStock: boolean, lastSync: Date) {
  const elapsedHours = Math.max(0, Math.floor((Date.now() - lastSync.getTime()) / 3_600_000));
  const updated = elapsedHours < 1 ? "updated just now" : elapsedHours < 24 ? `updated ${elapsedHours}h ago` : `updated ${Math.floor(elapsedHours / 24)}d ago`;
  return inStock ? `In stock · ${updated}` : `Currently unavailable · ${updated}`;
}
