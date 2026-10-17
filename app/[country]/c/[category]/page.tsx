import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProductGrid } from "@/components/product-grid";
import { searchProducts } from "@/lib/products";
import { isActiveCountry } from "@/lib/catalog-config";
import { categoryName, resolveCategorySlug } from "@/lib/taxonomy";

export default async function CategoryPage({ params }: { params: Promise<{ country: string; category: string }> }) {
  const { country: rawCountry, category: rawCategory } = await params;
  const country = rawCountry.toLowerCase();
  const category = resolveCategorySlug(rawCategory);
  if (!isActiveCountry(country) || !category) notFound();
  const products = await searchProducts("", undefined, category);
  return <><Header country={country} /><main className="shell listing-main"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href={`/${country}`}>{country === "in" ? "India" : country}</a><span>/</span><a href={`/${country}/categories`}>Categories</a><span>/</span><span>{categoryName(category)}</span></nav><section className="listing-hero"><div><p className="eyebrow">Taxonomy · {categoryName(category)}</p><h1>{categoryName(category)} finds</h1><p className="listing-intro">A shared category view using the same taxonomy as merchant ingestion and search filters. If it is empty, the connection has not supplied verified inventory yet.</p></div><div className="result-count"><strong>{products.length}</strong><span>matches</span></div></section><ProductGrid products={products} country={country} /></main></>;
}
