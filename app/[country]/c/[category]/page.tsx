import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProductGrid } from "@/components/product-grid";
import { searchProducts } from "@/lib/products";
import { isActiveCountry } from "@/lib/catalog-config";

export default async function CategoryPage({ params }: { params: { country: string; category: string } }) {
  if (!isActiveCountry(params.country)) notFound();
  const products = await searchProducts("", undefined, params.category);
  return <><Header /><main className="shell listing-main"><p className="eyebrow">Taxonomy · {params.category}</p><h1>{params.category.replace(/-/g, " ")} finds</h1><ProductGrid products={products} /></main></>;
}
