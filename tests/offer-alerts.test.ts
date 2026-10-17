import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "@/app/api/alerts/subscribe/route";
import {
  type AlertSubscriptionStore,
  normalizePhone,
  unsubscribeAlertSubscription,
  upsertAlertSubscription,
  validateAlertInput,
  verifyPendingAlertSubscription,
  type ValidatedAlertInput,
} from "@/lib/offer-alerts";

const baseBody = {
  email: "shopper@example.com",
  consent: true,
  categories: ["trending"],
  priceBrackets: ["under-99"],
};

function validated(body: Record<string, unknown> = baseBody): ValidatedAlertInput {
  const result = validateAlertInput(body);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

function mockStore() {
  const upsertCalls: unknown[] = [];
  const updateManyCalls: unknown[] = [];
  const store = {
    offerAlertSubscription: {
      upsert: async (args: unknown) => {
        upsertCalls.push(args);
        return { email: "shopper@example.com" };
      },
      updateMany: async (args: unknown) => {
        updateManyCalls.push(args);
        return { count: 1 };
      },
    },
  } as unknown as AlertSubscriptionStore;
  return { store, upsertCalls, updateManyCalls };
}

async function responseForJson(body: string) {
  return POST(new Request("http://localhost/api/alerts/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  }));
}

test("subscribe rejects malformed, null, array, and invalid preference JSON bodies", async () => {
  assert.equal((await responseForJson("{broken")).status, 400);
  assert.equal((await responseForJson("null")).status, 400);
  assert.equal((await responseForJson("[\"trending\"]")).status, 400);

  const invalidCategory = await responseForJson(JSON.stringify({ ...baseBody, categories: ["not-a-category"] }));
  assert.equal(invalidCategory.status, 400);
  assert.match((await invalidCategory.json()).error, /Daily Needs.*Pain Relief.*Trending.*Tech.*Kids/);

  const invalidBracket = await responseForJson(JSON.stringify({ ...baseBody, priceBrackets: ["under-100"] }));
  assert.equal(invalidBracket.status, 400);
  assert.match((await invalidBracket.json()).error, /Free.*Under ₹99.*Under ₹999.*Flash Deals/);
});

test("validation normalizes bounded email and international/local optional phones", () => {
  assert.equal(normalizePhone("+91 (98765) 43210"), "+919876543210");
  assert.equal(normalizePhone("09876-543210"), "09876543210");
  assert.equal(normalizePhone("   "), null);

  const result = validateAlertInput({
    ...baseBody,
    email: "  Shopper@Example.COM  ",
    phoneNo: "+91 (98765) 43210",
    maxPrice: "001234.5",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.email, "shopper@example.com");
    assert.equal(result.value.phoneNo, "+919876543210");
    assert.equal(result.value.maxPrice, "1234.50");
  }

  assert.equal(validateAlertInput({ ...baseBody, email: `${"a".repeat(245)}@example.com` }).ok, false);
  assert.equal(validateAlertInput({ ...baseBody, maxPrice: "100000000.00" }).ok, false);
  assert.equal(validateAlertInput({ ...baseBody, maxPrice: "12.345" }).ok, false);
});

test("consent and WhatsApp opt-in boundaries prevent unapproved data from being persisted", async () => {
  const { store, upsertCalls } = mockStore();
  assert.equal(validateAlertInput({ ...baseBody, consent: false }).ok, false);
  assert.equal(validateAlertInput({ ...baseBody, hasWhatsappConsent: true }).ok, false);
  assert.equal(validateAlertInput({ ...baseBody, hasWhatsappConsent: true, whatsappNo: "   " }).ok, false);

  const withoutWhatsappOptIn = validated({
    ...baseBody,
    whatsappNo: "+919876543210",
    whatsappConsentAt: "2030-01-01T00:00:00.000Z",
  });
  await upsertAlertSubscription(store, withoutWhatsappOptIn, new Date("2026-10-16T00:00:00.000Z"), "token-without-opt-in");
  const args = upsertCalls[0] as { create: Record<string, unknown>; update: Record<string, unknown> };
  assert.equal(args.create.hasWhatsappConsent, false);
  assert.equal(args.create.whatsappNo, null);
  assert.equal(args.create.whatsappConsentAt, null);
  assert.equal(args.update.whatsappNo, null);
  assert.equal(typeof args.create.unsubscribeToken, "string");
});

test("subscribe upsert keeps normalized fields, server timestamps, Decimal(10,2) price, and a single-use token", async () => {
  const { store, upsertCalls } = mockStore();
  const now = new Date("2026-10-16T12:34:56.000Z");
  const input = validated({
    ...baseBody,
    email: "  Shopper@Example.COM ",
    phoneNo: "09876-543210",
    hasWhatsappConsent: true,
    whatsappNo: "+91 98765 43210",
    maxPrice: "99999999.99",
    consentAt: "2000-01-01T00:00:00.000Z",
    whatsappConsentAt: "2000-01-01T00:00:00.000Z",
  });

  await upsertAlertSubscription(store, input, now, "a".repeat(64));
  const args = upsertCalls[0] as {
    where: { email: string };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  };
  assert.deepEqual(args.where, { email: "shopper@example.com" });
  assert.equal(args.create.email, "shopper@example.com");
  assert.equal(args.create.phoneNo, "09876543210");
  assert.equal(args.create.whatsappNo, "+919876543210");
  assert.equal(args.create.hasWhatsappConsent, true);
  assert.equal((args.create.maxPrice as string).toString(), "99999999.99");
  assert.equal((args.create.consentAt as Date).getTime(), now.getTime());
  assert.equal((args.create.whatsappConsentAt as Date).getTime(), now.getTime());
  assert.notEqual((args.create.consentAt as Date).toISOString(), "2000-01-01T00:00:00.000Z");
  assert.equal(args.create.isVerified, false);
  assert.equal(args.create.isActive, true);
  assert.equal(args.create.verificationToken, "a".repeat(64));
  assert.deepEqual(args.update, args.create);
});

test("verification is atomic, active-only, and single-use", async () => {
  let token: string | null = "pending-token";
  let active = true;
  let verified = false;
  const calls: unknown[] = [];
  const store = {
    offerAlertSubscription: {
      updateMany: async (args: { where: { verificationToken: string; isActive: boolean; isVerified: boolean }; data: Record<string, unknown> }) => {
        calls.push(args);
        const matches = token === args.where.verificationToken && active === args.where.isActive && verified === args.where.isVerified;
        if (!matches) return { count: 0 };
        token = null;
        verified = true;
        return { count: 1 };
      },
    },
  } as unknown as AlertSubscriptionStore;

  const first = await verifyPendingAlertSubscription(store, "pending-token");
  const second = await verifyPendingAlertSubscription(store, "pending-token");
  assert.equal(first.count, 1);
  assert.equal(second.count, 0);
  assert.deepEqual(calls[0], {
    where: { verificationToken: "pending-token", isActive: true, isVerified: false },
    data: { isVerified: true, isActive: true, verificationToken: null },
  });
});

test("unsubscribe clears pending tokens so an old link cannot reactivate the record", async () => {
  let token: string | null = "pending-token";
  let active = true;
  const calls: unknown[] = [];
  const store = {
    offerAlertSubscription: {
      updateMany: async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        calls.push(args);
        if (args.where.unsubscribeToken === "pending-token") {
          active = false;
          token = null;
          return { count: 1 };
        }
        if (args.where.verificationToken === token && args.where.isActive === true && args.where.isVerified === false && active) {
          active = true;
          token = null;
          return { count: 1 };
        }
        return { count: 0 };
      },
    },
  } as unknown as AlertSubscriptionStore;

  await unsubscribeAlertSubscription(store, "pending-token");
  const verification = await verifyPendingAlertSubscription(store, "pending-token");
  assert.equal(verification.count, 0);
  assert.deepEqual(calls[0], {
    where: { unsubscribeToken: "pending-token", isActive: true },
    data: { isActive: false, verificationToken: null, unsubscribeToken: null },
  });
  assert.deepEqual(calls[1], {
    where: { verificationToken: "pending-token", isActive: true, isVerified: false },
    data: { isVerified: true, isActive: true, verificationToken: null },
  });
});
