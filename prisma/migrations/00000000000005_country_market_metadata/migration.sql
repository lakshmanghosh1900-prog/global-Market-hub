ALTER TABLE "Country"
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'TBD',
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en-US',
  ADD COLUMN "launchStatus" TEXT NOT NULL DEFAULT 'coming_soon',
  ADD COLUMN "supportedMerchants" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Country"
SET
  "currency" = 'INR',
  "locale" = 'en-IN',
  "launchStatus" = 'active',
  "supportedMerchants" = ARRAY['flipkart']::TEXT[]
WHERE "code" = 'in';
