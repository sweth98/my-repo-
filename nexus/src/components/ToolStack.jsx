import { TOOLS } from "../data.js";

export default function ToolStack() {
  return (
    <section className="tools" id="tools">
      <p className="eyebrow">
        <span className="status-dot" />
        TOOL STACK
      </p>
      <h2 className="section-title">Tools explored</h2>

      <ul className="tool-list">
        {TOOLS.map((tool) => (
          <li key={tool} className="tool">
            {tool}
          </li>
        ))}
      </ul>
    </section>
  );
}
