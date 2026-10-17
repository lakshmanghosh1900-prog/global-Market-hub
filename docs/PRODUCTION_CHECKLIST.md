# Production checklist

This checklist keeps the repository runnable in honest preview mode while making the first real catalog activation controlled, reversible and provider-aware.

## Real Affiliate Env Needed

Set these values in the deployment environment, never in git:

- `FLIPKART_AFFILIATE_ID` — the Flipkart `affid`/tracking ID.
- `FLIPKART_TOKEN` (or `FLIPKART_AFFILIATE_TOKEN`) — the Flipkart Affiliate API token.
- `FLIPKART_API_BASE` — normally `https://affiliate-api.flipkart.net/aff/api`.
- `DATABASE_URL` — production PostgreSQL connection string.
- `CRON_SECRET` — a long random value used by Vercel Cron requests.
- `HMAC_SECRET` — a long random value for signed clickout tokens.
- `AFFILIATE_ALLOWED_HOSTS` — the exact merchant hosts approved for clickouts.
- `NEXT_PUBLIC_BASE_URL` — the absolute production canonical origin; do not leave the placeholder value.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` — required only when a compliant alert email dispatcher is implemented and enabled.
- `CUELINKS_API_KEY` — a key with documented `read:campaigns`, `read:offers` and `write:links` scopes.
- `CUELINKS_API_BASE` — `https://developers.cuelinks.com/pub_api/v3`.
- `CUELINKS_TRACKING_HOSTS` — comma-separated approved Cuelinks tracking hosts; keep this exact and provider-verified.

The connector refetches the Flipkart feed-list at the beginning of every sync. This is intentional: feed URLs expire after approximately ten hours. The sync also injects `affid` into every valid Flipkart product URL, maps source categories to the seeded taxonomy, deduplicates the incoming run by GTIN/SKU, and records an `IngestRun`.

Until a valid Cuelinks key or direct Flipkart credentials are configured, no real provider sync runs. Development preview fixtures are disclosed and cannot create seller clickouts; production does not use them as inventory.

## Vercel Env Setup

Required for the public app and operational routes:

```text
DATABASE_URL=postgresql://...
CRON_SECRET=<random>
HMAC_SECRET=<random>
FLIPKART_AFFILIATE_ID=<real id>
FLIPKART_TOKEN=<real token>
NEXT_PUBLIC_BASE_URL=https://your-domain.example
BRAND_NAME=<public brand>
LEGAL_ENTITY_NAME=<registered legal entity>
GRIEVANCE_OFFICER_NAME=<name>
GRIEVANCE_OFFICER_EMAIL=<email>
GRIEVANCE_OFFICER_ADDRESS=<postal address>
ADMIN_SECRET=<long random secret>
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public anon key>
```

Configure Supabase Auth separately:

1. Enable email OTP and production email delivery.
2. Add the production site URL and `/in/account`/`/in/login` redirect URLs.
3. Keep the anon key public; do not add a service-role key to client-exposed variables.
4. Verify that OTP verification is permitted for the production domain.

Deploy in this order:

```text
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run seed:catalog
npm run build
```

Use `ADMIN_SECRET` with the protected `/admin/curated-upload` and `/admin/clicks` routes. The first authenticated GET sets a short-lived HttpOnly admin cookie; do not paste the secret into shared screenshots or logs.

## First Real Ingestion Steps

1. Confirm the production database is reachable and migrations `00000000000000_init`, `00000000000001_global_update`, `00000000000002_production_ingestion`, `00000000000003_visible_listings`, `00000000000004_affiliate_cart_offer_alerts`, `00000000000005_country_market_metadata`, `00000000000006_alert_unsubscribe_tokens`, and `00000000000007_cuelinks_offers_network` are applied.
2. Request the status endpoint before activation:

   ```text
   curl -i https://your-domain.example/api/v1/ingest/status
   ```

3. Trigger one controlled cron run with the secret:

   ```text
   curl -i -H "Authorization: Bearer $CRON_SECRET" https://your-domain.example/api/cron/ingest
   ```

4. Check `/api/v1/ingest/status` again. Confirm `mode=real`, a recent `lastFeedFetchTime`, a non-zero `feedCount`/`parsedCount` when the affiliate account has inventory, and `lastRun.status=success`.
5. Check a known product URL and confirm the affiliate URL contains the configured `affid`. Check the public listing, PDP Product JSON-LD, `/sitemap.xml`, and `/robots.txt`.
6. If the feed-list or parser returns an empty/unexpected payload, the run fails before applying a destructive empty sync. Investigate the recorded `lastRun.error`; do not manually reset `missingRuns` until the payload contract is understood.
7. After three validated runs, review out-of-stock and missing-run counts. The shared policy keeps OOS products for seven days and delists products after three consecutive validated missing runs.
8. For Amazon/Cuelinks products, upload a validated CSV with the exact header shown on `/admin/curated-upload`. Verify `source=curated`, `isFixture=false`, category, image, exact HTTPS merchant path and click attribution before publishing the upload batch.
9. For Cuelinks, verify `/api/v1/cuelinks/status`, then run `/api/cron/cuelinks-deals-sync` with `CRON_SECRET`. Confirm campaign/offer counts and that live offers appear only at `/in/deals`; this does not prove product-feed access.

## Verification commands

Run from the repository root:

```text
npm run prisma:generate
npm run typecheck
npm run lint
npm test
npm run build
```

These checks do not prove that live Cuelinks/Flipkart credentials, a production database, legal configuration, product-feed access, or alert delivery are valid. The controlled first-ingestion steps above are required after deployment. The category maintenance cron performs a database-backed category health check and reports unknown categories; it does not rewrite product categories automatically. A price-check match is not reported as a delivered alert; dispatch remains disabled until a compliant provider is implemented and verified.
