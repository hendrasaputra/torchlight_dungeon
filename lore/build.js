// Builds the lore's web pages (lore/*.html) from the lore's Markdown, in the look of an old fantasy rulebook.
// Run: node lore/build.js (./build.sh runs it too). The Markdown stays the source; never edit the .html by hand.
// Illustrations: each slot in ART below shows lore/art/<file> if it exists, or a framed placeholder with the
// picture's description from 10-illustrations.md. Add an image and rebuild, and it appears.
// Named monsters get a stat block made from the game's own data (src/bestiary.js).
const fs = require("fs"), path = require("path"), vm = require("vm");
const HERE = __dirname, ROOT = path.join(HERE, ".."), REPO = "https://github.com/hendrasaputra/torchlight_dungeon/blob/main/";
const G = vm.runInNewContext(["data.js", "bestiary.js"].map(f => fs.readFileSync(path.join(ROOT, "src", f), "utf8")).join("\n") + ";({ MONSTERS })");

/* ---------- the illustrations: what each one shows, and where it goes ---------- */
// From 10-illustrations.md: each table row is | `file` | subject |; a section's heading gives its style and shape,
// and a subject may start with **Style X.** or **Style X, 16:9.** to override them.
const PICS = {};
{
  let style = "A", shape = "2/3";
  for (const line of fs.readFileSync(path.join(HERE, "10-illustrations.md"), "utf8").split("\n")){
    const h = /^## \d+\..*\(style (\w)[^)]*?(2:3|1:1|16:9|square|portraits)?/i.exec(line);
    if (h){ style = h[1]; shape = /16:9/.test(line) ? "16/9" : /1:1|square/i.test(line) ? "1/1" : "2/3"; continue; }
    const r = /^\| `([^`]+)` \| (.*) \|$/.exec(line); if (!r) continue;
    let subject = r[2], s = style, sh = shape;
    const o = /^\*\*Style (\w)(, (16:9|1:1|2:3))?\.\*\* /.exec(subject);
    if (o){ s = o[1]; if (o[3]) sh = o[3].replace(":", "/"); subject = subject.slice(o[0].length); }
    PICS[r[1]] = { subject: subject.replace(/\*\*/g, ""), style: s, shape: sh };
  }
}
// Page => { heading text it starts with (or "top"): [files] }. A file may appear on more than one page.
const ART = {
  "01-cosmology": { top: ["place-the-kindling.png"], "Morrowgloom, the Lantern-Eater": ["boss-morrowgloom.png"], "The First Lamp": ["item-first-lamp.png"], "The two lights": ["item-spellbooks.png"] },
  "02-timeline": { top: ["moment-the-guttering.png"], "The Founding": ["moment-sealing.png"], "The Long Dusk": ["moment-the-wager.png"], "The Years of the Hollow": ["moment-open-doors.png"] },
  index: { top: ["opener-contents.png"] },
  "03-world": { top: ["place-lanternhollow.png"], "The Hollowmark": ["map-hollowmark.png", "emblem-lanternhollow.png"],
    "Lanternhollow": ["map-lanternhollow.png", "keeper-odda.png", "keeper-bram.png", "keeper-kessa.png", "keeper-ilvane.png", "keeper-thorne.png", "keeper-maelis.png", "item-eternal-lamp.png"],
    "The ruins of Aurenhold": ["place-hollow-gate.png", "emblem-aurenhold.png"] },
  "04-the-lampway": { top: ["place-hollow-gate.png"], "What it was for": ["diagram-lampway.png"], "How it was built": ["diagram-lamp-ring.png"], "The mines": ["item-glow-crystal.png"], "The Ring of Stone": ["place-ring-of-stone.png"], "The Ring of Roots": ["place-ring-of-roots.png"],
    "The Ring of Rest": ["place-ring-of-rest.png"], "The Ring of Forges": ["place-ring-of-forges.png"], "The Ring of Glass": ["place-ring-of-glass.png"], "The Pit of the Gloam": ["boss-morrowgloom.png"],
    "The Unlit Ring": ["place-unlit-ring.png", "item-last-lamp.png"], "The Elder Ring": ["place-elder-ring.png"] },
  "05-peoples": { top: ["opener-peoples.png", "emblem-deephall.png", "emblem-lantern-guild.png"], Humans: ["people-human.png"], Sylvan: ["people-sylvan.png"], Stonekin: ["people-stonekin.png"], Burrowfolk: ["people-burrowfolk.png"], Tinkerlings: ["people-tinkerling.png"],
    Ashborn: ["people-ashborn.png"], Marrowkin: ["people-marrowkin.png"], Cragborn: ["people-cragborn.png"] },
  "06-callings": { top: ["opener-callings.png", "emblem-free-companies.png", "emblem-collegium.png", "emblem-order-of-the-lamp.png", "emblem-quiet-hand.png", "emblem-wardens-of-roads.png", "emblem-oath.png"], Sellsword: ["calling-sellsword.png"], Arcanist: ["calling-arcanist.png"], Lampwarden: ["calling-lampwarden.png"], Delver: ["calling-delver.png"], Wayfinder: ["calling-wayfinder.png"], Oathknight: ["calling-oathknight.png"] },
  "07-rulers-and-heroes": { top: ["opener-rulers.png"], "The First Keeper": ["hero-caedra.png", "moment-sealing.png"],
    "The Lamp Kings": ["king-aldren.png", "king-tamsin.png", "king-ysmer.png", "item-crown.png", "family-tomb-kings.png"], "The founders": ["hero-marla.png"],
    "Heroes of song": ["hero-ithrel.png", "hero-orsolya.png", "hero-gorran.png", "hero-quill.png", "hero-wren.png"] },
  "08-bestiary": { top: ["opener-bestiary.png"], "The families": ["family-rodent.png", "family-bat.png", "family-insect.png", "family-spider.png", "family-beetle.png", "family-worm.png", "family-mould.png", "family-jelly.png", "family-snake.png", "family-canine.png", "family-feline.png", "family-beast.png", "family-bird.png", "family-goblin.png", "family-brigand.png", "family-thief.png", "family-mage.png", "family-priest.png", "family-ogre.png", "family-troll.png", "family-skeleton.png", "family-zombie.png", "family-ghost.png", "family-vampire.png", "family-lich.png", "family-elemental.png", "family-vortex.png", "family-eye.png", "family-plant.png", "family-arachnid.png", "family-reptile.png", "family-horror.png", "family-golem.png", "family-fiend.png", "family-drake.png", "family-dragon.png", "family-deadhound.png", "family-were.png", "family-sporefolk.png", "family-kobolds.png", "family-shades.png", "family-lantern-eater.png", "family-tomb-kings.png", "family-gargoyles.png", "family-scalekin.png", "family-mimics.png",
      "family-hybrids.png", "family-star-wisps.png", "family-deep-giants.png"],
    "Old Whiskers": ["unique-old-whiskers.png"], "Fenwick": ["unique-fenwick.png"], "Snag": ["unique-snag.png"], "Old Tusk": ["unique-old-tusk.png"], "Mother Bristle": ["unique-mother-bristle.png"],
    "Varn": ["unique-varn.png"], "The Lantern Thief": ["unique-lantern-thief.png"], "Corvane": ["unique-corvane.png"], "Sister Vesper": ["unique-vesper.png"], "Kettlemaw": ["unique-kettlemaw.png"],
    "Hollow Jack": ["unique-hollow-jack.png"], "Grimsby": ["unique-grimsby.png"], "Brakka": ["unique-brakka.png"], "Ysolde": ["unique-ysolde.png"], "The Maul-Wyrm": ["unique-maul-wyrm.png"],
    "The Grey Widow": ["unique-grey-widow.png"], "Thessaly": ["unique-thessaly-glass.png"], "Ironjaw": ["unique-ironjaw.png"], "The Pale Bride": ["unique-pale-bride.png"],
    "The Drowned King": ["unique-drowned-king.png"], "Rimeheart": ["unique-rimeheart.png"], "The Many-Mouthed": ["unique-many-mouthed.png"], "Skarth": ["unique-skarth.png"],
    "The Ember Queen": ["unique-ember-queen.png"], "Duke Ashvane": ["unique-ashvane.png"], "Morrowgloom": ["boss-morrowgloom.png"] },
  "09-magic-and-artifacts": { top: ["opener-magic.png"], "The arcane books": ["item-spellbooks.png"], Devices: ["item-glow-crystal.png"], Embersong: ["item-embersong.png"], "The Mantle": ["item-mantle.png"],
    "The Stonehelm": ["item-stonehelm.png"], "The Lantern of the First Keeper": ["item-first-lantern.png"], Starfall: ["item-starfall.png"], "The Band of Swift Feet": ["item-swift-band.png"] }
};
const unplaced = Object.keys(PICS).filter(f => !Object.values(ART).some(p => Object.values(p).flat().includes(f)));
if (unplaced.length) console.warn("lore: illustrations with no place on any page: " + unplaced.join(", "));
const missing = Object.values(ART).flatMap(p => Object.values(p).flat()).filter(f => !PICS[f]);
if (missing.length){ console.error("lore: these slots are not in 10-illustrations.md: " + [...new Set(missing)].join(", ")); process.exit(1); }

// The pages use a web copy of each picture (900 px wide JPEG in art/web/), made with macOS's sips when the original
// is newer than its copy, so a 3 MB original never goes to the browser.
const { execFileSync } = require("child_process");
function webCopy(file){
  const src = path.join(HERE, "art", file), out = path.join(HERE, "art", "web", file.replace(/\.\w+$/, ".jpg"));
  if (!fs.existsSync(src)) return null;
  if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs){
    fs.mkdirSync(path.dirname(out), { recursive: true });
    try { execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "80", "-Z", "900", src, "--out", out], { stdio: "ignore" }); }
    catch (e){ console.error("lore: could not make a web copy of art/" + file + " (sips is macOS only): " + e.message); process.exit(1); }
  }
  return "art/web/" + path.basename(out);
}
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function figure(file){
  const P = PICS[file], wide = P.shape === "16/9", img = webCopy(file);
  return `<figure class="art ${wide ? "wide" : ""} style-${P.style}" style="--ratio:${P.shape}">` + (img ? `<img src="${img}" alt="${esc(P.subject)}" loading="lazy">`
    : `<div class="slot"><b>Illustration to come</b><span>${esc(P.subject)}</span><small>art/${file} · style ${P.style}</small></div>`) + `</figure>`;
}

/* ---------- stat blocks for the named monsters ---------- */
const BLOW = { poison: "poison", confuse: "confuses", blind: "blinds", paralyze: "paralyses", terrify: "terrifies", fire: "fire", cold: "cold", elec: "lightning", acid: "acid", dark: "darkness",
  light: "light", steal: "steals gold", stealItem: "steals an item", drainExp: "drains experience", drainCharges: "drains wands", eatFood: "eats food", eatLight: "eats light" };
const SPELL = s => { const [k, a] = s.split(":"); return { blink: "blink", tport: "teleport", teleTo: "teleport you to it", heal: "heal itself", haste: "haste itself", blind: "blind",
  confuse: "confuse", scare: "terrify", slow: "slow", paralyze: "paralyse", darkness: "darkness", drainMana: "drain mana", arrow: "missiles", bolt: "bolt of " + a, ball: "ball of " + a,
  breath: "breathe " + a, summon: "summon " + ({ kin: "kin", undead: "the dead", any: "monsters" }[a]) }[k] || s; };
const avg = d => { const [n, s] = d.split("d").map(Number); return Math.round(n * (s + 1) / 2); };
function statBlock(K){
  const kind = [K.boss ? "final boss" : "unique", K.shape || K.kin, K.undead && "undead", K.evil && "evil", K.animal && "animal"].filter(Boolean).join(", ");
  const speed = K.speed > 0 ? "fast (+" + K.speed + ")" : K.speed < 0 ? "slow (" + K.speed + ")" : "normal";
  const traits = [K.invis && "invisible", K.passWall && "passes through walls", K.killWall && "tunnels through rock", K.regen && "regenerates", K.erratic && "moves erratically",
    K.breed && "breeds", K.pack && "comes with a pack", K.cold && "cold-blooded"].filter(Boolean);
  const row = (k, v) => `<p><b>${k}</b> ${esc(String(v))}</p>`;
  return `<aside class="stat"><h4>${esc(K.name[0].toUpperCase() + K.name.slice(1))}</h4><i>${esc(kind)}</i><hr>
    ${row("Depth", (K.depth * 50).toLocaleString("en") + " ft")}${row("Armour", K.ac)}${row("Hit dice", K.hp + " (about " + avg(K.hp) + ")")}${row("Speed", speed)}<hr>
    ${K.blows.map(([d, v, fx]) => row(v[0].toUpperCase() + v.slice(1) + ".", d + (fx ? ", " + (BLOW[fx] || fx.replace("drain:", "drains ")) : ""))).join("")}
    ${K.spells ? row("Magic.", "One turn in " + K.spells.freq + ": " + K.spells.list.map(SPELL).join(", ") + ".") : ""}
    ${K.res ? row("Resists.", K.res.join(", ") + ".") : ""}${traits.length ? row("Traits.", traits.join(", ") + ".") : ""}${K.dropGood ? row("Treasure.", K.dropGood + (K.dropGood > 1 ? " fine things." : " fine thing.")) : ""}</aside>`;
}
const monsterFor = h => { const name = h.replace(/\s*\([^)]*\)\s*$/, "").toLowerCase(); return G.MONSTERS.find(K => (K.unique || K.boss) && K.name.toLowerCase() === name); };

/* ---------- a small Markdown reader: headings, paragraphs, lists, tables, quotes, rules, and inline marks ---------- */
const link = href => /^https?:/.test(href) ? href : href.startsWith("../") ? REPO + href.slice(3) : href.replace(/\.md(#|$)/, ".html$1").replace(/^README\.html/, "index.html");
const inline = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, "<i>$1</i>")
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, h) => `<a href="${link(h.replace(/&amp;/g, "&"))}">${/^[\w-]+\.md$/.test(t) ? SHORT[t.slice(0, -3)] || "Contents" : t}</a>`);   // a link written as a file name shows the page's name
function render(md, page){
  const lines = md.split("\n"), out = [], art = ART[page] || {}, used = new Set();
  let i = 0, first = true, intro = true, open = false;
  const plates = files => out.push(`<div class="plates n${files.length > 1 ? "many" : 1}">${files.map(figure).join("")}</div>`);
  const placeArt = h => { for (const [k, files] of Object.entries(art)) if (k !== "top" && !used.has(k) && h.startsWith(k)){ used.add(k); plates(files); } };
  while (i < lines.length){
    const l = lines[i];
    if (!l.trim()){ i++; continue; }
    let m;
    if ((m = /^(#{1,3}) (.*)$/.exec(l))){
      const n = m[1].length, text = m[2];
      if (open) out.push("</div>");   // each heading's text is its own short block of two columns, so you never scroll back up to read on
      out.push(`<h${n}>${inline(text)}</h${n}>`, '<div class="flow">'); open = true;
      if (n === 1 && art.top) plates(art.top);
      if (n > 1) placeArt(text);
      if (n === 3 && page === "08-bestiary"){ const K = monsterFor(text); if (K) out.push(statBlock(K)); }
      i++; continue;
    }
    if (/^---+$/.test(l)){ out.push("<hr class=\"rule\">"); i++; continue; }
    if (l.startsWith("|")){
      const rows = []; while (i < lines.length && lines[i].startsWith("|")) rows.push(lines[i++]);
      const cells = r => r.slice(1, -1).split(" | ").map(c => c.trim());
      out.push(`<table><thead><tr>${cells(rows[0]).map(c => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.slice(2).map(r => `<tr>${cells(r).map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    if (l.startsWith(">")){
      const q = []; while (i < lines.length && lines[i].startsWith(">")) q.push(lines[i++].replace(/^> ?/, ""));
      out.push(`<blockquote>${inline(q.join(" "))}</blockquote>`); continue;
    }
    if ((m = /^(- |\d+\. )/.exec(l))){
      const ordered = /\d/.test(m[1]), items = [], nums = [];   // numbered lists keep their written numbers (1, 2, 4, 5)
      while (i < lines.length && (/^(- |\d+\. )/.test(lines[i]) || (/^ {2,}\S/.test(lines[i]) && items.length))){
        if (/^ {2,}\S/.test(lines[i])) items[items.length - 1] += " " + lines[i].trim(); else { nums.push(parseInt(lines[i])); items.push(lines[i].replace(/^(- |\d+\. )/, "")); }
        i++;
      }
      out.push(`<${ordered ? "ol" : "ul"}>${items.map((t, k) => `<li${ordered ? ` value="${nums[k]}"` : ""}>${inline(t)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`); continue;
    }
    const p = []; while (i < lines.length && lines[i].trim() && !/^(#|\||>|- |\d+\. |---)/.test(lines[i])) p.push(lines[i++]);
    const text = p.join(" "), isIntro = intro && /^\*[^*]/.test(text);
    out.push(`<p${isIntro ? ' class="intro"' : first && !isIntro ? ' class="first"' : ""}>${inline(text)}</p>`);
    if (!isIntro) first = false; intro = false;
  }
  if (open) out.push("</div>");
  return out.join("\n");
}

/* ---------- the pages ---------- */
const PAGES = fs.readdirSync(HERE).filter(f => /^\d\d-.*\.md$/.test(f)).sort().map(f => f.slice(0, -3));
const titleOf = md => /^# (.*)$/m.exec(md)[1];
const SHORT = { "01-cosmology": "Cosmology", "02-timeline": "Timeline", "03-world": "The world", "04-the-lampway": "The Lampway", "05-peoples": "Peoples", "06-callings": "Callings",
  "07-rulers-and-heroes": "Rulers & heroes", "08-bestiary": "Bestiary", "09-magic-and-artifacts": "Magic & artifacts", "10-illustrations": "Art list" };
const CSS = fs.readFileSync(path.join(HERE, "lore.css"), "utf8");
function page(name, title, body, prev, next){
  const nav = ["index", ...PAGES].map(p => `<a href="${p}.html"${p === name ? ' aria-current="page"' : ""}>${p === "index" ? "Contents" : SHORT[p] || p}</a>`).join("");
  const back = p => p ? `<a href="${p}.html">‹ ${SHORT[p] || "Contents"}</a>` : "<span></span>", fwd = p => p ? `<a href="${p}.html">${SHORT[p]} ›</a>` : "<span></span>";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · The Lore of Torchlight</title><meta name="color-scheme" content="light">
<meta property="og:image" content="https://dungeon.hensap.id/cartridges/torchlight-dungeons-v2.jpg">
<link rel="icon" href="../favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>${CSS}</style></head>
<body><header><a class="brand" href="index.html">The Lore of Torchlight</a><nav>${nav}</nav><a class="play" href="../">Play the game ›</a></header>
<main class="${name}">${body}</main>
<footer>${back(prev)}<span class="draft">A draft · generated from lore/*.md</span>${fwd(next)}</footer></body></html>
`;
}
const order = ["index", ...PAGES];
for (const [k, name] of order.entries()){
  const md = fs.readFileSync(path.join(HERE, name === "index" ? "README.md" : name + ".md"), "utf8");
  let body = render(md, name);
  if (name === "index") body = `<figure class="cover"><img src="../cartridges/torchlight-dungeons-v2.jpg" alt="An adventurer with a torch in a dungeon, a goblin at the edge of the light"></figure>` + body;
  fs.writeFileSync(path.join(HERE, name + ".html"), page(name, titleOf(md), body, k > 0 ? order[k - 1] : null, order[k + 1]));
}
const art = Object.keys(PICS).filter(f => fs.existsSync(path.join(HERE, "art", f))).length;
console.log(`Built ${order.length} lore pages (${art} of ${Object.keys(PICS).length} illustrations drawn so far)`);
