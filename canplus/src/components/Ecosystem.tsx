import { useState } from "react";
import { JOURNEY } from "../content/site";
import { Reveal, Section, cx } from "../ui/primitives";

export default function Ecosystem() {
  const [active, setActive] = useState(0);
  const stage = JOURNEY[active] ?? JOURNEY[0]!;

  return (
    <Section
      id="platform"
      eyebrow="The platform"
      title={
        <>
          One platform.
          <br />
          Every stage of learning.
        </>
      }
      lede="From discovery to practice to credentials, CanPlus connects the learning journey instead of scattering it across disconnected tools."
      tone="mist"
      titleWrap="manual"
    >
      {/* ------------------------------------------------------- stage rail */}
      <Reveal delay={80}>
        <div className="mt-12 lg:mt-16">
          {/* Horizontal scroll on small screens rather than a cramped grid. */}
          <ol
            className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-visible lg:px-0"
            role="tablist"
            aria-label="Learning journey stages"
          >
            {JOURNEY.map((s, i) => {
              const on = i === active;
              return (
                <li key={s.id} className="min-w-[10.5rem] shrink-0 snap-start lg:min-w-0">
                  <button
                    role="tab"
                    aria-selected={on}
                    aria-controls="journey-detail"
                    onClick={() => setActive(i)}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className={cx(
                      "group relative w-full rounded-xl border p-4 text-left transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
                      "min-h-[92px]",
                      on
                        ? "border-brand-200 bg-white shadow-soft"
                        : "border-line bg-white/60 hover:border-line-strong hover:bg-white",
                    )}
                  >
                    <span
                      className={cx(
                        "font-mono text-[0.625rem] transition-colors",
                        on ? "text-brand-600" : "text-muted",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cx(
                        "mt-1.5 block text-sm font-semibold uppercase tracking-wide transition-colors",
                        on ? "text-ink" : "text-body",
                      )}
                    >
                      {s.stage}
                    </span>
                    <span className="mt-1 block text-[0.6875rem] leading-snug text-muted">
                      {s.module}
                    </span>
                    <span
                      className={cx(
                        "absolute inset-x-4 bottom-0 h-0.5 origin-left rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-transform duration-500",
                        on ? "scale-x-100" : "scale-x-0",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </Reveal>

      {/* ----------------------------------------------------- detail panel */}
      <Reveal delay={120}>
        <div
          id="journey-detail"
          role="tabpanel"
          className="mt-4 grid gap-8 rounded-2xl border border-line bg-white p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 lg:p-10"
        >
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-brand-600">
              {stage.stage}
            </p>
            <h3 className="mt-3 text-xl sm:text-2xl">{stage.module}</h3>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-body">{stage.blurb}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {stage.points.map((p) => (
                <li
                  key={p}
                  className="rounded-lg bg-mist-100 px-3 py-1.5 text-[0.8125rem] text-body ring-1 ring-inset ring-line"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <StageVisual index={active} />
        </div>
      </Reveal>
    </Section>
  );
}

/* ---------------------------------------------------------------------------
   A small, distinct visual per stage. Deliberately schematic: enough to show
   what the stage looks like in product without pretending to be a screenshot.
--------------------------------------------------------------------------- */
function StageVisual({ index }: { index: number }) {
  const shell =
    "relative overflow-hidden rounded-xl border border-line bg-mist-50 p-5 min-h-[13rem]";

  if (index === 0)
    return (
      <div className={shell}>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" strokeLinecap="round" />
          </svg>
          <span className="text-[0.8125rem] text-body">cloud security</span>
        </div>
        <div className="mt-3 grid gap-2">
          {["Cloud Computing", "Cybersecurity", "Secure Deployment"].map((t, i) => (
            <div
              key={t}
              className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2.5"
              style={{ opacity: 1 - i * 0.18 }}
            >
              <span className="text-[0.8125rem] font-medium text-ink">{t}</span>
              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[0.625rem] text-brand-700">
                Course
              </span>
            </div>
          ))}
        </div>
      </div>
    );

  if (index === 1)
    return (
      <div className={shell}>
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="grid h-24 place-items-center bg-navy-900">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20">
              <svg viewBox="0 0 16 16" className="ml-0.5 h-4 w-4 text-white" fill="currentColor">
                <path d="M5 3.5v9l7.5-4.5z" />
              </svg>
            </span>
          </div>
          <div className="p-3">
            <div className="h-1 w-full overflow-hidden rounded-full bg-mist-200">
              <div className="h-full w-2/5 rounded-full bg-brand-500" />
            </div>
            <p className="mt-2.5 text-[0.75rem] font-medium text-ink">Module 4 · Prompting</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["Transcript", "Notes", "Resources"].map((t) => (
            <span key={t} className="rounded-lg border border-line bg-white px-2 py-2 text-center text-[0.6875rem] text-body">
              {t}
            </span>
          ))}
        </div>
      </div>
    );

  if (index === 2)
    return (
      <div className={cx(shell, "bg-navy-950 border-navy-800")}>
        <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-[0.6875rem] text-brand-200/80">lab · environment ready</span>
        </div>
        <pre className="mt-3 overflow-hidden font-mono text-[0.6875rem] leading-relaxed text-brand-100/90">
{`$ deploy --env sandbox
✓ resources provisioned
✓ policy applied
$ verify --task 3`}
        </pre>
        <span className="mt-1 inline-block h-3 w-1.5 bg-brand-400 animate-caret" aria-hidden="true" />
      </div>
    );

  if (index === 3)
    return (
      <div className={shell}>
        <div className="grid gap-2">
          {[
            { q: "Question 1", s: "Correct", ok: true },
            { q: "Question 2", s: "Correct", ok: true },
            { q: "Project submission", s: "In review", ok: false },
          ].map((r) => (
            <div key={r.q} className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2.5">
              <span className="text-[0.8125rem] text-ink">{r.q}</span>
              <span
                className={cx(
                  "rounded px-1.5 py-0.5 text-[0.625rem] font-medium",
                  r.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                )}
              >
                {r.s}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-line">
          <div className="flex items-center justify-between text-[0.6875rem] text-muted">
            <span>Overall</span>
            <span className="font-semibold text-ink">86%</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-mist-200">
            <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-brand-500 to-accent-500" />
          </div>
        </div>
      </div>
    );

  if (index === 4)
    return (
      <div className={cx(shell, "grid place-items-center")}>
        <div className="w-full max-w-[15rem] rounded-xl border border-line bg-white p-5 text-center shadow-soft">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-50 to-accent-50 ring-1 ring-accent-100">
            <svg viewBox="0 0 20 20" className="h-5 w-5 text-accent-600" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="10" cy="8" r="4.2" />
              <path d="M7 12.5 6 18l4-2 4 2-1-5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="mt-3 text-[0.6875rem] uppercase tracking-widest text-muted">Certificate</p>
          <p className="mt-1 text-sm font-semibold text-ink">Cloud Foundations</p>
          <p className="mt-3 border-t border-line pt-3 font-mono text-[0.625rem] text-muted">
            Verified · CanPlus Credentials
          </p>
        </div>
      </div>
    );

  return (
    <div className={shell}>
      <p className="text-[0.6875rem] uppercase tracking-widest text-muted">Recommended next</p>
      <div className="mt-3 grid gap-2">
        {["Applied Prompting", "Data Analytics Track", "Secure Deployment"].map((t, i) => (
          <div key={t} className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-brand-500 to-accent-600 text-[0.5625rem] font-bold text-white">
              AI
            </span>
            <span className="flex-1 text-[0.8125rem] text-ink">{t}</span>
            <span className="text-[0.625rem] text-muted">{95 - i * 11}% match</span>
          </div>
        ))}
      </div>
    </div>
  );
}
