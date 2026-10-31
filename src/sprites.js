/* ---------- Torchlight Dungeons: tiles, figures and icons, all drawn by code (phase 6) ---------- */
// Nothing here is a picture file: each tile, monster and icon is drawn once, when first needed, into a small
// offscreen canvas of 16 x 16 logical pixels, then copied. A dark one-pixel outline is what makes them read.
const TS = 16;
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const hex = (rgb, k = 1) => "rgb(" + rgb.map(v => Math.max(0, Math.min(255, Math.round(v * k * 255)))).join(",") + ")";
const newCanvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
// A pixel pen over an offscreen canvas (phase 14: at any size). Shapes are given in the 16-unit space of a cell, with
// fractions, and filled pixel by pixel at S pixels to a unit: S is SR, which the renderer sets to 2 when the screen has
// room for twice the detail, so the same drawing makes a 16 x 16 sprite or a 32 x 32 one with real detail, not bigger
// blocks. A colour is a CSS string, or a shade (shade(rgb, k)): a ramp of seven steps, shadows leaning cool and
// highlights warm, lit from the top left, picked step by step and never blended (round shapes dither between steps
// at S > 1; flat ones keep clean bands).
// The ways of lighting, ramps and outlines are learned from pixelfx (github.com/patch-gg/pixelfx, MIT); the code is ours.
let SR = 1;
const RAMPS7 = new Map();
const tint = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const ramp7 = rgb => memo(RAMPS7, rgb.join(), () => [-3, -2, -1, 0, 1, 2, 3].map(n => n < 0 ? hex(tint(rgb.map(v => v * (1 + n * 0.19)), [0.1, 0.08, 0.24], -n * 0.1))
  : n > 0 ? hex(tint(rgb.map(v => Math.min(1, v * (1 + n * 0.13))), [1, 0.95, 0.74], n * 0.12)) : hex(rgb)));
const shade = (rgb, k = 3) => ({ ramp: ramp7(rgb), k });
const solid = col => typeof col === "string" ? col : col.ramp[col.k];
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const LIGHT_DIR = [-0.5, -0.65, 0.58].map((v, i, a) => v / Math.hypot(...a));
function pix(w = TS, h = TS, S = SR){
  const c = newCanvas(w * S, h * S), g = c.getContext("2d"), W = w * S, H = h * S, glows = c.glows = [];
  const put = (X, Y, col) => { g.fillStyle = col; g.fillRect(X, Y, 1, 1); };
  // a shade's step for a surface lit by v (-1 facing away from the light .. 1 facing it)
  const tone = (col, v, X, Y, dither) => { if (typeof col === "string") return col; const f = col.k + v * 1.7;
    return col.ramp[Math.max(0, Math.min(6, dither && S > 1 ? Math.floor(f + BAYER4[((Y & 3) << 2) | (X & 3)]) : Math.round(f)))]; };
  // every pixel in a box whose centre fn(u, v) (in units) says is inside, by giving how lit it is (null: outside)
  const area = (x0, y0, x1, y1, col, fn, dither = false) => {
    for (let Y = Math.max(0, Math.floor(y0 * S)); Y < Math.min(H, Math.ceil(y1 * S)); Y++)
      for (let X = Math.max(0, Math.floor(x0 * S)); X < Math.min(W, Math.ceil(x1 * S)); X++){ const v = fn((X + 0.5) / S, (Y + 0.5) / S); if (v !== null) put(X, Y, tone(col, v, X, Y, dither)); }
  };
  const p = { c, g, S, glows,
    // a box, lit along its top edge and from the left, shading towards the bottom
    rect: (x, y, ww, hh, col) => { const X = Math.round(x * S), Y = Math.round(y * S), RW = Math.max(1, Math.round(ww * S)), RH = Math.max(1, Math.round(hh * S));
      if (typeof col === "string"){ g.fillStyle = col; g.fillRect(X, Y, RW, RH); return; }
      for (let j = 0; j < RH; j++) for (let i = 0; i < RW; i++) put(X + i, Y + j, tone(col, j === 0 && RH > 1 ? 1 : (0.5 - (j + 0.5) / RH) * 0.8 + (0.5 - (i + 0.5) / RW) * 0.3, X + i, Y + j)); },
    px: (x, y, col) => p.rect(x, y, 1, 1, solid(col)),
    dot: (x, y, col) => put(Math.floor(x * S), Math.floor(y * S), solid(col)),   // one pixel: fine detail at S > 1
    clear: (x, y, ww, hh) => g.clearRect(x * S, y * S, ww * S, hh * S),
    // a ball around the cell (cx, cy), the same footprint as before at S = 1
    disc: (cx, cy, r, col) => { const ox = cx + 0.5, oy = cy + 0.5, R = r + 0.38;
      area(ox - R, oy - R, ox + R, oy + R, col, (u, v) => { const dx = (u - ox) / R, dy = (v - oy) / R, d2 = dx * dx + dy * dy;
        return d2 > 1 ? null : LIGHT_DIR[0] * dx + LIGHT_DIR[1] * dy + LIGHT_DIR[2] * Math.sqrt(1 - d2) - 0.35; }, true); },
    // a line from cell to cell: one pixel wide at S = 1, a smooth stroke of the same weight above
    line: (x0, y0, x1, y1, col) => {
      if (S === 1){ const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), tone(col, 0, 0, 0)); return; }
      const ax = x0 + 0.5, ay = y0 + 0.5, dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-9, r = 0.48;
      area(Math.min(ax, ax + dx) - r, Math.min(ay, ay + dy) - r, Math.max(ax, ax + dx) + r, Math.max(ay, ay + dy) + r, col, (u, v) => {
        const t = Math.max(0, Math.min(1, ((u - ax) * dx + (v - ay) * dy) / L2)), ex = ax + dx * t - u, ey = ay + dy * t - v; return ex * ex + ey * ey <= r * r ? 0 : null; }); },
    // an eye: drawn, glinting at S > 1, and remembered so it can glow in the dark
    eye: (x, y, col) => { p.px(x, y, col); if (S > 1) p.dot(x, y, "#fff"); glows.push([x + 0.5, y + 0.5, col]); },
    // a 1-pixel outline just outside what is drawn. Given a colour, all of it; otherwise picked per side from the colour
    // beside it: darker on the shadow side (bottom and right), lighter towards the light, broken where a highlight
    // touches it, and near black only where the bottom meets the floor
    outline: (col = null) => {
      const d = g.getImageData(0, 0, W, H), a = d.data, out = new Uint8ClampedArray(a), lit = /^#/.test(col || "") ? col.slice(1) : null;
      const C = col && lit ? [0, 2, 4].map(i => parseInt((lit.length === 3 ? lit.replace(/./g, "$&$&") : lit).substr(i, 2), 16)) : null;
      for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++){
        const o = 4 * (Y * W + X); if (a[o + 3]) continue;
        let r = 0, gg = 0, b = 0, n = 0, ox = 0, oy = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const XX = X + dx, YY = Y + dy; if (XX < 0 || YY < 0 || XX >= W || YY >= H) continue;
          const q = 4 * (YY * W + XX); if (a[q + 3] <= 128) continue; r += a[q]; gg += a[q + 1]; b += a[q + 2]; n++; ox -= dx; oy -= dy; }
        if (!n) continue;
        let rgb;
        if (C) rgb = C;
        else { r /= n; gg /= n; b /= n; const shadow = ox > 0 || oy > 0, luma = 0.3 * r + 0.59 * gg + 0.11 * b;
          if (!shadow && luma > 200 && S > 1) continue;
          rgb = oy > 0 && Y >= H * 0.8 ? [11, 10, 16] : [r, gg, b].map((v, i) => v * (shadow ? 0.24 : 0.42) + [14, 10, 30][i] * 0.5); }
        out[o] = rgb[0]; out[o + 1] = rgb[1]; out[o + 2] = rgb[2]; out[o + 3] = 255;
      }
      d.data.set(out); g.putImageData(d, 0, 0); return p; },
    // grain on a tile at S > 1: each pixel a little lighter or darker, so stone and earth have a texture
    grain: (amt = 0.14, seed = 0) => { if (S === 1) return p; const d = g.getImageData(0, 0, W, H), a = d.data;
      for (let i = 0; i < W * H; i++){ const k = 1 + (hash(i % W, (i / W) | 0, seed + 5) - 0.5) * amt; a[4 * i] *= k; a[4 * i + 1] *= k; a[4 * i + 2] *= k; }
      g.putImageData(d, 0, 0); return p; }
  };
  return p;
}
const memo = (cache, key, make) => cache.has(key) ? cache.get(key) : (cache.set(key, make()), cache.get(key));

/* ---------- terrain: a palette for each band of depth, and the town ---------- */
const THEMES = {
  stone:   { stone: [0.36, 0.36, 0.42], mortar: [0.16, 0.15, 0.2], top: [0.2, 0.19, 0.25], brick: [0.46, 0.42, 0.44] },
  moss:    { stone: [0.3, 0.36, 0.3], mortar: [0.12, 0.16, 0.12], top: [0.15, 0.2, 0.15], brick: [0.36, 0.42, 0.34], speck: [0.35, 0.6, 0.3] },
  crypt:   { stone: [0.38, 0.34, 0.4], mortar: [0.14, 0.11, 0.16], top: [0.19, 0.15, 0.22], brick: [0.5, 0.45, 0.52], speck: [0.75, 0.72, 0.65] },
  magma:   { stone: [0.34, 0.27, 0.25], mortar: [0.14, 0.08, 0.07], top: [0.2, 0.12, 0.1], brick: [0.45, 0.3, 0.26], speck: [1.0, 0.45, 0.15] },
  crystal: { stone: [0.3, 0.33, 0.44], mortar: [0.1, 0.11, 0.2], top: [0.15, 0.16, 0.28], brick: [0.38, 0.42, 0.6], speck: [0.6, 0.85, 1.0] }
};
const themeFor = d => d < 10 ? "stone" : d < 20 ? "moss" : d < 30 ? "crypt" : d < 40 ? "magma" : "crystal";
const TOWN = { grass: [0.28, 0.42, 0.22], dirt: [0.42, 0.34, 0.22], cobble: [0.48, 0.46, 0.44], plaster: [0.82, 0.76, 0.62], timber: [0.36, 0.24, 0.14], roof: [0.55, 0.22, 0.16], stone: [0.5, 0.48, 0.46] };
const WOOD = [0.55, 0.34, 0.18];
function floorTile(th, v){
  const p = pix(), s = th.stone, off = v & 1 ? 4 : 0;
  p.rect(0, 0, TS, TS, hex(th.mortar));
  for (let r = 0; r < 2; r++) for (let c = -1; c < 3; c++){   // flagstones in staggered rows, each with a lit top edge
    const x = c * 8 + (r ? off : 8 - off) % 8, y = r * 8, k = 0.85 + hash(c, r, v) * 0.3;
    p.rect(x + 1, y + 1, 7, 7, hex(s, k)); p.rect(x + 1, y + 1, 7, 1, hex(s, k * 1.18));
    if (hash(c, r, v + 9) < 0.25) p.line(x + 2, y + 3, x + 5, y + 6, hex(s, k * 0.7));
  }
  for (let i = 0; i < 6; i++) p.px((hash(i, v, 3) * TS) | 0, (hash(v, i, 4) * TS) | 0, hex(s, 0.65));
  if (th.speck && v === 3) for (let i = 0; i < 3; i++) p.px(3 + ((hash(i, 8) * 10) | 0), 3 + ((hash(8, i) * 10) | 0), hex(th.speck));
  if (p.S > 1){   // twice the detail: each flagstone shaded on its lower right, hairline cracks, grit and pebbles
    for (let r = 0; r < 2; r++) for (let c = -1; c < 3; c++){ const x = c * 8 + (r ? off : 8 - off) % 8, y = r * 8, k = 0.85 + hash(c, r, v) * 0.3;
      p.rect(x + 1, y + 7.5, 7, 0.5, hex(s, k * 0.72)); p.rect(x + 7.5, y + 1, 0.5, 7, hex(s, k * 0.8));
      if (hash(c, r, v + 4) < 0.4) for (let j = 0; j < 4; j++) p.dot(x + 2 + j * 1.5, y + 2.5 + hash(j, c, r) * 3, hex(s, k * 0.62)); }
    for (let i = 0; i < 10; i++) p.dot(hash(i, v, 21) * TS, hash(v, i, 22) * TS, hex(s, hash(i, v, 23) < 0.5 ? 0.6 : 1.25));
    if (th.speck) for (let i = 0; i < 2; i++) p.dot(2 + hash(i, v, 24) * 12, 2 + hash(v, i, 25) * 12, hex(th.speck, 0.8));
  }
  return p.grain(0.16, v).c;
}
function wallFace(th, v){   // a wall seen from the front: a lighter cap, then courses of brick
  const p = pix(), b = th.brick;
  p.rect(0, 0, TS, TS, hex(th.mortar));
  p.rect(0, 0, TS, 4, hex(th.top, 1.45)); p.rect(0, 3, TS, 1, hex(th.top, 0.8));
  for (let r = 0; r < 3; r++){ const y = 4 + r * 4, off = (r + v) & 1 ? 0 : 4;
    for (let c = -1; c < 3; c++){ const x = c * 8 + off, k = 0.8 + hash(c, r, v) * 0.35; p.rect(x, y, 7, 3, hex(b, k)); p.rect(x, y, 7, 1, hex(b, k * 1.2)); } }
  if (th.speck && v === 1) p.px(5, 9, hex(th.speck));
  p.rect(0, TS - 1, TS, 1, hex(th.mortar, 0.6));
  if (p.S > 1){   // twice the detail: each brick's lower edge in shadow, chips, and moss or crystal in the joints
    for (let r = 0; r < 3; r++){ const y = 4 + r * 4, off = (r + v) & 1 ? 0 : 4;
      for (let c = -1; c < 3; c++){ const x = c * 8 + off, k = 0.8 + hash(c, r, v) * 0.35; p.rect(x, y + 2.5, 7, 0.5, hex(b, k * 0.7)); if (hash(c, r, v + 3) < 0.3) p.dot(x + 1 + hash(r, c) * 5, y + 1, hex(b, k * 0.6)); } }
    if (th.speck) for (let i = 0; i < 4; i++) p.dot(hash(i, v, 31) * TS, 7 + (hash(v, i, 32) * 3 | 0) * 4, hex(th.speck, 0.75));
  }
  return p.grain(0.12, v + 10).c;
}
function wallTop(th, mask){   // the top of a wall; a lighter rim along each side that meets open floor
  const p = pix(), t = th.top; p.rect(0, 0, TS, TS, hex(t));
  for (let i = 0; i < 4; i++) p.px((hash(i, mask) * TS) | 0, (hash(mask, i) * TS) | 0, hex(t, 1.3));
  const rim = hex(t, 1.7);
  if (mask & 1) p.rect(0, 0, TS, 1, rim); if (mask & 2) p.rect(TS - 1, 0, 1, TS, rim); if (mask & 8) p.rect(0, 0, 1, TS, rim);
  if (p.S > 1) for (let i = 0; i < 8; i++) p.dot(hash(i, mask, 41) * TS, hash(mask, i, 42) * TS, hex(t, hash(i, mask, 43) < 0.5 ? 0.75 : 1.2));
  return p.grain(0.1, mask + 20).c;
}
function doorTile(face, open){
  const p = pix(); p.g.drawImage(face, 0, 0);
  p.rect(3, 2, 10, 14, "#120f14");
  if (open){ p.rect(3, 2, 2, 14, hex(WOOD, 0.8)); return p.c; }
  for (let x = 4; x < 12; x += 2) p.rect(x, 3, 2, 13, hex(WOOD, 0.85 + (x % 4) * 0.08));
  p.rect(4, 6, 8, 1, hex([0.3, 0.3, 0.35])); p.rect(4, 12, 8, 1, hex([0.3, 0.3, 0.35])); p.px(10, 9, hex([0.9, 0.8, 0.4]));
  return p.c;
}
function stairsTile(th, down, under){
  const p = pix(); p.g.drawImage(under, 0, 0);
  for (let i = 0; i < 5; i++){ const k = down ? 1 - i * 0.17 : 0.5 + i * 0.13, y = 2 + i * 3;
    p.rect(2, y, 12, 3, hex(th.stone, k)); p.rect(2, y, 12, 1, hex(th.stone, k * 1.3)); }
  p.rect(1, 1, 1, 15, hex(th.mortar)); p.rect(14, 1, 1, 15, hex(th.mortar));
  if (down) p.rect(3, 13, 10, 3, "#08070a");
  return p.c;
}
// Phase 8: rubble lies on the floor; veins are rock in their own colours, with gold in the rich ones.
const VEINS = { magma: { mortar: [0.12, 0.07, 0.06], top: [0.24, 0.12, 0.09], brick: [0.5, 0.28, 0.22], speck: [1.0, 0.5, 0.2] },
  quartz: { mortar: [0.28, 0.28, 0.33], top: [0.4, 0.4, 0.46], brick: [0.78, 0.78, 0.84], speck: [1, 1, 1] } };
function veinTile(th, front, mask, gold){
  const p = pix(); p.g.drawImage(front ? wallFace(th, 1) : wallTop(th, mask), 0, 0);
  for (let i = 0; i < 5; i++) p.px(2 + ((hash(i, mask, 7) * 12) | 0), (front ? 5 : 2) + ((hash(mask, i, 8) * 10) | 0), hex(th.speck));
  if (gold) for (const [x, y] of [[4, 6], [10, 9], [7, 12], [12, 5]]){ p.rect(x, y, 2, 1, "#f0c040"); p.px(x, y - 1, "#fff2a0"); }
  return p.c;
}
function rubbleTile(th, under){
  const p = pix(); p.g.drawImage(under, 0, 0);
  const q = pix();
  for (const [x, y, r] of [[5, 10, 3], [10, 11, 3], [8, 6, 3], [3, 6, 2], [12, 6, 2], [7, 12, 2]]){ q.disc(x, y, r, hex(th.brick, 0.75 + hash(x, y) * 0.3)); q.px(x - 1, y - r + 1, hex(th.brick, 1.25)); }
  q.outline(); p.g.drawImage(q.c, 0, 0); return p.c;
}
// A shrine lamp on its stone pedestal, cold or burning; and the Last Lamp, a great crystal blazing on its own.
function shrineTile(th, under, lit){
  const p = pix(); p.g.drawImage(under, 0, 0);
  const q = pix(), st = th.brick;
  q.rect(5, 9, 6, 6, hex(st, 0.9)); q.rect(4, 14, 8, 2, hex(st, 0.75)); q.rect(5, 9, 6, 1, hex(st, 1.25));   // the pedestal
  q.rect(4, 7, 8, 2, hex([0.72, 0.58, 0.3], lit ? 1.1 : 0.6)); q.rect(5, 6, 6, 1, hex([0.72, 0.58, 0.3], lit ? 1.3 : 0.7));   // the bowl
  if (lit){ q.disc(8, 4, 2, "#ffb030"); q.rect(7, 1, 2, 3, "#ffd27a"); q.px(8, 0, "#fff6c0"); } else { q.px(8, 5, "#3a3a44"); q.px(9, 4, "#2a2a30"); }
  q.outline(); p.g.drawImage(q.c, 0, 0); return p.c;
}
function lastLampTile(under){
  const p = pix(); p.g.drawImage(under, 0, 0);
  const q = pix(); q.rect(5, 13, 6, 3, "#3a3640");
  for (let y = 1; y < 13; y++){ const w = Math.max(1, Math.round(3 - Math.abs(y - 6) / 2.5)); q.rect(8 - w, y, w * 2, 1, y % 3 ? "#bfe8ff" : "#ffffff"); }
  q.px(7, 3, "#fff"); q.px(9, 8, "#e8f8ff"); q.outline("#1a2a3a"); p.g.drawImage(q.c, 0, 0); return p.c;
}
const TRAP_PICS = new Map();
const trapImage = Tr => memo(TRAP_PICS, SR + Tr.id, () => {   // a found trap, drawn over the floor
  const p = pix(), col = hex(Tr.rgb), id = Tr.id;
  if (/pit|trapdoor/.test(id)){ p.rect(3, 4, 10, 9, "#0a080c"); p.rect(3, 4, 10, 1, "#3a3238");
    if (id === "trapdoor") for (let x = 4; x < 12; x += 3) p.rect(x, 5, 2, 7, hex(WOOD, 0.7));
    if (id === "spiked") for (let x = 4; x < 12; x += 2){ p.px(x, 9, "#ccd"); p.px(x, 10, "#99a"); } }
  else if (/rune/.test(id)){ for (let a = 0; a < 24; a++) p.px(8 + Math.round(Math.cos(a / 3.82) * 5), 8 + Math.round(Math.sin(a / 3.82) * 4), col); p.disc(8, 8, 1, col); p.px(8, 8, "#fff"); }
  else { p.rect(4, 5, 8, 7, "#2c2a30"); p.rect(4, 5, 8, 1, "#4a464e"); p.disc(8, 8, 1, col); }
  return p.outline().c;
});
function grassTile(v){
  const p = pix(); p.rect(0, 0, TS, TS, hex(TOWN.grass, 0.9 + hash(v, 1) * 0.15));
  for (let i = 0; i < 14; i++){ const x = (hash(i, v, 5) * TS) | 0, y = (hash(v, i, 6) * TS) | 0; p.px(x, y, hex(TOWN.grass, 1.35)); p.px(x, y + 1, hex(TOWN.grass, 0.7)); }
  if (v === 2) for (let i = 0; i < 2; i++) p.px(4 + i * 6, 6 + i * 4, i ? "#e8d860" : "#e88aa0");   // a flower or two
  if (v === 3){ p.rect(3, 9, 9, 4, hex(TOWN.dirt)); p.rect(4, 9, 7, 1, hex(TOWN.dirt, 1.2)); }
  if (p.S > 1) for (let i = 0; i < 22; i++){ const x = hash(i, v, 51) * TS, y = hash(v, i, 52) * TS; p.dot(x, y, hex(TOWN.grass, 1.5)); p.dot(x, y + 0.5, hex(TOWN.grass, 1.1)); }   // blades
  return p.grain(0.1, v + 30).c;
}
function cobbleTile(v){
  const p = pix(); p.rect(0, 0, TS, TS, hex(TOWN.cobble, 0.55));
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++){ const k = 0.85 + hash(x, y, v) * 0.3, ox = y & 1 ? 2 : 0;
    p.rect((x * 4 + ox) % TS, y * 4, 3, 3, hex(TOWN.cobble, k)); p.px((x * 4 + ox) % TS, y * 4, hex(TOWN.cobble, k * 1.2));
    if (p.S > 1){ p.rect((x * 4 + ox) % TS, y * 4 + 2.5, 3, 0.5, hex(TOWN.cobble, k * 0.75)); p.rect((x * 4 + ox) % TS + 2.5, y * 4, 0.5, 3, hex(TOWN.cobble, k * 0.8)); } }
  return p.grain(0.12, v + 40).c;
}
function houseFace(v){   // a timber-framed wall with a lit window
  const p = pix(); p.rect(0, 0, TS, TS, hex(TOWN.plaster, 0.9 + hash(v, 2) * 0.1));
  p.rect(0, 0, TS, 2, hex(TOWN.roof, 0.7)); p.rect(0, 2, TS, 1, hex(TOWN.timber)); p.rect(0, TS - 2, TS, 2, hex(TOWN.timber));
  p.rect(0, 2, 1, 14, hex(TOWN.timber)); p.rect(15, 2, 1, 14, hex(TOWN.timber));
  if (v & 1){ p.rect(5, 5, 6, 6, hex(TOWN.timber)); p.rect(6, 6, 4, 4, "#f2c870"); p.rect(8, 6, 1, 4, hex(TOWN.timber)); p.rect(6, 8, 4, 1, hex(TOWN.timber)); }
  else p.line(2, 3, 13, 13, hex(TOWN.timber));
  return p.grain(0.08, v + 60).c;
}
function roofTile(mask){   // overlapping roof tiles; the ridge is lighter
  const p = pix(), r = TOWN.roof; p.rect(0, 0, TS, TS, hex(r, 0.75));
  for (let y = 0; y < TS; y += 4) for (let x = (y & 4) ? 0 : 2; x < TS; x += 4){ p.rect(x, y, 3, 3, hex(r, 0.9 + hash(x, y) * 0.2)); p.px(x, y + 2, hex(r, 0.55)); }
  if (mask & 1) p.rect(0, 0, TS, 1, hex(r, 1.4)); if (mask & 2) p.rect(TS - 1, 0, 1, TS, hex(r, 0.5)); if (mask & 8) p.rect(0, 0, 1, TS, hex(r, 1.2));
  return p.grain(0.1, mask + 50).c;
}
function shopDoor(rgb){
  const p = pix(); p.g.drawImage(houseFace(0), 0, 0);
  p.rect(3, 4, 10, 12, "#120f14"); for (let x = 4; x < 12; x += 2) p.rect(x, 5, 2, 11, hex(WOOD, 0.9 + (x % 4) * 0.06));
  for (let x = 0; x < TS; x += 2) p.rect(x, 1, 2, 3, x % 4 ? hex(rgb, 0.9) : "#f0ead8");   // a striped awning in the shop's colour
  p.px(10, 10, "#f0d060");
  return p.c;
}
// The town's great campfire: a ring of stones and logs, roaring at night, smouldering by day.
function campfire(under, night){
  const p = pix(); p.g.drawImage(under, 0, 0);
  const q = pix();
  for (let a = 0; a < 10; a++) q.disc(8 + Math.round(Math.cos(a * 0.63) * 6), 11 + Math.round(Math.sin(a * 0.63) * 3), 1, "#6a6670");   // the stone ring
  q.line(3, 13, 12, 9, hex(WOOD, 0.7)); q.line(4, 9, 13, 13, hex(WOOD, 0.6));   // crossed logs
  if (night){ q.disc(8, 8, 3, "#ff8a20"); q.disc(8, 6, 2, "#ffc040"); q.rect(7, 2, 2, 4, "#ffd27a"); q.px(8, 1, "#fff6c0"); q.px(5, 5, "#ffb030"); q.px(11, 4, "#ffb030"); }
  else { q.disc(8, 10, 2, "#8a3a18"); q.px(8, 10, "#ff7a20"); q.px(7, 7, "#9a9aa4"); q.px(9, 5, "#7a7a84"); q.px(8, 3, "#5a5a64"); }   // embers and smoke
  q.outline(); p.g.drawImage(q.c, 0, 0); return p.c;
}
function lampPost(under){
  const p = pix(); p.g.drawImage(under, 0, 0);
  const q = pix(); q.rect(7, 4, 2, 11, "#2a2a30"); q.rect(5, 14, 6, 2, "#2a2a30"); q.rect(5, 0, 6, 5, "#2a2a30"); q.rect(6, 1, 4, 3, "#ffd27a"); q.outline();
  p.g.drawImage(q.c, 0, 0); return p.c;
}
const TILE_CACHE = new Map();
// The picture for map cell (x, y). wallAt(x, y) says whether a neighbour is wall-like.
function tileImage(L, x, y, depth){
  const tm = (key, make) => memo(TILE_CACHE, SR + key, make);   // one picture per tile and sprite size
  const i = y * MW + x, t = L.tiles[i], v = (hash(x, y) * 4) | 0, below = y + 1 < MH ? L.tiles[i + MW] : T.EDGE;
  const wallish = (xx, yy) => { if (xx < 0 || yy < 0 || xx >= MW || yy >= MH) return true; const u = L.tiles[yy * MW + xx]; return u <= T.WALL || u === T.SHOP || (u >= T.MAGMA && u <= T.SECRET); };
  const mask = () => (wallish(x, y - 1) ? 0 : 1) | (wallish(x + 1, y) ? 0 : 2) | (wallish(x - 1, y) ? 0 : 8);
  if (L.town){
    const near = Math.abs(y - L.street) <= 1, ground = () => near ? tm("cob" + v, () => cobbleTile(v)) : tm("grass" + v, () => grassTile(v));
    const house = t === T.WALL && x > 0 && y > 0 && x < L.w - 1 && y < L.h - 1, th = THEMES.stone;
    if (t <= T.WALL){
      const open = below > T.WALL && below !== T.SHOP;
      if (!house) return open ? tm("tface" + (v & 1), () => wallFace({ ...th, brick: TOWN.stone }, v & 1)) : tm("ttop" + mask(), () => wallTop(th, mask()));
      return open ? tm("house" + (v & 1), () => houseFace(v & 1)) : tm("roof" + mask(), () => roofTile(mask()));
    }
    if (t === T.SHOP){ const k = L.shopAt[i]; return tm("shop" + k, () => shopDoor(SHOPS[k].rgb)); }
    if (t === T.LAMP) return tm("lamp" + near + v, () => lampPost(ground()));
    if (t === T.FIRE){ const night = !(typeof isDay === "function" && isDay()); return tm("fire" + night, () => campfire(cobbleTile(0), night)); }
    if (t === T.DOWN) return tm("tdown", () => stairsTile(th, true, grassTile(0)));
    return ground();
  }
  const name = themeFor(depth), th = THEMES[name], k = (s, f) => tm(name + s, f);
  const face = n => k("face" + n, () => wallFace(th, n));
  const front = !(below <= T.WALL || below === T.DOOR || (below >= T.MAGMA && below <= T.SECRET));   // open floor below: the wall shows its face
  if (t <= T.WALL || t === T.SECRET) return front ? face(v & 1) : k("top" + mask(), () => wallTop(th, mask()));
  if (t >= T.MAGMA && t <= T.QUARTZ_T){ const kind = t === T.MAGMA || t === T.MAGMA_T ? "magma" : "quartz", gold = t === T.MAGMA_T || t === T.QUARTZ_T, m = front ? 0 : mask();
    return k(kind + gold + front + m, () => veinTile(VEINS[kind], front, m, gold)); }
  if (t === T.DOOR) return k("door", () => doorTile(face(0), false));
  if (t === T.OPEN) return k("open", () => doorTile(face(0), true));
  const fl = n => k("floor" + n, () => floorTile(th, n));
  if (t === T.DOWN) return k("down", () => stairsTile(th, true, fl(0)));
  if (t === T.UP) return k("up", () => stairsTile(th, false, fl(0)));
  if (t === T.RUBBLE) return k("rubble" + (v & 1), () => rubbleTile(th, fl(v)));
  if (t === T.SHRINE || t === T.SHRINE_LIT) return k("shrine" + (t === T.SHRINE_LIT), () => shrineTile(th, fl(0), t === T.SHRINE_LIT));
  if (t === T.LASTLAMP) return k("lastlamp", () => lastLampTile(fl(0)));
  return fl(v);
}

/* ---------- people: a paper doll layered from what they wear ---------- */
const SKIN = { human: [0.93, 0.74, 0.6], sylvan: [0.95, 0.85, 0.7], stonekin: [0.8, 0.6, 0.5], burrowfolk: [0.95, 0.75, 0.6], tinkerling: [0.9, 0.8, 0.65],
  ashborn: [0.75, 0.45, 0.35], marrowkin: [0.55, 0.65, 0.45], cragborn: [0.6, 0.6, 0.62] };
const HAIR = { human: [0.35, 0.22, 0.14], sylvan: [0.85, 0.75, 0.45], stonekin: [0.55, 0.3, 0.15], burrowfolk: [0.45, 0.3, 0.15], tinkerling: [0.75, 0.75, 0.8],
  ashborn: [0.2, 0.15, 0.15], marrowkin: [0.15, 0.15, 0.12], cragborn: [0.3, 0.3, 0.3] };
const HEIGHT = { burrowfolk: 2, tinkerling: 2, stonekin: 1 };   // short peoples stand lower in the tile
const METAL = [0.72, 0.75, 0.82], LEATHER = [0.55, 0.36, 0.22], CLOTH = [0.35, 0.38, 0.6];
function material(k){
  if (!k) return null;
  if (/plate|banded|splint|steel|iron|gauntlets|tower|kite|great/.test(k)) return { rgb: METAL, shine: true };
  if (/chain|ring|scale/.test(k)) return { rgb: [0.6, 0.62, 0.66], mail: true };
  if (/robe/.test(k)) return { rgb: [0.4, 0.3, 0.6], robe: true };
  if (/circlet|silver/.test(k)) return { rgb: [1, 0.82, 0.35] };
  if (/sandal|soft/.test(k)) return { rgb: [0.62, 0.48, 0.3] };
  if (/fur/.test(k)) return { rgb: [0.5, 0.4, 0.3] };
  return { rgb: LEATHER };
}
// who: { race, skin?, hair?, tusks?, cloth?, eq: { weapon, shield, body, head, hands, feet, cloak, light, bow } as item kind ids }
// size: the picture's pixels; above 16 the doll is drawn shaded, with a face, a buckle, mail rings and plate edges.
function doll(who, size = TS * SR){
  const p = pix(TS, TS, size / TS), R = p.rect, D = p.dot, fine = p.S > 1;
  const e = who.eq || {}, skin = who.skin || SKIN[who.race] || SKIN.human, dy = HEIGHT[who.race] || 0, big = who.race === "cragborn" ? 1 : 0;
  const body = material(e.body) || { rgb: who.cloth || CLOTH }, legs = body.robe ? body.rgb : [0.3, 0.27, 0.32];
  if (e.cloak) R(4 - big, 6 + dy, 8 + 2 * big, 8 - dy, shade(/fur/.test(e.cloak) ? [0.5, 0.4, 0.3] : /oil/.test(e.cloak) ? [0.4, 0.38, 0.2] : [0.3, 0.42, 0.32], 2));
  R(5 - big, 11 + dy, 2 + big, 4 - dy, shade(legs)); R(9, 11 + dy, 2 + big, 4 - dy, shade(legs));
  const boot = e.feet ? material(e.feet).rgb : [0.3, 0.22, 0.16];
  R(4 - big, 14, 3 + big, 2, shade(boot)); R(9, 14, 3 + big, 2, shade(boot));
  if (fine){ R(4 - big, 15.5, 3 + big, 0.5, hex(boot, 0.5)); R(9, 15.5, 3 + big, 0.5, hex(boot, 0.5)); }   // soles
  R(4 - big, 6 + dy, 8 + 2 * big, 6, shade(body.rgb));
  if (body.robe){ R(4 - big, 11 + dy, 8 + 2 * big, 3 - dy, shade(body.rgb, 2)); if (fine) for (let x = 5; x < 11 + big; x += 2) R(x - big, 11.5 + dy, 0.5, 2.5 - dy, hex(body.rgb, 0.7)); }   // folds
  if (body.mail) for (let y = 7; y < 12; y += fine ? 1 : 2) for (let x = 5; x < 11; x += fine ? 1 : 2) (fine ? D : (xx, yy, c) => R(xx, yy, 1, 1, c))(x - big + (fine ? ((y & 1) * 0.5) : ((y >> 1) & 1)), y + dy, hex(body.rgb, 0.7));
  if (body.shine){ R(5 - big, 7 + dy, 2, 3, hex(body.rgb, 1.3)); R(4 - big, 6 + dy, 8 + 2 * big, 1, hex(body.rgb, 1.2)); if (fine){ R(8, 6 + dy, 0.5, 5, hex(body.rgb, 0.7)); R(4 - big, 9 + dy, 8 + 2 * big, 0.5, hex(body.rgb, 0.8)); } }   // plate edges
  R(4 - big, 11 + dy, 8 + 2 * big, 1, hex([0.25, 0.18, 0.12]));
  if (fine){ R(7.5, 11 + dy, 1.5, 1, "#c8a040"); D(7.5, 11 + dy, "#fff0a0"); }   // the buckle
  const hand = e.hands ? material(e.hands).rgb : skin;
  R(2 - big, 7 + dy, 2, 4, shade(body.rgb, 2)); R(12 + big, 7 + dy, 2, 4, shade(body.rgb, 2));
  R(2 - big, 10 + dy, 2, 2, shade(hand)); R(12 + big, 10 + dy, 2, 2, shade(hand));
  R(5, 1 + dy, 6, 5, shade(skin, 4));
  if (fine){ for (const x of [6.5, 9]){ D(x, 3.5 + dy, "#1a1418"); D(x, 3 + dy, hex(skin, 0.75)); }   // eyes under a brow, a nose's shadow, a mouth
    D(8, 4 + dy, hex(skin, 0.78)); D(7.5, 5 + dy, hex(skin, 0.6)); D(8, 5 + dy, hex(skin, 0.6)); }
  else { R(6, 3 + dy, 1, 1, "#1a1418"); R(9, 3 + dy, 1, 1, "#1a1418"); }
  if (who.tusks){ R(6, 5 + dy, 1, 1, "#eee"); R(9, 5 + dy, 1, 1, "#eee"); }
  const helm = material(e.head), hair = who.hair || HAIR[who.race] || HAIR.human;
  if (helm){ if (/circlet/.test(e.head)){ R(5, 0 + dy, 6, 2, shade(hair)); R(5, 1 + dy, 6, 1, hex(helm.rgb)); if (fine) D(8, 1 + dy, "#8cf"); }
    else { R(4, 0 + dy, 8, 3, shade(helm.rgb)); R(4, 0 + dy, 8, 1, hex(helm.rgb, 1.25)); if (/great/.test(e.head)){ R(4, 3 + dy, 8, 3, shade(helm.rgb, 2)); R(5, 3 + dy, 6, 1, "#1a1418"); } } }
  else { R(5, 0 + dy, 6, 2, shade(hair)); if (fine) for (let x = 5.5; x < 11; x += 1.5) D(x, 0.5 + dy, hex(hair, 1.35)); }   // strands
  weaponArt(R, e.weapon, dy, big);
  if (e.shield){ const sh = material(e.shield).rgb, small = /buckler/.test(e.shield), tall = /tower|kite/.test(e.shield);
    R(11 + big, (small ? 8 : tall ? 5 : 7) + dy, small ? 4 : 5, small ? 4 : tall ? 9 : 6, shade(sh)); R(12 + big, (small ? 9 : tall ? 7 : 8) + dy, 2, 2, shade([0.85, 0.7, 0.3], 4)); }
  else if (e.light){ R(13 + big, 7 + dy, 1, 4, hex(LEATHER)); R(13 + big, 5 + dy, 1, 2, hex(/lantern/.test(e.light) ? [1, 0.85, 0.45] : [1, 0.75, 0.25])); R(13 + big, 4 + dy, 1, 1, hex([1, 0.95, 0.6]));
    p.glows.push([13.5 + big, 5 + dy, "#ffc060"]); }
  return p.outline().c;
}
function weaponArt(R, k, dy, big){
  if (!k) return;
  const steel = hex([0.82, 0.85, 0.92]), dark = hex([0.45, 0.32, 0.2]), x = 1 - big;
  if (/staff|pike|spear|lance|glaive|halberd|trident|scythe/.test(k)){ R(x + 1, 1 + dy, 1, 14, dark); if (!/staff/.test(k)) R(x, 0 + dy, 3, 3, steel); return; }
  if (/shovel/.test(k)){ R(x + 1, 3 + dy, 1, 9, dark); R(x, 0 + dy, 3, 4, steel); return; }
  if (/pick|mattock/.test(k)){ R(x + 1, 3 + dy, 1, 9, dark); R(x - 1, 2 + dy, 5, 1, steel); R(x - 1, 3 + dy, 1, 1, steel); R(x + 3, 3 + dy, 1, 1, steel); return; }
  if (/axe/.test(k)){ R(x + 1, 3 + dy, 1, 9, dark); R(x, 2 + dy, 3, 4, steel); return; }
  if (/mace|hammer|maul|club|star|flail/.test(k)){ R(x + 1, 4 + dy, 1, 7, dark); R(x, 2 + dy, 3, 3, /club/.test(k) ? dark : steel); return; }
  const long = /two|headsman|bastard|long|broad/.test(k) ? 9 : 6;
  R(x + 1, 10 - long + dy, 1, long, steel); R(x, 10 + dy, 3, 1, hex([0.85, 0.7, 0.3])); R(x + 1, 11 + dy, 1, 1, dark);
}

/* ---------- creatures: one drawing per body plan; colour and size come from the monster's data ---------- */
// The plan is K.shape when the data gives one, otherwise it follows the monster's letter.
const PLAN = { r: "rodent", C: "canine", w: "worm", I: "insect", m: "mould", S: "spider", K: "beetle", q: "bear", "*": "wisp", s: "skeleton", z: "ghoul", T: "giant", g: "goblin", p: "person", k: "goblin" };
// every body plan creature() draws (the bestiary's checks make sure each monster has one)
const SHAPES = ["rodent", "canine", "worm", "insect", "mould", "spider", "beetle", "bear", "wisp", "bat", "bird", "snake", "jelly", "eye", "ghost", "elemental", "vortex", "golem", "fiend",
  "drake", "dragon", "hydra", "lizard", "feline", "scorpion", "centipede", "plant", "mimic", "horror", "mushroom", "skeleton", "ghoul", "mummy", "vampire", "lich", "hybrid", "scalekin", "giant", "goblin", "person"];
const SPRITES = new Map();
// F: the idle frame, 0 to 3. Plans that move on their own (wings, flicker) use it; the rest breathe or sway (idle).
const OWN_FRAMES = new Set(["bat", "bird", "wisp", "elemental", "vortex", "ghost"]), SWAYS = new Set(["jelly", "plant", "mould", "worm", "snake", "mushroom", "horror"]);
const planOf = K => K.shape || PLAN[K.glyph];
const creatureImage = (K, F = 0) => memo(SPRITES, SR + "|" + K.id + "|" + F, () => { const plan = planOf(K); return !F || OWN_FRAMES.has(plan) ? creature(K, F) : idle(creatureImage(K, 0), SWAYS.has(plan), F); });
// A stepped idle frame made from the still one: the upper body sinks a pixel and comes back, or the top sways.
function idle(img, sway, F){
  if (!F) return img;
  const W = img.width, H = img.height, c = newCanvas(W, H), g = c.getContext("2d"), u = Math.max(1, W / 32), top = Math.round(H * (sway ? 0.65 : 0.55));
  c.glows = img.glows;
  if (sway){ g.drawImage(img, 0, top, W, H - top, 0, top, W, H - top);
    for (let y = 0; y < top; y++) g.drawImage(img, 0, y, W, 1, Math.round([0, 1, 0, -1][F] * u * (1 - y / top) * 1.6), y, W, 1); }
  else { const n = [0, 1, 1, 0][F] * u; g.drawImage(img, 0, top, W, H - top, 0, top, W, H - top); g.drawImage(img, 0, 0, W, top, 0, n, W, top); }
  return c;
}
function creature(K, F = 0){
  const p = pix(), c = K.rgb, base = shade(c, 3), dark = shade(c, 1), light = shade(c, 5), eye = K.undead ? "#7ff" : "#ff4";
  switch (planOf(K)){
    case "rodent": p.rect(3, 9, 9, 5, base); p.rect(4, 9, 7, 1, light); p.rect(11, 8, 4, 4, base); p.eye(13, 9, eye); p.px(12, 7, light); p.line(0, 13, 3, 11, dark); p.rect(4, 14, 1, 1, dark); p.rect(10, 14, 1, 1, dark); break;
    case "canine": p.rect(2, 7, 10, 5, base); p.rect(3, 7, 8, 1, light); p.rect(11, 4, 4, 5, base); p.rect(14, 6, 2, 2, dark); p.eye(12, 5, eye); p.px(11, 3, base);
      for (const x of [3, 5, 9, 11]) p.rect(x, 12, 1, 3, dark); p.line(0, 5, 2, 8, base); break;
    case "worm": for (let i = 0; i < 5; i++) p.disc(3 + i * 2.5 | 0, 11 - (i === 4 ? 1 : 0), 2 + (i > 1 && i < 4 ? 1 : 0), i & 1 ? base : light); p.eye(13, 9, eye); p.line(13, 7, 14, 5, dark); break;
    case "insect": p.disc(5, 7, 3, light); p.disc(11, 7, 3, light); p.disc(5, 11, 2, base); p.disc(11, 11, 2, base); p.rect(7, 5, 2, 8, dark); p.eye(7, 5, eye); p.eye(8, 5, eye); break;
    case "mould": for (let i = 0; i < 6; i++) p.disc(3 + (hash(i, 1) * 10 | 0), 8 + (hash(i, 2) * 5 | 0), 2 + (hash(i, 3) * 2 | 0), i & 1 ? base : dark); for (let i = 0; i < 5; i++) p.px(4 + (hash(i, 5) * 8 | 0), 8 + (hash(i, 6) * 5 | 0), light); break;
    case "spider": p.disc(8, 8, 3, base); p.disc(8, 12, 2, dark); for (const s of [-1, 1]) for (let i = 0; i < 4; i++) p.line(8 + s * 2, 7 + i, 8 + s * 6, 4 + i * 3, dark); p.eye(7, 7, "#f44"); p.eye(9, 7, "#f44"); break;
    case "beetle": p.disc(8, 9, 4, base); p.rect(8, 5, 1, 9, dark); p.disc(8, 4, 2, dark); p.px(6, 7, light); p.px(10, 7, light); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) p.line(8 + s * 4, 7 + i * 2, 8 + s * 6, 6 + i * 3, dark); break;
    case "bear": p.rect(2, 6, 12, 7, base); p.rect(3, 6, 10, 1, light); p.disc(12, 6, 3, base); p.px(12, 3, base); p.px(14, 3, base); p.eye(13, 6, eye); p.rect(14, 7, 2, 2, dark);
      for (const x of [3, 6, 9, 12]) p.rect(x, 13, 2, 3, dark); break;
    case "wisp": p.disc(8, 8, F & 1 ? 3 : 4, shade(c.map(v => v * 0.9), 4)); p.disc(8, 8, 2, light); p.px(8, 8, "#fff");
      for (let i = 0; i < 3; i++) p.px(2 + (hash(i, F, 11) * 12 | 0), 2 + (hash(F, i, 12) * 12 | 0), light); break;
    case "bat": { const wy = [0, -3, 0, 3][F];   // the wings beat: up, level, down
      for (const sx of [-1, 1]){ p.line(8, 7, 8 + sx * 7, 4 + wy, dark); p.line(8 + sx * 7, 4 + wy, 8 + sx * 6, 10 + (wy >> 1), dark); p.line(8 + sx * 6, 10 + (wy >> 1), 8 + sx * 3, 8, dark);
        for (let y = 5; y < 9; y++) p.line(8 + sx * 2, y + 1, 8 + sx * (6 - (y - 5)), y + Math.round(wy * (9 - y) / 4), base); } } p.disc(8, 8, 2, base); p.eye(7, 7, eye); p.eye(9, 7, eye); p.px(7, 5, base); p.px(9, 5, base); break;
    case "bird": p.disc(7, 9, 3, base); p.disc(11, 6, 2, base); p.px(13, 6, hex([0.95, 0.75, 0.3])); p.px(14, 6, hex([0.95, 0.75, 0.3])); p.eye(11, 5, eye);
      { const wy = [0, -2, 0, 2][F]; p.line(2, 6 + wy, 6, 9, light); p.line(2, 7 + wy, 7, 10, dark); } p.line(3, 11, 1, 13, dark); p.rect(7, 12, 1, 3, dark); p.rect(9, 12, 1, 3, dark); break;
    case "snake": for (let i = 0; i < 12; i++){ const x = 2 + i, y = 11 + Math.round(Math.sin(i * 0.9) * 2); p.rect(x, y, 1, 2, i & 1 ? base : light); }
      p.disc(13, 8, 2, base); p.eye(14, 7, eye); p.px(15, 9, "#d33"); break;
    case "jelly": p.disc(8, 10, 5, shade(c, 2)); p.rect(3, 10, 11, 5, shade(c, 2)); p.disc(6, 8, 1, light); p.px(9, 11, dark); p.px(5, 12, dark); p.px(11, 9, light); break;
    case "eye": for (const [x, y] of [[2, 2], [14, 2], [1, 10], [15, 11], [8, 15]]) p.line(8, 8, x, y, dark);
      p.disc(8, 8, 5, shade([0.95, 0.92, 0.85], 4)); p.disc(8, 8, 3, base); p.disc(8, 8, 1, "#111"); p.px(7, 7, "#fff"); break;
    case "ghost": { const gc = shade(c.map(v => v * 0.9), 3); p.disc(8, 6, 4, gc); p.rect(4, 6, 9, 6, gc); for (let x = 4 + (F & 1); x < 13; x += 2) p.rect(x, 12, 1, 2, gc); }
      p.rect(6, 5, 1, 2, "#111"); p.rect(10, 5, 1, 2, "#111"); p.rect(7, 9, 3, 1, "#111"); break;
    case "elemental": for (let i = 0; i < 9; i++) p.disc(4 + (hash(i, 7) * 8 | 0), 4 + (hash(7, i) * 9 | 0), 2 + (hash(i, 9) * 2 | 0), i % 3 === F % 3 ? light : base); p.px(6, 6, "#fff"); p.px(10, 6, "#fff"); break;
    case "vortex": for (let a = 0; a < 40; a++){ const r = a / 6; p.px(8 + Math.round(Math.cos(a * 0.6 + F * 0.5) * r), 8 + Math.round(Math.sin(a * 0.6 + F * 0.5) * r * 0.8), a & 1 ? base : light); } break;
    case "golem": p.rect(4, 3, 8, 11, base); p.rect(4, 3, 8, 1, light); p.rect(2, 5, 2, 7, dark); p.rect(12, 5, 2, 7, dark); p.rect(5, 14, 2, 2, dark); p.rect(9, 14, 2, 2, dark);
      p.rect(6, 5, 1, 1, eye); p.rect(9, 5, 1, 1, eye); p.line(5, 9, 10, 10, dark); break;
    case "fiend": for (const sx of [-1, 1]) p.line(8 + sx * 2, 6, 8 + sx * 7, 2, dark); p.rect(5, 5, 6, 7, base); p.disc(8, 4, 2, base); p.px(6, 1, light); p.px(10, 1, light);
      p.eye(7, 4, "#ff4"); p.eye(9, 4, "#ff4"); p.rect(5, 12, 2, 3, dark); p.rect(9, 12, 2, 3, dark); p.line(11, 11, 14, 14, dark); break;
    case "drake": case "dragon": { const big = K.shape === "dragon";
      p.rect(3, 7, 9, 5, base); p.rect(4, 7, 7, 1, light); p.disc(13, 6, 2, base); p.px(15, 6, base); p.eye(13, 5, eye); p.line(0, 12, 3, 10, base);
      for (const x of [4, 9]) p.rect(x, 12, 2, 3, dark); p.line(5, 7, 2, big ? 1 : 3, dark); p.line(6, 7, 9, big ? 0 : 2, dark); p.line(2, big ? 1 : 3, 9, big ? 0 : 2, light);
      for (let x = 4; x < 11; x += 2) p.px(x, 6, light); break; }
    case "hydra": p.rect(3, 9, 10, 5, base); for (let h = 0; h < 3; h++){ const x = 4 + h * 4; p.line(x, 9, x + (h - 1), 4, base); p.disc(x + (h - 1), 3, 1, light); p.px(x + (h - 1), 3, eye); }
      p.rect(4, 14, 2, 2, dark); p.rect(10, 14, 2, 2, dark); break;
    case "lizard": p.rect(4, 8, 8, 4, base); p.rect(5, 8, 6, 1, light); p.disc(13, 9, 2, base); p.eye(14, 8, eye); p.line(0, 13, 4, 10, base); for (const x of [4, 10]){ p.px(x, 12, dark); p.px(x - 1, 13, dark); } break;
    case "feline": p.rect(2, 8, 10, 4, base); p.rect(3, 8, 8, 1, light); p.disc(12, 7, 2, base); p.px(11, 4, base); p.px(13, 4, base); p.eye(13, 7, eye); p.line(0, 5, 2, 9, base);
      for (const x of [3, 5, 9, 11]) p.rect(x, 12, 1, 3, dark); break;
    case "scorpion": p.disc(8, 10, 3, base); p.rect(5, 10, 6, 1, light); p.line(8, 7, 9, 3, base); p.line(9, 3, 12, 2, base); p.px(12, 3, "#e33");
      for (const sx of [-1, 1]){ p.line(8 + sx * 3, 9, 8 + sx * 6, 7, dark); p.rect(8 + sx * 6 - 1, 5, 2, 2, base); for (let i = 0; i < 3; i++) p.line(8 + sx * 2, 11 + i, 8 + sx * 5, 13 + i, dark); } break;
    case "centipede": for (let i = 0; i < 7; i++){ const x = 2 + i * 2, y = 9 + Math.round(Math.sin(i) * 1.5); p.disc(x, y, 1, i & 1 ? base : light); p.px(x, y + 2, dark); p.px(x, y - 2, dark); } p.eye(15, 8, eye); break;
    case "plant": p.rect(7, 6, 2, 9, hex([0.35, 0.5, 0.25])); for (let i = 0; i < 5; i++) p.line(8, 12 - i * 2, 8 + (i & 1 ? 5 : -5), 9 - i * 2, base); p.disc(8, 4, 2, light); p.px(8, 4, dark); break;
    case "mimic": p.rect(2, 6, 12, 8, hex([0.55, 0.38, 0.22])); p.rect(2, 6, 12, 2, hex([0.65, 0.5, 0.3])); p.rect(2, 9, 12, 1, hex([0.85, 0.7, 0.3]));
      for (let x = 3; x < 13; x += 2) p.px(x, 10, "#fff"); p.rect(3, 11, 10, 2, "#401010"); p.eye(6, 7, eye); p.eye(10, 7, eye); break;
    case "horror": p.disc(8, 7, 4, base); for (let i = 0; i < 6; i++){ const x = 3 + i * 2; p.line(x, 10, x + (i & 1 ? 1 : -1), 15, dark); }
      p.eye(6, 6, eye); p.eye(9, 5, eye); p.eye(10, 8, eye); p.rect(6, 9, 4, 1, "#300"); break;
    case "mushroom": p.disc(8, 6, 5, base); p.clear(2, 7, 13, 9); p.rect(3, 6, 11, 1, hex(c, 0.75)); p.rect(6, 7, 4, 7, hex([0.92, 0.88, 0.78])); p.px(7, 9, "#111"); p.px(9, 9, "#111");
      p.rect(5, 14, 2, 2, hex([0.85, 0.8, 0.7])); p.rect(9, 14, 2, 2, hex([0.85, 0.8, 0.7])); p.px(5, 3, "#fff"); p.px(10, 4, "#fff"); break;
    case "skeleton": return doll({ skin: [0.9, 0.88, 0.8], hair: [0.9, 0.88, 0.8], cloth: [0.85, 0.83, 0.75], race: "human", eq: K.kit || { weapon: "shortsword" } });
    case "ghoul": return doll({ skin: c, hair: c.map(v => v * 0.6), cloth: [0.3, 0.32, 0.28], race: "human", eq: K.kit || {} });
    case "mummy": return doll({ skin: c, hair: c, cloth: c.map(v => v * 0.9), race: "human", eq: K.kit || {} });
    case "vampire": return doll({ skin: [0.9, 0.88, 0.9], hair: [0.12, 0.1, 0.12], cloth: c, race: "human", eq: { cloak: "furcloak", ...(K.kit || {}) } });
    case "lich": return doll({ skin: [0.85, 0.82, 0.7], hair: [0.85, 0.82, 0.7], cloth: c, race: "human", eq: { body: "robe", head: "circlet", weapon: "staffw" } });
    case "hybrid": return doll({ skin: c, hair: c.map(v => v * 0.6), cloth: [0.4, 0.32, 0.22], race: "stonekin", tusks: true, eq: K.kit || { weapon: "axe" } });
    case "scalekin": return doll({ skin: c, hair: c.map(v => v * 0.7), cloth: [0.45, 0.35, 0.22], race: "human", tusks: true, eq: K.kit || {} });
    case "giant": return doll({ skin: c, hair: c.map(v => v * 0.6), cloth: [0.4, 0.32, 0.22], race: "cragborn", tusks: true, eq: K.kit || { weapon: "club" } });
    case "goblin": return doll({ skin: c, hair: [0.15, 0.12, 0.1], race: "burrowfolk", tusks: true, eq: K.kit || { weapon: "dagger", body: "leather" } });
    case "person": return doll({ skin: SKIN.human, hair: c.map(v => v * 0.5), cloth: c, race: "human", eq: K.kit || {} });
    default: {   // no plan: a mirrored shape seeded by the monster's id, so every kind still looks like itself
      let seed = 0; for (const ch of K.id) seed = seed * 31 + ch.charCodeAt(0);
      for (let y = 2; y < 15; y++) for (let x = 2; x < 8; x++) if (hash(x, y, seed) < 0.5 - Math.abs(y - 8) * 0.03){ const col = hash(x, y, seed + 1) < 0.2 ? light : base; p.px(x, y, col); p.px(15 - x, y, col); }
      p.eye(6, 6, eye); p.eye(9, 6, eye);
    }
  }
  return p.outline().c;
}
// The same shape as a dull red glow: how a warm body looks by infravision alone.
const HEAT = new Map();
const heatImage = img => memo(HEAT, img, () => { const c = newCanvas(img.width, img.height), g = c.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "#c8402f"; g.fillRect(0, 0, c.width, c.height); return c; });

/* ---------- item icons: one drawing per category, coloured by material or flavour ---------- */
function icon(K, rgb){
  const p = pix(), col = shade(rgb, 3), dark = shade(rgb, 1), light = shade(rgb, 5), c = K.cat;
  if (c === "weapon"){ p.g.translate(16 * p.S, 0); p.g.rotate(Math.PI / 4); p.g.translate(-3 * p.S, 2 * p.S);
    weaponArt((x, y, w, h, cl) => p.rect(x * 1.3, y * 1.3, w * 1.3 + 0.5, h * 1.3 + 0.5, cl), K.id, 0, 0); p.g.setTransform(1, 0, 0, 1, 0, 0); }
  else if (c === "bow"){ if (/sling/.test(K.id)){ p.line(3, 3, 8, 11, hex(LEATHER)); p.line(13, 3, 8, 11, hex(LEATHER)); p.disc(8, 12, 2, hex(LEATHER, 0.8)); }
    else { for (let y = 2; y < 15; y++) p.px(5 + Math.round(4 * Math.sin((y - 2) / 12 * Math.PI)), y, hex(WOOD)); p.line(5, 2, 5, 14, "#ddd"); } }
  else if (c === "ammo" || c === "dart"){ if (/shot|pebble/.test(K.id)) for (const [x, y] of [[5, 9], [10, 9], [8, 5], [7, 12]]) p.disc(x, y, 1, "#9a9aa4");
    else { p.line(3, 13, 12, 4, hex(WOOD)); p.rect(11, 3, 2, 2, "#ccd"); p.px(3, 12, "#d44"); p.px(4, 13, "#d44"); if (c === "ammo"){ p.line(4, 11, 13, 2, hex(WOOD)); } } }
  else if (c === "potion" || c === "flask"){ const cc = c === "flask" ? shade([0.9, 0.75, 0.3]) : col; p.rect(7, 2, 2, 3, "#ccd"); p.rect(6, 1, 4, 1, hex([0.5, 0.35, 0.2])); p.disc(8, 10, 4, cc); p.rect(5, 7, 6, 1, c === "flask" ? "#fe9" : light); p.px(6, 9, "#fff"); }
  else if (c === "scroll"){ p.rect(3, 4, 10, 8, "#e8dcc0"); p.rect(2, 3, 2, 10, "#c8b890"); p.rect(12, 3, 2, 10, "#c8b890"); for (let y = 6; y < 11; y += 2) p.rect(5, y, 6, 1, "#8a7a60"); p.px(8, 12, "#b33"); }
  else if (c === "tome"){ p.rect(3, 3, 10, 11, hex([0.5, 0.33, 0.2])); p.rect(3, 3, 2, 11, hex([0.35, 0.22, 0.13])); p.rect(12, 7, 2, 3, "#c8a040"); p.rect(6, 6, 5, 1, "#e8dcc0"); p.rect(6, 8, 4, 1, "#e8dcc0"); }
  else if (c === "book"){ const bc = K.realm === "holy" ? [0.95, 0.85, 0.45] : [0.45, 0.4, 0.9]; p.rect(3, 3, 10, 11, hex(bc)); p.rect(3, 3, 2, 11, hex(bc, 0.6)); p.rect(6, 6, 5, 1, hex(bc, 1.4)); p.rect(6, 8, 4, 1, hex(bc, 1.4)); }
  else if (c === "ring"){ p.disc(8, 10, 4, shade([0.95, 0.8, 0.35], 4)); p.clear(7, 9, 3, 3); p.disc(8, 5, 2, col); p.px(7, 4, "#fff"); }
  else if (c === "amulet"){ p.line(3, 2, 8, 9, "#ccb070"); p.line(13, 2, 8, 9, "#ccb070"); p.disc(8, 11, 3, col); p.px(7, 10, "#fff"); }
  else if (c === "wand" || c === "rod" || c === "staff"){ if (c === "staff"){ p.line(4, 15, 11, 1, col); p.line(5, 15, 12, 1, dark); p.disc(11, 2, 2, "#fe8"); } else { p.line(3, 13, 12, 3, col); p.line(4, 13, 13, 3, dark); p.disc(12, 3, 1, c === "rod" ? "#9cf" : "#fe8"); } }
  else if (c === "light"){ if (/lantern/.test(K.id)){ p.rect(5, 4, 6, 9, "#3a3a40"); p.rect(6, 5, 4, 7, "#ffd27a"); p.rect(7, 1, 2, 3, "#3a3a40"); } else { p.rect(7, 6, 2, 9, hex(LEATHER)); p.disc(8, 4, 2, "#fa3"); p.px(8, 2, "#ffd"); } }
  else if (c === "mushroom"){ p.rect(7, 9, 2, 5, "#ddc"); p.disc(8, 8, 4, col); p.clear(3, 9, 11, 4); p.rect(7, 9, 2, 5, "#ddc"); p.px(6, 6, "#fff"); }
  else if (c === "food"){ p.disc(8, 9, 5, hex([0.75, 0.55, 0.3])); p.rect(4, 7, 8, 1, hex([0.9, 0.75, 0.45])); }
  else if (c === "gold"){ for (const [x, y] of [[5, 11], [9, 11], [7, 8], [11, 9], [7, 12]]){ p.disc(x, y, 2, shade([0.91, 0.72, 0.19], 4)); p.px(x - 1, y - 1, "#fff2a0"); } }
  else { const m = material(K.id) || { rgb }, mc = shade(m.rgb);   // armour: a small silhouette per slot
    if (c === "body"){ p.rect(3, 3, 10, 10, mc); p.rect(1, 3, 3, 5, mc); p.rect(12, 3, 3, 5, mc); p.clear(6, 3, 4, 2); p.rect(3, 12, 10, 1, hex(m.rgb, 0.7)); if (m.mail) for (let y = 5; y < 12; y += 2) for (let x = 4; x < 12; x += 2) p.px(x + (y & 2 ? 1 : 0), y, hex(m.rgb, 0.7)); }
    else if (c === "shield"){ p.rect(3, 2, 10, 8, mc); p.disc(8, 10, 5, mc); p.rect(7, 3, 2, 10, hex([0.85, 0.7, 0.3])); }
    else if (c === "head"){ if (/circlet/.test(K.id)){ p.rect(3, 8, 10, 2, mc); p.disc(8, 7, 1, "#8cf"); } else { p.disc(8, 9, 5, mc); p.clear(2, 10, 13, 6); p.rect(3, 9, 10, 2, hex(m.rgb, 0.8)); } }
    else if (c === "feet"){ p.rect(3, 3, 4, 10, mc); p.rect(3, 11, 7, 3, mc); p.rect(9, 3, 4, 10, hex(m.rgb, 0.85)); p.rect(9, 11, 6, 3, hex(m.rgb, 0.85)); }
    else if (c === "hands"){ p.rect(4, 5, 8, 8, mc); p.rect(4, 2, 2, 4, mc); p.rect(7, 1, 2, 5, mc); p.rect(10, 2, 2, 4, mc); }
    else if (c === "cloak"){ const cc = hex(material(K.id).rgb === LEATHER ? [0.3, 0.42, 0.32] : material(K.id).rgb); p.rect(4, 2, 8, 2, cc); p.rect(3, 4, 10, 10, cc); p.rect(7, 4, 2, 10, "rgba(0,0,0,.3)"); }
    else p.rect(4, 4, 8, 8, col); }
  return p.outline().c;
}
// A spell's icon: by what it does, in its element's colour.
function spellIcon(S, rgb){
  const p = pix(), col = shade(rgb, 3), light = shade(rgb, 5);
  const fx = S.fx;
  if (/bolt|beam|ball/.test(fx)){ p.line(2, 14, 11, 5, col); p.line(3, 14, 12, 5, col); p.disc(12, 4, fx === "ball" ? 3 : 2, light); p.px(12, 4, "#fff"); }
  else if (/heal|cure|avatar/.test(fx)){ p.rect(6, 2, 4, 12, col); p.rect(2, 6, 12, 4, col); p.rect(7, 3, 2, 10, light); }
  else if (/detect|map|clair|enlight/.test(fx)){ p.disc(8, 8, 5, col); p.disc(8, 8, 3, "#fff"); p.disc(8, 8, 1, "#111"); }
  else if (/phase|teleport|sendAway|teleOther|recall|banish/.test(fx)){ for (let a = 0; a < 18; a++){ const r = a / 3; p.px(8 + Math.round(Math.cos(a * 0.7) * r), 8 + Math.round(Math.sin(a * 0.7) * r), a > 12 ? light : col); } }
  else if (/light|refuel|dispel/.test(fx)){ p.disc(8, 8, 3, light); for (let a = 0; a < 8; a++) p.px(8 + Math.round(Math.cos(a * 0.785) * 6), 8 + Math.round(Math.sin(a * 0.785) * 6), col); }
  else if (/res|ward|prot|bless|hero|fast/.test(fx)){ p.rect(3, 2, 10, 7, col); p.disc(8, 9, 5, col); p.rect(7, 4, 2, 8, light); p.rect(5, 6, 6, 2, light); }
  else { p.disc(8, 8, 5, col); p.line(5, 5, 11, 11, light); p.line(11, 5, 5, 11, light); }
  return p.outline().c;
}

/* ---------- the sprite sheet: index.html?sheet ---------- */
// Every creature (still, then its idle frames), tile and icon at 16 and at 32 pixels side by side, to look the whole
// set over at once. Only for reviewing the art; the game does not start.
function spriteSheet(){
  const keep = SR, out = [], show = (label, make) => {
    let h = `<figure><figcaption>${label}</figcaption>`;
    for (const s of [1, 2]){ SR = s; h += `<div>${[].concat(make()).map(c => `<img src="${c.toDataURL()}" width="48" height="48">`).join("")}</div>`; }
    out.push(h + "</figure>");
  };
  const section = t => out.push(`<h2>${t}</h2>`);
  section("Creatures: still and idle frames, at 16 (top) and 32 (below)");
  for (const K of MONSTERS) show(K.name, () => [0, 1, 2, 3].map(f => creatureImage(K, f)));
  section("People");
  for (const race of Object.keys(SKIN)) show(race, () => [doll({ race, eq: { weapon: "longsword", body: "chain", shield: "buckler", head: "cap" } }), doll({ race, eq: { body: "robe", light: "lantern" } })]);
  section("Tiles");
  for (const [name, th] of Object.entries(THEMES)) show(name, () => [floorTile(th, 0), floorTile(th, 3), wallFace(th, 0), wallTop(th, 9), doorTile(wallFace(th, 0), false), stairsTile(th, true, floorTile(th, 0)),
    rubbleTile(th, floorTile(th, 1)), shrineTile(th, floorTile(th, 0), false), shrineTile(th, floorTile(th, 0), true), veinTile(VEINS.magma, true, 0, true)]);
  show("town", () => [grassTile(0), grassTile(2), cobbleTile(1), houseFace(1), roofTile(9), shopDoor([0.6, 0.3, 0.3]), campfire(cobbleTile(0), true), lampPost(grassTile(0)), lastLampTile(floorTile(THEMES.crystal, 0))]);
  section("Items");
  for (const K of ITEMS) show(K.name, () => icon(K, K.rgb || [0.75, 0.7, 0.6]));
  SR = keep;
  document.body.innerHTML = `<style>body{background:#24202a;color:#cfc6b8;font:12px ui-monospace,monospace;padding:12px;overflow:auto;height:auto}h2{font:600 16px serif;color:#f0d88c;margin:18px 0 8px}
    figure{display:inline-block;margin:4px;padding:6px;background:#2f2a36;border-radius:4px;vertical-align:top}figcaption{max-width:200px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    img{image-rendering:pixelated;background:#15121a;margin:1px}</style>` + out.join("");
}
