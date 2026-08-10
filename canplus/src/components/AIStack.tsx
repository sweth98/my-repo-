import { useState } from "react";
import { AI_DEMO, AI_PILLARS } from "../content/site";
import { Reveal, Section, Tag } from "../ui/primitives";

export default function AIStack() {
  return (
    <Section
      id="ai"
      eyebrow="CanPlus AI Stack"
      title="AI that works across the learning journey."
      lede="CanPlus brings AI directly into course creation, learner support and intelligent discovery."
      tone="navy"
    >
      {/* ----------------------------------------------------- three pillars */}
      <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-3">
        {AI_PILLARS.map((p, i) => (
          <Reveal key={p.num} delay={i * 70}>
            <article className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.6875rem] text-brand-400">{p.num}</span>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500/25 to-accent-500/25 ring-1 ring-white/15">
                  <span className="text-[0.625rem] font-bold text-brand-200">AI</span>
                </span>
              </div>
              <h3 className="mt-5 text-lg text-white">{p.name}</h3>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-brand-200/85">{p.blurb}</p>

              {/* The workflow strip lifts into view on hover, staying quiet at rest. */}
              <div className="mt-5 flex min-w-0 items-center gap-2 border-t border-white/10 pt-4 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
                {p.flow.map((f, fi) => (
                  <span key={f} className="flex min-w-0 items-center gap-2">
                    <span className="truncate rounded-md bg-white/[0.07] px-2 py-1 text-[0.6875rem] text-brand-100">
                      {f}
                    </span>
                    {fi < p.flow.length - 1 && (
                      <svg viewBox="0 0 12 8" className="h-2 w-3 shrink-0 text-brand-400" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M0 4h10M7 1l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {/* ------------------------------------------------- module builder demo */}
      <Reveal delay={120}>
        <ModuleBuilderDemo />
      </Reveal>
    </Section>
  );
}

function ModuleBuilderDemo() {
  const [generated, setGenerated] = useState(false);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-navy-950/60 lg:mt-4">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
        <span className="font-mono text-[0.6875rem] text-brand-200/70">
          canplus · ai module builder
        </span>
        <span className="ml-auto hidden sm:block">
          <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[0.625rem] text-brand-200">
            Interface demonstration
          </span>
        </span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* prompt side */}
        <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <p className="text-[0.6875rem] uppercase tracking-widest text-brand-400">Prompt</p>
          <div className="mt-3 rounded-xl border border-white/12 bg-white/[0.04] p-4">
            <p className="text-[0.9375rem] leading-relaxed text-white">"{AI_DEMO.prompt}"</p>
          </div>

          <button
            type="button"
            onClick={() => setGenerated((v) => !v)}
            aria-expanded={generated}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white px-5 py-3 text-[0.9375rem] font-medium text-navy-900 transition hover:-translate-y-px hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,.6)]"
          >
            {generated ? "Reset" : "Generate course outline"}
            {!generated && (
              <svg viewBox="0 0 12 8" className="h-2 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M0 4h10M7 1l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* What the builder produces. Doubles as progress feedback: each row
              lights up once the outline has been generated. */}
          <ul className="mt-7 grid gap-2 border-t border-white/10 pt-6">
            {[
              "Learning objectives",
              "Module structure",
              "Activities",
              "Assessments",
              "Final project",
            ].map((item, i) => (
              <li key={item} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full ring-1 transition-colors duration-500 " +
                    (generated
                      ? "bg-brand-500/20 text-brand-200 ring-brand-400/40"
                      : "bg-white/5 text-transparent ring-white/15")
                  }
                  style={generated ? { transitionDelay: `${i * 90}ms` } : undefined}
                >
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M2.5 6.3 4.8 8.6 9.5 3.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span
                  className={
                    "text-[0.8125rem] transition-colors duration-500 " +
                    (generated ? "text-brand-100" : "text-brand-200/45")
                  }
                  style={generated ? { transitionDelay: `${i * 90}ms` } : undefined}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[0.75rem] leading-relaxed text-brand-200/60">
            Illustrative output showing the described capability. Not a specific
            CanPlus course.
          </p>
        </div>

        {/* output side */}
        <div className="min-h-[22rem] bg-white/[0.02] p-6 sm:p-8">
          {!generated ? (
            <div className="grid h-full min-h-[16rem] place-items-center text-center">
              <p className="max-w-[18rem] text-[0.875rem] leading-relaxed text-brand-200/50">
                The generated structure — objectives, modules, activities,
                assessments and a final project — appears here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              <Block title="Learning objectives" delay={0}>
                <ul className="grid gap-1.5">
                  {AI_DEMO.objectives.map((o) => (
                    <li key={o} className="flex gap-2.5 text-[0.8125rem] leading-relaxed text-brand-100">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-500" />
                      {o}
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Modules" delay={90}>
                <ul className="grid gap-1.5">
                  {AI_DEMO.modules.map((m) => (
                    <li
                      key={m.title}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
                    >
                      <span className="shrink-0 font-mono text-[0.625rem] text-brand-400">{m.week}</span>
                      <span className="min-w-0 truncate text-[0.8125rem] text-white">{m.title}</span>
                    </li>
                  ))}
                </ul>
              </Block>

              <div className="grid gap-5 sm:grid-cols-2">
                <Block title="Activities" delay={180}>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_DEMO.activities.map((a) => (
                      <span key={a} className="rounded-md bg-white/[0.07] px-2 py-1 text-[0.6875rem] text-brand-100">
                        {a}
                      </span>
                    ))}
                  </div>
                </Block>
                <Block title="Assessments" delay={230}>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_DEMO.assessments.map((a) => (
                      <span key={a} className="rounded-md bg-white/[0.07] px-2 py-1 text-[0.6875rem] text-brand-100">
                        {a}
                      </span>
                    ))}
                  </div>
                </Block>
              </div>

              <Block title="Final project" delay={280}>
                <p className="text-[0.8125rem] leading-relaxed text-brand-100">{AI_DEMO.finalProject}</p>
              </Block>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Block({
  title,
  children,
  delay,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <div className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-center gap-2">
        <Tag tone="brand">{title}</Tag>
      </div>
      {children}
    </div>
  );
}
