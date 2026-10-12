import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Beat, Full, Sfx, useBeat, useL} from '../kit/core';
import {Newt} from '../kit/Newt';
import {Arrow, Chip, Confetti, Spark, T} from '../kit/shapes';
import {clamp, ease, easeOut, sp, squash} from '../kit/anim';
import {lineById, wordF} from '../data';
import {C, FONT2} from '../theme';

/* ---------- r1-r3: the three law cards ---------- */
const CARDS = [
  {id: 'r1', color: C.blue, n: 'LAW 1', title: 'Inertia', line1: 'Objects resist', line2: 'changes in motion'},
  {id: 'r2', color: C.orange, n: 'LAW 2', title: 'F = m × a', line1: 'Force = mass', line2: '× acceleration'},
  {id: 'r3', color: C.green, n: 'LAW 3', title: 'Action ⇄ Reaction', line1: 'Equal and', line2: 'opposite'},
];
const CardIcon: React.FC<{i: number; f: number}> = ({i, f}) => {
  if (i === 0) return <g><circle cx={30} cy={0} r={34} fill="#fff" /><path d="M-100 -20 H-40 M-110 6 H-50 M-100 32 H-40" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.85} /></g>;
  if (i === 1) return <g><rect x={-90} y={-36} width={130} height={70} rx={12} fill="#fff" /><circle cx={-60} cy={44} r={18} fill="#fff" /><circle cx={10} cy={44} r={18} fill="#fff" /><path d="M60 0 H120 M102 -20 L122 0 L102 20" stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>;
  const wob = Math.sin(f / 5) * 6;
  return <g stroke="#fff" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d={`M${-10 + wob} -22 H-100 M-80 -44 L-100 -22 L-80 0`} /><path d={`M${10 - wob} 28 H100 M80 6 L100 28 L80 50`} /></g>;
};
const R123: React.FC = () => {
  const {f} = useBeat();
  const o = [0, lineById('r2').start - lineById('r1').start, lineById('r3').start - lineById('r1').start];
  return (
    <Full>
      {CARDS.map((c, i) => {
        const at = o[i] + 2;
        const v = sp(f, at, {damping: 8, stiffness: 120});
        if (f < at - 1) return null;
        const flip = clamp(v, 0, 1.08);
        const active = f >= o[i] && (i === 2 || f < o[i + 1]);
        const [sx, sy] = squash(f, at + 8, 0.06, 0.14, 0.8);
        return (
          <g key={c.id} transform={`translate(${360 + i * 600},${460 + (active ? -12 : 0)}) scale(${flip * sx * (active ? 1.05 : 1)},${clamp(v, 0, 1.1) * sy * (active ? 1.05 : 1)})`}>
            <rect x={-250} y={-300} width={500} height={600} rx={56} fill={c.color} />
            <rect x={-250} y={-300} width={500} height={110} rx={56} fill="#fff" opacity={0.18} />
            <T x={0} y={-216} size={64} color="#fff" weight={800}>{c.n}</T>
            <g transform="translate(0,-60)"><CardIcon i={i} f={f} /></g>
            <T x={0} y={110} size={c.title.length > 12 ? 50 : 70} color="#fff" weight={800}>{c.title}</T>
            <T x={0} y={180} size={40} color="#fff" weight={600} opacity={0.95}>{c.line1}</T>
            <T x={0} y={228} size={40} color="#fff" weight={600} opacity={0.95}>{c.line2}</T>
          </g>
        );
      })}
    </Full>
  );
};

/* ---------- r4: quiz time ---------- */
const R4: React.FC = () => {
  const {f} = useBeat();
  const v = sp(f, 4, {damping: 8, stiffness: 150});
  const [sx, sy] = squash(f, 10, 0.15, 0.14, 0.7);
  return (
    <Full>
      <g transform={`translate(960,330) scale(${clamp(v, 0, 1.15)})`}>
        <rect x={-560} y={-130} width={1120} height={260} rx={70} fill={C.purple} />
        <T x={0} y={50} size={170} color="#fff" weight={800}>QUIZ TIME!</T>
      </g>
      <Newt x={960} y={800} s={1.25} mood="cheer" armL={140 + Math.sin(f / 4) * 10} armR={140 - Math.sin(f / 4) * 10} sx={sx} sy={sy} />
      <Confetti f={f} at={6} n={50} />
    </Full>
  );
};

/* ---------- q1-q3: quiz ---------- */
type Q = {from: string; to: string; num: number; text: string; opts: string[]; ans: number; why: string; icon: 'bus' | 'trolley' | 'rocket'};
const QUIZ: Q[] = [
  {from: 'q1', to: 'q1a', num: 1, text: 'A bus stops and you lurch forward.', opts: ['Law 1', 'Law 2', 'Law 3'], ans: 0, why: 'Law 1: inertia', icon: 'bus'},
  {from: 'q2', to: 'q2a', num: 2, text: '20 N acts on a 4 kg trolley. Find a (m/s²).', opts: ['2', '5', '80'], ans: 1, why: 'a = F ÷ m = 20 ÷ 4 = 5 m/s²', icon: 'trolley'},
  {from: 'q3', to: 'q3a', num: 3, text: 'A rocket rises because gases are pushed down.', opts: ['Law 1', 'Law 2', 'Law 3'], ans: 2, why: 'Law 3: action and reaction', icon: 'rocket'},
];
const QuizIcon: React.FC<{k: Q['icon']}> = ({k}) => {
  if (k === 'bus') return <g><rect x={-90} y={-40} width={180} height={80} rx={18} fill="#E8473F" /><rect x={-70} y={-26} width={40} height={30} rx={6} fill="#BFE6FF" /><rect x={-20} y={-26} width={40} height={30} rx={6} fill="#BFE6FF" /><rect x={30} y={-26} width={40} height={30} rx={6} fill="#BFE6FF" /><circle cx={-50} cy={44} r={18} fill="#1B2347" /><circle cx={50} cy={44} r={18} fill="#1B2347" /></g>;
  if (k === 'trolley') return <g><rect x={-80} y={-30} width={160} height={60} rx={10} fill={C.wood} /><circle cx={-50} cy={42} r={18} fill="#1B2347" /><circle cx={50} cy={42} r={18} fill="#1B2347" /><path d="M80 -10 L140 -40" stroke={C.woodDark} strokeWidth={10} strokeLinecap="round" /></g>;
  return <g transform="translate(0,62) scale(0.28)"><path d="M-62 -40 L-100 20 L-62 6 Z" fill="#E5383B" /><path d="M62 -40 L100 20 L62 6 Z" fill="#E5383B" /><rect x={-62} y={-330} width={124} height={330} rx={14} fill="#F4F6FF" /><path d="M-62 -330 Q-62 -430 0 -480 Q62 -430 62 -330 Z" fill="#F4F6FF" /><rect x={-62} y={-300} width={124} height={22} fill="#FF9933" /><rect x={-62} y={-256} width={124} height={22} fill="#138808" /><g transform="translate(0,-230)"><circle r={30} fill="#BFE6FF" /></g></g>;
};
const Quiz: React.FC<{q: Q}> = ({q}) => {
  const {f} = useBeat();
  const l = lineById(q.from);
  const cdS = l.countdown!.start - l.start, cdE = l.countdown!.end - l.start;
  const tRev = lineById(q.to).start - l.start;
  const optT = [wordF(q.from, 'a', 1), wordF(q.from, 'b'), wordF(q.from, 'c')];
  const revealed = f >= tRev;
  const sec = clamp((f - cdS) / (cdE - cdS));
  const left = f < cdS ? 5 : Math.max(0, 5 - Math.floor((f - cdS) / 30));
  const urgent = f >= cdS && left <= 2 && !revealed;
  const rv = sp(f, tRev, {damping: 8, stiffness: 150});
  const inV = sp(f, 2, {damping: 12});
  const col = [C.blue, C.orange, C.green];
  return (
    <Full>
      <g transform={`translate(960,${240 - (1 - Math.min(1, inV)) * 200})`} opacity={clamp(inV * 2)}>
        <rect x={-820} y={-120} width={1640} height={240} rx={56} fill="#0B1437" stroke={C.purple} strokeWidth={7} />
        <circle cx={-700} cy={0} r={72} fill={C.purple} /><T x={-700} y={26} size={78} weight={800}>Q{q.num}</T>
        <T x={-590} y={22} size={q.text.length > 36 ? 50 : 58} anchor="start" weight={800}>{q.text}</T>
        <g transform="translate(690,0)"><QuizIcon k={q.icon} /></g>
      </g>
      {q.opts.map((o, i) => {
        const v = sp(f, optT[i] - 2, {damping: 10, stiffness: 150});
        if (f < optT[i] - 3) return null;
        const isAns = i === q.ans;
        const x = 500 + i * 440;
        const win = revealed && isAns;
        const lose = revealed && !isAns;
        const [sx, sy] = squash(f, tRev + 4, 0.1, 0.14, 0.8);
        const sc = clamp(v, 0, 1.1) * (win ? 1.12 * sx : lose ? 0.88 : 1);
        return (
          <g key={i} transform={`translate(${x},${560}) scale(${sc},${clamp(v, 0, 1.1) * (win ? 1.12 * sy : lose ? 0.88 : 1)})`} opacity={lose ? 0.35 : 1}>
            <rect x={-190} y={-130} width={380} height={260} rx={50} fill={win ? C.green : '#0B1437'} stroke={win ? '#fff' : col[i]} strokeWidth={win ? 10 : 7} />
            <circle cx={-110} cy={-60} r={42} fill={win ? '#fff' : col[i]} /><T x={-110} y={-44} size={50} color={win ? C.green : '#fff'} weight={800}>{'ABC'[i]}</T>
            <T x={20} y={52} size={o.length > 4 ? 66 : 96} color="#fff" weight={800}>{o}</T>
            {win && <g transform="translate(120,-70)"><circle r={40} fill="#fff" /><path d="M-18 2 L-6 16 L20 -14" stroke={C.green} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
          </g>
        );
      })}
      {/* countdown timer */}
      {f >= cdS - 4 && !revealed && (
        <g transform={`translate(1700,690) scale(${urgent ? 1 + 0.05 * Math.sin(f * 0.9) : 1})`}>
          <circle r={96} fill="#0B1437" stroke="#33448F" strokeWidth={14} />
          <circle r={96} fill="none" stroke={urgent ? C.red : C.yellow} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${(1 - sec) * 603} 603`} transform="rotate(-90)" />
          <T x={0} y={34} size={100} color={urgent ? C.red : '#fff'} weight={800}>{left}</T>
        </g>
      )}
      {f >= cdS - 4 && !revealed && <T x={1700} y={820} size={34} color="#fff" weight={800}>THINK FAST!</T>}
      {revealed && (
        <g transform={`translate(960,772) scale(${clamp(rv, 0, 1.08)})`}>
          <rect x={-420} y={-52} width={840} height={100} rx={50} fill={C.green} />
          <T x={0} y={22} size={q.why.length > 26 ? 44 : 54} color="#fff" weight={800}>{q.why}</T>
        </g>
      )}
      <Newt x={150} y={800} s={0.95} mood={revealed ? 'cheer' : f >= cdS ? 'think' : 'happy'} armL={revealed ? 140 : 20} armR={revealed ? 140 : 90} look={[1, -0.4]} sy={revealed ? 1 + Math.abs(Math.sin((f - tRev) * 0.35)) * 0.05 : 1} />
      {revealed && <Spark x={500 + q.ans * 440} y={560} f={f} at={tRev} color={C.yellow} n={12} r0={170} r1={260} />}
    </Full>
  );
};

/* ---------- r5: outro ---------- */
const R5: React.FC = () => {
  const {f} = useBeat();
  const v = sp(f, 4, {damping: 9, stiffness: 130});
  const [sx, sy] = squash(f, 10, 0.12, 0.12, 0.7);
  return (
    <Full>
      <g transform={`translate(960,190) scale(${clamp(v, 0, 1.1)})`}>
        <T x={0} y={0} size={170} color={C.yellow} stroke weight={800}>You nailed it!</T>
        <T x={0} y={100} size={64} color="#fff" weight={800}>Spot Newton's laws everywhere</T>
      </g>
      {[C.blue, C.orange, C.green].map((c, i) => {
        const a = f / 24 + i * 2.094;
        return <g key={i} transform={`translate(${960 + Math.cos(a) * 640},${470 + Math.sin(a) * 60}) scale(${0.8 + 0.2 * Math.sin(a)})`}><rect x={-80} y={-100} width={160} height={200} rx={28} fill={c} /><T x={0} y={26} size={60} color="#fff" weight={800}>{i + 1}</T></g>;
      })}
      <Newt x={960} y={810} s={1.15} mood="cheer" armL={150} armR={70 + Math.sin(f / 3) * 40} sx={sx} sy={sy} />
      <Confetti f={f} at={6} n={60} />
    </Full>
  );
};

export const Recap: React.FC = () => {
  const L = useL();
  const g = (id: string, w: string, n = 0) => L(id).s + wordF(id, w, n);
  return (
    <AbsoluteFill>
      <Beat from="r1" to="r3" pre={14}><R123 /></Beat>
      <Beat from="r4"><R4 /></Beat>
      {QUIZ.map((q) => <Beat key={q.from} from={q.from} to={q.to} post={14}><Quiz q={q} /></Beat>)}
      <Beat from="r5" post={110} enter="zoom"><R5 /></Beat>
      {/* sound design */}
      {['r1', 'r2', 'r3'].map((id) => <Sfx key={id} name="whoosh" at={L(id).s} vol={0.3} />)}
      {['r1', 'r2', 'r3'].map((id) => <Sfx key={id + 'p'} name="pop" at={L(id).s + 6} vol={0.45} />)}
      <Sfx name="tada" at={L('r4').s + 6} vol={0.4} />
      {QUIZ.map((q) => {
        const l = lineById(q.from);
        const s0 = L(q.from);
        return (
          <React.Fragment key={q.from}>
            {[0, 1, 2].map((i) => <Sfx key={i} name="pop_hi" at={g(q.from, 'abc'[i], i === 0 ? 1 : 0) - 2} vol={0.35} />)}
            {[0, 1, 2, 3, 4].map((i) => <Sfx key={'t' + i} name="tick" at={s0.cd!.s + i * 30} vol={0.5} />)}
            <Sfx name="ding" at={L(q.to).s + 4} vol={0.45} />
            <Sfx name="tada" at={L(q.to).s + 6} vol={0.3} />
          </React.Fragment>
        );
      })}
      <Sfx name="tada" at={L('r5').s + 6} vol={0.45} />
    </AbsoluteFill>
  );
};
