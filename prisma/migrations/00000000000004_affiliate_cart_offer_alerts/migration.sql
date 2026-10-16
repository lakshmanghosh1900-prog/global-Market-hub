-- Section 12.7: replace session-bound cart rows with a 30-day snapshot cart.
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Cart_anonymousId_idx" ON "Cart"("anonymousId");
CREATE INDEX "Cart_userId_idx" ON "Cart"("userId");
CREATE INDEX "Cart_expiresAt_idx" ON "Cart"("expiresAt");

CREATE TABLE "CartItem_new" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "slug" TEXT,
    "merchantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "deepLink" TEXT NOT NULL,
    "freshness" TEXT NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CartItem_new_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CartItem_new_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CartItem_new_cartId_productId_key" ON "CartItem_new"("cartId", "productId");
CREATE INDEX "CartItem_new_cartId_createdAt_idx" ON "CartItem_new"("cartId", "createdAt");
CREATE INDEX "CartItem_new_productId_idx" ON "CartItem_new"("productId");

-- Preserve existing guest rows when the database already has the old CartItem shape.
INSERT INTO "Cart" ("id", "userId", "anonymousId", "createdAt", "updatedAt", "expiresAt")
SELECT
    'legacy-' || md5("sessionId"),
    MIN("userId"),
    "sessionId",
    MIN("addedAt"),
    CURRENT_TIMESTAMP,
    MIN("addedAt") + INTERVAL '30 days'
FROM "CartItem"
GROUP BY "sessionId";

INSERT INTO "CartItem_new" (
    "id", "cartId", "productId", "slug", "merchantId", "title", "price", "currency",
    "imageUrl", "merchantName", "deepLink", "freshness", "inStock", "createdAt"
)
SELECT
    old."id",
    'legacy-' || md5(old."sessionId"),
    old."productId",
    product."slug",
    LOWER(REGEXP_REPLACE(old."merchant", '[^a-zA-Z0-9]+', '-', 'g')),
    product."title",
    old."priceAtAdd",
    'INR',
    COALESCE(product."image", ''),
    old."merchant",
    old."affiliateUrl",
    CASE WHEN product."inStock" THEN 'In stock · updated recently' ELSE 'Currently unavailable' END,
    product."inStock",
    old."addedAt"
FROM "CartItem" old
JOIN "Product" product ON product."id" = old."productId";

DROP TABLE "CartItem";
ALTER TABLE "CartItem_new" RENAME TO "CartItem";
ALTER INDEX "CartItem_new_cartId_productId_key" RENAME TO "CartItem_cartId_productId_key";
ALTER INDEX "CartItem_new_cartId_createdAt_idx" RENAME TO "CartItem_cartId_createdAt_idx";
ALTER INDEX "CartItem_new_productId_idx" RENAME TO "CartItem_productId_idx";
ALTER TABLE "CartItem" RENAME CONSTRAINT "CartItem_new_pkey" TO "CartItem_pkey";
ALTER TABLE "CartItem" RENAME CONSTRAINT "CartItem_new_cartId_fkey" TO "CartItem_cartId_fkey";

-- Section 12.8: DPDP/WhatsApp-aware future offer subscriptions.
CREATE TABLE "OfferAlertSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNo" TEXT,
    "whatsappNo" TEXT,
    "hasWhatsappConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "whatsappConsentAt" TIMESTAMP(3),
    "categories" TEXT[] NOT NULL,
    "priceBrackets" TEXT[] NOT NULL,
    "maxPrice" DECIMAL(10,2),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfferAlertSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OfferAlertSubscription_email_key" ON "OfferAlertSubscription"("email");
CREATE UNIQUE INDEX "OfferAlertSubscription_verificationToken_key" ON "OfferAlertSubscription"("verificationToken");
CREATE INDEX "OfferAlertSubscription_isActive_isVerified_idx" ON "OfferAlertSubscription"("isActive", "isVerified");
