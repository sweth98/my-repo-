import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Beat, Full, Sfx, useL, useBeat} from '../kit/core';
import {Newt} from '../kit/Newt';
import {Auto, Ground, CricketBall, Rocket} from '../kit/props';
import {Chip, Confetti, Dust, Spark, SpeedLines, T, shake} from '../kit/shapes';
import {clamp, ease, easeOut, seeded, sp, squash} from '../kit/anim';
import {C, FONT2} from '../theme';

const GROUND = 800;

const Skyline: React.FC<{f: number; speed: number}> = ({f, speed}) => (
  <g>
    {Array.from({length: 16}).map((_, i) => {
      const w = 130 + seeded(i) * 110, h = 160 + seeded(i + 3) * 260;
      const x = (((i * 200 - f * speed) % 3200) + 3200) % 3200 - 300;
      return (
        <g key={i}>
          <rect x={x} y={GROUND - h} width={w} height={h} fill="#14246B" />
          {Array.from({length: Math.floor(h / 70)}).map((_, k) => <rect key={k} x={x + 18} y={GROUND - h + 20 + k * 60} width={w - 36} height={22} rx={6} fill="#27409C" opacity={0.7} />)}
        </g>
      );
    })}
  </g>
);

/** cut-away bus with Newt inside; brakeAt = beat frame when the driver brakes */
export const busX = (f: number, brakeAt: number) => {
  const v = 1500 / brakeAt;
  const tau = clamp(f - brakeAt, 0, 12);
  return f < brakeAt ? -760 + v * f : -760 + v * brakeAt + v * (tau - (tau * tau) / 24);
};
export const BusRide: React.FC<{f: number; brakeAt: number}> = ({f, brakeAt}) => {
  const v = 1500 / brakeAt;
  const tau = clamp(f - brakeAt, 0, 12);
  const x = f < brakeAt ? -760 + v * f : -760 + v * brakeAt + v * (tau - (tau * tau) / 24);
  const moving = f < brakeAt + 12;
  const lurch = sp(f, brakeAt + 1, {damping: 7, stiffness: 160}) * 30;
  const tilt = sp(f, brakeAt, {damping: 10, stiffness: 200}) * 1.8;
  const [bsx, bsy] = squash(f, brakeAt, 0.04, 0.2, 0.7);
  const wheelRot = x * 0.45;
  const braked = f >= brakeAt;
  return (
    <g>
      <Skyline f={moving ? f : brakeAt + 12} speed={moving ? 3.2 : 0} />
      <Ground y={GROUND} color="#0E1A52" h={140} dash={moving ? f * 36 : (brakeAt + 6) * 36} />
      <g transform={`translate(${x},${GROUND}) scale(${bsx},${bsy}) rotate(${tilt} 0 -70)`}>
        <ellipse cx="0" cy="0" rx="470" ry="14" fill="#000" opacity="0.25" />
        <rect x="-440" y="-400" width="880" height="330" rx="44" fill="#E8473F" />
        <rect x="-418" y="-376" width="836" height="286" rx="26" fill="#FFF3D6" />
        {[-380, -250, -120, 10, 140, 270].map((wx, i) => <rect key={i} x={wx} y={-352} width={110} height={96} rx={14} fill="#BFE6FF" />)}
        <rect x="-418" y="-110" width="836" height="22" fill="#CDBB96" />
        <rect x="-400" y="-330" width="800" height="10" rx="5" fill="#C9D3F5" />
        {[-250, -120, 150].map((hx, i) => <g key={i}><line x1={hx} y1={-324} x2={hx} y2={-292} stroke="#C9D3F5" strokeWidth="6" /><circle cx={hx} cy={-280} r={15} fill="none" stroke="#FF5470" strokeWidth="7" /></g>)}
        <rect x="-424" y="-100" width="860" height="26" fill="#FFF3D6" opacity="0.9" />
        <text x="260" y="-396" fontFamily={FONT2} fontWeight={800} fontSize={0} fill="#fff">.</text>
        <circle cx="440" cy="-130" r="20" fill="#FFF3A8" />
        <Newt x={-60} y={-92} s={0.95} mood={braked ? 'surprised' : 'happy'} look={braked ? [1, 0] : [0.4, 0]} armL={braked ? 150 : 165} armR={braked ? 150 : 40} rot={lurch} sx={1 + lurch * 0.002} sy={1 - lurch * 0.002} />
        <rect x="-420" y="-110" width="40" height="40" fill="none" />
        <rect x="-424" y="-80" width="860" height="14" fill="#B5362F" />
        <g><circle cx="-280" cy="-70" r="62" fill="#1B2347" /><circle cx="-280" cy="-70" r="34" fill="#C9D3F5" /><g transform={`rotate(${wheelRot} -280 -70)`}><line x1="-308" y1="-70" x2="-252" y2="-70" stroke="#1B2347" strokeWidth="8" /><line x1="-280" y1="-98" x2="-280" y2="-42" stroke="#1B2347" strokeWidth="8" /></g></g>
        <g><circle cx="280" cy="-70" r="62" fill="#1B2347" /><circle cx="280" cy="-70" r="34" fill="#C9D3F5" /><g transform={`rotate(${wheelRot} 280 -70)`}><line x1="252" y1="-70" x2="308" y2="-70" stroke="#1B2347" strokeWidth="8" /><line x1="280" y1="-98" x2="280" y2="-42" stroke="#1B2347" strokeWidth="8" /></g></g>
      </g>
      {moving && f < brakeAt && <SpeedLines x={0} y={380} w={560} h={300} f={f} dir={1} opacity={0.45} />}
      <Dust x={x + 300} y={GROUND} f={f} at={brakeAt + 1} n={9} size={30} spread={170} />
      <Dust x={x - 280} y={GROUND} f={f} at={brakeAt + 1} n={7} size={26} spread={140} />
    </g>
  );
};

const H1: React.FC = () => {
  const {f, dur} = useBeat();
  const brakeAt = dur - 26;
  const [sx, sy] = shake(f, brakeAt + 1, 16, 16);
  const q = sp(f, brakeAt + 10, {damping: 8, stiffness: 200});
  return (
    <Full>
      <g transform={`translate(${sx},${sy})`}>
        <BusRide f={f} brakeAt={brakeAt} />
      </g>
      {f > brakeAt + 8 && <g transform={`translate(1280,330) scale(${q})`}><Chip x={0} y={0} text="?!" size={96} color={C.yellow} /></g>}
    </Full>
  );
};

const H2: React.FC = () => {
  const {f, dur} = useBeat();
  // slow-motion replay: the same braking moment at 30% speed
  const t = 70 + f * 0.3;
  const who = [0, 1, 2].map((i) => sp(f, 22 + i * 9, {damping: 9, stiffness: 160}));
  return (
    <Full>
      <BusRide f={t} brakeAt={70} />
      <Chip x={330} y={190} text="◀◀ SLOW-MO REPLAY" size={46} color={C.red} rot={-3} scale={sp(f, 2)} />
      {['?', '?', '?'].map((q, i) => <T key={i} x={640 + i * 180} y={300 - (i % 2) * 40 + Math.sin((f + i * 7) / 6) * 8} size={90} color={C.yellow} stroke opacity={clamp(who[i])}>{q}</T>)}
      <Chip x={960} y={150} text="Who pushed me?" size={58} color={C.yellow} scale={clamp(sp(f, 14), 0, 1.1)} opacity={ease(f, dur - 12, dur, 1, 0)} />
    </Full>
  );
};

const Card: React.FC<{x: number; y: number; color: string; n: string; label: string; f: number; at: number; icon?: React.ReactNode}> = ({x, y, color, n, label, f, at, icon}) => {
  const v = sp(f, at, {damping: 9, stiffness: 130});
  const [sx, sy] = squash(f, at + 4, 0.12, 0.14, 0.7);
  const float = Math.sin((f + at * 3) / 14) * 8;
  return (
    <g transform={`translate(${x},${y + float + (1 - Math.min(1, v)) * 400}) scale(${clamp(v, 0, 1.15) * sx},${clamp(v, 0, 1.15) * sy}) rotate(${(1 - Math.min(1, v)) * 12})`}>
      <rect x={-180} y={-230} width={360} height={460} rx={44} fill={color} />
      <rect x={-180} y={-230} width={360} height={90} rx={44} fill="#fff" opacity={0.18} />
      <circle cx={0} cy={-90} r={76} fill="#fff" opacity={0.95} />
      <T x={0} y={-60} size={100} color={color} weight={800}>{n}</T>
      <g transform="translate(0,60)">{icon}</g>
      <T x={0} y={190} size={label.length > 12 ? 34 : 46} color="#fff" weight={800}>{label}</T>
    </g>
  );
};

const H3: React.FC = () => {
  const {f, dur} = useBeat();
  const appleY = f < 34 ? ease(f, 0, 34, -700, 0, (t) => t * t) : -Math.abs(Math.sin((f - 34) / 6)) * 150 * Math.exp(-(f - 34) / 18);
  const [asx, asy] = squash(f, 34, 0.3, 0.2, 0.9);
  return (
    <Full>
      <g transform="translate(960,150)"><T x={0} y={0} size={60} color={C.yellow} stroke>Three simple rules</T></g>
      <Card x={400} y={500} color={C.blue} n="1" label="Inertia" f={f} at={6} icon={<g><circle cx={30} r={30} fill="#fff" /><rect x={-95} y={-26} width={70} height={9} rx={4} fill="#fff" opacity={0.8} /><rect x={-80} y={-4} width={55} height={9} rx={4} fill="#fff" opacity={0.6} /><rect x={-95} y={18} width={70} height={9} rx={4} fill="#fff" opacity={0.8} /></g>} />
      <Card x={960} y={500} color={C.orange} n="2" label="F = m × a" f={f} at={20} icon={<g><rect x={-90} y={-30} width={120} height={60} rx={10} fill="#fff" /><circle cx={-60} cy={38} r={16} fill="#fff" /><circle cx={0} cy={38} r={16} fill="#fff" /><path d="M50 0 H110 M92 -18 L112 0 L92 18" stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>} />
      <Card x={1520} y={500} color={C.green} n="3" label="Action ⇄ Reaction" f={f} at={34} icon={<g stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M-10 -14 H-90 M-70 -32 L-90 -14 L-70 4" /><path d="M10 24 H90 M70 6 L90 24 L70 42" /></g>} />
      <g transform={`translate(680,${appleY + 500}) scale(${asx},${asy})`} opacity={ease(f, dur - 8, dur, 1, 0)}>
        <circle r={36} fill="#FF4D5E" /><path d="M0 -34 Q8 -56 24 -58" stroke="#2ED47A" strokeWidth="7" fill="none" strokeLinecap="round" /><ellipse cx={16} cy={-52} rx={14} ry={7} fill="#2ED47A" />
      </g>
    </Full>
  );
};

const H4: React.FC = () => {
  const {f, dur} = useBeat();
  const auto = ease(f, 0, 40, -400, 2300, (t) => t);
  const ball = ease(f, 14, 56, -200, 2200, (t) => t);
  const ballY = 540 - Math.sin(ease(f, 14, 56, 0, 3.14)) * 160;
  const rocketY = ease(f, 36, 84, 1500, -700, (t) => t * t);
  const slam = f - 96;
  const sv = sp(f, 96, {damping: 9, stiffness: 190, mass: 0.8});
  const [sx, sy] = shake(f, 100, 20, 16);
  return (
    <Full>
      <g transform={`translate(${sx},${sy})`}>
        {f < 70 && <Auto x={auto} y={640} s={1.15} wheelRot={f * 22} />}
        {f < 70 && <CricketBall x={ball} y={ballY} r={44} rot={f * 20} />}
        {f < 100 && <Rocket x={1500} y={rocketY} s={0.7} flame={1} f={f} />}
        {slam > -4 && (
          <g transform={`translate(960,430) scale(${clamp(sv, 0, 1.2)})`} opacity={clamp((slam + 4) / 3)}>
            <T x={0} y={-20} size={190} color={C.yellow} font={FONT2} weight={800} stroke>NEWTON'S</T>
            <T x={0} y={140} size={120} color="#fff" weight={800} stroke>3 LAWS OF MOTION</T>
          </g>
        )}
        <Spark x={960} y={400} f={f} at={100} n={14} r0={260} r1={420} />
      </g>
    </Full>
  );
};

export const Hook: React.FC = () => {
  const L = useL();
  return (
    <AbsoluteFill>
      <Beat from="h1" pre={4} enter="fade"><H1 /></Beat>
      <Beat from="h2" pre={6}><H2 /></Beat>
      <Beat from="h3" pre={6}><H3 /></Beat>
      <Beat from="h4" pre={4} enter="fade"><H4 /></Beat>
      <Sfx name="whoosh" at={L('h1').s} vol={0.35} />
      <Sfx name="thud" at={L('h1').e - 24} vol={0.7} />
      <Sfx name="whoosh_down" at={L('h1').e - 26} vol={0.4} />
      <Sfx name="pop" at={L('h1').e - 16} vol={0.5} />
      <Sfx name="swish" at={L('h2').s + 20} vol={0.3} />
      <Sfx name="pop" at={L('h2').s + 24} vol={0.3} />
      <Sfx name="pop_hi" at={L('h3').s + 6} vol={0.35} />
      <Sfx name="pop_hi" at={L('h3').s + 20} vol={0.35} />
      <Sfx name="pop_hi" at={L('h3').s + 34} vol={0.35} />
      <Sfx name="thud_soft" at={L('h3').s + 34} vol={0.4} />
      <Sfx name="whoosh" at={L('h4').s + 4} vol={0.35} />
      <Sfx name="whoosh" at={L('h4').s + 36} vol={0.35} />
      <Sfx name="thud" at={L('h4').s + 98} vol={0.8} />
      <Sfx name="ding" at={L('h4').s + 100} vol={0.4} />
    </AbsoluteFill>
  );
};
