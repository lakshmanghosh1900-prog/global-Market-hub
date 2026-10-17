import type { Metadata } from "next";
import { Header } from "@/components/header";
import { WishlistClient } from "@/components/wishlist-client";
import { OfferAlertForm } from "@/components/alerts/OfferAlertForm";
import { isActiveCountry } from "@/lib/catalog-config";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Wishlist | Global Market Hub", description: "Saved products and price alerts." };

export default async function WishlistPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: rawCountry } = await params;
  const country = rawCountry.toLowerCase();
  if (!isActiveCountry(country)) notFound();
  return <><Header country={country} /><main className="shell listing-main"><section className="listing-hero"><div><p className="eyebrow">Saved for later</p><h1>Your wishlist</h1><p className="listing-intro">Save products for comparison. Global Market Hub never processes payment; alerts remain subject to provider configuration.</p></div></section><WishlistClient country={country} /><section className="alerts-section" id="deal-alerts"><div className="alerts-heading"><p className="eyebrow">Future best offer notifications</p><h2>Never miss a better price</h2><p>Choose the finds and deal ranges you care about. A matching alert is recorded with your consent; delivery is disabled until a compliant provider is configured.</p></div><OfferAlertForm /></section></main></>;
}
