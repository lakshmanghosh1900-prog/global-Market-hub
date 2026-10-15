import { prisma } from "@/lib/db";

export type SyncProduct = {
  sku: string;
  title: string;
  price: number;
  mrp: number | null;
  brand: string | null;
  image: string | null;
  affiliateUrl: string;
  merchant: string;
  inStock: boolean;
  category: string;
};

const OOS_RETENTION_DAYS = 7;
const DELIST_AFTER_MISSING_RUNS = 3;

const isPastOosRetention = (oosSince: Date | null, now: Date) =>
  Boolean(
    oosSince &&
      now.getTime() - oosSince.getTime() >=
        OOS_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

/**
 * Persist one feed run and apply the shared stock/delist policy.
 *
 * - OOS products remain in the database for seven days, then are delisted.
 * - Products absent from three consecutive runs are delisted.
 * - A product seen again is restored and its missing-run counter is reset.
 */
export async function sharedUpsert(
  products: SyncProduct[],
  { source }: { source: string },
) {
  const now = new Date();
  const seenSkus = new Set<string>();

  for (const product of products) {
    seenSkus.add(product.sku);
    const existing = await prisma.product.findUnique({
      where: {
        merchant_sku: {
          merchant: product.merchant,
          sku: product.sku,
        },
      },
    });

    const oosSince = product.inStock
      ? null
      : existing?.oosSince ?? now;
    const isDelisted = product.inStock
      ? false
      : existing?.isDelisted || isPastOosRetention(oosSince, now);

    await prisma.product.upsert({
      where: {
        merchant_sku: {
          merchant: product.merchant,
          sku: product.sku,
        },
      },
      create: {
        ...product,
        source,
        oosSince,
        isDelisted,
        missingRuns: 0,
        lastSync: now,
      },
      update: {
        ...product,
        source,
        oosSince,
        isDelisted,
        missingRuns: 0,
        lastSync: now,
      },
    });
  }

  const existingProducts = await prisma.product.findMany({
    where: { merchant: products[0]?.merchant ?? "Flipkart", source },
    select: { id: true, sku: true, missingRuns: true },
  });

  for (const product of existingProducts) {
    if (seenSkus.has(product.sku)) {
      continue;
    }

    const missingRuns = product.missingRuns + 1;
    await prisma.product.update({
      where: { id: product.id },
      data: {
        missingRuns,
        isDelisted: missingRuns >= DELIST_AFTER_MISSING_RUNS,
      },
    });
  }

  return {
    upserted: products.length,
    missingChecked: existingProducts.length - seenSkus.size,
  };
}
