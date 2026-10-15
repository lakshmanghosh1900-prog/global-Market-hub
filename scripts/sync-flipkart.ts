import { syncFlipkart } from "@/lib/connectors/flipkart";

syncFlipkart()
  .then((result) => {
    console.log(`Flipkart sync complete: ${result.upserted} products upserted.`);
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
