import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Beat, Full, Sfx, useBeat, useL} from '../kit/core';
import {Newt} from '../kit/Newt';
import {Auto, Cart, CricketBall, Football, Ground} from '../kit/props';
import {Arrow, Chip, Confetti, Dust, Spark, SpeedLines, T, shake} from '../kit/shapes';
import {clamp, ease, easeOut, sp, squash} from '../kit/anim';
import {lineById, wordF} from '../data';
import {C, FONT, FONT2} from '../theme';

const OR = C.orange;
const rel = (a: string, b: string) => lineById(a).start - lineById(b).start;

/* ---------- b1: empty vs full cart ---------- */
const B1: React.FC = () => {
  const {f} = useBeat();
  const gnd = 790;
  const go = 30;
  const t = Math.max(0, f - go);
  const half = (cx: number, full: boolean, acc: number) => {
    const pos = Math.min(0.5 * acc * t * t, 520);
    const ant = f < go ? -Math.sin(ease(f, 10, go, 0, Math.PI)) * 9 : 0; // anticipation: lean back
    const lean = f < go ? ant : 10 + Math.min(6, t * 0.2);
    const [sx, sy] = squash(f, go + 2, 0.06, 0.2, 0.7);
    const push = f >= go ? clamp((f - go) / 6) : 0;
    return (
      <g>
        <Newt x={cx + pos} y={gnd} s={1.05} mood={full && f >= go ? 'worried' : 'happy'} armL={-80 * push - 10} armR={-80 * push} rot={lean} sx={sx} sy={sy} bob={f < go} />
        <Cart x={cx + 250 + pos} y={gnd} s={1.0} full={full} wheelRot={pos * 1.6} />
        <Arrow x1={cx - 60 + pos} y1={380} x2={cx + 170 + pos} y2={380} color={C.yellow} w={20} label="30 N push" labelSize={40} grow={clamp((f - go + 6) / 10)} labelSide={1} />
        {t > 12 && <SpeedLines x={cx - 100 + pos} y={620} w={full ? 200 : 360} h={120} f={f} dir={1} n={full ? 2 : 6} opacity={full ? 0.3 : 0.55} />}
        {full && t > 20 && <Dust x={cx + pos + 40} y={gnd} f={f} at={go + 22} n={4} size={14} spread={50} />}
      </g>
    );
  };
  return (
    <Full>
      <Ground y={gnd} color="#13266F" h={120} />
      <line x1={960} y1={170} x2={960} y2={790} stroke="#33448F" strokeWidth={6} strokeDasharray="20 16" />
      <T x={480} y={230} size={56} weight={800}>Empty cart</T>
      <T x={1440} y={230} size={56} weight={800}>Cart full of vegetables</T>
      {half(130, false, 0.26)}
      {half(1030, true, 0.06)}
      {t > 40 && <Chip x={480} y={320} text="speeds up FAST" size={44} color={C.green} scale={clamp(sp(f, go + 40), 0, 1.1)} />}
      {t > 40 && <Chip x={1440} y={320} text="speeds up SLOWLY" size={44} color={C.red} scale={clamp(sp(f, go + 40), 0, 1.1)} />}
    </Full>
  );
};

/* ---------- b2: cricket ball vs football, same kick ---------- */
const B2: React.FC = () => {
  const {f, dur} = useBeat();
  const kick = wordF('b2', 'cricket') + 30 > dur - 60 ? Math.round(dur * 0.35) : wordF('b2', 'cricket') + 34;
  const t = f - kick;
  const lane = (y: number, r: number, endX: number, h: number, isCricket: boolean) => {
    const u = clamp(t / (isCricket ? 46 : 62));
    const x = 300 + (endX - 300) * (t < 0 ? 0 : easeOut(u, 0, 1, 0, 1));
    const arc = t < 0 ? 0 : 4 * h * u * (1 - u);
    const [sx, sy] = squash(f, kick, 0.2, 0.2, 0.9);
    const [lx, ly] = squash(f, kick + (isCricket ? 46 : 62), 0.25, 0.2, 0.9);
    const landed = u >= 1;
    const Ball = isCricket ? CricketBall : Football;
    return (
      <g>
        <line x1={140} y1={y} x2={1860} y2={y} stroke="#33448F" strokeWidth={6} />
        <Ball x={x} y={y - r - arc} r={r} rot={t * 14} sx={landed ? lx : sx} sy={landed ? ly : sy} />
        <Dust x={endX} y={y} f={f} at={kick + (isCricket ? 46 : 62)} n={7} size={20} spread={90} />
        <Dust x={300} y={y} f={f} at={kick} n={6} size={20} spread={70} />
        <Arrow x1={110} y1={y - r} x2={250} y2={y - r} color={C.yellow} w={16} grow={clamp((f - kick + 14) / 10) * (t < 8 ? 1 : 0.0)} />
        <T x={170} y={y + 56} size={34} color="#fff" weight={800}>{isCricket ? 'Cricket ball 0.16 kg' : 'Football 0.43 kg'}</T>
      </g>
    );
  };
  return (
    <Full>
      {lane(470, 32, 1700, 150, true)}
      {lane(760, 48, 1060, 90, false)}
      <Chip x={960} y={190} text="same kick: 40 N on both" size={50} color={C.yellow} scale={clamp(sp(f, wordF('b2', 'same') - 4), 0, 1.1)} />
      {t > 58 && <Chip x={1400} y={330} text="lighter → bigger acceleration" size={42} color={C.green} scale={clamp(sp(f, kick + 58), 0, 1.1)} />}
      {t > 72 && <Chip x={1100} y={640} text="heavier → smaller acceleration" size={42} color={C.red} scale={clamp(sp(f, kick + 72), 0, 1.1)} />}
    </Full>
  );
};

/* ---------- b3: law statement ---------- */
const Bars: React.FC<{x: number; y: number; f: number; at: number; f1: number[]; a1: number[]; labelA: string; labelB: string; colorA: string; colorB: string}> = ({x, y, f, at, f1, a1, labelA, labelB, colorA, colorB}) => {
  const k = ease(f, at, at + 24, 0, 1);
  const cyc = (arr: number[]) => arr[0] + (arr[1] - arr[0]) * k;
  const hA = cyc(f1) * 150, hB = cyc(a1) * 150;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-130} y={-hA} width={90} height={hA} rx={12} fill={colorA} />
      <rect x={40} y={-hB} width={90} height={hB} rx={12} fill={colorB} />
      <rect x={-170} y={0} width={340} height={6} rx={3} fill="#fff" opacity={0.5} />
      <T x={-85} y={44} size={32} weight={800}>{labelA}</T>
      <T x={85} y={44} size={32} weight={800}>{labelB}</T>
    </g>
  );
};
const B3: React.FC = () => {
  const {f} = useBeat();
  const tD = wordF('b3', 'directly') - 6, tI = wordF('b3', 'inversely') - 6;
  const v1 = sp(f, tD, {damping: 11, stiffness: 140}), v2 = sp(f, tI, {damping: 11, stiffness: 140});
  return (
    <Full>
      <g transform={`translate(520,500) scale(${clamp(v1, 0, 1.1)})`} opacity={clamp(v1 * 2)}>
        <rect x={-420} y={-300} width={840} height={540} rx={48} fill="#0B1437" stroke={OR} strokeWidth={7} />
        <T x={0} y={-215} size={60} color={OR} weight={800}>DIRECTLY proportional</T>
        <T x={0} y={-150} size={44} weight={700}>to the net force</T>
        <Bars x={0} y={130} f={f} at={tD + 12} f1={[0.3, 0.9]} a1={[0.3, 0.9]} labelA="Force ↑" labelB="a ↑" colorA={C.yellow} colorB={OR} />
      </g>
      <g transform={`translate(1400,500) scale(${clamp(v2, 0, 1.1)})`} opacity={clamp(v2 * 2)}>
        <rect x={-420} y={-300} width={840} height={540} rx={48} fill="#0B1437" stroke={C.purple} strokeWidth={7} />
        <T x={0} y={-215} size={60} color={C.purple} weight={800}>INVERSELY proportional</T>
        <T x={0} y={-150} size={44} weight={700}>to the mass</T>
        <Bars x={0} y={130} f={f} at={tI + 12} f1={[0.3, 0.9]} a1={[0.9, 0.3]} labelA="Mass ↑" labelB="a ↓" colorA={C.steel} colorB={OR} />
      </g>
    </Full>
  );
};

/* ---------- b4 + b5: F = m x a assembles with units ---------- */
const B45: React.FC = () => {
  const {f} = useBeat();
  const o5 = rel('b5', 'b4');
  const tF = wordF('b4', 'f') ?? 0;
  const at = {F: wordF('b4', 'f') + 2, eq: wordF('b4', 'equals'), m: wordF('b4', 'm'), x: wordF('b4', 'times'), a: wordF('b4', 'a')};
  const u = {F: o5 + wordF('b5', 'newtons'), m: o5 + wordF('b5', 'kilograms'), a: o5 + wordF('b5', 'metres')};
  const glyph = (ch: string, x: number, from: 'left' | 'top' | 'spin' | 'zoom' | 'right', start: number, color: string, size = 300) => {
    const v = sp(f, start, {damping: 8, stiffness: 160});
    const vv = clamp(v, 0, 1.2);
    const dx = from === 'left' ? (1 - Math.min(1, v)) * -900 : from === 'right' ? (1 - Math.min(1, v)) * 900 : 0;
    const dy = from === 'top' ? (1 - Math.min(1, v)) * -600 : 0;
    const rot = from === 'spin' ? (1 - Math.min(1, v)) * 360 : 0;
    const sc = from === 'zoom' ? vv : from === 'spin' ? vv : 1;
    const [sx, sy] = squash(f, start + 5, 0.14, 0.14, 0.8);
    if (f < start - 1) return null;
    return <g transform={`translate(${x + dx},${470 + dy}) rotate(${rot}) scale(${sc * sx},${sc * sy})`}><T x={0} y={0} size={size} color={color} stroke weight={800}>{ch}</T></g>;
  };
  const tag = (x: number, label: string, sub: string, start: number, color: string) => {
    const v = sp(f, start, {damping: 9, stiffness: 150});
    if (f < start - 1) return null;
    return (
      <g transform={`translate(${x},640) scale(${clamp(v, 0, 1.12)})`}>
        <rect x={-200} y={-52} width={400} height={170} rx={34} fill="#0B1437" stroke={color} strokeWidth={6} />
        <T x={0} y={26} size={86} color={color} weight={800}>{label}</T>
        <T x={0} y={92} size={36} color="#fff" weight={700}>{sub}</T>
      </g>
    );
  };
  const glow = (a: number, b: number) => (f >= a && f < b ? 1 : 0);
  return (
    <Full>
      <T x={960} y={200} size={46} color={OR} weight={800} opacity={clamp(sp(f, 2))}>NEWTON'S SECOND LAW</T>
      {glyph('F', 500, 'left', at.F, OR)}
      {glyph('=', 740, 'top', at.eq, '#fff')}
      {glyph('m', 990, 'spin', at.m, '#8DBBFF')}
      {glyph('×', 1220, 'spin', at.x, C.yellow, 230)}
      {glyph('a', 1440, 'zoom', at.a, C.green)}
      {tag(500, 'N', 'newtons', u.F, OR)}
      {tag(990, 'kg', 'kilograms', u.m, '#8DBBFF')}
      {tag(1440, 'm/s²', 'metres per second²', u.a, C.green)}
      <circle cx={500} cy={410} r={0} />
      {f > u.F && <Spark x={500} y={470} f={f} at={u.F} color={OR} n={10} r0={130} r1={200} />}
      {f > u.m && <Spark x={990} y={470} f={f} at={u.m} color="#8DBBFF" n={10} r0={130} r1={200} />}
      {f > u.a && <Spark x={1440} y={470} f={f} at={u.a} color={C.green} n={10} r0={130} r1={200} />}
      {glow(0, 0) ? null : null}
    </Full>
  );
};

/* ---------- b7: momentum link ---------- */
const B7: React.FC = () => {
  const {f} = useBeat();
  const t = [wordF('b7', 'momentum'), wordF('b7', 'force'), wordF('b7', 'constant'), wordF('b7', 'equals')];
  const row = (i: number, y: number, children: React.ReactNode, color: string) => {
    const v = sp(f, t[i], {damping: 11, stiffness: 140});
    if (f < t[i] - 1) return null;
    return (
      <g transform={`translate(960,${y}) scale(${clamp(v, 0, 1.08)})`} opacity={clamp(v * 2)}>
        <rect x={-560} y={-70} width={1120} height={140} rx={42} fill="#0B1437" stroke={color} strokeWidth={6} />
        {children}
      </g>
    );
  };
  return (
    <Full>
      {row(0, 250, <><T x={-500} y={26} size={64} color="#8DBBFF" anchor="start" weight={800}>Momentum</T><T x={110} y={26} size={78} weight={800}>p = m × v</T></>, '#8DBBFF')}
      {row(1, 410, <><T x={-500} y={26} size={64} color={OR} anchor="start" weight={800}>Force</T><T x={110} y={26} size={78} weight={800}>F = Δp / Δt</T></>, OR)}
      {row(2, 570, <><T x={-500} y={26} size={52} color={C.yellow} anchor="start" weight={800}>mass constant</T><T x={190} y={26} size={78} weight={800}>= m × Δv / Δt</T></>, C.yellow)}
      {row(3, 730, <><T x={-500} y={26} size={52} color={C.green} anchor="start" weight={800}>so</T><T x={-60} y={28} size={92} color={OR} weight={800}>F = m × a</T></>, C.green)}
      <Newt x={1720} y={790} s={0.9} mood="think" look={[-1, -0.3]} flip />
    </Full>
  );
};

/* ---------- b8: doubling ---------- */
const B8: React.FC = () => {
  const {f} = useBeat();
  const tM = wordF('b8', 'mass') - 4;
  const phase1 = f < tM;
  const k = ease(f, 6, 30, 0, 1);
  const k2 = ease(f, tM + 6, tM + 30, 0, 1);
  const force = phase1 ? 10 + 10 * k : 20;
  const mass = phase1 ? 1 : 1 + k2;
  const acc = force / mass / (phase1 ? 1 : 1) * (phase1 ? 1 : 1);
  const accVal = phase1 ? 2 * (force / 10) : (20 / (10 * mass)) * 2;
  const bar = (x: number, h: number, color: string, label: string, val: string) => (
    <g transform={`translate(${x},760)`}>
      <rect x={-70} y={-h} width={140} height={h} rx={16} fill={color} />
      <T x={0} y={-h - 18} size={40} color={color} weight={800}>{val}</T>
      <T x={0} y={50} size={36} weight={800}>{label}</T>
    </g>
  );
  return (
    <Full>
      <rect x={140} y={170} width={1640} height={610} rx={46} fill="#0B1437" opacity={0.8} />
      <T x={960} y={240} size={54} color={phase1 ? C.yellow : '#8DBBFF'} weight={800}>{phase1 ? 'Double the FORCE → double the acceleration' : 'Double the MASS → half the acceleration'}</T>
      {phase1 ? (
        <>
          {bar(560, force * 14, C.yellow, 'Force', `${Math.round(force)} N`)}
          {bar(1100, accVal * 60, OR, 'Acceleration', `${accVal.toFixed(1)} m/s²`)}
          <T x={830} y={560} size={90} color="#fff" weight={800}>→</T>
        </>
      ) : (
        <>
          {bar(560, 140 * mass, C.steel, 'Mass', `${mass.toFixed(1)} kg`)}
          {bar(1100, accVal * 60, OR, 'Acceleration', `${accVal.toFixed(1)} m/s²`)}
          <T x={830} y={560} size={90} color="#fff" weight={800}>→</T>
        </>
      )}
    </Full>
  );
};

/* ---------- b9: the problem ---------- */
const Board: React.FC<{x: number; y: number; w: number; h: number; title: string; f: number}> = ({x, y, w, h, title, f}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-10} y={-10} width={w + 20} height={h + 20} rx={34} fill={C.woodDark} />
    <rect x={0} y={0} width={w} height={h} rx={26} fill="#173B34" />
    <T x={30} y={66} size={46} color={C.yellow} anchor="start" weight={800}>{title}</T>
    <line x1={30} y1={84} x2={w - 30} y2={84} stroke="#fff" strokeOpacity={0.35} strokeWidth={4} strokeDasharray="14 10" />
  </g>
);
const Row: React.FC<{y: number; at: number; f: number; children: React.ReactNode; color?: string}> = ({y, at, f, children, color = '#fff'}) => {
  const v = sp(f, at, {damping: 14, stiffness: 150});
  if (f < at - 1) return null;
  return <g transform={`translate(${(1 - Math.min(1, v)) * -80},${y})`} opacity={clamp(v * 2)} fill={color}>{children}</g>;
};
const B9: React.FC = () => {
  const {f} = useBeat();
  const t = {m: wordF('b9', 'five'), F: wordF('b9', 'thousand'), a: wordF('b9', 'acceleration'), v: wordF('b9', 'seconds'), r: wordF('b9', 'rest')};
  const slide = sp(f, 4, {damping: 14, stiffness: 100});
  return (
    <Full>
      <g transform={`translate(${(1 - Math.min(1, slide)) * -1200},0)`}>
        <Board x={110} y={150} w={1000} h={640} title="NUMERICAL" f={f} />
        <g transform="translate(110,150)">
        <Row y={160} at={t.m} f={f}><T x={50} y={0} size={62} color="#fff" anchor="start" weight={700}>mass  m = </T><T x={400} y={0} size={62} color={C.yellow} anchor="start" weight={800}>500 kg</T></Row>
        <Row y={260} at={t.F} f={f}><T x={50} y={0} size={62} color="#fff" anchor="start" weight={700}>net force  F = </T><T x={560} y={0} size={62} color={C.yellow} anchor="start" weight={800}>1000 N</T></Row>
        <Row y={360} at={t.r} f={f}><T x={50} y={0} size={62} color="#fff" anchor="start" weight={700}>starts from rest  u = </T><T x={700} y={0} size={62} color={C.yellow} anchor="start" weight={800}>0</T></Row>
        <Row y={460} at={t.a} f={f}><T x={50} y={0} size={62} color={C.green} anchor="start" weight={800}>Find:  a = ?</T></Row>
        <Row y={560} at={t.v} f={f}><T x={50} y={0} size={62} color={C.green} anchor="start" weight={800}>Find:  v after 5 s = ?</T></Row>
        </g>
      </g>
      <Ground y={790} color="#13266F" h={90} x={1150} w={800} />
      <Auto x={1500} y={790} s={1.35} wheelRot={0} sy={1 + Math.sin(f / 7) * 0.012} />
      <rect x={1270} y={530} width={8} height={260} fill="#fff" /><polygon points="1278,530 1360,556 1278,582" fill={C.green} /><T x={1290} y={500} size={36} anchor="middle" weight={800}>START</T>
    </Full>
  );
};

/* ---------- b10 .. b14: the solution ---------- */
const Gauge: React.FC<{x: number; y: number; kmh: number; r?: number}> = ({x, y, kmh, r = 210}) => {
  const ang = (k: number) => -120 + (240 * k) / 60;
  const pt = (k: number, rr: number) => [Math.sin((ang(k) * Math.PI) / 180) * rr, -Math.cos((ang(k) * Math.PI) / 180) * rr];
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={r + 24} fill="#0B1437" stroke="#33448F" strokeWidth={8} />
      <path d={`M${pt(0, r)[0]} ${pt(0, r)[1]} A${r} ${r} 0 1 1 ${pt(60, r)[0]} ${pt(60, r)[1]}`} fill="none" stroke="#33448F" strokeWidth={22} strokeLinecap="round" />
      <path d={`M${pt(0, r)[0]} ${pt(0, r)[1]} A${r} ${r} 0 ${kmh / 60 * 240 > 180 ? 1 : 0} 1 ${pt(kmh, r)[0]} ${pt(kmh, r)[1]}`} fill="none" stroke={C.green} strokeWidth={22} strokeLinecap="round" opacity={kmh > 0.5 ? 1 : 0} />
      {[0, 10, 20, 30, 40, 50, 60].map((k) => <g key={k}><line x1={pt(k, r - 34)[0]} y1={pt(k, r - 34)[1]} x2={pt(k, r - 14)[0]} y2={pt(k, r - 14)[1]} stroke="#fff" strokeWidth={5} /><T x={pt(k, r - 66)[0]} y={pt(k, r - 66)[1] + 12} size={32} weight={700}>{k}</T></g>)}
      <line x1={0} y1={0} x2={pt(kmh, r - 40)[0]} y2={pt(kmh, r - 40)[1]} stroke={C.yellow} strokeWidth={10} strokeLinecap="round" />
      <circle r={20} fill={C.yellow} />
      <T x={0} y={r * 0.78} size={52} color={C.green} weight={800}>{Math.round(kmh)} km/h</T>
    </g>
  );
};
const B10_14: React.FC = () => {
  const {f} = useBeat();
  const o12 = rel('b12', 'b10'), o13 = rel('b13', 'b10'), o14 = rel('b14', 'b10');
  const e13 = lineById('b13').end - lineById('b10').start;
  // simulation clock: auto accelerates from rest during b12 .. b13
  const simStart = o12 + 30, simEnd = e13 - 20;
  const tau = ease(f, simStart, simEnd, 0, 5, (t) => t);
  const v = 2 * tau, s = tau * tau;
  const at = {given: wordF('b10', 'given') + 2, a: o12 + wordF('b12', 'a') + 2, calc: o12 + wordF('b12', 'one'), res: o12 + wordF('b12', 'two'), v: o13 + 4, vcalc: o13 + wordF('b13', 'zero'), vres: o13 + wordF('b13', 'ten'), kmh: o14 + 2};
  const in14 = f >= o14 - 4;
  const kmh = in14 ? ease(f, o14, o14 + 16, 36 * 0.95, 36 * 1.0) : v * 3.6;
  const needle = in14 ? 36 + Math.sin((f - o14) * 0.7) * 3 * Math.exp(-(f - o14) / 10) : kmh;
  const [sx, sy] = [1, 1];
  const accel = f > simStart ? (f < simEnd ? 1 : 0) : 0;
  const counter = ease(f, at.calc, at.res, 0, 1);
  const aShown = f < at.res ? (1000 / 500) * counter : 2;
  return (
    <Full>
      <Board x={60} y={130} w={1060} h={660} title="SOLUTION" f={f} />
      <g transform="translate(60,130)">
      <Row y={135} at={at.given} f={f}>
        <T x={40} y={0} size={46} color={C.yellow} anchor="start" weight={800}>①</T>
        <T x={110} y={0} size={50} color="#fff" anchor="start" weight={700}>Given: m = 500 kg,  F = 1000 N,  u = 0</T>
      </Row>
      <Row y={215} at={at.a} f={f}>
        <T x={40} y={0} size={46} color={C.yellow} anchor="start" weight={800}>②</T>
        <T x={110} y={0} size={56} color={OR} anchor="start" weight={800}>a = F ÷ m</T>
      </Row>
      <Row y={285} at={at.calc} f={f}>
        <T x={110} y={0} size={56} color="#fff" anchor="start" weight={700}>= 1000 N ÷ 500 kg</T>
      </Row>
      <Row y={360} at={at.res} f={f}>
        <T x={110} y={0} size={62} color={C.green} anchor="start" weight={800}>a = 2 m/s²</T>
        <rect x={480} y={-52} width={420} height={72} rx={36} fill="none" stroke={C.green} strokeWidth={5} opacity={0} />
      </Row>
      <Row y={455} at={at.v} f={f}>
        <T x={40} y={0} size={46} color={C.yellow} anchor="start" weight={800}>③</T>
        <T x={110} y={0} size={56} color={OR} anchor="start" weight={800}>v = u + a × t</T>
      </Row>
      <Row y={525} at={at.vcalc} f={f}>
        <T x={110} y={0} size={56} color="#fff" anchor="start" weight={700}>= 0 + 2 × 5</T>
      </Row>
      <Row y={605} at={at.vres} f={f}>
        <T x={110} y={0} size={62} color={C.green} anchor="start" weight={800}>v = 10 m/s</T>
        {f >= at.kmh - 10 && <T x={620} y={0} size={52} color={C.yellow} anchor="start" weight={800}>= 36 km/h</T>}
      </Row>
      </g>
      {/* right: live v-t graph, auto lane, gauge */}
      {!in14 && (
        <g transform="translate(1180,150)">
          <rect x={0} y={0} width={680} height={370} rx={36} fill="#0B1437" opacity={0.85} />
          <line x1={80} y1={310} x2={640} y2={310} stroke="#fff" strokeWidth={5} /><line x1={80} y1={310} x2={80} y2={40} stroke="#fff" strokeWidth={5} />
          <T x={360} y={356} size={30} weight={700}>time t (s)</T>
          <T x={36} y={170} size={28} weight={700} rot={-90}>v (m/s)</T>
          {[1, 2, 3, 4, 5].map((k) => <text key={k} x={80 + k * 100} y={338} fontFamily={FONT2} fontWeight={700} fontSize={26} fill="#9AA7C7" textAnchor="middle">{k}</text>)}
          {[0, 5, 10].map((k) => <text key={k} x={64} y={318 - k * 25} fontFamily={FONT2} fontWeight={700} fontSize={26} fill="#9AA7C7" textAnchor="end">{k}</text>)}
          <line x1={80} y1={310} x2={80 + tau * 100} y2={310 - v * 25} stroke={OR} strokeWidth={10} strokeLinecap="round" />
          <circle cx={80 + tau * 100} cy={310 - v * 25} r={14} fill={C.yellow} />
          <T x={470} y={110} size={44} color={C.yellow} weight={800}>v = {v.toFixed(1)} m/s</T>
          <T x={470} y={162} size={36} color={OR} weight={700}>t = {tau.toFixed(1)} s</T>
        </g>
      )}
      {in14 && <Gauge x={1520} y={340} kmh={needle} r={150} />}
      <Ground y={790} color="#13266F" h={90} x={1150} w={780} />
      <g>
        <Auto x={1290 + s * 14} y={790} s={0.9} wheelRot={s * 10} tilt={accel ? -2 : 0} />
        {accel > 0 && v > 0.4 && <SpeedLines x={1150} y={640} w={120 + v * 12} h={110} f={f} dir={1} n={5} opacity={0.4} />}
        <Arrow x1={1290 + s * 14 - 120} y1={610} x2={1290 + s * 14 + 20} y2={610} color={OR} w={18} label="F = 1000 N" labelSize={32} grow={f > simStart ? 1 : 0} />
      </g>
      {f >= o14 && <Confetti f={f} at={o14 + 14} n={36} />}
    </Full>
  );
};

export const Law2: React.FC = () => {
  const L = useL();
  const g = (id: string, w: string) => L(id).s + wordF(id, w);
  return (
    <AbsoluteFill>
      <Beat from="b1" pre={14}><B1 /></Beat>
      <Beat from="b2"><B2 /></Beat>
      <Beat from="b3"><B3 /></Beat>
      <Beat from="b4" to="b5"><B45 /></Beat>
      <Beat from="b7"><B7 /></Beat>
      <Beat from="b8"><B8 /></Beat>
      <Beat from="b9"><B9 /></Beat>
      <Beat from="b10" to="b14" enter="fade"><B10_14 /></Beat>
      {/* sound design */}
      <Sfx name="swish" at={L('b1').s + 30} vol={0.3} />
      <Sfx name="whoosh" at={L('b1').s + 32} vol={0.3} />
      <Sfx name="thud_soft" at={L('b1').s + 32} vol={0.4} />
      <Sfx name="thud" at={g('b2', 'cricket') + 34} vol={0.55} />
      <Sfx name="swish" at={g('b2', 'cricket') + 36} vol={0.3} />
      <Sfx name="pop_hi" at={g('b3', 'directly') - 6} vol={0.4} />
      <Sfx name="pop_hi" at={g('b3', 'inversely') - 6} vol={0.4} />
      {(['f', 'equals', 'm', 'times', 'a'] as const).map((w, i) => <Sfx key={w} name={i === 0 ? 'whoosh' : i === 1 ? 'thud_soft' : 'pop'} at={g('b4', w) + 1} vol={0.45} />)}
      <Sfx name="ding" at={g('b5', 'newtons')} vol={0.35} />
      <Sfx name="ding" at={g('b5', 'kilograms')} vol={0.35} />
      <Sfx name="ding" at={g('b5', 'metres')} vol={0.35} />
      {['momentum', 'force', 'constant', 'equals'].map((w, i) => <Sfx key={w} name={i === 3 ? 'ding' : 'pop_hi'} at={g('b7', w)} vol={0.35} />)}
      <Sfx name="pop" at={L('b8').s + 8} vol={0.35} />
      <Sfx name="pop" at={g('b8', 'mass')} vol={0.35} />
      <Sfx name="swish" at={L('b9').s + 4} vol={0.3} />
      {['five', 'thousand', 'rest', 'acceleration', 'seconds'].map((w) => <Sfx key={w} name="tap" at={g('b9', w)} vol={0.4} />)}
      <Sfx name="tap" at={g('b10', 'given') + 2} vol={0.4} />
      <Sfx name="tap" at={g('b12', 'a') + 2} vol={0.4} />
      <Sfx name="ding" at={g('b12', 'two')} vol={0.4} />
      <Sfx name="whoosh" at={L('b12').s + 30} vol={0.3} />
      <Sfx name="tap" at={L('b13').s + 4} vol={0.4} />
      <Sfx name="ding" at={g('b13', 'ten')} vol={0.4} />
      <Sfx name="tada" at={L('b14').s + 14} vol={0.4} />
    </AbsoluteFill>
  );
};
