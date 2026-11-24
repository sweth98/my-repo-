import React, { useRef } from 'react';
import { SCENES, DURATION, FPS, TOTAL_FRAMES, sceneAt } from '../animation/masterTimeline';
import { setTime, frameOf, pause, clock } from '../animation/clockStore';
import { useClock } from './clockHooks';

export const timecode = (t) => {
  const f = Math.min(TOTAL_FRAMES - 1, Math.floor(t * FPS + 1e-6));
  const s = Math.floor(f / FPS);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(f % FPS).padStart(2, '0')}`;
};

export default function Timeline() {
  const c = useClock();
  const bar = useRef();
  const drag = useRef(false);
  const seek = (e) => {
    const r = bar.current.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setTime(f * DURATION, { snap: true });
  };
  const sc = sceneAt(c.time);
  return (
    <div className="timeline">
      <div className="tc"><b>{timecode(c.time)}</b><span>TC mm:ss:ff</span></div>
      <div
        className="bar" ref={bar}
        onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); seek(e); }}
        onPointerMove={(e) => drag.current && seek(e)}
        onPointerUp={() => (drag.current = false)}
      >
        {SCENES.map((s) => (
          <div key={s.id} className={`seg ${s.id === sc.id ? 'cur' : ''}`} style={{ left: `${(s.start / DURATION) * 100}%`, width: `${((s.end - s.start) / DURATION) * 100}%` }} title={`${s.id}. ${s.name}`}>
            <i>{s.id}</i>
          </div>
        ))}
        <div className="head" style={{ left: `${(c.time / DURATION) * 100}%` }} />
      </div>
      <div className="tc right"><b>Frame {frameOf(c.time)} / {TOTAL_FRAMES - 1}</b><span>{String(sc.id).padStart(2, '0')} · {sc.name}</span></div>
    </div>
  );
}
