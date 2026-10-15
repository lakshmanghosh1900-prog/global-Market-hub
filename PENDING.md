# PENDING - Verification Checklist Before Build

## Must Provide (Sprint 1 Blocker)
1. [ ] **Flipkart Affiliate:** tracking ID (affid) + API token from affiliate.flipkart.net > My Account > API
2. [ ] **Amazon Associates India:** account status? Do you meet Creators API 10 qualifying sales in last 30 days? (unverified on Amazon own pages - check onboarding)
3. [ ] **Cuelinks:** account email + API access status (campaigns/deals/links only, no feeds per help center)
4. [ ] **Domain + Hosting:** e.g. global-market-hub.com + Vercel
5. [ ] **Brand/Legal:** brand name, legal entity, grievance officer name/email/address for footer (India compliance)

## Must Verify (Docs Placeholder)
- [ ] Cuelinks V3 endpoint paths and response formats vs dashboard: /campaigns, /deals, /links, /transactions are configurable placeholders
- [ ] Amazon Creators API conditions - 10 sales rule
- [ ] Flipkart feed expiry 10h refetch logic works

## Code Not Yet Run
- [ ] `npm run build` not run
- [ ] BullMQ schedules not tested
- [ ] First-run procedure not tested
- [ ] Product detail page, JSON-LD, sitemaps (12.9) - spec done, implementation pending in Sprint 2

## SQL Fix for Cuelinks Seed (No Auto Catalog)
18 of 20 merchants have no auto catalog. Use curated CSV until network feeds found.

```sql
-- Mark non-Flipkart merchants as curated-only
UPDATE merchants SET catalog_source='curated', auto_sync=false WHERE slug != 'flipkart';
-- Keep Flipkart as real feed
UPDATE merchants SET catalog_source='flipkart_api', auto_sync=true WHERE slug='flipkart';
```
