import { isConfiguredValue } from "@/lib/config";

/** The production Amazon Associates tag used on every amazon.in outbound URL. */
export const AMAZON_ASSOCIATE_TAG = "globalmarketh-21";

export const addFlipkartAffiliateId = (
  productUrl: string,
  affiliateId = process.env.FLIPKART_AFFILIATE_ID,
) => {
  if (!affiliateId || !isConfiguredValue(affiliateId)) {
    return productUrl;
  }

  const url = new URL(productUrl);
  url.searchParams.set("affid", affiliateId);
  return url.toString();
};

export const merchantFromHost = (hostname: string) => {
  const host = hostname.toLowerCase();
  if (host === "flipkart.com" || host.endsWith(".flipkart.com")) return "Flipkart";
  if (host === "amazon.in" || host.endsWith(".amazon.in")) return "Amazon-curated";
  if (host === "cuelinks.com" || host.endsWith(".cuelinks.com")) return "Cuelinks";
  return null;
};

export const addMerchantAffiliateTracking = (productUrl: string, merchant: string) => {
  const url = new URL(productUrl);
  if (merchant === "Flipkart" && isConfiguredValue(process.env.FLIPKART_AFFILIATE_ID)) {
    url.searchParams.set("affid", process.env.FLIPKART_AFFILIATE_ID as string);
  }

  // Resolve from the URL as the source of truth. This prevents a caller with a
  // stale or generic merchant label from bypassing Amazon decoration.
  if (merchantFromHost(url.hostname) === "Amazon-curated") {
    url.searchParams.set("tag", AMAZON_ASSOCIATE_TAG);
  }
  return url.toString();
};
