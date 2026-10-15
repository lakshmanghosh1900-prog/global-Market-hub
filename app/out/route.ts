import { NextResponse } from "next/server";
import { merchantFromHost } from "@/lib/affiliate";
import { isAllowedAffiliateUrl, isValidSignature, trackedMerchantUrl } from "@/lib/redirect";
import { prisma } from "@/lib/db";

export function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");
  const timestamp = Number(requestUrl.searchParams.get("ts"));
  const signature = requestUrl.searchParams.get("sig");
  const productId = requestUrl.searchParams.get("pid") ?? undefined;

  if (!target || !signature || !Number.isFinite(timestamp)) {
    return NextResponse.json({ error: "Missing redirect token" }, { status: 401 });
  }

  if (!isAllowedAffiliateUrl(target) || !isValidSignature(timestamp, target, signature, productId)) {
    return NextResponse.json({ error: "Invalid or expired redirect token" }, { status: 403 });
  }

  const targetUrl = new URL(target);
  const merchant = merchantFromHost(targetUrl.hostname) ?? "Unknown";
  void prisma.clickEvent.create({
    data: { merchant, targetHost: targetUrl.hostname, productId },
  }).catch(() => undefined);

  return NextResponse.redirect(trackedMerchantUrl(target), 307);
}
