ALTER TABLE "Product" ADD COLUMN "isFixture" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "IngestRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "feedFetchedAt" TIMESTAMP(3),
    "feedCount" INTEGER NOT NULL DEFAULT 0,
    "parsedCount" INTEGER NOT NULL DEFAULT 0,
    "upserted" INTEGER NOT NULL DEFAULT 0,
    "missingChecked" INTEGER NOT NULL DEFAULT 0,
    "expiredFeeds" INTEGER NOT NULL DEFAULT 0,
    "cursor" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IngestRun_source_createdAt_idx" ON "IngestRun"("source", "createdAt");
CREATE INDEX "IngestRun_source_status_finishedAt_idx" ON "IngestRun"("source", "status", "finishedAt");
