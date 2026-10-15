ALTER TABLE "Product"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "description" TEXT,
  ADD COLUMN "gtin" TEXT;

UPDATE "Product"
SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("sku", '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
WHERE "slug" IS NULL;

ALTER TABLE "Product"
  ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "gallery" SET NOT NULL,
  ADD COLUMN "duplicateReview" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_gtin_idx" ON "Product"("gtin");

CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "merchant" TEXT NOT NULL,
  "affiliateUrl" TEXT NOT NULL,
  "priceAtAdd" DECIMAL(10,2) NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CartItem_sessionId_productId_key" ON "CartItem"("sessionId", "productId");
CREATE INDEX "CartItem_sessionId_addedAt_idx" ON "CartItem"("sessionId", "addedAt");
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WishlistItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "targetPrice" DECIMAL(10,2),
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WishlistItem_sessionId_productId_key" ON "WishlistItem"("sessionId", "productId");
CREATE INDEX "WishlistItem_sessionId_addedAt_idx" ON "WishlistItem"("sessionId", "addedAt");
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PriceAlert" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "email" TEXT,
  "targetPrice" DECIMAL(10,2) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "triggeredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PriceAlert_sessionId_productId_targetPrice_key" ON "PriceAlert"("sessionId", "productId", "targetPrice");
CREATE INDEX "PriceAlert_productId_active_idx" ON "PriceAlert"("productId", "active");
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChatSession" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "history" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChatSession_sessionId_key" ON "ChatSession"("sessionId");

CREATE TABLE "ClickEvent" (
  "id" TEXT NOT NULL,
  "productId" TEXT,
  "merchant" TEXT NOT NULL,
  "sessionId" TEXT,
  "targetHost" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClickEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ClickEvent_merchant_createdAt_idx" ON "ClickEvent"("merchant", "createdAt");
ALTER TABLE "ClickEvent" ADD CONSTRAINT "ClickEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Country" (
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "Merchant" (
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "catalogSource" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Merchant_pkey" PRIMARY KEY ("slug")
);

CREATE TABLE "TaxonomyTerm" (
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "parent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaxonomyTerm_pkey" PRIMARY KEY ("slug")
);

CREATE TABLE "PriceBracket" (
  "id" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "maxPrice" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceBracket_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PriceBracket_country_slug_key" ON "PriceBracket"("country", "slug");
