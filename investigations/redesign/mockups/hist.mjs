// Where the municipalities lie on a limit's track, in 50 bins of 20 steps each, for the vote day
// of 2016-02-28, with the app's own app/src/lib/limits.ts and characteristics.ts, which Node 24
// runs with their types stripped; and where Köniz, the municipality the mockups click, lies.
//
// Usage: node investigations/redesign/mockups/hist.mjs <repository> <dir outside the repository>
const repo = process.argv[2];
const { readFileSync, writeFileSync } = await import('node:fs');
const { trackOf, valueAt, STEPS } = await import(`${repo}/app/src/lib/limits.ts`);
const { DEFINITIONS, applyingTo, writeUnits, nameOf, dateOf } = await import(
  `${repo}/app/src/lib/characteristics.ts`
);
const { textsOf } = await import(`${repo}/app/src/lib/texts/index.ts`);
const t = textsOf('de');
const file = JSON.parse(readFileSync(`${repo}/app/static/data/characteristics.json`, 'utf8'));
const applying = applyingTo(file, '2016-02-28');
const BINS = 50;
const stepOf = (track, value) => {
  let lo = 0,
    hi = STEPS;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (valueAt(track, mid) < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};
const out = {};
for (const [key, lower, upper] of [
  ['foreigners', null, 1998],
  ['inhabitants', 2987, null],
]) {
  const definition = DEFINITIONS.find((d) => d.key === key);
  const track = trackOf(definition, file, applying);
  const bins = new Array(BINS).fill(0);
  for (const value of track.values) {
    if (value === null) continue;
    bins[Math.min(BINS - 1, Math.floor((stepOf(track, value) / STEPS) * BINS))]++;
  }
  const at = (number) => {
    const i = file.municipalities.indexOf(number);
    const value = track.values[i];
    return { value: writeUnits(definition, value, t), step: stepOf(track, value) };
  };
  out[key] = {
    name: nameOf(definition, t),
    date: dateOf(definition, track.year, t),
    scale: definition.scale,
    smallest: writeUnits(definition, track.smallest, t),
    largest: writeUnits(definition, track.largest, t),
    lower: lower === null ? 0 : stepOf(track, lower),
    upper: upper === null ? STEPS : stepOf(track, upper),
    lowerText: writeUnits(definition, lower ?? track.smallest, t),
    upperText: writeUnits(definition, upper ?? track.largest, t),
    ticks: [0, 250, 500, 750, 1000].map((s) => writeUnits(definition, valueAt(track, s), t)),
    bins,
    koeniz: at(355),
  };
  console.log(key, JSON.stringify({ ...out[key], bins: bins.join(' ') }));
}
writeFileSync(`${process.argv[3]}/hist.json`, JSON.stringify(out));
