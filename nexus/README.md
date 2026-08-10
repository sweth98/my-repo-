# NEXUS — AI Innovation Lab

A single-page 3D portfolio site. React + Vite + React Three Fiber, no backend,
no database, six runtime dependencies total.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Structure

```
src/
  App.jsx                  state, layout, intersection observer
  data.js                  all copy: modules, tools, contact address
  styles.css               the entire design system
  components/
    Hero.jsx               headline block
    Scene3D.jsx            the one Canvas: camera parallax + rig positioning
    AIOrb.jsx              glowing core, wireframe shells, particle cloud
    SkillNodes.jsx         the five 3D nodes + label projection
    NodeLabels.jsx         the DOM buttons (kept free of three imports)
    InfoPanel.jsx          glassmorphism detail panel
    ToolStack.jsx          tool chips
    Footer.jsx             closing CTA
```

Edit `src/data.js` to change any copy, including `CONTACT_EMAIL`, which the
footer button opens.

## How it is put together

**The canvas never handles a pointer event.** It is `pointer-events: none`, and
every interaction lives on real DOM buttons overlaid on top. `SkillNodes`
projects each 3D node to screen space each frame and writes the button's
`transform` directly, so the labels track the 3D ring with crisp text, keyboard
focus and no per-frame React re-render. No raycasting runs at all.

**One rig, three compositions.** The orb and its ring sit in a single group that
eases horizontally: offset right on the hero so the headline has clear space,
centred on the stage, nudged left when a panel opens so no module label is
covered. Moving the composition is what makes a selection feel like a response.

**Glow without a post-processing pass.** The core is five concentric additive
spheres; the stacked falloff reads as volumetric light for five tiny draw calls,
with a CSS radial gradient behind the canvas doing the ambient bloom. There are
no lights in the scene — every material is `MeshBasicMaterial`.

## Performance

- `three` sits behind a lazy `import()`, so first paint costs ~63 kB gzip of JS
  rather than ~296 kB. Verify with: `grep modulepreload dist/index.html` — the
  three chunk must not appear.
- Device pixel ratio is capped (1.75 desktop, 1.25 mobile), the single largest
  lever on retina displays.
- Below 860px, or when `prefers-reduced-motion` is set, the scene simplifies:
  particles drop from 2000 to 700, antialiasing off, the rig scales to 55%, and
  the projected ring is replaced by a static CSS grid.
- Hovering a node damps its float to a standstill, so the button underneath
  stops moving and is comfortable to click.

## Deliberate limits

- Two accent colours only (`--accent` cool blue, `--warm` amber). Everything
  else is greyscale — adding a third will break the restraint the design leans
  on.
- No routing. Selecting a module opens a panel; nothing navigates.
- Content is descriptive of tools explored and work done. It claims no
  certifications or credentials.
