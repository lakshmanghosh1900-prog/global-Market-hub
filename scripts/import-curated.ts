import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const csv = await readFile("data/amazon-curated.csv", "utf8");
  const [header, ...rows] = csv.trim().split(/\r?\n/);
  const keys = header.split(",");
  for (const row of rows) {
    const values = row.split(",");
    const record = Object.fromEntries(keys.map((key, index) => [key, values[index] ?? ""]));
    await prisma.product.upsert({
      where: { merchant_sku: { merchant: "Amazon-curated", sku: record.sku } },
      create: { sku: record.sku, slug: slugify(`${record.title}-${record.sku}`), title: record.title, price: Number(record.price), mrp: Number(record.mrp), brand: record.brand, image: record.image, gallery: [record.image], affiliateUrl: record.affiliateUrl, merchant: "Amazon-curated", category: record.category, source: "amazon_curated" },
      update: { title: record.title, price: Number(record.price), mrp: Number(record.mrp), image: record.image, gallery: [record.image], affiliateUrl: record.affiliateUrl, lastSync: new Date() },
    });
  }
}

main().then(() => console.log("Amazon curated CSV imported.")).catch((error) => { console.error(error); process.exitCode = 1; });
