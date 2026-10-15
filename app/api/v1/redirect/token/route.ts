import { NextResponse } from "next/server";
import { createSignedRedirect, isAllowedAffiliateUrl } from "@/lib/redirect";

export async function POST(request: Request) {
  let payload: { url?: unknown };
  try {
    payload = (await request.json()) as { url?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof payload.url !== "string" || !isAllowedAffiliateUrl(payload.url)) {
    return NextResponse.json({ error: "Unsupported merchant URL" }, { status: 400 });
  }

  return NextResponse.json({ redirectUrl: createSignedRedirect(payload.url) });
}
