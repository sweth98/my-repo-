import timing from './timing.json';
export type Word = {w: string; s: number; e: number};
export type LineT = {start: number; end: number; speechEnd: number; scene: string; emotion: string; text: string; words: Word[]; pages: number[][]; countdown?: {start: number; end: number}};
export const TIMING = timing as unknown as {voice: boolean; fps: number; total: number; scenes: {id: string; start: number; end: number}[]; lines: Record<string, LineT>};
export const FPS = TIMING.fps;
export const sceneById = (id: string) => TIMING.scenes.find((s) => s.id === id)!;
export const lineById = (id: string) => TIMING.lines[id];
/** frames (relative to the start of the line) at which a given word is read */
export const wordF = (id: string, w: string, nth = 0) => {
  const l = lineById(id);
  const m = l.words.filter((x) => x.w.toLowerCase().replace(/[^a-z0-9']/g, '') === w.toLowerCase());
  return (m[nth] ?? l.words[0]).s - l.start;
};
