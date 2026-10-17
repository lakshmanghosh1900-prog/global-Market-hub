ALTER TABLE "Product"
  ADD COLUMN "affiliateNetwork" TEXT,
  ADD COLUMN "affiliateCampaignId" INTEGER;

UPDATE "Product"
SET "affiliateNetwork" = 'cuelinks'
WHERE "affiliateNetwork" IS NULL
  AND LOWER("merchant") = 'cuelinks';

CREATE INDEX "Product_affiliateNetwork_affiliateCampaignId_idx"
  ON "Product"("affiliateNetwork", "affiliateCampaignId");

CREATE TABLE "CuelinksOffer" (
  "id" TEXT NOT NULL,
  "externalId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "terms" TEXT,
  "couponCode" TEXT,
  "offerType" TEXT NOT NULL,
  "campaignId" INTEGER NOT NULL,
  "campaignName" TEXT NOT NULL,
  "categoryNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "trackingUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startDate" TEXT,
  "endDate" TEXT,
  "originalPrice" DECIMAL(10,2),
  "discountPrice" DECIMAL(10,2),
  "percentOff" DECIMAL(6,2),
  "shippingCharge" TEXT,
  "providerUpdatedAt" TIMESTAMP(3),
  "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CuelinksOffer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CuelinksOffer_externalId_key" ON "CuelinksOffer"("externalId");
CREATE INDEX "CuelinksOffer_campaignId_isActive_idx" ON "CuelinksOffer"("campaignId", "isActive");
CREATE INDEX "CuelinksOffer_status_endDate_idx" ON "CuelinksOffer"("status", "endDate");
CREATE INDEX "CuelinksOffer_lastSync_idx" ON "CuelinksOffer"("lastSync");
