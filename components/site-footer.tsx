export function SiteFooter() {
  return <footer className="site-footer"><div className="shell"><strong>Global Market Hub</strong> · Affiliate discovery only · No payment is collected here.<span className="footer-grievance">Grievance officer: {process.env.GRIEVANCE_OFFICER_NAME || "pending"} · {process.env.GRIEVANCE_OFFICER_EMAIL || "grievance@example.com"} · {process.env.GRIEVANCE_OFFICER_ADDRESS || "Address pending"}</span></div></footer>;
}
