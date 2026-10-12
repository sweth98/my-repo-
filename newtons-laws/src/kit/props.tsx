import React from 'react';
import {C, FONT2} from '../theme';
import {Wheel} from './shapes';

/** City bus, side view. origin = ground, centre. faces right. */
export const Bus: React.FC<{x: number; y: number; s?: number; sx?: number; sy?: number; wheelRot?: number; tilt?: number}> = ({x, y, s = 1, sx = 1, sy = 1, wheelRot = 0, tilt = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s * sx},${s * sy})`}>
    <ellipse cx="0" cy="0" rx="270" ry="12" fill="#000" opacity="0.22" />
    <g transform={`rotate(${tilt} 0 -40)`}>
      <rect x="-260" y="-215" width="520" height="175" rx="30" fill="#E8473F" />
      <rect x="-260" y="-100" width="520" height="22" fill="#FFF3D6" />
      <rect x="-260" y="-215" width="520" height="22" rx="10" fill="#FFF3D6" />
      {[-205, -130, -55, 20, 95].map((wx, i) => (
        <g key={i}>
          <rect x={wx} y={-182} width={62} height={68} rx={12} fill="#BFE6FF" />
          <circle cx={wx + 31} cy={-146} r={17} fill={['#FFC9A0', '#E0A070', '#F7D2B0', '#C48B5C', '#FFD7B8'][i]} />
          <rect x={wx + 12} y={-128} width={38} height={14} rx={7} fill={['#3D8BFF', '#2ED47A', '#B36BFF', '#FF8A1F', '#FFD23F'][i]} />
        </g>
      ))}
      <rect x="172" y="-182" width="72" height="92" rx="12" fill="#BFE6FF" />
      <rect x="236" y="-86" width="30" height="28" rx="8" fill="#FFD23F" />
      <rect x="-268" y="-86" width="22" height="30" rx="8" fill="#FF8080" />
      <text x="-30" y="-56" textAnchor="middle" fontFamily={FONT2} fontWeight={800} fontSize={26} fill="#7A1B16">CITY BUS 42</text>
      <Wheel cx={-150} cy={-40} r={42} rot={wheelRot} />
      <Wheel cx={150} cy={-40} r={42} rot={wheelRot} />
    </g>
  </g>
);

/** Auto-rickshaw. origin = ground centre, faces right */
export const Auto: React.FC<{x: number; y: number; s?: number; wheelRot?: number; sx?: number; sy?: number; tilt?: number}> = ({x, y, s = 1, wheelRot = 0, sx = 1, sy = 1, tilt = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s * sx},${s * sy})`}>
    <ellipse cx="0" cy="0" rx="160" ry="10" fill="#000" opacity="0.22" />
    <g transform={`rotate(${tilt} 0 -30)`}>
      <path d="M-145 -60 L-145 -185 Q-145 -215 -115 -215 L60 -215 Q85 -215 98 -190 L128 -120 L138 -100 L138 -60 Z" fill="#FFC21A" />
      <path d="M-145 -185 Q-145 -215 -115 -215 L40 -215 Q62 -215 74 -195 L86 -170 L-145 -170 Z" fill="#232A44" />
      <path d="M92 -170 L120 -112 L92 -112 Z" fill="#BFE6FF" />
      <rect x="-118" y="-160" width="188" height="64" rx="14" fill="#7B2F10" opacity="0.18" />
      <circle cx="-30" cy="-140" r="19" fill="#FFC9A0" />
      <rect x="-52" y="-122" width="44" height="24" rx="10" fill="#3D8BFF" />
      <circle cx="30" cy="-140" r="19" fill="#C48B5C" />
      <rect x="8" y="-122" width="44" height="24" rx="10" fill="#FF5470" />
      <rect x="-145" y="-100" width="283" height="10" fill="#232A44" opacity="0.8" />
      <circle cx="136" cy="-92" r="11" fill="#FFF3A8" />
      <Wheel cx={-92} cy={-34} r={34} rot={wheelRot} />
      <Wheel cx={112} cy={-30} r={30} rot={wheelRot} />
    </g>
  </g>
);

export const Football: React.FC<{x: number; y: number; r?: number; rot?: number; sx?: number; sy?: number}> = ({x, y, r = 46, rot = 0, sx = 1, sy = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sx},${sy})`}>
    <circle r={r} fill="#fff" stroke="#0B1437" strokeWidth={r * 0.06} />
    <polygon points={`0,${-r * 0.45} ${r * 0.43},${-r * 0.14} ${r * 0.26},${r * 0.36} ${-r * 0.26},${r * 0.36} ${-r * 0.43},${-r * 0.14}`} fill="#0B1437" />
    {[0, 72, 144, 216, 288].map((a) => (
      <line key={a} x1={0} y1={-r * 0.45} x2={0} y2={-r * 0.95} stroke="#0B1437" strokeWidth={r * 0.07} transform={`rotate(${a})`} />
    ))}
  </g>
);

export const CricketBall: React.FC<{x: number; y: number; r?: number; rot?: number; sx?: number; sy?: number}> = ({x, y, r = 30, rot = 0, sx = 1, sy = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sx},${sy})`}>
    <circle r={r} fill="#D8283A" stroke="#7A0F1B" strokeWidth={r * 0.06} />
    <path d={`M${-r * 0.7} ${-r * 0.7} Q${r * 0.25} 0 ${-r * 0.7} ${r * 0.7}`} stroke="#fff" strokeWidth={r * 0.07} fill="none" />
    <path d={`M${r * 0.7} ${-r * 0.7} Q${-r * 0.25} 0 ${r * 0.7} ${r * 0.7}`} stroke="#fff" strokeWidth={r * 0.07} fill="none" />
  </g>
);

export const IronBall: React.FC<{x: number; y: number; r?: number; rot?: number; sx?: number; sy?: number}> = ({x, y, r = 50, rot = 0, sx = 1, sy = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sx},${sy})`}>
    <circle r={r} fill="#5A6486" stroke="#2A3150" strokeWidth={5} />
    <ellipse cx={-r * 0.3} cy={-r * 0.35} rx={r * 0.28} ry={r * 0.16} fill="#fff" opacity="0.35" transform="rotate(-30)" />
    <text y={r * 0.2} textAnchor="middle" fontFamily={FONT2} fontWeight={800} fontSize={r * 0.42} fill="#CDD6F4">IRON</text>
  </g>
);

export const CarromCoin: React.FC<{x: number; y: number; r?: number; sx?: number; sy?: number}> = ({x, y, r = 22, sx = 1, sy = 1}) => (
  <g transform={`translate(${x},${y}) scale(${sx},${sy})`}>
    <circle r={r} fill="#F8E7C4" stroke="#B98A45" strokeWidth={4} />
    <circle r={r * 0.6} fill="none" stroke="#B98A45" strokeWidth={3} />
    <circle r={r * 0.2} fill="#B98A45" />
  </g>
);

/** wooden cart; full = vegetables piled up */
export const Cart: React.FC<{x: number; y: number; s?: number; full?: boolean; wheelRot?: number; sx?: number; sy?: number}> = ({x, y, s = 1, full = false, wheelRot = 0, sx = 1, sy = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s * sx},${s * sy})`}>
    <ellipse cx="0" cy="0" rx="150" ry="9" fill="#000" opacity="0.22" />
    {full &&
      [[-85, -112, 28, '#E5383B'], [-40, -118, 30, '#2ED47A'], [8, -114, 28, '#FF8A1F'], [52, -118, 30, '#E5383B'], [92, -112, 26, '#9BE564'], [-62, -138, 26, '#FFD23F'], [-12, -146, 28, '#E5383B'], [38, -142, 26, '#2ED47A'], [70, -136, 22, '#FF8A1F'], [10, -170, 24, '#E5383B']].map(([cx, cy, r, c], i) => (
        <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={c as string} />
      ))}
    <rect x="-120" y="-110" width="240" height="70" rx="12" fill={C.wood} />
    <rect x="-120" y="-110" width="240" height="16" rx="8" fill={C.woodDark} />
    {[-80, -30, 20, 70].map((lx) => (
      <line key={lx} x1={lx} y1={-92} x2={lx} y2={-44} stroke={C.woodDark} strokeWidth="5" />
    ))}
    <line x1="120" y1="-92" x2="190" y2="-128" stroke={C.woodDark} strokeWidth="12" strokeLinecap="round" />
    <Wheel cx={-70} cy={-34} r={34} rot={wheelRot} tire={C.woodDark} rim="#E8C9A0" />
    <Wheel cx={70} cy={-34} r={34} rot={wheelRot} tire={C.woodDark} rim="#E8C9A0" />
  </g>
);

/** ISRO-style launch vehicle (original illustration). origin = base centre */
export const Rocket: React.FC<{x: number; y: number; s?: number; rot?: number; sx?: number; sy?: number; flame?: number; f?: number}> = ({x, y, s = 1, rot = 0, sx = 1, sy = 1, flame = 0, f = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s * sx},${s * sy})`}>
    {flame > 0 && (
      <g transform={`scale(1,${flame})`}>
        <path d={`M-40 0 Q-52 ${70 + Math.sin(f) * 10} 0 ${210 + Math.sin(f * 1.7) * 28} Q52 ${70 + Math.cos(f) * 10} 40 0 Z`} fill="#FF8A1F" />
        <path d={`M-24 0 Q-30 50 0 ${150 + Math.sin(f * 2.1) * 20} Q30 50 24 0 Z`} fill="#FFD23F" />
        <path d={`M-12 0 Q-12 30 0 ${80 + Math.sin(f * 2.7) * 12} Q12 30 12 0 Z`} fill="#fff" />
      </g>
    )}
    <path d="M-62 -40 L-100 20 L-62 6 Z" fill="#E5383B" />
    <path d="M62 -40 L100 20 L62 6 Z" fill="#E5383B" />
    <rect x="-62" y="-330" width="124" height="330" rx="14" fill="#F4F6FF" />
    <path d="M-62 -330 Q-62 -430 0 -480 Q62 -430 62 -330 Z" fill="#F4F6FF" />
    <rect x="-62" y="-300" width="124" height="22" fill="#FF9933" />
    <rect x="-62" y="-278" width="124" height="22" fill="#fff" />
    <rect x="-62" y="-256" width="124" height="22" fill="#138808" />
    <circle cx="0" cy="-196" r="30" fill="#BFE6FF" stroke="#7B88B8" strokeWidth="7" />
    <text y="-90" textAnchor="middle" fontFamily={FONT2} fontWeight={800} fontSize={34} fill="#13265E">ISRO</text>
    <rect x="-62" y="-10" width="124" height="14" fill="#9AA7C7" />
  </g>
);

export const Balloon: React.FC<{x: number; y: number; s?: number; rot?: number; sx?: number; sy?: number; wob?: number}> = ({x, y, s = 1, rot = 0, sx = 1, sy = 1, wob = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s * sx},${s * sy})`}>
    <path d={`M0 78 Q${20 + wob} 120 ${-10 - wob} 170 T0 250`} stroke="#fff" strokeWidth="4" fill="none" opacity="0.7" />
    <ellipse cx="0" cy="-20" rx="70" ry="86" fill="#FF5470" />
    <ellipse cx="-24" cy="-48" rx="14" ry="26" fill="#fff" opacity="0.35" transform="rotate(20 -24 -48)" />
    <polygon points="0,62 -14,80 14,80" fill="#D63C58" />
  </g>
);

/** simple kid figure for tug of war / skaters / walkers */
export const Kid: React.FC<{x: number; y: number; s?: number; shirt?: string; skin?: string; armL?: number; armR?: number; lean?: number; flip?: boolean; sx?: number; sy?: number; face?: boolean}> = ({x, y, s = 1, shirt = C.blue, skin = '#E0A070', armL = 20, armR = 20, lean = 0, flip = false, sx = 1, sy = 1, face = true}) => (
  <g transform={`translate(${x},${y}) scale(${(flip ? -1 : 1) * s * sx},${s * sy}) rotate(${lean})`}>
    <ellipse cx="0" cy="2" rx="52" ry="8" fill="#000" opacity="0.22" />
    <rect x="-26" y="-60" width="20" height="58" rx="9" fill="#2A3F8F" />
    <rect x="6" y="-60" width="20" height="58" rx="9" fill="#2A3F8F" />
    <ellipse cx="-14" cy="-4" rx="19" ry="9" fill="#fff" />
    <ellipse cx="18" cy="-4" rx="19" ry="9" fill="#fff" />
    <g transform="translate(-30,-128)"><g transform={`rotate(${armL})`}><rect x="-9" y="0" width="18" height="58" rx="9" fill={skin} /></g></g>
    <g transform="translate(30,-128)"><g transform={`rotate(${-armR})`}><rect x="-9" y="0" width="18" height="58" rx="9" fill={skin} /></g></g>
    <rect x="-36" y="-146" width="72" height="96" rx="26" fill={shirt} />
    <circle cx="0" cy="-184" r="34" fill={skin} />
    <path d="M-34 -190 Q-30 -222 0 -222 Q30 -222 34 -190 Q10 -204 -34 -190 Z" fill="#2B1B17" />
    {face && (
      <>
        <circle cx="-12" cy="-182" r="4.5" fill="#0B1437" />
        <circle cx="12" cy="-182" r="4.5" fill="#0B1437" />
        <path d="M-10 -168 Q0 -160 10 -168" stroke="#0B1437" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    )}
  </g>
);

/** simple ground strip */
export const Ground: React.FC<{y: number; color?: string; h?: number; x?: number; w?: number; dash?: number}> = ({y, color = '#1E2F78', h = 220, x = -100, w = 2120, dash}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={color} />
    <rect x={x} y={y} width={w} height={10} fill="#fff" opacity="0.12" />
    {dash !== undefined &&
      Array.from({length: 24}).map((_, i) => (
        <rect key={i} x={(((i * 160 - dash) % 3840) + 3840) % 3840 - 200} y={y + 60} width={80} height={8} rx={4} fill="#fff" opacity="0.3" />
      ))}
  </g>
);
