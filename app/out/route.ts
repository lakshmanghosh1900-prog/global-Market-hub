import { NextResponse } from "next/server";
import { merchantFromHost } from "@/lib/affiliate";
import { hasRedirectSecret, isAllowedAffiliateUrl, isValidSignature, trackedMerchantUrl } from "@/lib/redirect";
import { isCuelinksTrackingUrl } from "@/lib/connectors/cuelinks";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");
  const timestamp = Number(requestUrl.searchParams.get("ts"));
  const signature = requestUrl.searchParams.get("sig");
  const productId = requestUrl.searchParams.get("pid") ?? undefined;

  if (!target || !signature || !productId || !Number.isFinite(timestamp)) {
    return NextResponse.json({ error: "Missing redirect token" }, { status: 401 });
  }

  if (!hasRedirectSecret()) {
    return NextResponse.json({ error: "Secure seller redirects are not configured" }, { status: 503 });
  }

  let validSignature = false;
  try {
    validSignature = isValidSignature(timestamp, target, signature, productId);
  } catch {
    return NextResponse.json({ error: "Secure seller redirects are not configured" }, { status: 503 });
  }
  if (!isAllowedAffiliateUrl(target) || !validSignature) {
    return NextResponse.json({ error: "Invalid or expired redirect token" }, { status: 403 });
  }

  const targetUrl = new URL(target);
  const merchant = merchantFromHost(targetUrl.hostname);
  if (!merchant) return NextResponse.json({ error: "Unsupported seller" }, { status: 403 });

  let product;
  try {
    product = await prisma.product.findFirst({
      where: { id: productId, isDelisted: false, inStock: true },
      select: { id: true, affiliateUrl: true, merchant: true, isFixture: true, affiliateNetwork: true },
    });
  } catch {
    return NextResponse.json({ error: "Seller offers are temporarily unavailable" }, { status: 503 });
  }
  const destinationMatches = product?.affiliateNetwork === "cuelinks"
    ? isCuelinksTrackingUrl(target)
    : product?.affiliateUrl === target;
  if (!product || product.isFixture || product.merchant !== merchant || !destinationMatches) {
    return NextResponse.json({ error: "Seller destination does not match the live product offer" }, { status: 403 });
  }

  void prisma.clickEvent.create({
    data: { merchant, targetHost: targetUrl.hostname, productId: product.id },
  }).catch(() => undefined);

  return NextResponse.redirect(trackedMerchantUrl(target), 307);
}
