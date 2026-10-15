export function MerchantNotes() {
  return (
    <aside className="merchant-notes" aria-label="Catalog notes">
      <div>
        <span className="note-kicker">Catalog status</span>
        <p><strong>Flipkart</strong> is the live catalog connector for Sprint 1.</p>
      </div>
      <div>
        <span className="note-kicker">Amazon</span>
        <p>Curated listings placeholder until Creators API access is verified.</p>
      </div>
      <div>
        <span className="note-kicker">Cuelinks</span>
        <p>Deals-only fallback; Cuelinks does not provide a product feed.</p>
      </div>
    </aside>
  );
}
