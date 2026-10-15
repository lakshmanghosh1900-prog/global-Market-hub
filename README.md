# Global Market Hub - Hybrid Mega E-commerce Affiliate Hub

India-first affiliate hub for 20 merchants. Built for country routing, fresh deals, and compliant affiliate clickouts.

## Sprint 1 Goal (Flipkart Only)
`/in/under/under-49` -> real Flipkart products in INR -> clickout with `?affid=YOUR_TRACKING_ID`

## Architecture
- **Frontend:** Next.js 14 App Router, `/[country]/...` routing, ISR 1h
- **DB:** Postgres + Prisma
- **Queue:** BullMQ (Redis) for feed sync
- **Connectors:** Flipkart (real catalog), Amazon Creators API (curated until access), Cuelinks (campaigns/deals only)

## Quick Start
1. Copy `.env.example` to `.env.local` for Next.js and copy/fill `.env` for Prisma CLI commands
2. Fill Flipkart affiliate ID + token when API access is available; placeholders keep the UI in mock mode
3. `npm install && npm run prisma:generate && npx prisma migrate dev && npm run seed:catalog`
4. `npm run dev`
5. Trigger first sync: `npm run sync:flipkart`

With no Flipkart token configured, the listing intentionally renders six local mock products so the Sprint 1 UI can be reviewed before API onboarding.

## Global update routes
- `/in/under/under-49` - Flipkart listing with cart, wishlist, chatbot and merchant clickouts
- `/in/product/test-slug` - PDP, related products and JSON-LD example
- `/in/wishlist` - anonymous local wishlist and price-alert controls
- `/sitemap.xml`, `/in/sitemap.xml`, `/robots.txt` - SEO routes
- `/api/cron/ingest` - Vercel six-hour ingest route, protected by `CRON_SECRET`

The cart is an affiliate comparison cart. Checkout opens signed, allowlisted merchant redirects; Global Market Hub never collects payment. Amazon remains curated placeholder mode and Cuelinks remains deals-only until their catalog capabilities are verified.

## Checks
```text
npm run prisma:generate
npm run typecheck
npm run lint
npm test
npm run build
```

## Vercel
Import the repository, configure the variables in `.env.example`, and set `CRON_SECRET`. `vercel.json` schedules the six-hour ingest and hourly price check. Until credentials and a database are supplied, the public UI remains usable with local mock catalog data.

## Compliance
Brand, legal entity, grievance officer required for footer. See PENDING.md

## Docs
- BLUEPRINT.md - master
- docs/section-11-connectors.md - connectors & upsert rules
- docs/section-12-frontend.md - frontend + PDP + SEO
- docs/appendix-build-kickoff.md - first run
