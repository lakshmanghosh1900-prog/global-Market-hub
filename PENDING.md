# PENDING - External activation and verification checklist

The code-level marketplace, search, taxonomy, country preview, saved comparison, structured help, secure redirect, SEO, and alert-consent flows are implemented. The items below require external accounts, infrastructure, or legal decisions and cannot be honestly completed from this workspace.

## Live activation blockers

1. [ ] **Flipkart Affiliate:** provide the tracking ID (`affid`) and API token from `affiliate.flipkart.net`.
2. [ ] **Amazon Associates India:** verify Creators API access and account conditions. Keep curated mode until verified.
3. [ ] **Cuelinks:** verify account/API access and the current deals/link endpoint contract. Do not assume a product feed.
4. [ ] **Database:** provide a reachable PostgreSQL deployment and run the migrations plus idempotent catalog seed.
5. [ ] **Domain + Hosting:** configure the production domain, `NEXT_PUBLIC_BASE_URL`, Vercel project and cron secret.
6. [ ] **Brand/Legal:** provide the legal entity, grievance officer name/email/address and public compliance copy.
7. [ ] **Alert delivery:** configure and verify a compliant email sender/provider and WhatsApp provider before enabling delivery.

## Completed code follow-ups

- [x] Global `/` and India `/in` homepages replace the old direct Under ₹49 redirect.
- [x] Country registry exposes India as active and 37 markets as coming soon; inactive markets never fall through to Indian inventory.
- [x] Complete category directory, canonical aliases, URL-backed search filters, sorting and pagination are implemented.
- [x] Affiliate wishlist cart uses `global_market_cart`, 30-day cleanup, 50-item cap, keyboard-close behavior and blocked fixture CTAs.
- [x] Product pages use image fallbacks and server-authoritative, short-lived merchant redirect tokens.
- [x] Alert subscriptions use explicit consent and tokenized, single-use unsubscribe authorization.
- [x] Root sitemap has one authoritative Next metadata generator; localized sitemaps exclude fixtures and inactive markets.
- [x] Vercel cron routes are protected by `CRON_SECRET`.
- [x] Production HMAC fallback was removed; missing/placeholder HMAC fails closed.
- [x] Amazon and Cuelinks remain honest curated/deals-only modes.
- [ ] Run `npm run prisma:migrate:deploy` and `npm run seed:catalog` against the configured PostgreSQL database. This workspace currently has no reachable PostgreSQL server at `localhost:5432`.
- [ ] Run a controlled real Flipkart ingestion only after credentials and database are configured.
- [ ] Replace local fixture preview data with real verified inventory in production.

## Registry policy

The country registry contains 38 countries, with India active and all other countries marked coming soon. The merchant registry contains 20 merchants, but only Flipkart is configured for a real catalog connector. Amazon is curated CSV mode, Cuelinks is deals/link mode, and the remaining merchants are pending.

Use the current Prisma field names if an operator needs to inspect merchant metadata:

```sql
UPDATE "Merchant" SET "catalogSource"='curated', "active"=false WHERE "slug" != 'flipkart';
UPDATE "Merchant" SET "catalogSource"='flipkart_api', "active"=true WHERE "slug"='flipkart';
```
