import type { PrismaClient } from "@prisma/client";

export const ALERT_CATEGORY_OPTIONS = [
  ["daily-needs", "Daily Needs"],
  ["pain-relief", "Pain Relief"],
  ["trending", "Trending"],
  ["tech", "Tech"],
  ["kids", "Kids"],
] as const;

export const ALERT_BRACKET_OPTIONS = [
  ["free", "Free"],
  ["under-99", "Under ₹99"],
  ["under-999", "Under ₹999"],
  ["flash-deals", "Flash Deals"],
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{8,15}$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_PRICE_INTEGER = "99999999";

export type ValidatedAlertInput = {
  email: string;
  phoneNo: string | null;
  whatsappNo: string | null;
  hasWhatsappConsent: boolean;
  consent: true;
  categories: string[];
  priceBrackets: string[];
  maxPrice: string | null;
};

export type AlertValidationResult =
  | { ok: true; value: ValidatedAlertInput }
  | { ok: false; error: string };

export type AlertSubscriptionWrite = {
  email: string;
  phoneNo: string | null;
  whatsappNo: string | null;
  hasWhatsappConsent: boolean;
  consentAt: Date;
  whatsappConsentAt: Date | null;
  categories: string[];
  priceBrackets: string[];
  maxPrice: string | null;
  isVerified: boolean;
  verificationToken: string;
  unsubscribeToken: string;
  isActive: boolean;
};

export type AlertSubscriptionStore = Pick<PrismaClient, "offerAlertSubscription">;

export function normalizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const email = value.trim().toLowerCase();
  const [localPart] = email.split("@");
  if (
    email.length === 0 ||
    email.length > MAX_EMAIL_LENGTH ||
    !localPart ||
    localPart.length > 64 ||
    !EMAIL_PATTERN.test(email)
  ) {
    return undefined;
  }

  return email;
}

/** Returns null for an omitted optional phone and undefined for an invalid one. */
export function normalizePhone(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const phone = trimmed.replace(/[\s()-]/g, "");
  if (phone.length > 16 || !PHONE_PATTERN.test(phone)) return undefined;
  if (phone.startsWith("+")) {
    const firstDigit = phone[1];
    if (!firstDigit || firstDigit === "0") return undefined;
  }

  return phone;
}

function optionValues(options: readonly (readonly [string, string])[]) {
  return new Set(options.map(([value]) => value));
}

function optionLabels(options: readonly (readonly [string, string])[]) {
  return options.map(([, label]) => label).join(", ");
}

function normalizeOptions(
  value: unknown,
  options: readonly (readonly [string, string])[],
  label: string,
): { values: string[] } | { error: string } {
  if (!Array.isArray(value)) {
    return { error: `${label} must be an array` };
  }

  const allowed = optionValues(options);
  const invalid = value.some((item) => typeof item !== "string" || !allowed.has(item));
  if (invalid) {
    return { error: `Choose only supported ${label.toLowerCase()}: ${optionLabels(options)}` };
  }

  const values = Array.from(new Set(value as string[]));
  if (!values.length) {
    return { error: `Choose at least one ${label.toLowerCase().replace(/s$/, "")}` };
  }

  return { values };
}

function normalizeMaxPrice(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && !value.trim()) return null;
  if (typeof value !== "string" && typeof value !== "number") return undefined;

  const raw = String(value).trim();
  if (!/^(?:0|[0-9]+)(?:\.[0-9]{1,2})?$/.test(raw)) return undefined;

  const [rawInteger, rawFraction = ""] = raw.split(".");
  const integer = rawInteger.replace(/^0+(?=\d)/, "");
  if (integer.length > MAX_PRICE_INTEGER.length || (integer.length === MAX_PRICE_INTEGER.length && integer > MAX_PRICE_INTEGER)) {
    return undefined;
  }

  return `${integer}.${rawFraction.padEnd(2, "0")}`;
}

export function validateAlertInput(input: unknown): AlertValidationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const body = input as Record<string, unknown>;
  const email = normalizeEmail(body.email);
  if (!email) return { ok: false, error: "Enter a valid email address" };

  const consent = body.consent === true || body.hasConsent === true;
  if (!consent) return { ok: false, error: "Consent is required before subscribing" };

  const phoneNo = normalizePhone(body.phoneNo);
  if (phoneNo === undefined) return { ok: false, error: "Enter a valid mobile number" };

  const hasWhatsappConsent = body.hasWhatsappConsent === true || body.whatsappConsent === true;
  const whatsappNo = hasWhatsappConsent ? normalizePhone(body.whatsappNo) : null;
  if (hasWhatsappConsent && (!whatsappNo || whatsappNo === undefined)) {
    return { ok: false, error: "Enter a valid WhatsApp number to opt in" };
  }

  const categories = normalizeOptions(body.categories, ALERT_CATEGORY_OPTIONS, "categories");
  if ("error" in categories) return { ok: false, error: categories.error };

  const priceBrackets = normalizeOptions(body.priceBrackets, ALERT_BRACKET_OPTIONS, "deal brackets");
  if ("error" in priceBrackets) return { ok: false, error: priceBrackets.error };

  const maxPrice = normalizeMaxPrice(body.maxPrice);
  if (maxPrice === undefined) {
    return { ok: false, error: "maxPrice must be a non-negative Decimal(10,2) value" };
  }

  return {
    ok: true,
    value: {
      email,
      phoneNo,
      whatsappNo: hasWhatsappConsent ? whatsappNo as string : null,
      hasWhatsappConsent,
      consent: true,
      categories: categories.values,
      priceBrackets: priceBrackets.values,
      maxPrice,
    },
  };
}

export function subscriptionWrite(
  input: ValidatedAlertInput,
  now: Date,
  verificationToken: string,
  unsubscribeToken = verificationToken,
): AlertSubscriptionWrite {
  return {
    email: input.email,
    phoneNo: input.phoneNo,
    whatsappNo: input.hasWhatsappConsent ? input.whatsappNo : null,
    hasWhatsappConsent: input.hasWhatsappConsent,
    consentAt: now,
    whatsappConsentAt: input.hasWhatsappConsent ? now : null,
    categories: input.categories,
    priceBrackets: input.priceBrackets,
    maxPrice: input.maxPrice,
    isVerified: false,
    verificationToken,
    unsubscribeToken,
    isActive: true,
  };
}

export async function upsertAlertSubscription(
  store: AlertSubscriptionStore,
  input: ValidatedAlertInput,
  now: Date,
  verificationToken: string,
  unsubscribeToken = verificationToken,
) {
  const write = subscriptionWrite(input, now, verificationToken, unsubscribeToken);
  return store.offerAlertSubscription.upsert({
    where: { email: input.email },
    create: write,
    update: write,
  });
}

export async function verifyPendingAlertSubscription(store: AlertSubscriptionStore, token: string) {
  return store.offerAlertSubscription.updateMany({
    where: { verificationToken: token, isActive: true, isVerified: false },
    data: { isVerified: true, isActive: true, verificationToken: null },
  });
}

export async function unsubscribeAlertSubscription(store: AlertSubscriptionStore, unsubscribeToken: string) {
  return store.offerAlertSubscription.updateMany({
    where: { unsubscribeToken, isActive: true },
    data: { isActive: false, verificationToken: null, unsubscribeToken: null },
  });
}

export function isAlertsDemoMode() {
  return process.env.NODE_ENV === "development" || process.env.ALERTS_DEMO_MODE === "true";
}
