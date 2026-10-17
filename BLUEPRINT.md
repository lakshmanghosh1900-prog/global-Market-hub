# Global Market Hub - Hybrid Mega Website Blueprint - Final v1.1

**Repo:** https://github.com/lakshmanghosh1900-prog/global-Market-hub.git
**Track:** Agents & Automation agents
**Stack:** Next.js 14 App Router, Postgres, BullMQ, Prisma

## Status (2026-10-17)
- Sections 11 and 12 are now in the doc, including the v1.1 affiliate wishlist cart and future best-offer alert system, followed by the build kickoff appendix.
- Live documentation check changed earlier assumptions.
- The code has been run through the local typecheck, lint, 22-test unit suite, production build, and HTTP route smoke checks. Database and live-provider verification remain externally blocked; see `docs/VERIFICATION_REPORT.md`.

## Live Check Changes

### Amazon: PA-API 5.0 Deprecated (403)
- PA-API 5.0 returns 403, deprecated. Built Creators API connector instead.
- Creators API returns ONLY featured offer, no shipping cost, no reviews.
- Third-party write-up says access needs 10 qualifying sales in last 30 days. Could not confirm on Amazon own pages. TODO: verify during onboarding.
- Until access, Amazon stays on curated listings.

### Flipkart: Only Real Catalog
- Only source with real catalog + change feed, so first connector.
- Feed links expire after 10 hours, so code refetches them on every run.
- Sprint 1 is thin slice with Flipkart only.

### Cuelinks: No Product Feeds
- Help center says it offers no product feeds, only campaigns, deals, transactions and links.
- Means 18 of your 20 merchants have no automatic catalog yet.
- Four options: 1) network feeds, 2) curated CSV import, 3) deals-only merchant pages, 4) no scraping.
- SQL fix for seed included in Section 11.
- Cuelinks V3 endpoint paths and response formats are configurable placeholders, couldn't retrieve current docs. Check against dashboard.

## Sections

### Section 11: Connectors
Location: `docs/section-11-connectors.md`
- Connectors (Flipkart, Amazon Creators, Cuelinks)
- Shared upsert with out-of-stock and delist rules
- Category mapper
- GTIN and title-based dedup
- BullMQ schedules
- Tests and first-run procedure

### Section 12: Frontend
Location: `docs/section-12-frontend.md`
- Next.js 14 country routing
- Country switcher (plain India badge until second country active)
- Header and bracket strip
- Product card with merchant badge and freshness label
- Shared listing pages for categories, hubs and price brackets
- 12.9: Product detail page, JSON-LD, sitemaps - NOW SPECIFIED
- 12.7: Affiliate wishlist cart with local 30-day persistence, merchant clickouts, and future account synchronization
- 12.8: DPDP/WhatsApp-consented future best-offer notification subscriptions

### Appendix: Build Kickoff
Location: `docs/appendix-build-kickoff.md`

## Sprint 1 Thin Slice
Visitor opens `/in/under/under-49`, sees real products in rupees, clicks through to Flipkart with your tracking ID.

Requirements from owner:
1. Flipkart affiliate tracking ID and API token
2. Amazon Associates India status + Creators API conditions
3. Cuelinks account and API access status
4. Domain and hosting choice
5. Brand name, legal entity and grievance officer details

## Section 12.7: Affiliate Wishlist Cart

The cart is a saved comparison surface, never a checkout. Anonymous visitors use the `global_market_cart` browser key with a 30-day TTL and a hard limit of 50 unique products. The persisted Prisma `Cart` stores an optional `userId`, indexed `anonymousId`, timestamps, and `expiresAt`; `CartItem` stores a product snapshot so a future authenticated account can synchronize saved items even when the live catalog changes.

The header cart trigger opens a responsive slide-over drawer. Each item shows its thumbnail, localized INR price, merchant badge, freshness/stock state, remove control, and an individual `Buy on [Merchant] →` action. Every merchant action requests a short-lived signed `/out` URL; Global Market Hub does not collect payment or provide a direct checkout.

## Section 12.8: Future Best Offer Notification System

`OfferAlertSubscription` stores email, optional phone and WhatsApp number, category and price-bracket preferences, consent timestamps, verification state, and soft-deactivation state. `POST /api/alerts/subscribe` requires the DPDP consent statement, records `consentAt`, records `whatsappConsentAt` only when WhatsApp is explicitly selected, and logs a mock verification URL for the buildathon. `GET /api/alerts/verify?token=...` activates a subscription and `GET /api/alerts/unsubscribe?email=...` soft-deactivates it. Production dispatch still requires a configured compliant email/WhatsApp provider.
