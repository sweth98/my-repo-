# FROM BEAN TO BREW: Reference Analysis and Implementation Plan

## 0. Method and limits

- **Sampled:** every clip at one frame per 2 s (contact sheets), plus duration, frame rate and audio level from ffprobe/ffmpeg.
- **Timestamps** are therefore good to about ±1 s.
- **Speeds** are visual estimates from frame-to-frame change. They are not measured. They set a starting range to tune against the footage.
- **Missing inputs:** all 6 videos have now arrived. The **cinematic storyboard** has not. Scene timings in §2 are my proposal until it does.
- **Mapping used:** clips follow your upload order (V1 to V5), and V6 is the last clip you sent.

| # | Duration | Format | Content |
|---|---|---|---|
| V1 | 24.1 s | 720×1280, 30 fps | Plantation to cup montage (cherries, beans, roast, grind, pour-over, latte) |
| V2 | 14.3 s | 720×900, 29.97 fps | Cherry sorting table (real, handheld) |
| V3 | 24.9 s | 720×1280, 30 fps | Roaster: flame, charge, drum, cooling arm, discharge |
| V4 | 30.4 s | 720×1280, 30 fps | Barista: dose, tamp, extract, steam, pour, etch |
| V5 | 30.4 s | 720×1280, 30 fps | Extreme macro espresso from a bottomless portafilter |
| V6 | 9.2 s | 720×1280, 30 fps | Overhead latte-art pour, rosetta/tulip |

Two cautions:
- **V1 looks AI-generated.** Its shots are idealised (clean droplets, perfect crema). Use it for mood and grade, not for physical truth.
- **V4 carries a brand watermark ("NARBONA", last seconds).** Do not reproduce it.

---

## 1. Reference breakdown

### 1.1 Video 1: plantation to cup montage (24.1 s)

| Time | Shot |
|---|---|
| 0–2 | Branch of ripening cherries, backlit leaves, golden-hour bokeh |
| 2–4 | Cherries spilled on linen, soft diagonal window shadows |
| 4–6 | Wet cherries, droplets, mixed ripeness (red, maroon, yellow, dried black) |
| 6–8 | Macro of one cherry: droplets, stem scar, crown dimple |
| 8–10 | Loose roasted beans on creased linen |
| 10–14 | Roast-bed close-up, steam wisp curling up, light shafts |
| 14–16 | Grinder burr drops a fall of grounds. One bean sits on a steel post |
| 16–20 | Gooseneck pour over a coffee bed in a filter. Bloom swells, water column visible |
| 20–22 | Pour into a white cup, foam ring, spill shadow |
| 22–24 | Latte art overhead: tulip with bubbles |

1. **Objects:** cherries, leaves, linen, beans, roasting pan, steel grinder spout, gooseneck kettle, paper filter, white cups.
2. **Process:** pick, wash, roast, grind, bloom/pour, serve.
3. **Motion:**
   - Slow push-ins.
   - Steam drifts upward and curls.
   - Grounds fall as a fine plume.
   - Water falls in a laminar column.
4. **Speed:**
   - Camera: about 3–5 cm/s equivalent.
   - Steam: about 10 cm/s.
   - Pour: about 1 m/s.
5. **Camera:** vertical 9:16. Low-angle hero close-ups, macro push-ins, one overhead.
6. **Depth of field:** very shallow. Subject plane is a few mm deep, background is creamy bokeh. Practical lights show as round bokeh discs.
7. **Light:**
   - Plantation: warm backlight from low sun, rim-lit leaves, soft linen fill.
   - Roast and pour scenes: amber key from camera-left, dark falloff right.
8. **Surfaces:** waxy cherry skin with specular droplets, matte linen weave, bean centre-cut crease, brushed steel.
9. **Materials:** cherry (dielectric, glossy, wet), bean (satin, slightly oily), linen (rough, subsurface-ish fuzz), steam (volumetric, low density).
10. **Most useful moments:**
    - 6–8 s: the macro cherry is the **reference for the cherry asset**.
    - 10–12 s: the steam curl.
    - 14–15 s: the grounds fall.
    - 16–18 s: the bloom.
    - 22 s: the latte art.

### 1.2 Video 2: cherry sorting table (14.3 s)

| Time | Shot |
|---|---|
| 0–3 | Cherries tumble from a mesh chute onto a vibrating perforated deck |
| 3–9 | Deck full of cherries. Slow vertical shimmy. Angled steel guide rail crosses frame |
| 9–14 | Camera drifts to show the steel gantry, daylight windows and a worker in the background |

1. **Objects:** several thousand cherries (red, orange, maroon, a few yellow and green leaves), perforated steel deck, blue steel tray, grey rail, mesh chute.
2. **Process:** hopper to chute to vibrating screen. Debris falls through the holes, cherries migrate along the deck.
3. **Motion:** the chute pour is a free-fall cascade with tumbling and bouncing on impact. On the deck, a high-frequency shake makes the pile shimmer and slide, with constant slow drift toward one end.
4. **Speed:** cascade about 1–2 m/s. Deck drift about 5–10 cm/s. Shake roughly 8–12 Hz, millimetre amplitude (visual estimate).
5. **Camera:** handheld, vertical-ish, oblique downward angle. Slow lateral pan. Small natural wobble.
6. **Depth of field:** deep. Near-to-far is mostly sharp. Only the far background (people, structure) softens.
7. **Light:** flat overhead daylight from a large window, no strong shadows. Cool neutral cast (a utilitarian look, not the V1 golden look).
8. **Surfaces:** cherry skin satin to glossy, varied colour per fruit, occasional stem or leaf, scuffed painted steel.
9. **Materials:** cherry dielectric with colour variance. Perforated metal (alpha-cutout or real holes). Painted sheet steel.
10. **Most useful moments:**
    - 0–2 s: cascade onto the deck.
    - 4–6 s: the dense-pile shimmer.
    - 12–14 s: parallax between pile and gantry.

Use V2 as the **physical-behaviour reference** for cherry piles. Grade the 3D version warmer to match V1.

### 1.3 Video 3: roasting machine (24.9 s)

| Time | Shot |
|---|---|
| 0–2 | Gas burner flame inside a black housing: blue base, orange tips |
| 2–4 | Hand pours green beans from a white scoop into a steel hopper funnel |
| 4–6 | Looking into the drum: pale tan beans |
| 6–10 | Machine front: hinge, bolts, polished sight glass. Beans visible through it, tan to yellow |
| 10–14 | Cooling tray: dark roasted beans, motion-blurred under a rotating stir arm. Wooden handle visible |
| 14–18 | Stirring arm sweeps. Beans rearrange, small perforations visible beneath |
| 18–24 | Discharge: beans stream down the front chute, motion-blurred, glossy black housing reflecting them |
| 24 | Chute empty, a few stragglers fall |

1. **Objects:** burner, hopper, drum, sight glass, cooling tray, stir arm, discharge chute, wooden handle.
2. **Process:** charge, roast (colour shift green to tan to brown), cool and stir, discharge.
3. **Motion:**
   - Beans tumble in the drum.
   - The cooling arm sweeps a slow arc.
   - The discharge is a gravity stream.
4. **Speed:** the arm turns about 0.3–0.5 rev/s. The discharge stream falls at roughly 1–1.5 m/s.
5. **Camera:** vertical. Mostly locked-off or very slow macro. Several tight inserts. Overhead looking down the tray.
6. **Depth of field:** shallow to moderate. Foreground steel sharp, drum interior soft.
7. **Light:**
   - Dark room, warm tungsten key from the upper left.
   - Specular streaks on steel.
   - Blue-orange flame as the only cool accent.
8. **Surfaces:** mirror-polished steel with distorted environment reflections, brushed steel, textured black powder-coat, varnished wood, matte-satin beans.
9. **Materials:**
   - Polished steel: low roughness, strong environment reflections. This is critical.
   - Roasted bean: dielectric, roughness about 0.45, micro-oily highlights.
   - Green bean: matte, pale, slightly dusty.
10. **Most useful moments:**
    - 0 s: the flame.
    - 2–3 s: the pour into the hopper.
    - 8–12 s: green-to-roast colour change through the sight glass.
    - 20–22 s: the discharge stream.

### 1.4 Video 4: barista sequence (30.4 s)

| Time | Shot |
|---|---|
| 0–2 | Ground coffee falls into a steel portafilter under the grinder |
| 2–6 | Tamper pressed down by hand, then a tool or tamper handle close-up |
| 6–8 | Pitcher edge and steam, portafilter locked in |
| 8–12 | Extraction: espresso runs from the spout into a white cup. Overhead view of the pool |
| 12–16 | Steam wand frothing milk in a steel pitcher |
| 16–18 | Cup with a cocoa-dusted espresso surface |
| 18–24 | Pour: milk enters, white pours through cocoa, spiral and heart form |
| 24–30 | Overhead and side: spoon etches the pattern. Final spoon lift. Watermark appears at the end |

1. **Objects:** portafilter, tamper, group head, white cups, steel pitcher, steam wand, spoon, marble counter.
2. **Process:** dose, tamp, extract, steam, pour, etch.
3. **Motion:** hand-driven, so there is variation. Tamp is a slow press. Extraction starts as drips and becomes a thin stream. Milk is poured in a steady ribbon and wiggled. The spoon draws fine lines.
4. **Speed:** tamp about 2 s. Extraction about 25–30 s in reality (compressed in the edit). Pour about 6 s.
5. **Camera:** vertical, handheld-feeling. Inserts at counter height and overhead.
6. **Depth of field:** shallow. Cup rim and pour are sharp, background is warm bokeh.
7. **Light:** warm tungsten, mixed with white window light on the later marble scenes.
8. **Surfaces:** polished steel, thick white ceramic, cocoa powder (matte, speckled), microfoam (matte-glossy), marble with soft bokeh lights.
9. **Materials:**
   - Espresso: dark liquid with a reddish-gold crema layer.
   - Milk: white, thick, creamy, high viscosity. Pattern lines stay sharp.
   - Ceramic: soft glossy white with slight translucency at thin edges.
10. **Most useful moments:**
    - 8–10 s: extraction thread.
    - 20–23 s: the pour and white-through-cocoa contrast.
    - 24–28 s: the etch.

V4 is the secondary latte-art reference (spoon etch). V6 is the primary one.

### 1.5 Video 5: extreme macro espresso (30.4 s)

| Time | Shot |
|---|---|
| 0–2 | Empty bottomless basket, perforated. Black housing. Soft lights behind |
| 2–4 | First drips. Several dark red-brown beads pool and merge. Webbed dark cracks (tiger-striping) on the surface |
| 4–10 | Single column forms. Flow lines streak radially into the centre like a funnel |
| 10–26 | Steady, near-static state: orange-gold stream, strong highlights, radial striping |
| 26–28 | Flow thins. Crema blonds and bubbles appear |
| 28–30 | Last drop forms and hangs on the basket's lowest point |

1. **Objects:** bottomless portafilter basket, black group housing, one liquid column.
2. **Process:** pressurised extraction with colour shift from dark to gold to pale blond.
3. **Motion:** laminar and almost frozen, with streaks converging. Pooled droplets coalesce at the start. At the end a single drop elongates and detaches.
4. **Speed:** apparent flow about 5–10 cm/s. Highlights barely move. Near-constant for 16 s.
5. **Camera:** locked-off macro, upward angle, near-zero movement.
6. **Depth of field:** very shallow. Stream sharp, housing detail soft.
7. **Light:** two soft strip lights behind and to the sides give small rectangular specular glints. Rest is a dark studio.
8. **Surfaces:** glossy liquid with fine radial streaks, tiny foam bubbles in the final seconds, matte black metal, polished perforated basket.
9. **Materials:** a thick, glossy, highly refractive liquid with deep amber colour, saturation that shifts over time, and almost no visible volume noise.
10. **Most useful moments:**
    - 2–4 s: the first-drips merge (tiger-striping).
    - 6–12 s: the clean funnel.
    - 26–30 s: bubbles and the hanging drop.

### 1.6 Video 6: overhead latte art (9.2 s)

Sampled at 1 frame per second, so timestamps are good to about ±0.5 s.

| Time | Shot |
|---|---|
| 0–1 | Pitcher tilts in, thick white milk meets a golden crema surface. First white patch forms |
| 1–3 | Pitcher swings side to side. Pattern builds as stacked folds that spiral toward the pour point |
| 3–5 | Cup nearly full. Layered rosetta with a defined heart cluster |
| 5–7 | Pitcher keeps wiggling at the cup edge, adding layers and a crisp contrast edge |
| 7–8 | Pitcher lifts and sweeps through the centre, then away |
| 8–9.2 | Pitcher gone. Static top-down final pattern: a feathered tulip/rosetta, a clean white-on-gold finish |

1. **Objects:** white ceramic cup, steel pitcher, barista hand and linen shirt with buttons, patterned rug backdrop.
2. **Process:** a controlled pour. Milk dives under the crema, then is raised to float on the surface. The wiggle deposits layers. A pull-through draws the stem.
3. **Motion:**
   - The pitcher moves in a slow lateral oscillation of a few centimetres.
   - The milk lands at one point, and the pattern grows outward and spirals as the cup is slowly rotated.
   - The final pull-through is a quick, straight sweep.
4. **Speed:** wiggle about 2–3 Hz. Pull-through under 1 s. Pour lasts about 7 s.
5. **Camera:** locked-off overhead (top-down), tiny drift. The cup and hand stay in frame.
6. **Depth of field:** moderate. The cup and pattern are sharp, the rug is slightly soft.
7. **Light:** warm directional light from the upper left, soft shadow under the pitcher, saturated rug colours (teal, red, cream) in the background.
8. **Surfaces:** caramel-orange crema with a tiny sheen, glossy white microfoam, brushed steel pitcher, off-white ceramic.
9. **Materials:**
   - Microfoam: opaque-white, creamy, with a sharp edge against crema (high surface tension and viscosity).
   - Crema: warm amber, semi-gloss.
   - Pitcher: polished steel reflecting the cup and the rug.
10. **Most useful moments:**
    - 0.5–1.5 s: the first white seed under the pour.
    - 3–5 s: how layers stack up and fold.
    - 8.5–9.2 s: the clean final pattern, which doubles as the end-card reference.

---

## 2. Scene-by-scene mapping

| Scene | Environment | Reference | Duration | Light |
|---|---|---|---|---|
| S1 Plantation | Branch, leaves, golden hour | V1 0–2, 4–8 | 8 s | Warm backlit sun |
| S2 Harvest | Cherries on linen | V1 2–8 | 6 s | Warm window |
| S3 Sorting | Vibrating deck | V2 | 8 s | Soft daylight, graded warm |
| S4 Roast | Roaster | V3 | 12 s | Dark studio, tungsten and flame |
| S5 Grind and dose | Grinder to portafilter | V1 14–16, V4 0–6 | 6 s | Studio warm |
| S6 Extraction macro | Basket and stream | V5 | 10 s | Dark studio, strips |
| S7 Milk and pour | Steam, pitcher | V4 12–24 | 10 s | Studio warm |
| S8 Latte art | Overhead pour and etch | V6 (primary), V4 24–30, V1 22–24 | 10 s | Studio warm, warm directional |

**Total:** about 70 s, with room to trim to 60 s.

## 3. Required 3D assets

**Organic**
- Coffee cherry, 4 ripeness variants: red, maroon, orange-yellow, dried black. Each with stem scar and crown dimple.
- Green bean and roast-level beans (light, medium, dark). Centre-cut crease, chaff.
- Leaf cluster and branch.
- Ground coffee as particles.

**Mechanical**
- Perforated sorting deck, chute, blue tray, rail.
- Roaster (hopper, drum, sight glass, hinge, bolts, cooling tray, stir arm, wooden handle, discharge chute). Burner.
- Grinder spout, portafilter (basket plus bottomless), tamper, group head, steam wand, gooseneck kettle, dripper cone.
- White cups, steel pitcher, spoon, marble counter, linen.

**Effects**
- Water column, bloom surface, espresso funnel stream and drips, crema foam, milk ribbon, steam, flame.

## 4. Material and shader requirements

| Material | Key properties |
|---|---|
| Cherry skin | Per-instance colour variance, clearcoat for wetness, droplet normal map |
| Bean | Roughness around 0.4–0.5, per-instance tint, crease normal |
| Linen | Woven normal map, sheen |
| Polished steel | Roughness under 0.1, high-quality environment map (this carries the realism) |
| Powder-coat black | Orange-peel normal, roughness 0.5 |
| Ceramic | Clearcoat, subtle transmission at edges |
| Espresso liquid | Amber absorption, high gloss, streak flow-map |
| Crema | Foam-bubble layer (instanced spheres or noise), subsurface scatter |
| Milk | Opaque-white with soft subsurface, cocoa-dusted surface texture |
| Steam | Soft particles with noise-based density, lit from behind |
| Glass or water | Transmission, IOR 1.33 |

## 5. Animation systems

- **Instanced particle pile:** 1,000 to 5,000 cherries and beans with rigid-body-style physics. Gravity, bounce, friction.
- **Vibrating-deck driver:** sinusoidal shake plus a slow drift force.
- **Roaster:** drum rotation, colour-over-time curve (green to tan to brown), cooling arm sweep.
- **Fluid illusions:**
  - Espresso stream: a lofted tube mesh with a scrolling flow texture.
  - Pour: a rope mesh with slight wobble.
  - Latte art: a texture painted over time from a pour path, with a blur/advection pass. This is a visual approximation, not a fluid simulation.
- **Steam:** noise-driven particle emitter.
- **Foam bubbles:** instanced spheres that grow and pop.

## 6. Camera choreography

- Vertical 9:16 master, optional 16:9 crop.
- A shared "camera language": slow push-ins on hero subjects, one macro rack-focus per scene, overhead for art.
- A subtle handheld wobble on the plantation and sorting scenes only. Locked-off for the roasting, espresso macro and etching scenes.
- Depth of field driven by a focus-distance track per shot.

## 7. Scene transitions

- **Match cuts:** bean-on-linen to bean-in-roaster. Roaster discharge to grinder fall. Espresso stream to cup pool. Overhead cup to final latte.
- **Light bridging:** warm plantation gold to warm studio amber, with the same graded orange midtones.
- Short steam or bokeh wipes only where a match cut is not available.

## 8. Technical challenges

1. **Liquids:** real fluid simulation is not realistic in-browser. I will use shader and mesh approximations and label them as such.
2. **Polished steel realism:** it needs an environment map built to match each scene's light.
3. **Thousands of rigid bodies:** need instancing and a lightweight physics step, or baked physics.
4. **Depth of field and motion blur:** need post-processing, which costs frame rate.
5. **Latte art:** convincing white-through-brown advection without a fluid solver.
6. **Continuity:** one shared cherry and bean asset, one colour grade.
7. **Render fidelity:** real-time WebGL will not match V5's macro photographic quality. Offline rendering (Blender Cycles) would.

## 9. Staged implementation plan

| Stage | Deliverable |
|---|---|
| 0 | Confirm tech target and storyboard (see below) |
| 1 | Shared look-dev: cherry, bean, linen, steel, lighting rig, grade, DOF |
| 2 | S1–S2 plantation and harvest |
| 3 | S3 sorting deck with instanced physics |
| 4 | S4 roaster |
| 5 | S6 espresso macro (hardest shader) |
| 6 | S5 and S7 grind, dose, steam and pour |
| 7 | S8 latte art |
| 8 | Transitions, sound design, final grade, export |

Each stage ends with a rendered check against the corresponding reference frames.

## 10. Honesty notes

- Everything fluid, particle or steam here is a **visual approximation**, not a physically accurate simulation.
- Real-time WebGL can get "stylised photoreal". Matching V5's macro realism will take offline rendering.
