import assert from "node:assert/strict";
import test from "node:test";
import { addFlipkartAffiliateId, addMerchantAffiliateTracking, AMAZON_ASSOCIATE_TAG } from "@/lib/affiliate";
import { extractProducts, isAllowedFlipkartFeedUrl, listFlipkartFeeds } from "@/lib/connectors/flipkart";
import { createSignedRedirect, isAllowedAffiliateUrl, isValidSignature, signatureFor, trackedMerchantUrl } from "@/lib/redirect";
import { GET as outboundRedirect } from "@/app/out/route";
import { isPastOosRetention, normalizedTitle, sharedUpsert, shouldDelistMissingRuns, titleSimilarity } from "@/lib/products/upsert";

process.env.HMAC_SECRET = "unit-test-hmac-secret";

test("affiliate tracking is added without dropping existing query parameters", () => {
  const trackedUrl = addFlipkartAffiliateId(
    "https://www.flipkart.com/item?pid=ABC123",
    "sprint1",
  );

  assert.equal(
    trackedUrl,
    "https://www.flipkart.com/item?pid=ABC123&affid=sprint1",
  );
});

test("every Amazon decorator call enforces the production Associates tag", () => {
  const withoutQuery = addMerchantAffiliateTracking("https://www.amazon.in/dp/B000TEST", "Amazon-curated");
  const withQuery = addMerchantAffiliateTracking("https://www.amazon.in/dp/B000TEST?ref_=nav&tag=wrong-20", "unknown-merchant");

  assert.equal(new URL(withoutQuery).searchParams.get("tag"), AMAZON_ASSOCIATE_TAG);
  assert.equal(new URL(withQuery).searchParams.get("tag"), AMAZON_ASSOCIATE_TAG);
  assert.equal(new URL(trackedMerchantUrl("https://www.amazon.in/dp/B000TEST?psc=1")).searchParams.get("tag"), AMAZON_ASSOCIATE_TAG);
});

test("the /out handler requires an authoritative product identifier", async () => {
  const target = "https://www.amazon.in/dp/B000TEST?ref_=nav&psc=1";
  const signedPath = createSignedRedirect(target);
  const response = await outboundRedirect(new Request(`https://global-market-hub.test${signedPath}`));
  assert.equal(response.status, 401);
});

test("feed URLs are refetched from the list endpoint on a sync run", async () => {
  process.env.FLIPKART_AFFILIATE_ID = "test-affiliate";
  process.env.FLIPKART_AFFILIATE_TOKEN = "test-token";
  process.env.FLIPKART_API_BASE = "https://affiliate-api.flipkart.test/aff/api";
  process.env.FLIPKART_FEED_ALLOWED_HOSTS = "feed.flipkart.test";

  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    return {
      ok: true,
      status: 200,
      json: async () => ({ feeds: [{ url: "https://feed.flipkart.test/expired-later" }] }),
    } as Response;
  };

  const feeds = await listFlipkartFeeds(fetcher);

  assert.deepEqual(feeds, ["https://feed.flipkart.test/expired-later"]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.input, "https://affiliate-api.flipkart.test/aff/api/feed/affiliate/category");
  const headers = calls[0]?.init?.headers as Record<string, string>;
  assert.equal(headers["Fk-Affiliate-Id"], "test-affiliate");
  assert.equal(headers["Fk-Affiliate-Token"], "test-token");
});

test("Flipkart feed URLs are restricted before credentialed fetching", () => {
  process.env.FLIPKART_FEED_ALLOWED_HOSTS = "affiliate-api.flipkart.net,affiliate.flipkart.net";
  assert.equal(isAllowedFlipkartFeedUrl("https://affiliate-api.flipkart.net/feed/catalog"), true);
  assert.equal(isAllowedFlipkartFeedUrl("http://affiliate-api.flipkart.net/feed/catalog"), false);
  assert.equal(isAllowedFlipkartFeedUrl("https://localhost:5432/feed"), false);
  assert.equal(isAllowedFlipkartFeedUrl("https://evil.example/feed"), false);
});

test("affiliate redirect tokens are signed and restricted to approved merchant hosts", () => {
  const url = "https://www.flipkart.com/item?pid=ABC123";
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signatureFor(timestamp, url);

  assert.equal(isAllowedAffiliateUrl(url), true);
  assert.equal(isValidSignature(timestamp, url, signature), true);
  assert.equal(isValidSignature(timestamp - 601, url, signatureFor(timestamp - 601, url)), false);
  assert.equal(isAllowedAffiliateUrl("https://flipkart.com.evil.example/item"), false);
  assert.equal(isAllowedAffiliateUrl("http://www.flipkart.com/item"), false);
  assert.equal(isAllowedAffiliateUrl("https://fkrt.clnk.in/abc"), true);
  assert.equal(isAllowedAffiliateUrl("https://www.flipkart.com/"), false);
});

test("shared upsert policies cover OOS retention and three-run delisting", () => {
  const now = new Date("2026-10-16T00:00:00.000Z");
  assert.equal(isPastOosRetention(new Date("2026-10-09T00:00:00.000Z"), now), true);
  assert.equal(isPastOosRetention(new Date("2026-10-10T00:00:00.000Z"), now), false);
  assert.equal(shouldDelistMissingRuns(2), false);
  assert.equal(shouldDelistMissingRuns(3), true);
});

test("title dedup normalizes brand-style feed titles", () => {
  assert.equal(normalizedTitle("Flipkart SmartBuy — USB Cable"), "flipkart smartbuy usb cable");
  assert.equal(titleSimilarity("USB Cable 1m", "USB Cable 1 m") >= 0.9, true);
});

test("Flipkart product normalization injects affid and maps common taxonomy labels", () => {
  process.env.FLIPKART_AFFILIATE_ID = "test-affiliate";
  const products = extractProducts({ products: [{ sku: "M-1", title: "Phone", price: 99, category: "Mobiles & Accessories", productUrl: "https://www.flipkart.com/phone" }] });
  assert.equal(products.length, 1);
  assert.equal(products[0]?.category, "mobiles");
  assert.equal(new URL(products[0]?.affiliateUrl ?? "").searchParams.get("affid"), "test-affiliate");
});

test("empty syncs are rejected before missing-run delisting can run", async () => {
  await assert.rejects(() => sharedUpsert([], { source: "flipkart" }), /empty catalog sync/);
});
