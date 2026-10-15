import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/in/under/under-49" aria-label="Global Market Hub home">
          <span className="brand-mark">GM</span>
          <span>
            <strong>Global Market Hub</strong>
            <small>India-first finds, freshly synced</small>
          </span>
        </Link>

        <form className="site-search" action="/in/search">
          <label className="sr-only" htmlFor="site-search">Search products</label>
          <input id="site-search" name="q" placeholder="Search fresh finds" />
          <button type="submit" aria-label="Search">⌕</button>
        </form>

        <nav className="header-nav" aria-label="Primary navigation">
          <Link href="/in/under/under-49">Deals</Link>
          <Link href="/in/wishlist">Wishlist</Link>
          <span className="country-badge" aria-label="Current country: India">
            IN · India
          </span>
        </nav>
      </div>
    </header>
  );
}
