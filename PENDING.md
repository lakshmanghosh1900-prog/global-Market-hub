# PENDING - External activation and verification checklist

The code-level marketplace, search, taxonomy, country preview, saved comparison, structured help, secure redirect, SEO, and alert-consent flows are implemented. The items below require external accounts, infrastructure, or legal decisions and cannot be honestly completed from this workspace.

## Live activation blockers

1. [ ] **Cuelinks API key/scopes:** a local Cuelinks key is present but its required `read:campaigns`, `read:offers` and `write:links` scopes are not verified. Sanitized ping/campaign/offer attempts were blocked by provider network fetch failure; do not claim live access or run link conversion until connectivity and authorization are confirmed.
2. [ ] **Cuelinks product feed:** confirm separately whether the account has an authorized product catalog/feed. Current status is `PRODUCT_FEED_ACCESS_UNKNOWN`; campaigns/offers/link conversion do not prove product-feed access.
3. [ ] **Flipkart Affiliate:** direct tracking ID (`affid`) and API token remain optional for Cuelinks-managed flows and are still unavailable.
4. [ ] **Amazon Associates India:** verify Creators API access and account conditions. Keep curated mode until verified.
5. [x] **Windows development database:** owner-side Windows PostgreSQL is reachable, migration `00000000000007_cuelinks_offers_network` is applied, and catalog metadata seeding completed. The Linux agent cannot access that Windows `localhost:5432` instance.
6. [ ] **Production database and first ingestion:** provide the production PostgreSQL deployment, apply migrations and run the controlled idempotent catalog seed/ingestion.
7. [ ] **Domain + Hosting:** configure the production domain, `NEXT_PUBLIC_BASE_URL`, Vercel project and cron secret.
8. [ ] **Brand/Legal:** provide the legal entity, grievance officer name/email/address and public compliance copy.
9. [ ] **Alert delivery:** configure and verify a compliant email sender/provider and WhatsApp provider before enabling delivery.
10. [x] **Production dependency security:** upgraded Next.js to `15.5.28`, aligned `eslint-config-next` and the Windows SWC package, and pinned Next's compatible PostCSS dependency to `8.5.30`; `npm audit --omit=dev` reports zero production vulnerabilities. The full development audit still has five high findings confined to the ESLint toolchain path and is not a production dependency exposure.

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
- [x] Official Cuelinks V3 client uses the documented base URL, Token auth, paginated campaigns/offers and `POST /links/convert` with `affiliated` validation.
- [x] Cuelinks offers persist separately from products and render at `/{country}/deals` when a verified sync populates them.
- [x] Cuelinks-managed product redirects are server-authoritative and fail closed when conversion is not affiliated.
- [x] Daily category health check reports unknown live product categories without rewriting catalog data; daily expired-cart cleanup removes server carts after their TTL.
- [x] Owner-side Windows Prisma generation, migration status and catalog metadata seeding were verified after resolving the project-specific Prisma engine lock.
- [x] A PR quality gate is defined in `.github/workflows/pr-quality.yml` and does not require live provider credentials or a production database.
- [x] Development fixture fallback is limited to an empty/unavailable catalog in non-production; active real catalog results are never replaced by fixtures.
- [x] Next.js 14-to-15 async request APIs and static revalidation exports were migrated for the patched security release.
- [ ] Run `npm run prisma:migrate:deploy` and `npm run seed:catalog` against the production PostgreSQL database. The Linux agent cannot access the owner's Windows PostgreSQL instance.
- [ ] Run a controlled real Flipkart ingestion only after credentials and database are configured.
- [ ] Replace local fixture preview data with real verified inventory in production.

## Registry policy

The country registry contains 38 countries, with India active and all other countries marked coming soon. The merchant registry contains 20 merchants. Cuelinks is configured for official campaigns/offers/link conversion, but product-feed access remains unknown until the account is verified. Amazon is curated CSV mode, direct Flipkart ingestion remains credential-gated, and the remaining merchants are pending.

Use the current Prisma field names if an operator needs to inspect merchant metadata:

```sql
UPDATE "Merchant" SET "catalogSource"='curated', "active"=false WHERE "slug" != 'flipkart';
UPDATE "Merchant" SET "catalogSource"='flipkart_api', "active"=true WHERE "slug"='flipkart';
```
