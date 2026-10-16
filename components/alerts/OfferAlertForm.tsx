"use client";

import { useEffect, useRef, useState } from "react";
import { ALERT_BRACKET_OPTIONS, ALERT_CATEGORY_OPTIONS } from "@/lib/offer-alerts";

export function OfferAlertForm() {
  const [email, setEmail] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [whatsappNo, setWhatsappNo] = useState("");
  const [hasWhatsappConsent, setHasWhatsappConsent] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["trending"]);
  const [selectedBrackets, setSelectedBrackets] = useState<string[]>(["under-99"]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Your preferences were saved. No email was sent in this buildathon demo; alerts remain pending verification.");
  const [mockVerificationUrl, setMockVerificationUrl] = useState<string | undefined>();
  const successDialogRef = useRef<HTMLDialogElement>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = successDialogRef.current;
    if (!dialog) return;

    if (success) {
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!dialog.open) dialog.showModal();
      window.requestAnimationFrame(() => doneButtonRef.current?.focus());
      return;
    }

    if (dialog.open) dialog.close();
    const elementToRestore = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (elementToRestore?.isConnected) elementToRestore.focus();
  }, [success]);

  const toggle = (value: string, selected: string[], setSelected: (next: string[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMockVerificationUrl(undefined);
    if (!consent) {
      setError("Please accept the consent statement before subscribing.");
      return;
    }
    if (!selectedCategories.length || !selectedBrackets.length) {
      setError("Choose at least one category and one deal bracket.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          phoneNo,
          whatsappNo,
          hasWhatsappConsent,
          categories: selectedCategories,
          priceBrackets: selectedBrackets,
          consent,
        }),
      });
      const data = await response.json() as { error?: string; message?: string; mockVerificationUrl?: string };
      if (!response.ok) {
        setError(data.error ?? "We could not save your alert subscription.");
        return;
      }
      setSuccessMessage(data.message ?? "Your preferences were saved. No email was sent; alerts remain pending verification.");
      setMockVerificationUrl(data.mockVerificationUrl);
      setSuccess(true);
    } catch {
      setError("We could not reach the alert service. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form className="alert-form" onSubmit={submit} aria-busy={busy}>
        <div className="alert-form-grid">
          <label htmlFor="alert-email">
            Email address <span aria-hidden="true">*</span>
            <input id="alert-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} autoComplete="email" placeholder="you@example.com" />
          </label>
          <label htmlFor="alert-phone">
            Mobile number <small>Optional</small>
            <input id="alert-phone" type="tel" value={phoneNo} onChange={(event) => setPhoneNo(event.target.value)} maxLength={20} pattern="[+]?[0-9()\s-]{8,20}" autoComplete="tel" placeholder="+91 98765 43210" />
          </label>
        </div>

        <div className="alert-whatsapp-row">
          <label className="alert-checkbox-label" htmlFor="alert-whatsapp-consent"><input id="alert-whatsapp-consent" type="checkbox" checked={hasWhatsappConsent} onChange={(event) => setHasWhatsappConsent(event.target.checked)} /> Receive instant deal drops on WhatsApp</label>
          {hasWhatsappConsent ? <input id="alert-whatsapp" className="alert-whatsapp-input" type="tel" value={whatsappNo} onChange={(event) => setWhatsappNo(event.target.value)} required maxLength={20} pattern="[+]?[0-9()\s-]{8,20}" placeholder="WhatsApp number" aria-label="WhatsApp number" autoComplete="tel" /> : null}
        </div>

        <fieldset>
          <legend>Categories</legend>
          <div className="alert-tags">
            {ALERT_CATEGORY_OPTIONS.map(([value, label]) => <label className={`alert-tag${selectedCategories.includes(value) ? " is-selected" : ""}`} htmlFor={`alert-category-${value}`} key={value}><input id={`alert-category-${value}`} type="checkbox" checked={selectedCategories.includes(value)} onChange={() => toggle(value, selectedCategories, setSelectedCategories)} />{label}</label>)}
          </div>
        </fieldset>

        <fieldset>
          <legend>Deal brackets</legend>
          <div className="alert-tags">
            {ALERT_BRACKET_OPTIONS.map(([value, label]) => <label className={`alert-tag${selectedBrackets.includes(value) ? " is-selected" : ""}`} htmlFor={`alert-bracket-${value}`} key={value}><input id={`alert-bracket-${value}`} type="checkbox" checked={selectedBrackets.includes(value)} onChange={() => toggle(value, selectedBrackets, setSelectedBrackets)} />{label}</label>)}
          </div>
        </fieldset>

        <label className="alert-consent" htmlFor="alert-consent"><input id="alert-consent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /> I agree to receive price drop alerts and personalized offers. I can unsubscribe anytime.</label>
        {error ? <p className="alert-error" role="alert" aria-live="polite">{error}</p> : null}
        <button className="button button-primary alert-submit" type="submit" disabled={busy} aria-disabled={busy}>
          {busy ? <><span className="alert-spinner" aria-hidden="true" /> Saving your preferences…</> : "Notify me about the best offers"}
        </button>
        <p className="alert-privacy-note">You can unsubscribe at any time. WhatsApp messages are sent only when you opt in above.</p>
      </form>

      <dialog ref={successDialogRef} className="alert-modal-backdrop" hidden={!success} role="dialog" aria-modal="true" aria-labelledby="alert-success-title" aria-describedby="alert-success-description" onCancel={() => setSuccess(false)} onClose={() => setSuccess(false)}>
        <div className="alert-success-modal">
          <span className="alert-success-icon" aria-hidden="true">✓</span>
          <h3 id="alert-success-title">You’re on the list</h3>
          <p id="alert-success-description">{successMessage}</p>
          {mockVerificationUrl ? <p><a href={mockVerificationUrl}>Open mock verification link</a></p> : null}
          <button ref={doneButtonRef} className="button button-primary" type="button" onClick={() => setSuccess(false)}>Done</button>
        </div>
      </dialog>
    </>
  );
}
