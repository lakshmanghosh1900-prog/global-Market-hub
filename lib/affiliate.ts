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
