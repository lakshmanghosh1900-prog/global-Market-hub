import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [lastRun, productCount] = await Promise.all([
      prisma.ingestRun.findFirst({ where: { source: "flipkart" }, orderBy: { createdAt: "desc" } }),
      prisma.product.count({ where: { source: "flipkart", isDelisted: false } }),
    ]);

    return NextResponse.json({
      mode: "real",
      lastFeedFetchTime: lastRun?.feedFetchedAt ?? null,
      productCount,
      expiredFeeds: lastRun?.expiredFeeds ?? 0,
      lastRun: lastRun ? {
        id: lastRun.id,
        status: lastRun.status,
        startedAt: lastRun.startedAt,
        finishedAt: lastRun.finishedAt,
        feedCount: lastRun.feedCount,
        parsedCount: lastRun.parsedCount,
        upserted: lastRun.upserted,
        missingChecked: lastRun.missingChecked,
        error: lastRun.error,
      } : null,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      mode: "mock",
      lastFeedFetchTime: null,
      productCount: 0,
      expiredFeeds: 0,
      lastRun: null,
      warning: error instanceof Error ? error.message : "Ingest status is unavailable until the database is configured.",
    }, { headers: { "cache-control": "no-store" } });
  }
}
