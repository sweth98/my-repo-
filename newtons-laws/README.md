# Newton's Three Laws of Motion - educational motion-graphics video

Deliverables (this folder): `newtons-laws.mp4` (1920x1080, 30 fps, 4:55), `script.md`, `newtons-laws.srt`.

## Version: music-only (narration can be added later)
* `script/script.json` is the single source of truth. On-screen captions, the SRT and (later) the voiceover all come from it.
* `tools/build_timing.py` turns the script into frame-accurate timing (`src/timing.json`) and the SRT.
  Without voice clips, timing follows reading speed (~185 wpm). If `audio/final/<line-id>.mp3` clips exist, their real durations drive the timing instead, music ducks to ~13% while speaking, and the clips are mixed in automatically (`public/voice/<line-id>.mp3`).
* Tone tags per line (`emotion` in the script) map to ElevenLabs v3 delivery tags in `tools/prompts.py`.

## Music and sound effects
Both are composed from scratch by `tools/make_audio.py` (numpy + ffmpeg): lo-fi electric piano, marimba, soft bass and brushed drums at 76 BPM in C major, plus whoosh/pop/ding/thud/tick SFX. No samples or third-party music are used, so there is nothing to license; dedicated to the public domain (CC0). Voice-over (if added later) must be licensed under your ElevenLabs plan.

## Quality checks
* `python3 tools/check_script.py` - captions on screen == script, SRT == script, physics numbers recomputed (a = F/m = 1000/500 = 2 m/s^2, v = u + at = 10 m/s = 36 km/h, quiz 20/4 = 5 m/s^2).
* `python3 tools/check_audio.py newtons-laws.mp4` - loudness, true peak, clipping.

## Rebuild
```
npm install
python3 tools/build_timing.py && python3 tools/make_audio.py
npx remotion render src/index.ts NewtonsLaws newtons-laws.mp4
```
(`remotion.config.ts` points at the headless Chromium shipped in this environment.)
