import { addFlipkartAffiliateId } from "@/lib/affiliate";
import { flipkartApiBase, hasFlipkartCredentials } from "@/lib/config";
import { sharedUpsert, type SyncProduct } from "@/lib/products/upsert";
import categoryMap from "@/data/category_map.json";

const FLIPKART_MERCHANT = "Flipkart";
export const FLIPKART_FEED_EXPIRY_HOURS = 10;

type JsonRecord = Record<string, unknown>;
type FetchLike = typeof fetch;

const flipkartHeaders = () => ({
  Accept: "application/json",
  "Fk-Affiliate-Id": process.env.FLIPKART_AFFILIATE_ID ?? "",
  "Fk-Affiliate-Token": process.env.FLIPKART_AFFILIATE_TOKEN ?? "",
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

/**
 * Feed URLs expire after ten hours. This deliberately calls the feed-list
 * endpoint on every sync instead of caching or persisting the returned URLs.
 */
export async function listFlipkartFeeds(fetcher: FetchLike = fetch) {
  const response = await fetcher(`${flipkartApiBase()}/feed/affiliate/category`, {
    headers: flipkartHeaders(),
  });
  const body = await getJson(response);
  const candidates = nestedArray(body, ["feeds", "feed", "data", "results"]);

  return asRecords(candidates.length > 0 ? candidates : body)
    .map((feed) => feed.url ?? feed.feedUrl ?? feed.link)
    .filter((url): url is string => typeof url === "string" && url.length > 0);
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

const normalizeProduct = (record: JsonRecord): SyncProduct | null => {
  const sku = firstString(record, ["sku", "productId", "product_id", "id"]);
  const title = firstString(record, ["title", "name", "productName"]);
  const price = firstNumber(record, ["price", "sellingPrice", "selling_price"]);
  const affiliateUrl = firstString(record, ["productUrl", "product_url", "url"]);

  if (!sku || !title || price === null || !affiliateUrl) {
    return null;
  }

  const sourceCategory = firstString(record, ["category", "categoryName", "category_name"]);
  const normalizedCategory = sourceCategory
    ? categoryMap[sourceCategory.toLowerCase() as keyof typeof categoryMap] ?? sourceCategory.toLowerCase()
    : "under-49";

  return {
    sku,
    title,
    price,
    mrp: firstNumber(record, ["mrp", "maximumRetailPrice", "maximum_retail_price"]),
    brand: firstString(record, ["brand", "brandName"]),
    image: firstString(record, ["image", "imageUrl", "image_url"]),
    affiliateUrl: addFlipkartAffiliateId(affiliateUrl),
    merchant: FLIPKART_MERCHANT,
    inStock: firstBoolean(record, ["inStock", "in_stock", "availability", "stock"]),
    category: normalizedCategory,
  };
};

const extractProducts = (body: unknown) => {
  const products = nestedArray(body, ["products", "product", "items", "data", "results"]);
  return asRecords(products.length > 0 ? products : body)
    .map(normalizeProduct)
    .filter((product): product is SyncProduct => product !== null);
};

export async function syncFlipkart(fetcher: FetchLike = fetch) {
  if (!hasFlipkartCredentials()) {
    throw new Error(
      "Flipkart credentials are not configured. Set FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN before syncing.",
    );
  }

  // Refetch the list first on every run because feed URLs expire after 10h.
  const feedUrls = await listFlipkartFeeds(fetcher);
  const allProducts: SyncProduct[] = [];

  for (const feedUrl of feedUrls) {
    const response = await fetcher(feedUrl, { headers: flipkartHeaders() });
    const products = extractProducts(await getJson(response));
    allProducts.push(...products);
  }

  const uniqueProducts = Array.from(
    new Map(allProducts.map((product) => [product.sku, product])).values(),
  );

  return sharedUpsert(uniqueProducts, { source: "flipkart" });
}
