import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export const GUEST_SESSION_COOKIE = "gmh_guest_id";

export async function getCommerceIdentity() {
  const user = await getCurrentUser();
  const cookieStore = cookies();
  const existingSession = cookieStore.get(GUEST_SESSION_COOKIE)?.value;
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
    `${GUEST_SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=31536000; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
}
