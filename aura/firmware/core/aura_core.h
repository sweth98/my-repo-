// AURA core logic: hardware-independent, so it can be unit-tested on a PC.
#pragma once
#include <stdint.h>

namespace aura {

enum class Zone : uint8_t { None = 0, Phone = 1, Laptop = 2 };

enum class State : uint8_t {
  Idle, Detect, AlignCheck, Handshake, Negotiate, Charging, Paused, Complete, Fault
};

enum class Fault : uint8_t {
  None = 0, OverTemp, OverCurrent, OverVoltage, UnderVoltage, ForeignObject,
  NoReceiver, Misaligned, DeviceRemoved, SensorFail, LowEfficiency, WeightMismatch
};

enum class Led : uint8_t { Off, Breathe, Amber, Pulse, Progress, Green, Red };

// One consistent snapshot of all inputs for a single zone. HAL fills this.
struct Inputs {
  // presence
  float    proxCm;            // ToF distance, < 0 = sensor invalid
  float    weightG;           // load-cell reading, grams
  // alignment
  bool     magnetDetected;    // Hall ring signature (phone zone)
  float    alignErrMm;        // estimated lateral offset
  bool     rxLinked;          // Qi handshake done / BLE RX accessory linked
  // electrical
  float    vinV, pinW;        // power into zone
  float    prxW;              // power reported by receiver (0 if unknown)
  float    rxCurrentA;        // receiver load current (charge-complete detection)
  float    rxContractW;       // power the receiver asks for
  // thermal
  float    coilTempC, fetTempC, surfaceTempC;
  // foreign objects
  bool     fodHw;             // TX controller FOD flag
  float    metalSenseDelta;   // LDC1612 deviation vs baseline (arb. units)
  bool     hwLatchTripped;    // independent hardware safety latch
  bool     sensorsOk;
};

struct Limits {
  float proxTriggerCm   = 10.0f;
  float tempDerateC     = 60.0f;
  float tempStopC       = 72.0f;
  float surfaceStopC    = 45.0f;    // device/glass surface
  float vinMin = 17.0f, vinMax = 22.0f;
  float maxPowerW       = 15.0f;    // zone cap (Z1 15, Z2 45 initially)
  float maxLossFrac     = 0.30f;    // (Pin-Prx)/Pin abort threshold
  float minLossCheckW   = 5.0f;     // don't judge efficiency at tiny power
  float metalTrip       = 50.0f;
  float weightMinG      = 80.0f, weightMaxG = 400.0f;   // per-zone window
  float maxAlignErrMm   = 8.0f;
  float completeAmpsA   = 0.15f;    // RX current below this => complete
  uint32_t detectTimeoutMs    = 10000;
  uint32_t handshakeTimeoutMs = 5000;
  uint32_t completeHoldMs     = 180000;
  uint32_t pauseMaxMs         = 60000;
  uint32_t lossHoldMs         = 2000;   // loss must persist before trip
};

struct Outputs {
  bool   txEnable = false;
  float  powerLimitW = 0.0f;
  float  fanDuty = 0.0f;          // 0..1
  Led    led = Led::Off;
  Fault  fault = Fault::None;
};

class ZoneController {
 public:
  explicit ZoneController(Zone z, const Limits& l) : zone_(z), lim_(l) {}
  // Call every control tick (e.g. every 10-50 ms) with monotonic millis.
  Outputs step(const Inputs& in, uint32_t nowMs);
  State state() const { return state_; }
  Fault lastFault() const { return fault_; }
  void  clearFault(const Inputs& in);   // only succeeds if device removed

 private:
  void enter(State s, uint32_t now) { state_ = s; tEnter_ = now; }
  Fault checkHard(const Inputs& in) const;
  bool  present(const Inputs& in) const;
  float derate(const Inputs& in) const;

  Zone zone_;
  Limits lim_;
  State state_ = State::Idle;
  Fault fault_ = Fault::None;
  uint32_t tEnter_ = 0;
  uint32_t tLossStart_ = 0;
  uint32_t tCompleteStart_ = 0;
  bool lossActive_ = false, completeActive_ = false;
};

}  // namespace aura
