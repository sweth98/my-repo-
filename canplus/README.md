# CanPlus — marketing site

Modern Learning. Without Losing Control.

React 19 + TypeScript + Tailwind CSS v4, built with Vite. Two runtime
dependencies (`react`, `react-dom`) — no animation, icon or UI library.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit && vite build
npm run preview
```

---

## ⚠️ Two things to settle before this goes live

### 1. Every factual claim needs verifying

`canplus.io` was unreachable from the build environment, so **nothing on this
site was taken from the live site** — it all came from the project brief.

Every claim lives in one file: **`src/content/site.ts`**. Items marked
`verify: true` assert a number, a named customer or a compliance standard.
Check each against canplus.io before launch:

| What | Where |
|---|---|
| 50+ institutions · 500K+ learners · 15 countries · 100K+ concurrent | `STATS` |
| NorthCap University · Defence Training Academy · Public University Network · Global Corporate L&D | `CASE_STUDIES` |
| NorthCap metrics (4,000 students, 4-year engagement) | `CASE_STUDIES[0].metrics` |
| GDPR · PDPA · FERPA · HIPAA-ready · SOC-aligned | `COMPLIANCE` |

Deliberately absent, because nothing supported them: customer logos,
testimonials, quotes, pricing, awards, partner names, certification claims, and
any statistic not listed above.

Two wordings are load-bearing and should not be loosened without written
confirmation:

- Compliance standards are described as **what the platform is designed to
  support**, never as held certifications (`src/components/Security.tsx`).
- Catalogue course titles and the AI Module Builder output are labelled
  **interface examples**, not CanPlus offerings.

### 2. The logo is a placeholder

`public/brand/` contains neutral geometric stand-ins, **not** the CanPlus mark.
Replace all three, keeping the filenames:

```
public/brand/canplus-logo.svg        # on light backgrounds
public/brand/canplus-logo-light.svg  # on the navy footer and dark sections
public/brand/favicon.svg
```

`<Logo>` in `src/ui/primitives.tsx` is the only consumer, so swapping the files
updates every instance. The wordmark is never set as live text.

---

## Structure

```
src/
  content/site.ts        all copy and every claim — the file to audit
  ui/primitives.tsx      Reveal, Logo, Button, Section, Tag, ProgressRing
  lib/reveal.ts          one shared IntersectionObserver for scroll reveals
  components/            one file per section, in page order
```

Sections in order: `Navbar · Hero · TrustBar · Ecosystem · AIStack ·
LearnerExperience · InstructorExperience · Labs · Stage · Credentials ·
Catalogue · Deployment · Integrations · CaseStudies · WhyCanPlus · Security ·
CTA · Footer`.

## Design system

Tokens are defined once in `src/index.css` under `@theme` — Tailwind v4 is
CSS-configured, so there is no `tailwind.config.js`.

Deep navy (`navy-*`), CanPlus blue (`brand-*`) and a purple accent
(`accent-*`), on white and very light lavender (`mist-*`). Colour directs
attention; everything else is neutral. Adding a third accent will break the
restraint the design depends on.

## Notes on the build

**Product visuals are built from layout primitives, not images.** Every
dashboard, terminal, video player and credential card is real DOM, so it stays
sharp at any resolution, reflows properly on mobile, and costs no image
payload. There are no raster assets on the site at all.

**Animation is CSS-only.** A single `IntersectionObserver` adds `.is-in` to
reveal elements and then unobserves them. `prefers-reduced-motion` is honoured
in one place, at the bottom of `index.css`.

**`Reveal` carries `min-w-0` on purpose.** It is used as a grid child
throughout, and a grid item's default `min-width: auto` refuses to shrink below
its content — which caused real horizontal overflow at 320px until fixed.

**Headings with an explicit `<br/>` use `hd-manual`.** The base
`text-wrap: balance` otherwise overrides the authored break and splits the
tagline mid-clause.

## Verified in-browser

Checked at 320, 390, 768, 1280, 1440 and 1920 px:

- no horizontal overflow at any width
- no console errors
- exactly one `<h1>`; `<h2>` per section
- every `<img>` has alt text
- touch targets ≥ 44 px on all touch breakpoints (320–768)

Not yet done: a real accessibility audit with a screen reader, and Lighthouse
against a deployed build.
