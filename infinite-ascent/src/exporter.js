// Frame-accurate offline export: every frame is rendered from its own timeline time
// (t = frame / 30), encoded with WebCodecs and muxed to MP4 — independent of how fast
// the machine renders. Includes the synthesised soundtrack when AAC is available.
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { DURATION, FPS, FRAMES } from './config.js';

export function exportSupported() {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
}

async function pickVideoCodec(w, h) {
  const tries = [
    ['avc', 'avc1.64002a'],
    ['avc', 'avc1.4d0028'],
    ['vp9', 'vp09.00.40.08'],
  ];
  for (const [name, codec] of tries) {
    try {
      const s = await VideoEncoder.isConfigSupported({ codec, width: w, height: h, bitrate: 14e6, framerate: FPS });
      if (s.supported) return { name, codec };
    } catch { /* try next */ }
  }
  throw new Error('No supported WebCodecs video codec (need H.264 or VP9).');
}

export async function exportVideo(film, { width = 1080, height = 1920, audioBuffer = null, onProgress = () => {}, bitrate = 14e6 } = {}) {
  if (!exportSupported()) throw new Error('WebCodecs is not available in this browser.');
  const prev = { w: film.cssW, h: film.cssH, pr: film.pr };
  film.setSize(width, height, 1);
  const { name, codec } = await pickVideoCodec(width, height);

  let audioCfg = null;
  if (audioBuffer && typeof AudioEncoder !== 'undefined') {
    const cfg = { codec: 'mp4a.40.2', sampleRate: audioBuffer.sampleRate, numberOfChannels: 2, bitrate: 192000 };
    try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) audioCfg = cfg; } catch { /* no audio track */ }
  }

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: name, width, height, frameRate: FPS },
    audio: audioCfg ? { codec: 'aac', sampleRate: audioCfg.sampleRate, numberOfChannels: 2 } : undefined,
    fastStart: 'in-memory',
  });
  const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { throw e; } });
  venc.configure({ codec, width, height, bitrate, framerate: FPS, latencyMode: 'quality' });

  const canvas = film.renderer.domElement;
  for (let f = 0; f < FRAMES; f++) {
    film.renderAt(f / FPS);
    const frame = new VideoFrame(canvas, { timestamp: Math.round((f * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    venc.encode(frame, { keyFrame: f % 60 === 0 });
    frame.close();
    while (venc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 2));
    if (f % 15 === 0) { onProgress(f / FRAMES); await new Promise((r) => setTimeout(r, 0)); }
  }
  await venc.flush();

  if (audioCfg) {
    const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: () => {} });
    aenc.configure(audioCfg);
    const L = audioBuffer.getChannelData(0);
    const R = audioBuffer.getChannelData(1);
    const CH = 4096;
    for (let i = 0; i < L.length; i += CH) {
      const n = Math.min(CH, L.length - i);
      const data = new Float32Array(n * 2);
      data.set(L.subarray(i, i + n), 0);
      data.set(R.subarray(i, i + n), n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: audioBuffer.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / audioBuffer.sampleRate) * 1e6), data });
      aenc.encode(ad); ad.close();
    }
    await aenc.flush();
  }
  muxer.finalize();
  film.setSize(prev.w, prev.h, prev.pr);
  film.renderAt(film.t);
  onProgress(1);
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), codec, audio: !!audioCfg, duration: DURATION };
}

export function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
