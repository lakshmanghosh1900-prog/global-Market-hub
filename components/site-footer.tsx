import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer"><div className="shell"><strong>{process.env.BRAND_NAME || process.env.NEXT_PUBLIC_BRAND_NAME || "Global Market Hub"}</strong> · Affiliate discovery only · No payment is collected here.<nav className="footer-links" aria-label="Legal links"><Link href="/in/about">About</Link><Link href="/in/privacy">Privacy</Link><Link href="/in/terms">Terms</Link><Link href="/in/grievance">Grievance</Link><Link href="/in/shipping-policy">Shipping policy</Link><Link href="/in/affiliate-disclosure">Affiliate disclosure</Link></nav><span className="footer-grievance">Grievance officer: {process.env.GRIEVANCE_OFFICER_NAME || "pending"} · {process.env.GRIEVANCE_OFFICER_EMAIL || "grievance@example.com"} · {process.env.GRIEVANCE_OFFICER_ADDRESS || "Address pending"}</span></div></footer>;
}
