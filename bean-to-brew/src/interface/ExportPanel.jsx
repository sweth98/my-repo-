import React, { useRef, useState } from 'react';
import { FORMATS, exportVideo, exportStill, exportSupport } from '../animation/exporter';
import { clock } from '../animation/clockStore';
import { TOTAL_FRAMES } from '../animation/masterTimeline';

const download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };

export default function ExportPanel({ onClose }) {
  const [fmt, setFmt] = useState('16:9');
  const [audio, setAudio] = useState(true);
  const [codec, setCodec] = useState('avc');
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState(0);
  const [msg, setMsg] = useState('');
  const ctl = useRef(null);
  const sup = exportSupport();

  const run = async () => {
    setBusy(true); setMsg(''); setProg(0); ctl.current = new AbortController();
    try {
      const r = await exportVideo({ format: fmt, preferCodec: codec, withAudio: audio, onProgress: setProg, signal: ctl.current.signal });
      download(r.blob, `from-bean-to-brew_${fmt.replace(':', 'x')}.mp4`);
      setMsg(`Done: ${r.w}×${r.h}, ${r.codec}${r.audio ? ' + ' + r.audio.toUpperCase() + ' audio' : ' (no audio track)'}, ${(r.blob.size / 1e6).toFixed(1)} MB`);
    } catch (e) { setMsg('Export failed: ' + e.message); }
    setBusy(false);
  };
  const still = async () => { const b = await exportStill(fmt); download(b, `frame_${String(Math.floor(clock.time * 30)).padStart(4, '0')}_${fmt.replace(':', 'x')}.png`); };

  return (
    <div className="modal" onClick={() => !busy && onClose()}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <h3>Export</h3>
        <p className="muted">Offline, frame-accurate render: all {TOTAL_FRAMES} frames are rendered at exact timestamps (not screen-recorded), encoded with WebCodecs and muxed to MP4.</p>
        <label className="sel">Format
          <select value={fmt} onChange={(e) => setFmt(e.target.value)} disabled={busy}>{Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        </label>
        <label className="sel">Codec
          <select value={codec} onChange={(e) => setCodec(e.target.value)} disabled={busy}><option value="avc">H.264 (most compatible)</option><option value="vp9">VP9 (fallback if H.264 fails)</option></select>
        </label>
        <label className="chk"><input type="checkbox" checked={audio} onChange={(e) => setAudio(e.target.checked)} disabled={busy || !sup.audio} /> Include synthesized soundtrack (AAC, or Opus where AAC encoding is unavailable){!sup.audio && ' — AudioEncoder unavailable'}</label>
        {!sup.video && <p className="warn">This browser has no WebCodecs <code>VideoEncoder</code>. Use Chrome/Edge for MP4 export, or save single frames as PNG below.</p>}
        {busy && <div className="progress"><div style={{ width: `${prog * 100}%` }} /></div>}
        {msg && <p className="muted">{msg}</p>}
        <div className="row">
          <button className="btn wide" onClick={run} disabled={busy || !sup.video}>{busy ? `Rendering… ${(prog * 100).toFixed(0)}%` : 'Export MP4'}</button>
          {busy && <button className="btn" onClick={() => ctl.current.abort()}>Cancel</button>}
          <button className="btn" onClick={still} disabled={busy}>Save current frame (PNG)</button>
          <button className="btn" onClick={onClose} disabled={busy}>Close</button>
        </div>
      </div>
    </div>
  );
}
