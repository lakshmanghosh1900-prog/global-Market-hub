import { createHmac, timingSafeEqual } from "node:crypto";
import { addMerchantAffiliateTracking, merchantFromHost } from "@/lib/affiliate";
import { isConfiguredValue } from "@/lib/config";

const MAX_AGE_SECONDS = 5 * 60;

export const hasRedirectSecret = () => {
  const value = process.env.HMAC_SECRET || process.env.AFFILIATE_REDIRECT_SECRET;
  return isConfiguredValue(value) && !/placeholder|replace-with|local-development|pending/i.test(value as string);
};

export const redirectSecret = () => {
  if (hasRedirectSecret()) return (process.env.HMAC_SECRET || process.env.AFFILIATE_REDIRECT_SECRET) as string;
  if (process.env.NODE_ENV === "production") throw new Error("HMAC_SECRET is required for signed merchant redirects");
  return "test-only-redirect-secret";
};

export const allowedAffiliateHosts = () =>
  (process.env.AFFILIATE_ALLOWED_HOSTS || "www.flipkart.com,flipkart.com,amazon.in,www.amazon.in,cuelinks.com")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

export const isAllowedAffiliateUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname !== "/" &&
      allowedAffiliateHosts().includes(url.hostname.toLowerCase()) &&
      Boolean(merchantFromHost(url.hostname));
  } catch {
    return false;
  }
};

export const signatureFor = (timestamp: number, url: string, productId?: string) =>
  createHmac("sha256", redirectSecret()).update(productId ? `${timestamp}.${url}.${productId}` : `${timestamp}.${url}`).digest("hex");

export const isValidSignature = (timestamp: number, url: string, signature: string, productId?: string) => {
  if (!Number.isSafeInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > MAX_AGE_SECONDS) {
    return false;
  }

  const expected = Buffer.from(signatureFor(timestamp, url, productId), "utf8");
  const received = Buffer.from(signature, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
};

export const createSignedRedirect = (url: string, productId?: string) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signatureFor(timestamp, url, productId);
  const productPart = productId ? `&pid=${encodeURIComponent(productId)}` : "";
  return `/out?url=${encodeURIComponent(url)}&ts=${timestamp}&sig=${signature}${productPart}`;
};

export const trackedMerchantUrl = (url: string) => {
  const parsed = new URL(url);
  const merchant = merchantFromHost(parsed.hostname);
  return merchant ? addMerchantAffiliateTracking(url, merchant) : url;
};
