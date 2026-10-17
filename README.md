# Global Market Hub - Affiliate Discovery Marketplace

Global Market Hub is a global-market discovery and price-comparison platform with an India-first active market. Visitors browse products, compare available context, save products for review, and continue to a validated merchant product page.

## Product model

Global Market Hub is an affiliate discovery platform, not a seller or payment checkout. Payment, delivery, returns, order support, stock and final checkout remain with the merchant. Some merchant links may include affiliate tracking at no additional cost to the visitor.

India is the only active market until another country has a verified local catalog and approved merchant destinations. The other 37 registry countries are visible as coming-soon previews and are never redirected to Indian offers.

## Architecture

- **Frontend:** Next.js 14.2.35 App Router, React 18, TypeScript
- **DB:** PostgreSQL + Prisma 5.22 with additive migrations
- **Jobs:** Vercel Cron with durable Prisma ingest-run status; BullMQ/Redis remains a future scale-out option
- **Connectors:** Cuelinks V3 campaigns/offers/link conversion; Flipkart real catalog connector when direct credentials exist; Amazon validated curated CSV mode
- **Runtime:** Node `20.11.1` from `.nvmrc`; npm and `package-lock.json`

## Quick start

1. Use Node `20.11.1` from `.nvmrc`.
2. Copy `.env.example` to `.env.local` for Next.js and copy/fill `.env` for Prisma CLI commands. Never commit either file.
3. Start PostgreSQL with your approved local or hosted setup.
4. Run `npm ci && npm run prisma:generate && npm run prisma:migrate:deploy && npm run seed:catalog`.
5. Run `npm run dev` and open `http://localhost:3000`.
6. When verified Flipkart credentials are configured, trigger `npm run sync:flipkart`.

Without a reachable database, or when the reachable database has no active product records yet, development mode renders clearly labelled local fixture cards for interface review. Fixtures cannot be saved as live offers or open seller clickouts. Production mode fails closed to honest empty states instead of presenting fixtures as inventory.

## Main routes

- `/` - global homepage with search, taxonomy, markets, price ranges and merchant modes
- `/in` - India marketplace homepage
- `/in/categories` - complete discoverable taxonomy directory
- `/in/search` - URL-backed search, category, price, merchant, freshness, sort and pagination filters
- `/in/deals` - Cuelinks campaigns/offers as a dedicated deals surface, never as fabricated product inventory
- `/in/under/under-49` - price-bracket listing
- `/in/c/electronics` - category listing example
- `/in/product/test-slug` - local preview PDP; live products use validated database records
- `/in/wishlist` - anonymous wishlist, saved comparison context and price-alert preferences
- `/in/login` and `/in/account` - Supabase email OTP and commerce merge flow
- `/admin/curated-upload` - `ADMIN_SECRET`-protected Amazon/Cuelinks CSV import
- `/admin/clicks` - `ADMIN_SECRET`-protected click dashboard
- `/sitemap.xml`, `/in/sitemap.xml`, `/robots.txt` - SEO routes
- `/api/cron/ingest` - Vercel six-hour ingest route protected by `CRON_SECRET`
- `/api/v1/ingest/status` - latest feed fetch, product count and expired-feed status

## Catalog and clickout safety

The catalog seed is idempotent and updates registry metadata without deleting products, click records or migration history. Flipkart feed URLs are refetched on every sync because provider links expire. Cuelinks uses the documented V3 base URL and `Authorization: Token ...` contract for campaigns, offers and `POST /links/convert`. Cuelinks campaigns/offers are stored separately from products. The current account's product-feed access is **not verified**; no Cuelinks campaign or coupon is promoted into a product record. Amazon remains curated until access is verified.

Product seller actions are server-authoritative: the browser submits a product ID, the server loads the live product, validates its exact HTTPS merchant URL and signs a short-lived redirect. Cuelinks-managed products call the official link-conversion endpoint and require `affiliated: true` before redirecting. Fixture products, invalid URLs, unavailable products, generic merchant homepages and missing/placeholder HMAC configuration cannot produce an outbound clickout.

The cart is a saved comparison surface, not checkout. Anonymous saves use `global_market_cart`, expire after 30 days, and cap at 50 unique products. Alert subscriptions record explicit consent and use tokenized, single-use unsubscribe authorization. Actual email/WhatsApp delivery remains disabled until compliant providers and sender configuration are available.

## Checks

```text
npm run prisma:generate
npm exec -- prisma validate
npm exec -- prisma migrate status
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` is the single offline-capable application test command. The current unit suite contains 35 tests. The owner-side Windows development database has verified migration 7 and catalog metadata seeding; this Linux agent cannot access that Windows `localhost:5432` instance. Production migration/seed still require the production database. No reset or destructive database command is part of setup.

The repository has a pull-request quality gate at `.github/workflows/pr-quality.yml`. It installs the lockfile, generates and validates Prisma, runs typecheck/lint/tests and builds without live database or provider credentials. `npm audit --omit=dev` currently reports one critical and one high production dependency finding; review that before production deployment rather than forcing a breaking upgrade.

## Deployment

Configure the variables in `.env.example`, including a production `NEXT_PUBLIC_BASE_URL`, `CRON_SECRET`, a long non-placeholder `HMAC_SECRET`, exact `AFFILIATE_ALLOWED_HOSTS`, database URL, legal values and Supabase settings. Deploy in this order:

```text
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run seed:catalog
npm run build
```

`vercel.json` schedules the six-hour ingest, hourly price check, twelve-hour Cuelinks deals check, daily delist, daily category health check and daily expired-cart cleanup. See `docs/PRODUCTION_CHECKLIST.md` for controlled first ingestion and provider activation.

## Documentation

- `BLUEPRINT.md` - canonical product and architecture blueprint
- `PENDING.md` - external activation blockers and completed code follow-ups
- `docs/section-11-connectors.md` - connector and upsert rules
- `docs/section-12-frontend.md` - frontend, PDP and SEO behavior
- `docs/PRODUCTION_CHECKLIST.md` - deployment and live-ingestion procedure
- `docs/VERIFICATION_REPORT.md` - current evidence and known environment blockers
- `.github/workflows/pr-quality.yml` - pull-request quality gate using locked dependencies and no live database/provider secrets
