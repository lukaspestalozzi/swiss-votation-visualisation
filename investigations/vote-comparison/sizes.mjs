// The sizes a comparison page deals in: the files of entries it would load, the list of votes, and
// a list of the votes that can be compared (id, date, title in one language), as a page would hold
// it; and the votes per vote day.
//
// Usage: node investigations/vote-comparison/sizes.mjs <repository>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const repo = process.argv[2];
const data = `${repo}/app/static/data`;
const gz = (text) => gzipSync(text).length;
const files = readdirSync(`${data}/votes`).map((f) => `${data}/votes/${f}`);
const sizes = files.map((f) => statSync(f).size).sort((a, b) => a - b);
const zipped = files.map((f) => gz(readFileSync(f))).sort((a, b) => a - b);
console.log(
  `files of entries: ${files.length}, ${sizes[0]} to ${sizes.at(-1)} bytes, gzipped ${zipped[0]} to ${zipped.at(-1)}`,
);
const listText = readFileSync(`${data}/votes.json`, 'utf8');
console.log(`votes.json: ${Buffer.byteLength(listText)} bytes, gzipped ${gz(listText)}`);
const votes = JSON.parse(listText).votes;
const judged = votes.filter((v) => v.kind !== 'tie-break-question');
console.log(`votes ${votes.length}, judged ${judged.length}`);
for (const language of ['de', 'fr', 'it']) {
  const list = JSON.stringify(
    judged.map((v) => ({ id: v.id, date: v.date, title: v.title[language] })),
  );
  console.log(
    `a list of the judged votes in ${language}: ${Buffer.byteLength(list)} bytes, gzipped ${gz(list)}`,
  );
}
const perDay = new Map();
for (const v of votes) perDay.set(v.date, (perDay.get(v.date) ?? 0) + 1);
const counts = [...perDay.values()];
console.log(
  `vote days ${perDay.size}: ${counts.filter((n) => n > 1).length} with several votes, at most ${Math.max(...counts)}`,
);
