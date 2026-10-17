import { addFlipkartAffiliateId } from "@/lib/affiliate";
import { flipkartAffiliateId, flipkartAffiliateToken, flipkartApiBase, hasFlipkartCredentials } from "@/lib/config";
import { sharedUpsert, type SyncProduct } from "@/lib/products/upsert";
import categoryMap from "@/data/category_map.json";
import { taxonomy } from "@/data/catalog";

const FLIPKART_MERCHANT = "Flipkart";
export const FLIPKART_FEED_EXPIRY_HOURS = 10;

type JsonRecord = Record<string, unknown>;
type FetchLike = typeof fetch;
const FETCH_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const validTaxonomy = new Set(taxonomy.map((term) => term.slug));

const flipkartHeaders = () => ({
  Accept: "application/json",
  "Fk-Affiliate-Id": flipkartAffiliateId() ?? "",
  "Fk-Affiliate-Token": flipkartAffiliateToken() ?? "",
});

const asRecords = (value: unknown): JsonRecord[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is JsonRecord =>
        typeof item === "object" && item !== null && !Array.isArray(item),
    );
  }

  if (typeof value === "object" && value !== null) {
    return [value as JsonRecord];
  }

  return [];
};

const nestedArray = (body: unknown, keys: string[]) => {
  if (typeof body !== "object" || body === null) {
    return [];
  }

  const record = body as JsonRecord;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

async function getJson(response: Response) {
  if (!response.ok) {
    throw new Error(`Flipkart request failed with HTTP ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchJson(url: string, init: RequestInit, fetcher: FetchLike) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetcher(url, { ...init, signal: controller.signal });
      if (response.ok || (response.status < 400 || response.status >= 500) && attempt === MAX_RETRIES) {
        return await getJson(response);
      }
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`Flipkart request failed with HTTP ${response.status}`);
      }
      lastError = new Error(`Flipkart request failed with HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) throw error;
    } finally {
      clearTimeout(timeout);
    }
    await sleep(250 * 2 ** attempt);
  }
  throw lastError instanceof Error ? lastError : new Error("Flipkart request failed");
}

/**
 * Feed URLs expire after ten hours. This deliberately calls the feed-list
 * endpoint on every sync instead of caching or persisting the returned URLs.
 */
export async function listFlipkartFeeds(fetcher: FetchLike = fetch) {
  const body = await fetchJson(`${flipkartApiBase()}${process.env.FLIPKART_FEED_LIST_PATH ?? "/feed/affiliate/category"}`, {
    headers: flipkartHeaders(),
  }, fetcher);
  const candidates = nestedArray(body, ["feeds", "feed", "data", "results"]);

  return asRecords(candidates.length > 0 ? candidates : body)
    .map((feed) => feed.url ?? feed.feedUrl ?? feed.link)
    .filter((url): url is string => typeof url === "string" && url.length > 0);
}

export async function fetchFlipkartProduct(productId: string, fetcher: FetchLike = fetch) {
  return extractProducts(await fetchJson(`${flipkartApiBase()}/product/${encodeURIComponent(productId)}`, { headers: flipkartHeaders() }, fetcher));
}

export async function fetchFlipkartChanges(since = process.env.FLIPKART_CHANGE_SINCE ?? "", fetcher: FetchLike = fetch) {
  return extractProducts(await fetchJson(`${flipkartApiBase()}/changes?since=${encodeURIComponent(since)}`, { headers: flipkartHeaders() }, fetcher));
}

const firstString = (record: JsonRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return null;
};

const firstNumber = (record: JsonRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const firstBoolean = (record: JsonRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      if (["true", "in_stock", "available"].includes(value.toLowerCase())) {
        return true;
      }
      if (["false", "out_of_stock", "unavailable"].includes(value.toLowerCase())) {
        return false;
      }
    }
  }
  return true;
};

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const categoryKey = (value: string) => value
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[>/|]+/g, " ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const mapCategory = (value: string | null, price: number) => {
  const key = value ? categoryKey(value) : "";
  const direct = categoryMap[key as keyof typeof categoryMap];
  if (direct && validTaxonomy.has(direct)) return direct;

  const segments = key.split("-").filter(Boolean);
  const keywordMap: Array<[string[], string]> = [
    [["mobile", "smartphone", "tablet"], "mobiles"],
    [["laptop", "computer", "notebook"], "computers"],
    [["headphone", "earphone", "speaker", "audio"], "audio"],
    [["television", "tv"], "televisions"],
    [["camera"], "cameras"],
    [["watch", "wearable"], "wearables"],
    [["men", "mens"], "mens-fashion"],
    [["women", "womens", "ladies"], "womens-fashion"],
    [["shoe", "footwear", "sandal"], "footwear"],
    [["beauty", "cosmetic", "makeup"], "beauty"],
    [["kitchen", "cookware"], "kitchen"],
    [["home", "furniture", "decor"], "home"],
    [["grocery", "food", "snack"], "grocery"],
    [["toy", "toys", "game"], "toys"],
    [["book"], "books"],
    [["sport", "fitness", "gym"], "sports"],
  ];
  const keywordMatch = keywordMap.find(([words]) => words.some((word) => segments.includes(word)));
  if (keywordMatch) return keywordMatch[1];

  // Price brackets are calculated by listing filters. A missing source
  // category must not turn a cheap product into a fake taxonomy category.
  return "electronics";
};

const isExactFlipkartProductUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "flipkart.com" || url.hostname.endsWith(".flipkart.com")) && url.pathname !== "/";
  } catch {
    return false;
  }
};

const normalizeProduct = (record: JsonRecord): SyncProduct | null => {
  const sku = firstString(record, ["sku", "productId", "product_id", "id"]);
  const title = firstString(record, ["title", "name", "productName"]);
  const price = firstNumber(record, ["price", "sellingPrice", "selling_price"]);
  const affiliateUrl = firstString(record, ["productUrl", "product_url", "url"]);

  if (!sku || !title || price === null || !affiliateUrl || !isExactFlipkartProductUrl(affiliateUrl)) {
    return null;
  }

  const sourceCategory = firstString(record, ["category", "categoryName", "category_name", "categoryPath"]);
  const normalizedCategory = mapCategory(sourceCategory, price);
  let trackedUrl: string;
  try {
    trackedUrl = addFlipkartAffiliateId(affiliateUrl);
  } catch {
    return null;
  }

  return {
    sku,
    slug: slugify(`${title}-${sku}`),
    title,
    price,
    mrp: firstNumber(record, ["mrp", "maximumRetailPrice", "maximum_retail_price"]),
    brand: firstString(record, ["brand", "brandName"]),
    image: firstString(record, ["image", "imageUrl", "image_url"]),
    gallery: firstString(record, ["image", "imageUrl", "image_url"])
      ? [firstString(record, ["image", "imageUrl", "image_url"]) as string]
      : [],
    description: firstString(record, ["description", "shortDescription"]),
    gtin: firstString(record, ["gtin", "ean", "upc"]),
    affiliateUrl: trackedUrl,
    merchant: FLIPKART_MERCHANT,
    inStock: firstBoolean(record, ["inStock", "in_stock", "availability", "stock"]),
    category: normalizedCategory,
  };
};

export const extractProducts = (body: unknown) => {
  const products = nestedArray(body, ["products", "product", "items", "data", "results"]);
  return asRecords(products.length > 0 ? products : body)
    .map(normalizeProduct)
    .filter((product): product is SyncProduct => product !== null);
};

export async function syncFlipkart(fetcher: FetchLike = fetch, since = process.env.FLIPKART_CHANGE_SINCE ?? "") {
  if (!hasFlipkartCredentials()) {
    throw new Error(
      "Flipkart credentials are not configured. Set FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN before syncing.",
    );
  }

  // Feed URLs expire after ten hours. Refetching the feed-list at the start of
  // every run guarantees that a stale URL is never reused after expiry.
  const feedFetchedAt = new Date();
  const feedUrls = await listFlipkartFeeds(fetcher);
  const allProducts: SyncProduct[] = [];

  for (const feedUrl of feedUrls) {
    const products = extractProducts(await fetchJson(feedUrl, { headers: flipkartHeaders() }, fetcher));
    allProducts.push(...products);
  }

  const changedProducts = await fetchFlipkartChanges(since, fetcher);
  allProducts.push(...changedProducts);

  const uniqueProducts = Array.from(new Map(
    allProducts.map((product) => [product.gtin ? `gtin:${product.gtin}` : `sku:${product.sku}`, product]),
  ).values());

  if (feedUrls.length === 0 && changedProducts.length === 0) {
    throw new Error("Flipkart returned no feed URLs and no changes; catalog sync was not applied");
  }
  if (allProducts.length > 0 && uniqueProducts.length === 0) {
    throw new Error("Flipkart payload could not be normalized; catalog sync was not applied");
  }

  const result = await sharedUpsert(uniqueProducts, { source: "flipkart" });
  return {
    ...result,
    mode: "real" as const,
    feedCount: feedUrls.length,
    parsedCount: uniqueProducts.length,
    feedFetchedAt,
    expiredFeeds: 0,
    cursor: new Date().toISOString(),
  };
}
