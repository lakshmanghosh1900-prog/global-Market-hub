"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const STORAGE_KEY = "gmh-commerce-v1";

export function LoginForm() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  if (!supabase) {
    return <div className="empty-state"><h2>Sign-in is being configured</h2><p>Supabase email OTP credentials are not set for this deployment. Guest cart and wishlist remain available on this device.</p></div>;
  }

  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) setNotice(error.message);
    else { setSent(true); setNotice("Check your email for the six-digit verification code."); }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: "email" });
    if (error) {
      setBusy(false);
      setNotice(error.message);
      return;
    }

    let local: { cart?: unknown[]; wishlist?: unknown[] } = {};
    try { local = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { /* ignore malformed local state */ }
    const mergeResponse = await fetch("/api/commerce/merge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cart: local.cart ?? [], wishlist: local.wishlist ?? [] }),
    });
    setBusy(false);
    if (!mergeResponse.ok) {
      setNotice("You are signed in, but the server merge is waiting for the database migration.");
      return;
    }
    window.dispatchEvent(new Event("gmh-auth-changed"));
    window.location.assign("/in/account");
  };

  return <div className="auth-card">
    <p className="eyebrow">Secure account</p>
    <h2>Sign in with email OTP</h2>
    <p>No password to remember. We will email a one-time verification code.</p>
    <form onSubmit={sent ? verifyCode : sendCode}>
      <label htmlFor="login-email">Email address</label>
      <input id="login-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
      {sent ? <><label htmlFor="login-token">Verification code</label><input id="login-token" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={token} onChange={(event) => setToken(event.target.value)} placeholder="123456" autoComplete="one-time-code" /></> : null}
      <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Working…" : sent ? "Verify and merge" : "Email me a code"}</button>
    </form>
    {notice ? <p className="inline-notice" role="status">{notice}</p> : null}
    {sent ? <button className="button" type="button" onClick={() => { setSent(false); setToken(""); setNotice(""); }}>Use a different email</button> : null}
  </div>;
}
