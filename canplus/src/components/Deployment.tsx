import { useState } from "react";
import { DEPLOYMENTS, DEPLOYMENT_MATRIX } from "../content/site";
import { Reveal, Section, cx } from "../ui/primitives";

type Id = (typeof DEPLOYMENTS)[number]["id"];

export default function Deployment() {
  const [active, setActive] = useState<Id>("on-prem");
  const model = DEPLOYMENTS.find((d) => d.id === active) ?? DEPLOYMENTS[0];

  return (
    <Section
      id="solutions"
      eyebrow="Institutional control"
      title={
        <>
          Modern learning.
          <br />
          Your infrastructure. Your control.
        </>
      }
      lede="Choose where CanPlus runs. Keep control over infrastructure, data residency and operational policies."
      tone="mist"
      titleWrap="manual"
    >
      {/* ---------------------------------------------------- model selector */}
      <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-3">
        {DEPLOYMENTS.map((d, i) => {
          const on = d.id === active;
          return (
            <Reveal key={d.id} delay={i * 70}>
              <button
                onClick={() => setActive(d.id)}
                aria-pressed={on}
                className={cx(
                  "h-full w-full rounded-2xl border p-6 text-left transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
                  on
                    ? "border-brand-300 bg-white shadow-lift"
                    : "border-line bg-white/60 hover:border-line-strong hover:bg-white hover:shadow-soft",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg">{d.name}</h3>
                    <p className="mt-1 text-[0.75rem] font-medium uppercase tracking-wider text-brand-600">
                      {d.tag}
                    </p>
                  </div>
                  <span
                    className={cx(
                      "mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      on ? "border-brand-600" : "border-line-strong",
                    )}
                    aria-hidden="true"
                  >
                    <span className={cx("h-2 w-2 rounded-full transition-colors", on ? "bg-brand-600" : "bg-transparent")} />
                  </span>
                </div>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-body">{d.blurb}</p>
              </button>
            </Reveal>
          );
        })}
      </div>

      {/* ------------------------------------------------ architecture visual */}
      <Reveal delay={100}>
        <div className="mt-4 rounded-2xl border border-line bg-white p-6 sm:p-8 lg:p-10">
          <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
            Deployment topology
          </p>

          {/* Desktop: hub and spoke. */}
          <div className="relative mt-6 hidden min-h-[15rem] sm:block">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {model!.nodes.map((_, i) => {
                // Widened deliberately: the literal type is 3 | 4 today, but the
                // spoke maths must survive someone editing the content file.
                const n: number = model!.nodes.length;
                const y = n <= 1 ? 100 : 30 + (140 / (n - 1)) * i;
                return (
                  <path
                    key={i}
                    d={`M120 100 C 210 100, 230 ${y}, 300 ${y}`}
                    fill="none"
                    stroke="#C3D0FC"
                    strokeWidth="1.5"
                    strokeDasharray="4 5"
                    vectorEffect="non-scaling-stroke"
                    className="animate-dash"
                  />
                );
              })}
            </svg>

            <div className="relative grid h-full min-h-[15rem] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-4">
              {/* hub */}
              <div className="justify-self-start">
                <div className="w-52 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4 shadow-soft">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-brand-700">
                    Platform
                  </p>
                  <p className="mt-1.5 text-[0.9375rem] font-semibold text-ink">CanPlus</p>
                  <p className="mt-2 text-[0.75rem] leading-relaxed text-muted">
                    LMS · AI · Catalogue · Stage · Credentials · Labs
                  </p>
                </div>
              </div>

              {/* spokes */}
              <ul className="grid gap-2.5 justify-self-end">
                {model!.nodes.map((n) => (
                  <li
                    key={n}
                    className="animate-rise rounded-lg border border-line bg-mist-50 px-4 py-2.5 text-[0.8125rem] font-medium text-ink"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile: a plain stacked list — spokes at this width are unreadable. */}
          <div className="mt-6 sm:hidden">
            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
              <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-brand-700">
                Platform
              </p>
              <p className="mt-1 text-[0.9375rem] font-semibold text-ink">CanPlus</p>
            </div>
            <ul className="mt-3 grid gap-2 border-l-2 border-dashed border-brand-200 pl-4">
              {model!.nodes.map((n) => (
                <li key={n} className="rounded-lg border border-line bg-mist-50 px-3.5 py-2.5 text-[0.8125rem] font-medium text-ink">
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>

      {/* -------------------------------------------------------- comparison */}
      <Reveal delay={120}>
        <div className="mt-10">
          <h3 className="text-lg">Compare deployment models</h3>

          {/* Desktop table */}
          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-line bg-white lg:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Comparison of CanPlus deployment models</caption>
              <thead>
                <tr className="bg-mist-50">
                  <th scope="col" className="w-56 px-5 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-widest text-muted">
                    &nbsp;
                  </th>
                  {DEPLOYMENTS.map((d) => (
                    <th
                      key={d.id}
                      scope="col"
                      className={cx(
                        "px-5 py-3.5 text-[0.8125rem] font-semibold",
                        d.id === active ? "text-brand-700" : "text-ink",
                      )}
                    >
                      {d.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEPLOYMENT_MATRIX.map((row) => (
                  <tr key={row.row} className="border-t border-line">
                    <th scope="row" className="px-5 py-4 text-[0.8125rem] font-medium text-body">
                      {row.row}
                    </th>
                    {DEPLOYMENTS.map((d) => (
                      <td
                        key={d.id}
                        className={cx(
                          "px-5 py-4 text-[0.8125rem]",
                          d.id === active ? "bg-brand-50/50 text-ink" : "text-body",
                        )}
                      >
                        {row.values[d.id]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Below lg the table becomes one expandable card per model, which is
              readable on a phone in a way a 4-column table never is. */}
          <div className="mt-5 grid gap-3 lg:hidden">
            {DEPLOYMENTS.map((d) => (
              <details
                key={d.id}
                className="group rounded-xl border border-line bg-white"
                open={d.id === active}
              >
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-[0.9375rem] font-medium text-ink">
                  {d.name}
                  <svg
                    viewBox="0 0 12 12"
                    className="h-3 w-3 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="m2 4.5 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <dl className="border-t border-line px-4 py-3">
                  {DEPLOYMENT_MATRIX.map((row) => (
                    <div key={row.row} className="flex justify-between gap-4 py-2 text-[0.8125rem]">
                      <dt className="text-muted">{row.row}</dt>
                      <dd className="text-right font-medium text-ink">{row.values[d.id]}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
