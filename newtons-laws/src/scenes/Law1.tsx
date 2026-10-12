import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Beat, Full, Sfx, useBeat, useL} from '../kit/core';
import {Newt} from '../kit/Newt';
import {CarromCoin, Football, Ground, IronBall, Kid} from '../kit/props';
import {Arrow, Chip, Confetti, Dust, Spark, SpeedLines, T, shake} from '../kit/shapes';
import {clamp, ease, easeIn, easeOut, seeded, sp, squash} from '../kit/anim';
import {BusRide, busX} from './Hook';
import {wordF, lineById} from '../data';
import {C, FONT2} from '../theme';

const BLUE = C.blue;

/* ---------- a1: title ---------- */
const A1: React.FC = () => {
  const {f} = useBeat();
  const v = sp(f, 4, {damping: 9, stiffness: 140});
  const v2 = sp(f, 14, {damping: 10, stiffness: 140});
  const [sx, sy] = squash(f, 8, 0.15, 0.14, 0.7);
  return (
    <Full>
      <Newt x={420} y={800} s={1.6} mood="cheer" armL={10} armR={135 + Math.sin(f / 3) * 22} sx={sx} sy={sy} />
      <g transform={`translate(1000,430) scale(${clamp(v, 0, 1.1)})`}>
        <T x={0} y={0} size={230} color={BLUE} anchor="start" stroke weight={800}>LAW 1</T>
      </g>
      <g transform={`translate(1004,560) scale(${clamp(v2, 0, 1.1)})`} style={{transformOrigin: '0 0'}}>
        <T x={0} y={0} size={104} color="#fff" anchor="start" stroke weight={800}>The Law of Inertia</T>
      </g>
      <Spark x={1230} y={300} f={f} at={10} color={BLUE} n={12} r0={150} r1={260} />
    </Full>
  );
};

/* ---------- a2: kinetic typography ---------- */
const KEY = [
  {w: 'rest', t: 'AT REST', color: BLUE, icon: 'rest'},
  {w: 'straight', t: 'STRAIGHT LINE', color: BLUE, icon: 'line'},
  {w: 'constant', t: 'CONSTANT SPEED', color: BLUE, icon: 'speed'},
  {w: 'unbalanced', t: 'UNBALANCED FORCE', color: C.red, icon: 'force'},
];
const Icon: React.FC<{k: string; color: string; f: number}> = ({k, color, f}) => {
  if (k === 'rest') return <g><circle cy={-6} r={26} fill={color} /><rect x={-44} y={22} width={88} height={8} rx={4} fill="#fff" opacity={0.8} /></g>;
  if (k === 'line') return <g stroke={color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none"><path d="M-44 0 H40 M20 -18 L42 0 L20 18" /></g>;
  if (k === 'speed') return <g stroke={color} strokeWidth={9} strokeLinecap="round" fill="none"><path d="M-44 -16 H44 M-44 16 H44" /></g>;
  return <g><path d="M-46 0 H20" stroke={color} strokeWidth={12} strokeLinecap="round" /><polygon points="14,-24 46,0 14,24" fill={color} /><circle cx={-50 - Math.sin(f / 3) * 4} cy={0} r={9} fill="#fff" /></g>;
};
const A2: React.FC = () => {
  const {f} = useBeat();
  const ts = KEY.map((k) => wordF('a2', k.w) - 2);
  const active = ts.reduce((a, t, i) => (f >= t ? i : a), -1);
  return (
    <Full>
      {KEY.map((k, i) => {
        const v = sp(f, ts[i], {damping: 9, stiffness: 150});
        const [sx, sy] = squash(f, ts[i] + 3, 0.1, 0.14, 0.8);
        const act = active === i;
        const y = 270 + i * 135;
        return (
          <g key={k.w} transform={`translate(${900},${y}) scale(${clamp(v, 0, 1.15) * sx * (act ? 1.04 : 1)},${clamp(v, 0, 1.15) * sy * (act ? 1.04 : 1)})`} opacity={clamp(v * 2)}>
            <rect x={-520} y={-58} width={1040} height={116} rx={58} fill="#0B1437" stroke={k.color} strokeWidth={act ? 8 : 4} opacity={act ? 1 : 0.9} />
            <circle cx={-450} cy={0} r={46} fill="#fff" opacity={0.12} />
            <g transform="translate(-450,0)"><Icon k={k.icon} color={k.color === C.red ? C.red : '#8DBBFF'} f={f} /></g>
            <T x={-370} y={26} size={78} color={k.color === C.red ? C.red : '#fff'} anchor="start" weight={800}>{k.t}</T>
          </g>
        );
      })}
      <Newt x={1650} y={800} s={1.1} mood={active === 3 ? 'worried' : 'think'} look={[-1, -0.4]} armL={30} armR={30} />
    </Full>
  );
};

/* ---------- a3: tug of war ---------- */
const A3: React.FC = () => {
  const {f} = useBeat();
  const tU = wordF('a3', 'unbalanced');
  const ph = ease(f, tU + 2, tU + 34, 0, 1);
  const knot = 960 + ph * 130;
  const right = 50 + 30 * ph;
  const lean = 12 + 4 * ph;
  const gnd = 790;
  const bal = f < tU;
  const kidsL = [{x: 330 + ph * 130, c: BLUE}, {x: 520 + ph * 130, c: '#5AA2FF'}];
  const kidsR = [{x: 1400 + ph * 130, c: C.orange}, {x: 1590 + ph * 130, c: '#FFB35C'}];
  const jig = bal ? Math.sin(f * 1.3) * 2 : 0;
  return (
    <Full>
      <Ground y={gnd} color="#13266F" h={120} />
      <line x1={kidsL[1].x + 40} y1={604} x2={kidsR[0].x - 40} y2={604 + jig} stroke="#E8C28A" strokeWidth={14} strokeLinecap="round" />
      <g transform={`translate(${knot},${604 + jig})`}><polygon points="0,-8 54,22 0,52" fill={C.red} /><rect x={-5} y={-8} width={10} height={64} fill="#fff" /></g>
      {kidsL.map((k, i) => <Kid key={i} x={k.x} y={gnd} s={1.3} shirt={k.c} lean={-lean} armL={-78} armR={78} />)}
      {kidsR.map((k, i) => <Kid key={i} x={k.x} y={gnd} s={1.3} shirt={k.c} lean={lean} armL={78} armR={-78} />)}
      <Arrow x1={knot - 40} y1={470} x2={knot - 40 - 250} y2={470} color={BLUE} w={22} label="50 N" labelSize={52} grow={sp(f, 4, {damping: 14})} labelSide={-1} />
      <Arrow x1={knot + 40} y1={470} x2={knot + 40 + 250 * (right / 50) * 0.8 + 30} y2={470} color={C.orange} w={22 + ph * 8} label={`${Math.round(right)} N`} labelSize={52} grow={sp(f, 8, {damping: 14})} labelSide={-1} />
      <Chip x={960} y={200} text={bal ? 'BALANCED  →  no change' : 'UNBALANCED  →  motion changes'} size={56} color={bal ? C.green : C.red} scale={clamp(sp(bal ? f : f - tU, 2), 0, 1.1)} />
      {!bal && <Chip x={knot} y={330} text={`net force = ${Math.round(right) - 50} N →`} size={44} color={C.red} opacity={clamp(ph * 3)} />}
    </Full>
  );
};

/* ---------- a4: bus replay with labels ---------- */
const A4: React.FC = () => {
  const {f, dur} = useBeat();
  const brakeAt = Math.round(dur * 0.5);
  const x = busX(f, brakeAt);
  const braked = f >= brakeAt;
  const [shx, shy] = shake(f, brakeAt + 1, 12, 14);
  const k = sp(f, brakeAt + 6, {damping: 9, stiffness: 160});
  return (
    <Full>
      <g transform={`translate(${shx},${shy})`}><BusRide f={f} brakeAt={brakeAt} /></g>
      {!braked && <Chip x={x + 40} y={250} text="Body moves WITH the bus  →" size={46} color={BLUE} scale={clamp(sp(f, 3), 0, 1.1)} />}
      {braked && (
        <>
          <Chip x={x - 240} y={250} text="Bus stops!" size={52} color={C.red} scale={clamp(k, 0, 1.1)} />
          <Arrow x1={x - 10} y1={540} x2={x + 300} y2={540} color={BLUE} w={20} grow={clamp(k)} />
          <Chip x={x + 120} y={300} text="Body keeps going  →" size={46} color={BLUE} scale={clamp(k, 0, 1.1)} />
        </>
      )}
    </Full>
  );
};

/* ---------- a5: INERTIA letters ---------- */
const A5: React.FC = () => {
  const {f} = useBeat();
  const word = 'INERTIA'.split('');
  return (
    <Full>
      <g transform="translate(960,430)">
        {word.map((ch, i) => {
          const at = 4 + i * 4;
          const v = sp(f, at, {damping: 8, stiffness: 190});
          const [sx, sy] = squash(f, at + 2, 0.16, 0.16, 0.8);
          return <g key={i} transform={`translate(${(i - 3) * 190},${(1 - Math.min(1, v)) * -220}) scale(${clamp(v, 0, 1.2) * sx},${clamp(v, 0, 1.2) * sy})`}><T x={0} y={0} size={250} color={i % 2 ? '#8DBBFF' : BLUE} stroke weight={800}>{ch}</T></g>;
        })}
      </g>
      <rect x={290} y={480} width={ease(f, 36, 60, 0, 1340)} height={10} rx={5} fill={C.yellow} />
      <Chip x={960} y={600} text="= resisting any change in motion" size={54} color={C.yellow} scale={clamp(sp(f, 48), 0, 1.1)} />
      <Newt x={300} y={800} s={1.0} mood="happy" armL={60} armR={20} />
      <Newt x={1640} y={800} s={1.0} mood="think" flip armL={20} armR={60} />
    </Full>
  );
};

/* ---------- a6: inertia of rest: three demos ---------- */
const Panel: React.FC<{x: number; title: string; active: boolean; f: number; at: number; children: React.ReactNode}> = ({x, title, active, f, at, children}) => {
  const v = sp(f, at, {damping: 13, stiffness: 120});
  return (
    <g transform={`translate(${x},0)`} opacity={(active ? 1 : 0.38) * clamp(v * 2)}>
      <rect x={-290} y={235} width={580} height={540} rx={44} fill="#0B1437" stroke={active ? BLUE : '#33448F'} strokeWidth={active ? 7 : 3} />
      <T x={0} y={300} size={46} color={active ? '#fff' : '#9AA7C7'} weight={800}>{title}</T>
      <g transform="translate(0,-70)">{children}</g>
    </g>
  );
};
const A6: React.FC = () => {
  const {f} = useBeat();
  const t1 = wordF('a6', 'yank'), t2 = wordF('a6', 'flick'), t3 = wordF('a6', 'beat');
  const act = f >= t3 - 6 ? 2 : f >= t2 - 6 ? 1 : 0;
  // panel 1: tablecloth
  const e1 = f - t1;
  const cloth = e1 < 0 ? 0 : easeIn(e1, 4, 12, 0, 760);
  const jiggle = e1 > 10 ? Math.sin((e1 - 10) * 1.3) * 2.2 * Math.exp(-(e1 - 10) / 10) : 0;
  // panel 2: coin & card
  const e2 = f - t2;
  const card = e2 < 4 ? 0 : easeIn(e2, 4, 14, 0, 520);
  const coinY = e2 < 10 ? 0 : easeIn(e2, 10, 20, 0, 98);
  const [csx, csy] = squash(f, t2 + 20, 0.3, 0.2, 0.9);
  // panel 3: carpet
  const e3 = f - t3;
  const hit = e3 < 0 ? 0 : Math.abs(Math.sin(e3 * 0.42));
  const stick = e3 < 0 ? -10 : -30 + hit * 62;
  const shakeC = e3 < 0 ? 0 : Math.sin(e3 * 0.84) * 6 * Math.exp(-((e3 % 15) / 8));
  return (
    <Full>
      <Chip x={960} y={170} text="INERTIA OF REST" size={56} color={BLUE} scale={clamp(sp(f, 2), 0, 1.1)} />
      <Panel x={330} title="Tablecloth trick" active={act === 0} f={f} at={4}>
        <rect x={-250} y={640} width={500} height={24} rx={8} fill={C.wood} /><rect x={-210} y={664} width={22} height={90} fill={C.woodDark} /><rect x={188} y={664} width={22} height={90} fill={C.woodDark} />
        <g transform={`translate(${-cloth},0)`} opacity={1 - clamp((cloth - 520) / 200)}><rect x={-250} y={630} width={500} height={14} fill="#FF7A7A" /><path d={`M-250 630 H250 V690 H-250 Z`} fill="#FF7A7A" opacity={0.0} /><rect x={-250} y={644} width={500} height={52} fill="#FFB0B0" opacity={0.9} />{[-200, -120, -40, 40, 120, 200].map((cx) => <rect key={cx} x={cx - 10} y={630} width={20} height={66} fill="#fff" opacity={0.35} />)}</g>
        <g transform={`rotate(${jiggle} 0 626)`}>
          {[0, 1, 2].map((i) => <ellipse key={i} cx={-60} cy={618 - i * 12} rx={72} ry={12} fill="#F4F6FF" stroke="#B8C2E8" strokeWidth={3} />)}
          <rect x={60} y={560} width={56} height={66} rx={8} fill="#BFE6FF" opacity={0.85} />
        </g>
        {e1 > 4 && e1 < 14 && <SpeedLines x={-250} y={640} w={500} h={50} f={f} dir={-1} n={5} />}
        {e1 > 18 && <Chip x={0} y={800} text="plates stay put!" size={36} color={C.green} scale={clamp(sp(e1, 18), 0, 1.1)} />}
      </Panel>
      <Panel x={960} title="Coin on a card" active={act === 1} f={f} at={10}>
        <path d="M-60 600 L-50 712 H50 L60 600" fill="#BFE6FF" opacity={0.3} stroke="#BFE6FF" strokeWidth={6} />
        <g transform={`translate(${card},0)`}><rect x={-90} y={590} width={180} height={10} rx={4} fill="#FFD23F" /></g>
        <g transform={`translate(0,${coinY})`}><CarromCoin x={0} y={566} r={24} sx={coinY > 95 ? csx : 1} sy={coinY > 95 ? csy : 1} /></g>
        {e2 > 2 && e2 < 16 && <SpeedLines x={0} y={585} w={420} h={30} f={f} dir={1} n={3} />}
        {e2 > 22 && <Chip x={0} y={800} text="drops straight down!" size={36} color={C.green} scale={clamp(sp(e2, 22), 0, 1.1)} />}
        <circle cx={-120 + Math.min(0, e2 * 0)} cy={596} r={0} />
      </Panel>
      <Panel x={1590} title="Beating a carpet" active={act === 2} f={f} at={16}>
        <line x1={-230} y1={380} x2={230} y2={380} stroke="#9AA7C7" strokeWidth={8} /><rect x={-244} y={370} width={14} height={380} fill="#5A6486" /><rect x={230} y={370} width={14} height={380} fill="#5A6486" />
        <g transform={`translate(${shakeC},0)`}>
          <rect x={-130} y={382} width={260} height={300} rx={10} fill="#B5383F" />
          <rect x={-110} y={402} width={220} height={260} rx={6} fill="none" stroke="#FFD23F" strokeWidth={6} /><rect x={-80} y={432} width={160} height={200} rx={4} fill="#2B4EC9" opacity={0.7} />
        </g>
        <g transform={`translate(190,520) rotate(${stick} 60 0)`}><rect x={-120} y={-8} width={180} height={16} rx={8} fill={C.woodDark} /></g>
        {e3 > 0 && Array.from({length: 14}).map((_, i) => {
          const ph0 = (e3 * 0.6 + i * 7) % 40;
          return <circle key={i} cx={-130 + seeded(i) * 260 + Math.sin(ph0 / 5 + i) * 14} cy={600 + ph0 * 3.4} r={7 + seeded(i + 4) * 8} fill="#D9C7A3" opacity={clamp(1 - ph0 / 40) * 0.8} />;
        })}
        {e3 > 20 && <Chip x={0} y={800} text="dust falls out!" size={36} color={C.green} scale={clamp(sp(e3, 20), 0, 1.1)} />}
      </Panel>
    </Full>
  );
};

/* ---------- a7: inertia of motion (runner) ---------- */
const A7: React.FC = () => {
  const {f, dur} = useBeat();
  const tape = 1120, tb = Math.round(dur * 0.42);
  const x = f < tb ? ease(f, 0, tb, 120, tape, (t) => t) : tape + easeOut(f, tb, dur, 0, 380);
  const vel = f < tb ? (tape - 120) / tb : Math.max(0, 14 * (1 - (f - tb) / (dur - tb)));
  const hop = Math.abs(Math.sin(f * 0.55)) * (vel > 2 ? 16 : 0);
  const lean = f < tb ? 10 : 6 - ease(f, tb, dur, 0, 14);
  const [sx, sy] = squash(f, tb, 0.08, 0.1, 0.5);
  return (
    <Full>
      <Ground y={790} color="#13266F" h={120} />
      {Array.from({length: 8}).map((_, i) => <rect key={i} x={tape - 12} y={600 + i * 24} width={24} height={24} fill={i % 2 ? '#fff' : '#0B1437'} stroke="#fff" strokeWidth={2} />)}
      <rect x={tape - 160} y={520} width={320} height={64} rx={14} fill="#0B1437" stroke={C.red} strokeWidth={6} /><T x={tape} y={566} size={46} color={C.red} weight={800}>FINISH</T>
      <Kid x={x} y={790 - hop} s={1.5} shirt={BLUE} lean={lean} armL={55} armR={-70} sx={sx} sy={sy} />
      {vel > 2 && <SpeedLines x={x - 420} y={560} w={380} h={200} f={f} dir={1} n={6} opacity={0.5} />}
      <Dust x={x - 40} y={790} f={f} at={tb + 2} n={9} size={28} spread={150} />
      <Chip x={620} y={220} text="INERTIA OF MOTION" size={56} color={BLUE} scale={clamp(sp(f, 2), 0, 1.1)} />
      {f > tb + 8 && <Arrow x1={x + 100} y1={440} x2={x + 330} y2={440} color={BLUE} w={20} label="keeps moving" labelSize={42} grow={clamp(sp(f, tb + 8))} />}
      <Confetti f={f} at={tb} n={14} />
    </Full>
  );
};

/* ---------- a8: inertia of direction (top view of an auto turning) ---------- */
const A8: React.FC = () => {
  const {f, dur} = useBeat();
  const t0 = Math.round(dur * 0.3), t1 = Math.round(dur * 0.78);
  const R = 230, cx = 760 - R, cy = 640;
  const th = ease(f, t0, t1, 0, Math.PI / 2, (t) => t);
  let px: number, py: number, rot: number;
  if (f < t0) { px = 760; py = ease(f, 0, t0, 960, cy, (t) => t); rot = 0; }
  else if (f <= t1) { px = cx + R * Math.cos(th); py = cy - R * Math.sin(th); rot = -(th * 180) / Math.PI; }
  else { px = cx - ease(f, t1, dur, 0, 160); py = cy - R; rot = -90; }
  const slide = ease(f, t0 + 2, t1, 0, 36);
  const roadW = 190;
  return (
    <Full>
      <path d={`M760 920 V${cy} A${R} ${R} 0 0 0 ${cx} ${cy - R} H-100`} fill="none" stroke="#1B2C7A" strokeWidth={roadW} strokeLinecap="butt" />
      <path d={`M760 920 V${cy} A${R} ${R} 0 0 0 ${cx} ${cy - R} H-100`} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={6} strokeDasharray="34 30" />
      <g transform={`translate(${px},${py}) rotate(${rot})`}>
        <rect x={-48} y={-80} width={96} height={160} rx={28} fill="#FFC21A" />
        <rect x={-40} y={-30} width={80} height={96} rx={20} fill="#232A44" />
        <rect x={-30} y={-72} width={60} height={30} rx={10} fill="#BFE6FF" />
        <circle cx={slide - 0} cy={10} r={22} fill={C.teal} stroke="#13265E" strokeWidth={5} />
        <circle cx={slide - 7} cy={6} r={4} fill="#13265E" /><circle cx={slide + 7} cy={6} r={4} fill="#13265E" />
      </g>
      {f > t0 && <g><line x1={760} y1={cy} x2={760} y2={cy - 250} stroke={C.yellow} strokeWidth={8} strokeDasharray="18 16" strokeLinecap="round" opacity={clamp((f - t0) / 8)} /><polygon points={`740,${cy - 250} 760,${cy - 285} 780,${cy - 250}`} fill={C.yellow} opacity={clamp((f - t0) / 8)} /></g>}
      <Chip x={1300} y={300} text="Auto turns LEFT  ←" size={54} color={C.orange} scale={clamp(sp(f, t0), 0, 1.1)} />
      <Chip x={1300} y={420} text="You slide RIGHT  →" size={54} color={BLUE} scale={clamp(sp(f, t0 + 10), 0, 1.1)} />
      <Chip x={1300} y={560} text="Body wants to go straight" size={44} color={C.yellow} scale={clamp(sp(f, t0 + 20), 0, 1.1)} />
      <Chip x={560} y={170} text="INERTIA OF DIRECTION" size={50} color={BLUE} scale={clamp(sp(f, 2), 0, 1.1)} />
    </Full>
  );
};

/* ---------- a9: heavy vs light ---------- */
const A9: React.FC = () => {
  const {f, dur} = useBeat();
  const go = 18;
  const coinX = 330 + (f < go ? 0 : easeOut(f, go, go + 20, 0, 480));
  const ironX = 1250 + (f < go ? 0 : easeOut(f, go, go + 60, 0, 40));
  const push = f < go ? ease(f, 4, go, 0, 1) : ease(f, go, go + 6, 1, 0);
  const [csx] = squash(f, go, 0.1, 0.2, 0.9);
  return (
    <Full>
      <line x1={960} y1={200} x2={960} y2={790} stroke="#33448F" strokeWidth={6} strokeDasharray="20 16" />
      <Ground y={700} color="#13266F" h={110} x={-100} w={2120} />
      <T x={480} y={230} size={54} color="#fff" weight={800}>LIGHT: carrom coin</T>
      <T x={1440} y={230} size={54} color="#fff" weight={800}>HEAVY: iron ball</T>
      <CarromCoin x={coinX} y={656} r={44} sx={f > go && f < go + 8 ? 1.2 : 1} sy={f > go && f < go + 8 ? 0.85 : 1} />
      <IronBall x={ironX} y={610} r={90} />
      <Arrow x1={coinX - 230 - ((coinX - 330) * 0.0)} y1={660} x2={coinX - 60 - ((coinX - 330) * 0)} y2={660} color={C.yellow} w={20} label="20 N push" labelSize={38} grow={push} />
      <Arrow x1={ironX - 380} y1={610} x2={ironX - 110} y2={610} color={C.yellow} w={20} label="20 N push" labelSize={38} grow={push} />
      {f > go + 10 && <SpeedLines x={coinX - 400} y={620} w={320} h={80} f={f} dir={1} n={4} />}
      {f > go + 24 && <Chip x={480} y={470} text="small inertia → zooms off" size={38} color={C.green} scale={clamp(sp(f, go + 24), 0, 1.1)} />}
      {f > go + 30 && <Chip x={1440} y={470} text="BIG inertia → barely moves" size={38} color={C.red} scale={clamp(sp(f, go + 30), 0, 1.1)} />}
      {f > dur * 0.6 && <Chip x={960} y={765} text="More mass = more inertia" size={50} color={BLUE} scale={clamp(sp(f, dur * 0.6), 0, 1.1)} />}
    </Full>
  );
};

/* ---------- a10: seatbelts ---------- */
const A10: React.FC = () => {
  const {f, dur} = useBeat();
  const crash = Math.round(dur * 0.32), replay = Math.round(dur * 0.62);
  const wallX = 1360;
  const slow = (t: number) => (t < crash ? t : crash + (t - crash) * 0.28);
  const phase1 = f < replay;
  const tt = phase1 ? slow(f) : slow(f - replay + 0);
  const belt = !phase1;
  const carX = tt < crash ? ease(tt, 0, crash, 100, wallX - 520, (t) => t) : wallX - 520 - ease(tt, crash, crash + 6, 0, 24);
  const lurch = tt < crash ? 0 : sp(tt, crash, {damping: 9, stiffness: 120}) * (belt ? 14 : 90);
  const [shx, shy] = shake(tt, crash, 14, 10);
  const [csx, csy] = squash(tt, crash, 0.1, 0.25, 0.9);
  const frozen = !phase1 ? false : f > crash + 14;
  return (
    <Full>
      <g transform={`translate(${shx},${shy})`}>
        <Ground y={760} color="#13266F" h={120} />
        <rect x={wallX} y={380} width={160} height={400} fill="#5A6486" />
        {Array.from({length: 6}).map((_, i) => <rect key={i} x={wallX} y={400 + i * 66} width={160} height={6} fill="#2A3150" opacity={0.6} />)}
        <g transform={`translate(${carX},760) scale(${csx},${csy})`}>
          <ellipse cx={230} cy={0} rx={290} ry={12} fill="#000" opacity={0.25} />
          <rect x={60} y={-250} width={290} height={140} rx={20} fill="#BFE6FF" opacity={0.25} />
          <Newt x={170 + lurch * 0.5} y={-86} s={0.62} mood={tt >= crash && !belt ? 'surprised' : 'happy'} armL={70} armR={70} rot={lurch * 0.28} bob={false} />
          {belt && <path d={`M120 -240 L${190 + lurch * 0.4} -150 L190 -92`} stroke={C.green} strokeWidth={16} fill="none" strokeLinecap="round" />}
          <path d="M-40 -110 H500 Q540 -110 540 -70 V-30 H-40 Z" fill="#E8473F" />
          <path d="M20 -110 L70 -260 H330 L420 -110 Z" fill="none" stroke="#E8473F" strokeWidth={14} strokeLinejoin="round" />
          <circle cx={90} cy={-20} r={52} fill="#1B2347" /><circle cx={90} cy={-20} r={26} fill="#C9D3F5" />
          <circle cx={400} cy={-20} r={52} fill="#1B2347" /><circle cx={400} cy={-20} r={26} fill="#C9D3F5" />
        </g>
        <Spark x={wallX} y={560} f={tt} at={crash} n={12} r0={30} r1={150} />
        {tt > crash && tt < crash + 10 && <Dust x={wallX - 20} y={760} f={tt} at={crash} n={8} size={32} spread={120} />}
      </g>
      {phase1 && f > crash && <Chip x={640} y={250} text="Car stops" size={50} color={C.red} scale={clamp(sp(f, crash + 2), 0, 1.1)} />}
      {phase1 && f > crash + 10 && <Chip x={1000} y={160} text="Body keeps moving!" size={50} color={BLUE} scale={clamp(sp(f, crash + 10), 0, 1.1)} />}
      {belt && <Chip x={720} y={200} text="Seatbelt = the unbalanced force that stops you" size={42} color={C.green} scale={clamp(sp(f, replay + 2), 0, 1.1)} />}
      {belt && f > replay + 40 && <Chip x={960} y={880 - 90} text="✔  ALWAYS BUCKLE UP!" size={54} color={C.green} scale={clamp(sp(f, replay + 40), 0, 1.1)} />}
      {frozen && <rect x={0} y={0} width={0} height={0} />}
    </Full>
  );
};

export const Law1: React.FC = () => {
  const L = useL();
  const g = (id: string, w: string) => L(id).s + wordF(id, w);
  return (
    <AbsoluteFill>
      <Beat from="a1" pre={14}><A1 /></Beat>
      <Beat from="a2"><A2 /></Beat>
      <Beat from="a3"><A3 /></Beat>
      <Beat from="a4" enter="fade"><A4 /></Beat>
      <Beat from="a5"><A5 /></Beat>
      <Beat from="a6"><A6 /></Beat>
      <Beat from="a7" enter="fade"><A7 /></Beat>
      <Beat from="a8" enter="fade"><A8 /></Beat>
      <Beat from="a9"><A9 /></Beat>
      <Beat from="a10" enter="fade"><A10 /></Beat>
      {/* quiet sound design */}
      <Sfx name="pop" at={L('a1').s + 4} vol={0.45} />
      <Sfx name="ding" at={L('a1').s + 14} vol={0.3} />
      {['rest', 'straight', 'constant', 'unbalanced'].map((w, i) => <Sfx key={w} name={i === 3 ? 'thud_soft' : 'pop_hi'} at={g('a2', w) - 2} vol={0.4} />)}
      <Sfx name="pop" at={L('a3').s + 4} vol={0.35} />
      <Sfx name="whoosh" at={g('a3', 'unbalanced') + 4} vol={0.3} />
      <Sfx name="whoosh" at={L('a4').s} vol={0.3} />
      <Sfx name="thud" at={L('a4').s + Math.round(L('a4').dur * 0.5)} vol={0.6} />
      {'INERTIA'.split('').map((_, i) => <Sfx key={i} name="tap" at={L('a5').s + 6 + i * 4} vol={0.35} />)}
      <Sfx name="ding" at={L('a5').s + 40} vol={0.3} />
      <Sfx name="whoosh" at={g('a6', 'yank') + 4} vol={0.4} />
      <Sfx name="thud_soft" at={g('a6', 'yank') + 14} vol={0.35} />
      <Sfx name="swish" at={g('a6', 'flick') + 4} vol={0.35} />
      <Sfx name="pop" at={g('a6', 'flick') + 20} vol={0.4} />
      {[0, 1, 2, 3].map((i) => <Sfx key={i} name="thud_soft" at={g('a6', 'beat') + 4 + i * 15} vol={0.25} />)}
      <Sfx name="swish" at={L('a7').s + 4} vol={0.3} />
      <Sfx name="pop_hi" at={L('a7').s + Math.round(L('a7').dur * 0.42)} vol={0.45} />
      <Sfx name="whoosh" at={L('a8').s + Math.round(L('a8').dur * 0.3)} vol={0.35} />
      <Sfx name="pop" at={L('a9').s + 18} vol={0.4} />
      <Sfx name="thud_soft" at={L('a9').s + 70} vol={0.3} />
      <Sfx name="whoosh" at={L('a10').s} vol={0.3} />
      <Sfx name="thud" at={L('a10').s + Math.round(L('a10').dur * 0.32)} vol={0.75} />
      <Sfx name="ding" at={L('a10').s + Math.round(L('a10').dur * 0.62) + 40} vol={0.4} />
    </AbsoluteFill>
  );
};
