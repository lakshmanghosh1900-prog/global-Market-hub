-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "mrp" DECIMAL(10,2),
    "brand" TEXT,
    "image" TEXT,
    "affiliateUrl" TEXT NOT NULL,
    "merchant" TEXT NOT NULL DEFAULT 'Flipkart',
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'flipkart',
    "oosSince" TIMESTAMP(3),
    "missingRuns" INTEGER NOT NULL DEFAULT 0,
    "isDelisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_merchant_sku_key" ON "Product"("merchant", "sku");

-- CreateIndex
CREATE INDEX "Product_category_inStock_isDelisted_idx" ON "Product"("category", "inStock", "isDelisted");

-- CreateIndex
CREATE INDEX "Product_source_missingRuns_idx" ON "Product"("source", "missingRuns");
