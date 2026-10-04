/* ---------- Torchlight Dungeons: small helpers (from the ASCII BaseCommander arcade library) ---------- */
// Saved preferences and high scores, sound, refitting on real resizes, and the frame loop.

// Saved settings for one game, under "<prefix><key>" in localStorage. Values are strings; *JSON for anything else.
function prefs(prefix, label){
  return {
    get(k, d = null){ try { const v = localStorage.getItem(prefix + k); return v === null ? d : v; } catch (e){ return d; } },
    set(k, v){ try { localStorage.setItem(prefix + k, v); return true; } catch (e){ console.warn(label + ": could not save " + k, e); return false; } },
    getJSON(k, d){ const v = this.get(k); if (v === null) return d; try { return JSON.parse(v); } catch (e){ console.warn(label + ": saved " + k + " unreadable, using defaults", e); return d; } },
    setJSON(k, v){ return this.set(k, JSON.stringify(v)); },
    del(k){ try { localStorage.removeItem(prefix + k); } catch (e){ console.warn(label + ": could not remove " + k, e); } }
  };
}
// A saved top-n list. add() returns the new entry's rank (0 is best) and whether saving worked.
function scoreTable(store, n = 5, key = "scores", better = (a, b) => b.score - a.score){
  const list = store.getJSON(key, []);
  return { list, add(entry){ list.push(entry); list.sort(better); list.length = Math.min(list.length, n); return { rank: list.indexOf(entry), saved: store.setJSON(key, list) }; } };
}

// Sound from base64 MP3s. Browsers only allow audio after a user gesture, so nothing is decoded until unlock().
// sounds: { name: base64 }; music: { name: { data, loopStart, loopEnd } }, looped between margins cut from the
// recording so MP3 padding never lands inside the loop. vol: per-sound gain (volume for the rest). minGap: seconds within which a
// sound plays only once (a volley from many enemies still makes one sound). The mute choice is saved.
function createAudio({ label, store, sounds, music = {}, vol = {}, volume = 0.6, sfxGain = 0.9, musicGain = 0.5, minGap = 0 }){
  let ctx = null, master = null, sfxBus = null, musicBus = null, unlocked = false, waiting = null, song = null, songNode = null;
  let muted = store.get("muted") === "1", musicOn = store.get("music") !== "0";
  const buffers = {}, lastPlayed = {};
  function startSong(){
    const b = song && buffers["music:" + song]; if (!ctx || !b || songNode) return;
    const M = music[song], src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = b; src.loop = true; src.loopStart = M.loopStart; src.loopEnd = M.loopEnd;
    src.connect(g); g.connect(musicBus); src.start(0, M.loopStart); src.g = g; songNode = src;
  }
  const A = {
    get unlocked(){ return unlocked; }, get muted(){ return muted; }, get musicOn(){ return musicOn; },
    unlock(){
      if (unlocked) return;
      unlocked = true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC){ console.warn(label + ": Web Audio not supported, playing silent"); return; }
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = sfxGain; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? musicGain : 0; musicBus.connect(master);
      const decode = (key, b64, done) => ctx.decodeAudioData(Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer,
        b => { buffers[key] = b; done(); }, e => console.warn(label + ": could not decode sound", key, e));
      for (const [k, v] of Object.entries(sounds)) decode(k, v, () => { if (k === waiting){ waiting = null; A.play(k); } });   // the first tap may start a sound before it is decoded
      for (const [k, v] of Object.entries(music)) decode("music:" + k, v.data, () => { if (k === song) startSong(); });
    },
    play(name, pan){   // pan: sweep from -pan to +pan over the sound
      if (muted || !ctx) return;
      const b = buffers[name]; if (!b){ waiting = name; return; }
      const now = ctx.currentTime;
      if (minGap && now - (lastPlayed[name] ?? -1) < minGap) return;
      lastPlayed[name] = now;
      const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = b; g.gain.value = vol[name] ?? volume;
      src.connect(g);
      if (pan && ctx.createStereoPanner){
        const p = ctx.createStereoPanner(); p.pan.setValueAtTime(-pan, now); p.pan.linearRampToValueAtTime(pan, now + b.duration);
        g.connect(p); p.connect(sfxBus);
      } else g.connect(sfxBus);
      src.start();
    },
    music(name){   // switch to a song (fading the old one out); null stops the music
      if (song === name) return;
      song = name;
      if (songNode){ songNode.g.gain.setTargetAtTime(0, ctx.currentTime, 0.3); songNode.stop(ctx.currentTime + 1.5); songNode = null; }
      startSong();
    },
    toggleMute(){
      A.unlock(); muted = !muted;
      if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
      store.set("muted", muted ? "1" : "0");
    },
    toggleMusic(){   // music on or off, sound effects unchanged (added for Torchlight Dungeons)
      musicOn = !musicOn;
      if (musicBus) musicBus.gain.setTargetAtTime(musicOn ? musicGain : 0, ctx.currentTime, 0.1);
      store.set("music", musicOn ? "1" : "0");
    },
    pause(){ if (ctx) ctx.suspend(); }, resume(){ if (ctx) ctx.resume(); }
  };
  return A;
}

// Calls fn after real size changes (rotation, window resize), not the mobile address bar sliding in and out,
// which would make the game jump while you play.
function onResize(stage, fn){
  let fitted = stage.getBoundingClientRect();
  new ResizeObserver(() => {
    const r = stage.getBoundingClientRect();
    if (Math.abs(r.width - fitted.width) < 1 && Math.abs(r.height - fitted.height) < fitted.height * 0.15) return;
    fitted = r; fn();
  }).observe(stage);
}
// The frame loop: step(dt, t) at most ~60 times a second (120 Hz displays call more often than a game needs),
// with dt capped at 1/30 s so a stall never makes things jump.
function startLoop(step){
  const FRAME_MS = 1000 / 60;
  let last = 0, next = 0;
  function tick(t){
    requestAnimationFrame(tick);
    if (t < next - 1) return;
    next = t - next > FRAME_MS ? t + FRAME_MS : next + FRAME_MS;
    const dt = Math.min((t - last) / 1000, 1 / 30); last = t;
    step(dt, t);
  }
  requestAnimationFrame(t => { last = t; requestAnimationFrame(tick); });
}
