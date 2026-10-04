# Torchlight Dungeons

A turn-based dungeon crawl after Moria (Robert Koeneke, 1983), for the web. You carry a torch down into an endless
dungeon below the town of Lanternhollow: everything is drawn in code-made pixel art, lit only by what your light,
the lit rooms and glowing things reach. All of the game's content is original.

- 8 peoples and 6 callings, rolled or point-bought stats, 8 skills, 40 character levels.
- About 200 kinds of item, with flavours to identify, special kinds and artifacts; 12 equipment slots shown on a
  paper-doll hero.
- 60 spells and prayers in two realms; a town with six shops, day and night.
- 267 kinds of monster in 50 families, 25 named uniques, and a final boss at 2,500 ft; monster recall.
- A character panel, item cards, a hotbar, a minimap. Keyboard only.

The plan, its phases and its ground rules are in [TORCHLIGHT_PLAN.md](TORCHLIGHT_PLAN.md). It started as a
cartridge in the [ASCII BaseCommander](https://github.com/hendrasaputra/asciibasecommander) arcade and moved
here after phase 7; see [HANDOFF.md](HANDOFF.md).

## Playing

Open `index.html` in a browser, or serve the folder (`python3 -m http.server 8766`). It needs nothing else.

| Key | Does |
|---|---|
| Arrow keys | Move; into a monster attacks it, into a door opens it. Two arrows together move diagonally (or the numpad, Home, End, PgUp, PgDn). Shift runs. |
| A, S, D, W | Attack the target (or shoot or throw), cast the readied spell, drink the best-fitting healing potion, grab (pick up, stairs, shop) |
| Q, E, R, F | Ready the next spell, eat, rest, refill your light |
| Tab, Space, 1 to 0 | Next target, wait a turn, hotbar |
| I, C, B, J, M, P | Pack, Character, spell Book, Journal, Map; P shows or hides the panel |
| L, ?, Esc | Look, keys, menu |

Moria's own letter keys and the roguelike set are in the menu (Keys), as is Detail (smaller sprites, more map).

## Working on it

- `./build.sh` joins `src/` into `index.html`. Edit `src/`, then build.
- `node tests/torch.js` checks the rules and data; `node tests/balance.js` (add `-v` for detail) fights every
  monster with every class at the level you would expect at its depth.
- `src/`, by job:
  - **Rules and data:** `rng.js` random numbers; `fov.js` sight and light; `turn.js` the speed scheduler; `gen.js` levels and the town; `data.js` townsfolk; `bestiary.js` the dungeon's monsters and combat numbers; `items.js` items, flavours and names; `shops.js` shops and prices; `chars.js` peoples, callings, stats and skills; `spells.js` magic.
  - **The game:** `game.js` the rules of play and the keys.
  - **The look:** `sprites.js` tiles, figures and icons, drawn by code; `render.js` the map, light, animation and debris; `ui.js` the HTML HUD, panel, dialogs and screens; `head.html` the page markup and styles.
  - **Helpers:** `lib.js` preferences, high scores, resizing and the frame loop.
- `cartridges/` holds the cover art and its prompt.

Everything is saved in the browser's localStorage under `torchlightDungeons.v1.` (keys, panel, detail, high
scores and monster recall). Nothing is sent anywhere. There are no save games yet: that is phase 9.

## Licence

MIT; see [LICENSE](LICENSE).
