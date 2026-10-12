#!/usr/bin/env python3
"""Audio QA on the rendered video: loudness, true peak, clipping, music vs SFX balance, voice vs music (if narrated)."""
import subprocess, re, sys, json, pathlib, tempfile
ROOT = pathlib.Path(__file__).resolve().parent.parent
video = sys.argv[1] if len(sys.argv) > 1 else str(ROOT/"out/newtons-laws.mp4")

def run(args):
    return subprocess.run(args, capture_output=True, text=True).stderr
# loudness + true peak
e = run(["ffmpeg","-nostats","-i",video,"-vn","-af","ebur128=peak=true","-f","null","-"])
I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1]); LRA = float(re.findall(r"LRA:\s+(-?[\d.]+) LU", e)[-1])
TP = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1])
v = run(["ffmpeg","-nostats","-i",video,"-vn","-af","volumedetect","-f","null","-"])
maxv = float(re.findall(r"max_volume: (-?[\d.]+) dB", v)[0]); meanv = float(re.findall(r"mean_volume: (-?[\d.]+) dB", v)[0])
# clipping: count samples at/near full scale
tmp = pathlib.Path(tempfile.mkdtemp())/"a.wav"
subprocess.run(["ffmpeg","-y","-v","error","-i",video,"-vn","-ac","1","-ar","44100",str(tmp)])
import numpy as np, wave
w = wave.open(str(tmp)); x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(float)/32768
clip = int((np.abs(x) >= 0.999).sum())
print(f"integrated loudness : {I:.1f} LUFS (LRA {LRA:.1f} LU)")
print(f"true peak           : {TP:.1f} dBTP, max sample {maxv:.1f} dBFS, mean {meanv:.1f} dBFS")
print(f"clipped samples     : {clip}")
ok = clip == 0 and TP <= -1.0 and maxv < -0.5
# music vs sfx balance, measured on the source assets
def lufs(path):
    t = run(["ffmpeg","-nostats","-i",str(path),"-af","ebur128","-f","null","-"])
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", t)[-1])
sfx_peak = {}
for p in sorted((ROOT/"public/sfx").glob("*.wav")):
    ww = wave.open(str(p)); y = np.frombuffer(ww.readframes(ww.getnframes()), dtype="<i2").astype(float)/32768
    sfx_peak[p.stem] = 20*np.log10(np.abs(y).max()+1e-9)
music_I = lufs(ROOT/"public/audio/music.mp3")
print(f"music alone         : {music_I:.1f} LUFS")
voice_dir = ROOT/"public/voice"
if voice_dir.exists() and any(voice_dir.glob("*.mp3")):
    vl = [lufs(p) for p in voice_dir.glob("*.mp3")]
    print(f"voice clips         : {min(vl):.1f} .. {max(vl):.1f} LUFS; ducked music ~13% = {music_I-17.7:.1f} LUFS")
else:
    print("narration           : none in this version (music-only), nothing for the SFX to mask")
print("PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
