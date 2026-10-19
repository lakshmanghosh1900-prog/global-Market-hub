import type { ListingProduct } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

export function ProductGrid({ products, country = "in" }: { products: ListingProduct[]; country?: string }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">✦</span>
        <h2>No matching products yet</h2>
        <p>Try another category or price range. When a verified merchant catalog is connected, eligible products will appear here.</p>
        <a className="button button-primary empty-action" href={`/${country}/search`}>Search the market</a>
      </div>
    );
  }

  return (
    <div className="product-grid">
        {products.map((product) => (
        <ProductCard key={product.id} product={product} country={country} />
      ))}
    </div>
  );
}
