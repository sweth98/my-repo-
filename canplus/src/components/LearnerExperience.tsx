import { LEARNER_BENEFITS } from "../content/site";
import { ProgressRing, Reveal, Section, Tag } from "../ui/primitives";

export default function LearnerExperience() {
  return (
    <Section
      id="learners"
      eyebrow="For learners"
      title="Built around the learner."
      lede="One place to find courses, study, practise, get help and show what you've achieved."
    >
      <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
        <Reveal>
          <LearnerDashboard />
        </Reveal>

        <Reveal delay={80}>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 lg:gap-7">
            {LEARNER_BENEFITS.map((b, i) => (
              <li key={b.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 font-mono text-[0.6875rem] font-semibold text-brand-700 ring-1 ring-brand-100"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-[0.9375rem] font-semibold uppercase tracking-wide text-ink">
                    {b.title}
                  </h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-body">{b.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------------------
   Learner dashboard mock-up. Consumer-grade in feel, enterprise in restraint.
   The layout collapses to a single column on small screens so every element
   stays legible instead of shrinking into noise.
--------------------------------------------------------------------------- */
function LearnerDashboard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-panel ring-1 ring-line">
      <div className="flex items-center justify-between border-b border-line bg-mist-50 px-4 py-3">
        <span className="font-mono text-[0.6875rem] text-muted">canplus · my learning</span>
        <span className="flex items-center gap-1.5">
          <span className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-400 to-accent-500" />
        </span>
      </div>

      <div className="p-4 sm:p-5">
        {/* continue learning */}
        <div className="rounded-xl border border-line bg-gradient-to-br from-brand-50/70 to-accent-50/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-brand-700">
                Continue learning
              </p>
              <p className="mt-1.5 truncate text-[0.9375rem] font-semibold text-ink">
                Generative AI Foundations
              </p>
              <p className="mt-0.5 text-[0.75rem] text-muted">Module 4 · Prompting and controllability</p>
            </div>
            <ProgressRing value={68} size={46} />
          </div>
          <button className="mt-4 min-h-[44px] w-full rounded-lg bg-navy-900 px-4 text-[0.8125rem] font-medium text-white transition hover:bg-navy-800">
            Resume
          </button>
        </div>

        {/* my courses + assignments */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-3.5">
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
              My courses
            </p>
            <ul className="mt-2.5 grid gap-2">
              {[
                { t: "Cloud Architecture", p: 34 },
                { t: "Secure Systems", p: 82 },
              ].map((c) => (
                <li key={c.t}>
                  <span className="flex items-center justify-between text-[0.75rem] text-ink">
                    <span className="truncate">{c.t}</span>
                    <span className="ml-2 shrink-0 text-muted">{c.p}%</span>
                  </span>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-mist-200">
                    <span className="block h-full rounded-full bg-brand-500" style={{ width: `${c.p}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-line p-3.5">
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
              Upcoming
            </p>
            <ul className="mt-2.5 grid gap-2">
              {[
                { t: "Prompt patterns lab", d: "Tue" },
                { t: "Module 4 quiz", d: "Thu" },
              ].map((a) => (
                <li key={a.t} className="flex items-center justify-between gap-2 text-[0.75rem]">
                  <span className="truncate text-ink">{a.t}</span>
                  <span className="shrink-0 rounded bg-mist-100 px-1.5 py-0.5 text-[0.625rem] text-body">
                    {a.d}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI buddy */}
        <div className="mt-3 rounded-xl border border-line p-3.5">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-brand-500 to-accent-600 text-[0.5625rem] font-bold text-white">
              AI
            </span>
            <span className="text-[0.75rem] font-semibold text-ink">AI Buddy</span>
            <span className="ml-auto">
              <Tag tone="accent">Always on</Tag>
            </span>
          </div>
          <div className="mt-2.5 grid gap-2">
            <p className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-navy-900 px-3 py-2 text-[0.75rem] leading-relaxed text-white">
              I don't follow the difference between fine-tuning and prompting.
            </p>
            <p className="max-w-[90%] rounded-lg rounded-bl-sm bg-mist-100 px-3 py-2 text-[0.75rem] leading-relaxed text-body">
              Both change the output, but only one changes the model. Here's the
              distinction using your Module 3 example…
            </p>
          </div>
        </div>

        {/* labs + credentials */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-line bg-mist-50 p-3.5">
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
              Lab practice
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-[0.8125rem] font-medium text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              2 available
            </p>
          </div>
          <div className="rounded-xl border border-line bg-mist-50 p-3.5">
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
              Certificates
            </p>
            <p className="mt-1.5 text-[0.8125rem] font-medium text-ink">3 earned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
