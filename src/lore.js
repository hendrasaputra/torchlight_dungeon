/* ---------- Torchlight Dungeons: the world's lore in the game (phase 11) ---------- */
// Short versions of the lore in lore/*.md, where the long ones live. Original content, like everything else.
// RINGS: the dungeon's depth bands, which are the rings of the Lampway. LORE_PAGES: the pages of the Lore tab, each
// unlocked when you reach a ring, meet a unique, find an artifact or read a lore book (or from the start). The rest
// are single lines for item cards and monster recall.

const RINGS = [
  { id: "stone", name: "the Ring of Stone", from: 1, to: 9, feel: ["The halls here were cut by Stonekin hands.", "Old mine rails cross the Keepers' flagstones here.", "Somewhere a shrine lamp still burns in these upper halls."] },
  { id: "roots", name: "the Ring of Roots", from: 10, to: 19, feel: ["Roots of the Greenroof hang through the ceiling.", "Water drips on old shrine stones, green with moss.", "You hear the underground river somewhere close."] },
  { id: "rest", name: "the Ring of Rest", from: 20, to: 29, feel: ["Cold lamps sit on stone coffins all around.", "This is the Ring of Rest. The dead keep a poor watch here.", "Somewhere a tomb lamp still burns, and its king lies quiet."] },
  { id: "forges", name: "the Ring of Forges", from: 30, to: 39, feel: ["The air shakes with heat from the deep fires.", "Abandoned Ashborn forges glow on the edge of the magma.", "A hammer rings somewhere, struck by no living hand."] },
  { id: "glass", name: "the Ring of Glass", from: 40, to: 49, feel: ["The crystal walls glow a cold, failing blue.", "Your light shines back at you from the glass, weaker than it should.", "The walls here hold light, and something has been drinking it."] },
  { id: "pit", name: "the Pit of the Gloam", from: 50, to: 50, feel: ["The dark here is thick enough to lean on. Something below it is awake."] },
  { id: "unlit", name: "the Unlit Ring", from: 51, to: 1e9, feel: ["Half-cut tunnels, empty lamp niches: the ring the Keepers never finished.", "Far off, one great light burns alone in the dark.", "Chisel marks two thousand years old, and no lamp to show them."] }
];
const ringOf = d => RINGS.find(R => d >= R.from && d <= R.to);

// Pages: [id, section, title, text]. Sections: world (known from the start), ring, named, artifact, book.
const LORE_PAGES = Object.fromEntries([
  ["world-fire", "world", "The Gloam and the First Fire", "Before the world there was only the Gloam, a still sea with no light in it. Then the First Fire burned and pushed the dark back, and the world formed inside the hollow it made. The Fire burst: its far sparks are the stars, its heavy sparks the deep fires, and one ember fell on the land to be carried by hand. Every light since is a spark of it. That is why the world's old name is Torchlight."],
  ["world-gloom", "world", "Morrowgloom", "The last of the Gloam was trapped under the world when the Fire burst. That pool is Morrowgloom, the Lantern-Eater. It does not think: it is a will that is only hunger for light. Every flame it swallows goes into it and burns on as one of its thousand eyes, and every light it eats is a dawn that will not come."],
  ["world-lampway", "world", "The Lampway", "The dungeon is not a mine. It is the Lampway, a cage of light built downward by Caedra, the First Keeper, and the Order of the Lamp: ring under ring of lamp-shrines, each holding the dark beneath it while its lamps burn. Five rings held Morrowgloom down for a thousand years. Then the kingdom that fed the lamps fell, and the rings began to go dark."],
  ["world-hollow", "world", "Lanternhollow and the Guttering", "Lanternhollow grew up over the Lampway's mouth when miners found glow crystals there: the cage's own lamplight, set into stone. They dug until they broke into the crypts. Now only delvers go down. Since the Guttering of 1204, every torch in town leans towards the Hollow Gate, and the Keepers have called for anyone who can carry a light and a blade."],
  ["ring-stone", "ring", "The Ring of Stone (50 to 450 ft)", "The top ring and the best built: Stonekin halls, pillared shrines and wide stairs, broken through everywhere by the miners' tunnels. Kobolds, goblins, brigands and rats live here, close enough to the surface to rob those going down. The Hall of First Light, where Caedra lit the first ring, has never been found again."],
  ["ring-roots", "ring", "The Ring of Roots (500 to 950 ft)", "Below the worked halls the masons met natural caverns, drowned and dripping, where the roots of the Greenroof reach down through the rock. The Keepers lined them with shrines instead of cutting new halls. Moulds, trolls, harpies and shades live here now, and the underground river runs through it."],
  ["ring-rest", "ring", "The Ring of Rest (1,000 to 1,450 ft)", "The burial ring. The Keepers' dead and every Lamp King of Aurenhold were laid here, each with a lamp, to keep watch even in death. When the lamps failed the dead kept watching and lost their minds. Relight a king's tomb lamp, the Keepers say, and he will rest."],
  ["ring-forges", "ring", "The Ring of Forges (1,500 to 1,950 ft)", "Where the Lampway reaches the deep fires. Under the Pact of the Forge the Ashborn kept these fires burning as a wall of light and forged the Keepers' weapons at the Anvil of the Pact. When they left, the fires ran wild. Fire giants, drakes and golems still working for dead masters live here now."],
  ["ring-glass", "ring", "The Ring of Glass (2,000 to 2,450 ft)", "The last ring, grown rather than dug: crystal walls that hold light, raised by Tinkerling glassmakers and the first Arcanists right over Morrowgloom. Its lamps went out around 960 BH, and Morrowgloom has been drinking the light stored in the walls ever since. What is left glows a cold, failing blue."],
  ["ring-pit", "ring", "The Pit of the Gloam (2,500 ft)", "At the bottom of the Ring of Glass is a hollow that was never lit, because no one was ever meant to enter it. Morrowgloom waits there, with everything it has eaten shining in its thousand eyes."],
  ["ring-unlit", "ring", "The Unlit Ring (below 2,500 ft)", "The sixth ring, begun to close the cage from below and never finished. Its shrines were cut and never lit, and fiends came into the world through it. One great crystal burns here, the Last Lamp, lit by the last Keepers before they left; while it burns, Morrowgloom cannot leave the Pit. Deeper still, the Keepers once saw the glow of an older ring, lit by hands no one knows."],
  ["u-whiskers", "named", "Old Whiskers, King of Rats", "His thimble crown belonged to Marla Tunnick, who founded Lanternhollow; his line has passed it down for a thousand years. Kill him and the rats crown another within a week."],
  ["u-fenwick", "named", "Fenwick Gutterking", "His great-great-grandmother took the east galleries in 412 YH. Fenwick runs them as a toll road and a loan office, and lays traps for anyone who will not pay."],
  ["u-snag", "named", "Snag the Quick", "The three kings he robbed were Fenwick, a goblin warchief and Old Whiskers. The cooks took it worse."],
  ["u-oldtusk", "named", "Old Tusk", "Lost his eye to Kessa Edgewright, the weaponsmith, who lost two fingers to him. Neither has forgiven the other."],
  ["u-bristle", "named", "Mother Bristle", "The great spider of the Ring of Stone. The Grey Widow, far below, is said to be her mother."],
  ["u-varn", "named", "Varn the Flayer", "A sellsword of the Free Companies who stopped going down for treasure when he saw that delvers coming up carry more of it."],
  ["u-lanternthief", "named", "The Lantern Thief", "The first of the dark things to climb, seen since about 900 BH. Everything it snuffs goes into its sack, and everything in the sack goes down to Morrowgloom. It put out every lamp in Lanternhollow on the Night of Open Doors. Kill it, the Keepers believe, and the lights in the sack go free."],
  ["u-corvane", "named", "Corvane, Crow of the Deep", "It eats the dead of the upper workings and keeps their voices. Since 1150 YH the crows of the Hollow Gate have obeyed it."],
  ["u-vesper", "named", "Sister Vesper", "A Keeper of Lanternhollow who listened at the temple floor until something listened back. In 911 YH she put out every lamp in the temple except the Eternal Lamp, which would not go out, and walked into the Deep."],
  ["u-kettlemaw", "named", "Kettlemaw", "Cooks for the ogres of the Ring of Roots, and argues with them about seasoning."],
  ["u-hollowjack", "named", "Hollow Jack", "Walked off its pole at the harvest fair in 1199 YH. The candle in its chest is a light Morrowgloom cannot eat, which is why the dark things avoid it, and why it is so lonely."],
  ["u-grimsby", "named", "Grimsby Coldhand", "Expelled from the Collegium of Sparks in 1052 YH for keeping the bodies of his failed students. He has never stopped taking students."],
  ["u-brakka", "named", "Brakka Stoneteeth", "She was rubble in the Ring of Stone when the masons cut it, if the trolls' own story is true: the oldest troll in the Deep, and mother of half of them."],
  ["u-ysolde", "named", "Ysolde of the Ashes", "A pyromancer bound by oath to her tower, who burned it down in 1183 YH to be free. Free, she found she had nowhere to go but down."],
  ["u-maulwyrm", "named", "The Maul-Wyrm", "Some say it, not the masons, cut half the passages of the lower rings, and that the Lampway's shifting is only the Maul-Wyrm rearranging its home."],
  ["u-greywidow", "named", "The Grey Widow", "Mother Bristle's mother. The Pale Bride passed safely through her web, they say, because the two brides did not quarrel."],
  ["u-thessaly", "named", "Thessaly Glass", "What became of Queen Tamsin's Mirror, which showed the rings below. Left among the hungry dead for a thousand years, it learned hunger. If it still sees what the Mirror saw, it knows the whole Deep."],
  ["u-ironjaw", "named", "Ironjaw", "Built by the bankers Brassle & Vane in 700 YH, sunk with their vault in the Great Subsidence of 803. The vault was broken and scattered long ago. Ironjaw guards the place where it thinks the vault is."],
  ["u-palebride", "named", "The Pale Bride", "Princess Lisette of Aurenhold, who walked into the Deep on her wedding day around 600 BH to find her betrothed, a captain of the Marrow Guard. She is still looking. She may be the first vampire."],
  ["u-drownedking", "named", "The Drowned King", "King Oswy the Faithful, who drowned relighting his fathers' tomb lamps when the river broke into the Ring of Rest in 640 BH. The flood carried him down to the Ring of Forges, where he walks the riverbed waiting to be carried home."],
  ["u-rimeheart", "named", "Rimeheart", "A Cragborn hauler's son who went down with the digging. When word came, centuries later, that his family above had died, he froze his own heart. The Cragborn still sing about him."],
  ["u-manymouthed", "named", "The Many-Mouthed", "A horror that came up through the Unlit Ring. It was the voice Sister Vesper heard under the temple floor."],
  ["u-skarth", "named", "Skarth the Unsleeping", "A Collegium scholar who went down in 307 YH looking for the light that does not die, and found a way not to die himself. He believes that the moment he closes his eyes, Morrowgloom will take him."],
  ["u-emberqueen", "named", "The Ember Queen", "Hatched in the deep fires when the First Fire burst: the oldest living thing in the world. She allowed the Pact of the Forge for a price no one wrote down. The Ashborn half-believe she is what is left of the First Fire, and her hoard may hold its last true ember."],
  ["u-ashvane", "named", "Duke Ashvane", "A fiend of the Unlit Ring who came to Aurenhold as a merchant prince and won the kingdom from Ysmer the Last at dice in 412 BH. He took the crown into the Deep and wears it still. The Oathknights want it back."],
  ["u-morrowgloom", "named", "Morrowgloom, the Lantern-Eater", "The last pool of the Gloam, trapped under the world when the First Fire burst. It eats light, and its thousand eyes are every light it has eaten, still burning; Caedra's is among them. If it is slain, the swallowed lights go home."],
  ["a-embersong", "artifact", "Embersong", "Forged by Ashborn smiths at the Anvil of the Pact for the Order of the Lamp. Dame Orsolya Vell carried it into the Ring of Rest after the Fall to relight the tomb of the first king; the blade came back up the river without her. The hum is the forge-song of the Pact, still being sung."],
  ["a-mantle", "artifact", "The Mantle of Quiet Steps", "The cloak of \"Nobody\" Quill, the only delver ever to rob the Brassle & Vane vault before it fell. The Quiet Hand claims it as its founding relic, and also denies it."],
  ["a-stonehelm", "artifact", "The Stonehelm of the Deep Halls", "Thane Gorran Deephall's helm, carved from the first stone of the Ring of Stone ever to hold light. The Deephall clans want it back, and will be very polite until they get it."],
  ["a-firstlamp", "artifact", "The Lantern of the First Keeper", "Caedra's lantern, which she carried down to light the Ring of Glass around 2100 BH. It is not the oldest lamp, but its flame was lit from the First Lamp itself, which is why it cannot go out. It was found, still burning, in the Ring of Forges, far above where she took it. The Eternal Lamp in the temple was lit from it."],
  ["a-starfall", "artifact", "Starfall", "Made by the Sylvan archer Ithrel Silverstring around 1150 BH from Greenroof wood grown under the brightest stars, and strung with silver drawn from captured starlight. It shoots truest in the dark."],
  ["a-swiftband", "artifact", "The Band of Swift Feet", "Worn by Wren Hallow, the Burrowfolk runner who carried word of a failing ring from the Ring of Glass to the surface in one night. Wren said it made the world seem slow, and lonely, and gave it back."],
  ["t-letter", "book", "A miner's last letter", "\"Dear Ma. The seam goes on and on, and the foreman says one more week and we'll all be rich. There's a draught down here that smells like old flowers. Hob says he heard bells. Tonight we break through the last wall. I'll write when I'm up. Your Ned.\" It is dated the Night of Open Doors, 612 YH."],
  ["t-notes", "book", "Lecture notes on starlight", "A student's notes from the Collegium of Sparks: \"Starlight is the far sparks of the First Fire. It does not care what we do with it. Spark is the first lesson because it is the smallest borrowing. NB: every spell is a loan. Light is never made, only moved.\" In the margin: \"Then where does it go when the Gloam eats it?\""],
  ["t-charter", "book", "A copy of the Delving Charter", "\"By order of the Council of Lanternhollow, 640 YH: the lower workings being closed after the Collapse, any person may go below on licence, and bring up and sell what they find, save only that no public lamp be put out, on pain of the law.\" Signed by Councillor Pell Arran and four others."],
  ["t-daybook", "book", "A Keeper's day-book", "\"Fourth round of the second ring. Six lamps trimmed, two refilled, one relit at the root shrine where the drip had drowned it. Saw the dark lean in at the stair head while the lamp was out, the way a cat leans in at a door. Keep it lit. Keep it down.\" The hand is neat, and very old."],
  ["t-runner", "book", "A runner's message, never delivered", "Burrowfolk shorthand on a scrap of hide: \"To the Keepers above, from the glass ring. Lamps failing east of the great stair. Oil short three rounds. Send more before the cold comes up.\" The courier's name has worn away. The message is over a thousand years old."],
  ["t-ledger", "book", "A ledger of Brassle & Vane", "Columns of deposits in a tidy Tinkerling hand, and at the back: \"Paid to the foundry for one iron guardian, jaw of vault steel, never to sleep, never to leave the vault: 4,000 gold. Worth every coin.\" The last entry is dated the day before the Great Subsidence."],
  ["t-hymn", "book", "A hymn for the Drowned King", "\"He went down for his fathers' sake / with oil and wick and flame; / the river rose, the king went down, / and none came up again. / Light a lamp for Oswy, / light it on the stair; / he waits for the flood to carry him home, / and the water does not care.\""],
  ["t-watch", "book", "The Marrow Guard's roll of watch", "Names in rows, each with a span of years: forty, fifty, sixty years of watch in the Ring of Rest. The last line reads: \"The kingdom has fallen. We are ordered up. Some of us will not go. Someone must keep the old kings company.\""],
  ["t-forgesong", "book", "An Ashborn forge-song", "Words for working at the Anvil of the Pact, to be sung in time with the hammer: \"Strike for the Queen who remembers. Strike for the wall of fire. Strike, and the dark stays under, as long as the forge burns higher.\""],
  ["t-caedra", "book", "A page in Caedra's hand", "\"I have lit every ring on the way down. The last is the hardest, for the glass drinks the light as fast as I give it. Below the Pit I saw a glow I did not make. Someone was here before us. Keep it lit, keep it down, and do not come looking for me.\""],
  ["t-unlit", "book", "Notes on the Unlit Ring", "A Keeper's plan for a sixth ring, to close the cage from below, with the last page added in a shakier hand: \"The Tithe is cut. We go up tomorrow and will not come back. We have lit the great crystal to hold what we could not finish. Let it be the Last Lamp, and let no one ever take it.\""],
  ["t-elder", "book", "A page in no known hand", "Not ink but scorch marks, in a script no scholar has read, around a drawing of a ring of lamps under a pool of dark. Holding the page, you feel warmth in your fingers, as if someone had only just put down a lamp."]
].map(([id, sec, title, text]) => [id, { id, sec, title, text }]));
const LORE_SECTIONS = { world: "The world", ring: "The rings", named: "The named", artifact: "Artifacts", book: "Books found below" };
const LORE_START = ["world-fire", "world-gloom", "world-lampway", "world-hollow"];

// One line on where each family of monsters comes from, for recall.
const FAMILY_LORE = {
  rodent: "Rats were in the mines before the miners.", bat: "They steer by sound, so the dark cannot blind them.",
  insect: "Drawn to every light; some drink the flame itself.", spider: "They love the shrines' dark corners.",
  beetle: "Lamp beetles grow glowing shells by eating glow crystal.", worm: "Borers that cut more tunnels than the masons ever did.",
  mould: "Memory moss grows over the Keepers' carvings and is said to hold what they said.", jelly: "Let loose by the Keepers to clean the rings; now they eat everything.",
  snake: "They followed the warmth down towards the deep fires.", canine: "Wolves from the hills, and hounds bred by the deep giants.",
  feline: "Hill cats that followed the rats down and found bigger prey.", beast: "Beasts of the Hollowmark that moved into the empty halls.",
  bird: "They nest in the Hollow Gate's broken dome.", kobold: "Scavengers who took the east galleries in 412 YH and lay most of the upper traps.",
  goblin: "Hill raiders who moved into the Deep after the Collapse; no kin to the Marrowkin.", brigand: "Failed delvers and deserters who rob the living instead of the dead.",
  thief: "They follow delvers down to steal what they find.", mage: "The Collegium's dropouts and outcasts.",
  priest: "Keepers and scholars who went down and began to pray to the dark.", ogre: "Hill ogres, who move in wherever there is food.",
  troll: "They grow out of rubble left in the dark, the miners say, which is why they mend themselves.", giant: "Cragborn who went down with the digging and were changed by each ring they reached.",
  skeleton: "Workers, soldiers and the Marrow Guard of the Ring of Rest.", zombie: "Miners who died on the Night of Open Doors, and those they killed since.",
  ghost: "Those whose last spark was caught on its way up to the stars.", mummy: "The Keepers and the Lamp Kings themselves, still on watch.",
  vampire: "The dead who learned to take life instead of light.", lich: "Scholars who chose not to die.",
  elemental: "The deep fires' own spirits, loose since the Ashborn left the forges.", vortex: "Winds that rise where hot rock meets cold.",
  shade: "Scraps of Morrowgloom that came loose and climbed.", eye: "Some say they are Morrowgloom's eyes, broken off and looking for the way up.",
  mimic: "Grave goods left so long among the hungry dead that they learned hunger.", plant: "The Greenroof's roots, grown wild without light.",
  arachnid: "Crabs came up the river; scorpions came down from the hot hills.", reptile: "Old creatures of the deep, warmed by the fires.",
  hybrid: "The royal menagerie of Aurenhold, released at the Fall.", horror: "Things from the Unlit Ring, crawled up through the cracks.",
  golem: "Built to guard shrines, forges and vaults, and still guarding.", fiend: "Fiends of the Unlit Ring, who want the world above.",
  drake: "The Ember Queen's grandchildren, or so the drakes believe.", dragon: "The great dragons of the deep fires.",
  wisp: "Lost sparks: lamplight that wandered off, or starlight caught in the glass.", deadhound: "The Marrow Guard's war dogs, still following their masters.",
  were: "Hill folk under an old curse, hiding what they become.", scalekin: "A river people older than the Lampway, who think it was built around their country.",
  sporefolk: "Walking fungus of the Ring of Roots; the elders dream for the colony.", gargoyle: "Carved guardians of the crypt chapels, woken when the lamps went out."
};
// Where special kinds come from, for item cards.
const EGO_LORE = {
  burning: "Tempered at the Anvil of the Pact in the Ring of Forges.", frost: "Quenched in frost-giant ice.", storms: "Struck by Collegium lightning.",
  slaybeast: "Blessed by the Order for the hunts in the Ring of Roots.", slayundead: "Blessed by the Order against the dead of the Ring of Rest.", slayevil: "Blessed by the Order against the fiends below.",
  warding: "A Keeper's ward, cut into the blade for lamplighters who went down alone.", sharp: "Stonekin edge-work, honed on stone that held light.",
  blessed: "Laid for a night on the altar of the Eternal Lamp.", rfire: "Ashborn ash-cloth work.", rcold: "Cragborn work, from the cold steads of the Crag Roots.",
  racid: "Tinkerling oilskin work.", relec: "Tinkerling work, wound with copper.", resistance: "Made for the lamplighters, who had to pass through every ring.",
  stealth: "The Quiet Hand's work, though no one admits it.", speed: "Burrowfolk runners' gear from the Age of Lamps.", free: "Burrowfolk runners' gear, made so no message could be held up.",
  seeing: "A Keeper's helm for watching the dark.", intellect: "A gift of old Aurenhold to its scholars.", wisdom: "A gift of old Aurenhold to its Keepers.",
  might: "A gift of old Aurenhold to its champions.", power: "A gift of old Aurenhold to its champions.", accuracy: "A gift of old Aurenhold to its archers."
};
// Who wrote each spell book.
const BOOK_LORE = {
  abook1: "Written by the Collegium's founders around 1700 BH; every Arcanist's first book.", abook2: "Written around 1400 BH. The Stonekin call Melt Stone a crime.",
  abook3: "Written by the Collegium's battle-mages in the Long Dusk.", abook4: "No one admits to writing it. Some say Duke Ashvane left a copy at court.",
  hbook1: "The first Keepers' prayers, from the building of the Lampway.", hbook2: "Prayers for the lamplighters of the rings.",
  hbook3: "Written after the Night the River Rose, in grief.", hbook4: "Caedra's own rites, the Order says, spoken as she lit the Ring of Glass."
};
