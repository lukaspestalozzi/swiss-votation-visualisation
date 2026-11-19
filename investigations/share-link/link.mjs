// The facts of investigations/share-link.md.
//
// Part 1, in Node, over the data files with the app's own functions (app/src/lib/limits.ts and
// characteristics.ts): for each characteristic, over the vote days of votes.json, the ends of its
// track as a link would write them, the largest difference between the values of two neighbouring
// steps, and whether every step's value, written as a link writes it and read back, comes back by
// the nearest step to a step of the same value; then the longest link with all 21 limits.
//
// Part 2, in Chromium on the built site: 300 address changes in a row, with Playwright's flags and
// without --disable-ipc-flooding-protection, which Playwright adds; the input and change events of
// a drag and of 20 presses of an arrow key on a slider; and a link to the same page with another
// hash, opened in the same tab: whether the page loads again and whether hashchange fires.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/share-link/link.mjs <repository>
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const repository = process.argv[2];
const { chromium } = createRequire(import.meta.url)('playwright');
const { STEPS, trackOf, valueAt } = await import(`${repository}/app/src/lib/limits.ts`);
const { DEFINITIONS, applyingTo, writeUnits } = await import(
  `${repository}/app/src/lib/characteristics.ts`
);
const { textsOf } = await import(`${repository}/app/src/lib/texts/index.ts`);

const read = (path) => JSON.parse(readFileSync(`${repository}/app/static/data/${path}`, 'utf8'));
const file = read('characteristics.json');
const days = [...new Set(read('votes.json').votes.map((vote) => vote.date))].sort();
const t = textsOf('de');

// ---- Part 1: values and steps ----

// A value as a link writes it: as the label does, without the unit and the apostrophes.
const linkWritten = (definition, units) => writeUnits(definition, units, t).replace(/[^0-9.]/g, '');
// And back: the units of the last decimal the label writes.
const linkRead = (written) => Number(written.replace('.', ''));
// The step whose value is nearest a value; of two, the lower.
function nearestStep(track, value) {
  let best = 0;
  for (let step = 1; step <= STEPS; step += 1) {
    if (Math.abs(valueAt(track, step) - value) < Math.abs(valueAt(track, best) - value))
      best = step;
  }
  return best;
}

console.log(`Part 1: ${String(days.length)} vote days, ${days[0]} to ${days.at(-1)}\n`);
console.log(
  'key | scale | smallest end | largest end | largest gap between steps (at) | round trip',
);
let longest = { length: 0, day: '', link: '' };
const perDay = new Map(days.map((day) => [day, []]));
for (const definition of DEFINITIONS) {
  let smallest = Infinity;
  let largest = -Infinity;
  let gap = { units: -1, at: 0 };
  let failures = 0;
  let checked = 0;
  for (const day of days) {
    const track = trackOf(definition, file, applyingTo(file, day));
    smallest = Math.min(smallest, track.smallest);
    largest = Math.max(largest, track.largest);
    const values = Array.from({ length: STEPS + 1 }, (_, step) => valueAt(track, step));
    for (let step = 0; step < STEPS; step += 1) {
      if (values[step + 1] - values[step] > gap.units) {
        gap = { units: values[step + 1] - values[step], at: values[step + 1] };
      }
    }
    for (const value of new Set(values)) {
      checked += 1;
      const back = linkRead(linkWritten(definition, value));
      if (back !== value || values[nearestStep(track, back)] !== value) failures += 1;
    }
    // The longest bound inside the track (a bound at an end is written empty).
    const inside = values.filter((value) => value > track.smallest && value < track.largest);
    const widest = Math.max(...inside.map((value) => linkWritten(definition, value).length));
    perDay.get(day).push(`${definition.key}=${'9'.repeat(widest)}-${'9'.repeat(widest)}`);
  }
  console.log(
    [
      definition.key,
      definition.scale,
      writeUnits(definition, smallest, t),
      writeUnits(definition, largest, t),
      `${writeUnits(definition, gap.units, t)} (at ${writeUnits(definition, gap.at, t)})`,
      `${String(checked - failures)} of ${String(checked)} values`,
    ].join(' | '),
  );
}
for (const [day, parts] of perDay) {
  const link = `#${[...parts, 'abroad=no'].join('&')}`;
  if (link.length > longest.length) longest = { length: link.length, day, link };
}
const address = 'https://lukaspestalozzi.github.io/swiss-votation-visualisation/de/votes/5960/';
console.log(
  `\nThe longest link with all 21 limits (${longest.day}): its hash ${String(longest.length)} characters, ` +
    `the whole address ${String(address.length + longest.length)}:\n${address}${longest.link}\n`,
);

// ---- Part 2: the browser ----

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';

async function replaceStates(options, label) {
  const browser = await chromium.launch(options);
  const page = await browser.newPage();
  const messages = [];
  page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
  await page.goto(`${BASE}de/votes/5960/`);
  const result = await page.evaluate(() => {
    let took = 0;
    let error = null;
    for (let i = 1; i <= 300; i += 1) {
      try {
        history.replaceState(history.state, '', `#n=${String(i)}`);
      } catch (e) {
        error ??= `${String(i)}: ${String(e)}`;
      }
      if (location.hash === `#n=${String(i)}`) took += 1;
    }
    return { took, error, last: location.hash };
  });
  console.log(`300 replaceState in a row, ${label}:`, JSON.stringify({ ...result, messages }));
  await browser.close();
}

console.log('Part 2: Chromium', chromium.executablePath());
await replaceStates({}, "Playwright's flags");
await replaceStates(
  { ignoreDefaultArgs: ['--disable-ipc-flooding-protection'] },
  'without --disable-ipc-flooding-protection',
);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`${BASE}de/votes/5960/`);
await page.getByLabel('Merkmal hinzufügen').selectOption({ label: 'Ausländeranteil' });
await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
const upper = page.getByRole('slider', { name: 'Obere Grenze: Ausländeranteil', exact: true });
await upper.scrollIntoViewIfNeeded();
await page.evaluate(() => {
  window.events = { input: 0, change: 0, hashchange: 0 };
  document.addEventListener('input', () => (window.events.input += 1), true);
  document.addEventListener('change', () => (window.events.change += 1), true);
  addEventListener('hashchange', () => (window.events.hashchange += 1));
});
const events = () => page.evaluate(() => ({ ...window.events }));
const box = await upper.boundingBox();
const y = box.y + box.height / 2;
await page.mouse.move(box.x + box.width - 10, y);
await page.mouse.down();
await page.mouse.move(box.x + box.width / 2, y, { steps: 20 });
await page.mouse.up();
console.log('a drag of 20 moves:', JSON.stringify(await events()));
await page.evaluate(() => Object.assign(window.events, { input: 0, change: 0 }));
await upper.focus();
for (let i = 0; i < 20; i += 1) await page.keyboard.press('ArrowLeft');
console.log('20 presses of ArrowLeft:', JSON.stringify(await events()));

await page.evaluate(() => {
  window.marker = 'still here';
  window.events = { input: 0, change: 0, hashchange: 0 };
  history.replaceState(history.state, '', '#written=by-replaceState');
});
console.log('after replaceState:', JSON.stringify(await events()));
await page.goto(`${BASE}de/votes/5960/#foreigners=-19.98`);
console.log(
  'a link to the same page with another hash, opened in the tab:',
  JSON.stringify(
    await page.evaluate(() => ({
      marker: window.marker ?? 'gone: the page loaded again',
      hashchange: window.events?.hashchange,
      hash: location.hash,
      limits: document.querySelectorAll('input[type=range]').length / 2,
    })),
  ),
);
await browser.close();
