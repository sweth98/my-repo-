import React, { createContext, useContext, useId } from 'react';
import { LAND, MAPW, MAPH, TROPIC_N, TROPIC_S, EQUATOR, MARK } from './mapdata.js';
export const FmtCtx = createContext('h'); export const useV = () => useContext(FmtCtx) === 'v';
export const C = { cream: '#F2EBDD', brown: '#3B2118', esp: '#24140F', caramel: '#B77A45', green: '#526A43', cherry: '#BD493D', black: '#171717', white: '#FFFDF7' };

// positioned element: box = [x,y,w,h] for 16:9 (h) and 9:16 (v) compositions
export function Box({ k, h, v, z, cls = '', style, children, ...r }) { const b = useV() ? v : h; return <div data-k={k} className={'box ' + cls} style={{ left: b[0], top: b[1], width: b[2], height: b[3], zIndex: z, ...style }} {...r}>{children}</div>; }
export function Photo({ k, h, v, src, pos = '50% 50%', size = 'cover', radius = 0, z, cls = 'sh', style }) { const V = useV(); const pick = (o) => (o && typeof o === 'object' ? (V ? o.v : o.h) : o); return <Box k={k} h={h} v={v} z={z} cls={'photo ' + cls} style={{ backgroundImage: `url(img/${src}.jpg)`, backgroundPosition: pick(pos), backgroundSize: pick(size), borderRadius: radius, ...style }} />; }
export function SceneShell({ k, bg, children }) { return <div className="scene" data-k={k} style={{ background: bg }}>{children}</div>; }

export function Words({ k, h, v, lines, size, color = C.black, align = 'left', free, chars, lh = 0.92, ls = '-0.035em', z, style, emc }) {
  const V = useV(); const sz = typeof size === 'object' ? (V ? size.v : size.h) : size;
  return <Box k={k} h={h} v={v} z={z} cls={'words' + (free ? ' free' : '')} style={{ fontSize: sz, color, lineHeight: lh, letterSpacing: ls, textAlign: align, '--emc': emc, ...style }}>
    {lines.map((ln, i) => <div className="ln" key={i} style={{ justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>{ln.split(' ').map((w, j) => { const em = w.startsWith('*'); const t = em ? w.slice(1) : w; return <span className="w" key={j}><span className={'wi' + (em ? ' em' : '')}>{chars ? t.split('').map((c, n) => <span className="ch" key={n}>{c}</span>) : t}</span></span>; })}</div>)}
  </Box>;
}
export function Chip({ k, h, v, n, label, c1, c2, pill, z, pillbg, pillfg, style }) { return <Box k={k} h={h} v={v} z={z} cls={'chip' + (pill ? ' pill' : '')} style={{ '--c1': c1, '--c2': c2, '--pillbg': pillbg, '--pillfg': pillfg, ...style }}>{n != null && <span className="num">{n}</span>}<span>{label}</span></Box>; }
export function Tag({ k, h, v, children, color = C.black, z, style }) { return <Box k={k} h={h} v={v} z={z} cls="small" style={{ color, ...style }}>{children}</Box>; }
export function Arrow({ k, d, head, color = C.black, w = 6, hs = 1, z, style }) { // full-stage SVG arrow: shaft path + chevron head
  const V = useV(); return <svg data-k={k} width={V ? 1080 : 1920} height={V ? 1920 : 1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: z, pointerEvents: 'none', ...style }}>
    <path className="shaft" d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
    <path className="head" d="M0 0 L-26 -15 M0 0 L-26 15" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" transform={`translate(${head[0]} ${head[1]}) rotate(${head[2]}) scale(${hs})`} style={{ transformBox: 'fill-box' }} /></svg>; }
export function Line({ k, d, color = C.black, w = 3, dash, z }) { const V = useV(); return <svg data-k={k} width={V ? 1080 : 1920} height={V ? 1920 : 1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: z, pointerEvents: 'none' }}><path d={d} fill="none" stroke={color} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" /></svg>; }

// ------- organic cutouts (original SVG illustration, no stock) -------
export function Bean({ k, h, v, z, c1 = '#8FA56A', c2 = '#46602B', rot = 0, cls = 'sh', style }) { const id = useId().replace(/:/g, ''); return <Box k={k} h={h} v={v} z={z} cls={cls} style={{ transform: `rotate(${rot}deg)`, ...style }}>
  <svg viewBox="0 0 200 130" style={{ '--b1': c1, '--b2': c2 }}><defs><radialGradient id={'b' + id} cx=".34" cy=".28" r=".95"><stop offset="0" style={{ stopColor: 'var(--b1)' }} /><stop offset="1" style={{ stopColor: 'var(--b2)' }} /></radialGradient></defs>
    <path d="M12 66 C10 24 62 4 108 8 C160 12 196 40 188 70 C180 106 130 126 84 122 C40 118 14 100 12 66Z" fill={`url(#b${id})`} />
    <path d="M18 64 C58 40 86 96 186 62" fill="none" stroke="rgba(18,9,4,.62)" strokeWidth="7" strokeLinecap="round" /><path d="M18 61 C58 37 86 93 186 59" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cx="72" cy="32" rx="42" ry="11" fill="#fff" opacity=".2" transform="rotate(-16 72 32)" /></svg></Box>; }
export function Cherry({ k, h, v, z, cls = 'sh', style, leaf = true }) { const id = useId().replace(/:/g, ''); return <Box k={k} h={h} v={v} z={z} cls={cls} style={style}>
  <svg viewBox="0 0 200 240"><defs><radialGradient id={'c' + id} cx=".34" cy=".3" r=".9"><stop offset="0" stopColor="#F07C6C" /><stop offset=".45" stopColor="#BD493D" /><stop offset="1" stopColor="#6E1E1A" /></radialGradient></defs>
    <path d="M100 52 C104 30 112 18 126 10" fill="none" stroke="#5B7A3F" strokeWidth="7" strokeLinecap="round" />
    {leaf && <path d="M122 14 C150 -6 186 6 196 26 C170 40 140 34 122 14Z" fill="#6A8C4B" />}
    <path d="M100 48 C148 46 192 84 190 138 C188 196 146 232 100 232 C54 232 12 196 10 138 C8 84 52 46 100 48Z" fill={`url(#c${id})`} />
    <circle cx="100" cy="62" r="15" fill="#7C241F" opacity=".75" /><circle cx="100" cy="62" r="7" fill="#3D100E" /><ellipse cx="66" cy="104" rx="26" ry="14" fill="#fff" opacity=".3" transform="rotate(-30 66 104)" /><ellipse cx="150" cy="170" rx="9" ry="5" fill="#fff" opacity=".18" transform="rotate(-30 150 170)" /></svg></Box>; }
export function Leaves({ k, h, v, z, cls = 'sh', flip, style }) { const id = useId().replace(/:/g, ''); const L = (x, y, r, s) => <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}><path d="M0 0 C40 -46 130 -50 190 0 C130 50 40 46 0 0Z" fill={`url(#l${id})`} /><path d="M0 0 L180 0" stroke="#2F4727" strokeWidth="3" opacity=".6" /><path d="M40 0 L90 -22 M40 0 L90 22 M90 0 L140 -18 M90 0 L140 18" stroke="#2F4727" strokeWidth="2" opacity=".35" /></g>;
  return <Box k={k} h={h} v={v} z={z} cls={cls} style={{ transform: flip ? 'scaleX(-1)' : undefined, ...style }}><svg viewBox="0 0 460 380"><defs><linearGradient id={'l' + id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7FA05E" /><stop offset="1" stopColor="#35502B" /></linearGradient></defs>
    {L(40, 330, -62, 1.0)}{L(60, 300, -20, 1.15)}{L(80, 250, -100, 0.9)}{L(110, 180, -38, 1.05)}{L(60, 120, -78, 0.8)}{L(150, 330, 6, 0.95)}</svg></Box>; }
export function CherryCluster({ k, h, v, z, cls = 'sh' }) { return <Box k={k} h={h} v={v} z={z} cls={cls}><svg viewBox="0 0 300 300"><defs><radialGradient id="cc" cx=".34" cy=".3" r=".9"><stop offset="0" stopColor="#F07C6C" /><stop offset=".5" stopColor="#BD493D" /><stop offset="1" stopColor="#6E1E1A" /></radialGradient><radialGradient id="cd" cx=".34" cy=".3" r=".9"><stop offset="0" stopColor="#8A3A34" /><stop offset="1" stopColor="#2E0E0C" /></radialGradient></defs>
  <path d="M150 0 C150 40 120 60 90 96 M150 0 C160 50 190 70 210 112 M150 0 C150 60 160 90 150 130" fill="none" stroke="#5B7A3F" strokeWidth="6" strokeLinecap="round" />
  <ellipse cx="82" cy="140" rx="60" ry="62" fill="url(#cc)" /><ellipse cx="212" cy="156" rx="56" ry="58" fill="url(#cd)" /><ellipse cx="148" cy="200" rx="64" ry="66" fill="url(#cc)" />
  <ellipse cx="64" cy="118" rx="18" ry="9" fill="#fff" opacity=".32" transform="rotate(-30 64 118)" /><ellipse cx="130" cy="176" rx="20" ry="10" fill="#fff" opacity=".3" transform="rotate(-30 130 176)" /></svg></Box>; }

// ------- ceramic cup (side view) with a fillable interior -------
export function Cup({ k, h, v, z }) { return <Box k={k} h={h} v={v} z={z}><svg viewBox="0 0 600 560" style={{ overflow: 'visible' }}><defs>
  <clipPath id="cupIn"><path d="M96 178 C100 182 200 224 300 224 C400 224 500 182 504 178 L470 400 C462 436 420 462 300 462 C180 462 138 436 130 400Z" /></clipPath>
  <linearGradient id="cupW" x1="0" x2="1"><stop offset="0" stopColor="#E6DFD0" /><stop offset=".35" stopColor="#FFFDF7" /><stop offset="1" stopColor="#D9D0BE" /></linearGradient>
  <radialGradient id="crema" cx=".5" cy=".45" r=".7"><stop offset="0" stopColor="#E7B77E" /><stop offset="1" stopColor="#B77A45" /></radialGradient></defs>
  <g data-k={k + '-shadow'}><ellipse cx="300" cy="506" rx="272" ry="38" fill="rgba(36,20,15,.28)" /><ellipse cx="300" cy="494" rx="250" ry="34" fill="#F4EEE2" /><ellipse cx="300" cy="490" rx="170" ry="22" fill="#E3DACB" /></g>
  <path d="M488 214 C580 200 590 330 478 356" fill="none" stroke="url(#cupW)" strokeWidth="26" strokeLinecap="round" />
  <path d="M86 170 C90 176 196 228 300 228 C404 228 510 176 514 170 L476 404 C466 448 420 470 300 470 C180 470 134 448 124 404Z" fill="url(#cupW)" />
  <ellipse cx="300" cy="170" rx="214" ry="54" fill="#E9E1D1" /><ellipse cx="300" cy="172" rx="196" ry="46" fill="#2a1710" />
  <g clipPath="url(#cupIn)"><g data-k={k + '-liq'}><rect x="60" y="205" width="480" height="300" fill="#3a1c10" /><g data-k={k + '-crema'}><ellipse cx="300" cy="206" rx="215" ry="44" fill="url(#crema)" /><g data-k={k + '-bubbles'}>{Array.from({ length: 26 }, (_, i) => { const a = i * 2.399, r = Math.sqrt(i / 26) * 170; return <circle key={i} cx={300 + Math.cos(a) * r} cy={208 + Math.sin(a) * r * 0.2} r={2 + (i % 4)} fill="#F6DDB2" opacity=".75" />; })}</g></g></g></g>
  <g data-k={k + '-latte'}><g transform="translate(300 176) scale(1 .22)"><clipPath id="lcirc"><circle r="206" /></clipPath><image href="img/latteov.jpg" x="-300" y="-330" width="600" height="800" preserveAspectRatio="xMidYMid slice" clipPath="url(#lcirc)" /></g></g>
  <path d="M86 170 C90 176 196 228 300 228 C404 228 510 176 514 170" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="5" />
  <ellipse cx="300" cy="170" rx="214" ry="54" fill="none" stroke="#FFFDF7" strokeWidth="7" /><path d="M140 250 C150 360 170 420 190 440" stroke="rgba(255,255,255,.55)" strokeWidth="10" strokeLinecap="round" fill="none" /></svg></Box>; }
export function Steam({ k, h, v, z }) { return <Box k={k} h={h} v={v} z={z}><svg viewBox="0 0 300 320">{[40, 130, 220].map((x, i) => <path key={i} className="st" d={`M${x} 310 C${x - 40} 250 ${x + 40} 200 ${x} 140 C${x - 36} 90 ${x + 30} 50 ${x} 6`} fill="none" stroke="#fffdf7" strokeWidth={9 - i} strokeLinecap="round" opacity=".7" />)}</svg></Box>; }

// ------- grinder, exploded in layers -------
const teeth = (cx, cy, r1, r2, n) => Array.from({ length: n * 2 }, (_, i) => { const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r1 : r2; return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`; }).join(' ');
export function Grinder({ k, h, v, z }) { return <Box k={k} h={h} v={v} z={z} cls="sh"><svg viewBox="0 0 400 640"><defs><linearGradient id="st" x1="0" x2="1"><stop offset="0" stopColor="#8d8a85" /><stop offset=".4" stopColor="#e6e2da" /><stop offset="1" stopColor="#6b6762" /></linearGradient><linearGradient id="bk" x1="0" x2="1"><stop offset="0" stopColor="#1a1a1a" /><stop offset=".4" stopColor="#4a4745" /><stop offset="1" stopColor="#141414" /></linearGradient></defs>
  <g data-k={k + '-hopper'}><path d="M50 40 L350 40 L282 218 L118 218Z" fill="url(#st)" opacity=".92" /><path d="M50 40 L350 40 L282 218 L118 218Z" fill="none" stroke="#3B2118" strokeWidth="4" /><rect x="38" y="24" width="324" height="24" rx="12" fill="#B77A45" /><path d="M130 70 L96 40" stroke="#fff" strokeWidth="5" opacity=".4" /></g>
  <g data-k={k + '-burrs'}><ellipse cx="200" cy="270" rx="86" ry="26" fill="#3B2118" /><polygon points={teeth(200, 262, 70, 82, 22).split(' ').map((p) => { const [x, y] = p.split(',').map(Number); return `${x},${262 + (y - 262) * 0.3}`; }).join(' ')} fill="url(#st)" stroke="#24140F" strokeWidth="3" /><ellipse cx="200" cy="262" rx="34" ry="10" fill="#24140F" />
    <ellipse cx="200" cy="300" rx="86" ry="26" fill="#3B2118" /><polygon points={teeth(200, 292, 70, 82, 22).split(' ').map((p) => { const [x, y] = p.split(',').map(Number); return `${x},${292 + (y - 292) * 0.3}`; }).join(' ')} fill="#B77A45" stroke="#24140F" strokeWidth="3" /></g>
  <g data-k={k + '-body'}><rect x="108" y="330" width="184" height="200" rx="28" fill="url(#bk)" /><circle cx="200" cy="420" r="38" fill="#171717" stroke="#B77A45" strokeWidth="5" /><path d="M200 420 L200 392" stroke="#F2EBDD" strokeWidth="5" strokeLinecap="round" /><rect x="150" y="474" width="100" height="10" rx="5" fill="#B77A45" /></g>
  <g data-k={k + '-out'}><rect x="170" y="530" width="60" height="26" rx="6" fill="#171717" /><ellipse cx="200" cy="610" rx="86" ry="22" fill="#24140F" opacity=".25" /></g></svg></Box>; }

// ------- espresso machine cutout + portafilter -------
export function Machine({ k, h, v, z }) { return <Box k={k} h={h} v={v} z={z} cls="sh"><svg viewBox="0 0 760 760"><defs><linearGradient id="ms" x1="0" x2="1"><stop offset="0" stopColor="#8b8883" /><stop offset=".3" stopColor="#f0ece4" /><stop offset=".7" stopColor="#c9c4ba" /><stop offset="1" stopColor="#77736d" /></linearGradient></defs>
  <rect x="86" y="640" width="590" height="46" rx="12" fill="#24140F" /><rect x="110" y="650" width="540" height="12" rx="6" fill="#3B2118" />
  <rect x="70" y="70" width="620" height="330" rx="40" fill="url(#ms)" /><rect x="70" y="70" width="620" height="60" rx="30" fill="#24140F" opacity=".92" /><rect x="110" y="86" width="540" height="10" rx="5" fill="#B77A45" />
  <circle cx="160" cy="230" r="46" fill="#F2EBDD" stroke="#24140F" strokeWidth="6" /><path d="M160 230 L186 206" stroke="#BD493D" strokeWidth="6" strokeLinecap="round" /><circle cx="160" cy="230" r="6" fill="#24140F" />
  <circle cx="600" cy="230" r="46" fill="#F2EBDD" stroke="#24140F" strokeWidth="6" /><path d="M600 230 L578 252" stroke="#BD493D" strokeWidth="6" strokeLinecap="round" /><circle cx="600" cy="230" r="6" fill="#24140F" />
  {[290, 340, 390].map((x, i) => <circle key={i} cx={x + 0} cy="330" r="16" fill={i === 1 ? '#BD493D' : '#24140F'} />)}<rect x="270" y="190" width="220" height="60" rx="14" fill="#24140F" /><rect x="286" y="206" width="188" height="28" rx="6" fill="#B77A45" opacity=".9" />
  <rect x="290" y="400" width="180" height="60" rx="14" fill="#6b6762" /><g data-k={k + '-pf'}><ellipse cx="380" cy="470" rx="120" ry="30" fill="#24140F" /><path d="M262 470 L498 470 L470 540 L290 540Z" fill="url(#ms)" /><rect x="486" y="480" width="250" height="34" rx="17" fill="#3B2118" transform="rotate(16 486 480)" /><rect x="640" y="520" width="110" height="38" rx="19" fill="#B77A45" transform="rotate(16 640 520)" /><rect x="368" y="540" width="24" height="36" rx="6" fill="#6b6762" /></g>
  <path d="M380 580 L380 640" stroke="#B77A45" strokeWidth="7" strokeLinecap="round" strokeDasharray="2 12" /><path d="M300 560 C300 640 320 650 380 650 C440 650 460 640 460 560Z" fill="#FFFDF7" opacity=".0" /></svg></Box>; }

// extraction cross-section card
export function Diagram({ k, h, v, z }) { return <Box k={k} h={h} v={v} z={z}><svg viewBox="0 0 700 640"><defs><pattern id="puck" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#5a3320" /><circle cx="4" cy="4" r="2.4" fill="#2E170E" /><circle cx="11" cy="9" r="2" fill="#7a4a2e" /><circle cx="5" cy="12" r="1.6" fill="#24140F" /></pattern></defs>
  <rect x="150" y="30" width="400" height="44" rx="10" fill="#3B2118" /><g data-k={k + '-holes'}>{Array.from({ length: 9 }, (_, i) => <circle key={i} cx={190 + i * 40} cy="52" r="6" fill="#F2EBDD" />)}</g>
  <path d="M130 130 L570 130 L520 420 L180 420Z" fill="#E9E0CF" stroke="#24140F" strokeWidth="6" /><g data-k={k + '-puck'}><rect x="150" y="250" width="400" height="120" fill="url(#puck)" stroke="#24140F" strokeWidth="4" /></g>
  <path d="M180 420 L520 420 L500 470 L200 470Z" fill="#B8B1A3" stroke="#24140F" strokeWidth="5" />
  <g data-k={k + '-water'}>{Array.from({ length: 9 }, (_, i) => <path key={i} className="drop" d={`M${190 + i * 40} 84 L${190 + i * 40} 236`} stroke="#8CB4C8" strokeWidth="7" strokeLinecap="round" strokeDasharray="2 20" />)}</g>
  <g data-k={k + '-drip'}>{[250, 350, 450].map((x, i) => <path key={i} d={`M${x} 470 L${x} 612`} stroke="#B77A45" strokeWidth="9" strokeLinecap="round" />)}</g>
  <ellipse cx="350" cy="628" rx="170" ry="10" fill="#B77A45" opacity=".55" /></svg></Box>; }

// ------- map -------
export function WorldMap({ k, h, v, z, land = '#526A43', bg = 'transparent' }) { return <Box k={k} h={h} v={v} z={z}><svg viewBox={`0 0 ${MAPW} ${MAPH}`} style={{ background: bg, overflow: 'hidden' }}>
  <path d={LAND} fill={land} opacity=".55" /><g data-k={k + '-band'}><rect x="0" y={TROPIC_N} width={MAPW} height={TROPIC_S - TROPIC_N} fill="#B77A45" opacity=".32" /></g>
  <line className="tl" x1="0" x2={MAPW} y1={TROPIC_N} y2={TROPIC_N} stroke="#24140F" strokeWidth="1.6" strokeDasharray="5 6" /><line className="tl" x1="0" x2={MAPW} y1={TROPIC_S} y2={TROPIC_S} stroke="#24140F" strokeWidth="1.6" strokeDasharray="5 6" /><line className="tl" x1="0" x2={MAPW} y1={EQUATOR} y2={EQUATOR} stroke="#24140F" strokeWidth="1.2" opacity=".5" />
  <path data-k={k + '-route'} d={`M${MARK.colombia} Q 420 150 ${MARK.ethiopia} T ${MARK.vietnam}`} fill="none" stroke="#BD493D" strokeWidth="2.6" strokeDasharray="2 9" strokeLinecap="round" /></svg></Box>; }
export function MapMarker({ k, x, y, label, side = 'r' }) { return <div data-k={k} className="box" style={{ left: x, top: y, width: 0, height: 0, zIndex: 8 }}>
  <span data-k={k + '-ring'} className="dot" style={{ width: 54, height: 54, left: -27, top: -27, border: '3px solid #BD493D' }} /><span className="dot" style={{ width: 22, height: 22, left: -11, top: -11, background: '#BD493D', boxShadow: '0 0 0 5px #F2EBDD' }} />
  <span className="small" style={{ position: 'absolute', left: side === 'r' ? 30 : undefined, right: side === 'l' ? 30 : undefined, top: -14, fontSize: 19, color: '#24140F', background: '#F2EBDD', padding: '4px 10px', borderRadius: 6 }}>{label}</span></div>; }
export { MARK, MAPW, MAPH };
