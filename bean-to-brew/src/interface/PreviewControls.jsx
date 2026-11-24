import React from 'react';
import { clock, toggle, restart, set, setTime, frameOf } from '../animation/clockStore';
import { FPS, sceneAt } from '../animation/masterTimeline';
import { useClock } from './clockHooks';
import { soundPlayer } from '../audio/audioEngine';

const Btn = ({ onClick, title, active, children, wide }) => (
  <button className={`btn ${active ? 'on' : ''} ${wide ? 'wide' : ''}`} onClick={onClick} title={title}>{children}</button>
);

export default function PreviewControls({ onFullscreen, onCinematic, onExport, audioState }) {
  const c = useClock();
  const [muted, setMuted] = React.useState(false);
  return (
    <div className="controls">
      <Btn onClick={toggle} title="Play / pause (Space)" wide>{c.playing ? '❚❚ Pause' : '▶ Play'}</Btn>
      <Btn onClick={restart} title="Restart from 00:00">↺ Restart</Btn>
      <Btn onClick={() => { setTime((frameOf(c.time) - 1) / FPS, { snap: true }); }} title="Previous frame (←)">◀︎ 1f</Btn>
      <Btn onClick={() => { setTime((frameOf(c.time) + 1) / FPS, { snap: true }); }} title="Next frame (→)">1f ▶︎</Btn>
      <label className="sel">Speed
        <select value={c.speed} onChange={(e) => set({ speed: +e.target.value })}>
          {[0.1, 0.25, 0.5, 1, 1.5, 2].map((s) => <option key={s} value={s}>{s}×</option>)}
        </select>
      </label>
      <label className="sel">Quality
        <select value={c.quality} onChange={(e) => set({ quality: e.target.value })}>
          <option value="low">Low (fast)</option><option value="medium">Medium (DoF)</option><option value="high">High (DoF+bloom+MSAA)</option>
        </select>
      </label>
      <label className="chk" title="Steps the quality preset down automatically if playback drops below ~22 fps"><input type="checkbox" checked={c.autoQuality} onChange={(e) => set({ autoQuality: e.target.checked })} /> auto</label>
      <label className="sel">Format
        <select value={c.aspect} onChange={(e) => set({ aspect: e.target.value })}>
          <option value="16:9">16:9</option><option value="9:16">9:16</option><option value="1:1">1:1</option>
        </select>
      </label>
      <label className="sel">Camera
        <select value={c.cameraMode} onChange={(e) => set({ cameraMode: e.target.value })}>
          <option value="cinematic">Cinematic</option><option value="free">Free look (drag / wheel)</option>
        </select>
      </label>
      <label className="chk" title="Loop only the current scene (individual scene playback)"><input type="checkbox" checked={c.solo} onChange={(e) => { const sc = sceneAt(c.time); set({ solo: e.target.checked, soloRange: [sc.start, sc.end] }); }} /> loop scene</label>
      <Btn onClick={() => { const m = !muted; setMuted(m); soundPlayer.setMuted(m); }} title={audioState}>{muted ? '🔇 Muted' : '🔊 Sound'}</Btn>
      <Btn onClick={onFullscreen} title="Full-screen (F)">⛶ Full-screen</Btn>
      <Btn onClick={onCinematic} title="Clean cinematic playback (C)">🎬 Cinematic mode</Btn>
      <Btn onClick={onExport} title="Export MP4 / PNG">⬇ Export</Btn>
    </div>
  );
}
