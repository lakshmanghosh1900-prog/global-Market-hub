import Link from "next/link";
import { Header } from "@/components/header";
import { ProductGrid } from "@/components/product-grid";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { searchProducts } from "@/lib/products";

const categories = [
  ["electronics", "Electronics", "Gadgets, accessories and everyday tech"],
  ["mobiles", "Mobiles", "Phones and mobile essentials"],
  ["computers", "Computers", "Laptops, peripherals and work gear"],
  ["fashion", "Fashion", "Clothing, footwear and accessories"],
  ["home", "Home", "Useful pieces for the spaces you live in"],
  ["kitchen", "Kitchen", "Tools and practical kitchen finds"],
  ["beauty", "Beauty", "Personal care and self-care picks"],
  ["grocery", "Grocery", "Staples, snacks and beverages"],
  ["toys", "Toys", "Play, learning and family finds"],
  ["books", "Books", "Reading and stationery"],
  ["sports", "Sports", "Fitness and active-life essentials"],
  ["appliances", "Appliances", "Helpful home appliances"],
  ["accessories", "Accessories", "The small things that make a difference"],
] as const;

const brackets = [
  ["under-49", "Under ₹49", "Tiny finds for everyday needs"],
  ["under-99", "Under ₹99", "Useful picks at a glance"],
  ["under-199", "Under ₹199", "More room to compare"],
  ["under-499", "Under ₹499", "A wider budget-friendly browse"],
] as const;

const merchantModes = [
  ["Flipkart", "Live catalog connector", "Available when the verified feed is configured."],
  ["Amazon", "Curated listings", "Shown only through validated curated records."],
  ["Cuelinks", "Deals and links", "Campaign and deal discovery, not an assumed product feed."],
] as const;

export async function MarketHomePage({ country = "in", global = false }: { country?: string; global?: boolean }) {
  const products = await searchProducts("", "under-499", undefined, { sort: "relevance" });
  const hasFixtures = products.some((product) => product.isFixture);
  const isIndia = country === "in";

  return (
    <>
      <Header country={global ? undefined : country} />
      <main>
        <section className="home-hero">
          <div className="shell home-hero-grid">
            <div className="home-hero-copy">
              <p className="eyebrow">{global ? "38 markets mapped · one honest catalog" : isIndia ? "India marketplace · globally minded" : "Global marketplace discovery"}</p>
              <h1>Shop with more context, wherever you are.</h1>
              <p className="home-lede">
                Discover products, compare what is actually available, and follow a clear path to the merchant that sells them. Global Market Hub helps you browse first and buy on the right partner site.
              </p>
              <form className="home-search" action={`/${country}/search`}>
                <label className="sr-only" htmlFor={`home-search-${country}`}>Search products</label>
                <input id={`home-search-${country}`} name="q" placeholder="What are you looking for? Try headphones or kitchen" />
                <button className="button button-primary" type="submit">Search market</button>
              </form>
              <div className="home-quick-links" aria-label="Popular discovery shortcuts">
                <Link href={`/${country}/search?q=electronics`}>Browse electronics</Link>
                <Link href={`/${country}/search?q=mobile`}>Find mobiles</Link>
                <Link href={`/${country}/wishlist#deal-alerts`}>Set a price alert</Link>
              </div>
            </div>
            <div className="home-hero-card" aria-label="How Global Market Hub works">
              <span className="home-orbit home-orbit-one" />
              <span className="home-orbit home-orbit-two" />
              <div className="home-hero-card-content">
                <span className="home-card-label">A calmer way to compare</span>
                <strong>Find → compare → continue on the merchant site</strong>
                <p>We do not take payment or complete orders. Prices, stock and delivery are handled by each partner.</p>
                <Link className="text-link" href={`/${country}/about`}>Learn how discovery works <span aria-hidden="true">↗</span></Link>
              </div>
            </div>
          </div>
        </section>

        <section className="shell home-section" aria-labelledby="home-brackets-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Start with a budget</p>
              <h2 id="home-brackets-title">Price ranges that stay easy to scan.</h2>
            </div>
            <p>Every range is a real filter. No countdowns, invented savings or urgency.</p>
          </div>
          <div className="bracket-cards">
            {brackets.map(([slug, label, description]) => (
              <Link className="bracket-card" href={`/${country}/under/${slug}`} key={slug}>
                <span>{label}</span>
                <strong>{description}</strong>
                <small>Explore range <span aria-hidden="true">→</span></small>
              </Link>
            ))}
          </div>
        </section>

        <section className="shell home-section" aria-labelledby="home-categories-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Explore the taxonomy</p>
              <h2 id="home-categories-title">Start with what you need.</h2>
            </div>
            <Link className="text-link" href={`/${country}/categories`}>Open category directory <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="category-directory">
            {categories.map(([slug, name, description]) => (
              <Link className="category-card" href={`/${country}/c/${slug}`} key={slug}>
                <span className="category-icon" aria-hidden="true">{name.slice(0, 1)}</span>
                <span>
                  <strong>{name}</strong>
                  <small>{description}</small>
                </span>
                <span className="category-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="shell home-section home-catalog-section" aria-labelledby="home-catalog-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Available to discover now</p>
              <h2 id="home-catalog-title">A small, honest preview of the catalog.</h2>
            </div>
            <Link className="text-link" href={`/${country}/search`}>Search all products <span aria-hidden="true">↗</span></Link>
          </div>
          {hasFixtures ? (
            <div className="demo-notice" role="status">
              <strong>Preview mode</strong>
              <span>The database catalog is not connected in this environment, so these clearly labelled fixture cards are for interface review only. Their seller actions are disabled.</span>
            </div>
          ) : null}
          <ProductGrid products={products} country={country} />
        </section>

        <section className="shell home-section" aria-labelledby="home-merchants-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Merchant transparency</p>
              <h2 id="home-merchants-title">Know what each connection means.</h2>
            </div>
            <AffiliateDisclosure />
          </div>
          <div className="merchant-mode-grid">
            {merchantModes.map(([name, mode, description]) => (
              <article className="merchant-mode-card" key={name}>
                <span className="merchant-status-dot" aria-hidden="true" />
                <p>{name}</p>
                <h3>{mode}</h3>
                <span>{description}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="home-disclosure">
          <div className="shell home-disclosure-inner">
            <div>
              <p className="eyebrow">Before you click</p>
              <h2>We help you decide. The merchant handles checkout.</h2>
            </div>
            <p>Some links are affiliate links, which means we may earn a commission at no extra cost to you. Availability, pricing, delivery, returns and payment are controlled by the seller.</p>
          </div>
        </section>
      </main>
    </>
  );
}
