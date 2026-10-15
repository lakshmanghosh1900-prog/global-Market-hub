import type { Metadata } from "next";
import { Header } from "@/components/header";
import { WishlistClient } from "@/components/wishlist-client";
import { isActiveCountry } from "@/lib/catalog-config";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Wishlist | Global Market Hub", description: "Saved products and price alerts." };

export default function WishlistPage({ params }: { params: { country: string } }) {
  if (!isActiveCountry(params.country)) notFound();
  return <><Header /><main className="shell listing-main"><section className="listing-hero"><div><p className="eyebrow">Saved for later</p><h1>Your wishlist</h1><p className="listing-intro">Track current versus added prices, then set a simple below-₹ alert.</p></div></section><WishlistClient /></main></>;
}
