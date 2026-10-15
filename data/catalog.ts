import { prisma } from "@/lib/db";
import countries from "@/data/countries.json";

export const taxonomy = [
  "electronics", "mobiles", "computers", "audio", "cameras", "wearables", "gaming", "accessories", "televisions", "appliances",
  "fashion", "mens-fashion", "womens-fashion", "kids-fashion", "footwear", "jewellery", "bags", "watches", "beauty", "personal-care",
  "home", "kitchen", "furniture", "decor", "bedding", "bath", "storage", "garden", "tools", "lighting",
  "grocery", "snacks", "beverages", "staples", "baby-care", "toys", "books", "stationery", "sports", "fitness",
  "automotive", "pet-supplies", "health", "pharmacy", "travel", "luggage", "office", "musical-instruments", "movies", "subscriptions",
  "under-49", "under-99", "under-199", "under-499", "deals"
].map((slug) => ({ slug, name: slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) }));

export const merchants = [
  ["flipkart", "Flipkart", true, "flipkart_api"], ["amazon", "Amazon-curated", false, "curated_csv"], ["cuelinks", "Cuelinks", false, "deals_only"],
  ["myntra", "Myntra", false, "pending"], ["ajio", "AJIO", false, "pending"], ["meesho", "Meesho", false, "pending"], ["nykaa", "Nykaa", false, "pending"],
  ["tatacliq", "Tata Cliq", false, "pending"], ["snapdeal", "Snapdeal", false, "pending"], ["reliance-digital", "Reliance Digital", false, "pending"],
  ["shopsy", "Shopsy", false, "pending"], ["pepperfry", "Pepperfry", false, "pending"], ["firstcry", "FirstCry", false, "pending"],
  ["boat", "boAt", false, "pending"], ["cult-fit", "Cult.fit", false, "pending"], ["lenskart", "Lenskart", false, "pending"],
  ["decathlon", "Decathlon", false, "pending"], ["bigbasket", "BigBasket", false, "pending"], ["swiggy-instamart", "Swiggy Instamart", false, "pending"], ["blinkit", "Blinkit", false, "pending"]
] as const;

export async function seedCatalog() {
  await prisma.country.createMany({ data: countries.map((country) => country), skipDuplicates: true });
  await prisma.taxonomyTerm.createMany({ data: taxonomy, skipDuplicates: true });
  await prisma.merchant.createMany({ data: merchants.map(([slug, name, active, catalogSource]) => ({ slug, name, active, catalogSource })), skipDuplicates: true });
  await prisma.priceBracket.createMany({ data: [49, 99, 199, 499].map((value) => ({ country: "in", slug: `under-${value}`, label: `Under ₹${value}`, maxPrice: value })), skipDuplicates: true });
}
