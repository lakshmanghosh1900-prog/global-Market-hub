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
2. Fill Flipkart affiliate ID + token
3. `npm install && npx prisma migrate dev && npm run dev`
4. Trigger first sync: `npm run sync:flipkart`

With no Flipkart token configured, the listing intentionally renders six local mock products so the Sprint 1 UI can be reviewed before API onboarding.

## Compliance
Brand, legal entity, grievance officer required for footer. See PENDING.md

## Docs
- BLUEPRINT.md - master
- docs/section-11-connectors.md - connectors & upsert rules
- docs/section-12-frontend.md - frontend + PDP + SEO
- docs/appendix-build-kickoff.md - first run
