import { LAB_FLOW } from "../content/site";
import { Reveal, Section, cx } from "../ui/primitives";

export default function Labs() {
  return (
    <Section
      eyebrow="Hands-on labs · Zenaws"
      title="Learning shouldn't stop at the screen."
      lede="Zenaws cloud lab environments run alongside the course, so learners practise on real infrastructure and turn what they have studied into demonstrable skill."
      tone="navy"
    >
      {/* ------------------------------------------------------------- flow */}
      <Reveal delay={60}>
        <ol className="no-scrollbar mt-10 flex gap-2 overflow-x-auto pb-2 lg:mt-14 lg:grid lg:grid-cols-5 lg:gap-3 lg:overflow-visible">
          {LAB_FLOW.map((step, i) => (
            <li key={step} className="flex min-w-[8.5rem] shrink-0 items-center gap-2 lg:min-w-0">
              <span
                className={cx(
                  "flex-1 rounded-xl border px-3 py-3 text-center text-[0.8125rem] font-medium",
                  i === LAB_FLOW.length - 1
                    ? "border-accent-500/40 bg-accent-500/10 text-white"
                    : "border-white/10 bg-white/[0.04] text-brand-100",
                )}
              >
                {step}
              </span>
              {i < LAB_FLOW.length - 1 && (
                <svg viewBox="0 0 12 8" className="h-2 w-3 shrink-0 text-brand-400" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M0 4h10M7 1l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          ))}
        </ol>
      </Reveal>

      {/* -------------------------------------------------------- lab console */}
      <Reveal delay={100}>
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-navy-950/70">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            </span>
            <span className="ml-1 font-mono text-[0.6875rem] text-brand-200/70">
              zenaws · lab environment
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[0.625rem] font-medium text-emerald-300 ring-1 ring-emerald-400/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Running
            </span>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
            {/* terminal */}
            <div className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <pre className="overflow-x-auto font-mono text-[0.75rem] leading-[1.85] text-brand-100/90">
{`$ zen login --lab secure-deployment
✓ authenticated as learner@institution.edu

$ zen provision
✓ vpc            created
✓ compute        2 instances
✓ policy         least-privilege applied

$ zen verify --task 3
→ checking encryption at rest ...  pass
→ checking public exposure  ...    pass
→ checking role scope       ...    pass

Task 3 complete.`}
              </pre>
              <span className="mt-1 inline-block h-3.5 w-2 bg-brand-400 animate-caret" aria-hidden="true" />
            </div>

            {/* task panel */}
            <aside className="p-5 sm:p-6">
              <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-brand-400">
                Lab tasks
              </p>
              <ul className="mt-3 grid gap-2">
                {[
                  { t: "Provision the environment", done: true },
                  { t: "Apply least-privilege roles", done: true },
                  { t: "Verify encryption at rest", done: true },
                  { t: "Close public exposure", done: false },
                  { t: "Submit for assessment", done: false },
                ].map((task) => (
                  <li
                    key={task.t}
                    className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <span
                      className={cx(
                        "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ring-1",
                        task.done
                          ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30"
                          : "bg-white/5 text-transparent ring-white/15",
                      )}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M2.5 6.3 4.8 8.6 9.5 3.9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className={cx("text-[0.8125rem]", task.done ? "text-brand-200/70 line-through" : "text-white")}>
                      {task.t}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between text-[0.6875rem] text-brand-200/70">
                  <span>Progress</span>
                  <span className="font-semibold text-white">3 / 5</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-brand-400 to-accent-500" />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { l: "Region", v: "eu-west-1" },
                  { l: "Time left", v: "42 min" },
                ].map((m) => (
                  <div key={m.l} className="rounded-lg border border-white/10 px-3 py-2">
                    <p className="text-[0.625rem] text-brand-200/60">{m.l}</p>
                    <p className="font-mono text-[0.75rem] text-white">{m.v}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
