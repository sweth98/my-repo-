#!/usr/bin/env python3
"""Emit TTS prompts (emotion tag + script text) from script.json. Text itself is never altered."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
TAG = {"question":"[curious]","surprise":"[surprised]","fun":"[cheerful]","definition":"[calm]",
       "explain":"[friendly]","formula":"[calm, deliberate]","upbeat":"[upbeat]"}
if __name__ == "__main__":
    d = json.loads((root/"script/script.json").read_text())
    for s in d["scenes"]:
        for l in s["lines"]:
            print(f'{l["id"]}\t{TAG[l["emotion"]]} {l["text"]}')
