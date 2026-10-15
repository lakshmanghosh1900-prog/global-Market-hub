import { Header } from "@/components/header";
import { ProductGrid } from "@/components/product-grid";
import { searchProducts } from "@/lib/products";
import { notFound } from "next/navigation";
import { isActiveCountry } from "@/lib/catalog-config";

export const revalidate = 60 * 60;

export default async function SearchPage({ params, searchParams }: { params: { country: string }; searchParams: { q?: string; category?: string; bracket?: string; merchant?: string; freshness?: string; sort?: "price_low" | "newest" | "relevance" } }) {
  if (!isActiveCountry(params.country)) notFound();
  const products = await searchProducts(searchParams.q ?? "", searchParams.bracket, searchParams.category, { merchant: searchParams.merchant, freshness: searchParams.freshness, sort: searchParams.sort ?? "relevance" });
  return <><Header /><main className="shell listing-main"><p className="eyebrow">Search results</p><h1>{searchParams.q ? `Results for “${searchParams.q}”` : "Search finds"}</h1><form className="search-filters" action={`/${params.country}/search`}><input name="q" defaultValue={searchParams.q} placeholder="Search title or category" aria-label="Search title or category" /><select name="category" defaultValue={searchParams.category ?? ""}><option value="">All categories</option><option value="electronics">Electronics</option><option value="mobiles">Mobiles</option><option value="home">Home</option><option value="fashion">Fashion</option><option value="beauty">Beauty</option></select><select name="bracket" defaultValue={searchParams.bracket ?? ""}><option value="">Any price</option><option value="under-49">Under ₹49</option><option value="under-99">Under ₹99</option><option value="under-199">Under ₹199</option></select><select name="merchant" defaultValue={searchParams.merchant ?? ""}><option value="">All merchants</option><option value="Flipkart">Flipkart</option><option value="Amazon-curated">Amazon curated</option><option value="Cuelinks">Cuelinks</option></select><select name="freshness" defaultValue={searchParams.freshness ?? ""}><option value="">Any freshness</option><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select><select name="sort" defaultValue={searchParams.sort ?? "relevance"}><option value="relevance">Relevance</option><option value="price_low">Price low to high</option><option value="newest">Newest</option></select><button className="button button-primary" type="submit">Apply filters</button></form><ProductGrid products={products} /></main></>;
}
