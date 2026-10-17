import assert from "node:assert/strict";
import test from "node:test";
import { importCuratedCsv, parseCsv } from "@/lib/curated-upload";

const header = "title,brand,price,mrp,image_url,merchant,affiliate_url,gtin,category_slug,bracket";

test("curated CSV parser preserves quoted commas", () => {
  const rows = parseCsv(`${header}\n"10% off, today",Brand,10,20,https://images.example/item.jpg,Amazon-curated,https://www.amazon.in/dp/B123,GTIN,electronics,under-49`);
  assert.equal(rows[0]?.title, "10% off, today");
});

test("curated import rejects generic homepages, invalid merchants, brackets and categories before database writes", async () => {
  const csv = `${header}\n"Placeholder product",Brand,10,20,https://images.example/item.jpg,Amazon-curated,https://www.amazon.in/,GTIN,under-49,under-49\n"Bad merchant",Brand,10,20,https://images.example/item.jpg,Unknown,https://www.amazon.in/dp/B123,GTIN,electronics,under-49\n"Bad category",Brand,10,20,https://images.example/item.jpg,Amazon-curated,https://www.amazon.in/dp/B123,GTIN,under-49,under-49`;
  const result = await importCuratedCsv(csv);
  assert.equal(result.imported, 0);
  assert.equal(result.rejected, 3);
});
