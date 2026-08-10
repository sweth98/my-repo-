import { useEffect, useRef, useState } from "react";
import { STATS } from "../content/site";
import { Reveal } from "../ui/primitives";

/** Counts up once, when scrolled into view. Static for reduced-motion users. */
function useCountUp(target: number, run: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    const DURATION = 1100;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      // Ease-out so it decelerates into the final number.
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);

  return value;
}

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  const shown = useCountUp(value, run);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setRun(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="px-2 py-6 text-center sm:py-7">
      <p className="text-[1.75rem] font-semibold tracking-tight text-ink sm:text-4xl">
        {shown}
        <span className="text-brand-600">{suffix}</span>
      </p>
      <p className="mt-1.5 text-[0.8125rem] text-muted">{label}</p>
    </div>
  );
}

export default function TrustBar() {
  return (
    <section aria-label="CanPlus at a glance" className="border-y border-line bg-white">
      <div className="container-page">
        <Reveal>
          <dl className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
            {STATS.map((s) => (
              <Stat key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
