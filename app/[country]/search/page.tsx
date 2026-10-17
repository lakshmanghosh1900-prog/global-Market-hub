import { Header } from "@/components/header";
import { ProductGrid } from "@/components/product-grid";
import { searchProductsWithMeta } from "@/lib/products";
import { notFound } from "next/navigation";
import { isActiveCountry } from "@/lib/catalog-config";
import { canonicalCategories } from "@/lib/taxonomy";
import { merchants } from "@/data/catalog";
import Link from "next/link";

export const revalidate = 60 * 60;

export default async function SearchPage({ params, searchParams }: { params: { country: string }; searchParams: { q?: string; category?: string; bracket?: string; merchant?: string; freshness?: string; sort?: "price_low" | "newest" | "relevance"; page?: string } }) {
  const country = params.country.toLowerCase();
  if (!isActiveCountry(country)) notFound();
  const query = searchParams.q?.trim() ?? "";
  const page = Number.isFinite(Number(searchParams.page)) ? Math.max(1, Number(searchParams.page)) : 1;
  const category = canonicalCategories.some((term) => term.slug === searchParams.category) ? searchParams.category : undefined;
  const bracket = ["under-49", "under-99", "under-199", "under-499"].includes(searchParams.bracket ?? "") ? searchParams.bracket : undefined;
  const sort = searchParams.sort === "price_low" || searchParams.sort === "newest" ? searchParams.sort : "relevance";
  const result = await searchProductsWithMeta(query, { bracket, category, merchant: searchParams.merchant, freshness: searchParams.freshness, sort, page });
  const selectedCategory = category ?? "";
  const makeHref = (nextPage?: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory) params.set("category", selectedCategory);
    if (bracket) params.set("bracket", bracket);
    if (searchParams.merchant) params.set("merchant", searchParams.merchant);
    if (searchParams.freshness) params.set("freshness", searchParams.freshness);
    if (sort !== "relevance") params.set("sort", sort);
    if (nextPage && nextPage > 1) params.set("page", String(nextPage));
    const queryString = params.toString();
    return `/${country}/search${queryString ? `?${queryString}` : ""}`;
  };

  return <><Header country={country} /><main className="shell listing-main"><div className="search-heading"><div><p className="eyebrow">Search the {country === "in" ? "India" : country.toUpperCase()} market</p><h1>{query ? `Results for “${query}”` : "Search finds"}</h1><p className="listing-intro">Search title, brand, category, merchant or SKU. Filters stay in the URL so you can share or refresh this view.</p></div><div className="result-count"><strong>{result.total}</strong><span>{result.total === 1 ? "match" : "matches"}</span></div></div><form className="search-filters" action={`/${country}/search`}><label><span>Search</span><input name="q" defaultValue={query} placeholder="Title, brand or category" /></label><label><span>Category</span><select name="category" defaultValue={selectedCategory}><option value="">All categories</option>{canonicalCategories.map((term) => <option value={term.slug} key={term.slug}>{term.name}</option>)}</select></label><label><span>Price</span><select name="bracket" defaultValue={bracket ?? ""}><option value="">Any price</option><option value="under-49">Under ₹49</option><option value="under-99">Under ₹99</option><option value="under-199">Under ₹199</option><option value="under-499">Under ₹499</option></select></label><label><span>Merchant</span><select name="merchant" defaultValue={searchParams.merchant ?? ""}><option value="">All merchants</option>{merchants.map(([slug, name]) => <option value={name} key={slug}>{name}</option>)}</select></label><label><span>Freshness</span><select name="freshness" defaultValue={searchParams.freshness ?? ""}><option value="">Any freshness</option><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select></label><label><span>Sort</span><select name="sort" defaultValue={sort}><option value="relevance">Relevance</option><option value="price_low">Price low to high</option><option value="newest">Newest first</option></select></label><div className="search-filter-actions"><button className="button button-primary" type="submit">Apply filters</button><Link className="button" href={`/${country}/search`}>Reset</Link></div></form><ProductGrid products={result.products} country={country} />{result.totalPages > 1 ? <nav className="pagination" aria-label="Search results pages"><span>Page {result.page} of {result.totalPages}</span><div>{result.page > 1 ? <Link className="button" href={makeHref(result.page - 1)}>Previous</Link> : null}{result.page < result.totalPages ? <Link className="button button-primary" href={makeHref(result.page + 1)}>Next</Link> : null}</div></nav> : null}</main></>;
}
