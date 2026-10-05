/* ---------- Torchlight Dungeons: save games (phase 9) ---------- */
// A save is versioned JSON: the character (with what they know), the shops, and the level they are on. Levels are
// not kept, so the current one is all there is; its map arrays are run-length encoded. decodeSave refuses anything
// damaged with a message, and lifts older versions to this one through MIGRATIONS, one version at a time.
const SAVE_VERSION = 2;
const MIGRATIONS = {   // n: save at version n => the same save at version n + 1
  // 1 => 2 (phase 13): the rings of light. An older character's rings start where a new game's do, the Last Lamp burning.
  1: s => { const p = s.player; if (p){ p.rings = p.rings || { ...RING_START }; if (p.lastLamp === undefined) p.lastLamp = true; p.flame = p.flame || null; p.offerings = p.offerings || 0; p.flamesSold = p.flamesSold || 0; } return s; }
};
const ARRAYS = { Uint8Array, Int8Array, Int16Array };
const badSave = msg => { const e = new Error(msg); e.save = true; throw e; };
// "Uint8Array:1*40,2,1*3": runs of value*count
function rle(a){
  const out = [];
  for (let i = 0; i < a.length;){ let j = i; while (j < a.length && a[j] === a[i]) j++; out.push(j - i > 1 ? a[i] + "*" + (j - i) : String(a[i])); i = j; }
  return a.constructor.name + ":" + out.join(",");
}
function unrle(s, n){
  const [type, body] = String(s).split(":"), A = ARRAYS[type];
  if (!A || body === undefined) badSave("This save is damaged: a map is unreadable.");
  const a = new A(n); let i = 0;
  for (const run of body.split(",")){
    const [v, c = 1] = run.split("*").map(Number);
    if (!Number.isInteger(v) || !Number.isInteger(c) || c < 1 || i + c > n) badSave("This save is damaged: a map is the wrong size.");
    a.fill(v, i, i + c); i += c;
  }
  if (i !== n) badSave("This save is damaged: a map is the wrong size.");
  return a;
}
// g: { player, depth, L, mem, mons, floor, shops, lastTown, wasDay, turnNo, log, rng, target }
function encodeSave(g){
  const level = {};
  for (const [k, v] of Object.entries(g.L)) if (ArrayBuffer.isView(v)) level[k] = rle(v); else if (typeof v !== "function" && k !== "rooms") level[k] = v;
  return JSON.stringify({ v: SAVE_VERSION, player: { ...g.player, bonus: undefined }, depth: g.depth, level, mem: rle(g.mem),
    mons: g.mons.map(m => m === g.player ? 0 : { ...m, K: m.K.id }), floor: g.floor, shops: g.shops, lastTown: g.lastTown, wasDay: g.wasDay,
    turnNo: g.turnNo, log: g.log, rng: g.rng, target: g.target });
}
function decodeSave(str){
  try {
    let s; try { s = JSON.parse(str); } catch (e){ badSave("This save is damaged: it is not readable."); }
    if (!s || typeof s !== "object" || !Number.isInteger(s.v)) badSave("This is not a Torchlight Dungeons save.");
    if (s.v > SAVE_VERSION) badSave("This save comes from a newer version of the game.");
    while (s.v < SAVE_VERSION){ if (!MIGRATIONS[s.v]) badSave("This save is from version " + s.v + ", which can no longer be read."); s = MIGRATIONS[s.v](s); s.v++; }
    const p = s.player;
    if (!p || !Array.isArray(p.inv) || !p.eq || !p.know || !p.stats || !p.t || !Number.isInteger(s.depth) || !s.level || !Array.isArray(s.mons) || !Array.isArray(s.floor) || !Array.isArray(s.shops))
      badSave("This save is damaged: parts of it are missing.");
    const L = {};
    for (const [k, v] of Object.entries(s.level)) L[k] = typeof v === "string" && /^(Uint8|Int8|Int16)Array:/.test(v) ? unrle(v, MW * MH) : v;
    if (!L.tiles || !L.room || !L.lit || !L.lock || !L.trap || !L.trapSeen) badSave("This save is damaged: the level is missing.");
    // the rooms' floor cells, which levels use to place things, are worked out again from the map
    if (L.town) L.rooms = [{ cells: [...L.tiles.keys()].filter(i => L.tiles[i] === T.GROUND) }];
    else { const by = new Map(); L.tiles.forEach((t, i) => { const r = L.room[i]; if (r >= 0 && passable(t)){ if (!by.has(r)) by.set(r, []); by.get(r).push(i); } }); L.rooms = [...by.values()].map(cells => ({ cells })); }
    const mons = s.mons.map(m => { if (m === 0) return p; if (!m || !MON[m.K]) badSave("This save is damaged: it holds an unknown monster."); return { ...m, K: MON[m.K] }; });
    if (mons[0] !== p) badSave("This save is damaged: the character is missing from the level.");
    return { ...s, player: p, L, mem: unrle(s.mem, MW * MH), mons };
  } catch (e){ throw e.save ? e : new Error("This save is damaged and cannot be loaded."); }
}
