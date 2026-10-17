import assert from "node:assert/strict";
import test from "node:test";
import { convertCuelinksLink, fetchAllCuelinksCampaigns, fetchAllCuelinksOffers, fetchCuelinksDeals, isCuelinksDateWindowOpen, isCuelinksOfferEligible, isCuelinksTrackingUrl } from "@/lib/connectors/cuelinks";

const previousKey = process.env.CUELINKS_API_KEY;
const previousBase = process.env.CUELINKS_API_BASE;
process.env.CUELINKS_API_KEY = "unit-test-cuelinks-key";
process.env.CUELINKS_API_BASE = "https://developers.cuelinks.com/pub_api/v3";

test.after(() => {
  if (previousKey === undefined) delete process.env.CUELINKS_API_KEY;
  else process.env.CUELINKS_API_KEY = previousKey;
  if (previousBase === undefined) delete process.env.CUELINKS_API_BASE;
  else process.env.CUELINKS_API_BASE = previousBase;
});

test("Cuelinks campaigns paginate with the documented Token authorization", async () => {
  const calls: Array<{ url: string; headers?: HeadersInit }> = [];
  const campaigns = await fetchAllCuelinksCampaigns({ perPage: 2 }, async (input, init) => {
    calls.push({ url: String(input), headers: init?.headers });
    const url = new URL(String(input));
    const page = Number(url.searchParams.get("page"));
    return new Response(JSON.stringify({ data: [{ id: page, name: `Campaign ${page}`, url: "https://www.flipkart.com/campaign", domain: "flipkart.com", access_status: page === 1 ? "open" : "approved" }], meta: { page, total_pages: 2, next_page: page === 1 ? 2 : null } }), { status: 200 });
  });
  assert.equal(campaigns.length, 2);
  assert.equal(calls[0]?.url.includes("per_page=2"), true);
  assert.equal(new Headers(calls[0]?.headers).get("authorization"), "Token unit-test-cuelinks-key");
});

test("Cuelinks offers are validated, paginated and deduplicated by the caller", async () => {
  let calls = 0;
  const offers = await fetchAllCuelinksOffers({}, async () => {
    calls += 1;
    return new Response(JSON.stringify({ data: [{ id: 10, title: "10% off", offer_type: "coupon", campaign_id: 4, campaign_name: "Flipkart", status: "live", tracking_url: "https://fkrt.clnk.in/abc" }], meta: { page: 1, total_pages: 1, next_page: null } }), { status: 200 });
  });
  assert.equal(calls, 1);
  assert.equal(offers.length, 1);
  assert.equal(offers[0]?.tracking_url, "https://fkrt.clnk.in/abc");
  assert.equal(isCuelinksTrackingUrl("https://fkrt.clnk.in/abc"), true);
  assert.equal(isCuelinksTrackingUrl("https://evil.example/abc"), false);
});

test("placeholder Cuelinks credentials do not make network calls", async () => {
  const original = process.env.CUELINKS_API_KEY;
  process.env.CUELINKS_API_KEY = "placeholder";
  let called = false;
  await assert.rejects(() => fetchCuelinksDeals(async () => { called = true; return new Response("{}", { status: 200 }); }), /credentials are not configured/);
  assert.equal(called, false);
  process.env.CUELINKS_API_KEY = original;
});

test("Cuelinks conversion validates original URL and tracking response", async () => {
  const result = await convertCuelinksLink({ url: "https://www.flipkart.com/item/p/it123", referralUrl: "https://global-market-hub.example/article" }, async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.url, "https://www.flipkart.com/item/p/it123");
    assert.equal(body.referral_url, "https://global-market-hub.example/article");
    return new Response(JSON.stringify({ data: { tracking_url: "https://linksredirect.com/?cid=1", affiliated: true, original_url: body.url, campaign: { id: 1, name: "Flipkart" } } }), { status: 200 });
  });
  assert.equal(result.affiliated, true);
  assert.equal(result.original_url, "https://www.flipkart.com/item/p/it123");
  await assert.rejects(() => convertCuelinksLink({ url: "https://www.flipkart.com/" }, async () => new Response("{}", { status: 200 })), /exact HTTPS product URL/);
});

test("Cuelinks affiliated false remains an explicit non-eligible result", async () => {
  const result = await convertCuelinksLink({ url: "https://www.flipkart.com/item/p/it124" }, async () => new Response(JSON.stringify({ data: { tracking_url: "https://linksredirect.com/?cid=2", affiliated: false, original_url: "https://www.flipkart.com/item/p/it124", campaign: null } }), { status: 200 }));
  assert.equal(result.affiliated, false);
  assert.equal(result.campaign, null);
});

test("malformed provider data and provider errors fail safely", async () => {
  await assert.rejects(() => fetchAllCuelinksOffers({}, async () => new Response(JSON.stringify({ data: [{ id: "bad" }] }), { status: 200 })), /Cuelinks (offers data is not an array|offers response)/);
  await assert.rejects(() => fetchAllCuelinksCampaigns({}, async () => new Response("", { status: 401 })), /authentication failed/);
});

test("Cuelinks offers are not eligible before their start date or after their end date", () => {
  const now = new Date("2026-10-17T12:00:00.000Z");
  assert.equal(isCuelinksDateWindowOpen("2026-10-18", "2026-10-20", now), false);
  assert.equal(isCuelinksDateWindowOpen("2026-10-10", "2026-10-16", now), false);
  assert.equal(isCuelinksDateWindowOpen("2026-10-17", "2026-10-20", now), true);
  assert.equal(isCuelinksOfferEligible({ status: "live", tracking_url: "https://linksredirect.com/?cid=3", start_date: "2026-10-18", end_date: null }, now), false);
});
