# PROJECT AURA — Part 5: Safety & Engineering Validation

Standards and limits below are cited from general knowledge; **edition numbers, Indian applicability and exact limits must be confirmed with a test lab / the regulator [VERIFY]**. This is an engineering plan, not legal or certification advice.

## 1. Safety measures

| Topic | Approach | Class |
|---|---|---|
| Electrical isolation | Hub runs only from an **external certified isolated adapter** (SELV, ≤ 20 V). No mains inside enclosure. RX accessory is SELV as well. Coil-to-user: glass 4 mm + clearance. | PROVEN practice |
| Overcurrent | eFuse (hard limit ~6 A), INA226 alert → HW latch, gate-driver fault pin, firmware soft limit below hard limit | PROVEN |
| Overvoltage | TVS, eFuse OVP, PD negotiated ≤ 20 V, firmware vinMax | PROVEN |
| Thermal shutdown | NTC comparators → HW latch (~80 °C), firmware derate 60 °C / stop 72 °C, surface-temp stop 45 °C | PROVEN approach; thresholds to validate |
| Foreign object detection | Z1: module FOD. Z2: LDC1612 coil array + loss accounting + temperature rise-rate check | Z1 PROVEN; Z2 **EXPERIMENTAL** |
| Coil alignment | Z1 magnets + Hall; Z2 weight + LDC + RX-reported coupling (Vrx/Itx ratio) | Z1 PROVEN; Z2 ENGINEERABLE |
| Fail-safe defaults | Reset ⇒ all enables LOW; link loss ⇒ stop; sensor invalid ⇒ fault (not "assume OK") | — |
| Battery safety | Laptop's own charger IC controls charging via USB-PD; AURA RX never overrides it | PROVEN |

### Why hidden FOD is the hardest Z2 problem
At tens of watts, a coin/foil/clip in the field can reach very high temperature quickly. Loss accounting only works if RX power is reported accurately and promptly; metal sensing may miss objects under the laptop. Mitigation: low-power ping before ramp, ramp-with-monitoring, thermal rise-rate trips, mechanical design that keeps non-laptop objects away (raised rim / recessed zone), and conservative power in v1 (≤ 45 W).

## 2. Efficiency and power losses (budget at 45 W out, design estimate)

| Stage | Efficiency (assumed) | Loss at ~45 W out (≈ 60 W in) |
|---|---|---|
| PD adapter (external) | 90–93 % | outside hub |
| Buck-boost DC-link | 96–97 % | ~1.8 W |
| Inverter | 95–97 % | ~2 W |
| Coil link (k≈0.2–0.3, Q≈50–100) | 82–93 % | ~3–9 W (inc. ferrite, eddy) |
| RX rectifier | 94–96 % | ~2.5 W |
| RX buck/PD source | 95–97 % | ~2 W |
| **Total (hub input→USB-C out)** | **≈ 72–80 %** | **≈ 12–17 W heat** |

Measure with a power analyser at both ends (hub input, RX output) at fixed temperature; record η vs. power vs. offset vs. gap.

## 3. EMI/EMC
- Switching 100–140 kHz with MHz harmonics: use ferrite shielding behind coils, symmetric layout, tight gate-loop, snubbers; keep inverter loop small; shielded can for MCU/BLE.
- Keep RF away from BLE antenna (2.4 GHz) — ferrite and ground pour; place antenna at the board edge outside coil footprint.
- Coil stray field can couple into NFC cards, credit cards with magstripe (less so), hearing aids, pacemakers (see exposure). Add user warning.
- Pre-compliance: near-field probe + spectrum analyser, LISN conducted-emission test (CISPR 32 / EN 55032 / FCC Part 15 class B targets) **[VERIFY applicable class]**.

## 4. EM exposure assessment
- Use ICNIRP guidelines (2010 / 2020 versions) and/or IEEE C95.1 for general-public exposure. The ICNIRP 2010 general-public reference level for magnetic flux density in the 3 kHz–10 MHz region is quoted as **27 µT** (rms) **[VERIFY current edition and basic restrictions]** — verify the current ICNIRP edition and Indian requirements before using any number.
- Method: H-field probe sweep on a grid 0–200 mm above the pad (and at 100 mm from edges, 200 mm for body position) at max power with worst-case misalignment and with no RX load. Report % of reference level. Also assess active-implant interference guidance (keep-out distance statement in user manual).
- Z1 Qi2 is certified by WPC for its exposure behaviour; Z2 you must measure yourself.

## 5. Standards & certifications (shortlist)

| Area | Standard / body | Applies to |
|---|---|---|
| Qi/Qi2 | WPC Qi/Qi2 specification & certification (Qi2 uses Magnetic Power Profile) | Z1 TX (use pre-certified module; certifying your own TX requires WPC membership + test lab) |
| ICT/AV safety | IEC 62368-1 (IS 13252 (Part 1) in India under BIS CRS **[VERIFY]**) | Hub + adapter |
| EMC | CISPR 32 / EN 55032, CISPR 35, EN 301 489, FCC Part 15 (US), EN 303 417 (WPT in 19–21 kHz, 59–61 kHz, 79–90 kHz, 100–300 kHz, 6.765–6.795 MHz bands — EU) **[VERIFY]** | Z1+Z2 |
| EM exposure | ICNIRP, IEEE C95.1, IEC 62311 / IEC 62233 (household) , EN 50364/50566 **[VERIFY]** | Z2 especially |
| Radio (BLE/Wi-Fi) | India WPC-ETA (Equipment Type Approval), CE-RED, FCC | ESP32 module (module is pre-certified; end product still needs ETA) **[VERIFY]** |
| Wired power | USB-PD / USB-IF compliance (if USB-C PD source used on RX) | RX accessory |
| Battery/laptop | IEC 62368-1 power source classifications (ES1/PS2/PS3: 100 W USB-C is typically PS3 — check) | RX accessory |
| RoHS/REACH/WEEE (India E-Waste Rules) | Environmental | Product |
| Product-liability | Thermal burn, fire-spread (V-0 materials near PCBs), glass breakage | Product |

## 6. Validation test plan

| Test | Method | Pass criterion (initial, to refine) |
|---|---|---|
| Resonance tune | VNA/LCR on coils, tune C | f₀ within ±2 % |
| Alignment sweep | XY offset ±40 mm, gap 3–10 mm | Map η & P; define operating window |
| Thermal soak | 2 h at rated power, 25 °C ambient, thermocouples + IR camera | Surface ≤ 43 °C touchable; internal parts < 85 % of rating |
| FOD (Z1) | Qi test objects per WPC FOD test (coin, foil, clip) | Module FOD trips; AURA LDC trips |
| FOD (Z2) | Coin/key/foil at coil edge and centre, under laptop RX | Detect/shutdown before object exceeds safe temp (use thermocouples on the object; ≤ 80–100 °C limit to be set by safety review) |
| Fault injection | Short/open coil, overtemp, disconnect RX, brown-out, MCU halt | Hardware latch trips; no fire/smoke; safe state |
| EMC pre-scan | Conducted + radiated | Under limit −6 dB margin |
| EM exposure | H-probe grid | < reference level with margin |
| Drop/spill (later) | IEC 60068, IP-like spill test | no hazard |
| Long-run reliability | 500 cycles of detect/charge/remove | zero unexpected states |

## 7. Proven vs. experimental (re-stated)
**Proven:** Qi2 15 W charging via certified TX, sensors, protections, USB-PD charging of laptops.
**Engineerable:** supplementary FOD via inductive sensing; Z2 20–45 W link with accessory RX.
**Experimental:** Z2 ≥ 65 W in compact unit; hidden-object FOD at laptop power; 6.78 MHz resonant version; laptop-through-chassis coupling.
