import { CASE_STUDIES, SOLUTIONS } from "../content/site";
import { Reveal, Section } from "../ui/primitives";

export default function CaseStudies() {
  return (
    <Section
      id="resources"
      eyebrow="Deployments"
      title="Institutions running CanPlus."
      lede="Universities, defence organisations, public sector networks and enterprise learning teams — each with different infrastructure and policy requirements."
      tone="mist"
    >
      <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-2">
        {CASE_STUDIES.map((cs, i) => (
          <Reveal key={cs.org} delay={i * 70}>
            <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1 hover:shadow-lift sm:p-8">
              <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-brand-600">
                {cs.sector}
              </p>
              <h3 className="mt-3 text-xl sm:text-2xl">{cs.org}</h3>
              <p className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-body">
                {cs.summary}
              </p>

              {cs.metrics.length > 0 && (
                <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-line pt-6">
                  {cs.metrics.map((m) => (
                    <div key={m.label}>
                      <dt className="sr-only">{m.label}</dt>
                      <dd>
                        <span className="block text-lg font-semibold leading-tight text-ink sm:text-xl">
                          {m.value}
                        </span>
                        <span className="mt-1 block text-[0.6875rem] text-muted">{m.label}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </article>
          </Reveal>
        ))}
      </div>

      {/* -------------------------------------------------------- solutions */}
      <Reveal delay={100}>
        <div className="mt-16">
          <h3 className="text-lg">Built for different kinds of institution</h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s) => (
              <li
                key={s.name}
                className="rounded-xl border border-line bg-white px-5 py-4 transition-colors hover:border-brand-200"
              >
                <p className="text-[0.9375rem] font-medium text-ink">{s.name}</p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">{s.blurb}</p>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}
