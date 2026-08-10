export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-top">
        <p className="eyebrow">
          <span className="status-dot" />
          AI INNOVATION LAB
        </p>
        <h1>
          BUILDING WITH AI.
          <span>DESIGNING WITH INTELLIGENCE.</span>
        </h1>
      </div>

      <div className="hero-bottom">
        <p className="lede">
          Exploring the intersection of artificial intelligence, design,
          automation and digital experiences.
        </p>
        <a className="cta" href="#stage">
          EXPLORE MY WORK
          <span className="cta-arrow" aria-hidden="true">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
