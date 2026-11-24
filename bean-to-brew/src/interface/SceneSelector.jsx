import React from 'react';
import { SCENES, sceneAt } from '../animation/masterTimeline';
import { setTime, set, clock } from '../animation/clockStore';
import { useClock } from './clockHooks';

export default function SceneSelector() {
  const c = useClock();
  const cur = sceneAt(c.time).id;
  return (
    <div className="scenes">
      {SCENES.map((s) => (
        <button key={s.id} className={`chip ${cur === s.id ? 'on' : ''}`} onClick={() => { if (clock.solo) set({ soloRange: [s.start, s.end] }); setTime(s.start, { snap: true }); }} title={`${s.start}s – ${s.end}s`}>
          <b>{String(s.id).padStart(2, '0')}</b> {s.name}
        </button>
      ))}
    </div>
  );
}
