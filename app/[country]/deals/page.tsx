import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { isCuelinksDateWindowOpen } from "@/lib/connectors/cuelinks";
import { isActiveCountry } from "@/lib/catalog-config";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DealsPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: rawCountry } = await params;
  const country = rawCountry.toLowerCase();
  if (!isActiveCountry(country)) notFound();
  let offers: Array<{ externalId: number; title: string; description: string | null; terms: string | null; couponCode: string | null; offerType: string; campaignName: string; categoryNames: string[]; originalPrice: unknown; discountPrice: unknown; percentOff: unknown; endDate: string | null }> = [];
  let unavailable = false;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await prisma.cuelinksOffer.findMany({ where: { isActive: true, status: "live", OR: [{ endDate: null }, { endDate: { gte: today } }], AND: [{ OR: [{ startDate: null }, { startDate: { lte: today } }] }] }, orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }], take: 100, select: { externalId: true, title: true, description: true, terms: true, couponCode: true, offerType: true, campaignName: true, categoryNames: true, originalPrice: true, discountPrice: true, percentOff: true, startDate: true, endDate: true } });
    offers = rows.filter((offer) => isCuelinksDateWindowOpen(offer.startDate, offer.endDate)).map(({ startDate: _startDate, ...offer }) => offer);
  } catch {
    unavailable = true;
  }
  return <><Header country={country} /><main className="shell listing-main"><div className="listing-hero"><div><p className="eyebrow">Verified campaigns and offers</p><h1>Deals, without made-up products.</h1><p className="listing-intro">These are separate from product inventory. Coupon codes, offer terms and merchant destinations are shown only when supplied by the Cuelinks offers source.</p></div><div className="result-count"><strong>{offers.length}</strong><span>offers</span></div></div>{unavailable ? <div className="empty-state"><span className="empty-icon">◇</span><h2>Deals are not connected yet</h2><p>Configure and verify the Cuelinks V3 API to publish approved live offers.</p><Link className="button button-primary empty-action" href={`/${country}/about`}>How availability works</Link></div> : offers.length === 0 ? <div className="empty-state"><span className="empty-icon">◇</span><h2>No live offers are available</h2><p>Campaigns and coupons are kept separate from products and will appear here after a verified Cuelinks sync.</p></div> : <div className="deal-grid">{offers.map((offer) => <article className="deal-card" key={offer.externalId}><div className="deal-card-top"><span>{offer.offerType === "coupon" ? "Coupon" : "Deal"}</span><small>{offer.campaignName}</small></div><h2>{offer.title}</h2>{offer.description ? <p>{offer.description}</p> : null}<div className="deal-facts">{offer.couponCode ? <code>{offer.couponCode}</code> : null}{offer.percentOff !== null ? <strong>{String(offer.percentOff)}% off</strong> : null}{offer.categoryNames.slice(0, 2).map((category) => <span key={category}>{category}</span>)}</div>{offer.terms ? <details><summary>Terms</summary><p>{offer.terms}</p></details> : null}<a className="button button-primary" href={`/api/v1/deals/redirect?offerId=${offer.externalId}`}>View merchant offer →</a></article>)}</div>}</main></>;
}
