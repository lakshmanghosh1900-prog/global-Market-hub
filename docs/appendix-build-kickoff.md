# Appendix: Build Kickoff

## Sprint 1 Thin Slice (Flipkart Only)
Goal: Visitor opens /in/under/under-49, sees real products in rupees, clicks through to Flipkart with your tracking ID.

## Steps
1. Fill .env from .env.example
   - FLIPKART_AFFILIATE_ID + TOKEN (from affiliate.flipkart.net)
   - Others placeholder

2. Install
   npm install
   npx prisma init
   npx prisma migrate dev --name init

3. Seed merchants
   npm run seed:merchants

4. First Flipkart Sync
   npm run sync:flipkart
   - This refetches feed links (they expire after 10h) and upserts

5. Run dev
   npm run dev
   Open http://localhost:3000/in/under/under-49

6. Verify
   - Products show in INR
   - Merchant badge shows Flipkart
   - Freshness label is derived from the recorded sync time
   - The server-authoritative seller redirect resolves to the exact stored product URL and includes the configured tracking ID

## What to Provide Before Coding
1. Flipkart affiliate tracking ID and API token
2. Amazon Associates India status, and whether you meet Creators API conditions (10 sales)
3. Cuelinks account and its API access status
4. Domain and hosting choice (e.g. Vercel)
5. Brand name, legal entity and grievance officer details

## After Sprint 1
- Global update: cart, wishlist, chatbot, cron protection, PDP + JSON-LD + sitemaps are now scaffolded with placeholders.
- Next production step: configure real credentials, database, legal details, Resend sender and verify merchant contracts.
- Later scale pass: Cuelinks deals-only pages + curated CSV admin, Amazon Creators API onboarding, and BullMQ worker deployment.

## Commands to Push Final Blueprint (If Repo Blank)
```bash
cd /d C:\Users\User\global-Market-hub
git init
git remote add origin https://github.com/lakshmanghosh1900-prog/global-Market-hub.git
git branch -M main
git add .
git commit -m "final blueprint v1 - Section 11,12,12.9 PDP JSON-LD sitemap complete - Sprint 1 Flipkart ready"
git push -u origin main
```
If repo already cloned and blank:
```bash
cd /d C:\Users\User\global-Market-hub
git add .
git commit -m "final blueprint v1"
git push origin main
```
