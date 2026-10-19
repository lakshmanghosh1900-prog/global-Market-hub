import { NextResponse } from "next/server";
import { isAuthorizedCron, unauthorizedCron } from "@/lib/cron";
import { CuelinksApiError, fetchAllCuelinksCampaigns, fetchAllCuelinksOffers, isCuelinksOfferEligible, isCuelinksTrackingUrl } from "@/lib/connectors/cuelinks";
import { hasCuelinksCredentials } from "@/lib/config";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return unauthorizedCron();
  if (!hasCuelinksCredentials()) {
    return NextResponse.json({ success: false, status: "PROVIDER_CREDENTIALS_MISSING", mode: "deals-only", synced: 0 }, { status: 503 });
  }
  try {
    const [campaigns, offers] = await Promise.all([
      fetchAllCuelinksCampaigns({ accessStatus: "open" }),
      fetchAllCuelinksOffers(),
    ]);
    if (offers.length === 0) {
      return NextResponse.json({ success: true, status: "DEALS_ONLY_READY", mode: "deals-only", campaigns: campaigns.length, fetched: offers.length, synced: 0, preservedExisting: true });
    }
    const now = new Date();
    const providerIds = offers.map((offer) => offer.id);
    const persistableOffers = offers.filter((offer) => typeof offer.tracking_url === "string" && isCuelinksTrackingUrl(offer.tracking_url));
    await prisma.$transaction(async (tx) => {
      for (const offer of persistableOffers) {
        const eligible = isCuelinksOfferEligible(offer);
        await tx.cuelinksOffer.upsert({
          where: { externalId: offer.id },
          create: {
            externalId: offer.id,
            title: offer.title,
            description: offer.description ?? null,
            terms: offer.terms ?? null,
            couponCode: offer.coupon_code ?? null,
            offerType: offer.offer_type,
            campaignId: offer.campaign_id,
            campaignName: offer.campaign_name,
            categoryNames: (offer.categories ?? []).map((category) => category.name),
            trackingUrl: offer.tracking_url as string,
            status: offer.status,
            startDate: offer.start_date ?? null,
            endDate: offer.end_date ?? null,
            originalPrice: offer.original_price ?? null,
            discountPrice: offer.discount_price ?? null,
            percentOff: offer.percent_off ?? null,
            shippingCharge: offer.shipping_charge ?? null,
            providerUpdatedAt: offer.updated_at ? new Date(offer.updated_at) : null,
            lastSync: now,
            isActive: eligible,
          },
          update: {
            title: offer.title,
            description: offer.description ?? null,
            terms: offer.terms ?? null,
            couponCode: offer.coupon_code ?? null,
            offerType: offer.offer_type,
            campaignId: offer.campaign_id,
            campaignName: offer.campaign_name,
            categoryNames: (offer.categories ?? []).map((category) => category.name),
            trackingUrl: offer.tracking_url as string,
            status: offer.status,
            startDate: offer.start_date ?? null,
            endDate: offer.end_date ?? null,
            originalPrice: offer.original_price ?? null,
            discountPrice: offer.discount_price ?? null,
            percentOff: offer.percent_off ?? null,
            shippingCharge: offer.shipping_charge ?? null,
            providerUpdatedAt: offer.updated_at ? new Date(offer.updated_at) : null,
            lastSync: now,
            isActive: eligible,
          },
        });
      }
      await tx.cuelinksOffer.updateMany({ where: { externalId: { in: providerIds } }, data: { isActive: false } });
      await tx.cuelinksOffer.updateMany({ where: { externalId: { notIn: providerIds } }, data: { isActive: false } });
      for (const offer of persistableOffers.filter((candidate) => isCuelinksOfferEligible(candidate))) {
        await tx.cuelinksOffer.update({ where: { externalId: offer.id }, data: { isActive: true } });
      }
    });
    const eligibleOffers = persistableOffers.filter((offer) => isCuelinksOfferEligible(offer));
    return NextResponse.json({ success: true, status: "DEALS_ONLY_READY", mode: "deals-only", campaigns: campaigns.length, fetched: offers.length, synced: eligibleOffers.length, rejected: offers.length - persistableOffers.length, deactivated: offers.length - eligibleOffers.length });
  } catch (error) {
    const status = error instanceof CuelinksApiError ? error.code ?? "CUELINKS_UPSTREAM_ERROR" : "DATABASE_OR_SYNC_ERROR";
    return NextResponse.json({ success: false, status, mode: "deals-only", warning: "Existing validated offers were preserved" }, { status: 502 });
  }
}
