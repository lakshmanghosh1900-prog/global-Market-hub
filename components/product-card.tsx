import type { ListingProduct } from "@/lib/types";
import Link from "next/link";
import { ProductActions } from "@/components/product-actions";
import { SafeImage } from "@/components/safe-image";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function freshnessLabel(lastSync: Date) {
  const elapsedHours = Math.max(0, Math.floor((Date.now() - lastSync.getTime()) / 3_600_000));
  if (elapsedHours < 1) return "Updated just now";
  if (elapsedHours === 1) return "Updated 1h ago";
  if (elapsedHours < 24) return `Updated ${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Updated ${elapsedDays}d ago`;
}

function discountPercent(price: number, mrp: number | null) {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function ProductCard({ product, country = "in" }: { product: ListingProduct; country?: string }) {
  const discount = discountPercent(product.price, product.mrp);
  return (
    <article className="product-card">
      <Link className="product-image-wrap" href={`/${country}/product/${product.slug}`} aria-label={`View ${product.title}`}>
        {product.image ? (
          <SafeImage className="product-image" src={product.image} alt="" width={640} height={640} sizes="(max-width: 700px) 50vw, 25vw" fallbackLabel="Product image unavailable" />
        ) : (
          <span className="product-image-fallback">GMH</span>
        )}
        <span className="merchant-badge">{product.merchant}</span>
      </Link>

      <div className="product-card-body">
        <p className="freshness">{freshnessLabel(product.lastSync)}</p>
        <h2 className="product-title">
          <Link href={`/${country}/product/${product.slug}`}>{product.title}</Link>
        </h2>
        {product.brand ? <p className="product-brand">{product.brand}</p> : null}
        <div className="price-row">
          <strong className="price">{currency.format(product.price)}</strong>
          {product.mrp ? <span className="mrp">{currency.format(product.mrp)}</span> : null}
          {discount ? <span className="discount">{discount}% off</span> : null}
        </div>
        <p className="stock-label">{product.inStock ? `In stock on ${product.merchant}` : "Currently unavailable"}</p>
        {product.isFixture ? <p className="fixture-label">Preview fixture · seller action disabled</p> : null}
        <AffiliateDisclosure />
        <ProductActions product={{ ...product, lastSync: product.lastSync.toISOString() }} />
      </div>
    </article>
  );
}
