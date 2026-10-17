import Link from "next/link";
import { CartHeaderTrigger } from "@/components/cart/CartHeaderTrigger";
import { CountrySelector } from "@/components/country-selector";

export function Header({ country }: { country?: string }) {
  const normalizedCountry = (country ?? "in").toLowerCase();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href={country ? `/${normalizedCountry}` : "/"} aria-label="Global Market Hub home">
          <span className="brand-mark">GM</span>
          <span>
            <strong>Global Market Hub</strong>
            <small>India-first finds, freshly synced</small>
          </span>
        </Link>

        <form className="site-search" action={`/${normalizedCountry}/search`}>
          <label className="sr-only" htmlFor="site-search">Search products</label>
          <input id="site-search" name="q" placeholder="Search fresh finds" />
          <button type="submit" aria-label="Search">⌕</button>
        </form>

          <nav className="header-nav" aria-label="Primary navigation">
            <Link href={`/${normalizedCountry}/categories`}>Categories</Link>
            <Link href={`/${normalizedCountry}/deals`}>Deals</Link>
            <Link href={`/${normalizedCountry}/wishlist`}>Wishlist</Link>
            <Link href={`/${normalizedCountry}/wishlist#deal-alerts`}>Alerts</Link>
            <Link href={`/${normalizedCountry}/account`}>Account</Link>
            <CartHeaderTrigger />
          <CountrySelector country={normalizedCountry} />
        </nav>
      </div>
    </header>
  );
}
