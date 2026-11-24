// Frame-accurate offline export: renders every frame at an absolute timestamp, encodes with WebCodecs and muxes MP4.
// Requires a Chromium-based browser (VideoEncoder). Audio is the pre-rendered procedural soundtrack (AAC) when supported.
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { FPS, TOTAL_FRAMES } from './masterTimeline';
import { clock, set as setClock, pause, setTime } from './clockStore';
import { filmApi } from './filmApi';
import { drawTypography, loadFonts } from '../components/Typography';
import { soundPlayer } from '../audio/audioEngine';

export const FORMATS = {
  '16:9': { w: 1920, h: 1080, label: '16:9 · 1920×1080' },
  '9:16': { w: 1080, h: 1920, label: '9:16 · 1080×1920' },
  '1:1': { w: 1080, h: 1080, label: '1:1 · 1080×1080' },
};

export function exportSupport() {
  return { video: typeof VideoEncoder !== 'undefined', audio: typeof AudioEncoder !== 'undefined' };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function exportVideo({ format = '16:9', preferCodec = null, withAudio = true, startFrame = 0, endFrame = TOTAL_FRAMES, size = null, onProgress, signal } = {}) {
  if (typeof VideoEncoder === 'undefined') throw new Error('This browser has no WebCodecs VideoEncoder. Use a recent Chrome/Edge, or capture frames with window.__film.filmApi.renderAt(t,w,h).');
  const { w, h } = size || FORMATS[format];
  await loadFonts();
  const prev = { quality: clock.quality, time: clock.time, mode: clock.cameraMode };
  pause(); setClock({ quality: 'high', cameraMode: 'cinematic' });

  const candidates = [
    { codec: 'avc1.640034', mux: 'avc' }, { codec: 'avc1.4d0033', mux: 'avc' }, { codec: 'avc1.42003e', mux: 'avc' },
    { codec: 'vp09.00.50.08', mux: 'vp9' }, { codec: 'vp09.00.10.08', mux: 'vp9' },
  ];
  let chosen = null;
  if (preferCodec) candidates.sort((a, b) => (b.mux === preferCodec) - (a.mux === preferCodec));
  for (const c of candidates) {
    try { const r = await VideoEncoder.isConfigSupported({ codec: c.codec, width: w, height: h, bitrate: 16e6, framerate: FPS }); if (r.supported) { chosen = c; break; } } catch (e) { /* try next */ }
  }
  if (!chosen) { setClock(prev); throw new Error(`No supported video codec for ${w}×${h}.`); }

  let audioCfg = null; // AAC preferred (universal), Opus-in-MP4 as a fallback where AAC encoding is unavailable
  if (withAudio && typeof AudioEncoder !== 'undefined' && soundPlayer.buffer) {
    for (const c of [{ codec: 'mp4a.40.2', mux: 'aac' }, { codec: 'opus', mux: 'opus' }]) {
      try { if ((await AudioEncoder.isConfigSupported({ codec: c.codec, sampleRate: 44100, numberOfChannels: 2, bitrate: 192000 })).supported) { audioCfg = c; break; } } catch (e) { /* next */ }
    }
  }
  const audioOk = !!audioCfg;
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target, fastStart: 'in-memory',
    video: { codec: chosen.mux, width: w, height: h, frameRate: FPS },
    ...(audioOk ? { audio: { codec: audioCfg.mux, numberOfChannels: 2, sampleRate: 44100 } } : {}),
  });
  let encErr = null; let nChunks = 0, nBytes = 0;
  const venc = new VideoEncoder({ output: (c, m) => { nChunks++; nBytes += c.byteLength; muxer.addVideoChunk(c, m); }, error: (e) => { encErr = e; } });
  venc.configure({ codec: chosen.codec, width: w, height: h, bitrate: 16e6, framerate: FPS });

  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  try {
    for (let i = startFrame; i < endFrame; i++) {
      if (signal && signal.aborted) throw new Error('Export cancelled');
      if (encErr) throw encErr;
      const t = i / FPS;
      const glc = filmApi.renderAt(t, w, h);
      ctx.drawImage(glc, 0, 0, w, h);
      drawTypography(ctx, w, h, t, false);
      const frame = new VideoFrame(cv, { timestamp: Math.round(((i - startFrame) * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
      venc.encode(frame, { keyFrame: (i - startFrame) % 60 === 0 });
      frame.close();
      while (venc.encodeQueueSize > 6) await sleep(2);
      if ((i - startFrame) % 5 === 0) { onProgress && onProgress((i - startFrame) / (endFrame - startFrame)); await sleep(0); }
    }
    await venc.flush();
    if (audioOk) {
      const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => { encErr = e; } });
      aenc.configure({ codec: audioCfg.codec, sampleRate: 44100, numberOfChannels: 2, bitrate: 192000 });
      const buf = soundPlayer.buffer; const L = buf.getChannelData(0), R = buf.getChannelData(1);
      const s0 = Math.floor((startFrame / FPS) * 44100), s1 = Math.min(buf.length, Math.floor((endFrame / FPS) * 44100));
      for (let s = s0; s < s1; s += 4096) {
        const n = Math.min(4096, s1 - s); const data = new Float32Array(n * 2);
        data.set(L.subarray(s, s + n), 0); data.set(R.subarray(s, s + n), n);
        const ad = new AudioData({ format: 'f32-planar', sampleRate: 44100, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(((s - s0) / 44100) * 1e6), data });
        aenc.encode(ad); ad.close();
        while (aenc.encodeQueueSize > 16) await sleep(1);
      }
      await aenc.flush();
    }
    if (encErr) throw encErr;
    muxer.finalize();
    onProgress && onProgress(1);
    if (nChunks === 0) throw new Error(`The ${chosen.codec} encoder produced no frames in this browser build.`);
    return { blob: new Blob([target.buffer], { type: 'video/mp4' }), codec: chosen.codec, audio: audioOk ? audioCfg.mux : false, w, h, chunks: nChunks, videoBytes: nBytes };
  } finally {
    try { venc.close(); } catch (e) { /* closed */ }
    filmApi.restore && filmApi.restore();
    setClock({ quality: prev.quality, cameraMode: prev.mode }); setTime(prev.time);
  }
}

/** Save the current frame (WebGL + typography) as PNG at the given export size. */
export async function exportStill(format = '16:9', t = clock.time) {
  await loadFonts();
  const { w, h } = FORMATS[format];
  const prevQ = clock.quality; setClock({ quality: 'high' });
  const glc = filmApi.renderAt(t, w, h);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d');
  ctx.drawImage(glc, 0, 0, w, h); drawTypography(ctx, w, h, t, false);
  filmApi.restore && filmApi.restore(); setClock({ quality: prevQ }); setTime(t);
  return new Promise((res) => cv.toBlob(res, 'image/png'));
}

if (typeof window !== 'undefined') window.__exportVideo = exportVideo; // automation hook (tests / headless capture)
