import { prisma } from "@/lib/db";

export type SyncProduct = {
  sku: string;
  slug: string;
  title: string;
  price: number;
  mrp: number | null;
  brand: string | null;
  image: string | null;
  gallery: string[];
  description: string | null;
  gtin: string | null;
  affiliateUrl: string;
  merchant: string;
  inStock: boolean;
  category: string;
  isFixture?: boolean;
};

const OOS_RETENTION_DAYS = 7;
const DELIST_AFTER_MISSING_RUNS = 3;

export const normalizedTitle = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const titleSimilarity = (left: string, right: string) => {
  const a = normalizedTitle(left);
  const b = normalizedTitle(right);
  if (a === b) return 1;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= b.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(previous[column] + 1, previous[column - 1] + 1, diagonal + (a[row - 1] === b[column - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length, 1);
};

export const isPastOosRetention = (oosSince: Date | null, now: Date) =>
  Boolean(
    oosSince &&
      now.getTime() - oosSince.getTime() >=
        OOS_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

export const shouldDelistMissingRuns = (missingRuns: number) => missingRuns >= DELIST_AFTER_MISSING_RUNS;

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
  if (products.length === 0) {
    throw new Error("Refusing to apply an empty catalog sync");
  }

  const now = new Date();
  const seenSkus = new Set<string>();

  for (const product of products) {
    seenSkus.add(product.sku);
    let existing = await prisma.product.findUnique({
      where: {
        merchant_sku: {
          merchant: product.merchant,
          sku: product.sku,
        },
      },
    });

    if (!existing && product.gtin) {
      existing = await prisma.product.findFirst({
        where: { merchant: product.merchant, gtin: product.gtin },
      });
    }

    if (!existing) {
      const titleCandidates = await prisma.product.findMany({
        where: { category: product.category },
        take: 100,
      });
      const titleMatch = titleCandidates.find((candidate) =>
        (!product.brand || !candidate.brand || normalizedTitle(product.brand) === normalizedTitle(candidate.brand)) &&
        titleSimilarity(product.title, candidate.title) >= 0.9,
      ) ?? null;
      if (titleMatch?.merchant === product.merchant) existing = titleMatch;
      if (titleMatch && titleMatch.merchant !== product.merchant) {
        await prisma.product.update({ where: { id: titleMatch.id }, data: { duplicateReview: true } });
      }
    }
    if (existing) seenSkus.add(existing.sku);

    const oosSince = product.inStock
      ? null
      : existing?.oosSince ?? now;
    const isDelisted = product.inStock
      ? false
      : existing?.isDelisted || isPastOosRetention(oosSince, now);

    const data = {
        ...product,
        source,
        isFixture: product.isFixture ?? false,
        oosSince,
        isDelisted,
        duplicateReview: existing?.duplicateReview ?? false,
        missingRuns: 0,
        lastSync: now,
      };

    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
    } else {
      await prisma.product.create({ data });
    }
  }

  const existingProducts = await prisma.product.findMany({
    where: { merchant: products[0]?.merchant ?? "Flipkart", source },
    select: { id: true, sku: true, missingRuns: true, oosSince: true },
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
        inStock: false,
        oosSince: product.oosSince ?? now,
        isDelisted: shouldDelistMissingRuns(missingRuns),
      },
    });
  }

  return {
    upserted: products.length,
    missingChecked: existingProducts.filter((product) => !seenSkus.has(product.sku)).length,
  };
}
