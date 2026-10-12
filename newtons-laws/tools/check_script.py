#!/usr/bin/env python3
"""Automated quality checks.
1. Caption text shown on screen (words in timing.json) == script.json text, word for word, for every line.
2. The .srt captions, re-joined per line, == script.json text.
3. Physics: worked example + quiz numbers are recomputed and must appear (in words) in the script.
4. On-screen maths strings in the scene code agree with the computed values.
"""
import json, re, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
script = json.loads((ROOT/"script/script.json").read_text())
timing = json.loads((ROOT/"src/timing.json").read_text())
lines = {l["id"]: l["text"] for s in script["scenes"] for l in s["lines"]}
ok = True
def fail(m):
    global ok; ok = False; print("FAIL:", m)

# 1. on-screen captions
for lid, text in lines.items():
    t = timing["lines"].get(lid)
    if not t: fail(f"{lid} missing in timing"); continue
    shown = " ".join(w["w"] for w in t["words"])
    if shown != text: fail(f"{lid}: on-screen '{shown}' != script '{text}'")
    pages = " ".join(" ".join(w["w"] for w in t["words"][a:b+1]) for a, b in t["pages"])
    if pages != text: fail(f"{lid}: caption pages differ from script")
    if t["text"] != text: fail(f"{lid}: timing text differs")
extra = set(timing["lines"]) - set(lines)
if extra: fail(f"timing has lines not in script: {extra}")
print(f"[1] on-screen captions identical to script for {len(lines)} lines")

# 2. SRT
srt = (ROOT/"newtons-laws.srt").read_text().strip().split("\n\n")
cues = [c.split("\n")[2] for c in srt]
joined = " ".join(cues)
alltext = " ".join(lines[i] for i in timing["lines"])
order = sorted(timing["lines"], key=lambda i: timing["lines"][i]["start"])
alltext = " ".join(lines[i] for i in order)
if joined != alltext: fail("SRT text differs from script text")
print(f"[2] SRT: {len(cues)} cues, text identical to script")

# 3. physics
m, F, t, u = 500.0, 1000.0, 5.0, 0.0
a = F / m; v = u + a * t; kmh = v * 3.6; p = m * v
assert (a, v, kmh, p) == (2.0, 10.0, 36.0, 5000.0), (a, v, kmh, p)
need = {"b9": ["five hundred kilograms", "one thousand newtons", "five seconds"],
        "b10": ["five hundred kilograms", "one thousand newtons", "u is zero"],
        "b12": ["one thousand divided by five hundred", "two metres per second squared"],
        "b13": ["zero plus two times five", "ten metres per second"],
        "b14": ["thirty six kilometres per hour"]}
for lid, phrases in need.items():
    for ph in phrases:
        if ph not in lines[lid]: fail(f"{lid} lacks '{ph}'")
q2 = 20 / 4
if q2 != 5: fail("quiz 2 maths")
if "five" not in lines["q2a"] or "Twenty divided by four" not in lines["q2a"]: fail("q2a text")
if "Twenty newtons" not in lines["q2"] or "four kilogram" not in lines["q2"]: fail("q2 text")
print(f"[3] physics ok: a={a} m/s^2, v={v} m/s = {kmh} km/h, p={p} kg m/s, quiz2 a={q2} m/s^2; F=ma, units N, kg, m/s^2")

# 4. on-screen strings
src = (ROOT/"src/scenes/Law2.tsx").read_text() + (ROOT/"src/scenes/Recap.tsx").read_text()
for must in ["a = 2 m/s²", "v = 10 m/s", "= 36 km/h", "= 1000 N ÷ 500 kg", "= 0 + 2 × 5", "a = F ÷ m = 20 ÷ 4 = 5 m/s²", "m = 500 kg", "F = 1000 N"]:
    if must not in src: fail(f"on-screen text missing: {must}")
print("[4] on-screen maths strings consistent")
print("ALL CHECKS PASSED" if ok else "CHECKS FAILED"); sys.exit(0 if ok else 1)
