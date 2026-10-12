#!/usr/bin/env python3
"""Render script/script.json (single source of truth) into script.md."""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
data = json.loads((root / "script/script.json").read_text())
WPM = 155
out = [f"# {data['title']} - Script and Storyboard", "",
       f"Audience: {data['audience']}. Target: 1920x1080, 30 fps, about 4-5 minutes.", ""]
total = 0
for s in data["scenes"]:
    words = sum(len(re.findall(r"[A-Za-z0-9'’-]+", l["text"])) for l in s["lines"])
    total += words
    out += [f"## {s['title']}  ({words} words, about {words/WPM*60:.0f}s of speech)", ""]
    for l in s["lines"]:
        out += [f"**{l['id']}** [{l['emotion']}] \"{l['text']}\"  ", f"> Visual: {l['visual']}", ""]
out += ["---", f"Total narration: {total} words, about {total/WPM:.1f} min at {WPM} wpm "
        "(plus pauses and quiz timers)."]
(root / "script.md").write_text("\n".join(out) + "\n")
print(total, "words", round(total / WPM, 2), "min")
