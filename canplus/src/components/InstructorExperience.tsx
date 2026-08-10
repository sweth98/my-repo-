import { INSTRUCTOR_BENEFITS, INSTRUCTOR_FLOW } from "../content/site";
import { Reveal, Section, cx } from "../ui/primitives";

export default function InstructorExperience() {
  return (
    <Section
      eyebrow="For instructors"
      title="Give educators more time to teach."
      lede="AI-assisted course building turns an outline into structure — objectives, modules, activities and assessments — so instructors spend their time on teaching rather than assembly."
      tone="mist"
    >
      <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
        {/* ------------------------------------------------------- the flow */}
        <Reveal>
          <ol className="relative grid gap-0">
            {INSTRUCTOR_FLOW.map((step, i) => (
              <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                {/* connector */}
                {i < INSTRUCTOR_FLOW.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[0.9375rem] top-8 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-brand-300/60 to-line"
                  />
                )}
                <span
                  className={cx(
                    "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.6875rem] font-semibold ring-1",
                    i === 0
                      ? "bg-navy-900 text-white ring-navy-900"
                      : "bg-white text-brand-700 ring-line",
                  )}
                >
                  {i + 1}
                </span>
                <div className="pt-1">
                  <p className="text-[0.9375rem] font-medium text-ink">{step}</p>
                  {i === 0 && (
                    <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">
                      Describe the course you want in a sentence.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line pt-6">
            {INSTRUCTOR_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[0.8125rem] text-body">
                <svg viewBox="0 0 12 12" className="mt-1 h-3 w-3 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2.5 6.3 4.8 8.6 9.5 3.9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* --------------------------------------------- instructor dashboard */}
        <Reveal delay={80}>
          <div className="overflow-hidden rounded-2xl bg-white shadow-panel ring-1 ring-line">
            <div className="flex items-center gap-2 border-b border-line bg-mist-50 px-4 py-3">
              <span className="font-mono text-[0.6875rem] text-muted">
                canplus · course builder
              </span>
            </div>

            <div className="grid gap-0 sm:grid-cols-[minmax(0,1fr)_11rem]">
              <div className="min-w-0 p-4 sm:p-5">
                <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3.5">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-brand-700">
                    Prompt
                  </p>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink">
                    "Build a 6-week course on generative AI for second-year
                    undergraduates."
                  </p>
                </div>

                <p className="mt-4 text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
                  Generated structure
                </p>
                <ul className="mt-2.5 grid gap-1.5">
                  {[
                    "Week 1–2 · Foundations of generative models",
                    "Week 3 · Prompting and controllability",
                    "Week 4 · Evaluation, bias and limitations",
                    "Week 5 · Applied build",
                    "Week 6 · Responsible deployment",
                  ].map((m, i) => (
                    <li
                      key={m}
                      className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[0.75rem] text-ink"
                    >
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-mist-100 font-mono text-[0.5625rem] text-muted">
                        {i + 1}
                      </span>
                      <span className="truncate">{m}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["3 assessments", "6 activities", "1 final project"].map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-mist-100 px-2 py-1 text-[0.6875rem] text-body ring-1 ring-inset ring-line"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* analytics rail */}
              <aside className="border-t border-line bg-mist-50/60 p-4 sm:border-l sm:border-t-0">
                <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
                  Learner analytics
                </p>
                <div className="mt-3 grid gap-3">
                  {[
                    { l: "Active", v: "182" },
                    { l: "Avg. progress", v: "64%" },
                    { l: "At risk", v: "7" },
                  ].map((s) => (
                    <div key={s.l}>
                      <p className="text-[0.6875rem] text-muted">{s.l}</p>
                      <p className="text-base font-semibold text-ink">{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex h-16 items-end gap-1" aria-hidden="true">
                  {[38, 52, 44, 66, 58, 74, 69].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-sm bg-brand-200"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
