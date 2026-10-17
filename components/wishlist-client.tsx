"use client";

import Link from "next/link";
import { useState } from "react";
import { useCommerce } from "@/components/commerce-provider";
import { SafeImage } from "@/components/safe-image";

export function WishlistClient({ country = "in" }: { country?: string }) {
  const { wishlist, toggleWishlist, setTargetPrice } = useCommerce();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const currency = new Intl.NumberFormat(country === "in" ? "en-IN" : "en-US", { style: "currency", currency: country === "in" ? "INR" : "USD", maximumFractionDigits: 0 });

  const saveAlert = async (productId: string, targetPrice?: number, isFixture?: boolean) => {
    if (!targetPrice || targetPrice <= 0) {
      setError("Enter a target price greater than zero.");
      return;
    }
    if (isFixture) {
      setError("Preview fixtures cannot create live price alerts.");
      return;
    }
    setError("");
    setTargetPrice(productId, targetPrice);
    try {
      const response = await fetch("/api/price-alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, targetPrice, email: email || undefined }) });
      setNotice(response.ok ? "Price alert saved. Delivery remains disabled until a provider is configured." : "The alert was saved locally; server sync is unavailable.");
    } catch {
      setNotice("The alert was saved locally; price checks will sync when the database is connected.");
    }
  };

  return (
    <div className="wishlist-list">
      {notice ? <p className="inline-notice" role="status">{notice}</p> : null}
      {error ? <p className="alert-error" role="alert">{error}</p> : null}
      {wishlist.length === 0 ? (
        <div className="empty-state"><span className="empty-icon">♡</span><h2>Your wishlist is waiting</h2><p>Tap the heart on a product to save it here and set a price alert.</p><Link className="button button-primary inline-button" href={`/${country}/under/under-49`}>Browse Under ₹49</Link></div>
      ) : (
        wishlist.map((product) => (
          <article className="wishlist-item" key={product.id}>
            <div className="wishlist-image">{product.image ? <SafeImage src={product.image} alt="" width={160} height={160} loading="lazy" fallbackLabel="Product image unavailable" /> : <span>GMH</span>}</div>
            <div className="wishlist-copy">
              <p className="freshness">{product.isFixture ? "Preview fixture" : "Saved product"} · {product.merchant}</p>
              <h2><Link href={`/${country}/product/${product.slug}`}>{product.title}</Link></h2>
              <p><strong>{currency.format(product.price)}</strong>{product.mrp ? <s>{currency.format(product.mrp)}</s> : null} · saved at {currency.format(product.addedPrice)}</p>
              <p className="price-history-note">Price history appears after verified catalog observations are available.</p>
              <div className="alert-row">
                <label htmlFor={`target-${product.id}`}>Alert below {country === "in" ? "₹" : "$"}</label>
                <input id={`target-${product.id}`} type="number" min="1" defaultValue={product.targetPrice ?? Math.max(1, product.price - 5)} disabled={product.isFixture} />
                <button className="button button-primary" type="button" disabled={product.isFixture} onClick={(event) => { const input = event.currentTarget.parentElement?.querySelector("input"); void saveAlert(product.id, input instanceof HTMLInputElement ? Number(input.value) : undefined, product.isFixture); }}>Set alert</button>
                <label className="sr-only" htmlFor={`email-${product.id}`}>Email for price alert</label>
                <input id={`email-${product.id}`} className="alert-email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email optional" type="email" disabled={product.isFixture} />
              </div>
            </div>
            <button className="button button-heart is-active" type="button" aria-label={`Remove ${product.title} from wishlist`} aria-pressed="true" onClick={() => toggleWishlist(product)}>♥</button>
          </article>
        ))
      )}
    </div>
  );
}
