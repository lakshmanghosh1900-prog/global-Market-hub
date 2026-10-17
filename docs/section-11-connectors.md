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

## 11.3 Cuelinks V3 Connector
- Official contract: `https://developers.cuelinks.com/pub_api/v3` with `Authorization: Token <CUELINKS_API_KEY>`.
- Campaign discovery uses `GET /campaigns` with documented pagination and access-status fields.
- Offers use `GET /offers`; coupon/deal records are stored in `CuelinksOffer` and are never converted into `Product` rows.
- Product/merchant conversion uses `POST /links/convert` and accepts a tracking URL only when the response has `affiliated: true`, a matching `original_url`, and an approved HTTPS tracking host.
- The sync uses bounded retries for transient errors, validates response records, preserves previous offers on empty/error responses, and reports safe status classifications.
- Cuelinks product-feed access remains a separate unknown capability until the publisher account confirms an authorized product feed. No scraping is used.
- `/in/deals` is the deals-only fallback; validated curated CSV remains the product fallback.

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
Flipkart category -> internal taxonomy category: electronics, fashion, home and the other canonical terms. Price brackets are calculated by listing filters and are never used as a substitute for a missing source category.
Map via `category_map.json`

## 11.6 GTIN and Title-based Dedup
- GTIN: if gtin exists and matches across sources, merge, keep cheapest offer + merchant list
- Title: normalize (lowercase, remove special, brand first), Levenshtein < 10% -> potential dupe flagged for review

## 11.7 BullMQ Schedules
- flipkart-sync: every 6h
- cuelinks-deals-sync: every 12h
- delist-check: daily
- category-health-check: daily
- expired-cart-cleanup: daily

## 11.8 Tests and First-Run Procedure
- Test: flipkart feed refetch after 10h expiry (mock expired link -> should refetch list)
- Test: upsert OOS handling
- Test: dedup
- First-run: `npm run prisma:migrate:deploy`, `npm run seed:catalog`, verify Cuelinks status, run the protected Cuelinks deals cron, then verify `/in/deals`. Run `npm run sync:flipkart` only when direct Flipkart credentials are configured.
