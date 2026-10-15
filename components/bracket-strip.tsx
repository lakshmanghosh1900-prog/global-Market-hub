import Link from "next/link";

export function BracketStrip({ country = "in", activeBracket = "under-49" }: { country?: string; activeBracket?: string }) {
  const brackets = [
    { label: "Under ₹49", href: `/${country}/under/under-49`, active: activeBracket === "under-49" },
    { label: "Under ₹99", href: `/${country}/under/under-99`, active: activeBracket === "under-99" },
    { label: "Under ₹199", href: `/${country}/under/under-199`, active: activeBracket === "under-199" },
    { label: "Under ₹499", href: `/${country}/under/under-499`, active: activeBracket === "under-499" },
  ];
  return (
    <nav className="bracket-strip" aria-label="Price brackets">
      <div className="shell bracket-scroll">
        {brackets.map((bracket) => (
          <Link
            className={`bracket-link${bracket.active ? " is-active" : ""}`}
            href={bracket.href}
            key={bracket.href}
          >
            {bracket.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
