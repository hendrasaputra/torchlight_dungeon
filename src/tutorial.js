/* ---------- Torchlight Dungeons: the first game teaches itself (phase 12) ---------- */
// "The Keeper's charge": Sister Ilvane's steps for a new delver, one at a time in the Next box, each done when the
// player does it. It runs inside a character's first real game: on for the first character in a browser, skipped with
// Esc or Skip, and once skipped or finished it starts off for later characters. The menu's Guidance option turns it
// (and the key hints that stay after it) on or off. State: player.tut = { flags, done, at, ratDone, finished }.

// The key for each action, in each key set.
const TUT_KEYS = {
  modern: { move: "the arrow keys", char: "C", pack: "I", book: "B", ready: "Q", cast: "S", attack: "A", target: "Tab", grab: "W", down: "W", up: "W", drink: "D", rest: "R", eat: "E", fuel: "F", lore: "K", help: "?" },
  original: { move: "the arrow keys or numpad", char: "C", pack: "i", book: "m", ready: "m", cast: "m", attack: "walk into it", target: "Tab", grab: "g", down: ">", up: "<", drink: "q", rest: "R", eat: "E", fuel: "F", lore: "the Lore tab", help: "?" },
  roguelike: { move: "h j k l (y u b n diagonally)", char: "C", pack: "i", book: "m", ready: "m", cast: "m", attack: "walk into it", target: "Tab", grab: "g", down: ">", up: "<", drink: "q", rest: "R", eat: "E", fuel: "F", lore: "the Lore tab", help: "?" }
};
const tutKey = (ks, a) => (TUT_KEYS[ks] || TUT_KEYS.modern)[a];
const kb = (ks, a) => { const k = tutKey(ks, a); return /^(the |walk )/.test(k) ? k : "[" + k + "]"; };   // shown as a key cap in the Next box

// Each step: text(p, ks), done(p, f, d), and optionally only(p) (who it is for), when(p) (shown only while true) and
// goal() (where the marker points). f: the step flags set by tutNote; d: the current depth.
const TUT_STEPS = [
  { id: "hurt", optional: true, when: p => p.hp < p.mhp * 0.6, text: (p, ks) => depth ? `You are hurt. Press ${kb(ks, "drink")} to drink a healing potion. You can only rest in town: climb back up and press ${kb(ks, "rest")} there.` : `You are hurt. Press ${kb(ks, "rest")} to rest here in town until you are healed.`, done: () => false },
  { id: "look", text: (p, ks) => `First, look at yourself. ${kb(ks, "char")} shows what you wear, and ${kb(ks, "pack")} what you carry.`, done: (p, f) => f.char && f.pack },
  { id: "shop", text: (p, ks) => `Visit the General Store, door 1: walk into it and press [Enter] on a flask of oil or a spare torch to buy it. The Armoury (2) and Weaponsmith (3) sell better gear when you have the gold.`,
    done: (p, f) => f.bought, goal: () => depth === 0 && L.shops ? L.shops[0].door : null },
  { id: "spell", only: p => !!CLASS[p.cls].realm, text: (p, ks) => { const S = SPELL[p.spells[0]], what = CLASS[p.cls].realm === "holy" ? "prayer" : "spell";
      return S ? (ks === "modern" ? `You know the ${what} ${S.name}: ${S.desc}. ${kb(ks, "ready")} chooses which ${what} is ready, and ${kb(ks, "cast")} casts it${S.aim ? " at your target" : ""}.` : `You know the ${what} ${S.name}: ${S.desc}. Press ${kb(ks, "cast")} to cast from your book.`)
        : `You will learn your first ${what} at level ${spellLevel(firstSpell(CLASS[p.cls]), CLASS[p.cls])}. Open the book tab (B) to see what is coming.`; },
    done: (p, f) => f.readied || f.cast || !p.spells.length },
  { id: "stairs", text: (p, ks) => `Now find the stairs down; the marker shows the way. Move with ${kb(ks, "move")}, stand on the stairs and press ${kb(ks, "down")}.`,
    done: (p, f, d) => d > 0 || p.maxDepth > 0, goal: () => depth === 0 ? L.spot() : null },
  { id: "rat", text: (p, ks) => { const C = p.cls;
      const how = C === "wayfinder" ? `Press ${kb(ks, "attack")} to shoot it with your sling from where you stand.` : C === "delver" ? `Creep up while it sleeps: a Delver strikes a sleeping foe twice as hard. Walk into it.`
        : p.spells.some(id => SPELL[id].aim) && ks === "modern" ? `Press ${kb(ks, "cast")} to cast ${SPELL[p.spells.find(id => SPELL[id].aim)].name} at it, or walk into it to fight.` : `Walk into it to fight${ks === "modern" ? `, or press ${kb(ks, "attack")}` : ""}.`;
      return `A cave rat sleeps in this room. ${kb(ks, "target")} targets it. ${how}`; },
    done: (p, f) => f.killed, goal: () => { const m = mons.find(m => m.tutorial); return m ? idx(m.x, m.y) : null; } },
  { id: "shrine", text: (p, ks) => `A cold shrine lamp stands in this room: the rings of the Lampway hold the dark down only while their shrines burn. Walk into it and pour in the flask of oil I gave you. Every shrine you light makes its ring brighter.`,
    done: (p, f) => f.relit || p.maxDepth >= 2, goal: () => { if (!depth) return null; let best = null, bd = 99; for (let i = 0; i < MW * MH; i++) if (L.tiles[i] === T.SHRINE && mem[i]){ const k = dist(i % MW, Math.floor(i / MW), player.x, player.y); if (k < bd){ bd = k; best = i; } } return best; } },
  { id: "grab", text: (p, ks) => `Things lie about down here. Stand on one and press ${kb(ks, "grab")} to pick it up; gold you pick up just by walking over it.`,
    done: (p, f, d) => f.picked || p.maxDepth >= 2, goal: () => { let best = null, bd = 99; for (const f of floor) if (f.seen && f.it.k !== "gold"){ const k = dist(f.x, f.y, player.x, player.y); if (k < bd){ bd = k; best = idx(f.x, f.y); } } return best; } },
  { id: "onward", text: (p, ks) => `Your light burns down as you go; ${kb(ks, "fuel")} lights a fresh torch. Go deeper by the stairs down (${kb(ks, "down")}), or climb back to town (${kb(ks, "up")} on the stairs up) to rest and shop.`,
    done: (p, f) => p.maxDepth >= 2 || f.returned, goal: () => { if (depth === 0) return null; let best = null, bd = 99; for (let i = 0; i < MW * MH; i++) if (mem[i] && L.tiles[i] === T.DOWN){ const k = dist(i % MW, Math.floor(i / MW), player.x, player.y); if (k < bd){ bd = k; best = i; } } return best; } }
];
const TUT_WELCOME = "Welcome to Lanternhollow, delver. I am Sister Ilvane, keeper of the Eternal Lamp. The dungeon under this town is a cage of light, and it is failing: something below is eating the lamps. Go down, bring back what you can, and come back alive. Let me walk you through your first trip.";
const TUT_FAREWELL = "You are on your own now, delver. Morrowgloom waits at 2,500 ft, and the deep gets darker every year. The Lore tab keeps what you learn, and ? shows every key. Keep it lit.";

const guidanceOn = () => store.get("guidance", "1") === "1";
const tutActive = () => !!(player && player.tut && !player.tut.finished && guidanceOn() && state === "play");
function tutNote(flag){ if (player && player.tut) player.tut.flags[flag] = true; }
// The step to show now: a hurt warning first, then the first step not yet done.
function tutStep(){
  if (!tutActive()) return null;
  const p = player, t = p.tut;
  for (const S of TUT_STEPS){
    if (S.only && !S.only(p)) continue;
    if (S.optional){ if (S.when(p)) return S; continue; }
    if (t.done[S.id]) continue;
    if (S.done(p, t.flags, depth)){ t.done[S.id] = true; sfx("found"); continue; }
    return S;
  }
  return null;
}
// Called whenever the HUD is drawn: finishes the charge when every step is done.
function tutCheck(){
  if (!tutActive() || dlg) return;
  if (!tutStep()){ player.tut.finished = true; store.set("tutorialSeen", "1"); say("Sister Ilvane's charge is done."); noteDialog("Sister Ilvane", TUT_FAREWELL); }
}
function tutGoal(){ const S = tutStep(); const g = S && S.goal ? S.goal() : null; return g === null || g === undefined || g < 0 ? null : g; }
// A new character's first game: start the charge, unless it was skipped or finished before in this browser.
function tutBegin(){
  if (store.get("tutorialSeen") === "1" || !guidanceOn()) return;
  player.tut = { flags: {}, done: {}, ratDone: false, finished: false };
  openDialog({ title: "Sister Ilvane", head: `<p class="lore">${esc(TUT_WELCOME)}</p>`, side: false, onBack: tutSkip,
    cols: [[{ label: "Begin", select: () => { closeDialog(); carry(plainItem("oil")); say("Sister Ilvane gives you a flask of oil. \"For the shrines below. You'll see.\""); } }, { label: "Skip: I know how to play", select: tutSkip }]], note: "Esc skips · the menu's Guidance option turns it back on" });
}
function tutSkip(){ if (player) player.tut = null; store.set("tutorialSeen", "1"); closeDialog(); msgs = []; say("Good luck down there, delver."); }
// The menu's Guidance option: off hides the charge and the hints; on brings them back (and the charge, if this
// character never had one or finished it, starting from what is not done yet).
function setGuidance(on){
  store.set("guidance", on ? "1" : "0");
  if (on && player && state === "play" && (!player.tut || player.tut.finished)) player.tut = { flags: {}, done: {}, ratDone: true, finished: false };
  refreshUI();
}
// The first trip down: the first room is lit, and a lone cave rat sleeps a few steps from you.
function tutFirstRoom(){
  if (!player.tut || player.tut.ratDone || !guidanceOn()) return;
  player.tut.ratDone = true;
  const here = idx(player.x, player.y), id = L.room[here];
  for (const m of [...mons]) if (m.K && dist(m.x, m.y, player.x, player.y) < 14) mons.splice(mons.indexOf(m), 1);   // nothing else nearby on the first fight
  if (id >= 0) lightCells([...L.room.keys()].filter(i => L.room[i] === id));
  for (let r = 3; r <= 6; r++) for (let tries = 0; tries < 40; tries++){
    const x = player.x + rng.range(-r, r), y = player.y + rng.range(-r, r), i = idx(x, y);
    if (L.tiles[i] !== T.FLOOR || monAt(x, y) || dist(x, y, player.x, player.y) < 3 || (id >= 0 && L.room[i] !== id)) continue;
    const m = newMon(MON.rat, x, y, 400); m.tutorial = true;
    // and a cold shrine to light: in the same room if there is room for it, or else on open floor close by
    const ok = j => L.tiles[j] === T.FLOOR && !monAt(j % MW, Math.floor(j / MW)) && dist(j % MW, Math.floor(j / MW), player.x, player.y) >= 2 && [1, -1, MW, -MW, MW + 1, MW - 1, -MW + 1, -MW - 1].every(d => L.tiles[j + d] === T.FLOOR);
    const near = [...L.tiles.keys()].filter(j => ok(j) && dist(j % MW, Math.floor(j / MW), player.x, player.y) <= 16).sort((a, b) => (L.room[b] === id) - (L.room[a] === id) || dist(a % MW, Math.floor(a / MW), player.x, player.y) - dist(b % MW, Math.floor(b / MW), player.x, player.y));
    if (near.length){ L.tiles[near[0]] = T.SHRINE; mem[near[0]] = 1; }
    updateSight(); return;
  }
}
// The short hint that stays after the charge: the one key that matters right now, if any.
function hintText(){
  if (!guidanceOn() || state !== "play" || aiming || !player || tutStep()) return "";
  const p = player, ks = keySet, t = L.tiles[idx(p.x, p.y)], lt = p.eq.light;
  if (p.hp < p.mhp * 0.5 && bestPotion()) return `${kb(ks, "drink")} drink a healing potion`;
  if (lt && lt.fuel !== undefined && lt.fuel < 500) return `${kb(ks, "fuel")} fresh light`;
  if (p.food < 2000 && p.inv.some(it => ITEM[it.k].cat === "food")) return `${kb(ks, "eat")} eat`;
  for (const k of [1, 2, 3, 4, 6, 7, 8, 9]){ const [dx, dy] = DIRS[k], i = idx(p.x + dx, p.y + dy); if (L.trap[i] && L.trapSeen[i]) return "walk into the trap to disarm it"; }
  if (t === T.DOWN || t === T.UP) return `${kb(ks, t === T.DOWN ? "down" : "up")} take the stairs`;
  if (itemsAt(p.x, p.y).length) return `${kb(ks, "grab")} pick up`;
  if (mons.some(m => m.K && seesMon(m) && !m.K.town)) return `${ks === "modern" ? kb(ks, "attack") + " attack" : "walk into it to attack"} · ${kb(ks, "target")} target`;
  return "";
}
