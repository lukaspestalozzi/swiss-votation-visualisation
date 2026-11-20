// The cost of one recalculation of a vote under a selection, in Node: entriesThatRemain and
// calculateResult, as a step of a slider does once per vote; a comparison does it twice. The
// selection keeps two of every three municipalities of the map.
//
// Usage: node investigations/vote-comparison/calc_cost.mjs <repository>
const repo = process.argv[2];
const { readFileSync } = await import('node:fs');
const { calculateResult, entriesThatRemain, majoritiesNeeded } = await import(
  `${repo}/calculation/src/index.ts`
);
const { voteEntriesOf } = await import(`${repo}/app/src/lib/result-map.ts`);
const read = (p) => JSON.parse(readFileSync(`${repo}/app/static/data/${p}`, 'utf8'));
const map = read('map.json'),
  muni = read('municipalities.json');
const onMap = map.municipalities.map(([n]) => n);
const abroad = Object.values(muni.swissAbroad);
const vote = read('votes/5960.json');
const entries = voteEntriesOf(vote, onMap, abroad);
const remaining = new Set(onMap.filter((_, i) => i % 3 !== 0));
const maj = majoritiesNeeded('popular-initiative');
for (let i = 0; i < 200; i += 1)
  calculateResult(entriesThatRemain(entries.cantons, remaining, true), maj);
const t = performance.now();
for (let i = 0; i < 1000; i += 1)
  calculateResult(entriesThatRemain(entries.cantons, remaining, true), maj);
console.log(`one recalculation: ${((performance.now() - t) / 1000).toFixed(3)} ms`);
