import { syncFlipkart } from "@/lib/connectors/flipkart";
import { hasFlipkartCredentials } from "@/lib/config";
import { prisma } from "@/lib/db";

export async function runIngest() {
  if (!hasFlipkartCredentials()) return { mode: "mock", upserted: 0, missingChecked: 0 };

  const startedAt = new Date();
  let runId: string | null = null;
  let since = process.env.FLIPKART_CHANGE_SINCE ?? "";
  try {
    const previous = await prisma.ingestRun.findFirst({
      where: { source: "flipkart", status: "success", cursor: { not: null } },
      orderBy: { finishedAt: "desc" },
      select: { cursor: true },
    });
    if (previous?.cursor) since = previous.cursor;
    const run = await prisma.ingestRun.create({
      data: { source: "flipkart", status: "running", startedAt },
    });
    runId = run.id;
  } catch (error) {
    console.warn("Ingest status persistence is unavailable; continuing with the catalog sync.", error);
  }

  try {
    const result = await syncFlipkart(fetch, since);
    if (runId) {
      await prisma.ingestRun.update({
        where: { id: runId },
        data: {
          status: "success",
          finishedAt: new Date(),
          feedFetchedAt: result.feedFetchedAt,
          feedCount: result.feedCount,
          parsedCount: result.parsedCount,
          upserted: result.upserted,
          missingChecked: result.missingChecked,
          expiredFeeds: result.expiredFeeds,
          cursor: result.cursor,
        },
      });
    }
    return result;
  } catch (error) {
    if (runId) {
      await prisma.ingestRun.update({
        where: { id: runId },
        data: { status: "failed", finishedAt: new Date(), error: error instanceof Error ? error.message : "Unknown ingest error" },
      }).catch(() => undefined);
    }
    throw error;
  }
}
