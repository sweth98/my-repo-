import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Beat, Full, Sfx, useBeat, useL} from '../kit/core';
import {Newt} from '../kit/Newt';
import {Balloon, Football, Ground, Kid, Rocket} from '../kit/props';
import {Arrow, Chip, Dust, Spark, SpeedLines, T, shake} from '../kit/shapes';
import {clamp, ease, easeIn, easeOut, seeded, sp, squash} from '../kit/anim';
import {lineById, wordF} from '../data';
import {C, FONT2} from '../theme';

const GR = C.green;
const GR2 = '#8CF0B8';

/* ---------- c1: title ---------- */
const C1: React.FC = () => {
  const {f} = useBeat();
  const push = 26;
  const t = f - push;
  const sep = t < 0 ? 0 : easeOut(t, 0, 34, 0, 260);
  const [sx, sy] = squash(f, push, 0.18, 0.14, 0.7);
  const lean = f < push ? ease(f, 6, push, 0, -8) : ease(f, push, push + 8, -8, 6);
  const v = sp(f, 4, {damping: 9, stiffness: 140});
  return (
    <Full>
      <g transform={`translate(960,230) scale(${clamp(v, 0, 1.1)})`}>
        <T x={0} y={0} size={200} color={GR} stroke weight={800}>LAW 3</T>
        <T x={0} y={110} size={94} color="#fff" stroke weight={800}>Action &amp; Reaction</T>
      </g>
      <Newt x={800 - sep} y={800} s={1.3} mood="cheer" armL={-75} armR={75} rot={lean} sx={sx} sy={sy} />
      <Newt x={1120 + sep} y={800} s={1.3} mood="cheer" flip armL={-75} armR={75} rot={-lean} sx={sx} sy={sy} />
      <Spark x={960} y={600} f={f} at={push} color={GR} n={12} r0={40} r1={140} />
    </Full>
  );
};

/* ---------- c2: definition ---------- */
const C2: React.FC = () => {
  const {f} = useBeat();
  const t = {a: wordF('c2', 'action'), e: wordF('c2', 'equal'), o: wordF('c2', 'opposite'), r: wordF('c2', 'reaction')};
  const pill = (y: number, at: number, color: string, children: React.ReactNode) => {
    const v = sp(f, at, {damping: 10, stiffness: 150});
    if (f < at - 1) return null;
    return <g transform={`translate(960,${y}) scale(${clamp(v, 0, 1.1)})`} opacity={clamp(v * 2)}><rect x={-600} y={-80} width={1200} height={160} rx={80} fill="#0B1437" stroke={color} strokeWidth={8} />{children}</g>;
  };
  const eq = sp(f, t.e, {damping: 10});
  return (
    <Full>
      {pill(280, t.a - 2, GR, <><T x={-520} y={30} size={96} color="#fff" anchor="start" weight={800}>every ACTION</T><Arrow x1={190} y1={0} x2={520} y2={0} color={GR} w={28} grow={clamp(sp(f, t.a, {damping: 14}))} /></>)}
      {pill(500, t.e - 2, C.yellow, <><T x={-520} y={30} size={96} color={C.yellow} anchor="start" weight={800}>EQUAL</T><T x={90} y={30} size={80} color="#fff" anchor="start" weight={800}>= same size</T></>)}
      {pill(720, t.o - 2, GR2, <><T x={-520} y={30} size={90} color="#fff" anchor="start" weight={800}>OPPOSITE reaction</T><Arrow x1={560} y1={0} x2={330} y2={0} color={GR2} w={28} grow={clamp(sp(f, t.r, {damping: 14}))} /></>)}
      
    </Full>
  );
};

/* ---------- c3: A pushes B ---------- */
const C3: React.FC = () => {
  const {f} = useBeat();
  const tp = wordF('c3', 'pushes') + 6;
  const t = f - tp;
  const sep = t < 0 ? 0 : easeOut(t, 0, 50, 0, 380);
  const [sx, sy] = squash(f, tp, 0.14, 0.18, 0.8);
  const gnd = 790;
  const arrowK = clamp((f - tp + 8) / 10);
  return (
    <Full>
      <Ground y={gnd} color="#13266F" h={110} />
      <Kid x={800 - sep} y={gnd} s={1.35} shirt={C.blue} armL={-70} armR={70} sx={sx} sy={sy} lean={t < 0 ? 0 : -6} />
      <Kid x={1120 + sep} y={gnd} s={1.35} shirt={C.orange} armL={-70} armR={70} flip sx={sx} sy={sy} lean={t < 0 ? 0 : 6} />
      <T x={800 - sep} y={330} size={88} color={C.blue} weight={800}>A</T>
      <T x={1120 + sep} y={330} size={88} color={C.orange} weight={800}>B</T>
      <Arrow x1={900} y1={470} x2={1090} y2={470} color={GR} w={22} label="A pushes B: 60 N" labelSize={38} grow={arrowK} labelSide={-1} labelOffset={0} />
      <Arrow x1={1020} y1={600} x2={830} y2={600} color={GR2} w={22} label="B pushes A: 60 N" labelSize={38} grow={clamp((f - wordF('c3', 'back') + 8) / 10)} labelSide={1} />
      <Chip x={960} y={190} text="equal size · opposite direction" size={50} color={GR} scale={clamp(sp(f, wordF('c3', 'equally') - 4), 0, 1.1)} />
      {t > 6 && <Dust x={1120 + sep} y={gnd} f={f} at={tp + 6} n={6} size={20} spread={80} />}
    </Full>
  );
};

/* ---------- c4: ISRO rocket ---------- */
const C4: React.FC = () => {
  const {f, dur} = useBeat();
  const go = Math.round(dur * 0.34);
  const t = f - go;
  const rise = t < 0 ? 0 : 0.5 * 0.1 * t * t;
  const shk = f < go ? Math.sin(f * 2.1) * ease(f, 0, go, 0.5, 4) : 0;
  const base = 780 - rise;
  const flame = t < 0 ? (f > go - 14 ? 0.45 : 0) : clamp(0.6 + t / 20, 0, 1.25);
  const cnt = f < go ? Math.ceil((go - f) / ((go - 4) / 3)) : 0;
  return (
    <Full>
      <rect x={0} y={780} width={1920} height={120} fill="#13266F" />
      <rect x={560} y={400} width={30} height={380} fill="#7B88B8" /><rect x={560} y={400} width={110} height={20} fill="#7B88B8" />
      <g transform={`translate(${shk},0)`}>
        <Rocket x={960} y={base} s={0.78} flame={flame} f={f} />
      </g>
      {Array.from({length: 16}).map((_, i) => {
        const age = t - i * 3;
        if (t < 0 || age < 0 || age > 50) return null;
        const dir = i % 2 ? 1 : -1;
        const sx0 = 960 + dir * (30 + age * (4 + seeded(i) * 4));
        return <circle key={i} cx={sx0} cy={800 - age * 0.8 - seeded(i + 2) * 12} r={26 + age * 0.9} fill="#E8EEFF" opacity={clamp(1 - age / 50) * 0.7} />;
      })}
      {f < go && cnt > 0 && <T x={1400} y={420} size={190} color={C.yellow} stroke weight={800}>{cnt}</T>}
      {t > 6 && (
        <>
          <Arrow x1={1180} y1={base - 40} x2={1180} y2={base + 200} color={C.orange} w={26} label="gas pushed DOWN" labelSize={38} grow={clamp((t - 6) / 10)} labelSide={-1} />
          <Arrow x1={720} y1={base - 120} x2={720} y2={base - 380} color={GR} w={26} label="rocket pushed UP" labelSize={38} grow={clamp((t - 10) / 10)} labelSide={1} />
        </>
      )}
      {f > go - 20 && f < go + 6 && <Chip x={960} y={170} text="LIFT-OFF!" size={72} color={C.yellow} scale={clamp(sp(f, go - 20), 0, 1.1)} />}
    </Full>
  );
};

/* ---------- c5: swimmer ---------- */
const C5: React.FC = () => {
  const {f, dur} = useBeat();
  const x = 420 + ease(f, 14, dur - 6, 0, 800, (t) => t * (2 - t));
  const stroke = f * 0.32;
  const arm = Math.sin(stroke) * 70;
  const wave = (i: number) => `M${-100 + i * 260} ${0} q 65 -22 130 0 t 130 0`;
  return (
    <Full>
      <rect x={0} y={520} width={1920} height={300} fill="#1B64C9" opacity={0.55} />
      {Array.from({length: 9}).map((_, i) => <path key={i} d={wave(i)} transform={`translate(${-(f * 4) % 260},${520 + (i % 2) * 6})`} stroke="#BFE6FF" strokeWidth={6} fill="none" opacity={0.7} />)}
      <g transform={`translate(${x},570)`}>
        <rect x={-120} y={-14} width={230} height={52} rx={26} fill={C.teal} />
        <circle cx={130} cy={-20} r={36} fill="#E0A070" /><path d="M96 -28 Q130 -78 164 -28 Z" fill={C.red} />
        <g transform={`translate(70,-4) rotate(${arm - 40})`}><rect x={-12} y={-100} width={24} height={110} rx={12} fill="#E0A070" /></g>
        <rect x={-190} y={-8} width={80} height={24} rx={12} fill="#E0A070" transform={`rotate(${-arm * 0.3} -110 4)`} />
      </g>
      {Array.from({length: 6}).map((_, i) => <circle key={i} cx={x - 180 - ((f * 6 + i * 50) % 200)} cy={560 + seeded(i) * 40} r={6 + seeded(i + 3) * 8} fill="#fff" opacity={0.5} />)}
      <Arrow x1={x - 40} y1={720} x2={x - 330} y2={720} color={GR2} w={22} label="hand pushes water BACK" labelSize={38} grow={clamp(sp(f, 12, {damping: 14}))} labelSide={1} />
      <Arrow x1={x + 40} y1={450} x2={x + 330} y2={450} color={GR} w={22} label="water pushes swimmer FORWARD" labelSize={38} grow={clamp(sp(f, wordF('c5', 'water', 1) + 4, {damping: 14}))} labelSide={-1} />
    </Full>
  );
};

/* ---------- c6: recoil ---------- */
const C6: React.FC = () => {
  const {f, dur} = useBeat();
  const fire = wordF('c6', 'bullet') + 2;
  const t = f - fire;
  const ball = t < 0 ? 0 : easeOut(t, 0, 40, 0, 1000);
  const rec = t < 0 ? 0 : easeOut(t, 0, 36, 0, 150);
  const [shx, shy] = shake(f, fire, 14, 12);
  const gnd = 780;
  return (
    <Full>
      <g transform={`translate(${shx},${shy})`}>
        <Ground y={gnd} color="#13266F" h={110} />
        <g transform={`translate(${760 - rec},${gnd})`}>
          <ellipse cx={0} cy={0} rx={160} ry={10} fill="#000" opacity={0.25} />
          <g transform={`rotate(-8 -20 -150)`}><rect x={-120} y={-190} width={260} height={84} rx={36} fill="#5A6486" /><rect x={110} y={-198} width={44} height={100} rx={14} fill="#3A4466" /><rect x={-140} y={-176} width={40} height={56} rx={20} fill="#3A4466" /></g>
          <rect x={-120} y={-110} width={230} height={32} rx={10} fill={C.wood} />
          <circle cx={-70} cy={-48} r={46} fill="#1B2347" /><circle cx={-70} cy={-48} r={22} fill="#C9D3F5" />
          <circle cx={60} cy={-48} r={46} fill="#1B2347" /><circle cx={60} cy={-48} r={22} fill="#C9D3F5" />
        </g>
        {t >= 0 && <circle cx={880 - rec + ball} cy={gnd - 190 - ball * 0.02} r={26} fill="#2A3150" stroke="#fff" strokeWidth={4} />}
        <Spark x={900 - rec} y={gnd - 200} f={f} at={fire} color={C.yellow} n={12} r0={30} r1={130} />
        <Dust x={900 - rec} y={gnd - 190} f={f} at={fire} n={9} size={34} spread={120} color="#C8D0EA" />
        <Dust x={700 - rec} y={gnd} f={f} at={fire + 4} n={6} size={22} spread={80} />
      </g>
      {t > 4 && <Arrow x1={960} y1={400} x2={1360} y2={400} color={GR} w={24} label="gun pushes bullet →" labelSize={40} grow={clamp(t / 10)} labelSide={-1} />}
      {t > 10 && <Arrow x1={700} y1={540} x2={420} y2={540} color={GR2} w={24} label="← bullet kicks gun (recoil)" labelSize={40} grow={clamp((t - 6) / 10)} labelSide={1} />}
    </Full>
  );
};

/* ---------- c7: walking ---------- */
const C7: React.FC = () => {
  const {f} = useBeat();
  const k = (Math.sin(f * 0.12) + 1) / 2; // push-off cycle
  const gnd = 740;
  return (
    <Full>
      <rect x={0} y={gnd} width={1920} height={150} fill="#13266F" />
      {Array.from({length: 22}).map((_, i) => <rect key={i} x={((i * 100 + f * 9) % 2200) - 150} y={gnd + 70} width={46} height={7} rx={3} fill="#fff" opacity={0.2} />)}
      <g transform={`translate(930,${gnd - 70}) rotate(${-12 + k * 22} 80 70)`}>
        <path d="M-120 20 Q-120 -40 -50 -50 L50 -60 Q150 -70 190 10 L190 70 L-120 70 Z" fill="#F4F6FF" stroke="#B8C2E8" strokeWidth={5} />
        <path d="M-120 40 H190 V70 H-120 Z" fill={C.orange} />
        <path d="M-60 -20 L40 -34" stroke={C.blue} strokeWidth={10} strokeLinecap="round" />
        <path d="M-10 -34 L-10 -4" stroke="#B8C2E8" strokeWidth={6} />
      </g>
      <Arrow x1={820} y1={gnd + 45} x2={470} y2={gnd + 45} color={GR2} w={22} label="foot pushes ground BACK" labelSize={38} grow={clamp(sp(f, wordF('c7', 'foot') + 2, {damping: 14}))} labelSide={1} labelOffset={0} />
      <Arrow x1={900} y1={440} x2={1200} y2={440} color={GR} w={22} label="ground pushes you FORWARD" labelSize={38} grow={clamp(sp(f, wordF('c7', 'ground', 1) + 2, {damping: 14}))} labelSide={-1} />
      <Newt x={1480} y={gnd + 60} s={1.15} mood="happy" armL={30 + k * 40} armR={70 - k * 40} sy={1 + Math.abs(Math.sin(f * 0.12)) * 0.02} />
    </Full>
  );
};

/* ---------- c8: balloon ---------- */
const C8: React.FC = () => {
  const {f, dur} = useBeat();
  const rel = 18;
  const t = Math.max(0, f - rel);
  const u = clamp(t / (dur - rel - 6));
  const bx = 420 + u * 1100, by = 560 + Math.sin(u * Math.PI * 3.2) * 130 - u * 60;
  const dx = 1100, dy = Math.cos(u * Math.PI * 3.2) * 130 * Math.PI * 3.2 - 60;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const inflated = f < rel;
  const sz = inflated ? 1 + Math.sin(f * 0.8) * 0.03 : 1 - 0.18 * u;
  return (
    <Full>
      <Balloon x={bx} y={by} s={0.95 * sz} rot={inflated ? 0 : ang} wob={Math.sin(f * 0.9) * 14} sx={1} />
      {!inflated && Array.from({length: 12}).map((_, i) => {
        const age = i * 2.4;
        const uu = clamp((t - age) / (dur - rel - 6));
        if (t - age < 0) return null;
        const px = 420 + uu * 1100 - 120, py = 560 + Math.sin(uu * Math.PI * 3.2) * 130 - uu * 60 + 20;
        return <circle key={i} cx={px} cy={py} r={14 + age * 0.8} fill="#fff" opacity={0.6 * (1 - age / 30)} />;
      })}
      <Chip x={960} y={200} text="air rushes out →  balloon zooms the other way" size={46} color={GR} scale={clamp(sp(f, rel), 0, 1.1)} />
      {!inflated && <Arrow x1={bx - 200} y1={by + 140} x2={bx - 420} y2={by + 140} color={GR2} w={20} label="air pushed back" labelSize={34} grow={clamp(t / 10)} labelSide={1} />}
      {!inflated && <Arrow x1={bx + 60} y1={by - 160} x2={bx + 300} y2={by - 160} color={GR} w={20} label="balloon pushed forward" labelSize={34} grow={clamp(t / 10)} labelSide={-1} />}
    </Full>
  );
};

/* ---------- c9: the question ---------- */
const C9: React.FC = () => {
  const {f} = useBeat();
  const v = sp(f, 8, {damping: 9, stiffness: 140});
  return (
    <Full>
      <Newt x={420} y={800} s={1.5} mood="think" look={[1, -0.6]} armL={20} armR={110} />
      {[0, 1, 2].map((i) => <T key={i} x={380 + Math.cos(f / 14 + i * 2.1) * 140} y={330 + Math.sin(f / 14 + i * 2.1) * 40} size={80 - i * 8} color={C.yellow} stroke opacity={clamp(sp(f, 6 + i * 6))}>?</T>)}
      <g transform={`translate(1190,470) scale(${clamp(v, 0, 1.1)})`}>
        <rect x={-560} y={-230} width={1120} height={460} rx={56} fill="#0B1437" stroke={GR} strokeWidth={7} />
        <Arrow x1={-460} y1={-30} x2={-130} y2={-30} color={GR} w={26} label="50 N" labelSize={44} labelSide={-1} />
        <Arrow x1={460} y1={-30} x2={130} y2={-30} color={GR2} w={26} label="50 N" labelSize={44} labelSide={-1} />
        <T x={0} y={-8} size={64} color={C.yellow} weight={800}>= ?</T>
        <T x={0} y={140} size={62} color="#fff" weight={800}>50 N − 50 N = 0 ?</T>
      </g>
    </Full>
  );
};

/* ---------- c10: different objects ---------- */
const C10: React.FC = () => {
  const {f, dur} = useBeat();
  const tBall = wordF('c10', 'ball'), tFoot = wordF('c10', 'foot'), tCancel = wordF('c10', 'cancel') - 2;
  const kick = tBall - 18;
  const gnd = 760;
  const t = f - kick;
  const footX = 330 + (t < 0 ? ease(f, 0, kick, 0, 160) : easeOut(t, 0, 10, 160, 190) - easeOut(t, 10, 40, 0, 40));
  const ballX = t < 0 ? 760 : 760 + easeOut(t, 0, 70, 0, 420);
  const [bsx, bsy] = squash(f, kick + 6, 0.22, 0.2, 0.9);
  const showInset = f >= tCancel - 4;
  const v = sp(f, tCancel - 4, {damping: 11, stiffness: 140});
  return (
    <Full>
      <Ground y={gnd} color="#13266F" h={110} />
      <g>
        <g transform={`translate(${footX},${gnd - 20})`}>
          <path d="M-120 20 Q-120 -40 -50 -50 L50 -60 Q130 -70 160 10 L160 40 L-120 40 Z" fill="#F4F6FF" stroke="#B8C2E8" strokeWidth={5} />
          <path d="M-120 20 H160 V40 H-120 Z" fill={C.orange} />
          <rect x={-130} y={-200} width={70} height={170} rx={30} fill="#2A3F8F" />
        </g>
        <Football x={ballX} y={gnd - 50} r={52} rot={(ballX - 760) * 0.8} sx={t > 0 && t < 14 ? bsx : 1} sy={t > 0 && t < 14 ? bsy : 1} />
        <Spark x={760} y={gnd - 60} f={f} at={kick + 4} color={C.yellow} n={10} r0={50} r1={130} />
        {f > tBall - 4 && <ellipse cx={ballX} cy={gnd - 50} rx={92} ry={92} fill="none" stroke={GR} strokeWidth={6} strokeDasharray="14 10" opacity={clamp((f - tBall + 4) / 8)} />}
        {f > tFoot - 4 && <ellipse cx={footX + 20} cy={gnd - 40} rx={200} ry={150} fill="none" stroke={GR2} strokeWidth={6} strokeDasharray="14 10" opacity={clamp((f - tFoot + 4) / 8)} />}
        {f > tBall && <Arrow x1={ballX - 100} y1={gnd - 190} x2={ballX + 130} y2={gnd - 190} color={GR} w={22} label="Action: force ON the ball" labelSize={34} grow={clamp(sp(f, tBall))} labelSide={-1} />}
        {f > tFoot && <Arrow x1={footX + 120} y1={gnd - 280} x2={footX - 130} y2={gnd - 280} color={GR2} w={22} label="Reaction: force ON your foot" labelSize={34} grow={clamp(sp(f, tFoot))} labelSide={-1} />}
      </g>
      {showInset && (
        <g transform={`translate(1550,300) scale(${clamp(v, 0, 1.08)})`} opacity={clamp(v * 2)}>
          <rect x={-340} y={-190} width={680} height={400} rx={46} fill="#0B1437" stroke={C.yellow} strokeWidth={7} />
          <T x={0} y={-120} size={44} color={C.yellow} weight={800}>Forces cancel only on</T>
          <T x={0} y={-66} size={52} color="#fff" weight={800}>the SAME object</T>
          <rect x={-90} y={0} width={180} height={120} rx={20} fill={C.steel} />
          <Arrow x1={-300} y1={60} x2={-100} y2={60} color={GR} w={20} grow={1} />
          <Arrow x1={300} y1={60} x2={100} y2={60} color={GR2} w={20} grow={1} />
          <T x={0} y={190} size={38} color={GR} weight={800}>net force = 0</T>
        </g>
      )}
    </Full>
  );
};

export const Law3: React.FC = () => {
  const L = useL();
  const g = (id: string, w: string, n = 0) => L(id).s + wordF(id, w, n);
  return (
    <AbsoluteFill>
      <Beat from="c1" pre={14}><C1 /></Beat>
      <Beat from="c2"><C2 /></Beat>
      <Beat from="c3"><C3 /></Beat>
      <Beat from="c4" enter="fade"><C4 /></Beat>
      <Beat from="c5" enter="fade"><C5 /></Beat>
      <Beat from="c6" enter="fade"><C6 /></Beat>
      <Beat from="c7" enter="fade"><C7 /></Beat>
      <Beat from="c8" enter="fade"><C8 /></Beat>
      <Beat from="c9"><C9 /></Beat>
      <Beat from="c10"><C10 /></Beat>
      {/* sound design */}
      <Sfx name="pop" at={L('c1').s + 4} vol={0.4} />
      <Sfx name="thud_soft" at={L('c1').s + 26} vol={0.5} />
      <Sfx name="whoosh" at={L('c1').s + 28} vol={0.3} />
      {['action', 'equal', 'opposite', 'reaction'].map((w, i) => <Sfx key={w} name={i % 2 ? 'pop_hi' : 'pop'} at={g('c2', w)} vol={0.4} />)}
      <Sfx name="thud_soft" at={g('c3', 'pushes') + 6} vol={0.45} />
      <Sfx name="swish" at={g('c3', 'pushes') + 8} vol={0.3} />
      {[0, 1, 2].map((i) => <Sfx key={i} name="tick" at={L('c4').s + 8 + i * Math.round((L('c4').dur * 0.34 - 4) / 3)} vol={0.5} />)}
      <Sfx name="rumble" at={L('c4').s + Math.round(L('c4').dur * 0.34) - 14} vol={0.55} />
      <Sfx name="whoosh" at={L('c4').s + Math.round(L('c4').dur * 0.34) + 20} vol={0.3} />
      <Sfx name="whoosh_down" at={L('c5').s + 14} vol={0.3} />
      <Sfx name="pop" at={L('c5').s + 40} vol={0.3} />
      <Sfx name="thud" at={g('c6', 'bullet') + 2} vol={0.75} />
      <Sfx name="whoosh" at={g('c6', 'bullet') + 3} vol={0.3} />
      <Sfx name="tap" at={L('c7').s + 12} vol={0.4} />
      <Sfx name="tap" at={L('c7').s + 34} vol={0.4} />
      <Sfx name="whoosh" at={L('c8').s + 18} vol={0.4} />
      <Sfx name="boing" at={L('c8').s + 20} vol={0.35} />
      <Sfx name="pop" at={L('c9').s + 8} vol={0.4} />
      <Sfx name="thud" at={g('c10', 'ball') - 14} vol={0.6} />
      <Sfx name="ding" at={g('c10', 'ball')} vol={0.3} />
      <Sfx name="ding_low" at={g('c10', 'foot')} vol={0.3} />
      <Sfx name="tada" at={g('c10', 'cancel') - 2} vol={0.3} />
    </AbsoluteFill>
  );
};
