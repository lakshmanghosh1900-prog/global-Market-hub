import assert from "node:assert/strict";
import test from "node:test";
import { addFlipkartAffiliateId } from "@/lib/affiliate";
import { listFlipkartFeeds } from "@/lib/connectors/flipkart";
import { isAllowedAffiliateUrl, isValidSignature, signatureFor } from "@/lib/redirect";

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

test("feed URLs are refetched from the list endpoint on a sync run", async () => {
  process.env.FLIPKART_AFFILIATE_ID = "test-affiliate";
  process.env.FLIPKART_AFFILIATE_TOKEN = "test-token";
  process.env.FLIPKART_API_BASE = "https://affiliate-api.flipkart.test/aff/api";

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

test("affiliate redirect tokens are signed and restricted to approved merchant hosts", () => {
  const url = "https://www.flipkart.com/item?pid=ABC123";
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signatureFor(timestamp, url);

  assert.equal(isAllowedAffiliateUrl(url), true);
  assert.equal(isValidSignature(timestamp, url, signature), true);
  assert.equal(isValidSignature(timestamp - 601, url, signatureFor(timestamp - 601, url)), false);
  assert.equal(isAllowedAffiliateUrl("https://flipkart.com.evil.example/item"), false);
  assert.equal(isAllowedAffiliateUrl("http://www.flipkart.com/item"), false);
});
