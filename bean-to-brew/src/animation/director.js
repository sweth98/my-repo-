// Per-frame registry: scenes register a callback that is a pure function of absolute time.
import { useEffect, useRef } from 'react';

export const frameRegistry = new Set();

/** Registers a per-frame update. Group visibility is derived from the scene window(s). */
export function useSceneGroup(windows, update) {
  const ref = useRef();
  const upd = useRef(update);
  upd.current = update;
  useEffect(() => {
    const wins = Array.isArray(windows[0]) ? windows : [windows];
    const fn = (t, ctx) => {
      const g = ref.current;
      if (!g) return;
      const w = wins.find(([a, b]) => t >= a && t < b);
      g.visible = !!w;
      if (w) upd.current(t, w[0], w, ctx);
    };
    frameRegistry.add(fn);
    return () => frameRegistry.delete(fn);
  }, []);
  return ref;
}
