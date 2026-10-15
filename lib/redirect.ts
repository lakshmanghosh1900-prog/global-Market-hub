import { createHmac, timingSafeEqual } from "node:crypto";
import { addMerchantAffiliateTracking, merchantFromHost } from "@/lib/affiliate";

const MAX_AGE_SECONDS = 5 * 60;

export const redirectSecret = () =>
  process.env.HMAC_SECRET || process.env.AFFILIATE_REDIRECT_SECRET || "local-development-hmac-secret";

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
      allowedAffiliateHosts().includes(url.hostname.toLowerCase()) &&
      Boolean(merchantFromHost(url.hostname));
  } catch {
    return false;
  }
};

export const signatureFor = (timestamp: number, url: string) =>
  createHmac("sha256", redirectSecret()).update(`${timestamp}.${url}`).digest("hex");

export const isValidSignature = (timestamp: number, url: string, signature: string) => {
  if (!Number.isSafeInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > MAX_AGE_SECONDS) {
    return false;
  }

  const expected = Buffer.from(signatureFor(timestamp, url), "utf8");
  const received = Buffer.from(signature, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
};

export const createSignedRedirect = (url: string) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signatureFor(timestamp, url);
  return `/out?url=${encodeURIComponent(url)}&ts=${timestamp}&sig=${signature}`;
};

export const trackedMerchantUrl = (url: string) => {
  const parsed = new URL(url);
  const merchant = merchantFromHost(parsed.hostname);
  return merchant ? addMerchantAffiliateTracking(url, merchant) : url;
};
