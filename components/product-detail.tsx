import Link from "next/link";
import { ProductActions } from "@/components/product-actions";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { SafeImage } from "@/components/safe-image";
import type { ListingProduct } from "@/lib/types";
import { getCountryMetadata } from "@/lib/catalog-config";
import { categoryName } from "@/lib/taxonomy";
import { organizationJsonLd, safeJsonLd, siteUrl } from "@/lib/seo";

function discountPercent(price: number, mrp: number | null) {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function ProductDetail({ product, related, offers = [product], country }: { product: ListingProduct; related: ListingProduct[]; offers?: ListingProduct[]; country: string }) {
  const countryMetadata = getCountryMetadata(country);
  const currencyCode = countryMetadata?.currency && countryMetadata.currency !== "TBD" ? countryMetadata.currency : "INR";
  const currency = new Intl.NumberFormat(countryMetadata?.locale ?? "en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 0 });
  const discount = discountPercent(product.price, product.mrp);
  const images = Array.from(new Set([...(product.gallery ?? []), ...(product.image ? [product.image] : [])])).filter((image) => image.startsWith("https://"));
  const categoryPath = product.category.startsWith("under-") ? `under/${product.category}` : `c/${product.category}`;
  const sortedOffers = [...offers].sort((left, right) => left.price - right.price);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: images.length ? images : undefined,
    sku: product.sku,
    gtin: product.gtin || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: sortedOffers.map((offer) => ({
      "@type": "Offer",
      url: `${siteUrl()}/${country}/product/${offer.slug}`,
      priceCurrency: currencyCode,
      price: offer.price,
      availability: `https://schema.org/${offer.inStock ? "InStock" : "OutOfStock"}`,
      seller: { "@type": "Organization", name: offer.merchant },
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: countryMetadata?.name ?? country.toUpperCase(), item: `${siteUrl()}/${country}` },
      { "@type": "ListItem", position: 2, name: categoryName(product.category), item: `${siteUrl()}/${country}/${categoryPath}` },
      { "@type": "ListItem", position: 3, name: product.title, item: `${siteUrl()}/${country}/product/${product.slug}` },
    ],
  };

  return (
    <>
      <main className="shell product-detail">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href={`/${country}`}>{countryMetadata?.name ?? country.toUpperCase()}</Link><span>/</span>
          <Link href={`/${country}/${categoryPath}`}>{categoryName(product.category)}</Link><span>/</span>
          <span aria-current="page">{product.title}</span>
        </nav>
        {product.isFixture ? <div className="demo-notice" role="status"><strong>Preview fixture</strong><span>This product is included only for local interface review. It has no eligible seller action.</span></div> : null}
        <section className="detail-layout">
          <div className="detail-gallery">
            <div className="detail-image">
              {images[0] ? <SafeImage src={images[0]} alt={product.title} width={720} height={720} priority sizes="(max-width: 800px) 100vw, 50vw" fallbackLabel="Product image unavailable" /> : <span className="safe-image-fallback">Image unavailable</span>}
            </div>
            {images.length > 1 ? <div className="detail-thumbnails" aria-label="Product images">{images.map((image) => <SafeImage key={image} src={image} alt="" width={96} height={96} loading="lazy" fallbackLabel="Unavailable" />)}</div> : null}
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{product.merchant} · {product.isFixture ? "Preview data" : "Verified catalog record"}</p>
            <h1>{product.title}</h1>
            {product.brand ? <p className="detail-brand">by {product.brand}</p> : null}
            <div className="detail-price"><strong>{currency.format(product.price)}</strong>{product.mrp ? <s>{currency.format(product.mrp)}</s> : null}{discount ? <span>{discount}% off</span> : null}</div>
            <p className={`detail-stock${product.inStock ? "" : " out"}`}>{product.inStock ? "In stock" : "Currently unavailable"} on {product.merchant}</p>
            <AffiliateDisclosure />
            <p className="detail-description">{product.description ?? "A product record surfaced from the connected affiliate catalog, with price, availability and merchant context shown as supplied."}</p>
            <section className="merchant-offers" aria-label="Merchant offers">
              <h2>{sortedOffers.length > 1 ? "Comparable merchant offers · cheapest first" : "Merchant offer"}</h2>
              <div className="offer-list">
                {sortedOffers.map((offer) => <article className="offer-card" key={offer.id}>
                  <div className="offer-row"><span className="merchant-badge-static">{offer.merchant}</span><strong>{currency.format(offer.price)}</strong><span className="freshness">{offer.isFixture ? "Preview data" : offer.inStock ? "Available" : "Unavailable"}</span></div>
                  <ProductActions product={{ ...offer, lastSync: offer.lastSync.toISOString() }} />
                </article>)}
              </div>
            </section>
            <p className="detail-rating">Ratings and reviews are not shown unless supplied by a verified source.</p>
            {product.gtin ? <p className="detail-meta">GTIN: {product.gtin}</p> : null}
            <p className="detail-meta"><Link href={`/${country}/affiliate-disclosure`}>How affiliate links work →</Link></p>
          </div>
        </section>
        {related.length ? <section className="related-section" aria-labelledby="related-title"><p className="eyebrow">Continue exploring</p><h2 id="related-title">More in {categoryName(product.category)}</h2><div className="related-grid">{related.map((item) => <Link className="related-card" href={`/${country}/product/${item.slug}`} key={item.id}><span>{item.merchant}</span><strong>{item.title}</strong><b>{currency.format(item.price)}</b></Link>)}</div></section> : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd()) }} />
      </main>
    </>
  );
}
