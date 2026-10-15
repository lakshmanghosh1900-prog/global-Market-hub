"use client";

import { useState } from "react";
import { useCommerce } from "@/components/commerce-provider";
import type { ListingProduct } from "@/lib/types";

type ProductActionData = Omit<ListingProduct, "lastSync"> & { lastSync: string };

export function ProductActions({ product }: { product: ProductActionData }) {
  const { addToCart, toggleWishlist, isWishlisted } = useCommerce();
  const [redirecting, setRedirecting] = useState(false);
  const wishlisted = isWishlisted(product.id);

  const viewOffer = async () => {
    setRedirecting(true);
    try {
      const response = await fetch("/api/v1/redirect/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: product.affiliateUrl, productId: product.id }),
      });
      const data = (await response.json()) as { redirectUrl?: string };
      if (data.redirectUrl) window.location.assign(data.redirectUrl);
    } finally {
      setRedirecting(false);
    }
  };

  return (
    <div className="product-actions">
      <button className="button button-primary" type="button" onClick={() => addToCart({ ...product, lastSync: new Date(product.lastSync) })} disabled={!product.inStock}>
        {product.inStock ? "Add to Cart" : "Out of stock"}
      </button>
      <button className={`button button-heart${wishlisted ? " is-active" : ""}`} type="button" aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={wishlisted} onClick={() => toggleWishlist({ ...product, lastSync: new Date(product.lastSync) })}>
        {wishlisted ? "♥" : "♡"}
      </button>
      <button className="button button-offer" type="button" onClick={viewOffer} disabled={redirecting || !product.inStock}>
        {redirecting ? "Opening…" : "View Offer"}
      </button>
    </div>
  );
}
