import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProductGrid } from "@/components/product-grid";
import { searchProducts } from "@/lib/products";
import { isActiveCountry } from "@/lib/catalog-config";

export default async function HubPage({ params }: { params: Promise<{ country: string; hub: string }> }) {
  const { country, hub } = await params;
  if (!isActiveCountry(country) || !["deals", "new-arrivals"].includes(hub)) notFound();
  const products = await searchProducts("");
  return <><Header country={country} /><main className="shell listing-main"><p className="eyebrow">Hub · {hub}</p><h1>{hub.replace(/-/g, " ")}</h1><ProductGrid products={products} country={country} /></main></>;
}
