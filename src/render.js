/* ---------- Torchlight Dungeons: drawing the map (phase 6) ---------- */
// Tiles and figures from sprites.js, then the light field multiplied over them: what you see now is lit by your
// torch and the rooms, what you remember is dim and cold, and the unknown is black. Movement, lunges, hit flashes,
// damage numbers and debris are only for show: the rules in game.js have already decided everything.
const cv = document.getElementById("cv"), ctx = cv.getContext("2d", { alpha: false }), stage = document.getElementById("stage");
let Z = 3, DPR = 1, VWpx = 0, VHpx = 0;   // Z: device pixels per sprite pixel; the view in device pixels
const view = { x: 0, y: 0 };               // the camera: the map pixel at the view's top-left
const lightTex = newCanvas(1, 1), lightG = lightTex.getContext("2d");
const anim = new WeakMap();                // per figure: where it is drawn, and its lunge and flash
let parts = [], floats = [], hoverCell = null, lit = () => false;

function renderLayout(){
  const r = stage.getBoundingClientRect(); if (!r.width) return;
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  // the Detail setting: larger or smaller sprites; whole device pixels keep the edges crisp. Sprites are drawn at twice
  // the detail (SR 2) when there are at least two device pixels to a unit, and then Z stays even, so every sprite pixel
  // still lands on whole device pixels
  const css = { 1: r.width > 1300 ? 2.5 : 2, 2: 1.5, 3: 1 }[DETAIL] || 2, want = css * DPR;
  SR = want >= 2 ? 2 : 1; Z = SR === 2 ? Math.max(2, 2 * Math.round(want / 2)) : Math.max(1, Math.round(want));
  VWpx = Math.round(r.width * DPR); VHpx = Math.round(r.height * DPR);
  cv.width = VWpx; cv.height = VHpx; cv.style.width = r.width + "px"; cv.style.height = r.height + "px";
  if (player) snapView();
}
const viewCells = () => [VWpx / (Z * TS), VHpx / (Z * TS)];
function cameraTarget(){
  const [vw, vh] = viewCells(), w = L ? L.w : MW, h = L ? L.h : MH, a = posOf(player);
  const fit = (p, v, n) => n <= v ? (n - v) / 2 : Math.max(0, Math.min(n - v, p + 0.5 - v / 2));
  return { x: fit(a.x, vw, w) * TS, y: fit(a.y, vh, h) * TS };
}
function snapView(){ const c = cameraTarget(); view.x = c.x; view.y = c.y; }
function posOf(o){
  let a = anim.get(o);
  if (!a){ a = { x: o.x, y: o.y, lunge: null, flash: 0, face: 1 }; anim.set(o, a); }
  return a;
}
function stepAnim(o, dt){
  const a = posOf(o), dx = o.x - a.x, dy = o.y - a.y, d = Math.hypot(dx, dy);
  if (d > 2.5){ a.x = o.x; a.y = o.y; }   // teleports and new levels jump
  else if (d > 0){ const s = Math.min(1, dt * 12 / d); a.x += dx * s; a.y += dy * s; }
  if (a.lunge && (a.lunge.t -= dt) <= 0) a.lunge = null;
  if (a.flash > 0) a.flash -= dt;
  return a;
}

/* ---------- phase 14: the feel of a blow, and richer effects ---------- */
// The ways of making a blow land are learned from pixelfx (github.com/patch-gg/pixelfx, MIT); the code is our own.
// Hit-stop: everything on screen holds still for a moment when a blow lands (hold). Shake: the view jolts by whole
// pixels and settles (quake). Both are off with Reduce motion. Particles come in kinds, take their colours step by step
// from a ramp (dark to bright, never blended), fade by dropping pixels in a fixed 4 x 4 pattern, and the bright ones glow.
let hold = 0, quake = 0, quakeAmp = 0, iris = 1, rings = [], arcs = [], bats = [], waits = [];
const LUNGE = 0.16;
const calm = () => opt("calm");
// a blow lands: hold everything for stop seconds and shake by amp pixels, after delay (when the strike connects)
function fxImpact(stop, amp = 0, delay = 0){
  if (calm()) return;
  if (delay > 0) return void waits.push({ t: delay, stop, amp });
  hold = Math.max(hold, stop);
  if (amp){ quakeAmp = Math.max(quake > 0 ? quakeAmp : 0, amp); quake = 0.25; }
}
// the time that moves things on screen: none during a hit-stop
function freeze(dt){
  for (const w of waits) if ((w.t -= dt) <= 0) fxImpact(w.stop, w.amp);
  waits = waits.filter(w => w.t > 0);
  if (hold > 0){ hold -= dt; return 0; }
  return dt;
}
// called from the rules: purely visual. A lunge is three beats: a pull back (further with a heavier weapon), a snap
// forward that overshoots, and a settle.
function fxLunge(a, b, back = 1.5){ const A = posOf(a); A.lunge = { dx: Math.sign(b.x - a.x), dy: Math.sign(b.y - a.y), t: LUNGE, back }; }
function lungeAt(l){ const u = 1 - l.t / LUNGE; return u < 0.3 ? -l.back * u / 0.3 : u < 0.55 ? -l.back + (6 + l.back) * (u - 0.3) / 0.25 : 6 * (1 - (u - 0.55) / 0.45); }
function fxHit(m){ posOf(m).flash = 0.14; }
function fxFloat(x, y, text, rgb, big = false){ floats.push({ x, y, text, rgb, t: 0, big }); }
// The ramps, dark to bright, one per element and for smoke, dust and gold.
const RAMPS = {
  fire: [[0.3, 0.06, 0.08], [0.6, 0.13, 0.08], [0.88, 0.3, 0.1], [1, 0.55, 0.16], [1, 0.8, 0.36], [1, 0.96, 0.78]],
  cold: [[0.1, 0.16, 0.38], [0.18, 0.36, 0.68], [0.34, 0.6, 0.92], [0.6, 0.82, 1], [0.86, 0.95, 1], [1, 1, 1]],
  elec: [[0.16, 0.16, 0.46], [0.3, 0.36, 0.86], [0.5, 0.66, 1], [0.76, 0.88, 1], [0.95, 0.98, 1], [1, 1, 1]],
  acid: [[0.12, 0.22, 0.06], [0.25, 0.46, 0.1], [0.46, 0.72, 0.16], [0.66, 0.9, 0.26], [0.86, 1, 0.52]],
  poison: [[0.12, 0.18, 0.1], [0.22, 0.36, 0.15], [0.38, 0.56, 0.2], [0.56, 0.76, 0.3], [0.76, 0.92, 0.5]],
  light: [[0.42, 0.3, 0.1], [0.72, 0.56, 0.2], [0.96, 0.8, 0.36], [1, 0.93, 0.6], [1, 1, 0.88], [1, 1, 1]],
  arcane: [[0.2, 0.1, 0.36], [0.4, 0.2, 0.66], [0.6, 0.36, 0.9], [0.8, 0.62, 1], [0.95, 0.86, 1]],
  dark: [[0.06, 0.03, 0.09], [0.13, 0.07, 0.21], [0.23, 0.12, 0.36], [0.36, 0.2, 0.56], [0.52, 0.33, 0.76]],
  smoke: [[0.1, 0.09, 0.12], [0.18, 0.17, 0.2], [0.28, 0.27, 0.3], [0.4, 0.38, 0.42], [0.55, 0.53, 0.56]],
  dust: [[0.2, 0.16, 0.12], [0.34, 0.28, 0.2], [0.5, 0.42, 0.31], [0.64, 0.56, 0.44]],
  gold: [[0.46, 0.28, 0.05], [0.76, 0.5, 0.1], [0.96, 0.76, 0.22], [1, 0.9, 0.52], [1, 1, 0.86]],
  water: [[0.12, 0.2, 0.3], [0.24, 0.38, 0.52], [0.45, 0.62, 0.76], [0.75, 0.88, 0.95]]
};
RAMPS.drain = RAMPS.dark;
const rampStep = (R, k) => R[Math.max(0, Math.min(R.length - 1, Math.floor(k * R.length)))];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const shows = (X, Y, a) => a >= 1 || a > BAYER[((Y & 3) << 2) | (X & 3)];   // ordered dither: is this pixel drawn at alpha a?
// one particle: kind bit (debris that tumbles), spark (a streak stretched by its speed), ember (rises, wanders, cools),
// smoke (rises, swells, thins), flake (drifts), twinkle (a small cross), drip (falls and splashes)
function part(kind, x, y, o = {}){
  const p = { kind, x, y, z: 0.3, vx: 0, vy: 0, vz: 0, life: 1, s: 1, ramp: null, rgb: null, ...o }; p.life0 = p.life; parts.push(p); return p;
}
const rnd = (a, b) => a + Math.random() * (b - a);
function burst(x, y, rgb, n){   // bits that tumble from a kill, sparks from a hit, glass from a potion
  for (let k = 0; k < n; k++){
    const a = Math.random() * 6.283, sp = 2 + Math.random() * 5;
    part("bit", x + 0.5, y + 0.6, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: 3 + Math.random() * 6, rgb, life: 1.4 + Math.random() * 0.8, s: Math.random() < 0.3 ? 2 : 1 });
  }
}
function sparks(x, y, R, n, speed = 7){ for (let k = 0; k < n; k++){ const a = Math.random() * 6.283, sp = rnd(0.4, 1) * speed; part("spark", x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rnd(2, 6), ramp: R, life: rnd(0.25, 0.55) }); } }
function embers(x, y, n, R = RAMPS.fire){ for (let k = 0; k < n; k++) part("ember", x + rnd(-0.3, 0.3), y + rnd(-0.2, 0.2), { z: rnd(0.3, 1), vx: rnd(-0.4, 0.4), vy: rnd(-0.3, 0.1), vz: rnd(1.2, 2.4), ramp: R, life: rnd(0.8, 1.6) }); }
function smoke(x, y, n, R = RAMPS.smoke){ for (let k = 0; k < n; k++) part("smoke", x + rnd(-0.3, 0.3), y + rnd(-0.2, 0.2), { z: rnd(0.4, 1), vx: rnd(-0.2, 0.2), vz: rnd(0.6, 1.1), ramp: R, life: rnd(0.9, 1.6), s: 2 }); }
function twinkles(x, y, n, R, spread = 0.7){ for (let k = 0; k < n; k++) part("twinkle", x + rnd(-spread, spread), y + rnd(-spread, spread), { z: rnd(0.3, 2.5), vz: rnd(0, 0.8), ramp: R, life: rnd(0.5, 1.1) }); }
function flakes(x, y, n, R = RAMPS.cold){ for (let k = 0; k < n; k++){ const a = Math.random() * 6.283, sp = rnd(1, 4); part("flake", x, y, { z: rnd(0.5, 2), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rnd(-0.3, 0.6), ramp: R, life: rnd(0.7, 1.3), s: Math.random() < 0.3 ? 2 : 1 }); } }
// a ring of light that spreads from a cell: a ball's blast, a shrine catching, a level gained
function fxRing(x, y, R, size = 2.5, d = 0.45){ rings.push({ x: x + 0.5, y: y + 0.5, R, size, t: 0, d }); }
// a jagged arc of lightning along a path, re-drawn each frame for its short life, so it flickers
function fxArc(path){ if (path.length) arcs.push({ path, t: 0.14 }); }
// what each element leaves where it lands; big for a ball
function fxSpell(x, y, elem, big = false){
  const R = RAMPS[elem] || RAMPS.arcane, cx = x + 0.5, cy = y + 0.5, n = big ? 2 : 1;
  if (elem === "fire"){ sparks(cx, cy, R, 6 * n); embers(cx, cy, 5 * n); smoke(cx, cy, 2 * n); }
  else if (elem === "cold"){ flakes(cx, cy, 10 * n); sparks(cx, cy, R, 3 * n, 5); }
  else if (elem === "elec"){ sparks(cx, cy, R, 10 * n, 10); twinkles(cx, cy, 3 * n, R); }
  else if (elem === "acid" || elem === "poison"){ burst(x, y, rampStep(R, 0.6), 4 * n); smoke(cx, cy, 2 * n, R); }
  else if (elem === "light"){ twinkles(cx, cy, 8 * n, R, 0.9); sparks(cx, cy, R, 4 * n, 5); }
  else { twinkles(cx, cy, 6 * n, R); smoke(cx, cy, 2 * n, RAMPS.dark); }
  if (big || elem === "cold" || elem === "light") fxRing(x, y, R, big ? 3 : 1.2, big ? 0.5 : 0.3);
}
// moments: a level gained, gold picked up, a shrine catching, a new level opening around you
function fxLevelUp(m){ const a = posOf(m); fxRing(a.x, a.y, RAMPS.gold, 2.5, 0.6); twinkles(a.x + 0.5, a.y + 0.5, 24, RAMPS.gold, 0.6); for (const p of parts.slice(-24)) p.vz = rnd(2, 4); }
function fxGold(x, y, n){ twinkles(x + 0.5, y + 0.5, 6, RAMPS.gold, 0.4); fxFloat(x, y, "+" + n, [1, 0.85, 0.35]); }
function fxShrine(x, y){ fxRing(x, y, RAMPS.fire, 4, 0.8); embers(x + 0.5, y + 0.3, 10); twinkles(x + 0.5, y + 0.5, 8, RAMPS.light, 1.2); }
function fxIris(){ if (!calm()) iris = 0; }
function shove(x, y, r){   // a blast pushes the debris lying around it
  for (const p of parts){ const dx = p.x - x - 0.5, dy = p.y - y - 0.5, d = Math.hypot(dx, dy) || 0.1; if (d > r) continue;
    const k = (1 - d / r) * 14; p.vx += dx / d * k; p.vy += dy / d * k; p.vz += k * 0.6; }
}
function stepParts(dt){
  for (const p of parts){
    const k = p.kind;
    if (k === "ember"){ p.vx += Math.sin(p.life * 9 + p.y * 3) * dt * 2; p.vx *= 1 - dt * 2; }
    if (k === "smoke"){ p.vx *= 1 - dt; p.vz *= 1 - dt * 0.5; p.s = 2 + (1 - p.life / p.life0) * 2; }
    if (k === "flake" || k === "spark"){ p.vx *= 1 - dt * (k === "flake" ? 3 : 1.5); p.vy *= 1 - dt * (k === "flake" ? 3 : 1.5); }
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    if (blocks(Math.floor(nx), Math.floor(p.y))) p.vx *= -0.5; else p.x = nx;   // walls stop them
    if (blocks(Math.floor(p.x), Math.floor(ny))) p.vy *= -0.5; else p.y = ny;
    p.vz -= (k === "bit" || k === "drip" ? 30 : k === "spark" ? 22 : k === "flake" ? 1.5 : 0) * dt; p.z += p.vz * dt;
    if (p.z < 0){ p.z = 0;
      if (k === "drip"){ p.life = 0; for (let j = 0; j < 3; j++) part("bit", p.x, p.y, { vx: rnd(-1.5, 1.5), vy: rnd(-1, 1), vz: rnd(1.5, 3), rgb: rampStep(RAMPS.water, 0.8), life: 0.4 }); }
      p.vz = -p.vz * 0.4; p.vx *= 0.6; p.vy *= 0.6; if (Math.abs(p.vz) < 0.8) p.vz = 0; }
    p.life -= dt;
  }
  parts = parts.filter(p => p.life > 0);
  for (const f of floats) f.t += dt;
  floats = floats.filter(f => f.t < 0.9);
  for (const r of rings) r.t += dt;
  rings = rings.filter(r => r.t < r.d);
  for (const a of arcs) a.t -= dt;
  arcs = arcs.filter(a => a.t > 0);
  for (const b of bats){ b.x += b.vx * dt; b.y += Math.sin(b.x * 2) * dt * 0.6; b.t -= dt; }
  bats = bats.filter(b => b.t > 0);
}
// Particles in map pixels: solid pixels, faded by dither, then glow added on top for the bright kinds.
function drawParts(){
  ctx.save(); ctx.scale(1 / SR, 1 / SR);   // on the sprite pixel grid: finer when sprites are drawn at twice the detail
  const glow = [], P = TS * SR;
  for (const p of parts){
    const age = 1 - p.life / p.life0, X = Math.round(p.x * P), Y = Math.round(p.y * P - p.z * 3 * SR), k = p.kind;
    if (k === "bit"){ const a = p.life < 0.4 ? p.life * 2.5 : 1;
      if (shows(X, Y, a)){ ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(Math.round(p.x * P), Math.round(p.y * P), p.s, 1); ctx.fillStyle = hex(p.rgb); ctx.fillRect(X, Y, p.s, p.s); } continue; }
    if (k === "spark"){ const col = hex(rampStep(p.ramp, 1 - age * 0.6)), tail = hex(rampStep(p.ramp, 0.45 - age * 0.3)), n = Math.min(4, Math.round(Math.hypot(p.vx, p.vy) * 0.35)) || 1;
      for (let j = n; j >= 0; j--){ const x = Math.round(X - p.vx * j * 0.012 * P), y = Math.round(Y - (p.vy * 0.012 * P - p.vz * 0.012 * 3) * j); if (!shows(x, y, 1 - age * 0.5)) continue; ctx.fillStyle = j ? tail : col; ctx.fillRect(x, y, 1, 1); }
      glow.push(X, Y, rampStep(p.ramp, 0.8)); continue; }
    if (k === "ember"){ if (!shows(X, Y, 1.2 - age)) continue; ctx.fillStyle = hex(rampStep(p.ramp, 1 - age)); ctx.fillRect(X, Y, 1, 1); if (age < 0.6) glow.push(X, Y, rampStep(p.ramp, 0.7)); continue; }
    if (k === "smoke"){ const r = Math.round(p.s), col = hex(rampStep(p.ramp, 0.75 - age * 0.5)), a = 0.7 * (1 - age);
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r && shows(X + i, Y + j, a)){ ctx.fillStyle = col; ctx.fillRect(X + i, Y + j, 1, 1); } continue; }
    if (k === "flake" || k === "twinkle" || k === "mote"){ const a = k === "mote" ? 0.5 * Math.sin(age * Math.PI) : 1.3 - age;
      if (!shows(X, Y, a)) continue; const col = hex(rampStep(p.ramp, k === "twinkle" ? 1 - age * 0.5 : 0.85 - age * 0.3)); ctx.fillStyle = col; ctx.fillRect(X, Y, 1, 1);
      if ((k === "twinkle" && Math.sin(age * 20 + p.x * 9) > 0.3) || (k === "flake" && p.s > 1)){ ctx.fillRect(X - 1, Y, 1, 1); ctx.fillRect(X + 1, Y, 1, 1); ctx.fillRect(X, Y - 1, 1, 1); ctx.fillRect(X, Y + 1, 1, 1); }
      if (k === "twinkle") glow.push(X, Y, rampStep(p.ramp, 0.7)); continue; }
    if (k === "drip"){ ctx.fillStyle = hex(rampStep(RAMPS.water, 0.9)); ctx.fillRect(X, Y, 1, 2); }
  }
  for (const r of rings){ const u = r.t / r.d, rad = (0.4 + u * r.size) * P, col = hex(rampStep(r.R, 1 - u * 0.7)), cx = r.x * P, cy = r.y * P, n = Math.ceil(rad * 4);
    ctx.fillStyle = col;
    for (let j = 0; j < n; j++){ const a = j / n * 6.283, X = Math.round(cx + Math.cos(a) * rad), Y = Math.round(cy + Math.sin(a) * rad * 0.7); if (shows(X, Y, 1 - u)) ctx.fillRect(X, Y, 1, 1); }
    glow.push(cx, cy, rampStep(r.R, 0.6)); }
  for (const a of arcs){ const pts = a.path.map(([x, y], j) => [(x + 0.5) * P + (j && j < a.path.length - 1 ? rnd(-3, 3) * SR : 0), (y + 0.5) * P + (j && j < a.path.length - 1 ? rnd(-3, 3) * SR : 0)]);
    ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = hex(RAMPS.elec[3]); ctx.lineWidth = 1; ctx.beginPath(); pts.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.globalCompositeOperation = "source-over"; }
  for (const b of bats){ const X = Math.round(b.x * P), Y = Math.round(b.y * P), up = Math.floor(b.t * 10) & 1;
    if (!lit(idx(Math.floor(b.x), Math.floor(b.y)))) continue;
    const u = SR; ctx.fillStyle = "#1a1420"; ctx.fillRect(X - u, Y, 3 * u, 2 * u); ctx.fillRect(X - 3 * u, Y - (up ? u : -u), 2 * u, u); ctx.fillRect(X + 2 * u, Y - (up ? u : -u), 2 * u, u); ctx.fillStyle = "#e33"; ctx.fillRect(X, Y, 1, 1); }
  ctx.globalCompositeOperation = "lighter";   // the glow: a soft halo added over what is drawn
  for (let j = 0; j < glow.length; j += 3){ ctx.fillStyle = hex(glow[j + 2], 0.28); ctx.fillRect(glow[j] - 1, glow[j + 1] - 1, 3, 3); }
  ctx.globalCompositeOperation = "source-over"; ctx.restore();
}
// Life in the dungeon, only for show: embers from burning shrines and the Last Lamp, drips from the walls, dust in lit
// rooms, and now and then a bat across the dark. warm: burning cells in view.
function ambient(dt, x0, y0, x1, y1, warm){
  for (const i of warm) if (visible(i) && Math.random() < dt * 3) embers(i % MW + 0.5, Math.floor(i / MW) + 0.2, 1, L.tiles[i] === T.LASTLAMP ? RAMPS.cold : RAMPS.fire);
  if (depth === 0) return;
  const cell = () => idx(x0 + Math.floor(Math.random() * (x1 - x0 + 1)), y0 + Math.floor(Math.random() * (y1 - y0 + 1)));
  if (Math.random() < dt * 0.8){ const i = cell(), y = Math.floor(i / MW);   // a drip, from a wall onto the floor below it
    if (y > 0 && visible(i) && passable(L.tiles[i]) && opaque(L.tiles[i - MW])) part("drip", i % MW + rnd(0.2, 0.8), y + 0.1, { z: 4, life: 3 }); }
  if (Math.random() < dt * 4){ const i = cell(); if (visible(i) && passable(L.tiles[i]) && lum(roomLight, 3 * i) > 0.3)   // dust in a lit room
    part("mote", i % MW + Math.random(), Math.floor(i / MW) + Math.random(), { z: rnd(0.5, 3), vx: rnd(-0.15, 0.15), vy: rnd(-0.1, 0.1), vz: rnd(-0.05, 0.1), ramp: RAMPS.dust, life: rnd(2, 4) }); }
  if (Math.random() < dt / 40 && !bats.length){ const left = Math.random() < 0.5;   // a bat crosses the view
    bats.push({ x: left ? x0 : x1 + 1, y: rnd(y0 + 1, y1 - 1), vx: (left ? 1 : -1) * rnd(5, 8), t: (x1 - x0 + 2) / 5 }); }
}

/* ---------- one frame ---------- */
function drawWorld(t, dt, real = dt){
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, VWpx, VHpx);
  if (!L) return;
  const title = state === "title" || state === "create";
  computeLight(lightNow, t);
  for (const m of mons) stepAnim(m, dt);
  stepParts(dt);
  const c = cameraTarget(), k = 1 - Math.exp(-dt * 10);
  view.x += (c.x - view.x) * k; view.y += (c.y - view.y) * k;
  if (Math.hypot(c.x - view.x, c.y - view.y) > TS * 12) snapView();
  let vx = Math.round(view.x * Z) / Z, vy = Math.round(view.y * Z) / Z;   // whole device pixels: no shimmer
  if (quake > 0){ quake -= real; const a = quakeAmp * Math.max(0, quake) / 0.25; vx += Math.round((Math.random() * 2 - 1) * a); vy += Math.round((Math.random() * 2 - 1) * a); }   // the shake, in whole pixels
  ctx.setTransform(Z, 0, 0, Z, -vx * Z, -vy * Z); ctx.imageSmoothingEnabled = false;
  const [vw, vh] = viewCells(), x0 = Math.max(0, Math.floor(vx / TS)), y0 = Math.max(0, Math.floor(vy / TS)), x1 = Math.min(MW - 1, x0 + Math.ceil(vw) + 1), y1 = Math.min(MH - 1, y0 + Math.ceil(vh) + 1);
  // Drawn in its light: what you see now, and any remembered place lit by a light that does not need you there (a lit
  // room, a burning shrine, the Last Lamp, the town's lamps): it stays lit on screen after you walk away. Only drawing:
  // monsters there still need you to see them.
  lit = i => title ? lum(lightNow, 3 * i) > 0.02 : visible(i) || ((inFov[i] === turnNo || depth === 0) && lum(lightNow, 3 * i) > 0.03) || (mem[i] && lum(roomLight, 3 * i) > 0.03);
  const shown = i => title ? lit(i) : mem[i];
  const warm = [];   // burning cells in view, for their embers
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){ const i = idx(x, y); if (!shown(i)) continue;
    ctx.drawImage(tileImage(L, x, y, depth), x * TS, y * TS, TS, TS); if (L.tiles[i] === T.SHRINE_LIT || L.tiles[i] === T.LASTLAMP) warm.push(i); }
  if (title) return lightOverlay(x0, y0, x1, y1, lit, title);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){ const i = idx(x, y); if (L.trapSeen[i] && L.trap[i] && mem[i]) ctx.drawImage(trapImage(TRAPS[L.trap[i] - 1]), x * TS, y * TS, TS, TS); }
  if (depth === 0 && L.fire >= 0 && !isDay() && Math.random() < dt * 8) embers(L.fire % MW + 0.5, Math.floor(L.fire / MW) + 0.4, 1);   // embers rise from the campfire at night
  ambient(dt, x0, y0, x1, y1, warm);
  const bob = n => Math.round(Math.sin(t / 260 + n) * 0.6);
  for (const f of floor){ const i = idx(f.x, f.y); if (!visible(i) && !f.seen) continue;
    ctx.drawImage(itemIcon(f.it), f.x * TS + 2, f.y * TS + 2 + (visible(i) ? bob(f.x) : 0), 12, 12); }
  // figures, back to front; the lit ones go under the light so the torch shades them
  const after = [], figs = mons.filter(m => m === player ? state === "play" || state === "dead" : m.K && sensed(m)).sort((a, b) => posOf(a).y - posOf(b).y);
  for (const m of figs){
    if (m !== player && !seesMon(m)){ after.push(m); continue; }
    if (m !== player && byHeat(m)){ after.push(m); continue; }
    figure(m, t);
  }
  lightOverlay(x0, y0, x1, y1, lit, false);
  for (const m of after) figure(m, t, byHeat(m) ? "heat" : "ghost");
  for (const s of shots) shotDraw(s);
  drawParts();
  ctx.globalCompositeOperation = "lighter";   // eyes and carried lights glow in the dark
  for (const m of figs){ if (m !== player && (!seesMon(m) || byHeat(m) || m.sleep > 0)) continue; const d = posOf(m).drawn; if (!d || !d.img.glows) continue;
    for (const [u, v, col] of d.img.glows){ const x = d.flip ? d.X + d.W - u * d.W / TS : d.X + u * d.W / TS, y = d.Y + v * d.W / TS;
      ctx.fillStyle = col; ctx.globalAlpha = 0.45; ctx.fillRect(x - 0.5, y - 0.5, 1, 1); ctx.globalAlpha = 0.16; ctx.fillRect(x - 1.5, y - 1.5, 3, 3); } }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  ctx.setTransform(1, 0, 0, 1, 0, 0);   // labels in device pixels, so text stays sharp
  const scr = (x, y) => [(x * TS - vx) * Z, (y * TS - vy) * Z];
  for (const m of figs) if (m !== player && seesMon(m)){
    const a = posOf(m), [sx, sy] = scr(a.x, a.y);
    if (m.hp < m.mhp){ ctx.fillStyle = "#000c"; ctx.fillRect(sx + 2 * Z, sy - 2 * Z, 12 * Z, 2 * Z); ctx.fillStyle = m.hp < m.mhp * 0.3 ? "#e8402a" : "#d8a030"; ctx.fillRect(sx + 2 * Z, sy - 2 * Z, Math.max(Z, 12 * Z * m.hp / m.mhp), 2 * Z); }
    if (m.sleep > 0) label(sx + 13 * Z, sy - Z * (2 + Math.sin(t / 400) * 1.5), "z", "#9cf", 0.7);
  }
  if (target && sensed(target)){ const a = posOf(target), [sx, sy] = scr(a.x, a.y), q = Z * (1 + Math.sin(t / 150) * 0.6), L4 = 4 * Z, w = TS * Z;
    ctx.fillStyle = "#f0c040";
    for (const [cx, cy, ex, ey] of [[sx - q, sy - q, 1, 1], [sx + w + q, sy - q, -1, 1], [sx - q, sy + w + q, 1, -1], [sx + w + q, sy + w + q, -1, -1]]){
      ctx.fillRect(Math.min(cx, cx + ex * L4), cy - (ey < 0 ? Z : 0), L4, Z); ctx.fillRect(cx - (ex < 0 ? Z : 0), Math.min(cy, cy + ey * L4), Z, L4); } }
  if (depth === 0) L.shops.forEach((sh, k) => { const x = sh.door % MW, y = Math.floor(sh.door / MW); if (!mem[sh.door]) return; const [sx, sy] = scr(x, y + (y < L.street ? -1 : 1.1)); label(sx + 8 * Z, sy + 10 * Z, (k + 1) + " " + SHOPS[k].name, "#f6e7c4", 0.62, true); });
  for (const f of floats){ const [sx, sy] = scr(f.x, f.y - f.t * 0.9); ctx.globalAlpha = Math.min(1, (0.9 - f.t) * 3); label(sx + 8 * Z, sy - 2 * Z, f.text, hex(f.rgb), f.big ? (f.t < 0.12 ? 1.9 - f.t / 0.12 * 0.6 : 1.3) * 0.95 : 0.95, true); ctx.globalAlpha = 1; }
  const goal = tutGoal();   // the tutorial's goal: a pulsing ring on it, or an arrow at the edge pointing to it
  if (goal !== null){
    const w = TS * Z, [gx, gy] = scr(goal % MW, Math.floor(goal / MW)), cx = gx + w / 2, cy = gy + w / 2, pulse = 0.5 + 0.5 * Math.sin(t / 180);
    ctx.strokeStyle = `rgba(240,192,64,${0.55 + pulse * 0.45})`; ctx.fillStyle = "#f0c040"; ctx.lineWidth = Math.max(2, Z * 1.2);
    if (cx > 0 && cy > 0 && cx < VWpx && cy < VHpx){ ctx.beginPath(); ctx.arc(cx, cy, w * (0.75 + pulse * 0.25), 0, 7); ctx.stroke(); }
    else {
      const mx = VWpx / 2, my = VHpx / 2, a = Math.atan2(cy - my, cx - mx), m = 34 * Z / 2;
      const k = Math.min((mx - m) / Math.abs(Math.cos(a) || 1e-6), (my - m) / Math.abs(Math.sin(a) || 1e-6)), ax = mx + Math.cos(a) * k, ay = my + Math.sin(a) * k, s = 7 * Z * (0.9 + pulse * 0.2);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.7); ctx.lineTo(-s * 0.3, 0); ctx.lineTo(-s * 0.7, s * 0.7); ctx.closePath();
      ctx.fill(); ctx.strokeStyle = "#000"; ctx.lineWidth = Z; ctx.stroke(); ctx.restore();
    }
  }
  if (aiming){ const [sx, sy] = scr(posOf(player).x, posOf(player).y); ctx.strokeStyle = "#f0c04088"; ctx.lineWidth = Z; ctx.setLineDash([2 * Z, 2 * Z]); ctx.strokeRect(sx - 2 * Z, sy - 2 * Z, 20 * Z, 20 * Z); ctx.setLineDash([]); }
  if (iris < 1){   // a new level opens around you
    iris = Math.min(1, iris + real / 0.5); const [px, py] = scr(posOf(player).x + 0.5, posOf(player).y + 0.5);
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.rect(0, 0, VWpx, VHpx); ctx.arc(px, py, 10 * Z + Math.hypot(VWpx, VHpx) * iris * iris, 0, 7); ctx.fill("evenodd"); }
}
function label(x, y, s, col, size = 0.8, centre = false){
  ctx.font = "bold " + Math.round(Z * TS * size * 0.5) + "px ui-monospace, Menlo, monospace"; ctx.textAlign = centre ? "center" : "left";
  ctx.lineWidth = Math.max(2, Z * 0.9); ctx.strokeStyle = "#000"; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.textAlign = "left";
}
const MIMICS = new Map();
const mimicImage = K => memo(MIMICS, SR + K.mimic, () => icon({ cat: K.mimic }, K.mimic === "potion" ? [0.5, 0.75, 1] : [1, 0.8, 0.3]));
function figure(m, t, how){
  const a = posOf(m), K = m.K, S = (K && K.size) || 1, f = m.sleep > 0 ? 0 : Math.floor(t / 125 + (m === player ? 0 : m.x * 7 + m.y * 3)) & 3;   // idle frames at 8 a second
  const img = m === player ? heroImage(f) : K.mimic && !m.revealed ? mimicImage(K) : creatureImage(looksLike(m), f);
  let ox = 0, oy = Math.round(Math.sin(t / 260 + (m === player ? 0 : m.x * 3)) * 0.6);
  if (a.lunge){ const k = lungeAt(a.lunge); ox = a.lunge.dx * k; oy += a.lunge.dy * k; }
  const px = Math.round(a.x * TS + ox), py = Math.round(a.y * TS + oy), W = Math.round(TS * S), X = px - (W - TS) / 2, Y = py - (W - TS);   // big ones grow upward from their feet
  if (m === player){ if (m.x !== a.lastX){ if (m.x !== a.lastX && a.lastX !== undefined) a.face = m.x < a.lastX ? -1 : 1; a.lastX = m.x; } }
  const flip = m === player ? a.face < 0 : m.x > player.x;
  if (!how){ ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.beginPath(); ctx.ellipse(px + 8, py + 14.5, 5 * S, 1.6 * S, 0, 0, 7); ctx.fill(); }
  const pic = how === "heat" ? heatImage(img) : a.flash > 0 ? flashImage(img) : img;
  ctx.globalAlpha = how === "ghost" ? 0.45 : K && K.invis && m !== player ? 0.7 : 1;
  if (flip){ ctx.save(); ctx.translate(X + W, Y); ctx.scale(-1, 1); ctx.drawImage(pic, 0, 0, W, W); ctx.restore(); } else ctx.drawImage(pic, X, Y, W, W);
  a.drawn = { X, Y, W, flip, img };
  ctx.globalAlpha = 1;
}
const FLASH = new Map();
const flashImage = img => memo(FLASH, img, () => { const c = newCanvas(img.width, img.height), g = c.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); return c; });
let heroKey = "", heroPics = [];
function heroImage(f = 0){   // the paper doll, redrawn when what you wear changes; f: its idle frame
  const look = dollLook(player), key = SR + JSON.stringify(look);
  if (key !== heroKey){ heroKey = key; heroPics = []; }
  return heroPics[f] || (heroPics[f] = f ? idle(heroImage(0), false, f) : doll(look));
}
const dollLook = p => ({ race: p.race, eq: Object.fromEntries(["weapon", "shield", "body", "head", "hands", "feet", "cloak", "light"].filter(s => p.eq[s]).map(s => [s, p.eq[s].k])) });
const ICONS = new Map();
const itemIcon = it => it.k === "gold" ? memo(ICONS, SR + "gold", () => icon({ cat: "gold" }, [1, 0.8, 0.3])) : memo(ICONS, SR + it.k + "|" + (it.art || ""), () => icon(ITEM[it.k], itemRgb(it, player.know)));
function shotDraw(s){
  const f = Math.min(s.path.length - 1, s.t * s.speed), i = Math.floor(f), c = s.path[i], n = s.path[Math.min(s.path.length - 1, i + 1)], u = f - i;
  const x = (c[0] + (n[0] - c[0]) * u + 0.5) * TS, y = (c[1] + (n[1] - c[1]) * u + 0.5) * TS;
  if (s.item){ ctx.save(); ctx.translate(x, y); ctx.rotate(s.t * 14); ctx.drawImage(itemIcon(s.item), -5, -5, 10, 10); ctx.restore(); return; }
  if (s.elem && !hold && Math.random() < 0.7){ const R = RAMPS[s.elem] || RAMPS.arcane, px = x / TS, py = y / TS;   // a trail in the element's kind
    if (s.elem === "fire") embers(px, py, 1); else if (s.elem === "cold") flakes(px, py, 1); else if (s.elem === "elec") sparks(px, py, R, 1, 4); else twinkles(px, py, 1, R, 0.2); }
  ctx.globalCompositeOperation = "lighter";
  for (let k = 0; k < 4; k++){ const b = Math.max(0, f - k * 0.5), j = Math.floor(b), cc = s.path[j];
    ctx.fillStyle = hex(s.rgb, 0.6 - k * 0.13); const r = 3 - k * 0.5; ctx.fillRect((cc[0] + 0.5) * TS - r, (cc[1] + 0.5) * TS - r, r * 2, r * 2); }
  ctx.fillStyle = "#fff"; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  ctx.globalCompositeOperation = "source-over";
}
// The light: one pixel per cell, smoothly enlarged and multiplied over the tiles, with a little warm bloom on top.
function lightOverlay(x0, y0, x1, y1, lit, title){
  const w = x1 - x0 + 3, h = y1 - y0 + 3;
  if (lightTex.width !== w || lightTex.height !== h){ lightTex.width = w; lightTex.height = h; }
  const img = lightG.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const mx = x0 + x - 1, my = y0 + y - 1, o = 4 * (y * w + x); d[o + 3] = 255;
    if (mx < 0 || my < 0 || mx >= MW || my >= MH) continue;
    const i = idx(mx, my), j = 3 * i;
    if (lit(i)){ d[o] = Math.min(255, lightNow[j] * 220 + 22); d[o + 1] = Math.min(255, lightNow[j + 1] * 220 + 20); d[o + 2] = Math.min(255, lightNow[j + 2] * 220 + 26); }
    else if (!title && mem[i]){ d[o] = 30; d[o + 1] = 34; d[o + 2] = 58; }   // remembered: dim and cold
  }
  lightG.putImageData(img, 0, 0);
  const X = (x0 - 1.5) * TS, Y = (y0 - 1.5) * TS;
  ctx.imageSmoothingEnabled = true;
  ctx.globalCompositeOperation = "multiply"; ctx.drawImage(lightTex, X, Y, w * TS, h * TS);
  ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.16; ctx.drawImage(lightTex, X, Y, w * TS, h * TS);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.imageSmoothingEnabled = false;
}
// The minimap and the Map tab: s screen pixels per cell, of what you remember.
function drawMinimap(c, s, focus){
  const w = L.w, h = L.h, g = c.getContext("2d"), img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const i = idx(x, y), o = 4 * (y * w + x); if (!mem[i]) continue;
    const t = L.tiles[i], v = visible(i);
    const col = t === T.DOWN || t === T.UP ? [240, 240, 240] : t === T.SHOP ? [240, 200, 90] : t === T.DOOR || t === T.OPEN ? [170, 110, 50] : L.trap[i] && L.trapSeen[i] ? [220, 90, 200] : t === T.SHRINE_LIT || t === T.LASTLAMP || t === T.FIRE ? [255, 200, 90] : t === T.SHRINE ? [120, 120, 150] : t === T.MAGMA_T || t === T.QUARTZ_T ? [200, 170, 60] : opaque(t) ? [96, 92, 110] : v ? [70, 66, 58] : [40, 40, 52];
    d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
  }
  for (const f of floor) if (f.seen || visible(idx(f.x, f.y))){ const o = 4 * (f.y * w + f.x); d[o] = 90; d[o + 1] = 170; d[o + 2] = 255; d[o + 3] = 255; }
  for (const m of mons) if (m.K && sensed(m)){ const o = 4 * (m.y * w + m.x); d[o] = 255; d[o + 1] = 70; d[o + 2] = 60; d[o + 3] = 255; }
  const goal = tutGoal(), gx = goal % MW, gy = Math.floor(goal / MW);   // the tutorial's goal blinks
  if (goal !== null && gx < w && gy < h && (performance.now() / 250 | 0) % 2){ const o = 4 * (gy * w + gx); d[o] = 255; d[o + 1] = 220; d[o + 2] = 60; d[o + 3] = 255; }
  const tmp = memo(ICONS, "mini" + w + "x" + h, () => newCanvas(w, h)); tmp.getContext("2d").putImageData(img, 0, 0);
  const cw = c.width, ch = c.height;
  // a small minimap follows you; the Map tab shows the whole level
  const ox = focus ? Math.max(0, Math.min(w * s - cw, player.x * s - cw / 2)) : (w * s - cw) / 2, oy = focus ? Math.max(0, Math.min(h * s - ch, player.y * s - ch / 2)) : (h * s - ch) / 2;
  g.fillStyle = "#07060b"; g.fillRect(0, 0, cw, ch); g.imageSmoothingEnabled = false;
  g.drawImage(tmp, -ox, -oy, w * s, h * s);
  g.fillStyle = (performance.now() / 300 | 0) % 2 ? "#ffe060" : "#fff"; g.fillRect(player.x * s - ox - 1, player.y * s - oy - 1, s + 2, s + 2);
}
