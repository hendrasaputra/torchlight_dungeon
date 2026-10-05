/* ---------- Torchlight Dungeons: the rings of light (phase 13) ---------- */
// The Lampway is a cage of light, and each ring's light (0 to 100) is how well it still holds. Levels are not kept,
// so the light belongs to the ring and is saved with the character (player.rings). Relighting a dark shrine raises
// it; taking a shrine's flame or digging out a glow crystal lowers it; Morrowgloom's hunger drains it slowly. The
// town feels it first; the world goes dark if the Last Lamp is lost. All numbers are starting points for tuning.
// Plain rules, no game state: tests/torch.js checks them.

const CAGE_RINGS = ["stone", "roots", "rest", "forges", "glass"];   // the five rings that hold the cage
const RING_START = { stone: 85, roots: 78, rest: 72, forges: 66, glass: 60, unlit: 0 };   // a thousand years of neglect and the Glow Rush
const RELIGHT = 3, TAKE_FLAME = 2, DIG_CRYSTAL = 1, DRAIN_EVERY = 5000;
const newRings = () => ({ ...RING_START });
// Which ring's light a depth belongs to: the Pit is the bottom of the Ring of Glass, everything below is the Unlit
// Ring, and the town, which stands right on the Ring of Stone, counts as that ring (a bot once hit a ring lookup in
// town that could not be reproduced; this keeps such a path from crashing).
const ringKey = d => d >= 51 ? "unlit" : d >= 50 ? "glass" : d < 1 ? "stone" : ringOf(d).id;
const ringName = k => RINGS.find(R => R.id === k).name;
const cageLight = rings => CAGE_RINGS.reduce((s, k) => s + rings[k], 0);
const START_LIGHT = cageLight(RING_START);
// Relighting a shrine: a dark ring (below 10) takes half as much from each, until a few are burning again.
function relightRing(rings, k){ const gain = rings[k] < 10 ? RELIGHT / 2 : RELIGHT; rings[k] = Math.min(100, rings[k] + gain); return gain; }
function dimRing(rings, k, n){ rings[k] = Math.max(0, rings[k] - n); }
// Morrowgloom's hunger, every DRAIN_EVERY turns: a little from each ring, twice as much from the dim ones. On its own
// it never takes a ring below DRAIN_FLOOR: only greed and the dark's servants can put a ring out.
const DRAIN_FLOOR = 10;
function drainRings(rings){ for (const k of [...CAGE_RINGS, "unlit"]) if (rings[k] > DRAIN_FLOOR) rings[k] = Math.max(DRAIN_FLOOR, rings[k] - (rings[k] < 30 ? 2 : 1)); }
// How dark the town has gone: 0 as it was, 1 when the cage has lost about 5% of its light (the lamps fail at night),
// 2 at about 10% (shops shutter after dark, and two keepers leave).
function townShade(rings){ const lost = (START_LIGHT - cageLight(rings)) / START_LIGHT; return lost >= 0.10 ? 2 : lost >= 0.05 ? 1 : 0; }
// The world goes dark if the Last Lamp is lost, or if the Ring of Glass goes dark with no Unlit Ring below to hold.
const worldDark = (rings, lastLamp) => !lastLamp || (rings.glass <= 0 && rings.unlit <= 0);
// The champion's ending: every ring, the Unlit Ring too, at full light, around a burning Last Lamp.
const cageFinished = (rings, lastLamp) => lastLamp && [...CAGE_RINGS, "unlit"].every(k => rings[k] >= 100);
// Morrowgloom's strength: about as now with the rings as they start, weaker when they are bright, far stronger dark.
const bossFactor = rings => 0.6 + 1.4 * (1 - cageLight(rings) / (100 * CAGE_RINGS.length));
// What a carried flame fetches from the Lantern Guild: more the deeper its ring.
const flamePrice = k => 300 * (CAGE_RINGS.indexOf(k) + 1 || 6);
