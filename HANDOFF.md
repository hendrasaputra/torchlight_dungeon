# Handoff

Where Torchlight Dungeons stands, and how to pick it up.

## Where it came from

Phases 0 to 7 were built as a cartridge of the ASCII BaseCommander arcade (`~/Downloads/ASCII_BaseCommander`,
github.com/hendrasaputra/asciibasecommander, served at games.hendrasaputra.com). In October 2026 it moved here
to get its own domain. The history was carried over with `git filter-branch`: the 11 commits that touched the
game's files, rewritten to hold only those files. Commit messages still mention the other cartridges they changed.
The carve-out commit then made it stand alone:

- `src/torch/*` moved to `src/`, and the built page is `index.html` instead of `torchlight-dungeons.html`.
- `src/lib.js` holds the only arcade helpers the game used (`prefs`, `scoreTable`, `onResize`, `startLoop`), copied
  unchanged from the arcade's `src/arcade.js`. `core.js`, `menu.js` and the gamepad styles are no longer needed.
- Detail, which came from the arcade's shared Settings page, is now a row in the game's menu (saved as `detail`).
  The menu's "Display settings" and "Back to cartridges" rows, and the header's link to the shelf, are gone.
- The page's base styles (from the arcade's `pad.css`) are inlined in `src/head.html`.
- A new torch favicon; the cover art prompt is in `cartridges/PROMPT.md`.

Still to decide or do (not done here):

- **Remote and domain.** `origin` is github.com/hendrasaputra/torchlight_dungeon (private; its only commit was a
  LICENSE identical to ours). The domain is dungeon.hensap.id (DNS at Hostinger); `CNAME` holds it. Still to do:
  push, and turn on GitHub Pages from `main` (the page is `index.html`).
- **Saved data does not carry over.** localStorage belongs to a domain, so players' keys, high scores and monster
  recall from games.hendrasaputra.com will not appear on the new domain. The keys keep the same names.
- **The cover art** shows the old ASCII look; the game is pixel art since phase 6.

## State of the game

Phases 0 to 8 of [TORCHLIGHT_PLAN.md](TORCHLIGHT_PLAN.md) are done; its Progress table says what each phase built
and what it left out. Next is **phase 9, save games** (levels now also hold `lock`, `trap` and `trapSeen` arrays to
save), then phase 10 (sound, help, options and polish).

Known gaps and bugs:

- Plurals of names already ending in "s" are wrong: "2 Sandalses", "3 Hymnses" (`plural()` in `src/items.js`).
- Prices are fixed (no haggling) and there is no home to store things in.
- No save games (phase 9) and no sound (phase 10).
- Monsters do not fight each other. Monster recall is kept across characters in localStorage.
- No person has yet played a full game to the boss. The bots die at 200 to 450 ft without cheating, and
  `tests/balance.js` rates every depth band as winnable, but that is expected values, not play.

## How to work on it

- Build with `./build.sh`; never edit `index.html` by hand.
- Before calling a change done: `node tests/torch.js`, `node tests/balance.js`, and a look in a browser.
- `.claude/launch.json` has a static server on port 8766 (`python3 -m http.server 8766`).
- Everything in the page is a top-level global, so a browser console (or a test script) can drive the game
  directly: `startCreate(); cr.race = 0; cr.cls = 1; begin(); newLevel(10);`, then call `act(() => tryMove(1, 0))`,
  `attackKey()`, `spellKey()`, `drinkKey()`, `grabKey()`, `openTab("pack")`, `itemDialog(player.inv[0])` and so on,
  and `drawWorld(performance.now(), 0.05); drawUI(1)` to draw a frame. The phase 6 and 7 checks were bots built
  this way: thousands of random actions across many levels, watching for thrown errors.
- A browser tab that is in the background may not repaint, so a screenshot can show an old frame. Take another
  after a second.
- Test runs in a browser write monster recall to localStorage; remove `torchlightDungeons.v1.lore` afterwards.
- Ground rules: keyboard only; one self-contained page; all content original (see "Licence" in the plan); commit
  or push only when asked, with no attribution lines.
