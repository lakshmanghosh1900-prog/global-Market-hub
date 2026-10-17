import { notFound } from "next/navigation";
import { CategoryDirectory } from "@/components/category-directory";
import { Header } from "@/components/header";
import { BracketStrip } from "@/components/bracket-strip";
import { isActiveCountry } from "@/lib/catalog-config";

export default async function CategoriesPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: rawCountry } = await params;
  const country = rawCountry.toLowerCase();
  if (!isActiveCountry(country)) notFound();
  return (
    <>
      <Header country={country} />
      <BracketStrip country={country} />
      <main className="shell listing-main category-directory-main">
        <p className="eyebrow">Browse the full taxonomy</p>
        <h1>Find your next category.</h1>
        <p className="listing-intro">Every category stays visible, even when a merchant connection has not populated it yet. Product counts appear on live listing pages and are never estimated.</p>
        <CategoryDirectory country={country} />
      </main>
    </>
  );
}
