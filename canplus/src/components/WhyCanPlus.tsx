import { WHY } from "../content/site";
import { Reveal, Section } from "../ui/primitives";

export default function WhyCanPlus() {
  return (
    <Section
      id="why"
      eyebrow="Why CanPlus"
      title="Why institutions choose CanPlus."
      lede="Most of these capabilities exist somewhere. The difference is having them in one platform, under one set of controls, rather than stitched together across vendors."
    >
      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
        {WHY.map((w, i) => (
          <Reveal key={w.title} delay={(i % 4) * 60}>
            <div className="h-full bg-white p-6 transition-colors duration-300 hover:bg-mist-50">
              <span
                aria-hidden="true"
                className="block h-8 w-8 rounded-lg bg-gradient-to-br from-brand-100 to-accent-100 ring-1 ring-brand-100"
              />
              <h3 className="mt-5 text-[0.9375rem] leading-snug">{w.title}</h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-body">{w.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
