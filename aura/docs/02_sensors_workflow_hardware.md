# PROJECT AURA — Part 2: Sensor Architecture, Charging Workflow, Hardware & BOM

Prices are **rough Indian-market estimates in INR for single-unit prototype quantities** (Robu/Mouser-India/Digi-Key import, incl. approximate shipping, excl. GST/duty variance). Treat them as ±30 %. Part numbers are well-known parts, but **confirm availability, pinout and electrical limits on the datasheet before ordering [VERIFY]**.

---

## 1. Sensor architecture

| # | Sensor | Candidate part | Function | Placement | Key specs (design target) | Interface |
|---|---|---|---|---|---|---|
| 1 | **Proximity** | VL53L1X ToF (×2) or VCNL4040 | Wake-up: "something approaches Z1/Z2"; also gives hover height | One under the glass edge of each zone, facing up through an IR-transparent window | Range 4–400 cm (VL53L1X, short mode ≈ 1.3 m); trigger < 10 cm | I²C (XSHUT per device to assign addresses, or TCA9548A mux) |
| 2 | **Hall-effect** | DRV5055 (analog, ratiometric) ×4 around Z1 coil, or digital latch DRV5032 | Detect Qi2 magnet ring ⇒ confirms *Qi2 phone, aligned*; ring field is strong, use low-sensitivity variant | 4 sensors at 90° on Ø ~50 mm circle, just outside the TX coil, ~2 mm below glass | Sense ±21 mT or ±42 mT range variants **[VERIFY]**; compare 4 readings → alignment error vector | ADC (ESP32-S3 ADC1) or I²C via ADS1115 |
| 3 | **Temperature (contact)** | 10 kΩ NTC B3950 ×6 | TX coil, FET bank, rectifier area, heatsink, inlet air, board | Z1 coil back, Z2 coil back (×2), inverter FETs, DC-DC inductor, air outlet | −10…+125 °C, ±1 °C after calibration; trip at 75 °C hot-spot, derate at 60 °C | ADC via divider (or ADS1115) |
| 4 | **Foreign-object detection (FOD)** | **Layer 1:** TX controller's built-in power-loss/Q-factor FOD (Qi2 module). **Layer 2:** TI LDC1612 inductance-to-digital + 4 small PCB sense coils around Z2 perimeter. **Layer 3:** loss accounting (P_in − P_rx_reported). | Detect metal objects (coins, keys, foil, cards with antennas) before/during power transfer | Z1: inside module. Z2: sense coils in 2×2 grid under glass, between TX coil and glass | Layer 2 detects change in sense-coil frequency/Q; calibrate with empty pad baseline. Layer 3 trip when loss > ~10–15 % of P_in or > fixed W threshold | I²C (LDC1612) / BLE telemetry + INA226 |
| 5 | **Weight / pressure** | 4× 50 kg half-bridge load cells + HX711 (Z2), 1× small FSR or 1 kg load cell (Z1) | Confirm placement; classify: phone ≈ 120–250 g, laptop ≈ 1–3 kg; detect removal | Z2: four corners under the glass carrier plate; Z1: under puck | Resolution ~1 g (HX711, filtered); sanity range checks | HX711 (2-wire) ×2 |
| 6 | **Voltage & current** | INA226 (×3) with shunt (5 mΩ / 10 mΩ) | Input power; Z1 supply power; Z2 DC-link power; gives P_in for efficiency | High-side of 20 V input; Z1 branch; Z2 DC-link before inverter | 36 V bus max, 16-bit; shunt chosen for ≤ 75 mV at max current | I²C, addresses via A0/A1 pins |
| 7 | **Infrared thermopile** | MLX90614 (BAA/DCI variants vary in FOV) ×2 | Non-contact **surface** temperature of the *device on the pad* and of the glass | Mounted under tiny IR-transparent windows (silicon/germanium or sapphire — plain glass blocks LWIR) | −70…+380 °C object range; ±0.5–1 °C typical **[VERIFY]**; FOV 35–90° → choose variant | I²C/SMBus |

Notes
- **Glass blocks long-wave IR.** Thermopiles can't see *through* the glass top. Use a small silicon or chalcogenide window flush with the glass, or place the sensor facing the glass bottom surface and treat it as a *glass temperature* sensor (practical choice for the prototype).
- Metal parts and magnets near the Hall array shift readings: calibrate with the TX coil on and off.
- The sensor number 4 layering is intentional: **only Layer 1 is certified-grade**; Layers 2–3 are additive and *must never be the sole FOD for Z1*.

### I²C bus plan (ESP32-S3)
```
I2C0 (400 kHz, GPIO8 SDA / GPIO9 SCL)
 ├─ INA226 #1  0x40  (input)
 ├─ INA226 #2  0x41  (Z1)
 ├─ INA226 #3  0x44  (Z2 DC-link)
 ├─ LDC1612    0x2A
 ├─ MLX90614   0x5A (one) – second: reprogram address or use TCA9548A
 ├─ ADS1115    0x48  (NTC ×4 + Hall ×4 on two chips if needed)
 └─ TCA9548A   0x70  → VL53L1X ×2, MLX90614 #2
I2C1: STUSB4500 (PD sink) + OLED (optional service display)
```

---

## 2. Automatic charging workflow (state sequence)

| Step | Event | System action | Sensors involved | Failure handling |
|---|---|---|---|---|
| 1 | Device approaches surface | Wake from sleep (≈ <100 µA idle target for sensors via duty-cycled ToF; MCU light sleep) | Proximity | — |
| 2 | Proximity trigger (<10 cm, rising) | Enter `DETECT`; LED "breathing" cue | Proximity, weight | Timeout 10 s → `IDLE` |
| 3 | Zone resolved and alignment checked | Zone from which proximity fired + weight window + Hall signature (Z1) or RX BLE advert (Z2) | Weight, Hall, BLE | Misaligned → LED amber, app tip, retry |
| 4 | TX↔RX handshake | Z1: Qi2 module handles Ping/ID/Config; AURA enables 5 V/20 V rail & reads status pin. Z2: BLE connect + authenticate RX accessory; read RX capability (max PDO, coil data) | Module status, BLE | No handshake in 5 s → `FAULT_NO_RX`, rail off |
| 5 | Power-level negotiation | Z1: module negotiates (≤15 W). Z2: RX reports PD contract (e.g. 20 V/3.25 A = 65 W, or 15 V/3 A = 45 W); controller caps by thermal budget and input adapter | INA226 input | Limit to lowest safe tier |
| 6 | Charging begins | Soft-start ramp of DC-link; LED ring progress animation | INA226, BLE | Ramp abort on any trip |
| 7 | Continuous monitoring (10 ms loops for electrical, 100 ms for temps, 250 ms for weight) | Compute P_in, P_rx, loss, efficiency; derate on temp | All | See step 8 |
| 8 | Fault / protection | Soft: derate or pause, then retry. Hard: latch off, require device removal | Temp, FOD, I, V, weight change | Section 5 of `04_firmware.md` |
| 9 | Completion | Z1: Qi "EPT-charge-complete" or I<threshold. Z2: RX reports charge current < ~5 % of contract for 3 min | INA226, BLE | LED solid green fade; trickle-off; app notification |

State machine diagram → `04_firmware.md`.

---

## 3. Hardware architecture

### 3.1 Power tree
```
USB-C PD adapter 20 V/5 A (external, safety-certified)
 └ PD sink (STUSB4500/CH224K-class) ── negotiates 20 V ── VIN 20 V
     ├ Input protection: eFuse (TPS25947 / TPS2663 class) 6 A limit, TVS SMDJ24A (clamp), reverse-polarity FET
     ├ 5 V buck 3 A (TPS62933 / LMR33630 class) → LEDs (WS2812), fan 5 V, USB-C service port
     │    └ 3.3 V LDO / buck (AP7361 / TPS62A02) → ESP32-S3, sensors
     ├ Z1 load switch (20 V → Qi2 TX module; module has its own converter) – 2 A
     └ Z2 chain: buck-boost 4-switch (e.g. LM5176 / TPS55288-class controller; 20 V in, 8–24 V out, ≤ 5 A) → full-bridge inverter → TX coil
```
**Why a variable DC-link?** Power into a series-series link is set mainly by DC-link voltage at fixed frequency near resonance; this keeps the switching at an efficient point (ZVS) and gives smooth control from the RX-reported error. Alternative: fixed 20 V + phase-shift/frequency control. Both are viable; DC-link control is simpler to protect and to test.

### 3.2 Z2 power electronics
| Block | Design target |
|---|---|
| Inverter | Full-bridge, 4 × MOSFET (60 V, ≤ 10 mΩ) or GaN (EPC, 100 V) + isolated or high-speed bootstrap gate driver; 100–140 kHz (inductive-WPT range; confirm the emission band is permitted/compatible with nearby Qi devices in your market **[VERIFY]**) |
| Compensation | Series-series: C_tx, C_rx chosen for f₀ = 1/(2π√(LC)); film/C0G capacitors rated for ≥ 3× expected V_C. Example: L=24 µH, f₀ = 110 kHz ⇒ C ≈ 87 nF (compute precisely after measuring L) |
| TX coil | Litz (e.g., 0.1 mm × 200+ strands) spiral Ø ~160–200 mm, ferrite (e.g., PC95/N87 tile array) back plate; measure L, R_ac, Q on LCR meter/VNA |
| RX coil | Similar Ø 150–180 mm in accessory; ferrite backing; shielded from laptop chassis by ferrite + thin Al spacer layer design **[EXPERIMENTAL]** |
| RX rectifier | Schottky or synchronous (SiC/Schottky for prototype), then buck to PD source IC (e.g., TPS25750/ STUSB-source class, or "buck + CH-series PD source") **[VERIFY part for source role]** |
| Telemetry | RX ESP32-C3 + INA226: BLE notifications Vout, Iout, T_rx, PD contract |

### 3.3 Cooling
- Under-glass **aluminium spreader** (2–3 mm) bonded with thermal pad to the inverter FETs and DC-DC.
- One **40×40×10 mm 5 V blower or 60 mm 12 V fan** (PWM, tach) pulling from bottom-front vents and exhausting rear. Fan curve: 0 % < 45 °C, linear to 100 % at 65 °C.
- Ferrite is a thermal insulator and brittle — don't clamp hard; use compliant pad.

### 3.4 Protection circuits
| Hazard | Hardware | Firmware |
|---|---|---|
| Input overvoltage | TVS, eFuse OVP (≈ 24 V), PD sink negotiated ≤ 20 V | check VIN window |
| Overcurrent | eFuse limit, INA226 alert pin → hardware latch, per-FET desat/gate-driver UVLO | soft limit < hard limit |
| Short circuit on coil | Gate-driver fault + eFuse | detect via I spike |
| Overtemperature | Comparator on NTC (hardware trip ≈ 80 °C) → latch disables inverter via driver EN | derate 60 °C, stop 70–75 °C |
| Coil open/mistuned | Current-sense, ZVS check | detect abnormal V/I phase |
| FOD | Module FOD + LDC1612 + loss accounting | latch off + require removal |
| Reverse polarity | P-FET ideal diode on input | — |
| ESD | TVS arrays on all exposed I²C/USB lines | — |
| Watchdog | Hardware WDT, brown-out | safe-state on reset: all rails OFF by default (pull-downs on EN pins) |
| Isolation | The system runs on an *external certified isolated adapter* (SELV output). RX side is also SELV. No mains inside the hub in v1 — drastically simplifies LVD/BIS certification. | — |

---

## 4. Component selection table & BOM (hub electronics)

| # | Component | Purpose | Recommended specification | Qty | Est. cost (₹) |
|---|---|---|---|---|---|
| 1 | ESP32-S3-DevKitC-1 (N16R8) | Main controller | Dual-core 240 MHz, Wi-Fi/BLE5, 16 MB flash | 1 | 900–1,300 |
| 2 | Qi2 15 W TX module / certified Qi2 pad (prototype) | Z1 transmitter | Qi2 MPP, 15 W, with FOD & magnet ring; or *reuse* a certified Qi2 charger's PCB+coil **[VERIFY availability of bare modules]** | 1 | 1,800–3,500 |
| 3 | Qi2 phone for testing | Z1 receiver | Any Qi2-certified phone/case with MagSafe-style ring | 1 | (user's) |
| 4 | USB-PD 100 W adapter (20 V/5 A) + 5 A e-marked cable | Input | Safety-certified (BIS/IS 13252 or equivalent) | 1 | 3,000–4,500 |
| 5 | PD sink board (STUSB4500 or CH224K) | PD negotiation | 20 V fixed request | 1 | 300–700 |
| 6 | eFuse + TVS + reverse FET | Input protection | 6 A limit, 24 V OVP | 1 set | 500–900 |
| 7 | Buck 20→5 V, 3 A | Logic/LED/fan | ≥ 92 % eff., 3 A | 1 | 250–500 |
| 8 | 3.3 V regulator | MCU/sensors | 1 A | 1 | 100 |
| 9 | 4-switch buck-boost module/controller (Z2 DC-link) | Variable 8–24 V up to 5 A | ≥ 95 % eff., programmable current limit; e.g., TPS55288-based board for ≤ 3 A prototypes or LM5176 eval for higher **[VERIFY ratings]** | 1 | 2,500–6,000 |
| 10 | Full-bridge inverter board | Z2 TX drive | 4× 60–100 V MOSFET/GaN, driver (e.g. UCC27211/LMG-class), dead-time ≥ 100 ns, 100–140 kHz | 1 | 2,500–5,000 |
| 11 | Litz wire + ferrite tiles + coil former | Z2 TX coil | Litz 0.1 mm × 200–400; ferrite PC95/N87; Ø 160–200 mm | 1 set | 3,000–6,000 |
| 12 | Resonant capacitors | Z2 compensation | C0G/NP0 or film (e.g., Wima MKP), ≥ 630 V DC, parallel banks | 10–20 | 800–1,500 |
| 13 | Laptop RX coil kit + rectifier + buck + PD source | RX accessory | Same coil construction; 65 W-class PD source with 20 V/3.25 A **[VERIFY]** | 1 | 5,000–9,000 |
| 14 | ESP32-C3 module (RX telemetry) | BLE | — | 1 | 400 |
| 15 | VL53L1X breakout | Proximity | I²C, ≤ 4 m | 2 | 1,200–2,000 |
| 16 | DRV5055 (or equivalent analog Hall) | Magnet alignment | 3.3 V ratiometric, 4 pcs | 4 | 400–800 |
| 17 | NTC 10 kΩ B3950 probes/chips | Temperature | 6 pcs | 6 | 150–300 |
| 18 | MLX90614 | IR surface temp | 90° or 35° FOV | 2 | 1,800–3,000 |
| 19 | LDC1612 module + PCB sense coils | Metal/FOD | 2-ch (use 2 modules for 4 coils) **[VERIFY channel count]** | 2 | 1,500–3,000 |
| 20 | Load cells 50 kg ×4 + HX711 ×2 | Weight | Half-bridge, combined | 1 set | 600–900 |
| 21 | INA226 breakout | V/I | 36 V, 16-bit | 3 | 500–900 |
| 22 | ADS1115 | Extra ADC | 16-bit | 1–2 | 400–800 |
| 23 | TCA9548A | I²C mux | — | 1 | 200 |
| 24 | SK6812/WS2812 ring (≈ 24 LED) + light bar | Status | 5 V, diffused | 1 | 500–900 |
| 25 | Blower/fan 5/12 V PWM | Cooling | ≥ 8 CFM, tach | 1 | 400–800 |
| 26 | Comparators + latch (e.g., TLV3202 + 74LVC1G74) | Hardware trip | OTP/OCP latch | 1 set | 300–600 |
| 27 | Misc: PCBs (4-layer), connectors, wire, thermal pads, screws | — | — | — | 3,000–6,000 |
| | **Electronics subtotal (all of Prototype 3 incl. Z2)** | | | | **≈ ₹ 33,000 – 60,000** |

Enclosure (CNC aluminium + tempered glass) is **not** in this BOM — see `03_industrial_design.md`.

### Block diagram of signal connections
```
 ESP32-S3
  ├ GPIO: Z1_EN, Z2_EN, INV_EN(→ gate driver EN via AND with hw-latch), FAN_PWM, FAN_TACH, LED_DATA, HW_FAULT_IN, HW_RESET_OUT
  ├ I2C0: INA226×3, LDC1612×2, ADS1115, TCA9548A(→VL53L1X×2, MLX90614×2)
  ├ GPIO bit-bang: HX711 DT/SCK ×2
  ├ ADC: spare NTC/Hall
  └ BLE/Wi-Fi: app, RX accessory link
 Hardware safety: NTC comparators + INA226 ALERT + eFuse PG → SR latch → forces INV_EN low and Z-switches off regardless of MCU
```
