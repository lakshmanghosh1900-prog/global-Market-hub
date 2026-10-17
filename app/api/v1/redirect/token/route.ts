import { NextResponse } from "next/server";
import { createSignedRedirect, hasRedirectSecret, isAllowedAffiliateUrl } from "@/lib/redirect";
import { merchantFromHost } from "@/lib/affiliate";
import { prisma } from "@/lib/db";

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
      select: { id: true, affiliateUrl: true, merchant: true, isFixture: true },
    });
  } catch {
    return NextResponse.json({ error: "Seller offers are temporarily unavailable" }, { status: 503 });
  }

  if (!product || product.isFixture) {
    return NextResponse.json({ error: "This product does not have an eligible live seller offer" }, { status: 409 });
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
