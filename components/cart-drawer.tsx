"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCommerce } from "@/components/commerce-provider";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function CartDrawer() {
  const { cart, cartCount, drawerOpen, setDrawerOpen, removeFromCart, setQuantity } = useCommerce();
  const [checkingOut, setCheckingOut] = useState(false);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const mrp = useMemo(() => cart.reduce((sum, item) => sum + (item.mrp ?? item.price) * item.quantity, 0), [cart]);
  const merchants = Array.from(new Set(cart.map((item) => item.merchant)));

  const checkoutAll = async () => {
    setCheckingOut(true);
    try {
      for (const item of cart) {
        const response = await fetch("/api/v1/redirect/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: item.affiliateUrl }) });
        const data = (await response.json()) as { redirectUrl?: string };
        if (data.redirectUrl) window.open(data.redirectUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <>
      <button className="cart-tab" type="button" onClick={() => setDrawerOpen(true)} aria-label={`Open cart with ${cartCount} items`}>
        Cart <span>{cartCount}</span>
      </button>
      {drawerOpen ? <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} /> : null}
      <aside className={`cart-drawer${drawerOpen ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Affiliate cart">
        <div className="drawer-header"><div><p className="eyebrow">Universal affiliate cart</p><h2>Your cart <span>{cartCount}</span></h2></div><button className="drawer-close" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close cart">×</button></div>
        {cart.length === 0 ? <div className="drawer-empty"><span>✦</span><h3>Your cart is empty</h3><p>Save products from different merchants here, then visit each merchant to complete checkout.</p></div> : <>
          {merchants.map((merchant) => <section className="merchant-group" key={merchant}><h3>{merchant}</h3>{cart.filter((item) => item.merchant === merchant).map((item) => <div className="cart-line" key={item.id}><div><Link href={`/in/product/${item.slug}`} onClick={() => setDrawerOpen(false)}><strong>{item.title}</strong></Link><p>{currency.format(item.price)} · Updated recently</p></div><div className="quantity-controls"><button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.title}`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.title}`}>+</button><button className="remove-line" type="button" onClick={() => removeFromCart(item.id)}>Remove</button></div></div>)}</section>)}
          <div className="cart-summary"><p><span>Total MRP</span><strong>{currency.format(mrp)}</strong></p><p><span>Your price</span><strong>{currency.format(total)}</strong></p><p className="savings"><span>Estimated savings</span><strong>{currency.format(Math.max(0, mrp - total))}</strong></p></div>
          <button className="button button-primary cart-checkout" type="button" onClick={checkoutAll} disabled={checkingOut}>{checkingOut ? "Opening merchant offers…" : "Checkout merchant offers"}</button><p className="freshness-warning">Prices and availability can change. Checkout happens on each merchant site; Global Market Hub does not take payment.</p>
        </>}
      </aside>
    </>
  );
}
