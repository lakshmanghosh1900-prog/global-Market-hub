const placeholderValues = new Set([
  "",
  "placeholder",
  "your_flipkart_tracking_id",
  "your_flipkart_api_token",
]);

export const isConfiguredValue = (value: string | undefined) =>
  Boolean(value && !placeholderValues.has(value));

export const hasFlipkartCredentials = () =>
  isConfiguredValue(process.env.FLIPKART_AFFILIATE_ID) &&
  isConfiguredValue(process.env.FLIPKART_AFFILIATE_TOKEN || process.env.FLIPKART_TOKEN);

export const flipkartAffiliateId = () => process.env.FLIPKART_AFFILIATE_ID;
export const flipkartAffiliateToken = () => process.env.FLIPKART_AFFILIATE_TOKEN || process.env.FLIPKART_TOKEN;

export const flipkartApiBase = () =>
  process.env.FLIPKART_API_BASE ?? "https://affiliate-api.flipkart.net/aff/api";
