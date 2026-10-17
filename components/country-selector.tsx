"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { countryRegistry, getCountry } from "@/lib/countries";

export function CountrySelector({ country = "in" }: { country?: string }) {
  const current = getCountry(country) ?? getCountry("in")!;
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        wrapperRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [open]);

  return (
    <div className="country-selector" ref={wrapperRef}>
      <button
        className="country-selector-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Choose market. Current market: ${current.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{current.code.toUpperCase()}</span>
        <span className="country-selector-name">{current.name}</span>
        <span className="country-selector-chevron" aria-hidden="true">{open ? "⌃" : "⌄"}</span>
      </button>
      {open ? (
        <div className="country-selector-menu" ref={menuRef} role="listbox" aria-label="Available markets">
          <p className="country-selector-heading">Choose a market</p>
          {countryRegistry.map((option) => (
            <Link
              className={`country-option${option.code === current.code ? " is-current" : ""}`}
              href={`/${option.code}`}
              key={option.code}
              role="option"
              aria-selected={option.code === current.code}
              onClick={() => setOpen(false)}
            >
              <span className="country-option-code">{option.code.toUpperCase()}</span>
              <span className="country-option-copy">
                <strong>{option.name}</strong>
                <small>{option.active ? `${option.currency} · Available` : "Coming soon · No live offers yet"}</small>
              </span>
              {option.code === current.code ? <span className="country-option-check" aria-label="Current market">✓</span> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
