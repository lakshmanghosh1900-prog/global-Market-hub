import { prisma } from "@/lib/db";

export async function runDelistSweep() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return prisma.product.updateMany({
    where: {
      isDelisted: false,
      OR: [{ missingRuns: { gte: 3 } }, { inStock: false, oosSince: { lte: cutoff } }],
    },
    data: { isDelisted: true },
  });
}

export async function countCatalogProducts() {
  return prisma.product.count({ where: { isDelisted: false } });
}
