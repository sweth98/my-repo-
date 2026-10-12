import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {lineById} from '../data';
import {clamp, ease, sp} from './anim';

export const SceneCtx = createContext<{start: number; id: string}>({start: 0, id: ''});
export const BeatCtx = createContext<{f: number; dur: number; p: number}>({f: 0, dur: 1, p: 0});

/** scene-local frame positions of a script line */
export const useL = () => {
  const sc = useContext(SceneCtx);
  return (id: string) => {
    const l = lineById(id);
    return {s: l.start - sc.start, e: l.end - sc.start, sp: l.speechEnd - sc.start, dur: l.end - l.start,
      cd: l.countdown ? {s: l.countdown.start - sc.start, e: l.countdown.end - sc.start} : undefined};
  };
};
export const useBeat = () => useContext(BeatCtx);

type BeatProps = {from: string; to?: string; pre?: number; post?: number; enter?: 'zoom' | 'slide' | 'fade' | 'none'; z?: number; children: React.ReactNode};
/** Shows its children while a script line (or line range) is active; entry/exit are springy, never abrupt. */
export const Beat: React.FC<BeatProps> = ({from, to, pre = 8, post = 12, enter = 'zoom', z = 0, children}) => {
  const f0 = useCurrentFrame();
  const L = useL();
  const a = L(from), b = L(to ?? from);
  const f = f0 - a.s;
  const dur = b.e - a.s;
  if (f < -pre || f > dur + post) return null;
  const inV = clamp(sp(f, -pre, {damping: 14, stiffness: 120}), 0, 1.06);
  const op = Math.min(clamp(inV, 0, 1) * 1.4, ease(f, dur, dur + post, 1, 0));
  const scale = enter === 'zoom' ? 0.88 + 0.12 * inV : 1;
  const slide = enter === 'slide' ? (1 - inV) * 120 : 0;
  return (
    <BeatCtx.Provider value={{f, dur, p: clamp(f / dur)}}>
      <AbsoluteFill style={{opacity: enter === 'none' ? 1 : op, transform: `translate(${slide}px,0) scale(${scale})`, transformOrigin: '50% 45%', zIndex: z}}>{children}</AbsoluteFill>
    </BeatCtx.Provider>
  );
};

/** quiet sound effect at a scene-local frame */
export const Sfx: React.FC<{name: string; at: number; vol?: number}> = ({name, at, vol = 0.4}) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={120} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
  </Sequence>
);

export const Full: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <AbsoluteFill style={style}>
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
  </AbsoluteFill>
);
