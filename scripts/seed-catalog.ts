import { seedCatalog } from "@/data/catalog";

seedCatalog().then(() => console.log("Catalog metadata seeded.")).catch((error) => { console.error(error); process.exitCode = 1; });
