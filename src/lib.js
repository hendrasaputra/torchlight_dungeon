/* ---------- Torchlight Dungeons: small helpers (from the ASCII BaseCommander arcade library) ---------- */
// Saved preferences and high scores, refitting on real resizes, and the frame loop.

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
