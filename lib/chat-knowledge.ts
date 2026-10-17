import { searchProductsWithMeta } from "@/lib/products";
import { resolveCategorySlug, categoryName } from "@/lib/taxonomy";

export type ChatLink = { label: string; href: string };
export type ChatRecommendation = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  merchant: string;
  inStock: boolean;
  isFixture: boolean;
  detailHref: string;
  sellerEligible: boolean;
};

export type ChatResponse = {
  answer: string;
  links: ChatLink[];
  recommendations: ChatRecommendation[];
  mode: "knowledge" | "catalog";
};

const categoryTerms: Array<[RegExp, string]> = [
  [/\blaptops?\b|\bnotebooks?\b|\bcomputer(s)?\b/i, "computers"],
  [/\bphones?\b|\bmobile(s)?\b|\bsmartphones?\b/i, "mobiles"],
  [/\bheadphones?\b|\bearphones?\b|\bspeakers?\b|\baudio\b/i, "audio"],
  [/\belectronics?\b|\bgadgets?\b/i, "electronics"],
  [/\bfashion\b|\bclothes?\b|\bshoes?\b|\bfootwear\b/i, "fashion"],
  [/\bhome\b|\bfurniture\b|\bdecor\b/i, "home"],
  [/\bkitchen\b|\bcookware\b/i, "kitchen"],
  [/\bbeauty\b|\bskincare\b|\bmakeup\b/i, "beauty"],
  [/\bgrocery\b|\bsnacks?\b|\bfood\b/i, "grocery"],
  [/\btoys?\b|\bgames?\b/i, "toys"],
  [/\bbooks?\b|\breading\b/i, "books"],
  [/\bsports?\b|\bfitness\b|\bgym\b/i, "sports"],
  [/\bappliances?\b/i, "appliances"],
];

function linksFor(category?: string, bracket?: string): ChatLink[] {
  const links: ChatLink[] = [];
  if (category) links.push({ label: `${categoryName(category)} category`, href: `/in/c/${category}` });
  if (bracket) links.push({ label: `Browse ${bracket.replace("under-", "Under ₹")}`, href: `/in/under/${bracket}` });
  links.push({ label: "All categories", href: "/in/categories" }, { label: "Supported markets", href: "/in/about" });
  return links;
}

function knowledgeAnswer(message: string) {
  const lower = message.toLowerCase();
  if (/pay|payment|checkout|order|buy this|purchase/.test(lower)) return "Global Market Hub is an affiliate discovery platform, not the seller. Choose an eligible View Offer action and we will take you to the merchant's validated product page. Payment, delivery, returns and order support stay with that merchant.";
  if (/affiliate|commission|tracking/.test(lower)) return "Some merchant links are affiliate links. If you continue to a seller, the URL may include tracking parameters; this can earn Global Market Hub a commission without changing your price. We never receive your payment details.";
  if (/wishlist|saved cart|cart/.test(lower)) return "Use the heart to save a product to your wishlist, or Save to compare to keep it in the saved cart. These are comparison tools, not checkout. Anonymous saved items are kept locally for up to 30 days and capped at 50 items.";
  if (/country|countries|market|supported/.test(lower)) return "India is the currently supported marketplace. Other countries are listed as coming soon until verified local catalogs, merchant destinations and currency handling are ready.";
  if (/empty|no products|category.*empty/.test(lower)) return "An empty category means a verified merchant catalog has not supplied eligible inventory for that taxonomy yet. We keep the category visible rather than filling it with invented products.";
  if (/alert|notify|price drop|whatsapp|email/.test(lower)) return "Price alerts record your target and consent, but actual email or WhatsApp delivery stays disabled until a compliant provider and sender are configured. WhatsApp opt-in is separate and explicit.";
  if (/grievance|privacy|legal|terms|disclosure/.test(lower)) return "You can find privacy, terms, grievance and affiliate disclosure links in the footer. They explain how discovery links, support and data choices work.";
  if (/merchant|seller|flipkart|amazon|cuelinks/.test(lower)) return "Flipkart is the first live-catalog connector when its verified credentials are configured. Amazon remains curated and Cuelinks remains deals/link mode; neither is presented as an automatic product feed without a compliant source.";
  return "Tell me what you want to discover, such as laptops under ₹499 or kitchen products. I can search the connected catalog, explain merchant clickouts, or point you to a category and price range.";
}

export async function answerChat(message: string): Promise<ChatResponse> {
  const bracketMatch = message.match(/under[^0-9]{0,10}(49|99|199|499)/i);
  const bracket = bracketMatch ? `under-${bracketMatch[1]}` : undefined;
  const category = categoryTerms.find(([pattern]) => pattern.test(message))?.[1];
  const categorySlug = category ? resolveCategorySlug(category) ?? category : undefined;
  const isCatalogQuestion = Boolean(categorySlug || bracket || /find|show|search|recommend|looking for|product|buy|shop/i.test(message));
  const knowledge = knowledgeAnswer(message);
  const catalog = isCatalogQuestion && !/how|why|what does|does global|affiliate|payment|checkout|wishlist|supported|country|alert|privacy|grievance/i.test(message)
    ? await searchProductsWithMeta(categorySlug ? "" : message, { category: categorySlug, bracket, sort: "relevance", pageSize: 6 })
    : { products: [], total: 0 };
  const recommendations = catalog.products.slice(0, 6).map((product) => ({
    id: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price,
    image: product.image,
    merchant: product.merchant,
    inStock: product.inStock,
    isFixture: product.isFixture ?? false,
    detailHref: `/in/product/${product.slug}`,
    sellerEligible: Boolean(product.inStock && !product.isFixture),
  }));
  const answer = recommendations.length
    ? `I found ${catalog.total} matching ${categorySlug ? categoryName(categorySlug).toLowerCase() : "product"}${bracket ? ` ${bracket.replace("under-", "under ₹")}` : ""}. These cards show the available context; preview fixtures are clearly marked and cannot open a seller.`
    : knowledge;
  return { answer, links: linksFor(categorySlug, bracket), recommendations, mode: recommendations.length ? "catalog" : "knowledge" };
}
