import { notFound } from "next/navigation";
import { MarketHomePage } from "@/components/market-home";
import { MarketUnavailable } from "@/components/market-unavailable";
import { getCountryMetadata } from "@/lib/catalog-config";

export default function CountryHomePage({ params }: { params: { country: string } }) {
  const country = params.country.toLowerCase();
  const market = getCountryMetadata(country);
  if (!market) notFound();
  if (!market.active) return <MarketUnavailable country={country} />;
  return <MarketHomePage country={country} />;
}
