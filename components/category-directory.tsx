import Link from "next/link";
import { canonicalCategories, categoryGroups } from "@/lib/taxonomy";

export function CategoryDirectory({ country = "in", compact = false }: { country?: string; compact?: boolean }) {
  const known = new Set(canonicalCategories.map((category) => category.slug));
  return (
    <div className={`category-directory-page${compact ? " is-compact" : ""}`}>
      {categoryGroups.map((group) => (
        <section className="category-group" key={group.name}>
          <div className="category-group-heading">
            <h2>{group.name}</h2>
            <span>{group.slugs.filter((slug) => known.has(slug)).length} categories</span>
          </div>
          <div className="category-group-links">
            {group.slugs.filter((slug) => known.has(slug)).map((slug) => {
              const label = canonicalCategories.find((category) => category.slug === slug)?.name ?? slug;
              return <Link href={`/${country}/c/${slug}`} key={slug}>{label}<span aria-hidden="true">↗</span></Link>;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
