import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUser } from "@/lib/auth";
import { getCommerceIdentity } from "@/lib/commerce-auth";
import { readCommerceState } from "@/lib/commerce-state";
import { isActiveCountry } from "@/lib/catalog-config";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Your account | Global Market Hub", description: "Your merged cart, wishlist, and price alerts." };

export default async function AccountPage({ params }: { params: { country: string } }) {
  if (!isActiveCountry(params.country)) notFound();
  const user = await getCurrentUser();
  if (!user) return <><Header /><main className="shell listing-main"><div className="empty-state"><h1>Sign in to view your account</h1><p>Your guest cart and wishlist stay available on this device.</p><Link className="button button-primary inline-button" href={`/${params.country}/login`}>Sign in with email OTP</Link></div></main></>;

  let state = { cart: [] as Array<{ id: string; title: string; merchantName: string; price: number }>, wishlist: [] as Array<{ id: string; title: string; slug: string; price: number }>, alerts: [] as Array<{ id: string; productTitle: string; targetPrice: number; active: boolean }> };
  try {
    const identity = await getCommerceIdentity();
    state = await readCommerceState(user.id, identity.sessionId) as typeof state;
  } catch {
    // The account surface still renders if the database has not been deployed.
  }

  return <><Header /><main className="shell listing-main account-main"><div className="account-heading"><div><p className="eyebrow">Signed in</p><h1>Your account</h1><p>{user.email}</p></div><SignOutButton /></div><div className="account-grid"><section className="account-panel"><h2>Saved cart</h2>{state.cart.length ? <ul>{state.cart.map((item) => <li key={item.id}>{item.title} · {item.merchantName} · ₹{item.price}</li>)}</ul> : <p>Your saved cart is empty.</p>}</section><section className="account-panel"><h2>Wishlist</h2>{state.wishlist.length ? <ul>{state.wishlist.map((item) => <li key={item.id}><Link href={`/${params.country}/product/${item.slug}`}>{item.title}</Link> · ₹{item.price}</li>)}</ul> : <p>Your wishlist is empty.</p>}</section><section className="account-panel"><h2>Price alerts</h2>{state.alerts.length ? <ul>{state.alerts.map((alert) => <li key={alert.id}>{alert.productTitle} below ₹{alert.targetPrice} · {alert.active ? "active" : "paused"}</li>)}</ul> : <p>No active price alerts yet.</p>}</section></div></main></>;
}
