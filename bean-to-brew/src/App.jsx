import React, { useCallback, useEffect, useRef, useState } from 'react';
import Film from './components/Film';
import Typography from './components/Typography';
import PreviewControls from './interface/PreviewControls';
import Timeline from './interface/Timeline';
import SceneSelector from './interface/SceneSelector';
import PlaybackMode from './interface/PlaybackMode';
import ExportPanel from './interface/ExportPanel';
import { useClock } from './interface/clockHooks';
import { clock, play, pause, toggle, setTime, set as setClock, subscribe, frameOf, restart } from './animation/clockStore';
import { FPS, SCENES, sceneAt, DURATION } from './animation/masterTimeline';
import { filmApi } from './animation/filmApi';
import { soundPlayer } from './audio/audioEngine';
window.__sound = soundPlayer;
import { SOUND_CUES } from './audio/soundTimeline';

const RATIO = { '16:9': 16 / 9, '9:16': 9 / 16, '1:1': 1 };

export default function App() {
  const c = useClock();
  const area = useRef();
  const root = useRef();
  const [box, setBox] = useState({ w: 960, h: 540 });
  const [cinema, setCinema] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(0);        // scene warm-up progress 0..1
  const [audio, setAudio] = useState({ state: 'rendering', p: 0 });

  // fit the chosen aspect ratio inside the available area
  useEffect(() => {
    const el = area.current; if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect(); const ar = RATIO[clock.aspect];
      const w = Math.min(r.width, r.height * ar); setBox({ w: Math.floor(w), h: Math.floor(w / ar) });
    };
    const ro = new ResizeObserver(fit); ro.observe(el); fit();
    const un = subscribe(fit);
    return () => { ro.disconnect(); un(); };
  }, [cinema]);

  // warm up shaders + render the soundtrack in the background
  useEffect(() => {
    let dead = false;
    const wait = setInterval(async () => {
      if (!filmApi.ready || !filmApi.warmup) return;
      clearInterval(wait);
      await filmApi.warmup((p) => !dead && setReady(p));
      !dead && setReady(1);
    }, 100);
    soundPlayer.prepare((p) => setAudio({ state: p >= 1 ? 'ready' : 'rendering', p })).then(() => setAudio({ state: 'ready', p: 1 })).catch((e) => setAudio({ state: 'unavailable', p: 0, err: e.message }));
    return () => { dead = true; clearInterval(wait); };
  }, []);

  // keep audio locked to the master clock (resync on seek / drift, mute at non-1× speeds)
  useEffect(() => subscribe(() => {
    if (clock.playing && clock.speed === 1) {
      const pos = soundPlayer.position();
      if (soundPlayer.buffer && (pos === null || Math.abs(pos - clock.time) > 0.18)) soundPlayer.playFrom(clock.time);
    } else soundPlayer.stop();
  }), []);

  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen(); else (root.current || document.documentElement).requestFullscreen?.();
  }, []);
  const enterCinema = useCallback(() => { setCinema(true); root.current?.requestFullscreen?.().catch(() => {}); if (!clock.playing) play(); setStarted(true); }, []);
  const exitCinema = useCallback(() => { setCinema(false); if (document.fullscreenElement) document.exitFullscreen(); }, []);
  useEffect(() => {
    const on = () => { if (!document.fullscreenElement) setCinema(false); };
    document.addEventListener('fullscreenchange', on); return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  useEffect(() => {
    const key = (e) => {
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
      const f = frameOf(clock.time);
      if (e.code === 'Space') { e.preventDefault(); setStarted(true); toggle(); }
      else if (e.code === 'ArrowLeft') setTime((f - (e.shiftKey ? 10 : 1)) / FPS, { snap: true });
      else if (e.code === 'ArrowRight') setTime((f + (e.shiftKey ? 10 : 1)) / FPS, { snap: true });
      else if (e.key === '[' || e.key === ']') { const i = sceneAt(clock.time).id - 1 + (e.key === ']' ? 1 : -1); const s = SCENES[Math.max(0, Math.min(SCENES.length - 1, i))]; setTime(s.start, { snap: true }); }
      else if (e.key === 'f') fullscreen();
      else if (e.key === 'c') (cinema ? exitCinema() : enterCinema());
      else if (e.key === 'Escape' && cinema) exitCinema();
      else if (e.key === 'Home') setTime(0);
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [cinema, fullscreen, enterCinema, exitCinema]);

  const loading = ready < 1;
  const sceneName = sceneAt(c.time);
  return (
    <div className={`app ${cinema ? 'cinema-on' : ''}`} ref={root}>
      {!cinema && (
        <header>
          <div><h1>FROM BEAN TO BREW</h1><span>THE LIFE OF A CUP OF COFFEE · 60 s · 1920×1080 · 30 fps · 1800 frames</span></div>
          <div className="hint">Space play/pause · ←/→ frame · Shift+←/→ 10 frames · [ ] scene · F full-screen · C cinematic</div>
        </header>
      )}
      <div className="area" ref={area}>
        <div className="stage" style={{ width: box.w, height: box.h }}>
          <Film />
          <Typography />
          {loading && <div className="overlay"><div className="spin" /><div>Preparing scenes… {(ready * 100).toFixed(0)}%</div></div>}
          {!loading && !started && !c.playing && c.time < 0.05 && (
            <button className="overlay start" onClick={() => { setStarted(true); play(); }}>
              <span className="big">▶</span><span>Play film</span>
              <small>{audio.state === 'ready' ? 'Sound ready (procedurally synthesized)' : audio.state === 'rendering' ? 'Rendering soundtrack…' : 'Sound unavailable'}</small>
            </button>
          )}
        </div>
        {cinema && <PlaybackMode onExit={exitCinema} />}
      </div>
      {!cinema && (
        <footer>
          <Timeline />
          <PreviewControls onFullscreen={fullscreen} onCinematic={enterCinema} onExport={() => { pause(); setExporting(true); }} audioState={audio.state === 'ready' ? 'Soundtrack ready' : 'Soundtrack: ' + audio.state} />
          <SceneSelector />
          <details className="cues"><summary>Sound cue sheet ({SOUND_CUES.length} cues · synthesized, not recorded)</summary>
            <table><tbody>{SOUND_CUES.map((q) => <tr key={q.id + q.t} className={q.scene === sceneName.id ? 'cur' : ''}><td>{q.t.toFixed(2)}s</td><td>S{q.scene}</td><td>{q.layer}</td><td>{q.label}</td><td className="muted">{q.file}</td></tr>)}</tbody></table>
          </details>
        </footer>
      )}
      {exporting && <ExportPanel onClose={() => setExporting(false)} />}
    </div>
  );
}
