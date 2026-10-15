/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ProductActions } from "@/components/product-actions";
import type { ListingProduct } from "@/lib/types";
import { organizationJsonLd, safeJsonLd, siteUrl } from "@/lib/seo";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ProductDetail({ product, related, country }: { product: ListingProduct; related: ListingProduct[]; country: string }) {
  const discount = product.mrp && product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : null;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.gallery?.length ? product.gallery : product.image ? [product.image] : undefined,
    sku: product.sku,
    gtin: product.gtin || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}/${country}/product/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      availability: `https://schema.org/${product.inStock ? "InStock" : "OutOfStock"}`,
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "India", item: `${siteUrl()}/${country}` },
      { "@type": "ListItem", position: 2, name: product.category, item: `${siteUrl()}/${country}/${product.category.startsWith("under-") ? `under/${product.category}` : `c/${product.category}`}` },
      { "@type": "ListItem", position: 3, name: product.title, item: `${siteUrl()}/${country}/product/${product.slug}` },
    ],
  };

  const categoryPath = product.category.startsWith("under-") ? `under/${product.category}` : `c/${product.category}`;
  return <><main className="shell product-detail"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href={`/${country}`}>India</Link><span>/</span><Link href={`/${country}/${categoryPath}`}>{product.category}</Link><span>/</span><span>{product.title}</span></nav><section className="detail-layout"><div className="detail-gallery"><div className="detail-image">{product.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={product.image} alt={product.title} /> : <span>GMH</span>}</div><div className="detail-thumbnails">{(product.gallery?.length ? product.gallery : product.image ? [product.image] : []).map((image) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={image} src={image} alt="" />)}</div></div><div className="detail-copy"><p className="eyebrow">{product.merchant} · Updated recently</p><h1>{product.title}</h1>{product.brand ? <p className="detail-brand">by {product.brand}</p> : null}<div className="detail-price"><strong>{currency.format(product.price)}</strong>{product.mrp ? <s>{currency.format(product.mrp)}</s> : null}{discount ? <span>{discount}% off</span> : null}</div><p className={`detail-stock${product.inStock ? "" : " out"}`}>{product.inStock ? "In stock" : "Currently unavailable"} on {product.merchant}</p><p className="detail-description">{product.description ?? "A useful everyday pick surfaced from our freshly synced affiliate catalog."}</p><section className="merchant-offers" aria-label="Merchant offers"><h2>Merchant offers · cheapest first</h2><div className="offer-row"><span className="merchant-badge">{product.merchant}</span><strong>{currency.format(product.price)}</strong><span className="freshness">Updated recently</span></div></section><p className="detail-rating">Rating unavailable for this affiliate catalog.</p><ProductActions product={{ ...product, lastSync: product.lastSync.toISOString() }} />{product.gtin ? <p className="detail-meta">GTIN: {product.gtin}</p> : null}<p className="detail-meta">Prices and stock can change at the merchant. Affiliate clickout only; no payment is collected here.</p></div></section><section className="related-section"><p className="eyebrow">You may also like</p><div className="related-grid">{related.map((item) => <Link className="related-card" href={`/${country}/product/${item.slug}`} key={item.id}><span>{item.merchant}</span><strong>{item.title}</strong><b>{currency.format(item.price)}</b></Link>)}</div></section></main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd()) }} /></>;
}
