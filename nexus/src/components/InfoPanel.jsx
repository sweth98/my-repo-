export default function InfoPanel({ module, onClose }) {
  // Kept mounted so the panel can transition out rather than disappearing.
  return (
    <div
      className={`panel-wrap ${module ? "is-open" : ""}`}
      aria-hidden={!module}
    >
      <aside className="panel" role="dialog" aria-label={module?.title}>
        <header>
          <span className="panel-index">{module?.index}</span>
          <button className="panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <h2>{module?.title}</h2>
        <p className="panel-tagline">{module?.tagline}</p>

        <ul>
          {module?.items.map((item) => (
            <li key={item}>
              <span className="tick" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
