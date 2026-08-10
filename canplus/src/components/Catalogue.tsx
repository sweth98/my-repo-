import { useState } from "react";
import { CATALOGUE, CATALOGUE_CATEGORIES } from "../content/site";
import { Reveal, Section, Tag, cx } from "../ui/primitives";

export default function Catalogue() {
  const [cat, setCat] = useState<string>("All");
  const shown = CATALOGUE.filter((c) => cat === "All" || c.cat === cat);

  return (
    <Section
      eyebrow="CanPlus Catalogue"
      title="Help learners discover what comes next."
      lede="Search, categories and learning pathways put the whole course library in one place, so learners can find the next step instead of asking where to look."
    >
      <Reveal delay={60}>
        <div className="mt-12 overflow-hidden rounded-2xl border border-line bg-mist-50 lg:mt-16">
          {/* ------------------------------------------------- search + filters */}
          <div className="border-b border-line bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-mist-50 px-3.5 py-3">
              <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="7" cy="7" r="4.5" />
                <path d="m10.5 10.5 3 3" strokeLinecap="round" />
              </svg>
              <span className="text-[0.875rem] text-muted">
                Search courses, skills and pathways
              </span>
              <span className="ml-auto hidden rounded border border-line bg-white px-1.5 py-0.5 font-mono text-[0.625rem] text-muted sm:block">
                SmartSearch
              </span>
            </div>

            <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Course categories">
              {CATALOGUE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={cat === c}
                  onClick={() => setCat(c)}
                  className={cx(
                    "shrink-0 rounded-lg px-3.5 py-2 text-[0.8125rem] font-medium transition-colors",
                    "min-h-[44px]",
                    cat === c
                      ? "bg-navy-900 text-white"
                      : "bg-mist-100 text-body hover:bg-mist-200 hover:text-ink",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------------ course grid */}
          <div className="p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((c) => (
                <article
                  key={c.title}
                  className="group flex flex-col rounded-xl border border-line bg-white p-4 transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
                >
                  <div
                    aria-hidden="true"
                    className="mb-4 h-20 rounded-lg bg-gradient-to-br from-brand-100 via-mist-100 to-accent-100"
                  />
                  <div className="flex items-center gap-2">
                    <Tag>{c.cat}</Tag>
                    <span className="text-[0.6875rem] text-muted">{c.level}</span>
                  </div>
                  <h3 className="mt-2.5 text-[0.9375rem]">{c.title}</h3>
                  <p className="mt-1 text-[0.75rem] text-muted">{c.weeks} weeks</p>

                  {/* Skill tags surface on hover — the card stays quiet at rest. */}
                  <div className="mt-3 flex flex-wrap gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-lg:opacity-100">
                    {c.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-mist-100 px-1.5 py-0.5 text-[0.625rem] text-body ring-1 ring-inset ring-line"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-4 text-center text-[0.75rem] text-muted">
              Course titles shown are interface examples, not CanPlus course offerings.
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
