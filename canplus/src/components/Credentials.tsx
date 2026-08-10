import { CREDENTIALS } from "../content/site";
import { Reveal, Section } from "../ui/primitives";

const ICONS: Record<string, React.ReactNode> = {
  Certificate: (
    <>
      <rect x="3" y="4.5" width="18" height="13" rx="2" />
      <path d="M7 9h7M7 12.5h5" strokeLinecap="round" />
    </>
  ),
  Badge: (
    <>
      <circle cx="12" cy="9.5" r="5" />
      <path d="M8.5 14 7 21l5-2.5L17 21l-1.5-7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "Learning path": (
    <>
      <circle cx="6" cy="6.5" r="2.5" />
      <circle cx="18" cy="17.5" r="2.5" />
      <path d="M8.5 6.5h5a4 4 0 0 1 0 8h-3a4 4 0 0 0 0 3h5" strokeLinecap="round" />
    </>
  ),
  Skill: (
    <>
      <path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.6l1.1-6L3.4 9.4l6-.8z" strokeLinejoin="round" />
    </>
  ),
};

export default function Credentials() {
  return (
    <Section
      eyebrow="CanPlus Credentials"
      title="Turn learning into something learners can show."
      lede="Certificates, badges, pathways and verified skills give visible recognition of what a learner has completed and can demonstrate."
    >
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
        {CREDENTIALS.map((c, i) => (
          <Reveal key={c.title} delay={i * 70}>
            <article className="group relative h-full overflow-hidden rounded-2xl border border-line bg-white p-6 transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-lift">
              {/* Very soft brand wash that only appears on hover. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50/0 via-brand-50/0 to-accent-50/0 opacity-0 transition-opacity duration-300 group-hover:from-brand-50/80 group-hover:to-accent-50/60 group-hover:opacity-100"
              />

              <div className="relative">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-mist-100 text-brand-700 ring-1 ring-line transition-colors duration-300 group-hover:bg-white group-hover:text-accent-600 group-hover:ring-accent-100">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {ICONS[c.kind]}
                  </svg>
                </span>

                <p className="mt-5 text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
                  {c.kind}
                </p>
                <h3 className="mt-1.5 text-base leading-snug">{c.title}</h3>
                <p className="mt-1 text-[0.8125rem] text-muted">{c.meta}</p>

                <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="font-mono text-[0.625rem] uppercase tracking-wider text-muted">
                    Verified
                  </span>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
