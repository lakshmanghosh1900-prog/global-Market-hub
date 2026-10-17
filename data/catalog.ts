import { prisma } from "@/lib/db";
import { countryRegistry } from "@/lib/countries";
import { taxonomy } from "@/lib/taxonomy";

export { taxonomy };

export const merchants = [
  ["flipkart", "Flipkart", true, "flipkart_api"], ["amazon", "Amazon-curated", false, "curated_csv"], ["cuelinks", "Cuelinks", false, "deals_only"],
  ["myntra", "Myntra", false, "pending"], ["ajio", "AJIO", false, "pending"], ["meesho", "Meesho", false, "pending"], ["nykaa", "Nykaa", false, "pending"],
  ["tatacliq", "Tata Cliq", false, "pending"], ["snapdeal", "Snapdeal", false, "pending"], ["reliance-digital", "Reliance Digital", false, "pending"],
  ["shopsy", "Shopsy", false, "pending"], ["pepperfry", "Pepperfry", false, "pending"], ["firstcry", "FirstCry", false, "pending"],
  ["boat", "boAt", false, "pending"], ["cult-fit", "Cult.fit", false, "pending"], ["lenskart", "Lenskart", false, "pending"],
  ["decathlon", "Decathlon", false, "pending"], ["bigbasket", "BigBasket", false, "pending"], ["swiggy-instamart", "Swiggy Instamart", false, "pending"], ["blinkit", "Blinkit", false, "pending"]
] as const;

export async function seedCatalog() {
  const brackets = [49, 99, 199, 499].map((value) => ({
    country: "in",
    slug: `under-${value}`,
    label: `Under ₹${value}`,
    maxPrice: value,
  }));

  // Upserts keep the seed safe to rerun while also correcting registry metadata
  // when a country or merchant changes from pending to active (createMany with
  // skipDuplicates would leave the old value untouched).
  await prisma.$transaction([
    ...countryRegistry.map((country) => prisma.country.upsert({
      where: { code: country.code },
      update: {
        name: country.name,
        active: country.active,
        currency: country.currency,
        locale: country.locale,
        launchStatus: country.launchStatus,
        supportedMerchants: country.supportedMerchants,
      },
      create: {
        code: country.code,
        name: country.name,
        active: country.active,
        currency: country.currency,
        locale: country.locale,
        launchStatus: country.launchStatus,
        supportedMerchants: country.supportedMerchants,
      },
    })),
    ...taxonomy.map((term) => prisma.taxonomyTerm.upsert({
      where: { slug: term.slug },
      update: { name: term.name },
      create: term,
    })),
    ...merchants.map(([slug, name, active, catalogSource]) => prisma.merchant.upsert({
      where: { slug },
      update: { name, active, catalogSource },
      create: { slug, name, active, catalogSource },
    })),
    ...brackets.map((bracket) => prisma.priceBracket.upsert({
      where: { country_slug: { country: bracket.country, slug: bracket.slug } },
      update: { label: bracket.label, maxPrice: bracket.maxPrice },
      create: bracket,
    })),
  ]);
}
