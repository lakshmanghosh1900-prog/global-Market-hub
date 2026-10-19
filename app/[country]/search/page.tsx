import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProductGrid } from "@/components/product-grid";
import { searchProductsWithMeta } from "@/lib/products";
import { isActiveCountry } from "@/lib/catalog-config";
import { canonicalCategories } from "@/lib/taxonomy";
import { merchants } from "@/data/catalog";

export const revalidate = 3600;

type SearchParams = {
  q?: string;
  category?: string;
  bracket?: string;
  merchant?: string;
  freshness?: string;
  sort?: "price_low" | "newest" | "relevance";
  page?: string;
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { country: rawCountry } = await params;
  const queryParams = await searchParams;
  const country = rawCountry.toLowerCase();
  if (!isActiveCountry(country)) notFound();

  const query = queryParams.q?.trim() ?? "";
  const page = Number.isFinite(Number(queryParams.page)) ? Math.max(1, Number(queryParams.page)) : 1;
  const category = canonicalCategories.some((term) => term.slug === queryParams.category) ? queryParams.category : undefined;
  const bracket = ["under-49", "under-99", "under-199", "under-499"].includes(queryParams.bracket ?? "") ? queryParams.bracket : undefined;
  const sort = queryParams.sort === "price_low" || queryParams.sort === "newest" ? queryParams.sort : "relevance";
  const result = await searchProductsWithMeta(query, { bracket, category, merchant: queryParams.merchant, freshness: queryParams.freshness, sort, page });
  const selectedCategory = category ?? "";

  const makeHref = (nextPage?: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory) params.set("category", selectedCategory);
    if (bracket) params.set("bracket", bracket);
    if (queryParams.merchant) params.set("merchant", queryParams.merchant);
    if (queryParams.freshness) params.set("freshness", queryParams.freshness);
    if (sort !== "relevance") params.set("sort", sort);
    if (nextPage && nextPage > 1) params.set("page", String(nextPage));
    const queryString = params.toString();
    return `/${country}/search${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <>
      <Header country={country} />
      <main className="shell listing-main">
        <div className="search-heading">
          <div>
            <p className="eyebrow">Search the {country === "in" ? "India" : country.toUpperCase()} market</p>
            <h1>{query ? `Results for “${query}”` : "Search finds"}</h1>
            <p className="listing-intro">Search title, brand, category, merchant or SKU. Filters stay in the URL so you can share or refresh this view.</p>
          </div>
          <div className="result-count"><strong>{result.total}</strong><span>{result.total === 1 ? "match" : "matches"}</span></div>
        </div>
        <form className="search-filters" action={`/${country}/search`}>
          <label><span>Search</span><input name="q" defaultValue={query} placeholder="Title, brand or category" /></label>
          <label><span>Category</span><select name="category" defaultValue={selectedCategory}><option value="">All categories</option>{canonicalCategories.map((term) => <option value={term.slug} key={term.slug}>{term.name}</option>)}</select></label>
          <label><span>Price</span><select name="bracket" defaultValue={bracket ?? ""}><option value="">Any price</option><option value="under-49">Under ₹49</option><option value="under-99">Under ₹99</option><option value="under-199">Under ₹199</option><option value="under-499">Under ₹499</option></select></label>
          <label><span>Merchant</span><select name="merchant" defaultValue={queryParams.merchant ?? ""}><option value="">All merchants</option>{merchants.map(([slug, name]) => <option value={name} key={slug}>{name}</option>)}</select></label>
          <label><span>Freshness</span><select name="freshness" defaultValue={queryParams.freshness ?? ""}><option value="">Any freshness</option><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select></label>
          <label><span>Sort</span><select name="sort" defaultValue={sort}><option value="relevance">Relevance</option><option value="price_low">Price low to high</option><option value="newest">Newest first</option></select></label>
          <div className="search-filter-actions"><button className="button button-primary" type="submit">Apply filters</button><Link className="button" href={`/${country}/search`}>Reset</Link></div>
        </form>
        <ProductGrid products={result.products} country={country} />
        {result.totalPages > 1 ? <nav className="pagination" aria-label="Search results pages"><span>Page {result.page} of {result.totalPages}</span><div>{result.page > 1 ? <Link className="button" href={makeHref(result.page - 1)}>Previous</Link> : null}{result.page < result.totalPages ? <Link className="button button-primary" href={makeHref(result.page + 1)}>Next</Link> : null}</div></nav> : null}
      </main>
    </>
  );
}
