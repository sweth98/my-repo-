import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../theme';

export type Mood = 'happy' | 'surprised' | 'worried' | 'think' | 'cheer' | 'neutral';
type P = {x: number; y: number; s?: number; mood?: Mood; look?: [number, number]; armL?: number; armR?: number; sx?: number; sy?: number; rot?: number; flip?: boolean; bob?: boolean; seed?: number};

/** Newt: an original little robot student. Origin = feet centre, ~270 units tall. */
export const Newt: React.FC<P> = ({x, y, s = 1, mood = 'happy', look = [0, 0], armL = 8, armR = 8, sx = 1, sy = 1, rot = 0, flip = false, bob = true, seed = 0}) => {
  const f = useCurrentFrame() + seed * 37;
  const b = bob ? Math.sin(f / 9) * 3 : 0;
  const blinkT = f % 120;
  const blink = blinkT > 114 ? 0.1 : 1;
  const glow = 10 + Math.sin(f / 5) * 2;
  const surprised = mood === 'surprised', cheer = mood === 'cheer', worried = mood === 'worried';
  const eyeRX = surprised ? 15 : 13, eyeRY = (surprised ? 21 : 16) * blink;
  const px = look[0] * 5, py = look[1] * 5;
  const mouth = {
    happy: <path d="M-16 -148 Q0 -132 16 -148" stroke={C.pink} strokeWidth="6" fill="none" strokeLinecap="round" />,
    neutral: <path d="M-10 -146 L10 -146" stroke={C.pink} strokeWidth="6" fill="none" strokeLinecap="round" />,
    think: <path d="M-10 -146 Q4 -150 12 -144" stroke={C.pink} strokeWidth="6" fill="none" strokeLinecap="round" />,
    surprised: <ellipse cx="0" cy="-144" rx="9" ry="12" fill={C.pink} />,
    worried: <path d="M-16 -140 Q-8 -150 0 -142 Q8 -134 16 -142" stroke={C.pink} strokeWidth="6" fill="none" strokeLinecap="round" />,
    cheer: <path d="M-20 -150 Q0 -118 20 -150 Z" fill={C.pink} />,
  }[mood];
  const brow = surprised ? [-8, -8] : worried ? [4, -6] : [0, 0];
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${(flip ? -1 : 1) * s * sx},${s * sy})`}>
      <ellipse cx="0" cy="2" rx="64" ry="10" fill="#000" opacity="0.25" />
      {/* backpack */}
      <rect x="-58" y="-124" width="26" height="58" rx="11" fill={C.orange} />
      {/* legs */}
      <rect x="-34" y="-50" width="26" height="42" rx="12" fill="#2A3F8F" />
      <rect x="8" y="-50" width="26" height="42" rx="12" fill="#2A3F8F" />
      <ellipse cx="-22" cy="-7" rx="22" ry="11" fill="#fff" />
      <ellipse cx="22" cy="-7" rx="22" ry="11" fill="#fff" />
      {/* arms behind body */}
      <g transform="translate(-42,-110)"><g transform={`rotate(${armL})`}><rect x="-11" y="0" width="22" height="50" rx="11" fill={C.tealDark} /><circle cx="0" cy="54" r="13" fill={C.teal} /></g></g>
      <g transform="translate(42,-110)"><g transform={`rotate(${-armR})`}><rect x="-11" y="0" width="22" height="50" rx="11" fill={C.tealDark} /><circle cx="0" cy="54" r="13" fill={C.teal} /></g></g>
      {/* body */}
      <rect x="-44" y="-132" width="88" height="88" rx="28" fill={C.yellow} />
      <circle cx="0" cy="-92" r="15" fill="#fff" />
      <path d="M2 -102 L-6 -90 L0 -90 L-3 -80 L7 -94 L1 -94 Z" fill={C.orange} />
      {/* head */}
      <g transform={`translate(0,${b})`}>
        <line x1="0" y1="-222" x2="0" y2="-248" stroke={C.tealDark} strokeWidth="5" strokeLinecap="round" />
        <circle cx="0" cy="-254" r={glow + 4} fill={C.yellow} opacity="0.25" />
        <circle cx="0" cy="-254" r="9" fill={C.yellow} />
        <circle cx="-70" cy="-170" r="12" fill={C.orange} />
        <circle cx="70" cy="-170" r="12" fill={C.orange} />
        <rect x="-66" y="-222" width="132" height="106" rx="46" fill={C.teal} />
        <rect x="-66" y="-150" width="132" height="34" rx="17" fill={C.tealDark} opacity="0.25" />
        <rect x="-50" y="-208" width="100" height="72" rx="28" fill="#13265E" />
        {cheer || mood === 'happy' && false ? null : null}
        {cheer ? (
          <>
            <path d="M-36 -176 Q-22 -196 -8 -176" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M8 -176 Q22 -196 36 -176" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="-22" cy="-176" rx={eyeRX} ry={eyeRY} fill="#fff" />
            <ellipse cx="22" cy="-176" rx={eyeRX} ry={eyeRY} fill="#fff" />
            <circle cx={-22 + px} cy={-176 + py} r={surprised ? 6 : 8} fill="#0B1437" opacity={blink > 0.5 ? 1 : 0} />
            <circle cx={22 + px} cy={-176 + py} r={surprised ? 6 : 8} fill="#0B1437" opacity={blink > 0.5 ? 1 : 0} />
            <circle cx={-25 + px} cy={-181 + py} r="3" fill="#fff" opacity={blink > 0.5 ? 1 : 0} />
            <circle cx={19 + px} cy={-181 + py} r="3" fill="#fff" opacity={blink > 0.5 ? 1 : 0} />
          </>
        )}
        <line x1="-34" y1={-198 + brow[0]} x2="-12" y2={-200 + brow[1]} stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.9" transform={worried ? 'rotate(14 -23 -199)' : ''} />
        <line x1="12" y1={-200 + brow[1]} x2="34" y2={-198 + brow[0]} stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.9" transform={worried ? 'rotate(-14 23 -199)' : ''} />
        <circle cx="-38" cy="-154" r="8" fill={C.pink} opacity="0.55" />
        <circle cx="38" cy="-154" r="8" fill={C.pink} opacity="0.55" />
        {mouth}
      </g>
    </g>
  );
};
