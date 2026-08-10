/**
 * One shared IntersectionObserver for every scroll reveal on the page.
 *
 * A per-element observer would mean dozens of them; a single instance that
 * elements register with costs one. Elements unobserve themselves once shown,
 * so the observer's work shrinks as the visitor scrolls.
 */
let observer: IntersectionObserver | null = null;

function get(): IntersectionObserver | null {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return null;
  }
  observer ??= new IntersectionObserver(
    (entries, io) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  return observer;
}

export function observeReveal(el: Element | null): () => void {
  if (!el) return () => {};
  const io = get();
  if (!io) {
    // No observer support: show the content rather than hiding it forever.
    el.classList.add("is-in");
    return () => {};
  }
  io.observe(el);
  return () => io.unobserve(el);
}
