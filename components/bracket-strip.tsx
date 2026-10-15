import Link from "next/link";

const brackets = [
  { label: "Under ₹49", href: "/in/under/under-49", active: true },
  { label: "Under ₹99", href: "/in/under/under-99", active: false },
  { label: "Under ₹199", href: "/in/under/under-199", active: false },
  { label: "Under ₹499", href: "/in/under/under-499", active: false },
];

export function BracketStrip() {
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
