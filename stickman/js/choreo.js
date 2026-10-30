/* The shot: keyframes for hero, opponent, camera and speed ramps.
 * All frames are in ANIMATION time at 30 fps. The speed track then stretches
 * some of them in DISPLAY time (slow-motion into the kick, hit-stop on impact).
 *
 * `keys`  = hand-authored poses (shown in the dope sheet)
 * `aux`   = generated data (walk cycles, footsteps) that feeds the same tracks
 */
(function (g) {
  const { RIG } = g.Rig;
  const TOTAL = 372;

  const sin = Math.sin, cos = Math.cos, PI = Math.PI;
  const FOOT_UP = (deg) => RIG.foot * sin(deg * PI / 180);

  /* ---- foot planning ------------------------------------------------
   * A plan is a list of footfalls {L: landing frame, x: world x, lift?, h?}.
   * Between footfalls the foot is planted (no sliding); each swing gets a
   * heel-off, an arc and a heel-strike. The IK in the rig does the rest. */
  function footKeys(out, side, plan, o = {}) {
    const stance = o.stance || 18;
    const K = (f, p, e) => out.push([f, p, e || 'io']);
    const fx = 'fx' + side, fy = 'fy' + side, td = 'td' + side;
    plan.forEach((it, i) => {
      if (i === 0) { K(it.L, { [fx]: it.x, [fy]: 0, [td]: 0 }, 'lin'); return; }
      const prev = plan[i - 1];
      const lift = it.lift != null ? it.lift : prev.L + stance;
      const mid = (lift + it.L) / 2;
      if (it.air) {            // jump / airborne step: no heel work
        K(lift, { [fx]: [prev.x, 'lin'], [fy]: [0, 'lin'], [td]: [0, 'lin'] });
        K(it.L, { [fx]: [it.x, 'io'], [fy]: [0, 'lin'], [td]: [0, 'lin'] });
        return;
      }
      const h = it.h != null ? it.h : 10;
      K(lift - 3, { [fx]: [prev.x, 'lin'], [fy]: [0, 'lin'], [td]: [0, 'out'] });
      K(lift, { [fx]: [prev.x, 'lin'], [fy]: [FOOT_UP(36), 'out'], [td]: [36, 'out'] });
      K(mid, { [fy]: [h, 'in'], [td]: [14, 'io'] });
      K(it.L, { [fx]: [it.x, 'io'], [fy]: [0, 'in'], [td]: [-10, 'io'] });
      K(it.L + 3, { [td]: [0, 'out'], [fy]: [0, 'lin'] });
    });
  }

  function planWalk(rx, facing, phase, off, T, upTo, from) {
    const list = [];
    for (let k = -4; ; k++) {
      const L = phase + 2 * T * k;
      if (L > upTo) break;
      if (L < from) continue;
      list.push({ L, x: rx(L) + facing * off });
    }
    return list;
  }

  /* ---- dense walk cycle --------------------------------------------- */
  function walkKeys(out, o) {
    for (let f = o.f0; f <= o.f1; f++) {
      const ph = 2 * PI * (f - o.phase) / (2 * o.T);   // near leg forward at ph = 0
      const c = cos(ph), s = sin(ph);
      const bobC = cos(PI * (f - o.phase) / o.T);
      const props = {
        x: o.rx(f),
        hipH: o.hipMax - o.bob * bobC * bobC,
        pN: 1, pF: 1,
      };
      if (f <= o.armsUntil) {
        const lean = o.lean + 1.3 * cos(2 * ph + 0.4);
        Object.assign(props, {
          shN: 3 - o.arm * c, shF: -3 + o.arm * c,
          elN: o.elb + o.elb * 0.9 * (0.5 - 0.5 * c), elF: o.elb + o.elb * 0.9 * (0.5 + 0.5 * c),
          wrN: 6 + 9 * s, wrF: 6 - 9 * s,
          yaw: o.yaw * c, twist: -1.9 * o.yaw * c,
          spine: lean, neck: -(lean - o.lean) * 0.9 - o.lean * 0.45,
        });
      }
      out.push([f, props, 'spline']);
    }
  }

  const decel = (x98, v, d, f, f0) => {            // constant-decel stop
    const s = Math.min(1, (f - f0) / d);
    return x98 + v * d * (s - s * s / 2);
  };

  function build() {
    const hero = { facing: 1, keys: [], aux: [] };
    const opp = { facing: -1, keys: [], aux: [] };
    const cam = { keys: [] };
    const speed = { keys: [] };
    const H = (f, p, e) => hero.keys.push([f, p, e]);
    const O = (f, p, e) => opp.keys.push([f, p, e]);
    const C = (f, p, e) => cam.keys.push([f, p, e]);

    /* =================== HERO =================== */
    const HV = 3.2, HX0 = -500, HD0 = 98, HDUR = 18;
    const hrx = (f) => (f <= HD0 ? HX0 + HV * f : decel(HX0 + HV * HD0, HV, HDUR, f, HD0));
    const xs = hrx(HD0 + HDUR);                 // where the hero stops

    walkKeys(hero.aux, {
      f0: -40, f1: 98, armsUntil: 94, rx: hrx, phase: 2, T: 16,
      hipMax: 76, bob: 3.4, arm: 22, elb: 15, lean: 4, yaw: 7,
    });
    for (let f = 99; f <= 120; f++) hero.aux.push([f, { x: hrx(f) }, 'spline']);

    // footsteps: walk, closing step, step back into guard, jump, land, close up
    const hN = planWalk(hrx, 1, 2, 25.5, 16, 98, -70);
    const hF = planWalk(hrx, 1, 18, 25.5, 16, 98, -70);
    hF.push({ L: 114, lift: 99, x: xs + 9, h: 9 });
    hF.push({ L: 134, lift: 123, x: xs - 37, h: 8 });
    hN.push({ L: 255, lift: 212, x: xs + 30, air: true });
    hF.push({ L: 255, lift: 212, x: xs - 12, air: true });
    hF.push({ L: 290, lift: 276, x: xs + 12, h: 8 });
    footKeys(hero.aux, 'N', hN, { stance: 18 });
    footKeys(hero.aux, 'F', hF, { stance: 18 });

    // 2. NOTICE ---------------------------------------------------------
    H(94, { hipH: [76, 'io'] });
    H(96, { neck: [-4, 'out'] });
    H(98, { // flinch: head snaps up, chest recoils, hands lift
      neck: [-16, 'snap'], spine: [-4, 'out'], hipH: [77.5, 'out'],
      shN: [24, 'out'], elN: [46, 'out'], shF: [-14, 'out'], elF: [30, 'out'], wrN: [10], wrF: [10],
      yaw: [0, 'out'], twist: [0, 'out'],
    });
    H(105, { neck: [9, 'io'], spine: [3, 'io'], hipH: [75.5, 'io'], shN: [12, 'io'], elN: [30], shF: [-7], elF: [20] });
    H(114, { neck: [2, 'io'], spine: [2], shN: [6], elN: [16], shF: [-4], elF: [14], wrN: [0], wrF: [0], hipH: [76, 'io'], life: [1, 'io'] });

    // 3. DEFENSIVE STANCE -----------------------------------------------
    H(121, { hipH: [78.5, 'out'], spine: [0, 'out'], neck: [0, 'out'], x: [xs - 1, 'out'] });
    H(125, { life: [0, 'io'], shF: [-4, 'io'] });
    H(135, { // drop into guard, with settle
      hipH: [63, 'back'], x: [xs - 17, 'io'],
      spine: [10, 'back'], neck: [-7, 'back'],
    });
    H(129, { shF: [-14, 'in'], elF: [40, 'in'] });                        // far arm cocks first
    H(137, { shF: [40, 'back'], elF: [118, 'back'], wrF: [18, 'out'] });
    H(139, { shN: [62, 'back'], elN: [100, 'back'], wrN: [14, 'out'] });
    H(141, { bnc: [1, 'io'] });
    H(184, { bnc: [1, 'lin'] });

    // 4. DODGE (opponent's jab arrives at f197) ---------------------------
    H(190, { bnc: [0, 'out'], hipH: [62, 'io'], spine: [11, 'io'] });
    H(193, { // load before the duck
      hipH: [61, 'in'], spine: [14, 'in'], x: [xs - 18, 'in'],
      shN: [66, 'io'], elN: [104, 'io'],
    });
    H(198, {
      hipH: [47, 'out'], spine: [34, 'out'], neck: [-24, 'out'], x: [xs - 24, 'out'],
      shN: [78, 'out'], elN: [124, 'out'], wrN: [12], shF: [48, 'out'], elF: [126, 'out'],
    });
    H(205, { hipH: [46, 'io'], spine: [30, 'io'], neck: [-20, 'io'] });

    // 5. SPINNING KICK ---------------------------------------------------
    H(211, { // coil: shoulders wind away, weight sinks
      hipH: [46, 'io'], spine: [26, 'io'], neck: [-16, 'io'], sqz: [-0.04, 'io'],
      yaw: [-26, 'io'], twist: [-18, 'io'], x: [xs - 28, 'io'],
      shN: [-34, 'io'], elN: [70, 'io'], shF: [78, 'io'], elF: [92, 'io'],
      pN: [1, 'lin'], pF: [1, 'lin'],
    });
    H(215, { // explosive launch
      hipH: [82, 'out'], sqz: [0.05, 'out'], spine: [6, 'out'], neck: [-3, 'out'],
      pN: [0, 'out'], pF: [0, 'out'], air: [0, 'lin'],
      hpN: [0, 'lin'], knN: [0, 'lin'], hpF: [0, 'lin'], knF: [0, 'lin'],
      yaw: [-6, 'in'], twist: [-18, 'lin'], x: [xs - 26, 'out'],
      shN: [60, 'out'], elN: [40, 'out'], shF: [30, 'out'], elF: [40, 'out'],
    });
    H(219, { yaw: [38, 'lin'], hpN: [20, 'out'], knN: [-40, 'out'], hpF: [58, 'out'], knF: [-112, 'out'] });
    H(223, { yaw: [138, 'lin'], twist: [-34, 'io'], air: [17, 'out'], x: [xs - 14, 'lin'] });
    H(227, { yaw: [226, 'lin'], hpF: [80, 'io'], knF: [-130, 'io'], hpN: [34, 'io'], knN: [-68, 'io'] });
    H(231, { yaw: [292, 'lin'], twist: [-8, 'io'], air: [25, 'out'], x: [xs + 2, 'lin'] });
    H(236, { yaw: [341, 'lin'], twist: [10, 'out'], hpF: [88, 'io'], knF: [-118, 'io'],
      rot: [-4, 'io'], spine: [-4, 'io'], neck: [4, 'io'] });
    H(239, { yaw: [358, 'out'], hpF: [104, 'snap'], knF: [-34, 'snap'], anF: [10, 'out'], rot: [-12, 'out'], air: [24, 'in'] });
    H(240, { yaw: [360, 'lin'], hpF: [106, 'lin'], knF: [-4, 'snap'], x: [xs + 16, 'out'],     // CONTACT
      shN: [140, 'out'], elN: [14, 'out'], shF: [-52, 'out'], elF: [24, 'out'], twist: [0, 'lin'], anF: [18, 'lin'] });
    H(246, { hpF: [108, 'out'], knF: [-2, 'out'], rot: [-16, 'out'], air: [18, 'in'], x: [xs + 22, 'out'] });
    H(250, { pN: [0, 'lin'], pF: [0, 'lin'] });
    H(251, { hpF: [66, 'io'], knF: [-80, 'io'], hpN: [22, 'io'], knN: [-36, 'io'], rot: [-4, 'io'],
      air: [6, 'iq'], spine: [10, 'io'], neck: [-4, 'io'], anF: [0, 'io'],
      shN: [60, 'io'], elN: [60, 'io'], shF: [10, 'io'], elF: [70, 'io'], sqz: [0.01, 'io'] });

    // 6/7. LAND & IDLE -------------------------------------------------------
    H(255, { // touchdown: knees absorb, torso squashes
      hipH: [58, 'in'], rot: [0, 'in'], air: [0, 'iq'], sqz: [-0.03, 'in'], spine: [20, 'in'], neck: [-10, 'in'],
      pN: [1, 'io'], pF: [1, 'io'], hpN: [12, 'io'], knN: [-20, 'io'], hpF: [24, 'io'], knF: [-30, 'io'],
      x: [xs + 26, 'out'], yaw: [360, 'lin'], twist: [0, 'lin'],
      shN: [46, 'in'], elN: [90, 'in'], shF: [20, 'in'], elF: [80, 'in'],
    });
    H(259, { hipH: [51, 'out'], sqz: [-0.05, 'out'], spine: [26, 'out'], neck: [-14, 'out'] });
    H(272, { hipH: [77, 'back'], sqz: [0.015, 'back'], spine: [4, 'back'], neck: [6, 'io'], x: [xs + 20, 'io'],
      shN: [8, 'back'], elN: [18, 'io'], shF: [-2, 'back'], elF: [14, 'io'], wrN: [0], wrF: [0] });
    H(282, { hipH: [75.5, 'io'], sqz: [0, 'io'], spine: [3, 'io'], neck: [16, 'io'], life: [1, 'io'], x: [xs + 16, 'io'] });
    H(318, { neck: [14, 'io'] });
    H(342, { neck: [-2, 'io'], spine: [2, 'io'] });
    H(TOTAL, { neck: [-3, 'io'] });

    /* =================== OPPONENT =================== */
    const OV = 3.0, OD0 = 152, ODUR = 18, OXS = 20;
    const OX0 = OXS + OV * ODUR / 2 + OV * OD0;
    const orx = (f) => (f <= OD0 ? OX0 - OV * f : decel(OX0 - OV * OD0, -OV, ODUR, f, OD0));

    walkKeys(opp.aux, {
      f0: -40, f1: 152, armsUntil: 152, rx: orx, phase: 16, T: 17,
      hipMax: 75, bob: 3.3, arm: 16, elb: 20, lean: 9, yaw: 8,
    });
    for (let f = 153; f <= 172; f++) opp.aux.push([f, { x: orx(f) }, 'spline']);
    const oN = planWalk(orx, -1, 16, 26, 17, 152, -90);
    const oF = planWalk(orx, -1, 33, 26, 17, 152, -90);
    oF.push({ L: 168, lift: 154, x: OXS - 9, h: 9 });
    // lunge steps (N is nearest the hero)
    oN.push({ L: 184, lift: 175, x: OXS - 40, h: 9 });
    oF.push({ L: 192, lift: 185, x: OXS - 76, h: 8 });
    oN.push({ L: 198, lift: 191, x: OXS - 108, h: 8 });
    oF.push({ L: 212, lift: 202, x: OXS - 104, h: 8 });
    // knocked off his feet
    oN.push({ L: 240, lift: 240, x: OXS - 108, air: true });
    oF.push({ L: 240, lift: 240, x: OXS - 104, air: true });
    footKeys(opp.aux, 'N', oN, { stance: 19 });
    footKeys(opp.aux, 'F', oF, { stance: 19 });

    // set up guard while the hero waits
    O(172, { spine: [10, 'io'], neck: [-4, 'io'], hipH: [75, 'io'], yaw: [0, 'io'], twist: [0, 'io'], life: [1, 'io'] });
    O(180, { life: [0, 'io'], hipH: [68, 'io'], spine: [12, 'io'], neck: [-6, 'io'],
      shN: [54, 'io'], elN: [104, 'io'], wrN: [12], shF: [36, 'io'], elF: [118, 'io'], wrF: [14] });
    // step in
    O(186, { x: [OXS - 12, 'io'], hipH: [66, 'io'] });
    // anticipation: cock the jab, load the back leg
    O(189, { shN: [14, 'out'], elN: [146, 'out'], wrN: [18, 'out'], twist: [26, 'out'], yaw: [-14, 'out'],
      spine: [4, 'out'], neck: [2, 'out'], hipH: [64, 'out'], x: [OXS - 18, 'out'] });
    // strike
    O(193, { shN: [100, 'snap'], elN: [-2, 'snap'], wrN: [0, 'snap'], twist: [-32, 'snap'], yaw: [16, 'snap'],
      spine: [26, 'snap'], neck: [-18, 'snap'], hipH: [66, 'out'], x: [OXS - 42, 'snap'],
      shF: [28, 'out'], elF: [126, 'out'] });
    O(197, { x: [OXS - 64, 'out'], shN: [102, 'out'], elN: [-4, 'out'] });                  // fully extended, misses
    O(203, { spine: [30, 'out'], neck: [-24, 'out'], hipH: [68, 'io'], x: [OXS - 82, 'out'] }); // overextended
    O(213, { // pulls back, hunts for balance
      shN: [58, 'io'], elN: [108, 'io'], spine: [16, 'io'], neck: [-8, 'io'], twist: [0, 'io'], yaw: [0, 'io'],
      hipH: [66, 'io'], x: [OXS - 88, 'io'], shF: [38, 'io'], elF: [118, 'io'] });
    O(224, { x: [OXS - 90, 'io'] });
    // sees the spin coming: head up, guard high, weight rocks back
    O(232, { spine: [4, 'out'], neck: [10, 'out'], shN: [74, 'out'], elN: [128, 'out'], shF: [60, 'out'], elF: [138, 'out'],
      hipH: [67, 'out'], x: [OXS - 85, 'out'], bnc: [0, 'io'] });
    O(239, { spine: [0, 'in'], neck: [6, 'in'] });

    // impact and fall: chest caves, head whips back, whole body flies away and rolls flat
    O(241, { // first frames after contact
      spine: [-18, 'snap'], neck: [-38, 'snap'], hipH: [66, 'lin'],
      shN: [128, 'snap'], elN: [34, 'snap'], wrN: [-20, 'snap'], shF: [152, 'snap'], elF: [24, 'snap'], wrF: [-20, 'snap'],
      pN: [0, 'lin'], pF: [0, 'lin'],
      hpN: [40, 'snap'], knN: [-64, 'snap'], hpF: [-14, 'snap'], knF: [-46, 'snap'], anN: [10], anF: [10],
    });
    O(238, { pN: [1, 'lin'], pF: [1, 'lin'] });
    O(240, { pN: [1, 'lin'], pF: [1, 'lin'], air: [0, 'lin'], rot: [0, 'lin'], x: [OXS - 85, 'lin'] });
    O(246, { x: [OXS - 62, 'out'], air: [30, 'out'], rot: [-30, 'out'], spine: [-22, 'out'], neck: [-30, 'io'],
      hpN: [58, 'out'], knN: [-44, 'out'], hpF: [-30, 'out'], knF: [-22, 'out'],
      shN: [150, 'out'], elN: [20, 'out'], shF: [138, 'out'], elF: [30, 'out'] });
    O(254, { x: [OXS - 18, 'out'], air: [34, 'io'], rot: [-70, 'io'], spine: [-14, 'io'], neck: [-10, 'io'],
      hpN: [48, 'io'], knN: [-26, 'io'], hpF: [4, 'io'], knF: [-12, 'io'],
      shN: [158, 'io'], elN: [28, 'io'], shF: [146, 'io'], elF: [34, 'io'] });
    O(261, { x: [OXS + 44, 'out'], air: [0, 'iq'], rot: [-92, 'in'], spine: [-8, 'io'], neck: [12, 'io'],     // slams down
      hpN: [26, 'io'], knN: [-6, 'io'], hpF: [-4, 'io'], knF: [-10, 'io'],
      shN: [168, 'io'], elN: [14, 'io'], shF: [120, 'io'], elF: [26, 'io'] });
    O(265, { air: [7, 'out'], rot: [-98, 'out'], x: [OXS + 62, 'out'], neck: [24, 'out'],
      shN: [176, 'out'], shF: [128, 'out'] });                                                                // small bounce
    O(270, { air: [0, 'iq'], rot: [-90, 'io'], x: [OXS + 72, 'oq'], neck: [14, 'io'],
      hpN: [18, 'io'], knN: [-4, 'io'], hpF: [-8, 'io'], knF: [-6, 'io'],
      shN: [150, 'io'], elN: [10, 'io'], shF: [112, 'io'], elF: [22, 'io'], wrN: [-10], wrF: [-6] });
    O(288, { x: [OXS + 78, 'oq'] });
    O(TOTAL, { x: [OXS + 78, 'lin'] });

    /* =================== CAMERA =================== */
    C(0, { camX: -128, camY: 0, zoom: 2.0 });
    C(96, { camX: 8, zoom: 2.0, camY: 0 }, 'io');
    C(145, { camX: -92, zoom: 2.08 }, 'io');
    C(188, { camX: -98, zoom: 2.15 }, 'io');
    C(214, { camX: -88, zoom: 2.4, camY: 4 }, 'io');           // push in on the spin
    C(240, { camX: -66, zoom: 2.52, camY: 12 }, 'io');
    C(262, { camX: -38, zoom: 2.2, camY: 4 }, 'io');
    C(300, { camX: -22, zoom: 1.98, camY: 0 }, 'io');
    C(TOTAL, { camX: -18, zoom: 1.9, camY: 0 }, 'io');

    /* =================== SPEED RAMPS (display time) =================== */
    speed.keys.push([0, { spd: 1 }]);
    speed.keys.push([208, { spd: [1, 'io'] }]);
    speed.keys.push([216, { spd: [0.62, 'io'] }]);
    speed.keys.push([233, { spd: [0.6, 'io'] }]);
    speed.keys.push([238.4, { spd: [0.34, 'io'] }]);
    speed.keys.push([239.7, { spd: [0.16, 'io'] }]);
    speed.keys.push([241.2, { spd: [0.16, 'lin'] }]);   // hit-stop
    speed.keys.push([244, { spd: [0.55, 'io'] }]);
    speed.keys.push([252, { spd: [0.85, 'io'] }]);
    speed.keys.push([262, { spd: [1, 'io'] }]);

    const beats = [
      [0, 'Enter'], [92, 'Notice'], [118, 'Defensive stance'], [186, 'Dodge'],
      [206, 'Spinning kick'], [240, 'Impact'], [270, 'Land & idle'],
    ];

    // transient effects, in animation frames
    const effects = {
      exclaim: { start: 97, end: 122 },
      hit: { f: 240 },
      dust: [{ f: 255, who: 'hero' }, { f: 262, who: 'opp' }, { f: 267, who: 'opp', small: true }],
      shake: [{ f: 240, amp: 9, decay: 0.2 }, { f: 262, amp: 5, decay: 0.28 }, { f: 255, amp: 2.5, decay: 0.3 }],
    };

    return { hero, opp, cam, speed, beats, effects, total: TOTAL, fps: 30 };
  }

  g.Choreo = { build };
})(typeof window !== 'undefined' ? window : globalThis);
