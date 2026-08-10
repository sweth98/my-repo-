import { HERO } from "../content/site";
import { Button, Eyebrow, ProgressRing, Reveal, Tag } from "../ui/primitives";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-40">
      {/* Background: a single soft brand wash plus a faint grid, nothing more. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/70 via-white to-white" />
        <div className="absolute inset-x-0 top-0 h-[38rem] bg-grid opacity-[0.55] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_20%,transparent_75%)]" />
        <div className="absolute -right-32 top-10 h-[26rem] w-[26rem] rounded-full bg-accent-100/50 blur-3xl" />
        <div className="absolute -left-24 top-40 h-[22rem] w-[22rem] rounded-full bg-brand-100/45 blur-3xl" />
      </div>

      <div className="container-page grid items-center gap-14 pb-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10 lg:pb-28">
        {/* ------------------------------------------------------------ copy */}
        <div className="max-w-xl lg:max-w-[40rem]">
          <Reveal>
            <Eyebrow>{HERO.eyebrow}</Eyebrow>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="hd-manual mt-5 text-[2.25rem] leading-[1.08] sm:text-5xl lg:text-[2.875rem]">
              {HERO.headline[0]}
              <br />
              <span className="text-gradient-brand">{HERO.headline[1]}</span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-6 text-base leading-relaxed text-body sm:text-lg">
              {HERO.body}
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href={HERO.primaryCta.href}>{HERO.primaryCta.label}</Button>
              <Button href={HERO.secondaryCta.href} variant="secondary">
                {HERO.secondaryCta.label}
              </Button>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-6">
              {HERO.pillars.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-body">
                  <CheckDot />
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* -------------------------------------------------- product visual */}
        <Reveal delay={140} className="relative">
          <HeroProduct />
        </Reveal>
      </div>
    </section>
  );
}

function CheckDot() {
  return (
    <span
      aria-hidden="true"
      className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"
    >
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M2.5 6.3 4.8 8.6 9.5 3.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/* ---------------------------------------------------------------------------
   Hero product visualisation.
   Built from real layout primitives rather than a flat illustration, so it
   reads as software. The floating side panels are decorative and are hidden
   below lg, where they would overlap the dashboard and hurt legibility.
--------------------------------------------------------------------------- */
function HeroProduct() {
  const courses = [
    { title: "Generative AI Foundations", meta: "Module 4 of 6", pct: 68, tone: "brand" as const },
    { title: "Cloud Architecture", meta: "Module 2 of 8", pct: 34, tone: "accent" as const },
    { title: "Secure Systems", meta: "Module 7 of 9", pct: 82, tone: "brand" as const },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[38rem] lg:max-w-none">
      {/* main dashboard */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-panel ring-1 ring-line">
        {/* app bar */}
        <div className="flex items-center gap-3 border-b border-line bg-mist-50 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          </span>
          <span className="truncate font-mono text-[0.6875rem] text-muted">
            canplus · learning dashboard
          </span>
          <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.625rem] font-medium text-body ring-1 ring-line sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Canvas-compatible
          </span>
        </div>

        <div className="grid grid-cols-[auto_minmax(0,1fr)]">
          {/* rail */}
          <nav aria-hidden="true" className="hidden w-44 border-r border-line bg-mist-50/60 p-3 sm:block">
            {["Dashboard", "My Courses", "Catalogue", "Labs", "Credentials", "AI Buddy"].map((item, i) => (
              <span
                key={item}
                className={
                  "mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] " +
                  (i === 0 ? "bg-white font-medium text-ink shadow-sm ring-1 ring-line" : "text-body")
                }
              >
                <span className={"h-1.5 w-1.5 rounded-full " + (i === 0 ? "bg-brand-500" : "bg-line-strong")} />
                {item}
              </span>
            ))}
          </nav>

          {/* body */}
          <div className="min-w-0 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted">
                  Continue learning
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">3 courses in progress</p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <Tag tone="accent">2 due this week</Tag>
              </div>
            </div>

            <ul className="mt-4 grid gap-2.5">
              {courses.map((c) => (
                <li
                  key={c.title}
                  className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 transition-shadow hover:shadow-soft"
                >
                  <span
                    className={
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[0.6875rem] font-bold " +
                      (c.tone === "brand"
                        ? "bg-brand-50 text-brand-700"
                        : "bg-accent-50 text-accent-700")
                    }
                    aria-hidden="true"
                  >
                    {c.title.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink">
                      {c.title}
                    </span>
                    <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-mist-200">
                      <span
                        className={
                          "block h-full rounded-full " +
                          (c.tone === "brand" ? "bg-brand-500" : "bg-accent-500")
                        }
                        style={{ width: `${c.pct}%` }}
                      />
                    </span>
                    <span className="mt-1.5 block text-[0.6875rem] text-muted">{c.meta}</span>
                  </span>
                  <span className="hidden shrink-0 text-[0.75rem] font-semibold text-ink sm:block">
                    {c.pct}%
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-mist-50 p-3">
                <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted">
                  Lab practice
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-[0.8125rem] font-medium text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-ring" />
                  Environment ready
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-line bg-mist-50 p-3">
                <ProgressRing value={72} size={38} />
                <span>
                  <span className="block text-[0.6875rem] font-medium uppercase tracking-wider text-muted">
                    Pathway
                  </span>
                  <span className="block text-[0.8125rem] font-medium text-ink">72% complete</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating: AI assistant */}
      <div className="animate-float pointer-events-none absolute -left-14 -bottom-6 hidden w-60 rounded-xl bg-white p-3.5 shadow-lift ring-1 ring-line lg:block">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-brand-500 to-accent-600 text-[0.625rem] font-bold text-white">
            AI
          </span>
          <span className="text-[0.75rem] font-semibold text-ink">AI Buddy</span>
        </div>
        <p className="mt-2.5 text-[0.75rem] leading-relaxed text-body">
          Here's a summary of Module 4, plus two practice questions.
        </p>
        <span className="mt-2 inline-block h-3 w-1 bg-brand-500 align-middle animate-caret" aria-hidden="true" />
      </div>

      {/* floating: credential */}
      <div
        className="animate-float-slow pointer-events-none absolute -right-6 -top-7 hidden w-52 rounded-xl bg-white p-3.5 shadow-lift ring-1 ring-line lg:block"
        style={{ animationDelay: "1.2s" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-50 ring-1 ring-accent-100">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-accent-600" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="10" cy="8" r="4.2" />
              <path d="M7 12.5 6 18l4-2 4 2-1-5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>
            <span className="block text-[0.75rem] font-semibold text-ink">Credential earned</span>
            <span className="block text-[0.6875rem] text-muted">Cloud Foundations</span>
          </span>
        </div>
      </div>
    </div>
  );
}
