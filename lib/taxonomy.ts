import categoryMap from "@/data/category_map.json";

const taxonomySlugs = [
  "electronics", "mobiles", "computers", "audio", "cameras", "wearables", "gaming", "accessories", "televisions", "appliances",
  "fashion", "mens-fashion", "womens-fashion", "kids-fashion", "footwear", "jewellery", "bags", "watches", "beauty", "personal-care",
  "home", "kitchen", "furniture", "decor", "bedding", "bath", "storage", "garden", "tools", "lighting",
  "grocery", "snacks", "beverages", "staples", "baby-care", "toys", "books", "stationery", "sports", "fitness",
  "automotive", "pet-supplies", "health", "pharmacy", "travel", "luggage", "office", "musical-instruments", "movies", "subscriptions",
  "under-49", "under-99", "under-199", "under-499", "deals",
] as const;

export const taxonomy: Array<{ slug: string; name: string }> = taxonomySlugs.map((slug) => ({
  slug,
  name: slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
}));

export const canonicalCategories = taxonomy.filter((term) => !term.slug.startsWith("under-") && term.slug !== "deals");

export const categoryGroups = [
  { name: "Tech & entertainment", slugs: ["electronics", "mobiles", "computers", "audio", "cameras", "wearables", "gaming", "televisions", "accessories", "musical-instruments", "movies", "subscriptions"] },
  { name: "Fashion & personal care", slugs: ["fashion", "mens-fashion", "womens-fashion", "kids-fashion", "footwear", "jewellery", "bags", "watches", "beauty", "personal-care"] },
  { name: "Home & living", slugs: ["home", "kitchen", "furniture", "decor", "bedding", "bath", "storage", "garden", "tools", "lighting", "appliances"] },
  { name: "Everyday needs", slugs: ["grocery", "snacks", "beverages", "staples", "baby-care", "toys", "books", "stationery", "sports", "fitness", "automotive", "pet-supplies", "health", "pharmacy", "travel", "luggage", "office"] },
] as const;

export function resolveCategorySlug(value: string) {
  const normalized = value.toLowerCase();
  if (canonicalCategories.some((term) => term.slug === normalized)) return normalized;
  const mapped = (categoryMap as Record<string, string>)[normalized];
  return mapped && canonicalCategories.some((term) => term.slug === mapped) ? mapped : null;
}

export function categoryName(slug: string) {
  return taxonomy.find((term) => term.slug === slug)?.name ?? slug.replace(/-/g, " ");
}
