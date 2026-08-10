import { CONTACT_EMAIL } from "../data.js";

export default function Footer() {
  return (
    <footer className="footer">
      <h2>CURIOUS ABOUT WHAT AI CAN BUILD NEXT?</h2>
      <a className="cta cta-solid" href={`mailto:${CONTACT_EMAIL}`}>
        LET'S CREATE
      </a>
      <p className="colophon">
        NEXUS — AI Innovation Lab
        <span className="dot-sep">·</span>
        Built with React, Vite and Three.js
      </p>
    </footer>
  );
}
