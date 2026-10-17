import {
  cuelinksApiBase,
  cuelinksApiKey,
  cuelinksCampaignsPath,
  cuelinksLinkConvertPath,
  cuelinksOffersPath,
  cuelinksTrackingHosts,
  hasCuelinksCredentials,
} from "@/lib/config";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

export type CuelinksCategory = { id: number; name: string };

export type CuelinksCampaign = {
  id: number;
  name: string;
  url: string;
  domain: string;
  access_status: string;
  campaign_type?: string;
  deeplink_allowed?: boolean;
  tracking_url?: string | null;
  categories?: CuelinksCategory[];
  countries?: Array<{ id: number; iso: string; name: string }>;
  updated_at?: string;
};

export type CuelinksOffer = {
  id: number;
  title: string;
  description?: string | null;
  terms?: string | null;
  coupon_code?: string | null;
  offer_type: "coupon" | "deal" | string;
  campaign_id: number;
  campaign_name: string;
  categories?: CuelinksCategory[];
  tracking_url?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  original_price?: number | null;
  discount_price?: number | null;
  percent_off?: number | null;
  shipping_charge?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CuelinksLinkConversion = {
  tracking_url: string;
  short_url?: string;
  affiliated: boolean;
  original_url: string;
  campaign: { id: number; name: string } | null;
};

export type CuelinksApiStatus = {
  configured: boolean;
  baseUrl: string;
  authScheme: "Token";
  lastError?: string;
};

export class CuelinksApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string) {
    super(message);
    this.name = "CuelinksApiError";
  }
}

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function authHeaders() {
  const key = cuelinksApiKey();
  return {
    Accept: "application/json",
    "content-type": "application/json",
    ...(key ? { Authorization: `Token ${key}` } : {}),
  };
}

function safeErrorMessage(status: number) {
  if (status === 401) return "Cuelinks authentication failed";
  if (status === 403) return "Cuelinks permission is insufficient for this endpoint";
  if (status === 429) return "Cuelinks rate limit reached";
  if (status >= 500) return "Cuelinks is temporarily unavailable";
  return `Cuelinks request failed with HTTP ${status}`;
}

async function fetchJson<T>(path: string, init: RequestInit = {}, fetcher: typeof fetch = fetch): Promise<T> {
  if (!hasCuelinksCredentials()) throw new CuelinksApiError(0, "Cuelinks API credentials are not configured", "CUELINKS_CREDENTIALS_MISSING");
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetcher(`${cuelinksApiBase()}${path.startsWith("/") ? path : `/${path}`}`, {
        ...init,
        headers: { ...authHeaders(), ...(init.headers ?? {}) },
        signal: controller.signal,
      });
      if (response.ok) {
        const body = await response.json() as T;
        if (!body || typeof body !== "object") throw new CuelinksApiError(200, "Cuelinks returned an invalid response", "CUELINKS_RESPONSE_INVALID");
        return body;
      }
      const error = new CuelinksApiError(response.status, safeErrorMessage(response.status), response.status === 429 ? "CUELINKS_RATE_LIMITED" : undefined);
      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
        lastError = error;
      } else {
        throw error;
      }
    } catch (error) {
      lastError = error;
      const retryable = error instanceof CuelinksApiError && (error.status === 429 || error.status >= 500);
      if (!retryable && !(error instanceof TypeError) && !(error instanceof DOMException)) throw error;
      if (attempt === MAX_RETRIES) {
        if (error instanceof DOMException && error.name === "AbortError") throw new CuelinksApiError(408, "Cuelinks request timed out", "CUELINKS_TIMEOUT");
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }
    await sleep(250 * 2 ** attempt);
  }
  throw lastError instanceof Error ? lastError : new CuelinksApiError(502, "Cuelinks request failed", "CUELINKS_UPSTREAM_ERROR");
}

function pageQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  return query.toString() ? `?${query.toString()}` : "";
}

function validateMeta(body: unknown) {
  if (typeof body !== "object" || body === null || typeof (body as { data?: unknown }).data === "undefined") {
    throw new CuelinksApiError(200, "Cuelinks response is missing data", "CUELINKS_RESPONSE_INVALID");
  }
  return body as { data: unknown; meta?: { page?: number; total_pages?: number; next_page?: number | null } };
}

function validateCampaign(value: unknown): CuelinksCampaign | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Partial<CuelinksCampaign>;
  if (!Number.isInteger(row.id) || typeof row.name !== "string" || typeof row.domain !== "string" || typeof row.access_status !== "string") return null;
  return row as CuelinksCampaign;
}

function validateOffer(value: unknown): CuelinksOffer | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Partial<CuelinksOffer>;
  if (!Number.isInteger(row.id) || typeof row.title !== "string" || !Number.isInteger(row.campaign_id) || typeof row.campaign_name !== "string" || typeof row.offer_type !== "string" || typeof row.status !== "string") return null;
  if (row.tracking_url !== null && row.tracking_url !== undefined && typeof row.tracking_url !== "string") return null;
  return row as CuelinksOffer;
}

export const isCuelinksTrackingUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && cuelinksTrackingHosts().some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
};

function providerDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

export function isCuelinksDateWindowOpen(startDate: string | null | undefined, endDate: string | null | undefined, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const start = providerDate(startDate);
  const end = providerDate(endDate);
  if (startDate && !start) return false;
  if (endDate && !end) return false;
  return (!start || start <= today) && (!end || end >= today);
}

export function isCuelinksOfferEligible(offer: Pick<CuelinksOffer, "status" | "tracking_url" | "start_date" | "end_date">, now = new Date()) {
  return offer.status === "live" && typeof offer.tracking_url === "string" && isCuelinksTrackingUrl(offer.tracking_url) && isCuelinksDateWindowOpen(offer.start_date, offer.end_date, now);
}

export async function pingCuelinks(fetcher: typeof fetch = fetch) {
  return fetchJson<{ data?: { status?: string } }>("/ping", {}, fetcher);
}

export async function fetchCuelinksCampaigns(options: { page?: number; perPage?: number; q?: string; accessStatus?: string } = {}, fetcher: typeof fetch = fetch) {
  const body = validateMeta(await fetchJson<unknown>(`${cuelinksCampaignsPath()}${pageQuery({ page: options.page ?? 1, per_page: Math.min(500, options.perPage ?? 100), q: options.q, access_status: options.accessStatus })}`, {}, fetcher));
  if (!Array.isArray(body.data)) throw new CuelinksApiError(200, "Cuelinks campaigns data is not an array", "CUELINKS_RESPONSE_INVALID");
  const campaigns = body.data.map(validateCampaign);
  if (campaigns.some((row) => row === null)) throw new CuelinksApiError(200, "Cuelinks campaigns response contains malformed records", "CUELINKS_RESPONSE_INVALID");
  return { campaigns: campaigns as CuelinksCampaign[], meta: body.meta ?? {} };
}

export async function fetchAllCuelinksCampaigns(options: Omit<Parameters<typeof fetchCuelinksCampaigns>[0], "page"> = {}, fetcher: typeof fetch = fetch) {
  const campaigns: CuelinksCampaign[] = [];
  let page = 1;
  while (page <= 50) {
    const result = await fetchCuelinksCampaigns({ ...options, page }, fetcher);
    campaigns.push(...result.campaigns);
    if (!result.meta.next_page && (!result.meta.total_pages || page >= result.meta.total_pages)) break;
    page = result.meta.next_page ?? page + 1;
  }
  return campaigns;
}

export async function fetchCuelinksOffers(options: { page?: number; perPage?: number; campaignId?: number; offerType?: "coupon" | "deal"; validOn?: string } = {}, fetcher: typeof fetch = fetch) {
  const body = validateMeta(await fetchJson<unknown>(`${cuelinksOffersPath()}${pageQuery({ page: options.page ?? 1, per_page: Math.min(500, options.perPage ?? 100), campaign_id: options.campaignId, offer_type: options.offerType, valid_on: options.validOn })}`, {}, fetcher));
  if (!Array.isArray(body.data)) throw new CuelinksApiError(200, "Cuelinks offers data is not an array", "CUELINKS_RESPONSE_INVALID");
  const offers = body.data.map(validateOffer);
  if (offers.some((row) => row === null)) throw new CuelinksApiError(200, "Cuelinks offers response contains malformed records", "CUELINKS_RESPONSE_INVALID");
  return { offers: offers as CuelinksOffer[], meta: body.meta ?? {} };
}

export async function fetchAllCuelinksOffers(options: Omit<Parameters<typeof fetchCuelinksOffers>[0], "page"> = {}, fetcher: typeof fetch = fetch) {
  const offers: CuelinksOffer[] = [];
  let page = 1;
  while (page <= 50) {
    const result = await fetchCuelinksOffers({ ...options, page }, fetcher);
    offers.push(...result.offers);
    if (!result.meta.next_page && (!result.meta.total_pages || page >= result.meta.total_pages)) break;
    page = result.meta.next_page ?? page + 1;
  }
  return offers;
}

export async function convertCuelinksLink(input: { url: string; channelId?: number; shorten?: boolean; referralUrl?: string }, fetcher: typeof fetch = fetch): Promise<CuelinksLinkConversion> {
  let original: URL;
  try {
    original = new URL(input.url);
    if (original.protocol !== "https:" || original.pathname === "/") throw new Error("invalid");
  } catch {
    throw new CuelinksApiError(422, "Cuelinks conversion requires an exact HTTPS product URL", "CUELINKS_INVALID_URL");
  }
  const body = await fetchJson<{ data?: unknown }>(cuelinksLinkConvertPath(), {
    method: "POST",
    body: JSON.stringify({ url: original.toString(), ...(input.channelId ? { channel_id: input.channelId } : {}), ...(input.shorten !== undefined ? { shorten: input.shorten } : {}), ...(input.referralUrl ? { referral_url: input.referralUrl } : {}) }),
  }, fetcher);
  if (typeof body.data !== "object" || body.data === null) throw new CuelinksApiError(200, "Cuelinks conversion response is invalid", "CUELINKS_RESPONSE_INVALID");
  const result = body.data as Partial<CuelinksLinkConversion>;
  if (typeof result.tracking_url !== "string" || typeof result.affiliated !== "boolean" || typeof result.original_url !== "string" || !isCuelinksTrackingUrl(result.tracking_url)) throw new CuelinksApiError(200, "Cuelinks returned an invalid tracking response", "CUELINKS_RESPONSE_INVALID");
  if (result.original_url !== original.toString()) throw new CuelinksApiError(200, "Cuelinks original URL does not match the requested destination", "CUELINKS_RESPONSE_INVALID");
  return result as CuelinksLinkConversion;
}

export type CuelinksDeal = CuelinksOffer;

export async function fetchCuelinksDeals(fetcher: typeof fetch = fetch): Promise<CuelinksOffer[]> {
  return fetchAllCuelinksOffers({ offerType: "deal" }, fetcher);
}

export function cuelinksStatus(): CuelinksApiStatus {
  return { configured: hasCuelinksCredentials(), baseUrl: cuelinksApiBase(), authScheme: "Token" };
}
