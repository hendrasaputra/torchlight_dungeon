# The lore of Torchlight

A rough first draft of the world behind Torchlight Dungeons: its beginning, its history, the peoples and callings,
the dungeon and how it came to be, what lives in it, and the things of power found there. Everything here is meant
to be argued with, cut and rewritten. Names that already exist in the game are used as they are, so the lore can
flow back into item and monster descriptions, level feelings, book titles and the help pages.

## The files

| File | What it covers |
|---|---|
| [01-cosmology.md](01-cosmology.md) | The Gloam, the First Fire, Morrowgloom, and why there are two kinds of magic |
| [02-timeline.md](02-timeline.md) | From before the Kindling to the present year, 1207 of the Hollow |
| [03-world.md](03-world.md) | The lands above: Lanternhollow, the Hollowmark and its neighbours |
| [04-the-lampway.md](04-the-lampway.md) | How the dungeon was built, its five rings, the mines, and the legends of what is down there |
| [05-peoples.md](05-peoples.md) | The eight peoples and how each is bound to the light and the deep |
| [06-callings.md](06-callings.md) | The six callings and the orders behind them |
| [07-rulers-and-heroes.md](07-rulers-and-heroes.md) | The Lamp Kings, the Keepers, and the heroes of song |
| [08-bestiary.md](08-bestiary.md) | A repository of every monster family, the named uniques, and the Lantern-Eater |
| [09-magic-and-artifacts.md](09-magic-and-artifacts.md) | The two realms, the spell books, flavours, special kinds and the six artifacts |
| [10-illustrations.md](10-illustrations.md) | A list of 147 illustrations (monsters, peoples, items, places, maps, emblems) with prompts in four styles and rules that keep them consistent |

## The web pages

`node lore/build.js` (also run by `./build.sh`) turns these files into the pages at
[dungeon.hensap.id/lore](https://dungeon.hensap.id/lore/). Edit the Markdown, never the `.html`. Put each finished
illustration in `art/` under its name from [10-illustrations.md](10-illustrations.md) and rebuild: the build makes a
900 px web copy in `art/web/` and the page shows it in place of the placeholder.

## Ground rules for the lore

- **All of it is original.** As with the game (see "Licence" in [TORCHLIGHT_PLAN.md](../TORCHLIGHT_PLAN.md)),
  nothing comes from Moria, Umoria or Tolkien: no names, places, creatures or plots. In particular, the dungeon is
  *not* a mine whose diggers went too deep and woke an ancient fire-demon. Here the dark was already down there,
  and the dungeon was built to hold it.
- **The game is canon first.** If the lore and the game disagree, the game wins until someone changes the game.
  Depths are given in feet, as the game shows them (one level is 50 ft).
- **One theme ties it together: light is borrowed.** All light in the world is carried from one first flame, and
  everything that lives in the dark either hungers for it, hides from it, or guards it.
- **Leave room.** A legend can be wrong. Where sources disagree, say so; that is what keeps a world feeling old.

## Words used throughout

| Word | Meaning |
|---|---|
| **Torchlight** | The world's old name: "the lit world", the land the first torch was carried across. Scholars write it as one word; common folk just say "the world". |
| **The Gloam** | The lightless sea that was everything before the First Fire. It is not evil, only hungry. |
| **The First Fire** | The flame that kindled the world. Every light since, from a star to a tallow candle, is a spark carried from it. |
| **Morrowgloom** | The last deep pool of the Gloam, sunk beneath the world. "The Lantern-Eater." It eats light, and each light it eats is a morning that never comes. |
| **The Lampway** | The dungeon: a stair of lamp-rings built downward, ring under ring, to keep Morrowgloom sunk. Miners call its upper part "the Hollow"; adventurers call all of it "the Deep". |
| **Lamp-ring** | One level of the Lampway's design: a circuit of shrines whose lamps, lit together, hold the dark below them. |
| **Glow crystal** | Lamplight that has burned so long in one place it has set into stone. The reason anyone mined the Lampway at all. |
| **Keeper** | A priest of the Order of the Lamp, sworn to keep the rings lit. Today's Lampwardens descend from them. |
| **YH** | Years of the Hollow, counted from the founding of Lanternhollow. Older dates are BH, before the Hollow. The present year is 1207 YH. |

## Open questions

These are choices the draft leaves open. Answer them and the other files can be made to agree.

1. **Does Morrowgloom think?** The draft leaves it unclear: a hunger with a will, or a will that is only hunger.
2. **What happens after the boss?** The game goes on below 2,500 ft. Is that the open Gloam, another ring the
   Keepers never finished, or something else again?
3. **Who was the First Keeper before she was a saint?** The draft gives her a name and a deed and little else.
4. **Is the Lantern of the First Keeper the very first lamp?** Song says yes; the Keepers' own records say no.
5. **How much of this should players see in the game?** Possible places: item and monster descriptions, level
   feelings, the help page, a "Lore" tab in the Journal, and books found in the dungeon.
