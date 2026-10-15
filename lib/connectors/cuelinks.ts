export type CuelinksDeal = { title: string; url: string; merchant: string; expiresAt?: string };

export async function fetchCuelinksDeals(fetcher: typeof fetch = fetch): Promise<CuelinksDeal[]> {
  const key = process.env.CUELINKS_API_KEY || process.env.CUELINKS_KEY;
  const endpoint = process.env.CUELINKS_ENDPOINT_DEALS || "/deals";
  if (!key || key === "pending" || key.includes("placeholder")) return [];
  const response = await fetch(`${process.env.CUELINKS_API_BASE || "https://api.cuelinks.com/v3"}${endpoint}`, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });
  if (!response.ok) throw new Error(`Cuelinks deals request failed with HTTP ${response.status}`);
  const body = (await response.json()) as { deals?: CuelinksDeal[]; data?: CuelinksDeal[] };
  return body.deals ?? body.data ?? [];
}
