import { COMPLIANCE } from "../content/site";
import { Reveal, Section } from "../ui/primitives";

export default function Security() {
  return (
    <Section tone="mist">
      <Reveal>
        <div className="grid gap-10 rounded-2xl border border-line bg-white p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16 lg:p-12">
          <div>
            <p className="inline-flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-brand-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-600" aria-hidden="true" />
              Security and compliance
            </p>
            <h2 className="mt-4 text-[1.75rem] leading-[1.15] sm:text-3xl">
              Built for institutions where security, compliance and control matter.
            </h2>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-body">
              Deployment choice, data residency and institutional policy control
              are part of how the platform is delivered — not an add-on.
            </p>
          </div>

          <div>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {COMPLIANCE.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center gap-3 rounded-xl border border-line bg-mist-50 px-4 py-3.5"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-brand-700 ring-1 ring-line"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M10 2.5 16 5v5c0 3.4-2.4 6.4-6 7.5-3.6-1.1-6-4.1-6-7.5V5z" strokeLinejoin="round" />
                      <path d="m7.6 9.8 1.8 1.8 3.2-3.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.875rem] font-medium text-ink">{c.name}</span>
                    <span className="block text-[0.6875rem] text-muted">{c.note}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Wording matters: alignment and readiness, never a certification
                claim. Do not change without written confirmation. */}
            <p className="mt-4 text-[0.75rem] leading-relaxed text-muted">
              Listed standards describe the requirements CanPlus is designed to
              support. They are not presented as held certifications.
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
