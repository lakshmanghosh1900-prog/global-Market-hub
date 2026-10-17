import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PriceBracketPage } from "@/components/price-bracket-page";
import { isActiveCountry } from "@/lib/catalog-config";
import { siteUrl } from "@/lib/seo";

export const revalidate = 60 * 60;

export async function generateMetadata({ params }: { params: { country: string; bracket: string } }): Promise<Metadata> {
  const amount = params.bracket.replace("under-", "");
  return {
    title: `Under ₹${amount} | Global Market Hub`,
    description: `Freshly synced India finds priced under ₹${amount}.`,
    alternates: { canonical: `${siteUrl()}/${params.country}/under/${params.bracket}` },
  };
}

export default function CountryBracketPage({ params }: { params: { country: string; bracket: string } }) {
  if (!isActiveCountry(params.country) || !/^under-\d+$/.test(params.bracket)) notFound();
  return <PriceBracketPage bracket={params.bracket} country={params.country.toLowerCase()} />;
}
