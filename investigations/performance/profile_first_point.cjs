// The script of the first pointing at a municipality after the page has loaded, and of clicks
// (investigations/performance.md, M6 and M7): a profile of V8's sampler, every 50 µs, while the
// pointer moves from "Ganze Schweiz" onto Zürich, then onto Bern, then while Bern is clicked
// (the panel's first filling) and Zürich; the functions with the most self time, summed over
// the runs, and the page's functions with the most inclusive time. Run against an unminified build, so
// that the functions keep their names.
//
// Usage:
//   (cd app && pnpm exec vite build --minify false && pnpm exec sirv build --port 4174) &
//   node investigations/performance/profile_first_point.cjs [--runs 5]
const { chromium } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const i = process.argv.indexOf('--runs');
const RUNS = i < 0 ? 5 : Number(process.argv[i + 1]);

async function pointIn(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  return page
    .locator(selector)
    .evaluate((element) => {
      const box = element.getBBox();
      const matrix = element.getScreenCTM();
      for (let i = 1; i < 40; i += 1) {
        for (let j = 1; j < 40; j += 1) {
          const inside = new DOMPoint(box.x + (box.width * i) / 40, box.y + (box.height * j) / 40);
          if (!element.isPointInFill(inside)) continue;
          const onScreen = inside.matrixTransform(matrix);
          if (document.elementFromPoint(onScreen.x, onScreen.y) === element) return onScreen;
        }
      }
      throw new Error('no point inside the shape is on top');
    })
    .then((p) => ({ x: p.x, y: p.y }));
}

const keyOf = (f) =>
  `${f.functionName || '(anonymous)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`;

// Self time in ms per function ("name file:line"), from a profile's samples; and inclusive time,
// the samples with the function anywhere on their stack, for the functions of the page's chunk.
function selfTimes(profile, into, inclusive) {
  const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
  const parent = new Map();
  for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
  for (let k = 0; k < profile.samples.length; k += 1) {
    const ms = profile.timeDeltas[k] / 1000;
    const node = nodes.get(profile.samples[k]);
    const key = keyOf(node.callFrame);
    into.set(key, (into.get(key) ?? 0) + ms);
    const seen = new Set();
    for (let id = node.id; id !== undefined; id = parent.get(id)) {
      const f = nodes.get(id).callFrame;
      if (f.url.includes('/nodes/')) seen.add(keyOf(f));
    }
    for (const s of seen) inclusive.set(s, (inclusive.get(s) ?? 0) + ms);
  }
}

async function profiled(cdp, act) {
  await cdp.send('Profiler.start');
  await act();
  return (await cdp.send('Profiler.stop')).profile;
}

(async () => {
  const browser = await chromium.launch();
  const first = new Map();
  const later = new Map();
  const firstInclusive = new Map();
  const laterInclusive = new Map();
  const firstClick = new Map();
  const laterClick = new Map();
  const firstClickInclusive = new Map();
  const laterClickInclusive = new Map();
  for (let run = 1; run <= RUNS; run += 1) {
    const page = await browser.newPage();
    await page.goto(BASE + 'votes/5960/');
    await page.locator('.municipalities path').nth(2000).waitFor();
    await page.locator('.panel').getByText('Klicken Sie auf eine Gemeinde').waitFor();
    await page.getByRole('button', { name: 'Ganze Schweiz' }).click();
    // Each point is found just before it is used: finding one may scroll the page.
    const zurich = await pointIn(page, '.municipalities [data-number="261"]');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 50 });
    selfTimes(
      await profiled(cdp, async () => {
        await page.mouse.move(zurich.x, zurich.y, { steps: 5 });
        await page.waitForTimeout(100);
      }),
      first,
      firstInclusive,
    );
    const bern = await pointIn(page, '.municipalities [data-number="351"]');
    selfTimes(
      await profiled(cdp, async () => {
        await page.mouse.move(bern.x, bern.y, { steps: 5 });
        await page.waitForTimeout(100);
      }),
      later,
      laterInclusive,
    );
    selfTimes(
      await profiled(cdp, async () => {
        await page.mouse.click(bern.x, bern.y);
        await page.locator('.panel .name').getByText('Bern (BE)').waitFor();
        await page.waitForTimeout(100);
      }),
      firstClick,
      firstClickInclusive,
    );
    const again = await pointIn(page, '.municipalities [data-number="261"]');
    await page.mouse.move(again.x, again.y, { steps: 5 });
    selfTimes(
      await profiled(cdp, async () => {
        await page.mouse.click(again.x, again.y);
        await page.locator('.panel .name').getByText('Zürich (ZH)').waitFor();
        await page.waitForTimeout(100);
      }),
      laterClick,
      laterClickInclusive,
    );
    await page.close();
  }
  await browser.close();
  for (const [what, times, inclusive] of [
    ['first pointing', first, firstInclusive],
    ['a later pointing', later, laterInclusive],
    ['the first click', firstClick, firstClickInclusive],
    ['a later click', laterClick, laterClickInclusive],
  ]) {
    const total = [...times.entries()].filter(
      ([k]) => !k.startsWith('(idle)') && !k.startsWith('(program)'),
    );
    const sum = total.reduce((a, [, ms]) => a + ms, 0);
    console.log(`${what}: script ${(sum / RUNS).toFixed(1)} ms per run, of which (ms per run):`);
    for (const [key, ms] of total.sort((a, b) => b[1] - a[1]).slice(0, 15)) {
      console.log(`  ${(ms / RUNS).toFixed(2)}  ${key}`);
    }
    console.log(`  inclusive, the page's functions (ms per run):`);
    for (const [key, ms] of [...inclusive.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
      console.log(`  ${(ms / RUNS).toFixed(2)}  ${key}`);
    }
  }
})();
