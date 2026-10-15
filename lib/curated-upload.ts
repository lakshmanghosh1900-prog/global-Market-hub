import { addMerchantAffiliateTracking } from "@/lib/affiliate";
import { prisma } from "@/lib/db";
import { taxonomy } from "@/data/catalog";

const requiredColumns = ["title", "brand", "price", "mrp", "image_url", "merchant", "affiliate_url", "gtin", "category_slug", "bracket"] as const;
const validCategories = new Set(taxonomy.map((term) => term.slug));

export type CuratedRow = Record<(typeof requiredColumns)[number], string>;

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { row.push(cell.trim()); cell = ""; continue; }
    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = ""; continue;
    }
    cell += character;
  }
  if (cell || row.length) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); }
  if (!rows.length) throw new Error("CSV is empty");
  const headers = rows.shift()?.map((header) => header.trim().toLowerCase()) ?? [];
  const missing = requiredColumns.filter((column) => !headers.includes(column));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}`);
  return rows.map((values) => Object.fromEntries(requiredColumns.map((column) => [column, values[headers.indexOf(column)] ?? ""])) as CuratedRow);
}

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);

export async function importCuratedCsv(text: string) {
  if (text.length > 5_000_000) throw new Error("CSV is larger than the 5 MB upload limit");
  const rows = parseCsv(text);
  if (rows.length > 2_000) throw new Error("CSV is limited to 2,000 rows per upload");
  let imported = 0;
  const errors: string[] = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + 2;
    const price = Number(row.price.replace(/[^0-9.]/g, ""));
    const mrp = row.mrp ? Number(row.mrp.replace(/[^0-9.]/g, "")) : null;
    const bracketMax = row.bracket.match(/^under-(\d+)$/)?.[1];
    if (!row.title || !row.merchant || !Number.isFinite(price) || price <= 0 || (mrp !== null && (!Number.isFinite(mrp) || mrp < price)) || !validCategories.has(row.category_slug) || !bracketMax) {
      errors.push(`Row ${rowNumber}: title, price/mrp, category_slug and bracket are invalid`); continue;
    }
    try {
      const affiliateUrl = addMerchantAffiliateTracking(row.affiliate_url, row.merchant);
      const sku = `curated-${slugify(row.merchant)}-${row.gtin || slugify(`${row.title}-${row.image_url}`)}`;
      const baseSlug = slugify(`${row.title}-${row.gtin || sku}`) || sku;
      const existing = await prisma.product.findUnique({ where: { merchant_sku: { merchant: row.merchant, sku } }, select: { id: true, slug: true } });
      const slug = existing?.slug ?? `${baseSlug}-${slugify(row.merchant)}`;
      await prisma.product.upsert({
        where: { merchant_sku: { merchant: row.merchant, sku } },
        create: { sku, slug, title: row.title, price, mrp, brand: row.brand || null, image: row.image_url || null, gallery: row.image_url ? [row.image_url] : [], description: null, gtin: row.gtin || null, affiliateUrl, merchant: row.merchant, category: row.category_slug, source: "curated", isFixture: false, inStock: true, lastSync: new Date() },
        update: { title: row.title, price, mrp, brand: row.brand || null, image: row.image_url || null, gallery: row.image_url ? [row.image_url] : [], gtin: row.gtin || null, affiliateUrl, category: row.category_slug, source: "curated", isFixture: false, inStock: true, isDelisted: false, missingRuns: 0, oosSince: null, lastSync: new Date() },
      });
      imported += 1;
    } catch (error) {
      errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : "database import failed"}`);
    }
  }
  return { imported, rejected: errors.length, errors };
}
