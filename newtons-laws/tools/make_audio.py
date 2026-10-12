#!/usr/bin/env python3
"""Compose the original background music and sound effects (numpy -> wav -> ffmpeg).
Everything here is generated from scratch by this script: no samples, no third-party music.
Licence: CC0 / public domain dedication by the project owner - free for any use.
"""
import numpy as np, subprocess, pathlib, wave, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
PUB = ROOT/"public"; (PUB/"sfx").mkdir(parents=True, exist_ok=True); (PUB/"audio").mkdir(exist_ok=True)
SR = 44100
rng = np.random.default_rng(7)

def mtof(m): return 440.0*2**((m-69)/12)
def write_wav(path, x, stereo=None):
    x = np.clip(x, -1, 1)
    if x.ndim == 1: x = np.stack([x, x], 1)
    pcm = (x*32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
def tt(d): return np.arange(int(d*SR))/SR

# ---------------- music ----------------
BPM = 76; BEAT = 60/BPM; BAR = 4*BEAT
TOTAL = 302.0
NB = int(TOTAL/BAR)+2
buf = np.zeros((int((NB*BAR+6)*SR), 2))

def add(start, sig, pan=0.0, gain=1.0):
    i = int(start*SR); n = min(len(sig), len(buf)-i)
    if n <= 0: return
    l = gain*np.sqrt(0.5*(1-pan)); r = gain*np.sqrt(0.5*(1+pan))
    buf[i:i+n, 0] += sig[:n]*l; buf[i:i+n, 1] += sig[:n]*r

def ep(m, dur=2.2, vel=1.0):        # soft electric piano
    t = tt(dur); f = mtof(m)
    s = np.sin(2*np.pi*f*t)*np.exp(-t*1.6) + 0.35*np.sin(2*np.pi*2*f*t)*np.exp(-t*2.6) \
        + 0.12*np.sin(2*np.pi*4*f*t+0.5)*np.exp(-t*9) + 0.05*np.sin(2*np.pi*f*t*(1+0.003))*np.exp(-t*1.2)
    s *= (1-np.exp(-t*220))            # soft attack
    s *= 1+0.04*np.sin(2*np.pi*4.5*t)  # tiny tremolo
    return s*vel*0.16
def marimba(m, vel=1.0):
    t = tt(0.9); f = mtof(m)
    s = np.sin(2*np.pi*f*t)*np.exp(-t*7) + 0.5*np.sin(2*np.pi*4*f*t)*np.exp(-t*22) + 0.1*np.sin(2*np.pi*9.2*f*t)*np.exp(-t*45)
    s *= (1-np.exp(-t*600))
    return s*vel*0.22
def bass(m, dur):
    t = tt(dur); f = mtof(m)
    s = (np.sin(2*np.pi*f*t)+0.25*np.sin(2*np.pi*2*f*t))*np.minimum(1, t*80)*np.exp(-t*1.1)
    return s*0.30
def kick():
    t = tt(0.35); f = 50+90*np.exp(-t*30)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*12)*0.42
def hat(open_=False):
    t = tt(0.07 if not open_ else 0.18); n = rng.standard_normal(len(t))
    n = np.diff(n, prepend=0)  # crude high-pass
    return n*np.exp(-t*(70 if not open_ else 22))*0.07
def snare():
    t = tt(0.2); n = rng.standard_normal(len(t))
    return (n*np.exp(-t*28)*0.16 + np.sin(2*np.pi*190*t)*np.exp(-t*30)*0.12)

CH = {  # bass root, chord tones
 "Cmaj7": (36, [60,64,67,71]), "Am7": (33, [57,60,64,67]), "Fmaj7": (41, [60,65,69,64]),
 "G6": (43, [59,62,67,64]), "Em7": (40, [59,62,64,67]), "Dm7": (38, [57,60,62,65]),
}
PROG = ["Cmaj7","Am7","Fmaj7","G6","Cmaj7","Em7","Fmaj7","G6","Am7","Dm7","Fmaj7","G6","Cmaj7","Am7","Dm7","G6"]
PENTA = [72,74,76,79,81,84,79,76,74,72,69,67]
mel = [
 [(0,76),(1.5,79),(2,81),(3,79)], [(0.5,76),(1,74),(2,72),(3.5,74)],
 [(0,72),(1,76),(1.5,79),(3,84)], [(0,81),(1.5,79),(2.5,76),(3,74)],
 [(0,79),(0.5,81),(1.5,84),(2.5,81)], [(1,79),(2,76),(2.5,74),(3.5,72)],
]
for b in range(NB):
    t0 = b*BAR; name = PROG[b % len(PROG)]; root, tones = CH[name]; sec = (b//8)
    intro = b < 4
    # chord pad strums
    for k, off in enumerate([0, 2*BEAT, 3.5*BEAT] if not intro else [0, 2*BEAT]):
        for j, m in enumerate(tones):
            add(t0+off+j*0.012, ep(m, 2.6, (1.0 if k==0 else 0.7)), pan=-0.25+0.17*j)
    if b >= 4:
        add(t0, bass(root, BAR), 0)
        add(t0+2.5*BEAT, bass(root+12 if b%2 else root+7, BEAT*1.4), 0, 0.7)
        for q in range(4): add(t0+q*BEAT, kick() if q in (0,2) else snare(), 0, 0.75 if q in (0,2) else 0.6) if (q in (0,2) or b % 2 == 1 and q == 3 or q == 1 and False) else None
        for e in range(8): add(t0+e*BEAT/2+(0.03 if e%2 else 0), hat(e%4==3), 0.2, 0.9 if e%2==0 else 0.55)
    # marimba melodic figure - denser in later sections, rests every 4th bar
    if b >= 8 and (b % 4) != 3:
        phrase = mel[(b+sec) % len(mel)]
        for off, m in phrase:
            add(t0+off*BEAT, marimba(m, 0.9 if (off*2)%2==0 else 0.7), pan=0.3)
    if b >= 12 and b % 8 == 7:  # little echo run
        for k, m in enumerate([79,81,84,88]):
            add(t0+(2+k*0.5)*BEAT, marimba(m, 0.6), pan=-0.3)

# vinyl crackle
cr = np.zeros(len(buf)); pos = rng.integers(0, len(buf), int(TOTAL*14)); cr[pos] = rng.standard_normal(len(pos))*0.02
buf[:,0] += cr; buf[:,1] += np.roll(cr, 5)
buf = buf[:int((TOTAL+0.5)*SR)]
# fades
fi = int(3*SR); fo = int(6*SR)
buf[:fi] *= np.linspace(0,1,fi)[:,None]**1.5
buf[-fo:] *= np.linspace(1,0,fo)[:,None]**1.5
buf *= 0.5/np.max(np.abs(buf))
write_wav(ROOT/"audio/music_raw.wav", buf)

# ---------------- sound effects ----------------
def band_noise(d, f0, f1, q=0.25, seed=1):
    r = np.random.default_rng(seed); x = r.standard_normal(int(d*SR)); out = np.zeros_like(x)
    N = 2048; H = N//2; win = np.hanning(N)
    nblk = (len(x)-N)//H
    freqs = np.fft.rfftfreq(N, 1/SR)
    for i in range(nblk):
        c = f0*(f1/f0)**(i/max(1,nblk-1))
        g = np.exp(-0.5*((np.log2(freqs+1)-np.log2(c))/q)**2)
        seg = np.fft.irfft(np.fft.rfft(x[i*H:i*H+N]*win)*g)
        out[i*H:i*H+N] += seg
    return out/ (np.max(np.abs(out))+1e-9)
def env(n, a, d): 
    t = np.arange(n)/SR; return np.minimum(1, t/a)*np.exp(-t/d)
def whoosh(d=0.7, up=True, vol=0.5):
    x = band_noise(d, 400 if up else 3500, 3500 if up else 400, 0.6)
    t = np.linspace(0,1,len(x)); e = np.sin(np.pi*t)**1.5
    return x*e*vol
def pop(vol=0.5, f0=700):
    t = tt(0.16); f = f0*np.exp(-t*18)+180
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*30)*vol
def ding(f=1318.5, vol=0.4, d=1.2):
    t = tt(d)
    s = sum(a*np.sin(2*np.pi*f*r*t)*np.exp(-t*k) for a, r, k in [(1,1,3.2),(0.4,2.76,5.5),(0.25,5.4,9),(0.12,8.9,14)])
    return s*(1-np.exp(-t*400))*vol
def thud(vol=0.7, f0=110):
    t = tt(0.5); f = f0*np.exp(-t*9)+38
    x = np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*8)
    n = rng.standard_normal(len(t))*np.exp(-t*60)*0.25
    return (x+n)*vol
def tick(vol=0.35):
    t = tt(0.06); return np.sin(2*np.pi*1800*t)*np.exp(-t*90)*vol
def tada(vol=0.35):
    out = np.zeros(int(1.6*SR))
    for k, m in enumerate([72,76,79,84]):
        d = ding(mtof(m), vol*(0.7+0.1*k), 1.2); i = int(k*0.09*SR); out[i:i+len(d)] += d[:len(out)-i]
    return out
def swish(vol=0.35): return whoosh(0.28, True, vol)
def rumble(d=2.6, vol=0.5):
    x = band_noise(d, 90, 260, 0.9, seed=3); t = np.linspace(0,1,len(x))
    return x*np.minimum(1,t*6)*(1-t)**0.6*vol
def boing(vol=0.35):
    t = tt(0.5); f = 260+120*np.sin(2*np.pi*9*t)*np.exp(-t*5)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*7)*vol
def wrong(vol=0.3):
    t = tt(0.4); return (np.sin(2*np.pi*200*t)+np.sign(np.sin(2*np.pi*200*t))*0.2)*np.exp(-t*8)*vol
SFX = {"whoosh":whoosh(), "whoosh_down":whoosh(0.6,False,0.45), "swish":swish(), "pop":pop(), "pop_hi":pop(0.4,1100),
       "ding":ding(), "ding_low":ding(880,0.35), "thud":thud(), "thud_soft":thud(0.4,90), "tick":tick(),
       "tada":tada(), "rumble":rumble(), "boing":boing(), "wrong":wrong(), "tap":pop(0.25,500)}
for k, v in SFX.items():
    v = v/ max(1e-9, np.max(np.abs(v)))*0.8
    write_wav(PUB/"sfx"/f"{k}.wav", v)

# ---------------- encode ----------------
subprocess.check_call(["ffmpeg","-y","-v","error","-i",str(ROOT/"audio/music_raw.wav"),
  "-af","lowpass=f=7500,aecho=0.7:0.5:70|140:0.22|0.12,acompressor=threshold=-20dB:ratio=2.5:attack=30:release=300,loudnorm=I=-20:TP=-3:LRA=7",
  "-ar","44100","-b:a","192k",str(PUB/"audio/music.mp3")])
print("music + sfx written")
