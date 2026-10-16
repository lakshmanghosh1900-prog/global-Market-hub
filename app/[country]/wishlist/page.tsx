import type { Metadata } from "next";
import { Header } from "@/components/header";
import { WishlistClient } from "@/components/wishlist-client";
import { OfferAlertForm } from "@/components/alerts/OfferAlertForm";
import { isActiveCountry } from "@/lib/catalog-config";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Wishlist | Global Market Hub", description: "Saved products and price alerts." };

export default function WishlistPage({ params }: { params: { country: string } }) {
  if (!isActiveCountry(params.country)) notFound();
  return <><Header /><main className="shell listing-main"><section className="listing-hero"><div><p className="eyebrow">Saved for later</p><h1>Your wishlist</h1><p className="listing-intro">Track current versus added prices, then set a simple below-₹ alert.</p></div></section><WishlistClient /><section className="alerts-section" id="deal-alerts"><div className="alerts-heading"><p className="eyebrow">Future best offer notifications</p><h2>Never miss a better price</h2><p>Choose the finds and deal ranges you care about. We’ll notify you when a matching drop is available.</p></div><OfferAlertForm /></section></main></>;
}
