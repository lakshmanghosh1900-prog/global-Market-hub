/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useCommerce } from "@/components/commerce-provider";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function WishlistClient() {
  const { wishlist, toggleWishlist, setTargetPrice } = useCommerce();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");

  const saveAlert = async (productId: string, targetPrice?: number) => {
    if (!targetPrice || targetPrice <= 0) return;
    setTargetPrice(productId, targetPrice);
    try {
      const response = await fetch("/api/price-alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: "browser-anonymous", productId, targetPrice, email: email || undefined }) });
      setNotice(response.ok ? "Price alert saved." : "Saved locally; add a database to sync alerts.");
    } catch {
      setNotice("Saved locally; price checks will sync when the database is connected.");
    }
  };

  return <div className="wishlist-list">{notice ? <p className="inline-notice">{notice}</p> : null}{wishlist.length === 0 ? <div className="empty-state"><span className="empty-icon">♡</span><h2>Your wishlist is waiting</h2><p>Tap the heart on a product to save it here and set a price alert.</p><Link className="button button-primary inline-button" href="/in/under/under-49">Browse Under ₹49</Link></div> : <>{wishlist.map((product) => <article className="wishlist-item" key={product.id}><div className="wishlist-image">{product.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={product.image} alt="" /> : <span>GMH</span>}</div><div className="wishlist-copy"><p className="freshness">Updated recently · {product.merchant}</p><h2><Link href={`/in/product/${product.slug}`}>{product.title}</Link></h2><p><strong>{currency.format(product.price)}</strong> <s>{product.mrp ? currency.format(product.mrp) : ""}</s> · added at {currency.format(product.addedPrice)}</p><div className="sparkline" aria-label="Mock 7-day price trend"><i /><i /><i /><i /><i /><i /><i /></div><div className="alert-row"><label htmlFor={`target-${product.id}`}>Alert below ₹</label><input id={`target-${product.id}`} type="number" min="1" defaultValue={product.targetPrice ?? Math.max(1, product.price - 5)} /><button className="button button-primary" type="button" onClick={(event) => { const input = (event.currentTarget.parentElement?.querySelector("input") as HTMLInputElement | null); void saveAlert(product.id, input ? Number(input.value) : undefined); }}>Set alert</button><input className="alert-email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email optional" type="email" aria-label="Email for price alert" /></div></div><button className="button button-heart is-active" type="button" aria-label={`Remove ${product.title} from wishlist`} onClick={() => toggleWishlist(product)}>♥</button></article>)}</>}</div>;
}
