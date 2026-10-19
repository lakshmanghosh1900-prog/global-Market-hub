"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCommerce } from "@/components/commerce-provider";
import { SafeImage } from "@/components/safe-image";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function WishlistCartDrawer() {
  const { cart, cartCount, drawerOpen, setDrawerOpen, removeFromCart, clearCart } = useCommerce();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen, setDrawerOpen]);

  const buyFromMerchant = async (item: (typeof cart)[number]) => {
    if (item.isFixture) {
      setError("Preview items do not have a live seller destination.");
      return;
    }
    setOpeningId(item.id);
    setError("");
    try {
      const response = await fetch("/api/v1/redirect/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: item.deepLink, productId: item.productId }),
      });
       const data = await response.json() as { redirectUrl?: string; error?: string };
       if (data.redirectUrl) window.location.assign(data.redirectUrl);
       else setError(data.error ?? "This seller offer is unavailable right now.");
    } catch {
      setError("We could not open the seller offer. Please try again.");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <>
      <button
        className="cart-tab"
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label={`Open saved cart with ${cartCount} items`}
      >
        Saved cart <span>{cartCount}</span>
      </button>
      {drawerOpen ? <button className="drawer-backdrop" type="button" aria-label="Close saved cart" onClick={() => setDrawerOpen(false)} /> : null}
       <aside className={`cart-drawer${drawerOpen ? " is-open" : ""}`} ref={drawerRef} role="dialog" aria-modal="true" aria-hidden={!drawerOpen} aria-label="Affiliate wishlist cart">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Affiliate wishlist cart</p>
            <h2>Saved for review <span>{cartCount}</span></h2>
          </div>
           <button className="drawer-close" ref={closeButtonRef} type="button" onClick={() => setDrawerOpen(false)} aria-label="Close saved cart">×</button>
        </div>

        <div className="cart-disclaimer" role="note">
          We are an affiliate discovery platform. Products added here are saved for your review. To purchase, you will be securely redirected to the official merchant site.
        </div>

        {cart.length === 0 ? (
          <div className="drawer-empty">
            <span>✦</span>
            <h3>Your saved cart is empty</h3>
            <p>Add products from any merchant to compare them here for up to 30 days.</p>
          </div>
        ) : (
          <>
            <div className="cart-items" aria-live="polite">
              {cart.map((item) => (
                <article className="cart-item" key={item.id}>
                  <div className="cart-item-image">
                     {item.imageUrl ? <SafeImage src={item.imageUrl} alt="" width={84} height={84} sizes="84px" fallbackLabel="Unavailable" /> : <span>GMH</span>}
                  </div>
                  <div className="cart-item-copy">
                    {item.slug ? <Link href={`/in/product/${item.slug}`} onClick={() => setDrawerOpen(false)}><strong>{item.title}</strong></Link> : <strong>{item.title}</strong>}
                    <div className="cart-item-meta">
                      <span className="merchant-badge-static">{item.merchantName}</span>
                      <strong>{currency.format(item.price)}</strong>
                    </div>
                    <p className={item.inStock ? "cart-stock" : "cart-stock is-out"}>{item.freshness}</p>
                    <div className="cart-item-actions">
                       <button className="button button-primary" type="button" onClick={() => void buyFromMerchant(item)} disabled={openingId === item.id || !item.inStock || item.isFixture}>
                         {openingId === item.id ? "Opening merchant…" : item.isFixture ? "Preview only" : item.inStock ? `Buy on ${item.merchantName} →` : "Unavailable"}
                      </button>
                      <button className="remove-line" type="button" onClick={() => removeFromCart(item.id)}>Remove</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
             <div className="cart-drawer-footer">
               {error ? <p className="action-error" role="alert">{error}</p> : null}
              <button className="button" type="button" onClick={clearCart}>Clear All</button>
              <p className="freshness-warning">Prices and availability can change. Global Market Hub does not process payments or complete orders.</p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
