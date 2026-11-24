import React, { useEffect, useState } from 'react';
import { toggle, restart } from '../animation/clockStore';
import { DURATION } from '../animation/masterTimeline';
import { useClock } from './clockHooks';

/**
 * Clean cinematic playback: no dev controls. Click / Space toggles pause, Esc exits.
 * Shows only a hairline progress bar and fades the cursor away.
 */
export default function PlaybackMode({ onExit }) {
  const c = useClock();
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let to; const wake = () => { setIdle(false); clearTimeout(to); to = setTimeout(() => setIdle(true), 2200); };
    wake(); window.addEventListener('mousemove', wake);
    return () => { window.removeEventListener('mousemove', wake); clearTimeout(to); };
  }, []);
  return (
    <div className="cinema" style={{ cursor: idle ? 'none' : 'default' }} onClick={() => (c.time >= DURATION - 0.05 ? restart() : toggle())}>
      <div className="cinema-progress" style={{ width: `${(c.time / DURATION) * 100}%`, opacity: idle ? 0 : 0.7 }} />
      <button className="cinema-exit" style={{ opacity: idle ? 0 : 0.8 }} onClick={(e) => { e.stopPropagation(); onExit(); }}>Esc · exit</button>
    </div>
  );
}
