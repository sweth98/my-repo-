import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { FmtCtx, C } from './art.jsx';
import { createCtx, reset, REG } from './engine.js';
import * as audio from './audio.js';
import * as S1 from './scenes/s1.jsx'; import * as S2 from './scenes/s2.jsx'; import * as S3 from './scenes/s3.jsx'; import * as S4 from './scenes/s4.jsx'; import * as S5 from './scenes/s5.jsx'; import * as S6 from './scenes/s6.jsx'; import * as S7 from './scenes/s7.jsx';
const SCENES = [S1, S2, S3, S4, S5, S6, S7];
const MARKS = [...SCENES.map((s) => s.meta), S7.meta8];
const DUR = 60, FPS = 30;
const q = new URLSearchParams(location.search);
const WAVE = (W, H) => { let d = `M0 70`; for (let x = 0; x < W * 2; x += 480) d += ` Q ${x + 120} 0 ${x + 240} 70 T ${x + 480} 70`; return d + ` L${W * 2} 160 L0 160Z`; };
const fmt2 = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(2).padStart(5, '0')}`;

function Stage({ fmt, onReady }) {
  const root = useRef(null); const V = fmt === 'v', W = V ? 1080 : 1920, H = V ? 1920 : 1080;
  useLayoutEffect(() => {
    reset(); const c = createCtx(root.current, fmt); const tl = gsap.timeline({ paused: true });
    gsap.set(c.qa('.scene'), { autoAlpha: 0 });
    SCENES.forEach((s) => s.build(tl, c));
    // continuity transitions between scenes are authored inside each scene's build(); finalize duration
    tl.to({}, { duration: 0.001 }, DUR - 0.001);
    REG.forEach((r, id) => { if (!/^[\w-]+$/.test(id)) { REG.delete(id); return; } const el = c.root.querySelector(`[data-k="${id}"]`); if (el) r.layer = parseInt(getComputedStyle(el).zIndex) || 0; });
    onReady({ tl, c }); return () => { tl.kill(); };
  }, [fmt]);
  return <div ref={root} className="stage" style={{ width: W, height: H }}>
    <FmtCtx.Provider value={fmt}>{SCENES.map((s, i) => <s.Scene key={i} />)}</FmtCtx.Provider>
    <div className="wipe" data-k="wipe-a" /><div className="wipe" data-k="wipe-b" />
    <div className="wipe" data-k="wipe-c" /><div className="wipe" data-k="wipe-e" />
    <div className="wipe" data-k="wipe-d" style={{ height: H + 400, overflow: 'visible' }}><svg data-k="wipe-d-wave" width={W * 2} height="160" style={{ display: 'block', position: 'absolute', top: 0, left: 0 }}><path d={WAVE(W, H)} fill={C.caramel} /></svg><div style={{ position: 'absolute', top: 159, left: 0, right: 0, bottom: 0, background: C.caramel }} /></div>
  </div>;
}

export default function App() {
  const [fmt, setFmt] = useState(q.get('fmt') === 'v' ? 'v' : 'h'); const [clean, setClean] = useState(q.has('clean'));
  const [h, setH] = useState(null); const [t, setT] = useState(0); const [playing, setPlaying] = useState(false); const [rate, setRate] = useState(1); const [muted, setMuted] = useState(false); const [spec, setSpec] = useState(false);
  const vp = useRef(null); const [scale, setScale] = useState(0.5); const W = fmt === 'v' ? 1080 : 1920, H = fmt === 'v' ? 1920 : 1080; const was = useRef(false);
  useEffect(() => { const f = () => { const r = vp.current.getBoundingClientRect(); setScale(Math.min(r.width / W, r.height / H)); }; f(); const ro = new ResizeObserver(f); ro.observe(vp.current); return () => ro.disconnect(); }, [W, H, clean]);
  const onReady = useCallback((x) => { setH(x); setT(0); setPlaying(false); audio.stop(); window.__tl = x.tl; window.__seek = (v) => { x.tl.pause(); x.tl.time(v); setT(v); }; }, []);
  useEffect(() => { if (!h) return; const tl = h.tl; tl.timeScale(rate); const upd = () => setT(tl.time()); tl.eventCallback('onUpdate', upd); tl.eventCallback('onComplete', () => { setPlaying(false); audio.stop(); }); return () => { tl.eventCallback('onUpdate', null); }; }, [h, rate]);
  const play = () => { if (!h) return; if (h.tl.time() >= DUR - 0.05) h.tl.time(0); h.tl.timeScale(rate).play(); setPlaying(true); audio.start(h.tl.time(), rate, muted); };
  const pause = () => { h?.tl.pause(); setPlaying(false); audio.stop(); };
  const restart = () => { if (!h) return; audio.stop(); h.tl.time(0).timeScale(rate).play(); setPlaying(true); audio.start(0, rate, muted); };
  const seek = (v, keep) => { if (!h) return; h.tl.pause(); h.tl.time(v); setT(v); audio.stop(); if (keep) { h.tl.play(); audio.start(v, rate, muted); } };
  const toggleFS = () => { const el = document.documentElement; (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.())?.catch?.(() => {}); };
  useEffect(() => { const k = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); } if (e.key === 'c') setClean((x) => !x); if (e.key === 'f') toggleFS(); if (e.key === 'ArrowRight') seek(Math.min(DUR, t + 1)); if (e.key === 'ArrowLeft') seek(Math.max(0, t - 1)); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); });
  useEffect(() => { audio.setMuted(muted); }, [muted]);
  const rows = useMemo(() => (h ? [...REG.values()].sort((a, b) => a.start - b.start) : []), [h]);
  const cur = MARKS.filter((m) => t >= m.start).pop();
  const exportWav = async () => { const w = await audio.renderWav(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([w], { type: 'audio/wav' })); a.download = 'from-bean-to-brew.wav'; a.click(); };
  const exportSpec = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 1)], { type: 'application/json' })); a.download = 'timeline-spec.json'; a.click(); };
  useEffect(() => { window.__audioWavB64 = async () => { const w = await audio.renderWav(); let s = ''; const ch = 0x8000; for (let i = 0; i < w.length; i += ch) s += String.fromCharCode.apply(null, w.subarray(i, i + ch)); return btoa(s); }; window.__ready = !!h; });
  return <div className={'app' + (clean ? ' clean' : '')}>
    <div className="viewport" ref={vp} onClick={() => clean && (playing ? pause() : play())}>
      <div className="stageWrap" style={{ width: W * scale, height: H * scale }}><div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: W, height: H, position: 'absolute' }}><Stage key={fmt} fmt={fmt} onReady={onReady} /></div></div>
    </div>
    <div className="ui">
      <div className="row">
        <button onClick={playing ? pause : play} className="on">{playing ? '❚❚ Pause' : '▶ Play'}</button><button onClick={restart}>↺ Restart</button>
        <span className="time">{fmt2(t)} / 01:00.00</span>
        <input className="scrub" type="range" min="0" max={DUR} step={1 / FPS} value={t} onPointerDown={() => { was.current = playing; }} onChange={(e) => seek(+e.target.value)} onPointerUp={() => was.current && seek(t, true)} />
        <select value={rate} onChange={(e) => setRate(+e.target.value)}>{[0.25, 0.5, 1, 1.5, 2].map((r) => <option key={r} value={r}>{r}×</option>)}</select>
        <button onClick={() => setMuted(!muted)}>{muted ? '🔇 Muted' : '🔊 Sound'}</button><button onClick={toggleFS}>⛶ Full screen</button><button onClick={() => setClean(true)}>Clean mode (C)</button>
      </div>
      <div className="row">{MARKS.map((m, i) => <button key={m.id} className={cur?.id === m.id ? 'on' : ''} onClick={() => seek(Math.min(m.start + (i === 0 ? 0.2 : 0.9), DUR - 0.01))}>{m.name}</button>)}</div>
      <div className="row"><button className={fmt === 'h' ? 'on' : ''} onClick={() => setFmt('h')}>16:9 · 1920×1080</button><button className={fmt === 'v' ? 'on' : ''} onClick={() => setFmt('v')}>9:16 · 1080×1920</button><button onClick={() => setSpec(!spec)}>Timeline spec</button><button onClick={exportSpec}>Export spec JSON</button><button onClick={exportWav}>Render audio (WAV)</button></div>
      {spec && <div className="spec"><table><thead><tr><th>element</th><th>start</th><th>end</th><th>entrance</th><th>hold</th><th>exit</th><th>ease</th><th>layer</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.start?.toFixed(2)}</td><td>{r.end?.toFixed(2) ?? '—'}</td><td>{r.entrance}</td><td>{r.hold ?? '—'}</td><td>{r.exit ?? '—'}</td><td>{r.ease}</td><td>{r.layer}</td></tr>)}</tbody></table></div>}
    </div>
  </div>;
}
