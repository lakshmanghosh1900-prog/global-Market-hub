import { Header } from "@/components/header";
import { ProductGrid } from "@/components/product-grid";
import { searchProducts } from "@/lib/products";
import { notFound } from "next/navigation";
import { isActiveCountry } from "@/lib/catalog-config";

export default async function SearchPage({ params, searchParams }: { params: { country: string }; searchParams: { q?: string } }) {
  if (!isActiveCountry(params.country)) notFound();
  const products = await searchProducts(searchParams.q ?? "");
  return <><Header /><main className="shell listing-main"><p className="eyebrow">Search results</p><h1>{searchParams.q ? `Results for “${searchParams.q}”` : "Search finds"}</h1><ProductGrid products={products} /></main></>;
}
