#include "../core/aura_core.h"
#include <cstdio>
#include <cstdlib>
using namespace aura;

static int fails = 0;
#define CHECK(c) do{ if(!(c)){ printf("FAIL line %d: %s\n", __LINE__, #c); fails++; } }while(0)

static Inputs idleIn() {
  Inputs i{};
  i.proxCm = 100; i.weightG = 0; i.vinV = 20; i.sensorsOk = true;
  i.coilTempC = i.fetTempC = i.surfaceTempC = 30;
  return i;
}
static Inputs phoneOn() {
  Inputs i = idleIn();
  i.proxCm = 2; i.weightG = 200; i.magnetDetected = true; i.alignErrMm = 1;
  i.rxLinked = true; i.rxContractW = 15; i.pinW = 15; i.prxW = 12; i.rxCurrentA = 1.0f;
  return i;
}
// drive to Charging
static uint32_t toCharging(ZoneController& z, Inputs& in) {
  uint32_t t = 0;
  for (int k = 0; k < 10; k++) { z.step(in, t); t += 100; }
  return t;
}

int main() {
  Limits L;
  { // happy path -> Charging
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn();
    toCharging(z, in);
    CHECK(z.state() == State::Charging);
    Outputs o = z.step(in, 2000);
    CHECK(o.txEnable && o.powerLimitW > 14.9f);
  }
  { // wrong weight in phone zone (laptop on phone pad)
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn(); in.weightG = 1800;
    uint32_t t = 0; for (int k = 0; k < 40; k++) { z.step(in, t); t += 100; }
    CHECK(z.state() == State::Fault && z.lastFault() == Fault::WeightMismatch);
  }
  { // no magnet => misaligned/not Qi2 -> fault after timeout
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn(); in.magnetDetected = false;
    uint32_t t = 0; for (int k = 0; k < 150; k++) { z.step(in, t); t += 100; }
    CHECK(z.state() == State::Fault && z.lastFault() == Fault::Misaligned);
  }
  { // no receiver -> NoReceiver fault, TX off
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn(); in.rxLinked = false;
    uint32_t t = 0; Outputs o{}; for (int k = 0; k < 100; k++) { o = z.step(in, t); t += 100; }
    CHECK(z.state() == State::Fault && z.lastFault() == Fault::NoReceiver && !o.txEnable);
  }
  { // overtemperature trips immediately and latches
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn(); uint32_t t = toCharging(z, in);
    in.coilTempC = 75; Outputs o = z.step(in, t);
    CHECK(z.state() == State::Fault && o.fault == Fault::OverTemp && !o.txEnable);
    in.coilTempC = 30; z.step(in, t + 100);
    CHECK(z.state() == State::Fault);                // still latched, device still present
    in.weightG = 0; in.proxCm = 100; z.clearFault(in); z.step(in, t + 200);
    CHECK(z.state() == State::Idle);                 // cleared after removal
  }
  { // derating between 60 and 72 C
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn(); uint32_t t = toCharging(z, in);
    in.coilTempC = 66; Outputs o = z.step(in, t);
    CHECK(o.powerLimitW > 6.9f && o.powerLimitW < 7.6f);   // ~ half of 15 W
  }
  { // foreign object (HW flag) stops power
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn(); uint32_t t = toCharging(z, in);
    in.fodHw = true; Outputs o = z.step(in, t);
    CHECK(o.fault == Fault::ForeignObject && !o.txEnable);
  }
  { // hidden metal: high loss must persist > lossHoldMs
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn(); uint32_t t = toCharging(z, in);
    in.pinW = 15; in.prxW = 8;
    z.step(in, t); CHECK(z.state() == State::Charging);       // transient not tripped
    z.step(in, t + 1500); CHECK(z.state() == State::Charging);
    z.step(in, t + 2600); CHECK(z.state() == State::Fault && z.lastFault() == Fault::LowEfficiency);
  }
  { // loss that recovers does not trip
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn(); uint32_t t = toCharging(z, in);
    in.prxW = 8; z.step(in, t); in.prxW = 12; z.step(in, t + 1000); in.prxW = 8; z.step(in, t + 1500);
    z.step(in, t + 3000);                                      // only 1.5 s since restart
    CHECK(z.state() == State::Charging);
  }
  { // charge complete after sustained low current
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn(); uint32_t t = toCharging(z, in);
    in.rxCurrentA = 0.05f;
    z.step(in, t); z.step(in, t + 100000); CHECK(z.state() == State::Charging);
    z.step(in, t + 200000); CHECK(z.state() == State::Complete);
    Outputs o = z.step(in, t + 200100); CHECK(!o.txEnable);
  }
  { // hardware latch forces fault
    ZoneController z(Zone::Laptop, L); Inputs in = idleIn(); in.hwLatchTripped = true;
    z.step(in, 0); CHECK(z.state() == State::Fault);
  }
  { // sensor failure -> fault (fail safe)
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn(); uint32_t t = toCharging(z, in);
    in.sensorsOk = false; Outputs o = z.step(in, t);
    CHECK(o.fault == Fault::SensorFail && !o.txEnable);
  }
  { // device removed mid-charge -> TX off, back to idle
    ZoneController z(Zone::Phone, L); Inputs in = phoneOn(); uint32_t t = toCharging(z, in);
    in.weightG = 0; in.proxCm = 100; Outputs o = z.step(in, t);
    CHECK(!o.txEnable); CHECK(z.state() == State::Idle);
  }
  printf(fails ? "%d FAILURES\n" : "ALL TESTS PASSED\n", fails);
  return fails ? 1 : 0;
}
