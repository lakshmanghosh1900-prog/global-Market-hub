import { prisma } from "@/lib/db";
import { canonicalCategories } from "@/lib/taxonomy";

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

export async function runCategoryHealthCheck() {
  const groups = await prisma.product.groupBy({
    by: ["category"],
    where: { isDelisted: false },
    _count: { _all: true },
  });
  const allowed = new Set(canonicalCategories.map((term) => term.slug));
  const unknown = groups.filter((group) => !allowed.has(group.category));
  return {
    productCount: groups.reduce((total, group) => total + group._count._all, 0),
    categoryCount: groups.length,
    unknownCategories: unknown.map((group) => ({ category: group.category, products: group._count._all })),
  };
}
