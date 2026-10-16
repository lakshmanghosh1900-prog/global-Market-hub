"use client";

import { useCommerce } from "@/components/commerce-provider";

export function CartHeaderTrigger() {
  const { cartCount, setDrawerOpen } = useCommerce();

  return (
    <button className="header-cart-trigger" type="button" onClick={() => setDrawerOpen(true)} aria-label={`Open saved cart with ${cartCount} items`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M3 4h2l1.7 10.1a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.4L20 8H6.1M10 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" /></svg>
      <span className="header-cart-label">Saved cart</span>
      <span className={`header-cart-count${cartCount ? " has-items" : ""}`} aria-hidden="true">{cartCount}</span>
    </button>
  );
}
