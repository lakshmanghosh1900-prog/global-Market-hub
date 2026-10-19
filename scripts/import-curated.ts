import { readFile } from "node:fs/promises";
import { importCuratedCsv } from "@/lib/curated-upload";

async function main() {
  const csv = await readFile("data/amazon-curated.csv", "utf8");
  const result = await importCuratedCsv(csv);
  console.log(JSON.stringify(result));
}

main().then(() => console.log("Curated CSV processed.")).catch((error) => { console.error(error); process.exitCode = 1; });
