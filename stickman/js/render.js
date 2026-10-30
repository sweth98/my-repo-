/* Canvas renderer: camera, ground, shadows, figures, motion trails, effects. */
(function (g) {
  const { solve, BONES, RIG } = g.Rig;
  const { poseAt, evalTrack, FPS } = g.Anim;

  const W = 1280, H = 720, GROUND = 585, BAR = 54;
  const INK = '#141414', PAPER = '#f4f1ea';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function Renderer(canvas, scene) {
    const ctx = canvas.getContext('2d');
    const opts = { bars: true, trails: true, shadows: true };
    let cam = { x: 0, y: 0, z: 2 };

    const camAt = (a) => ({
      x: evalTrack(scene.camTracks.camX, a, 0),
      y: evalTrack(scene.camTracks.camY, a, 0),
      z: evalTrack(scene.camTracks.zoom, a, 2),
    });
    function shakeAt(a) {
      let dx = 0, dy = 0;
      for (const s of scene.effects.shake) {
        const t = a - s.f;
        if (t < 0 || t > 30) continue;
        const k = s.amp * Math.exp(-s.decay * t * 1.4);
        dx += k * Math.sin(t * 2.9 + s.f);
        dy += k * 0.7 * Math.cos(t * 3.7 + s.f * 0.3);
      }
      return [dx, dy];
    }

    const sx = (wx) => W / 2 + (wx - cam.x) * cam.z;
    const sy = (wy) => GROUND + (cam.y - wy) * cam.z;

    function figure(char, a, fresh) {
      const P = poseAt(char.clip, a, fresh);
      return { P, S: solve(P, char.facing) };
    }

    /* ---------- background ---------- */
    function background(a) {
      ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
      const gr = ctx.createRadialGradient(W / 2, H * 0.45, 120, W / 2, H * 0.5, 820);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(120,105,80,0.10)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);

      // distant horizon (parallax) and ground line
      const hy = GROUND - 170 * cam.z * 0.42;
      ctx.strokeStyle = 'rgba(20,20,20,0.07)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(W, hy); ctx.stroke();
      const par = 0.3;
      ctx.fillStyle = 'rgba(20,20,20,0.05)';
      for (let i = -12; i < 40; i++) {
        const wx = i * 170, x = W / 2 + (wx - cam.x * par) * cam.z * 0.8;
        if (x < -80 || x > W + 80) continue;
        const hh = 8 + ((i * 37) % 5 + 5) % 5 * 5;
        ctx.fillRect(x, hy - hh, 3, hh);
      }
      const gy = sy(0);
      const lg = ctx.createLinearGradient(0, 0, W, 0);
      lg.addColorStop(0, 'rgba(20,20,20,0)'); lg.addColorStop(0.15, 'rgba(20,20,20,0.35)');
      lg.addColorStop(0.85, 'rgba(20,20,20,0.35)'); lg.addColorStop(1, 'rgba(20,20,20,0)');
      ctx.strokeStyle = lg; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      // floor texture ticks scroll 1:1 with the world so camera moves read clearly
      ctx.strokeStyle = 'rgba(20,20,20,0.12)'; ctx.lineWidth = 1.6;
      for (let i = -30; i < 40; i++) {
        const wx = i * 64 + (((i * 53) % 7) - 3) * 4, x = sx(wx);
        if (x < -10 || x > W + 10) continue;
        const len = 6 + (((i * 31) % 4 + 4) % 4) * 5, yy = gy + 12 + (((i * 17) % 3 + 3) % 3) * 12;
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + len * cam.z * 0.6, yy); ctx.stroke();
      }
    }

    /* ---------- shadow ---------- */
    function shadow(S) {
      let minX = 1e9, maxX = -1e9, minY = 1e9;
      for (const n in S.pts) { const p = S.pts[n]; minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); }
      const lift = Math.max(0, minY), cx = (minX + maxX) / 2;
      const w = (22 + (maxX - minX) * 0.32) * cam.z * (1 - Math.min(0.5, lift / 80));
      const al = 0.16 * (1 - Math.min(0.75, lift / 60));
      ctx.save(); ctx.translate(sx(cx), sy(0) + 3); ctx.scale(1, 0.1);
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, w);
      gr.addColorStop(0, `rgba(20,20,20,${al})`); gr.addColorStop(1, 'rgba(20,20,20,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, w, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    /* ---------- figure ---------- */
    function drawFigure(S) {
      const lw = RIG.stroke * cam.z;
      const items = [];
      for (const [a, b, wm] of BONES) {
        const A = S.pts[a], B = S.pts[b];
        items.push({ z: (A.z + B.z) / 2 + (wm === 1.35 ? 0.01 : 0), A, B, w: wm });
      }
      items.sort((p, q) => p.z - q.z);
      ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const it of items) {
        ctx.lineWidth = lw * it.w;
        ctx.beginPath(); ctx.moveTo(sx(it.A.x), sy(it.A.y)); ctx.lineTo(sx(it.B.x), sy(it.B.y)); ctx.stroke();
      }
      for (const n of ['fistN', 'fistF']) {
        const p = S.pts[n];
        ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), RIG.fistR * cam.z, 0, Math.PI * 2); ctx.fill();
      }
      const h = S.pts.head;
      ctx.beginPath(); ctx.arc(sx(h.x), sy(h.y), RIG.headR * cam.z, 0, Math.PI * 2); ctx.fill();
    }

    /* ---------- motion trails (tapered ribbons along recent end-effector paths) ---------- */
    const TRAIL_PTS = ['fistN', 'fistF', 'toeN', 'toeF', 'ankleN', 'ankleF'];
    function trails(char, a) {
      const n = 14, step = 0.5;
      const hist = [];
      for (let k = 0; k < n; k++) {
        const { S } = figure(char, Math.max(0, a - k * step), true);
        hist.push(S.pts);
      }
      for (const name of TRAIL_PTS) {
        const sp = Math.hypot(hist[0][name].x - hist[2][name].x, hist[0][name].y - hist[2][name].y); // per frame
        const al = clamp((sp - 9) / 26, 0, 1) * 0.32;
        if (al < 0.01) continue;
        const pts = hist.map((h) => [sx(h[name].x), sy(h[name].y)]);
        const L = [], R = [];
        for (let i = 0; i < pts.length; i++) {
          const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(pts.length - 1, i + 1)];
          let dx = p1[0] - p0[0], dy = p1[1] - p0[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
          const wd = (1 - i / (pts.length - 1)) * (name.startsWith('fist') ? 3.4 : 4.4) * cam.z;
          L.push([pts[i][0] - dy * wd, pts[i][1] + dx * wd]);
          R.push([pts[i][0] + dy * wd, pts[i][1] - dx * wd]);
        }
        ctx.fillStyle = `rgba(20,20,20,${al})`;
        ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
        for (let i = 1; i < L.length; i++) ctx.lineTo(L[i][0], L[i][1]);
        for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
        ctx.closePath(); ctx.fill();
      }
    }

    /* ---------- effects ---------- */
    function exclaim(hero, a) {
      const e = scene.effects.exclaim;
      if (a < e.start || a > e.end) return;
      const t = a - e.start, d = e.end - e.start;
      const sc = t < 2 ? t / 2 * 1.25 : t < 6 ? 1.25 - 0.25 * ((t - 2) / 4) : 1;
      const alpha = t > d - 6 ? (d - t) / 6 : 1;
      const hd = hero.S.pts.head;
      const x = sx(hd.x + 4), y = sy(hd.y + 30) - Math.sin(clamp(t / 8, 0, 1) * Math.PI) * 3 * cam.z;
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc * (1 + (sc - 1) * 0.9));
      ctx.globalAlpha = alpha; ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = 'round';
      const u = cam.z;
      ctx.lineWidth = 4.6 * u / 2 * 1.6;
      ctx.beginPath(); ctx.moveTo(0, -11 * u); ctx.lineTo(0, 4 * u); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 11 * u, 2.5 * u, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function burst(cx, cy, t) {
      if (t < 0 || t > 9) return;
      const k = t / 9, a = 1 - k;
      ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = INK; ctx.lineCap = 'round';
      ctx.globalAlpha = a * 0.9;
      const n = 11;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + 0.2, r0 = (10 + 38 * k) * cam.z / 2, r1 = r0 + (22 * (1 - k * 0.4)) * cam.z / 2;
        ctx.lineWidth = (3.2 - 2.2 * k) * cam.z / 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0); ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1); ctx.stroke();
      }
      ctx.globalAlpha = a * 0.5; ctx.lineWidth = 2 * cam.z / 2;
      ctx.beginPath(); ctx.arc(0, 0, (14 + 60 * k) * cam.z / 2, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    function dust(cx, t, small) {
      if (t < 0 || t > 16) return;
      const k = t / 16, a = (1 - k) * 0.55, s = small ? 0.55 : 1;
      ctx.save(); ctx.translate(cx, sy(0)); ctx.strokeStyle = INK; ctx.lineCap = 'round';
      for (const dir of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const r0 = (12 + i * 7 + 38 * k) * s * cam.z / 2, ang = 0.18 + i * 0.22;
          ctx.globalAlpha = a * (1 - i * 0.22); ctx.lineWidth = (2.2 - k) * cam.z / 2;
          ctx.beginPath();
          ctx.arc(0, 0, r0, dir > 0 ? -ang - 0.55 : Math.PI + ang - 0.0, dir > 0 ? -ang : Math.PI + ang + 0.55);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    /* ---------- frame ---------- */
    function draw(a, dispF, dispTotal) {
      cam = camAt(a);
      const [dx, dy] = shakeAt(a);
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      ctx.translate(dx, dy);
      background(a);
      const hero = figure(scene.hero, a), opp = figure(scene.opp, a);
      if (opts.shadows) { shadow(opp.S); shadow(hero.S); }
      if (opts.trails) { trails(scene.opp, a); trails(scene.hero, a); }
      drawFigure(opp.S);
      drawFigure(hero.S);
      exclaim(hero, a);

      const eh = scene.effects.hit;
      if (a >= eh.f) {
        const t = hero.S.pts.toeF;
        burst(sx(t.x + 4), sy(t.y + 3), (a - eh.f) * 1.0);
      }
      for (const d of scene.effects.dust) {
        const S = (d.who === 'hero' ? hero : opp).S;
        const cx = d.who === 'hero' ? (S.pts.ankleN.x + S.pts.ankleF.x) / 2 : S.pts.hip.x;
        dust(sx(cx), a - d.f, d.small);
      }
      ctx.restore();

      // grade, cinematic bars and fades (not shaken)
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.0);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,30,15,0.10)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      if (opts.bars) { ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, W, BAR); ctx.fillRect(0, H - BAR, W, BAR); }
      const fi = clamp(1 - dispF / 14, 0, 1), fo = clamp(1 - (dispTotal - dispF) / 14, 0, 1);
      const fade = Math.max(fi, fo);
      if (fade > 0) { ctx.fillStyle = `rgba(244,241,234,${fade})`; ctx.fillRect(0, opts.bars ? BAR : 0, W, H - (opts.bars ? 2 * BAR : 0)); }
    }

    return { draw, opts, W, H };
  }

  g.StickRender = { Renderer, W, H };
})(typeof window !== 'undefined' ? window : globalThis);
