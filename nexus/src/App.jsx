import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { MODULES } from "./data.js";
import Hero from "./components/Hero.jsx";
import NodeLabels from "./components/NodeLabels.jsx";
import InfoPanel from "./components/InfoPanel.jsx";
import ToolStack from "./components/ToolStack.jsx";
import Footer from "./components/Footer.jsx";

// three.js is by far the heaviest thing here. Splitting it behind lazy() lets
// the hero paint immediately while the WebGL bundle streams in behind it.
const Scene3D = lazy(() => import("./components/Scene3D.jsx"));

/** True on small screens or when the user prefers reduced motion. */
function useSimplified() {
  const [simplified, setSimplified] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(max-width: 860px), (prefers-reduced-motion: reduce)")
          .matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(
      "(max-width: 860px), (prefers-reduced-motion: reduce)",
    );
    const onChange = (e) => setSimplified(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return simplified;
}

export default function App() {
  const [active, setActive] = useState(null); // selected module id
  const [hovered, setHovered] = useState(null); // hovered module index
  const [stageVisible, setStageVisible] = useState(false);

  const simplified = useSimplified();
  const labelRefs = useRef([]);
  const stageRef = useRef(null);

  // Fade the module ring in only once the stage is on screen, so the hero stays
  // uncluttered. One observer, no scroll listener.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setStageVisible(entry.intersectionRatio > 0.35),
      { threshold: [0, 0.35, 0.7] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Escape closes the panel.
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const activeIndex = active ? MODULES.findIndex((m) => m.id === active) : -1;

  const select = useCallback(
    (id) => setActive((current) => (current === id ? null : id)),
    [],
  );

  return (
    <>
      <Suspense fallback={<div className="scene-fallback" aria-hidden="true" />}>
        <Scene3D
          labelRefs={labelRefs}
          hovered={hovered}
          activeIndex={activeIndex}
          stageVisible={stageVisible}
          simplified={simplified}
        />
      </Suspense>

      <div className="grid-overlay" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <main>
        <Hero />

        <section
          id="stage"
          className={`stage ${stageVisible ? "is-visible" : ""}`}
          ref={stageRef}
          aria-label="Capability modules"
        >
          <p className="stage-hint">
            <span className="status-dot" />
            SELECT A MODULE
          </p>

          <NodeLabels
            refs={labelRefs}
            simplified={simplified}
            activeId={active}
            onHover={setHovered}
            onSelect={select}
          />
        </section>

        <InfoPanel
          module={MODULES.find((m) => m.id === active) ?? null}
          onClose={() => setActive(null)}
        />

        <ToolStack />
        <Footer />
      </main>
    </>
  );
}
