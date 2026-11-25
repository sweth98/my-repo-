// AURA hub - ESP32-S3 (Arduino-ESP32 core) HAL + scheduler.
// STATUS: UNVERIFIED SKELETON. Not compiled for ESP32 or run on hardware in this repo.
// The portable logic in ../core was compiled and unit-tested on a PC.
// Pin numbers, I2C addresses and scale factors are placeholders: check your board & datasheets.
#include <Arduino.h>
#include <Wire.h>
#include <NimBLEDevice.h>          // optional BLE (NimBLE-Arduino)
#include <esp_task_wdt.h>
#include "../core/aura_core.h"
#include "../core/aura_core.cpp"   // single-translation-unit build for Arduino IDE simplicity

using namespace aura;

// ---------------- pins (placeholders) ----------------
constexpr int PIN_Z1_EN = 4, PIN_Z2_EN = 5, PIN_INV_EN = 6;
constexpr int PIN_FAN_PWM = 7, PIN_HW_FAULT = 10, PIN_HW_RESET = 11;
constexpr int PIN_NTC_COIL = 1, PIN_NTC_FET = 2;
constexpr int PIN_HX_DT = 12, PIN_HX_SCK = 13;

// ---------------- INA226 (register-level) ----------------
// Cal = 0.00512 / (Current_LSB * Rshunt); Current_LSB = Imax/32768. Bus LSB 1.25 mV, shunt LSB 2.5 uV.
struct INA226 {
  uint8_t addr; float currentLsb;
  bool begin(float rShunt, float iMax) {
    currentLsb = iMax / 32768.0f;
    uint16_t cal = (uint16_t)(0.00512f / (currentLsb * rShunt));
    return write16(0x05, cal);
  }
  bool write16(uint8_t reg, uint16_t v) {
    Wire.beginTransmission(addr); Wire.write(reg); Wire.write(v >> 8); Wire.write(v & 0xFF);
    return Wire.endTransmission() == 0;
  }
  bool read16(uint8_t reg, int16_t &out) {
    Wire.beginTransmission(addr); Wire.write(reg);
    if (Wire.endTransmission(false) != 0) return false;
    if (Wire.requestFrom((int)addr, 2) != 2) return false;
    out = (Wire.read() << 8) | Wire.read(); return true;
  }
  bool readVA(float &v, float &a) {
    int16_t bus, cur;
    if (!read16(0x02, bus) || !read16(0x04, cur)) return false;
    v = bus * 0.00125f; a = cur * currentLsb; return true;
  }
};
INA226 inaIn{0x40}, inaZ1{0x41}, inaZ2{0x44};

// ---------------- NTC (10k, B=3950, divider to 3.3 V, 10k fixed) ----------------
float readNtcC(int pin) {
  int raw = analogRead(pin);                 // 12-bit
  if (raw <= 10 || raw >= 4085) return NAN;  // open/short => invalid -> SensorFail
  float r = 10000.0f * raw / (4095.0f - raw);
  float tK = 1.0f / (1.0f / 298.15f + log(r / 10000.0f) / 3950.0f);
  return tK - 273.15f;
}

// ---------------- MLX90614 (SMBus read of object temp reg 0x07) ----------------
bool readMlxObjC(uint8_t addr, float &c) {
  Wire.beginTransmission(addr); Wire.write(0x07);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((int)addr, 3) != 3) return false;      // LSB, MSB, PEC (PEC ignored here)
  uint16_t raw = Wire.read(); raw |= (uint16_t)Wire.read() << 8; Wire.read();
  if (raw & 0x8000) return false;                              // error flag
  c = raw * 0.02f - 273.15f; return true;
}

// ---------------- HX711 (24-bit, channel A gain 128) ----------------
bool hxReady() { return digitalRead(PIN_HX_DT) == LOW; }
long hxRead() {
  long v = 0;
  for (int i = 0; i < 24; i++) { digitalWrite(PIN_HX_SCK, HIGH); delayMicroseconds(1);
    v = (v << 1) | digitalRead(PIN_HX_DT); digitalWrite(PIN_HX_SCK, LOW); delayMicroseconds(1); }
  digitalWrite(PIN_HX_SCK, HIGH); delayMicroseconds(1); digitalWrite(PIN_HX_SCK, LOW);
  if (v & 0x800000) v |= 0xFF000000;  // sign extend
  return v;
}
float hxTare = 0, hxGramsPerCount = 0.0005f;   // calibrate with known masses

// ---------------- sensor snapshot assembly ----------------
Inputs readZone1() {
  Inputs in{}; in.sensorsOk = true;
  float v, a;
  if (inaZ1.readVA(v, a)) { in.vinV = v; in.pinW = v * a; } else in.sensorsOk = false;
  in.coilTempC = readNtcC(PIN_NTC_COIL); in.fetTempC = readNtcC(PIN_NTC_FET);
  if (isnan(in.coilTempC) || isnan(in.fetTempC)) { in.sensorsOk = false; in.coilTempC = in.fetTempC = 99; }
  float ir; in.surfaceTempC = readMlxObjC(0x5A, ir) ? ir : 25.0f;
  if (hxReady()) in.weightG = (hxRead() - hxTare) * hxGramsPerCount;
  // TODO: ToF proxCm, Hall magnetDetected/alignErrMm, Qi module status pins, LDC1612 metalSenseDelta.
  in.hwLatchTripped = digitalRead(PIN_HW_FAULT) == HIGH;
  return in;
}

// ---------------- actuators ----------------
void applyOutputs(const Outputs &o, int enPin) {
  digitalWrite(enPin, o.txEnable ? HIGH : LOW);
  ledcWrite(PIN_FAN_PWM, (uint32_t)(o.fanDuty * 255));
  // TODO: LED driver (FastLED/NeoPixel) from o.led; publish o.fault over BLE/MQTT.
}

ZoneController phoneZone(Zone::Phone, Limits{});
uint32_t tLast = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_Z1_EN, OUTPUT); pinMode(PIN_Z2_EN, OUTPUT); pinMode(PIN_INV_EN, OUTPUT);
  digitalWrite(PIN_Z1_EN, LOW); digitalWrite(PIN_Z2_EN, LOW); digitalWrite(PIN_INV_EN, LOW); // safe default OFF
  pinMode(PIN_HW_FAULT, INPUT_PULLDOWN); pinMode(PIN_HX_DT, INPUT); pinMode(PIN_HX_SCK, OUTPUT);
  analogReadResolution(12);
  ledcAttach(PIN_FAN_PWM, 25000, 8);
  Wire.begin(8, 9, 400000);
  inaIn.begin(0.005f, 6.0f); inaZ1.begin(0.010f, 3.0f); inaZ2.begin(0.005f, 6.0f);
  esp_task_wdt_deinit();  // re-init with explicit timeout below
  const esp_task_wdt_config_t cfg = {.timeout_ms = 2000, .idle_core_mask = 0, .trigger_panic = true};
  esp_task_wdt_init(&cfg); esp_task_wdt_add(NULL);
}

void loop() {
  esp_task_wdt_reset();
  uint32_t now = millis();
  if (now - tLast >= 20) {                 // 50 Hz control tick
    tLast = now;
    Inputs in = readZone1();
    Outputs o = phoneZone.step(in, now);
    applyOutputs(o, PIN_Z1_EN);
    if (o.fault != Fault::None) Serial.printf("FAULT %u\n", (unsigned)o.fault);
  }
}
