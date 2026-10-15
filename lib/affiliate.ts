import { isConfiguredValue } from "@/lib/config";

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
  const amazonTag = process.env.AMAZON_ASSOCIATES_TAG || process.env.AMAZON_TAG;
  if (merchant === "Amazon-curated" && isConfiguredValue(amazonTag)) {
    url.searchParams.set("tag", amazonTag as string);
  }
  return url.toString();
};
