import type { ListingProduct } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

export function ProductGrid({ products }: { products: ListingProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">✦</span>
        <h2>No products in this bracket yet</h2>
        <p>Run a Flipkart sync after adding your affiliate credentials to populate this page.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
