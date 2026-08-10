import { Button, Reveal } from "../ui/primitives";

export default function CTA() {
  return (
    <section id="demo" className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28">
      <div className="container-page">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-16 text-center sm:px-12 sm:py-20 lg:py-24">
            {/* Ecosystem graphic, kept faint so the type stays dominant. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(61,99,240,.4),transparent_70%),radial-gradient(ellipse_40%_50%_at_80%_100%,rgba(107,63,224,.35),transparent_65%)]" />
              <svg className="absolute inset-0 h-full w-full opacity-[0.18]" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
                {[70, 130, 190, 250].map((r) => (
                  <circle key={r} cx="400" cy="200" r={r} fill="none" stroke="#7392F7" strokeWidth="1" />
                ))}
                {[0, 60, 120, 180, 240, 300].map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  return (
                    <line
                      key={deg}
                      x1="400"
                      y1="200"
                      x2={400 + Math.cos(rad) * 250}
                      y2={200 + Math.sin(rad) * 250}
                      stroke="#7392F7"
                      strokeWidth="1"
                      strokeDasharray="3 7"
                    />
                  );
                })}
              </svg>
            </div>

            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-[1.875rem] leading-[1.15] text-white sm:text-4xl lg:text-[2.75rem]">
                Ready to build a learning environment without giving up control?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-brand-200 sm:text-lg">
                See how CanPlus can fit your institution, infrastructure and
                learning model.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Button href="#demo" variant="onDark">
                  Book a Demo
                </Button>
                <a
                  href="#platform"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-[0.9375rem] font-medium text-white ring-1 ring-white/25 transition duration-200 hover:bg-white/10 hover:ring-white/40"
                >
                  Explore the Platform
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
