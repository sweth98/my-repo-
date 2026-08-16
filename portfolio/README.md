# Swetha Tripathi — UI/UX Portfolio

Static site, no build step. Open `index.html` directly, or serve locally:

```bash
cd portfolio
python3 -m http.server 8000
# visit http://localhost:8000
```

## Structure

```
portfolio/
  index.html                 Home: hero, work, about, skills, experience, contact
  case-studies/
    lumina.html               Case study — Lumina (AI learning assistant)
    hydroaura.html            Case study — HydroAura (hydration tracking)
  css/style.css                Design tokens + all styling
  js/main.js                   Scroll reveal, nav, magnetic buttons
  assets/
    lumina/    hydroaura/    cloud/     Drop real exported screens here
```

## Swapping in your real screenshots

Every image slot on the site is currently a labeled placeholder frame
(a `.frame-fill` element with a `data-swap="assets/.../name.png"` attribute
showing you exactly which file it expects). To swap one in:

1. Export the screen from Figma as PNG (2x recommended) into the matching
   `assets/<project>/` folder using the filename shown in the placeholder
   label (e.g. `assets/lumina/01-landing.png`).
2. Replace the `<div class="frame-fill" data-swap="...">...</div>` block
   with `<img src="..." alt="...">` at that spot.

Needed files, by project:

- **Lumina** (`assets/lumina/`): `cover.png`, `cover-wide.png`,
  `01-landing.png`, `02-signin.png`, `03-tutor-intro.png`, `04-levels.png`,
  `05-chat.png`, `06-home.png`, `wireframe-vs-final.png`
- **HydroAura** (`assets/hydroaura/`): `cover.png`, `cover-wide.png`,
  `01-today.png`, `02-history.png`, `03-social.png`, `04-settings.png`,
  `wireframe-vs-final.png`
- **Linux Services dashboard** (`assets/cloud/`): `cover.png` (only a card
  image is used — no dedicated case study page since no screens were
  provided for a deeper breakdown)

## Content source

Resume/CV content (experience, skills, education) is pulled directly from
the provided `.docx`. Case-study narrative (problem, goals, design
decisions) is written from direct analysis of the screens as originally
described/shown — no metrics, user research, or outcomes are invented;
anything inferred from the design itself is labeled as design rationale,
not documented research.
