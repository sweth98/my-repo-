/* Player: scene assembly, transport, timeline scrubbing, dope sheet, export. */
(function () {
  const { bake, buildTracks, buildRemap, SPRINGS, FPS } = Anim;
  const $ = (id) => document.getElementById(id);

  // ---- assemble scene ----
  const ch = Choreo.build();
  const mk = (c) => ({ facing: c.facing, clip: bake(c.keys.concat(c.aux), ch.total + 2, SPRINGS) });
  const scene = {
    hero: mk(ch.hero), opp: mk(ch.opp),
    camTracks: buildTracks(ch.cam.keys),
    effects: ch.effects,
  };
  const remap = buildRemap(ch.speed.keys, ch.total);
  const TOTAL = Math.floor(remap.total);       // display frames
  const canvas = $('stage');
  const R = StickRender.Renderer(canvas, scene);

  // ---- state ----
  const S = { f: 0, playing: false, speed: 1, loop: false, last: 0, recording: false };
  const frameLabel = $('frame'), timeLabel = $('time'), beatLabel = $('beat');
  const scrub = $('scrub'), playhead = $('playhead');
  scrub.max = TOTAL;

  function beatAt(a) {
    let name = ch.beats[0][1], idx = 0;
    ch.beats.forEach(([f, n], i) => { if (a >= f) { name = n; idx = i; } });
    return [idx + 1, name];
  }

  function render() {
    const a = remap.toAnim(S.f);
    R.draw(a, S.f, remap.total);
    const f = Math.round(S.f);
    frameLabel.textContent = `${String(f).padStart(3, '0')} / ${TOTAL}`;
    timeLabel.textContent = (S.f / FPS).toFixed(2) + ' s';
    const [i, n] = beatAt(a);
    beatLabel.innerHTML = `<b>${String(i).padStart(2, '0')}</b> ${n}`;
    scrub.value = f;
    playhead.style.left = (S.f / TOTAL * 100) + '%';
    document.querySelectorAll('.beat-chip').forEach((el, k) => el.classList.toggle('on', k + 1 === i));
  }

  function setFrame(f) { S.f = Math.min(Math.max(f, 0), TOTAL); render(); }

  function tick(now) {
    if (S.playing) {
      const dt = (now - S.last) / 1000;
      S.f += dt * FPS * S.speed;
      if (S.f >= TOTAL) {
        if (S.recording) { finishRecording(); }
        else if (S.loop) S.f = 0;
        else { S.f = TOTAL; pause(); }
      }
      render();
    }
    S.last = now;
    requestAnimationFrame(tick);
  }

  function play() {
    if (S.f >= TOTAL) S.f = 0;
    S.playing = true; $('play').textContent = 'Pause'; $('play').dataset.state = 'playing';
  }
  function pause() { S.playing = false; $('play').textContent = 'Play'; $('play').dataset.state = 'paused'; }
  const toggle = () => (S.playing ? pause() : play());
  function restart() { setFrame(0); play(); }

  $('play').onclick = toggle;
  $('restart').onclick = restart;
  $('prev').onclick = () => { pause(); setFrame(Math.round(S.f) - 1); };
  $('next').onclick = () => { pause(); setFrame(Math.round(S.f) + 1); };
  $('speed').onchange = (e) => { S.speed = parseFloat(e.target.value); };
  $('loop').onchange = (e) => { S.loop = e.target.checked; };
  $('bars').onchange = (e) => { R.opts.bars = e.target.checked; render(); };
  $('trails').onchange = (e) => { R.opts.trails = e.target.checked; render(); };
  $('png').onclick = () => {
    const a = document.createElement('a');
    a.download = `stickman-frame-${String(Math.round(S.f)).padStart(3, '0')}.png`;
    a.href = canvas.toDataURL('image/png'); a.click();
  };

  // ---- timeline: scrub by dragging anywhere on the track ----
  const track = $('track');
  let dragging = false, wasPlaying = false;
  const fromPointer = (e) => {
    const r = track.getBoundingClientRect();
    return Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * TOTAL);
  };
  track.addEventListener('pointerdown', (e) => {
    dragging = true; wasPlaying = S.playing; pause(); track.setPointerCapture(e.pointerId); setFrame(fromPointer(e));
  });
  track.addEventListener('pointermove', (e) => { if (dragging) setFrame(fromPointer(e)); });
  const endDrag = () => { if (dragging) { dragging = false; if (wasPlaying) play(); } };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  scrub.addEventListener('input', () => { pause(); setFrame(+scrub.value); });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'ArrowLeft') { pause(); setFrame(Math.round(S.f) - (e.shiftKey ? 10 : 1)); }
    else if (e.code === 'ArrowRight') { pause(); setFrame(Math.round(S.f) + (e.shiftKey ? 10 : 1)); }
    else if (e.code === 'Home') restart();
  });

  // ---- beats + dope sheet ----
  const beatsEl = $('beats');
  ch.beats.forEach(([f, n], i) => {
    const b = document.createElement('button');
    b.className = 'beat-chip'; b.type = 'button';
    b.style.left = (remap.toDisp(f) / TOTAL * 100) + '%';
    b.innerHTML = `<i>${String(i + 1).padStart(2, '0')}</i>${n}`;
    b.onclick = (e) => { e.stopPropagation(); pause(); setFrame(Math.round(remap.toDisp(f))); };
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    beatsEl.appendChild(b);
  });
  const lanes = $('lanes');
  [['Hero', ch.hero.keys], ['Opponent', ch.opp.keys], ['Camera', ch.cam.keys], ['Speed', ch.speed.keys]].forEach(([name, keys]) => {
    const row = document.createElement('div'); row.className = 'lane';
    row.innerHTML = `<span>${name}</span>`;
    const set = new Set(keys.map((k) => Math.round(k[0])));
    set.forEach((f) => {
      const d = document.createElement('em');
      d.style.left = (remap.toDisp(f) / TOTAL * 100) + '%';
      row.appendChild(d);
    });
    lanes.appendChild(row);
  });
  // second ruler
  const ruler = $('ruler');
  for (let s = 0; s * FPS <= TOTAL; s++) {
    const t = document.createElement('u');
    t.style.left = (s * FPS / TOTAL * 100) + '%'; t.textContent = s + 's';
    ruler.appendChild(t);
  }

  // ---- video export ----
  let rec = null, chunks = [];
  function finishRecording() {
    S.recording = false; pause(); S.f = TOTAL; render();
    if (rec && rec.state !== 'inactive') rec.stop();
  }
  $('export').onclick = () => {
    if (S.recording) return;
    if (!window.MediaRecorder || !canvas.captureStream) {
      $('status').textContent = 'Video export is not supported in this browser — use Save frame instead.'; return;
    }
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
      .find((m) => MediaRecorder.isTypeSupported(m));
    if (!mime) { $('status').textContent = 'No supported video codec found in this browser.'; return; }
    chunks = [];
    rec = new MediaRecorder(canvas.captureStream(60), { mimeType: mime, videoBitsPerSecond: 14e6 });
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'stickman-counter.' + (mime.includes('mp4') ? 'mp4' : 'webm');
      a.click(); $('export').disabled = false; $('export').textContent = 'Export video';
      $('status').textContent = `Saved ${(blob.size / 1e6).toFixed(1)} MB ${mime.split(';')[0]}.`;
    };
    S.speed = 1; $('speed').value = '1'; S.loop = false; $('loop').checked = false;
    setFrame(0); rec.start(); S.recording = true; S.last = performance.now(); play();
    $('export').disabled = true; $('export').textContent = 'Recording…';
    $('status').textContent = 'Recording in real time — keep this tab visible.';
  };

  // test hook for automated previews
  window.__stick = { setFrame, TOTAL, remap, scene, ch, render, pause };

  setFrame(0);
  requestAnimationFrame((t) => { S.last = t; tick(t); });
  if (!/[?&]noauto/.test(location.search)) play();
})();
