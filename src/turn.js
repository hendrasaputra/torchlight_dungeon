/* ---------- Torchlight Dungeons: turns ---------- */
// Energy scheduler: every tick each actor gains energy by its speed, and whoever reaches 100 acts. Speed +10 acts
// twice as often as speed 0, and -10 half as often.
// The game's clock. A day is DAY_TURNS of the player's turns, so a turn is about nine seconds: a careful step in the
// dark, or an exchange of blows. A new game starts at six in the morning, so daylight (06:00 to 18:00) is the first
// half of every DAY_TURNS, and a new day begins at midnight.
const DAY_TURNS = 10000;
function clockOf(turns){
  const mins = 360 + Math.floor(turns * 1440 / DAY_TURNS), day = Math.floor(mins / 1440) + 1, h = Math.floor(mins % 1440 / 60), m = mins % 60;
  const part = h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
  return { day, h, m, part, text: "Day " + day + " · " + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") };
}
const energyGain = speed => 10 * Math.pow(2, speed / 10);
function nextActor(actors){
  for (;;){
    let best = null;
    for (const a of actors) if (a.energy >= 100 && (!best || a.energy > best.energy)) best = a;
    if (best) return best;
    for (const a of actors) a.energy += energyGain(a.speed);
  }
}
