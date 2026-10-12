import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {TIMING, LineT} from '../data';
import {C, FONT, FONT2, LAW, LAW_NAME} from '../theme';
import {clamp, ease, easeOut, seeded, sp} from './anim';

const sceneAt = (f: number) => TIMING.scenes.find((s) => f >= s.start && f < s.end) ?? TIMING.scenes[TIMING.scenes.length - 1];

/** animated navy background with slowly drifting shapes */
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const sc = sceneAt(f);
  const accent = LAW[sc.id] ?? C.blue;
  return (
    <AbsoluteFill style={{background: `radial-gradient(1400px 900px at 70% 20%, ${C.navy2} 0%, ${C.navy} 70%)`}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 9}).map((_, i) => {
          const r = 90 + seeded(i) * 160;
          const x = (seeded(i + 11) * 2200 + f * (0.25 + seeded(i + 3) * 0.4)) % 2300 - 200;
          const y = 80 + seeded(i + 5) * 920 + Math.sin(f / 60 + i) * 24;
          return <circle key={i} cx={x} cy={y} r={r} fill={accent} opacity={0.05 + seeded(i + 7) * 0.05} />;
        })}
        {Array.from({length: 40}).map((_, i) => (
          <circle key={`s${i}`} cx={seeded(i * 2) * 1920} cy={seeded(i * 2 + 1) * 700} r={1.5 + seeded(i) * 2.2} fill="#fff" opacity={0.25 + 0.35 * Math.abs(Math.sin(f / 30 + i))} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** chapter tag (top-left) + progress bar (top) */
export const Chrome: React.FC = () => {
  const f = useCurrentFrame();
  const sc = sceneAt(f);
  const accent = LAW[sc.id] ?? C.yellow;
  const inV = sp(f, sc.start + 14, {damping: 14, stiffness: 120});
  const show = sc.id !== 'hook' || f > 150;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: 10, background: 'rgba(255,255,255,0.08)'}}>
        <div style={{width: `${(f / TIMING.total) * 100}%`, height: '100%', background: accent, borderRadius: 5}} />
        {TIMING.scenes.slice(1).map((s) => (
          <div key={s.id} style={{position: 'absolute', left: `${(s.start / TIMING.total) * 100}%`, top: 0, width: 4, height: 10, background: '#0B1437'}} />
        ))}
      </div>
      {show && (
        <div style={{position: 'absolute', left: 48, top: 36, transform: `translateX(${(1 - Math.min(1, inV)) * -80}px)`, opacity: clamp(inV)}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(7,12,38,0.78)', border: `3px solid ${accent}`, borderRadius: 40, padding: '10px 30px 10px 18px'}}>
            <div style={{width: 26, height: 26, borderRadius: 13, background: accent}} />
            <span style={{fontFamily: FONT2, fontWeight: 800, fontSize: 38, color: '#fff', letterSpacing: 0.5}}>{LAW_NAME[sc.id]}</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const LINES: (LineT & {id: string})[] = Object.entries(TIMING.lines).map(([id, l]) => ({id, ...l})).sort((a, b) => a.start - b.start);

/** Karaoke captions: max two lines, words light up as they are read. Text comes straight from script.json. */
export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const line = LINES.find((l) => f >= l.start - 6 && f <= l.end + 4);
  if (!line) return null;
  const accent = LAW[line.scene] ?? C.yellow;
  let pi = 0;
  line.pages.forEach(([a], i) => { if (f >= line.words[a].s - 8) pi = i; });
  const [a, b] = line.pages[pi];
  const pageStart = pi === 0 ? line.start - 6 : line.words[a].s - 8;
  const inV = sp(f, pageStart, {damping: 16, stiffness: 160});
  const out = ease(f, line.end, line.end + 4, 1, 0);
  const words = line.words.slice(a, b + 1);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 120, right: 120, bottom: 52, display: 'flex', justifyContent: 'center', opacity: clamp(inV * 1.5) * out, transform: `translateY(${(1 - Math.min(1, inV)) * 26}px)`}}>
        <div style={{background: 'rgba(7,12,38,0.86)', border: `3px solid ${accent}88`, borderRadius: 34, padding: '18px 46px 22px', textAlign: 'center', maxWidth: 1660, boxShadow: '0 10px 40px rgba(0,0,0,0.35)'}}>
          <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 56, lineHeight: 1.34, color: '#fff'}}>
            {words.map((w, i) => {
              const spoken = f >= w.e, active = f >= w.s && f < w.e;
              const k = active ? 1 : 0;
              return (
                <span key={i} style={{display: 'inline-block', marginRight: i < words.length - 1 ? '0.32em' : 0, color: active ? C.yellow : spoken ? '#fff' : 'rgba(255,255,255,0.5)', transform: `scale(${1 + 0.05 * k}) translateY(${-2 * k}px)`, textShadow: active ? `0 0 18px ${C.yellow}66` : 'none', fontWeight: 600}}>
                  {w.w}
                </span>
              );
            })}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** whip-pan / shape wipes hiding every scene cut */
export const Wipes: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {TIMING.scenes.slice(1).map((sc, i) => {
        const b = sc.start;
        if (f < b - 14 || f > b + 16) return null;
        const color = LAW[sc.id] ?? C.blue;
        const x = f < b ? ease(f, b - 14, b, -2500, 0, (t) => t * t * (3 - 2 * t)) : ease(f, b, b + 16, 0, 2500, (t) => t * t * (3 - 2 * t));
        const label = LAW_NAME[sc.id];
        const lab = clamp(1 - Math.abs(f - b) / 9);
        return (
          <AbsoluteFill key={i} style={{pointerEvents: 'none', overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: -240, top: -50, width: 2400, height: 1180, transform: `translateX(${x}px) skewX(-12deg)`, background: `linear-gradient(90deg, ${color}, ${color}DD)`, boxShadow: '0 0 80px rgba(0,0,0,0.4)'}} />
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: lab, transform: `scale(${0.85 + 0.2 * lab})`}}>
              <span style={{fontFamily: FONT2, fontWeight: 800, fontSize: 130, color: '#fff', textShadow: '0 8px 0 rgba(0,0,0,0.2)'}}>{label}</span>
            </div>
          </AbsoluteFill>
        );
      })}
      {TIMING.scenes.slice(1).map((sc, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, sc.start - 14)} durationInFrames={60} layout="none">
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.45} />
        </Sequence>
      ))}
    </>
  );
};

/** music level: gentle swell in pauses; ducks to ~13% if a narrator is present */
const SPEECH = LINES.filter((l) => !l.countdown || true).map((l) => [l.start, l.speechEnd] as const);
export const musicVolume = (f: number) => {
  let d = 9999;
  for (const [s, e] of SPEECH) {
    if (f >= s && f <= e) { d = 0; break; }
    d = Math.min(d, f < s ? s - f : f - e);
  }
  const k = clamp(d / 12);
  const low = TIMING.voice ? 0.13 : 0.8, high = TIMING.voice ? 0.22 : 1.0;
  const fadeOut = ease(f, TIMING.total - 120, TIMING.total - 6, 1, 0);
  return (low + (high - low) * k) * fadeOut;
};
