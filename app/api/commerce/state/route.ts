import { NextResponse } from "next/server";
import { getCommerceIdentity, setGuestCookie } from "@/lib/commerce-auth";
import { readCommerceState } from "@/lib/commerce-state";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getCommerceIdentity();
  try {
    const state = await readCommerceState(identity.userId, identity.sessionId);
    const response = NextResponse.json({ ...state, authenticated: Boolean(identity.user), email: identity.user?.email ?? null });
    if (identity.needsCookie) setGuestCookie(response, identity.sessionId);
    return response;
  } catch {
    const response = NextResponse.json({ cart: [], wishlist: [], alerts: [], authenticated: Boolean(identity.user), email: identity.user?.email ?? null, mode: "local" });
    if (identity.needsCookie) setGuestCookie(response, identity.sessionId);
    return response;
  }
}
