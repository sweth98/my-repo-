import { INTEGRATIONS } from "../content/site";
import { Reveal, Section } from "../ui/primitives";

const GROUPS = [...new Set(INTEGRATIONS.map((i) => i.group))];

export default function Integrations() {
  return (
    <Section
      eyebrow="Integrations"
      title={
        <>
          Fits into your ecosystem.
          <br />
          Not the other way around.
        </>
      }
      lede="CanPlus connects to the identity, records and content standards institutions already run on."
      titleWrap="manual"
    >
      <Reveal delay={60}>
        <div className="relative mt-12 lg:mt-16">
          {/* Connection lines, desktop only: at mobile widths they would cross
              the cards rather than link them. */}
          <svg
            className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
            viewBox="0 0 1000 420"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={`l${i}`}
                d={`M500 210 C 380 210, 300 ${60 + i * 75}, 160 ${60 + i * 75}`}
                fill="none"
                stroke="#DFE7FE"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                vectorEffect="non-scaling-stroke"
                className="animate-dash"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={`r${i}`}
                d={`M500 210 C 620 210, 700 ${60 + i * 75}, 840 ${60 + i * 75}`}
                fill="none"
                stroke="#DFE7FE"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                vectorEffect="non-scaling-stroke"
                className="animate-dash"
                style={{ animationDelay: `${i * 120 + 60}ms` }}
              />
            ))}
          </svg>

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-10">
            {/* left column */}
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              {INTEGRATIONS.slice(0, 5).map((i) => (
                <IntegrationChip key={i.name} name={i.name} group={i.group} />
              ))}
            </ul>

            {/* hub */}
            <div className="mx-auto w-full max-w-[16rem] rounded-2xl border border-brand-200 bg-gradient-to-br from-white to-brand-50 p-6 text-center shadow-soft">
              <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-brand-700">
                Platform
              </p>
              <p className="mt-2 text-xl font-semibold text-ink">CanPlus</p>
              <p className="mt-2.5 text-[0.75rem] leading-relaxed text-muted">
                Canvas-compatible core with open standards support
              </p>
            </div>

            {/* right column */}
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              {INTEGRATIONS.slice(5).map((i) => (
                <IntegrationChip key={i.name} name={i.name} group={i.group} />
              ))}
            </ul>
          </div>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <p className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-line pt-6 text-[0.75rem] text-muted">
          {GROUPS.map((g) => (
            <span key={g}>{g}</span>
          ))}
        </p>
      </Reveal>
    </Section>
  );
}

function IntegrationChip({ name, group }: { name: string; group: string }) {
  return (
    <li className="group flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-300 transition-colors group-hover:bg-brand-600"
      />
      <span className="min-w-0">
        <span className="block text-[0.875rem] font-medium text-ink">{name}</span>
        <span className="block text-[0.6875rem] text-muted">{group}</span>
      </span>
    </li>
  );
}
