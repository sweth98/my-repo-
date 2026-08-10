import { MODULES } from "../data.js";

/**
 * The interactive half of the module ring: real DOM buttons overlaid on the
 * canvas, so hover, focus and keyboard navigation all work normally.
 *
 * This file deliberately imports nothing from three or @react-three/fiber.
 * App renders it eagerly, so any 3D import here would pull the whole WebGL
 * bundle into the entry chunk and undo the lazy split in App.jsx.
 *
 * On wide screens SkillNodes writes each button's transform every frame from
 * the projected 3D position; on narrow screens CSS lays them out as a grid.
 */
export default function NodeLabels({
  refs,
  simplified,
  activeId,
  onHover,
  onSelect,
}) {
  return (
    <div className={`node-labels ${simplified ? "is-grid" : ""}`}>
      {MODULES.map((m, i) => (
        <button
          key={m.id}
          ref={(el) => (refs.current[i] = el)}
          className={`node ${activeId === m.id ? "is-active" : ""}`}
          onMouseEnter={() => onHover(i)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(i)}
          onBlur={() => onHover(null)}
          onClick={() => onSelect(m.id)}
          aria-pressed={activeId === m.id}
        >
          <span className="node-index">{m.index}</span>
          <span className="node-title">{m.title}</span>
          <span className="node-tagline">{m.tagline}</span>
        </button>
      ))}
    </div>
  );
}
