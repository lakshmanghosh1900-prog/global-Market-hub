import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProductGrid } from "@/components/product-grid";
import { searchProducts } from "@/lib/products";
import { isActiveCountry } from "@/lib/catalog-config";

export default async function HubPage({ params }: { params: { country: string; hub: string } }) {
  if (!isActiveCountry(params.country) || !["deals", "new-arrivals"].includes(params.hub)) notFound();
  const products = await searchProducts("");
  return <><Header /><main className="shell listing-main"><p className="eyebrow">Hub · {params.hub}</p><h1>{params.hub.replace(/-/g, " ")}</h1><ProductGrid products={products} /></main></>;
}
