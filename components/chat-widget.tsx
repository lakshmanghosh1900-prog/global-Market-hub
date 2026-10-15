"use client";

import { useEffect, useState } from "react";

type Message = { role: "user" | "assistant"; text: string };
const CHAT_KEY = "gmh-chat-history-v1";

export function ChatWidget() {
  const enabled = process.env.NEXT_PUBLIC_CHATBOT_ENABLED !== "false";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Hi! Ask me about products under ₹49, categories, brackets, or how affiliate redirects work." }]);

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

  const ask = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setBusy(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
      const data = (await response.json()) as { answer?: string };
      setMessages((current) => [...current, { role: "assistant", text: data.answer ?? "Please try again or contact support on WhatsApp." }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "I’m offline right now. Please use WhatsApp support for help." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="chat-launcher" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Open customer support chat">{open ? "×" : "✦"}<span>Help</span></button>
      {open ? <section className="chat-panel" aria-label="Customer support chat"><div className="chat-header"><div><strong>GMH support</strong><small>Shopping help, no payment handled here</small></div><button type="button" onClick={() => setOpen(false)} aria-label="Close chat">×</button></div><div className="chat-messages">{messages.map((message, index) => <p className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</p>)}{busy ? <p className="chat-message assistant">Thinking…</p> : null}</div><div className="chat-links"><a href="/in/under/under-49">Under ₹49</a><a href="/in/search?q=electronics">Electronics</a><a href="/in/wishlist">Wishlist</a><a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER ?? "919999999999"}`}>WhatsApp</a></div><form className="chat-form" onSubmit={ask}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a shopping question" maxLength={500} aria-label="Chat message" /><button type="submit">Send</button></form></section> : null}
    </>
  );
}
