import { notFound } from "next/navigation";
import { MarketHomePage } from "@/components/market-home";
import { MarketUnavailable } from "@/components/market-unavailable";
import { getCountryMetadata } from "@/lib/catalog-config";

export default async function CountryHomePage({ params }: { params: Promise<{ country: string }> }) {
  const { country: rawCountry } = await params;
  const country = rawCountry.toLowerCase();
  const market = getCountryMetadata(country);
  if (!market) notFound();
  if (!market.active) return <MarketUnavailable country={country} />;
  return <MarketHomePage country={country} />;
}
