# PROJECT AURA — Part 3: Industrial Design

**Concept:** a single slab of anodised aluminium with a flush, dark-tinted tempered-glass top. Two zones are revealed only by light. Overall envelope (design target, subject to coil/thermal validation): **360 W × 240 D × 24 H mm**, weight ≈ 2.2 kg (needs rubber feet; laptop on top adds load).

Materials: 6063/6061 aluminium body (bead-blast + clear/anodise, e.g. space-grey), 4 mm chemically-strengthened glass top with 2nd-surface ceramic frit (dark smoke) and a laser-etched zone outline invisible when off, silicone feet, rear cable recess (power only, at the **back**, not on the user-facing surface).

Zone geometry: Z1 puck Ø 70 mm (left-front); Z2 laptop area 220 × 190 mm (right/centre) with Ø ~170 mm TX coil; ≈ 6 mm design air-gap + glass 4 mm. **A laptop's own bottom case + feet add 3–10 mm** — the TX-RX gap budget is the defining design number.

> The drawings below are **dimensioned schematics (ASCII)** to fix the layout logic, not manufacturing drawings. Proper CAD (STEP/DXF) and a rendered visualisation are the next step (see end).

## 1. Top view (not to scale)
```
 360 mm
 ┌────────────────────────────────────────────────────────────────────┐
 │  ◜◝  LED light-bar (status, 1 mm slit, rear-lit)   ───────────     │
 │ ┌───────┐                    ┌────────────────────────────────┐    │
 │ │       │                    │                                │    │
 │ │  Z1   │                    │             Z2                 │    │ 240 mm
 │ │ Ø70   │  ○ ToF window      │     laptop zone 220 x 190      │    │
 │ │ ring  │                    │        (Ø170 TX coil)          │    │
 │ └───────┘                    │                                │    │
 │  ○ prox. window Z1           └────────────────────────────────┘    │
 │          ░░ vent slots (rear edge, underside) ░░░░░░░░░░░░░░░░░    │
 └────────────────────────────────────────────────────────────────────┘
                 rear: [DC-in USB-C PD recess]  [service port]
```

## 2. Front elevation
```
        ┌──────────────────────────────────────────────┐  ← 4 mm glass (flush)
 ───────┴──────────────────────────────────────────────┴─────  24 mm
        │ anodised aluminium body, 1.5 mm chamfer      │
        │  ▁▁ LED slit (front-lower edge, 1 mm)        │
 ───────└▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔┘
          ▪ silicone foot            ▪ silicone foot
```

## 3. Side elevation (section through Z2)
```
 glass 4 mm  ═════════════════════════════════════════
 air/spacer 2 mm (sense coils LDC PCB, 1.2 mm)
 TX coil litz spiral ≈ 3 mm  ┃▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒┃
 ferrite plate 2-3 mm        ┃████████████████████████┃
 thermal pad + Al spreader 3 mm  (heat → body & fan)
 power PCB (inverter, buck-boost, MCU)  ▭▭▭▭  cavity ≈ 8 mm
 base plate / blower inlet slots  ─────────────────────
 height ≈ 24 mm
```

## 4. Exploded assembly (bottom → top)
```
 7  Glass top (4 mm) + frit + IR window insert
 6  LED light guide + diffuser film
 5  Sensor/FOD PCB (LDC1612 coils ×4, Hall ×4, ToF ×2, NTC)
 4  Z1 Qi2 module (coil + magnets ring)      Z2 TX coil + ferrite plate
 3  Aluminium spreader plate (thermal bridge) + load-cell carrier
 2  Main PCB stack: ESP32-S3, inverter, buck-boost, protection
 1  Aluminium base with blower + rear exhaust + silicone feet
    ── M2.5/M3 screws, thermal pads, gasket (optional IP-rated seal for spills) ──
```

## 5. Internal component layout (plan, glass removed)
```
 ┌────────────────────────────────────────────────────────────────┐
 │ [Z1 Qi2 module]      [LDC sense PCB]   (Z2 TX coil Ø170 + ferrite)│
 │   Hall×4 ring            ◦  ◦                ╭──────────╮        │
 │   ToF-1                ◦  ◦  ◦  ◦            │  spiral  │  ToF-2 │
 │                                              ╰──────────╯        │
 │ [LED ctrl]  [MCU board]  [Inverter+driver]  [Buck-boost]  [Fan]  │
 │ [HW safety latch]     [PD sink + eFuse]                [INA226s] │
 │ ▲ load cells at 4 corners under Z2 carrier plate                  │
 └────────────────────────────────────────────────────────────────┘
```

## 6. Sensor placement
```
          Z1 (Ø70)                         Z2 (220×190)
         ┌────────┐                   ┌──────────────────────┐
     H1  │   ◎    │ H3          LDC1 ◇│                      │◇ LDC2
         │ coil   │                   │       TX coil        │
     H2  │ + NTC  │ H4                │     NTC×2   MLX90614 │
         └────────┘                   │ ◇LDC3                │◇ LDC4
   ToF-1 ●  IR-1 ○            Load cells ▣ at four corners; ToF-2 ● front edge
 H=Hall   ◇=metal-sense coil   ●=proximity   ○=IR thermopile   ▣=load cell
```

## 7. Wireless power transmission diagram
```
 Z1:  20V ─▶ [Qi2 TX controller + inverter] ─▶ TX coil ≈≈ magnetic field ≈≈ RX coil (phone) ─▶ rectifier ─▶ battery
                 ▲ in-band comms (ASK/FSK, Qi) ◀────────────────────────────────────────────┘
 Z2:  20V ─▶ [buck-boost DC-link] ─▶ [full-bridge] ─▶ C_tx + L_tx ≈≈ L_rx + C_rx ─▶ rectifier ─▶ buck/PD source ─▶ USB-C ─▶ laptop
                 ▲ BLE control (RX Vout/Iout/T) ◀──────────────────────────────────┘
```

## 8. LED language
| State | Pattern |
|---|---|
| Idle | off (or ≤ 5 % white breathe on proximity) |
| Detected / aligning | soft white breathe; amber if misaligned |
| Handshake | white pulse |
| Charging | blue progress arc proportional to estimated SoC (or power) |
| Complete | steady green fade |
| Fault | red slow-blink; app shows reason; foreign object = red + zone outline |

## 9. Design risks
- Glass + aluminium is a **bad combination near coils** — metal near the TX coil creates loss. Keep ≥ 10–15 mm clearance from the coil edge to aluminium walls, or use non-metallic (plastic/ceramic) material inside the coil footprint; the aluminium frame sits *outside* the coil radius, and the aluminium spreader sits *behind the ferrite*. **Validate with field simulation or measurement before cutting metal.**
- Thermal: see `01` §3.4. Quiet fan + vents slightly conflict with a "sealed minimalist" look; accept rear vents.

## 10. Next design deliverables (not yet produced)
CAD in Fusion/SolidWorks → STEP; rendered visualisations (Blender/KeyShot); a quick interactive 3D model can be made with the Three.js viewer tool on request.
