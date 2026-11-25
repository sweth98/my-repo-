#include "aura_core.h"

namespace aura {

bool ZoneController::present(const Inputs& in) const {
  return in.weightG >= lim_.weightMinG * 0.5f;   // generous: just "something is there"
}

// Faults that must stop power immediately, from any state.
Fault ZoneController::checkHard(const Inputs& in) const {
  if (in.hwLatchTripped)                         return Fault::OverCurrent;  // HW latch = treat as hard fault
  if (!in.sensorsOk)                             return Fault::SensorFail;
  if (in.coilTempC >= lim_.tempStopC ||
      in.fetTempC  >= lim_.tempStopC)            return Fault::OverTemp;
  if (in.surfaceTempC >= lim_.surfaceStopC)      return Fault::OverTemp;
  if (in.vinV > lim_.vinMax)                     return Fault::OverVoltage;
  if (in.fodHw || in.metalSenseDelta >= lim_.metalTrip) return Fault::ForeignObject;
  return Fault::None;
}

// Linear power derating between tempDerateC and tempStopC.
float ZoneController::derate(const Inputs& in) const {
  float t = in.coilTempC > in.fetTempC ? in.coilTempC : in.fetTempC;
  if (t <= lim_.tempDerateC) return 1.0f;
  if (t >= lim_.tempStopC)   return 0.0f;
  return (lim_.tempStopC - t) / (lim_.tempStopC - lim_.tempDerateC);
}

void ZoneController::clearFault(const Inputs& in) {
  // Latched faults need the device physically removed and conditions normal.
  if (state_ != State::Fault) return;
  if (!present(in) && !in.hwLatchTripped && checkHard(in) == Fault::None) {
    fault_ = Fault::None;
    // state transition happens in the next step()
  }
}

Outputs ZoneController::step(const Inputs& in, uint32_t now) {
  Outputs out;
  const uint32_t dt = now - tEnter_;

  // ---- global hard-fault check (every state except Fault) ----
  if (state_ != State::Fault) {
    Fault f = checkHard(in);
    if (f != Fault::None) {
      fault_ = f;
      enter(State::Fault, now);
    }
  }

  switch (state_) {
    case State::Idle:
      out.led = Led::Off;
      if (in.proxCm >= 0 && in.proxCm < lim_.proxTriggerCm) enter(State::Detect, now);
      break;

    case State::Detect:
      out.led = Led::Breathe;
      if (present(in)) enter(State::AlignCheck, now);
      else if (dt > lim_.detectTimeoutMs) enter(State::Idle, now);
      break;

    case State::AlignCheck: {
      out.led = Led::Amber;
      if (in.weightG < lim_.weightMinG || in.weightG > lim_.weightMaxG) {
        // Wrong class of object for this zone, wait a little for settling
        if (dt > 2000) { fault_ = Fault::WeightMismatch; enter(State::Fault, now); }
        break;
      }
      bool aligned = (zone_ == Zone::Phone)
                         ? (in.magnetDetected && in.alignErrMm <= lim_.maxAlignErrMm)
                         : (in.alignErrMm <= lim_.maxAlignErrMm);
      if (aligned) enter(State::Handshake, now);
      else if (dt > lim_.detectTimeoutMs) { fault_ = Fault::Misaligned; enter(State::Fault, now); }
      break;
    }

    case State::Handshake:
      out.led = Led::Pulse;
      out.txEnable = true;                       // minimal ping power only
      out.powerLimitW = 1.0f;
      if (in.rxLinked) enter(State::Negotiate, now);
      else if (dt > lim_.handshakeTimeoutMs) { fault_ = Fault::NoReceiver; enter(State::Fault, now); }
      break;

    case State::Negotiate:
      out.led = Led::Pulse;
      out.txEnable = true;
      out.powerLimitW = 1.0f;
      if (in.rxContractW > 0.0f) enter(State::Charging, now);
      else if (dt > lim_.handshakeTimeoutMs) { fault_ = Fault::NoReceiver; enter(State::Fault, now); }
      break;

    case State::Charging: {
      out.led = Led::Progress;
      out.txEnable = true;
      float want = in.rxContractW < lim_.maxPowerW ? in.rxContractW : lim_.maxPowerW;
      float k = derate(in);
      out.powerLimitW = want * k;
      // soft ramp is done by the power-control layer; here we only set the limit.

      if (!present(in)) { fault_ = Fault::DeviceRemoved; enter(State::Idle, now); out.txEnable = false; break; }
      if (!in.rxLinked) { enter(State::Paused, now); break; }
      if (in.vinV < lim_.vinMin) { enter(State::Paused, now); break; }

      // Loss accounting (power the TX sends minus what RX says it received).
      if (in.pinW >= lim_.minLossCheckW && in.prxW > 0.0f) {
        float loss = (in.pinW - in.prxW) / in.pinW;
        if (loss > lim_.maxLossFrac) {
          if (!lossActive_) { lossActive_ = true; tLossStart_ = now; }
          else if (now - tLossStart_ > lim_.lossHoldMs) {
            fault_ = Fault::LowEfficiency;       // possible hidden metal object
            enter(State::Fault, now); lossActive_ = false; break;
          }
        } else lossActive_ = false;
      }

      // Charge-complete detection: RX current stays low for completeHoldMs.
      if (in.rxCurrentA < lim_.completeAmpsA) {
        if (!completeActive_) { completeActive_ = true; tCompleteStart_ = now; }
        else if (now - tCompleteStart_ > lim_.completeHoldMs) {
          completeActive_ = false; enter(State::Complete, now); break;
        }
      } else completeActive_ = false;

      // Fan duty from hottest sensor
      float t = in.coilTempC > in.fetTempC ? in.coilTempC : in.fetTempC;
      float d = (t - 45.0f) / (65.0f - 45.0f);
      out.fanDuty = d < 0 ? 0 : (d > 1 ? 1 : d);
      break;
    }

    case State::Paused:
      out.led = Led::Amber;
      out.txEnable = false;
      if (!present(in)) enter(State::Idle, now);
      else if (in.rxLinked && in.vinV >= lim_.vinMin && derate(in) > 0.2f) enter(State::Handshake, now);
      else if (dt > lim_.pauseMaxMs) { fault_ = Fault::NoReceiver; enter(State::Fault, now); }
      break;

    case State::Complete:
      out.led = Led::Green;
      out.txEnable = false;
      if (!present(in)) enter(State::Idle, now);
      break;

    case State::Fault:
      out.led = Led::Red;
      out.txEnable = false;
      out.powerLimitW = 0;
      out.fault = fault_;
      out.fanDuty = 1.0f;     // cool down
      // leave Fault only when cleared (device removed + conditions normal)
      if (fault_ == Fault::None) enter(State::Idle, now);
      break;
  }
  if (state_ != State::Fault) out.fault = Fault::None;
  return out;
}

}  // namespace aura
