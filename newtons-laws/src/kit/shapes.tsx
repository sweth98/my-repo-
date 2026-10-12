import React from 'react';
import {C, FONT, FONT2} from '../theme';
import {clamp, easeOut, seeded} from './anim';

/** Force vector: grows from the tail, labelled in newtons */
export const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color: string; w?: number; label?: string; labelSize?: number; grow?: number; opacity?: number; labelSide?: 1 | -1; labelOffset?: number}> = ({x1, y1, x2, y2, color, w = 16, label, labelSize = 40, grow = 1, opacity = 1, labelSide = -1, labelOffset = 0}) => {
  const dx = x2 - x1, dy = y2 - y1, full = Math.hypot(dx, dy);
  const len = full * grow, ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const hs = Math.min(w * 2.3, len * 0.6), shaft = Math.max(0, len - hs * 0.9);
  const mx = x1 + (dx / full) * len * 0.5, my = y1 + (dy / full) * len * 0.5;
  const nx = -dy / full, ny = dx / full;
  const lx = mx + nx * (w + 34 + labelOffset) * labelSide, ly = my + ny * (w + 34 + labelOffset) * labelSide;
  if (len < 2) return null;
  return (
    <g opacity={opacity}>
      <g transform={`translate(${x1},${y1}) rotate(${ang})`}>
        <rect x={0} y={-w / 2} width={shaft} height={w} rx={w / 2} fill={color} />
        <polygon points={`${shaft - 2},${-hs * 0.75} ${len},0 ${shaft - 2},${hs * 0.75}`} fill={color} stroke={color} strokeWidth="4" strokeLinejoin="round" />
      </g>
      {label && grow > 0.35 && (
        <g transform={`translate(${lx},${ly})`}>
          <rect x={-label.length * labelSize * 0.31 - 18} y={-labelSize * 0.8} width={label.length * labelSize * 0.62 + 36} height={labelSize * 1.5} rx={labelSize * 0.55} fill="#0B1437" opacity="0.85" />
          <text textAnchor="middle" y={labelSize * 0.32} fontFamily={FONT2} fontWeight={800} fontSize={labelSize} fill={color}>{label}</text>
        </g>
      )}
    </g>
  );
};

/** rounded label chip */
export const Chip: React.FC<{x: number; y: number; text: string; color?: string; size?: number; fill?: string; textColor?: string; scale?: number; rot?: number; opacity?: number}> = ({x, y, text, color = C.yellow, size = 40, fill = '#0B1437', textColor, scale = 1, rot = 0, opacity = 1}) => {
  const w = text.length * size * 0.58 + size * 1.2;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.75} rx={size * 0.6} fill={fill} stroke={color} strokeWidth="5" />
      <text textAnchor="middle" y={size * 0.3} fontFamily={FONT2} fontWeight={800} fontSize={size} fill={textColor ?? color}>{text}</text>
    </g>
  );
};

/** SVG text with a dark outline, always legible */
export const T: React.FC<{x: number; y: number; children: React.ReactNode; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number; font?: string; opacity?: number; rot?: number; stroke?: boolean}> = ({x, y, children, size = 44, color = '#fff', anchor = 'middle', weight = 700, font = FONT2, opacity = 1, rot = 0, stroke = false}) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={font} fontWeight={weight} fontSize={size} fill={color} opacity={opacity} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}
    stroke={stroke ? '#0B1437' : undefined} strokeWidth={stroke ? size * 0.16 : 0} paintOrder="stroke" strokeLinejoin="round">{children}</text>
);

/** dust puffs: secondary action on impacts */
export const Dust: React.FC<{x: number; y: number; f: number; at: number; n?: number; color?: string; size?: number; spread?: number}> = ({x, y, f, at, n = 8, color = '#E8EEFF', size = 26, spread = 120}) => {
  const t = f - at;
  if (t < 0 || t > 40) return null;
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const a = seeded(i + at) * Math.PI * 2 * 0.5 + (i % 2 ? Math.PI * 0.25 : Math.PI * 1.25);
        const dir = i % 2 ? 1 : -1;
        const px = x + dir * (spread * easeOut(t, 0, 36, 0, 1) * (0.4 + seeded(i * 3 + at) * 0.8));
        const py = y - 30 * easeOut(t, 0, 36, 0, 1) * (0.4 + seeded(i * 7) ) - Math.abs(Math.sin(a)) * 10;
        const r = size * (0.5 + seeded(i * 5) * 0.8) * (0.4 + easeOut(t, 0, 30, 0, 1));
        return <circle key={i} cx={px} cy={py} r={r} fill={color} opacity={clamp(1 - t / 38) * 0.75} />;
      })}
    </g>
  );
};

export const SpeedLines: React.FC<{x: number; y: number; w: number; h: number; f: number; dir?: 1 | -1; color?: string; n?: number; opacity?: number}> = ({x, y, w, h, f, dir = 1, color = '#fff', n = 7, opacity = 0.6}) => (
  <g opacity={opacity}>
    {Array.from({length: n}).map((_, i) => {
      const yy = y + (h / n) * i + seeded(i) * 10;
      const len = w * (0.4 + seeded(i + 4) * 0.6);
      const off = ((f * 38 * (0.7 + seeded(i + 9))) % (w * 1.4)) * dir;
      const xx = dir === 1 ? x + w - off - len : x + off;
      return <rect key={i} x={xx} y={yy} width={len} height={6} rx={3} fill={color} opacity={0.35 + seeded(i + 2) * 0.5} />;
    })}
  </g>
);

export const Spark: React.FC<{x: number; y: number; f: number; at: number; color?: string; n?: number; r0?: number; r1?: number}> = ({x, y, f, at, color = C.yellow, n = 10, r0 = 20, r1 = 110}) => {
  const t = f - at;
  if (t < 0 || t > 22) return null;
  return (
    <g opacity={clamp(1 - t / 22)}>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + seeded(i) * 0.3;
        const d0 = r0 + (r1 - r0) * easeOut(t, 0, 14, 0, 1) * 0.55, d1 = r0 + (r1 - r0) * easeOut(t, 0, 14, 0, 1);
        return <line key={i} x1={x + Math.cos(a) * d0} y1={y + Math.sin(a) * d0} x2={x + Math.cos(a) * d1} y2={y + Math.sin(a) * d1} stroke={color} strokeWidth={8} strokeLinecap="round" />;
      })}
    </g>
  );
};

export const Confetti: React.FC<{f: number; at: number; n?: number}> = ({f, at, n = 70}) => {
  const t = f - at;
  if (t < 0) return null;
  const cols = [C.yellow, C.blue, C.orange, C.green, C.pink, C.purple];
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const x0 = 200 + seeded(i) * 1520, vy = 6 + seeded(i + 3) * 8, sw = seeded(i + 8) * 6.28;
        const y = -40 + t * vy * 0.9 - (t < 14 ? (14 - t) * 14 : 0);
        if (y > 1120) return null;
        return <rect key={i} x={x0 + Math.sin(t / 8 + sw) * 60} y={y} width={16} height={26} rx={3} fill={cols[i % cols.length]} transform={`rotate(${t * (4 + seeded(i) * 8)} ${x0} ${y})`} />;
      })}
    </g>
  );
};

/** screen-shake offset after an impact */
export const shake = (f: number, at: number, amp = 14, dur = 14): [number, number] => {
  const t = f - at;
  if (t < 0 || t > dur) return [0, 0];
  const k = (1 - t / dur) * amp;
  return [Math.sin(t * 2.7) * k, Math.cos(t * 3.3) * k * 0.7];
};

export const Wheel: React.FC<{cx: number; cy: number; r: number; rot: number; tire?: string; rim?: string}> = ({cx, cy, r, rot, tire = '#1B2347', rim = '#C9D3F5'}) => (
  <g transform={`translate(${cx},${cy}) rotate(${rot})`}>
    <circle r={r} fill={tire} />
    <circle r={r * 0.55} fill={rim} />
    <circle r={r * 0.15} fill={tire} />
    <line x1={-r * 0.55} y1={0} x2={r * 0.55} y2={0} stroke={tire} strokeWidth={r * 0.1} />
    <line x1={0} y1={-r * 0.55} x2={0} y2={r * 0.55} stroke={tire} strokeWidth={r * 0.1} />
  </g>
);
