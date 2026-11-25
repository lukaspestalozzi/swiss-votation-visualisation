// Found by the verification (investigations/redesign.md, "Found by the verification"): how long
// the tracks of a link's first 21 limits take to make, and their bars to work out, in Node,
// which runs the app's modules with their types stripped. Five runs: the first is the cold one,
// as the frame after a link is.
//
// Usage: node investigations/redesign/bars_cost.mjs "$PWD"
import { readFileSync } from 'node:fs';

const root = process.argv[2];
const { DEFINITIONS, applyingTo } = await import(`${root}/app/src/lib/characteristics.ts`);
const { trackOf, barsPathOf, histogramOf } = await import(`${root}/app/src/lib/limits.ts`);
const file = JSON.parse(readFileSync(`${root}/app/static/data/characteristics.json`, 'utf8'));
const applying = applyingTo(file, '2016-02-28');

for (let run = 1; run <= 5; run++) {
  const start = performance.now();
  const tracks = DEFINITIONS.slice(0, 21).map((definition) => trackOf(definition, file, applying));
  const made = performance.now();
  for (const track of tracks) histogramOf(track);
  const counted = performance.now();
  for (const track of tracks) barsPathOf(track);
  const drawn = performance.now();
  console.log(
    `run ${String(run)}: 21 tracks ${(made - start).toFixed(1)} ms, their histograms ${(counted - made).toFixed(1)} ms, their bars as paths ${(drawn - counted).toFixed(1)} ms`,
  );
}
