import { Reveal, Section, cx } from "../ui/primitives";

const CHAPTERS = [
  { t: "What generative models do", d: "6:12", on: false },
  { t: "Prompting fundamentals", d: "9:48", on: true },
  { t: "Controlling output", d: "7:31", on: false },
  { t: "Evaluating results", d: "11:04", on: false },
];

export default function Stage() {
  return (
    <Section
      eyebrow="CanPlus Stage"
      title="Make learning more engaging."
      lede="CanPlus Stage delivers video and rich media as structured learning — chapters, transcripts, notes and resources sitting alongside the course rather than in a separate tool."
      tone="mist"
    >
      <Reveal delay={60}>
        <div className="mt-12 overflow-hidden rounded-2xl bg-white shadow-panel ring-1 ring-line lg:mt-16">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
            {/* ------------------------------------------------ player side */}
            <div className="border-b border-line lg:border-b-0 lg:border-r">
              {/* video surface */}
              <div className="relative aspect-video bg-navy-900">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(61,99,240,.35),transparent_60%),radial-gradient(ellipse_at_75%_75%,rgba(107,63,224,.3),transparent_55%)]"
                />
                <div className="absolute inset-0 grid place-items-center">
                  <button
                    aria-label="Play lesson"
                    className="grid h-14 w-14 place-items-center rounded-full bg-white/12 ring-1 ring-white/25 backdrop-blur-sm transition hover:scale-105 hover:bg-white/20"
                  >
                    <svg viewBox="0 0 16 16" className="ml-1 h-5 w-5 text-white" fill="currentColor">
                      <path d="M5 3.2v9.6L13 8z" />
                    </svg>
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="h-1 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-2/5 rounded-full bg-white" />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between font-mono text-[0.6875rem] text-white/75">
                    <span>03:52 / 09:48</span>
                    <span className="hidden sm:inline">Module 4 · Prompting fundamentals</span>
                    <span>1.0×</span>
                  </div>
                </div>
              </div>

              {/* transcript */}
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
                    Transcript
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <div className="mt-3 grid gap-2.5">
                  {[
                    { t: "03:41", s: "A prompt is not a command — it is context.", on: false },
                    { t: "03:52", s: "The model completes the pattern you establish, so the shape of your input matters as much as its content.", on: true },
                    { t: "04:07", s: "Which is why examples usually outperform instructions.", on: false },
                  ].map((line) => (
                    <p
                      key={line.t}
                      className={cx(
                        "grid grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-lg px-2 py-1.5 text-[0.8125rem] leading-relaxed transition-colors",
                        line.on ? "bg-brand-50 text-ink" : "text-body hover:bg-mist-100",
                      )}
                    >
                      <span className="font-mono text-[0.6875rem] text-muted">{line.t}</span>
                      <span>{line.s}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* ----------------------------------------------- chapters side */}
            <aside className="bg-mist-50/60 p-5 sm:p-6">
              <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
                Chapters
              </p>
              <ul className="mt-3 grid gap-1.5">
                {CHAPTERS.map((c, i) => (
                  <li key={c.t}>
                    <span
                      className={cx(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                        c.on
                          ? "border-brand-200 bg-white shadow-sm"
                          : "border-transparent hover:border-line hover:bg-white",
                      )}
                    >
                      <span
                        className={cx(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-full font-mono text-[0.5625rem]",
                          c.on ? "bg-brand-500 text-white" : "bg-mist-200 text-muted",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.8125rem] text-ink">{c.t}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[0.625rem] text-muted">{c.d}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 border-t border-line pt-5">
                <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
                  My notes
                </p>
                <div className="mt-2.5 rounded-lg border border-line bg-white p-3">
                  <p className="text-[0.75rem] leading-relaxed text-body">
                    Examples &gt; instructions. Revisit before the Week 3 quiz.
                  </p>
                  <p className="mt-2 font-mono text-[0.625rem] text-muted">at 03:52</p>
                </div>
              </div>

              <div className="mt-5 border-t border-line pt-5">
                <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
                  Resources
                </p>
                <ul className="mt-2.5 grid gap-1.5">
                  {["Slide deck (PDF)", "Prompt pattern sheet", "Lab: prompt patterns"].map((r) => (
                    <li key={r} className="flex items-center gap-2 text-[0.75rem] text-body">
                      <span className="h-1 w-1 rounded-full bg-brand-500" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
