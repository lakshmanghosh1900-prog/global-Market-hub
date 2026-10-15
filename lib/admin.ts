import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "gmh_admin_session";

export function isAdminSecretConfigured() {
  const secret = process.env.ADMIN_SECRET;
  return Boolean(secret && secret !== "placeholder" && secret.length >= 8);
}

function matchesSecret(candidate: string | null | undefined) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isAdminRequest(request: Request, providedSecret?: string) {
  const url = new URL(request.url);
  return isAdminSecretConfigured() && (
    matchesSecret(providedSecret) ||
    matchesSecret(url.searchParams.get("admin_secret")) ||
    matchesSecret(request.headers.get("x-admin-secret")) ||
    matchesSecret(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")) ||
    matchesSecret(decodeURIComponent(request.headers.get("cookie")?.match(/(?:^|;\s*)gmh_admin_session=([^;]+)/)?.[1] ?? ""))
  );
}

export function adminCookieHeader() {
  const secret = process.env.ADMIN_SECRET;
  return secret ? `${ADMIN_COOKIE}=${encodeURIComponent(secret)}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=28800${process.env.NODE_ENV === "production" ? "; Secure" : ""}` : "";
}

export function hasAdminCookie() {
  return matchesSecret(cookies().get(ADMIN_COOKIE)?.value);
}
