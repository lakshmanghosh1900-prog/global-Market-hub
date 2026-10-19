import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PriceBracketPage } from "@/components/price-bracket-page";
import { isActiveCountry } from "@/lib/catalog-config";
import { siteUrl } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ country: string; bracket: string }> }): Promise<Metadata> {
  const { country, bracket } = await params;
  const amount = bracket.replace("under-", "");
  return {
    title: `Under ₹${amount} | Global Market Hub`,
    description: `Freshly synced India finds priced under ₹${amount}.`,
    alternates: { canonical: `${siteUrl()}/${country}/under/${bracket}` },
  };
}

export default async function CountryBracketPage({ params }: { params: Promise<{ country: string; bracket: string }> }) {
  const { country, bracket } = await params;
  if (!isActiveCountry(country) || !/^under-\d+$/.test(bracket)) notFound();
  return <PriceBracketPage bracket={bracket} country={country.toLowerCase()} />;
}
