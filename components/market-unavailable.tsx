import Link from "next/link";
import { Header } from "@/components/header";
import { getCountryMetadata } from "@/lib/catalog-config";

export function MarketUnavailable({ country }: { country: string }) {
  const market = getCountryMetadata(country);
  if (!market) return null;

  return (
    <>
      <Header country={market.code} />
      <main className="shell market-unavailable">
        <div className="market-unavailable-card">
          <span className="market-unavailable-icon" aria-hidden="true">{market.code.toUpperCase()}</span>
          <p className="eyebrow">Market preview</p>
          <h1>{market.name} is on the way.</h1>
          <p>We have mapped this market, but there are no verified local merchant offers or market-aware prices available yet. We will open it only when the catalog and partner links are ready.</p>
          <div className="market-unavailable-actions">
            <Link className="button button-primary" href="/">Browse global discovery</Link>
            <Link className="button" href="/in">Explore India marketplace</Link>
          </div>
          <small>Current status: Coming soon · No live offers · Currency and delivery details pending</small>
        </div>
      </main>
    </>
  );
}
