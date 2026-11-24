import React, { useEffect, useRef } from 'react';
import { TEXT_CUES, filmState, seekMaster } from '../animation/masterTimeline';
import { clock, subscribe } from '../animation/clockStore';

const GOLD_A = '#f1d6a0', GOLD_B = '#c58a4d', CREAM = '#e7d3b8';
const SERIF = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const SANS = 'Inter, Manrope, system-ui, sans-serif';

function tracked(ctx, str, x, y, trackPx, align = 'left') {
  // manual letter-spacing (works in every canvas implementation, incl. offline export)
  const widths = [...str].map((c) => ctx.measureText(c).width + trackPx);
  const total = widths.reduce((a, b) => a + b, 0) - trackPx;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = ctx.textAlign; ctx.textAlign = 'left';
  [...str].forEach((c, i) => { ctx.fillText(c, cx, y); cx += widths[i]; });
  ctx.textAlign = prev;
  return total;
}
function wrapTracked(ctx, str, maxW, trackPx) {
  const words = str.split(' '); const lines = []; let cur = '';
  const w = (s) => [...s].reduce((a, c) => a + ctx.measureText(c).width + trackPx, 0) - trackPx;
  words.forEach((wd) => { const test = cur ? cur + ' ' + wd : wd; if (w(test) > maxW && cur) { lines.push(cur); cur = wd; } else cur = test; });
  if (cur) lines.push(cur);
  return lines;
}

/** Draws the film typography for time t. Pure: the same function feeds the live overlay and the video export. */
export function drawTypography(ctx, w, h, t, clear = true) {
  seekMaster(t);
  if (clear) ctx.clearRect(0, 0, w, h);
  const portrait = w / h < 1.15;
  const u = Math.min(h, w * 0.62); // type unit
  const margin = portrait ? w * 0.5 : w * 0.075;
  const align = portrait ? 'center' : 'left';
  // soft readability scrim behind the end lock-up (keeps the plantation visible, lowers busy contrast on the left)
  const so = Math.max(filmState.cues.title.o, filmState.cues.final.o);
  if (so > 0.003) {
    const sg = ctx.createLinearGradient(0, 0, w * (portrait ? 1 : 0.72), 0);
    if (portrait) { sg.addColorStop(0, 'rgba(14,22,6,0.5)'); sg.addColorStop(1, 'rgba(14,22,6,0.5)'); }
    else { sg.addColorStop(0, 'rgba(14,22,6,0.62)'); sg.addColorStop(0.65, 'rgba(14,22,6,0.28)'); sg.addColorStop(1, 'rgba(14,22,6,0)'); }
    ctx.globalAlpha = so; ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
  }
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = u * 0.02;
  TEXT_CUES.forEach((c) => {
    const s = filmState.cues[c.id];
    if (!s || s.o < 0.003) return;
    ctx.globalAlpha = Math.min(1, s.o);
    if (c.style === 'line') {
      const fs = u * (portrait ? 0.036 : 0.03);
      ctx.font = `400 ${fs}px ${SANS}`; ctx.fillStyle = CREAM;
      const track = fs * (0.3 + s.track);
      const lines = wrapTracked(ctx, c.text, w * (portrait ? 0.84 : 0.7), track);
      const lh = fs * 1.7;
      const baseY = (portrait ? h * 0.86 : h * 0.885) - (lines.length - 1) * lh + s.y;
      // fine rule
      ctx.fillStyle = GOLD_B; ctx.fillRect(align === 'center' ? w / 2 - u * 0.02 : margin, baseY - fs * 2.5 - lines.length * 0, u * 0.04, Math.max(1, u * 0.0016));
      ctx.fillStyle = CREAM;
      lines.forEach((ln, i) => tracked(ctx, ln, margin, baseY + i * lh, track, align));
    } else if (c.style === 'title') {
      const fs = u * (portrait ? 0.105 : 0.104);
      ctx.font = `600 ${fs}px ${SERIF}`;
      const g = ctx.createLinearGradient(margin, 0, margin + fs * 8, 0); g.addColorStop(0, GOLD_A); g.addColorStop(1, GOLD_B);
      ctx.fillStyle = g;
      const ty = (portrait ? h * 0.3 : h * 0.37) + s.y;
      const lines = portrait ? ['FROM BEAN', 'TO BREW'] : [c.text];
      // wrap keeps exact wording; portrait just breaks at a space
      lines.forEach((ln, i) => tracked(ctx, ln, margin, ty + i * fs * 1.0, fs * 0.04, align));
      const subY = ty + (lines.length - 1) * fs + fs * 0.62;
      ctx.fillStyle = GOLD_B; ctx.fillRect(align === 'center' ? w / 2 - u * 0.05 : margin, subY - fs * 0.22, u * 0.1, Math.max(1, u * 0.002));
      const sf = u * (portrait ? 0.027 : 0.024);
      ctx.font = `400 ${sf}px ${SANS}`; ctx.fillStyle = CREAM;
      tracked(ctx, c.sub, margin, subY + sf * 1.25, sf * 0.42, align);
    } else if (c.style === 'final') {
      const fs = u * (portrait ? 0.05 : 0.048);
      ctx.font = `500 italic ${fs}px ${SERIF}`; ctx.fillStyle = CREAM;
      const y = (portrait ? h * 0.3 + u * 0.4 : h * 0.37 + u * 0.3) + s.y;
      tracked(ctx, c.text, margin, y, fs * 0.08, align);
    }
  });
  ctx.restore();
}

export async function loadFonts() {
  if (!document.fonts) return;
  await Promise.all([
    document.fonts.load('600 64px "Cormorant Garamond"'), document.fonts.load('italic 500 64px "Cormorant Garamond"'),
    document.fonts.load('500 64px "Cormorant Garamond"'), document.fonts.load('400 32px Inter'),
  ]).catch(() => {});
}

export default function Typography() {
  const ref = useRef();
  useEffect(() => {
    const cv = ref.current; const ctx = cv.getContext('2d');
    let raf = 0; let alive = true;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = cv.getBoundingClientRect();
      cv.width = Math.max(2, Math.round(r.width * dpr)); cv.height = Math.max(2, Math.round(r.height * dpr));
      draw();
    };
    const draw = () => { if (alive) drawTypography(ctx, cv.width, cv.height, clock.time); };
    const sched = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
    const unsub = subscribe(sched);
    const ro = new ResizeObserver(resize); ro.observe(cv);
    loadFonts().then(draw);
    resize();
    return () => { alive = false; unsub(); ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}
