"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SafeImage } from "@/components/safe-image";

type Recommendation = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  merchant: string;
  inStock: boolean;
  isFixture: boolean;
  detailHref: string;
  sellerEligible: boolean;
};
type LinkItem = { label: string; href: string };
type Message = { role: "user" | "assistant"; text: string; links?: LinkItem[]; recommendations?: Recommendation[] };
const CHAT_KEY = "gmh-chat-history-v1";

const formatPrice = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ChatWidget() {
  const enabled = process.env.NEXT_PUBLIC_CHATBOT_ENABLED !== "false";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Hi! Ask about products, categories, price ranges, merchant links, saved products or how checkout works." }]);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem(CHAT_KEY) ?? "null") as Message[] | null;
      if (history?.length) setMessages(history);
    } catch {
      localStorage.removeItem(CHAT_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-20)));
  }, [messages]);

  if (!enabled) return null;

  const openOffer = async (recommendation: Recommendation) => {
    if (!recommendation.sellerEligible) return;
    setError("");
    try {
      const response = await fetch("/api/v1/redirect/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: recommendation.id }) });
      const data = await response.json() as { redirectUrl?: string; error?: string };
      if (data.redirectUrl) window.location.assign(data.redirectUrl);
      else setError(data.error ?? "This seller offer is unavailable.");
    } catch {
      setError("We could not open the seller offer. Please try again.");
    }
  };

  const ask = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setError("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setBusy(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
      const data = await response.json() as { answer?: string; links?: LinkItem[]; recommendations?: Recommendation[] };
      setMessages((current) => [...current, { role: "assistant", text: data.answer ?? "Please try again or use the help links below.", links: data.links, recommendations: data.recommendations }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "I’m offline right now. Please use the category and price links below for help." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="chat-launcher" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="support-chat" aria-label="Open customer support chat">{open ? "×" : "✦"}<span>Help</span></button>
      {open ? <section className="chat-panel" id="support-chat" aria-label="Customer support chat"><div className="chat-header"><div><strong>GMH support</strong><small>Search-backed help, no payment handled here</small></div><button type="button" onClick={() => setOpen(false)} aria-label="Close chat">×</button></div><div className="chat-messages" aria-live="polite">{messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><p>{message.text}</p>{message.links?.length ? <div className="chat-message-links">{message.links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}</div> : null}{message.recommendations?.length ? <div className="chat-recommendations">{message.recommendations.map((recommendation) => <article className="chat-recommendation" key={recommendation.id}><div className="chat-recommendation-image">{recommendation.image ? <SafeImage src={recommendation.image} alt="" width={52} height={52} fallbackLabel="Unavailable" /> : <span>GMH</span>}</div><div><Link href={recommendation.detailHref}><strong>{recommendation.title}</strong></Link><small>{formatPrice.format(recommendation.price)} · {recommendation.merchant}</small>{recommendation.isFixture ? <em>Preview only</em> : recommendation.sellerEligible ? <button type="button" onClick={() => void openOffer(recommendation)}>View seller offer →</button> : <em>Seller offer unavailable</em>}</div></article>)}</div> : null}</div>)}{busy ? <p className="chat-message assistant">Searching the connected catalog…</p> : null}{error ? <p className="chat-error" role="alert">{error}</p> : null}</div><div className="chat-links"><Link href="/in/under/under-49">Under ₹49</Link><Link href="/in/categories">Categories</Link><Link href="/in/wishlist">Wishlist</Link><a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER ?? "919999999999"}`}>WhatsApp</a></div><form className="chat-form" onSubmit={ask}><label className="sr-only" htmlFor="chat-message">Chat message</label><input id="chat-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a shopping question" maxLength={500} /><button type="submit" disabled={busy}>Send</button></form></section> : null}
    </>
  );
}
