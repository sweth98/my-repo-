# PROJECT AURA — Part 7: Future Opportunities & Dossier Index

## Future development
1. **Standards track:** monitor WPC / AirFuel / USB-IF for any laptop-class wireless profile; design RX accessory comms to be replaced by standard in-band signalling.
2. **6.78 MHz resonant research track:** class-E/EF amplifier, larger z-gap tolerance, multi-device; requires RF compliance.
3. **Multi-coil / moving-field TX array** for free positioning (reduces alignment sensitivity; improves FOD localisation).
4. **Thermal imaging FOD:** AMG8833 / MLX90640 thermal array over zone for rise-rate detection.
5. **GaN power stage** to raise efficiency and shrink thermals.
6. **Laptop OEM co-design:** RX coil inside chassis bottom with ferrite shield (only possible with OEM).
7. **Secure OTA, device identity, usage analytics, energy dashboards.**
8. **Smart charging profiles:** schedule, battery-health caps (80 %), tied to the laptop's PD/OS.
9. **Wearables/earbud third zone**.

## Dossier index
| # | Deliverable | File |
|---|---|---|
| 1 | Product concept & vision | `01` §1 |
| 2 | Technical feasibility study | `01` §3 |
| 3 | Industrial design drawings (schematic ASCII) | `03` |
| 4 | Electronics block diagram | `01` §2, `02` §3 |
| 5 | Sensor architecture | `02` §1 |
| 6 | Power transmission architecture | `01` §3, `02` §3.2, `03` §7 |
| 7 | Component list & BOM | `02` §4 |
| 8 | Circuit diagrams | block-level only (`02`, `06`); schematic capture (KiCad) not yet done |
| 9 | Firmware architecture & code | `04`, `firmware/` |
| 10 | Prototype assembly guide | `06` |
| 11 | Safety & validation plan | `05` |
| 12 | Future opportunities | this file |

## What is NOT done yet (honest status)
- No KiCad schematics/PCB, no CAD/STEP, no photoreal render, no 3D visualisation.
- Firmware core is unit-tested on a PC; ESP32 HAL is an uncompiled skeleton; ToF/Hall/LDC/BLE/LED drivers are TODO.
- No coil design calculations (L, k, Q) — need measurement/simulation (e.g., FEMM/Ansys/COMSOL).
- All performance numbers are design targets or first-principles estimates, not measurements.
- All prices and many part numbers are **[VERIFY]**.
