import { NextResponse } from "next/server";
import { isCuelinksDateWindowOpen, isCuelinksTrackingUrl } from "@/lib/connectors/cuelinks";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const offerId = Number(new URL(request.url).searchParams.get("offerId"));
  if (!Number.isInteger(offerId) || offerId <= 0) return NextResponse.json({ error: "A valid offer is required" }, { status: 400 });
  try {
    const offer = await prisma.cuelinksOffer.findUnique({ where: { externalId: offerId }, select: { trackingUrl: true, status: true, isActive: true, startDate: true, endDate: true } });
    if (!offer || !offer.isActive || offer.status !== "live" || !isCuelinksDateWindowOpen(offer.startDate, offer.endDate) || !isCuelinksTrackingUrl(offer.trackingUrl)) {
      return NextResponse.json({ error: "This deal is no longer available" }, { status: 409 });
    }
    return NextResponse.redirect(offer.trackingUrl, 307);
  } catch {
    return NextResponse.json({ error: "Deal links are temporarily unavailable" }, { status: 503 });
  }
}
