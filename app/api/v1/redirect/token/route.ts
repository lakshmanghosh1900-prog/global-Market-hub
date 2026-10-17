import { NextResponse } from "next/server";
import { createSignedRedirect, hasRedirectSecret, isAllowedAffiliateUrl } from "@/lib/redirect";
import { merchantFromHost } from "@/lib/affiliate";
import { prisma } from "@/lib/db";
import { convertCuelinksLink, isCuelinksTrackingUrl } from "@/lib/connectors/cuelinks";
import { hasCuelinksCredentials } from "@/lib/config";

export async function POST(request: Request) {
  let payload: { url?: unknown; productId?: unknown };
  try {
    payload = (await request.json()) as { url?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!hasRedirectSecret()) {
    return NextResponse.json({ error: "Secure seller redirects are not configured" }, { status: 503 });
  }

  if (typeof payload.productId !== "string" || !payload.productId.trim()) {
    return NextResponse.json({ error: "A product identifier is required" }, { status: 400 });
  }

  let product;
  try {
    product = await prisma.product.findFirst({
      where: { id: payload.productId, isDelisted: false, inStock: true },
      select: { id: true, affiliateUrl: true, merchant: true, isFixture: true, affiliateNetwork: true },
    });
  } catch {
    return NextResponse.json({ error: "Seller offers are temporarily unavailable" }, { status: 503 });
  }

  if (!product || product.isFixture) {
    return NextResponse.json({ error: "This product does not have an eligible live seller offer" }, { status: 409 });
  }

  if (product.affiliateNetwork === "cuelinks") {
    if (!hasCuelinksCredentials()) return NextResponse.json({ error: "Cuelinks affiliate conversion is not configured" }, { status: 503 });
    if (!isAllowedAffiliateUrl(product.affiliateUrl)) return NextResponse.json({ error: "This merchant destination is not approved for Cuelinks conversion" }, { status: 409 });
    try {
      const conversion = await convertCuelinksLink({ url: product.affiliateUrl, referralUrl: new URL(request.url).origin });
      if (!conversion.affiliated || !isCuelinksTrackingUrl(conversion.tracking_url)) return NextResponse.json({ error: "The merchant campaign is not currently affiliate-eligible" }, { status: 409 });
      return NextResponse.json({ redirectUrl: createSignedRedirect(conversion.tracking_url, product.id) });
    } catch {
      return NextResponse.json({ error: "Affiliate link conversion is temporarily unavailable" }, { status: 502 });
    }
  }

  let merchant: string | null = null;
  try {
    merchant = merchantFromHost(new URL(product.affiliateUrl).hostname);
  } catch {
    return NextResponse.json({ error: "This seller destination could not be verified" }, { status: 409 });
  }
  if (!isAllowedAffiliateUrl(product.affiliateUrl) || merchant !== product.merchant) {
    return NextResponse.json({ error: "This seller destination could not be verified" }, { status: 409 });
  }

  return NextResponse.json({ redirectUrl: createSignedRedirect(product.affiliateUrl, product.id) });
}
