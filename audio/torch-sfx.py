#!/usr/bin/env python3
"""Synthesise Torchlight Dungeons' sound effects and music (no recording needed).

Writes audio/torch/*.mp3 for listening and src/audio-data.js (TORCH_SFX, TORCH_MUSIC) for the build.
Needs ffmpeg and numpy. Run: python3 audio/torch-sfx.py, then ./build.sh
The synth helpers are the ones from the ASCII BaseCommander arcade's sound scripts. All sounds and both tunes are
original: a lute-like tune in D major for the town, and a slow drone with distant bells for the depths.
"""
import base64, json, subprocess
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
OUT_JS = HERE.parent / "src" / "audio-data.js"
SR = 44100
rng = np.random.default_rng(11)   # fixed seed: the same sounds every run


def t(secs):
    return np.arange(int(secs * SR)) / SR


def sweep(f0, f1, secs, shape=2.0):
    """Phase for a pitch glide from f0 to f1 Hz; shape > 1 drops quickly at first."""
    x = t(secs) / secs
    f = f1 + (f0 - f1) * (1 - x) ** shape
    return 2 * np.pi * np.cumsum(f) / SR


def env(secs, attack=0.005, decay=None):
    """Fast attack, then exponential decay to about -60 dB at the end."""
    x = t(secs)
    a = np.minimum(1, x / attack) if attack else np.ones_like(x)
    return a * np.exp(-x / ((decay or secs) / 6.9))


def lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be a number or an array that changes over time."""
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    k = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += k[i] * (x[i] - acc); y[i] = acc
    return y


def noise(secs):
    return rng.uniform(-1, 1, len(t(secs)))


def square(phase):
    return np.sign(np.sin(phase))


def note(name):
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    n = names[name[0]] + (1 if "#" in name else 0) + 12 * (int(name[-1]) + 1)
    return 440 * 2 ** ((n - 69) / 12)


def mix(*parts):
    n = max(len(p) for p in parts); out = np.zeros(n)
    for p in parts: out[:len(p)] += p
    return out


def pluck(f, secs, bright=1.0):   # a plucked string: a few harmonics that die away, the high ones first
    x = t(secs)
    return sum(np.sin(2 * np.pi * f * h * x) * np.exp(-x * (3 + h * 2.5 * bright)) / h for h in (1, 2, 3, 4)) * np.minimum(1, x / 0.002)


def bell(f, secs):   # a bell: inharmonic partials that ring on
    x = t(secs)
    return sum(a * np.sin(2 * np.pi * f * r * x) * np.exp(-x * d) for r, a, d in ((1, 1, 1.2), (2.76, 0.5, 2.5), (5.4, 0.25, 4), (8.9, 0.12, 6)))


# ---- the player
def step():          # a soft scuff on stone
    return lowpass(noise(0.07), 1400) * env(0.07, 0.004) * 0.6


def hit():           # a blow landing: a thud and a crack
    return mix(np.sin(sweep(160, 60, 0.18)) * env(0.18, 0.001), lowpass(noise(0.1), 3000) * env(0.1, 0.001) * 0.7)


def miss():          # a swing through the air
    x = t(0.22)
    return lowpass(noise(0.22), 600 + 2500 * np.sin(np.pi * x / 0.22)) * np.sin(np.pi * x / 0.22) * 0.8


def kill():          # something falls: a crunch and a dropping tone
    return mix(lowpass(noise(0.3), 1800) * env(0.3, 0.001, 0.15), np.sin(sweep(300, 60, 0.4, 1.2)) * env(0.4, 0.002) * 0.6)


def hurt():          # you are hit: a low, dull knock
    return mix(np.sin(sweep(110, 50, 0.22)) * env(0.22, 0.001), lowpass(noise(0.12), 700) * env(0.12, 0.001) * 0.6)


def levelup():       # a rising arpeggio, plucked
    return mix(*[np.concatenate([np.zeros(int(i * 0.09 * SR)), pluck(note(n), 0.9)]) for i, n in enumerate(["D4", "F#4", "A4", "D5", "F#5"])]) * 0.5


def death():         # a slow falling toll
    return mix(bell(note("D3"), 2.5) * 0.6, np.sin(sweep(220, 55, 2.0, 0.8)) * env(2.0, 0.05) * 0.4)


def stairs():        # footsteps going down stone stairs
    return mix(*[np.concatenate([np.zeros(int(i * 0.16 * SR)), lowpass(noise(0.08), 1100 - i * 120) * env(0.08, 0.003) * (1 - i * 0.12)]) for i in range(5)])


def gold():          # coins clinking
    return mix(*[np.concatenate([np.zeros(int(d * SR)), np.sin(2 * np.pi * f * t(0.25)) * env(0.25, 0.001) * 0.35]) for d, f in ((0, 3200), (0.05, 4100), (0.11, 3600), (0.16, 4600))])


def pickup():        # a pack rustle
    return lowpass(noise(0.16), 2600) * env(0.16, 0.01) * 0.7


def drink():         # a gulp or two
    return mix(*[np.concatenate([np.zeros(int(d * SR)), np.sin(sweep(260, 520, 0.09, 0.7)) * env(0.09, 0.005) * 0.6]) for d in (0, 0.14)])


def read():          # a page turning
    x = t(0.3)
    return lowpass(noise(0.3), 5000) * np.sin(np.pi * x / 0.3) ** 2 * 0.5


def eat():           # a crunchy bite
    return mix(*[np.concatenate([np.zeros(int(d * SR)), lowpass(noise(0.06), 2500) * env(0.06, 0.002)]) for d in (0, 0.12, 0.22)])


def fizzle():        # a spell going wrong
    x = t(0.4)
    return lowpass(noise(0.4), 4000) * env(0.4, 0.01) * 0.5 + np.sin(sweep(900, 200, 0.4)) * env(0.4, 0.005) * 0.2 * np.sin(2 * np.pi * 30 * x)


# ---- doors, digging and traps
def door():          # a heavy door creaks open
    x = t(0.5)
    f = 90 + 40 * np.sin(2 * np.pi * 2 * x)
    return lowpass(square(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * rng.uniform(0, 1, len(x))), 1200) * env(0.5, 0.05) * 0.4


def unlock():        # a lock clicks
    return mix(np.sin(2 * np.pi * 2400 * t(0.03)) * env(0.03, 0.0005), np.concatenate([np.zeros(int(0.06 * SR)), np.sin(2 * np.pi * 1700 * t(0.05)) * env(0.05, 0.0005)])) * 0.6


def bash():          # a shoulder against a stuck door
    return mix(np.sin(sweep(90, 40, 0.3)) * env(0.3, 0.001), lowpass(noise(0.25), 1500) * env(0.25, 0.001) * 0.8)


def dig():           # a pick on rock
    return mix(np.sin(2 * np.pi * 1900 * t(0.12)) * env(0.12, 0.0005) * 0.4, lowpass(noise(0.18), 3000) * env(0.18, 0.001) * 0.6)


def rubble():        # rock gives way and tumbles
    return mix(*[np.concatenate([np.zeros(int(d * SR)), lowpass(noise(0.2), 1600) * env(0.2, 0.001)]) for d in (0, 0.07, 0.15, 0.26)], np.sin(sweep(120, 40, 0.5)) * env(0.5, 0.002) * 0.5)


def trap():          # a trap springs: a snap and a twang
    return mix(lowpass(noise(0.05), 6000) * env(0.05, 0.0005), np.sin(sweep(700, 300, 0.4, 0.5)) * env(0.4, 0.001) * 0.4 * (1 + 0.3 * np.sin(2 * np.pi * 40 * t(0.4))))


def found():         # something hidden is found
    return mix(pluck(note("A5"), 0.4), np.concatenate([np.zeros(int(0.08 * SR)), pluck(note("E6"), 0.5)])) * 0.5


def shop():          # the shop bell over the door
    return mix(bell(note("E6"), 1.0), np.concatenate([np.zeros(int(0.12 * SR)), bell(note("B5"), 1.0)])) * 0.35


# ---- magic, by element
def fire():          # a roar of flame
    x = t(0.6)
    return lowpass(noise(0.6), 800 + 2500 * np.exp(-x / 0.15)) * env(0.6, 0.02) * 1.2


def cold():          # a glassy shimmer
    x = t(0.6)
    return sum(np.sin(2 * np.pi * f * x + 2 * np.sin(2 * np.pi * 7 * x)) for f in (2100, 2650, 3300)) * env(0.6, 0.01) * 0.2


def elec():          # a crackling buzz
    x = t(0.45)
    return square(2 * np.pi * 120 * x) * (rng.uniform(0, 1, len(x)) > 0.6) * env(0.45, 0.002) * 0.5


def acid():          # a hiss and bubbles
    bubbles = mix(*[np.concatenate([np.zeros(int(d * SR)), np.sin(sweep(300, 900, 0.05, 0.5)) * env(0.05, 0.003)]) for d in (0.1, 0.22, 0.31, 0.45)])
    return mix(lowpass(noise(0.6), 7000) * env(0.6, 0.05) * 0.3, bubbles * 0.4)


def poison():        # a wet gurgle
    x = t(0.5)
    return lowpass(square(2 * np.pi * (80 + 30 * np.sin(2 * np.pi * 9 * x)) * x), 600) * env(0.5, 0.02) * 0.5


def dark():          # a low swell that sucks the air out
    x = t(0.8)
    return np.sin(sweep(70, 40, 0.8, 0.5)) * np.sin(np.pi * x / 0.8) * 0.8 + lowpass(noise(0.8), 300) * np.sin(np.pi * x / 0.8) * 0.4


def light():         # a bright chime
    return mix(bell(note("A6"), 0.8), bell(note("E7"), 0.6) * 0.5) * 0.4


def arcane():        # a zap of force
    return np.sin(sweep(1600, 300, 0.25, 1.5)) * env(0.25, 0.002) * 0.6


# ---- monster cries, by kind of body
def growl():         # beasts
    x = t(0.6)
    return lowpass(square(2 * np.pi * np.cumsum(80 + 25 * np.sin(2 * np.pi * 3 * x) + 10 * rng.uniform(-1, 1, len(x))) / SR), 700) * np.sin(np.pi * x / 0.6) * 0.5


def chitter():       # insects, spiders and crawlers
    x = t(0.4)
    return np.sin(2 * np.pi * 3000 * x) * (np.sin(2 * np.pi * 35 * x) > 0.3) * np.sin(np.pi * x / 0.4) * 0.3


def moan():          # the undead
    x = t(1.0)
    return lowpass(np.sin(2 * np.pi * np.cumsum(180 + 40 * np.sin(2 * np.pi * 0.8 * x)) / SR) + 0.3 * noise(1.0), 900) * np.sin(np.pi * x) * 0.5


def screech():       # birds and bats
    return np.sin(sweep(3500, 1800, 0.3, 0.6)) * env(0.3, 0.01) * 0.4


def roar():          # dragons, giants and fiends
    x = t(1.1)
    return mix(lowpass(noise(1.1), 400 + 600 * np.sin(np.pi * x / 1.1)) * np.sin(np.pi * x / 1.1) * 1.2, np.sin(sweep(60, 40, 1.1, 0.5)) * env(1.1, 0.1) * 0.6)


def grunt():         # people and goblin-kin
    x = t(0.25)
    return lowpass(square(2 * np.pi * np.cumsum(140 - 40 * x / 0.25) / SR), 900) * np.sin(np.pi * x / 0.25) * 0.5


def squelch():       # jellies, moulds and worms
    x = t(0.35)
    return lowpass(noise(0.35), 300 + 1200 * np.sin(np.pi * x / 0.35)) * np.sin(np.pi * x / 0.35) * 0.9


SOUNDS = {"step": step, "hit": hit, "miss": miss, "kill": kill, "hurt": hurt, "levelup": levelup, "death": death, "stairs": stairs,
          "gold": gold, "pickup": pickup, "drink": drink, "read": read, "eat": eat, "fizzle": fizzle,
          "door": door, "unlock": unlock, "bash": bash, "dig": dig, "rubble": rubble, "trap": trap, "found": found, "shop": shop,
          "fire": fire, "cold": cold, "elec": elec, "acid": acid, "poison": poison, "dark": dark, "light": light, "arcane": arcane,
          "growl": growl, "chitter": chitter, "moan": moan, "screech": screech, "roar": roar, "grunt": grunt, "squelch": squelch}
QUIET = {"step": -30, "pickup": -24, "read": -24, "chitter": -24}   # sounds that come often: below the default loudness


def finish(x, name, rms_db=-16.0, peak_db=-2.0):
    """Level by average loudness, so a steady hiss isn't louder than a blast; never let the peak pass peak_db."""
    rms = np.sqrt(np.mean(x ** 2)) or 1
    gain = min(10 ** (QUIET.get(name, rms_db) / 20) / rms, 10 ** (peak_db / 20) / (np.abs(x).max() or 1))
    x = x * gain
    fade = int(0.01 * SR); x[-fade:] *= np.linspace(1, 0, fade)
    return x.astype(np.float32)


def encode(x, path, rate="64k"):
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-codec:a", "libmp3lame", "-b:a", rate, str(path)], input=x.tobytes(), check=True)
    return base64.b64encode(path.read_bytes()).decode()


# ---- music: loops whose tails wrap round to the start, so they play on without a seam
def place(out, s, at):
    i = (at + np.arange(len(s))) % len(out)
    np.add.at(out, i, s)


def town():          # a lute tune in D major: I vi IV V, twice, the melody coming in the second time
    beat = 60 / 96
    chords = [("D3", ["D4", "F#4", "A4"]), ("B2", ["B3", "D4", "F#4"]), ("G2", ["G3", "B3", "D4"]), ("A2", ["A3", "C#4", "E4"])] * 2
    tune = ["A5", "F#5", "E5", "D5", "B4", "D5", "E5", "F#5", "G5", "F#5", "E5", "D5", "E5", "C#5", "A4", "B4"]
    out = np.zeros(int(len(chords) * 4 * beat * SR))
    for b, (root, tri) in enumerate(chords):
        a0 = int(b * 4 * beat * SR)
        for k in (0, 2): place(out, pluck(note(root), 1.6, 0.6) * 0.5, a0 + int(k * beat * SR))
        for k in range(8): place(out, pluck(note(tri[[0, 1, 2, 1][k % 4]]), 0.8) * 0.22, a0 + int(k * beat / 2 * SR))
        if b >= 4:
            for k in range(4):
                n = tune[(b - 4) * 4 + k]
                place(out, pluck(note(n), 1.0, 0.4) * 0.3, a0 + int(k * beat * SR))
    return out


def depths():        # a slow drone on A, wind, and a distant bell now and then
    L = 32.0; n = int(L * SR); x = np.arange(n) / SR
    fit = lambda f: round(f * L) / L   # whole cycles per loop, so the drone has no seam
    drone = sum(a * np.sin(2 * np.pi * fit(f) * x) for f, a in ((55, 0.5), (82.5, 0.3), (110, 0.15)))
    drone *= 0.7 + 0.3 * np.sin(2 * np.pi * fit(0.125) * x)
    out = drone * 0.4
    wind = lowpass(rng.uniform(-1, 1, n), 250) * (0.6 + 0.4 * np.sin(2 * np.pi * fit(1 / 16) * x + 1))
    out += wind * 0.5
    for at, nm in ((1.0, "E5"), (6.5, "A4"), (11.0, "C5"), (17.5, "D5"), (21.0, "E4"), (27.0, "G4")):
        place(out, bell(note(nm), 5.0) * 0.18, int(at * SR))
    return out


def main():
    data = {}
    for name, make in SOUNDS.items():
        x = finish(make(), name)
        data[name] = encode(x, HERE / "torch" / f"{name}.mp3")
        print(f"  {name:10s} {len(x) / SR:4.2f} s")
    songs = {}
    for name, make in (("town", town), ("depths", depths)):
        # The loop is followed by its first 3 seconds again and played from 1 s in, so the MP3 encoder's padding at
        # the very start and end never falls inside the loop.
        loop = make(); L = len(loop) / SR
        song = np.concatenate([loop, loop[:3 * SR]]); song = (song / np.abs(song).max() * 10 ** (-3 / 20)).astype(np.float32)
        songs[name] = {"data": encode(song, HERE / "torch" / f"{name}.mp3", "32k"), "loopStart": 1.0, "loopEnd": 1.0 + L}
        print(f"  {name:10s} {L:4.2f} s loop")
    OUT_JS.write_text("// Generated by audio/torch-sfx.py. Do not edit.\nconst TORCH_SFX = " + json.dumps(data) + ";\nconst TORCH_MUSIC = " + json.dumps(songs) + ";\n")
    print(f"wrote {OUT_JS.relative_to(HERE.parent)} ({OUT_JS.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
