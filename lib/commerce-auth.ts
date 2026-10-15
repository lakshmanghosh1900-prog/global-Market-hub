import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export const GUEST_SESSION_COOKIE = "gmh_guest_id";

const guestSecret = () => process.env.HMAC_SECRET || "local-development-guest-cookie-secret";
const signGuestId = (sessionId: string) => createHmac("sha256", guestSecret()).update(sessionId).digest("hex");

function readSignedGuestId(value: string | undefined) {
  if (!value) return null;
  const [sessionId, signature] = value.split(".");
  if (!sessionId || !signature) return null;
  const expected = Buffer.from(signGuestId(sessionId));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received) ? sessionId : null;
}

export async function getCommerceIdentity() {
  const user = await getCurrentUser();
  const cookieStore = cookies();
  const existingSession = readSignedGuestId(cookieStore.get(GUEST_SESSION_COOKIE)?.value);
  return {
    user,
    userId: user?.id ?? null,
    sessionId: existingSession || randomUUID(),
    needsCookie: !existingSession,
  };
}

export function setGuestCookie(response: Response, sessionId: string) {
  response.headers.append(
    "set-cookie",
    `${GUEST_SESSION_COOKIE}=${encodeURIComponent(`${sessionId}.${signGuestId(sessionId)}`)}; Path=/; Max-Age=31536000; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
}
