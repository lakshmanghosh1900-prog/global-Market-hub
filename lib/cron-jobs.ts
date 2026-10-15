import { syncFlipkart } from "@/lib/connectors/flipkart";
import { hasFlipkartCredentials } from "@/lib/config";

export async function runIngest() {
  if (!hasFlipkartCredentials()) return { mode: "mock", upserted: 0, missingChecked: 0 };
  return syncFlipkart();
}
