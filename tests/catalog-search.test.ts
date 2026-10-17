import assert from "node:assert/strict";
import test from "node:test";
import { countryRegistry, getCountry } from "@/lib/countries";
import { canonicalCategories, resolveCategorySlug } from "@/lib/taxonomy";
import { searchProductsWithMeta } from "@/lib/products";
import { answerChat } from "@/lib/chat-knowledge";
import { hasRedirectSecret, isAllowedAffiliateUrl } from "@/lib/redirect";

test("country registry keeps India active and other markets preview-only", () => {
  assert.equal(getCountry("in")?.active, true);
  assert.equal(getCountry("ae")?.active, false);
  assert.equal(countryRegistry.length, 38);
  assert.deepEqual(getCountry("ae")?.supportedMerchants, []);
});

test("taxonomy aliases resolve to canonical categories without price-bracket leakage", () => {
  assert.equal(resolveCategorySlug("laptops"), "computers");
  assert.equal(resolveCategorySlug("mobile-phones"), "mobiles");
  assert.equal(canonicalCategories.some((category) => category.slug === "under-49"), false);
});

test("search combines the complete price bracket and relevance query", async () => {
  const result = await searchProductsWithMeta("USB", { bracket: "under-49", sort: "relevance", pageSize: 3 });
  assert.equal(result.total > 0, true);
  assert.equal(result.products.length <= 3, true);
  assert.equal(result.products.every((product) => product.price <= 49), true);
  assert.equal(result.products[0]?.title.toLowerCase().includes("usb"), true);
});

test("chat returns structured links and does not present fixture products as seller-eligible", async () => {
  const response = await answerChat("show products under 49");
  assert.equal(response.links.some((link) => link.href === "/in/under/under-49"), true);
  assert.equal(response.recommendations.every((product) => product.isFixture ? !product.sellerEligible : true), true);
});

test("redirect validation rejects generic seller homepages and placeholder HMAC configuration", () => {
  const previousSecret = process.env.HMAC_SECRET;
  process.env.HMAC_SECRET = "placeholder";
  assert.equal(hasRedirectSecret(), false);
  if (previousSecret === undefined) delete process.env.HMAC_SECRET;
  else process.env.HMAC_SECRET = previousSecret;
  assert.equal(isAllowedAffiliateUrl("https://www.flipkart.com/"), false);
  assert.equal(isAllowedAffiliateUrl("https://www.flipkart.com/item/p/itmock"), true);
});
