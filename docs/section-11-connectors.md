# Section 11: Connectors, Upsert, Dedup, Schedules

## 11.1 Flipkart Connector (FIRST - Real Catalog)
- Base: https://affiliate-api.flipkart.net/aff/api
- Auth: Fk-Affiliate-Id + Fk-Affiliate-Token headers
- Feed links expire after 10 hours -> refetch feed list on every run
- Endpoints: /feed/affiliate/category, /product, /changes?since=
- Change feed polling: BullMQ job every 6h
- Tracking injection: Append ?affid=YOUR_ID to productUrl
- Price in INR, MRP, discount, inStock flag

```ts
// pseudocode
async function fetchFlipkartFeeds() {
  const feeds = await flipkartApi.listFeeds(); // refetch every run
  for (const feed of feeds) {
    const products = await fetch(feed.url);
    await sharedUpsert(products, { source: 'flipkart' });
  }
}
```

## 11.2 Amazon Connector (Curated until Creators API Access)
- PA-API 5.0 deprecated -> 403. Using Creators API.
- Creators API returns only featured offer, no shipping cost, no reviews.
- Access condition unverified: 10 qualifying sales in last 30 days per third-party write-up. TODO verify on Amazon dashboard.
- Until access: Use curated listings table `curated_products` with manual CSV.

## 11.3 Cuelinks Connector (No Product Feed)
- Help center confirms: no product feeds, only campaigns, deals, transactions, links.
- That means 18/20 merchants have no automatic catalog yet.
- V3 endpoints are placeholders - make configurable:
  - CUELINKS_ENDPOINT_CAMPAIGNS, DEALS, LINKS, TRANSACTIONS
- Four options documented:
  1. Network feeds (if merchant provides via other network)
  2. Curated CSV import (admin UI / script)
  3. Deals-only merchant pages (show only Cuelinks deals)
  4. No scraping (strictly compliant)
- Implement deals-only page as fallback.

## 11.4 Shared Upsert with Out-of-Stock and Delist Rules
```ts
async function sharedUpsert(products, {source}) {
  for (const p of products) {
    const existing = await db.product.findUnique({ where: { source_sku: p.sku } });
    if (p.inStock === false) {
      // keep 7 days as OOS, then hide
      await db.product.update({ where: {id: existing.id}, data: { inStock: false, oosSince: now() }});
      continue;
    }
    // GTIN dedup
    if (p.gtin) { /* find by gtin */ }
    // Title dedup: normalized title + brand
    // Upsert
  }
}
// Delist rule: If product not seen in 3 consecutive feed runs, delist
```

## 11.5 Category Mapper
Flipkart category -> internal category: electronics, fashion, home, under-49, under-99 etc.
Map via `category_map.json`

## 11.6 GTIN and Title-based Dedup
- GTIN: if gtin exists and matches across sources, merge, keep cheapest offer + merchant list
- Title: normalize (lowercase, remove special, brand first), Levenshtein < 10% -> potential dupe flagged for review

## 11.7 BullMQ Schedules
- flipkart-sync: every 6h
- cuelinks-deals-sync: every 12h
- delist-check: daily
- category-reindex: daily

## 11.8 Tests and First-Run Procedure
- Test: flipkart feed refetch after 10h expiry (mock expired link -> should refetch list)
- Test: upsert OOS handling
- Test: dedup
- First-run: `npx prisma migrate`, seed merchants, run `npm run sync:flipkart -- --full`, verify /in/under/under-49 shows products
