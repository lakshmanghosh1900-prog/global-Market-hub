import { notFound } from "next/navigation";
import { MarketHomePage } from "@/components/market-home";
import { isActiveCountry } from "@/lib/catalog-config";

export default function CountryHomePage({ params }: { params: { country: string } }) {
  const country = params.country.toLowerCase();
  if (!isActiveCountry(country)) notFound();
  return <MarketHomePage country={country} />;
}
