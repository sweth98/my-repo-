# PROJECT AURA — Part 6: Prototype Development Plan

Budgets in INR, rough single-unit estimates (±30 %), exclude your tools (soldering station, multimeter) unless listed. **Lab-safety:** work behind current-limited bench supply, wear safety glasses, never leave Z2 powered unattended during early tests, keep a fire extinguisher / sand bucket near the lithium-battery test items.

---
## Prototype 1 — Sensor-controlled smartphone wireless charger (Z1)

**Goal:** automatic detect → align check → charge → monitor → stop on a Qi2 phone.

**Components** (₹): ESP32-S3 devkit 1,000 • certified Qi2 15 W charger pad/module (reuse its coil+controller) 2,500 • 20 V PD source 5 A/100 W adapter + PD trigger board 3,500 (or 9–12 V 2 A adapter if the Qi2 pad uses it — check its input) • load switch/MOSFET module 200 • VL53L1X 600 • 4× analog Hall (DRV5055 breakout/chips) 500 • 2× NTC 100 • MLX90614 900 • INA226 250 • HX711 + small load cell 300 • WS2812 ring 250 • 5 V fan (optional) 150 • breadboard/proto board/wires/connectors 800 • 3D-printed or acrylic carrier 500. **Total ≈ ₹ 11,500 (range 8,000–15,000)**.

**Circuit architecture:**
```
Adapter ─▶ INA226 ─▶ P-MOSFET/load-switch (GPIO) ─▶ Qi2 pad power input
ESP32: I2C ─ INA226, VL53L1X, MLX90614; ADC ─ Hall×4 (via divider/ADS1115), NTC; HX711; GPIO ─ switch, LED
```
**Wiring:** I²C SDA GPIO8 / SCL GPIO9 (4.7 kΩ pull-ups, 3.3 V); load-switch gate GPIO4 (with 100 kΩ pulldown); HX711 DT 12 / SCK 13; fan PWM GPIO7 (via MOSFET); LED data GPIO15 (330 Ω series, 5 V supply, common ground). Hall sensors output 3.3 V ratiometric → ADC inputs 1–4 with 100 nF filter.

**Software:** `aura/firmware` (core + HAL). Add ToF driver (Pololu VL53L1X lib), Hall alignment calc, LED animation (FastLED/Adafruit NeoPixel). Calibrate weight (known masses), Hall baseline (pad empty vs. phone).

**Assembly:** 1) Open/mount the Qi2 pad on a flat base, keep coil visible. 2) Glue 4 Hall sensors around the magnet ring outside the coil. 3) Mount ToF facing up at the edge, NTC taped to coil rear, MLX90614 facing glass underside. 4) Load cell/FSR under the pad's puck. 5) Wire per above, power-up with current-limited supply; verify sensor readouts over Serial before enabling power switch.

**Testing:** (a) sensor calibration table; (b) detect latency (target < 300 ms); (c) alignment offset sweep with Hall readings vs. charging power; (d) coin/foil on pad → verify shutdown (both module FOD and LDC if fitted; use a *cool* coin test, watch temperature); (e) thermal run 1 h; (f) complete-detection (charge a phone from 20 → 100 %, log current); (g) fault injection list in `05`.

**Expected performance (assumption, not measured):** 7.5–15 W to a Qi2 phone, system efficiency ~60–75 % (module-dependent), < 40 °C pad surface at 15 W.

**Limitations:** relies on certified module's FOD; Hall alignment only meaningful for magnetic-ring phones; can't change charging profile (Qi controlled by module); phone-case thickness limits.

---
## Prototype 2 — Higher-power laptop wireless link (Z2) with receiver accessory

**Goal:** a bench-top series-series inductive link delivering 20 W → 30 W → 45 W to a USB-C PD sink (laptop or electronic load), with monitoring and protection. 65 W only if 45 W meets thermal/efficiency goals.

**Exit criteria (go/no-go):** ≥ 30 W continuous for 30 min at ≥ 70 % system efficiency with coil < 70 °C, surface < 43 °C, FOD trips on test objects, hardware latch verified.

**Components** (₹): 100 W PD adapter 3,500 • buck-boost DC-link board (≥ 5 A, 8–24 V) 4,000 • full-bridge inverter (4 MOSFETs/GaN + gate driver + heatsink) 3,500 • Litz wire (2 coils) 3,500 • ferrite tiles 2,500 • resonant caps (film/C0G) 1,200 • RX rectifier + buck + PD-source board 6,500 • ESP32-S3 + ESP32-C3 1,400 • INA226 ×3 750 • LDC1612 ×2 + PCB coils 2,000 • NTC×6 + MLX90614 1,200 • load cells+HX711 800 • USB-C electronic load / PD analyser (**strongly recommended**) 3,500 • fan/heatsinks/thermal pads 1,500 • 4-layer custom PCB (small batch) 4,000 • LCR meter/VNA (if you don't own; NanoVNA ≈ 4,000, LCR ≈ 3,000) 4,000 • misc 2,000. **Total ≈ ₹ 48,000 (range 35,000–70,000).**

**Circuit architecture:**
```
20V PD ─▶ eFuse ─▶ INA226 ─▶ buck-boost (DC-link Vdc, I-limit) ─▶ full-bridge (f≈110 kHz, 50% duty, phase/freq fixed) ─▶ C_tx ─ L_tx
                                                                                      ≈ gap 6–10 mm ≈
RX: L_rx ─ C_rx ─▶ full-bridge rectifier ─▶ bulk C ─▶ buck (Vout 20 V) ─▶ PD source ─▶ USB-C ─▶ laptop/e-load
 RX ESP32-C3: INA226 on rectifier out, NTC, BLE notify.     HW latch: NTC comparators + INA alert → inverter EN.
```
**Wiring notes:** keep inverter–coil loop area tiny; twisted/Litz leads; Kelvin-connect shunts; scope ground spring on gate/switch node; **do not probe the resonant tank with a ground-lead on a floating node** (use differential/isolated probe).

**Software requirements:** DC-link ramp controller (slew-limited), BLE RX telemetry client, loss accounting, LDC1612 baseline/threshold, ZoneController (Laptop zone, limits: maxPowerW 20 → 30 → 45, weight window 800–3500 g), data logger (CSV over serial).

**Assembly (staged):**
1. Wind and measure coils (target L ≈ 20–30 µH; measure, then compute caps for f₀ ≈ 110 kHz). 
2. Bring up the inverter into a dummy resistive load at low voltage (12 V, current-limited 1 A) — check dead time/ZVS on scope.
3. Connect TX+RX coils with 10 mm spacing at ≤ 5 W; tune f/C for max efficiency. 
4. Add RX rectifier + resistive load; step up Vdc, record η. 
5. Add buck + PD source into e-load, then a real laptop. 
6. Add sensors & protections; verify hardware trip with firmware off.

**Testing:** efficiency map η(P, gap, offset); thermal imaging at each power step with 20-min soak; FOD object tests; EMI near-field scan; link-loss test (BLE off ⇒ inverter stops < 500 ms); laptop PD renegotiation behaviour (some laptops reject non-PD or slow sources).

**Expected performance (design targets, unverified):** 20 W at 75–85 %; 45 W at 70–80 %; 65 W likely marginal thermally.

**Limitations / risks:** needs RX accessory (cable pigtail on laptop side); coupling reduced by metal chassis/feet; FOD at power unproven; EMC compliance uncertain; PD-source IC selection; laptops with > 65 W requirement not covered; not a certified product — **research prototype only**.

---
## Prototype 3 — Integrated AURA hub

**Goal:** both zones, one controller, one enclosure, all sensors, app.

**Added components** (₹): custom 4-layer main PCB (integrates MCU, power stage, sensor connectors) 6,000–9,000 • CNC/aluminium frame + tempered glass (prototype quantity quote) 8,000–15,000 • LED light guide/diffuser 1,500 • rear connectors, gaskets, feet 1,000 • extra thermal solution (blower, spreader plate) 2,500 • cabling/harness 1,000 • enclosure iteration allowance 5,000. **Added ≈ ₹ 25,000–35,000 over P1+P2 hardware; whole-unit total ≈ ₹ 85,000–1,10,000 for the first integrated unit** (excluding certification — which is typically ₹ lakhs).

**Architecture:** as `01` §2 diagram. Two ZoneControllers (Z1, Z2) in one firmware; shared thermal budget manager (total allowed input ≤ 90 W; Z2 limit reduces if Z1 draws 15 W, fan curve based on max temp).

**Assembly:** 1) Fit Z2 coil + ferrite + sense PCB into spreader plate; 2) mount Z1 module with Hall ring; 3) install main PCB, blower, harness; 4) load-cell carrier; 5) glass top with gasket/adhesive tape; 6) run in "open frame" first (no glass) for thermal checks.

**Testing:** all P1 and P2 tests in the enclosure + simultaneous Z1/Z2 operation, mutual interference (Z2 field on Z1 FOD and Hall sensors!), enclosure thermal soak (ambient 35 °C), EMC pre-compliance, 500-cycle reliability, user-trials of alignment and LED understanding.

**Expected performance:** Z1 ≈ 15 W; Z2 ≈ 30–45 W (if P2 passes); simultaneous operation limited by input (≈ 100 W adapter).

**Limitations:** thermal envelope tight; Z2 depends on receiver accessory; certification/cost significant; possible Z2↔Z1 interference needing frequency separation/time multiplexing.
