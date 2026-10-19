const placeholderValues = new Set([
  "",
  "placeholder",
  "your_flipkart_tracking_id",
  "your_flipkart_api_token",
  "pending",
  "replace-with-a-long-random-admin-secret",
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

export const cuelinksApiBase = () =>
  (process.env.CUELINKS_API_BASE ?? "https://developers.cuelinks.com/pub_api/v3").replace(/\/$/, "");

export const cuelinksApiKey = () => process.env.CUELINKS_API_KEY || process.env.CUELINKS_KEY;

export const hasCuelinksCredentials = () => isConfiguredValue(cuelinksApiKey());

export const cuelinksCampaignsPath = () => process.env.CUELINKS_ENDPOINT_CAMPAIGNS ?? "/campaigns";
export const cuelinksOffersPath = () => process.env.CUELINKS_ENDPOINT_OFFERS ?? "/offers";
export const cuelinksLinkConvertPath = () => process.env.CUELINKS_ENDPOINT_LINKS_CONVERT ?? "/links/convert";

export const cuelinksTrackingHosts = () =>
  (process.env.CUELINKS_TRACKING_HOSTS ?? "clnk.in,linksredirect.com")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
