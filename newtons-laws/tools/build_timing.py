#!/usr/bin/env python3
"""Single source of truth -> timing.

Reads script/script.json and writes:
  src/timing.json  (frame-accurate line + word timings used by the video)
  newtons-laws.srt (captions, text identical to the script)

Timing comes from audio/final/<id>.mp3 when that clip exists (voice mode),
otherwise from a reading-speed model (music-only mode).
"""
import json, re, subprocess, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
FPS = 30
WPS = 3.1                 # captions read at ~185 words per minute (standard subtitle pace)
GAP = 0.35                # normal pause between lines
LEAD = 0.7
TAIL = 0.5
INTRO = 0.8
OUTRO = 3.5
COUNTDOWN = 5.0

# extra seconds a line stays on screen so the animation can play out
HOLD = {"h1":0.8,"h2":0.6,"a3":1.0,"a4":1.2,"a6":3.2,"a7":0.8,"a8":0.8,"a9":1.0,"a10":1.2,
        "b2":1.6,"b4":0.8,"b5":0.8,"b8":1.0,"b9":1.0,"b10":0.6,"b12":1.2,"b13":1.6,"b14":1.2,
        "c4":2.2,"c5":0.8,"c6":1.2,"c7":1.0,"c8":1.2,"c10":1.2,"r1":0.6,"r4":0.8,"q1a":0.8,"q2a":1.0,"q3a":0.8}

data = json.loads((ROOT / "script/script.json").read_text())
WORD = re.compile(r"\S+")

def audio_len(lid):
    p = ROOT / "audio/final" / f"{lid}.mp3"
    if not p.exists():
        return None
    out = subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)])
    return float(out)

def word_weights(words):
    w = []
    for t in words:
        x = max(2, len(re.sub(r"\W","",t)))
        if re.search(r"[.!?]$", t): x += 3
        elif re.search(r"[,:;]$", t): x += 1.5
        w.append(x)
    return w

t = INTRO
scenes, lines = [], {}
srt = []
def tc(s):
    ms = int(round(s*1000)); h, ms = divmod(ms,3600000); m, ms = divmod(ms,60000); sec, ms = divmod(ms,1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}"

idx = 1
for sc in data["scenes"]:
    s0 = t
    t += LEAD
    for ln in sc["lines"]:
        t += ln.get("pauseBefore", 0)
        words = WORD.findall(ln["text"])
        alen = audio_len(ln["id"])
        speech = alen if alen else max(1.1, len(words)/WPS + 0.3)
        hold = 0.65*HOLD.get(ln["id"], 0) if not alen else min(HOLD.get(ln["id"],0), 1.0)
        dur = speech + hold
        wt = word_weights(words); tot = sum(wt); cur = t + 0.15
        span = speech - 0.3
        wl = []
        for w, x in zip(words, wt):
            d = span * x / tot
            wl.append({"w": w, "s": round(cur*FPS), "e": round((cur+d)*FPS)}); cur += d
        pages, cur_p, clen = [], [0], 0
        for i, wd in enumerate(words):
            if i == 0: clen = len(wd); continue
            if clen + 1 + len(wd) > 84 or (clen >= 46 and re.search(r"[.!?]$", words[i-1])):
                pages.append([cur_p[0], i-1]); cur_p = [i]; clen = len(wd)
            else: clen += 1 + len(wd)
        pages.append([cur_p[0], len(words)-1])
        lines[ln["id"]] = {"pages": pages, "start": round(t*FPS), "end": round((t+dur)*FPS), "speechEnd": round((t+speech)*FPS),
                           "scene": sc["id"], "emotion": ln["emotion"], "text": ln["text"], "words": wl}
        for pi, (a, b) in enumerate(pages):
            st = wl[a]["s"]/FPS - 0.1 if pi else t
            en = (wl[pages[pi+1][0]]["s"]/FPS - 0.05) if pi+1 < len(pages) else t+speech
            srt.append(f"{idx}\n{tc(max(0,st))} --> {tc(en)}\n{' '.join(words[a:b+1])}\n"); idx += 1
        t += dur
        if "quiz" in ln:
            lines[ln["id"]]["countdown"] = {"start": round(t*FPS), "end": round((t+COUNTDOWN)*FPS)}
            t += COUNTDOWN
        t += GAP
    t += TAIL
    scenes.append({"id": sc["id"], "start": round(s0*FPS), "end": round(t*FPS)})
t += OUTRO - GAP
scenes[-1]["end"] = round(t*FPS)
voice = any((ROOT/"audio/final"/f"{i}.mp3").exists() for i in lines)
out = {"voice": voice, "fps": FPS, "total": round(t*FPS), "scenes": scenes, "lines": lines}
(ROOT/"src").mkdir(exist_ok=True)
(ROOT/"src/timing.json").write_text(json.dumps(out, ensure_ascii=False))
(ROOT/"newtons-laws.srt").write_text("\n".join(srt))
print(f"total {t:.1f}s = {int(t//60)}:{t%60:04.1f}  frames {out['total']}")
for s in scenes: print(s["id"], round(s["start"]/FPS,1), "->", round(s["end"]/FPS,1))
