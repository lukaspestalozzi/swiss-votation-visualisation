// How the same limits, by value, keep different municipalities on two vote days, each with the
// figures that apply to it, against the same municipalities kept by the first day's figures; it
// imports the app's own app/src/lib/limits.ts and characteristics.ts, which Node 24 runs with
// their types stripped.
//
// Usage: node investigations/vote-comparison/same_limits.mjs <repository>
const repo = process.argv[2];
const { readFileSync } = await import('node:fs');
const { trackOf } = await import(`${repo}/app/src/lib/limits.ts`);
const { DEFINITIONS, applyingTo } = await import(`${repo}/app/src/lib/characteristics.ts`);
const read = (p) => JSON.parse(readFileSync(`${repo}/app/static/data/${p}`, 'utf8'));
const file = read('characteristics.json');
const votes = read('votes.json').votes;
const days = [...new Set(votes.map((v) => v.date))].sort();
const def = (key) => DEFINITIONS.find((d) => d.key === key);
// Named selections of investigations/limits.md, 5, as units: [key, lower, upper] (null = the end).
const SELECTIONS = [
  ['foreigners', null, 1998, 'Ausländeranteil up to 19.98%'],
  ['inhabitants', 3508, null, 'Einwohner from 3,508'],
  ['svp', null, 4996, 'SVP up to 49.96%'],
  ['italian', 5007, null, 'Italienisch (2000) from 50.07%'],
];
function kept(key, lo, hi, day) {
  const track = trackOf(def(key), file, applyingTo(file, day));
  const set = new Set();
  track.values.forEach((v, i) => {
    if (v === null) return;
    if ((lo === null || v >= lo) && (hi === null || v <= hi)) set.add(file.municipalities[i]);
  });
  return { set, track };
}
const A = '2016-02-28';
const others = ['2016-06-05', '2018-03-04', '2020-09-27', '2024-03-03', days.at(-1)];
console.log(
  `vote days: ${days.length}, ${days[0]} to ${days.at(-1)}; municipalities ${file.municipalities.length}`,
);
for (const [key, lo, hi, label] of SELECTIONS) {
  const a = kept(key, lo, hi, A);
  const row = [`${label}: ${A} keeps ${a.set.size}`];
  for (const b of others) {
    const kb = kept(key, lo, hi, b).set;
    const onlyA = [...a.set].filter((n) => !kb.has(n)).length;
    const onlyB = [...kb].filter((n) => !a.set.has(n)).length;
    row.push(`${b}: ${kb.size} (${onlyA} out, ${onlyB} in)`);
  }
  console.log(row.join(' | '));
}
// The extremes: the first and the last vote day.
for (const [key, lo, hi, label] of SELECTIONS) {
  const a = kept(key, lo, hi, days[0]).set,
    b = kept(key, lo, hi, days.at(-1)).set;
  const diff = [...a].filter((n) => !b.has(n)).length + [...b].filter((n) => !a.has(n)).length;
  console.log(`${label}: ${days[0]} keeps ${a.size}, ${days.at(-1)} ${b.size}, ${diff} differ`);
}
