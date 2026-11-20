// What a limit "Ausländeranteil up to 19.98%" reads on the track of another first vote: the bound
// read back as a link is, at the step nearest its value (spec share-link), and the limit's label.
// It imports the app's own app/src/lib/limits.ts, characteristics.ts, share-link.ts and texts.
//
// Usage: node investigations/vote-comparison/first_vote.mjs <repository>
import { readFileSync } from 'node:fs';

const repo = process.argv[2];
const { trackOf, labelOf } = await import(`${repo}/app/src/lib/limits.ts`);
const { applyingTo } = await import(`${repo}/app/src/lib/characteristics.ts`);
const { selectionOf } = await import(`${repo}/app/src/lib/share-link.ts`);
const { textsOf } = await import(`${repo}/app/src/lib/texts/index.ts`);
const file = JSON.parse(readFileSync(`${repo}/app/static/data/characteristics.json`, 'utf8'));
for (const day of ['2016-02-28', '2020-09-27']) {
  const applying = applyingTo(file, day);
  const [limit] = selectionOf('foreigners=-19.98', (d) => trackOf(d, file, applying)).limits;
  console.log(
    `${day}: step ${String(limit.upper)}, ${labelOf(limit.track, limit.lower, limit.upper, textsOf('de'))}`,
  );
}
