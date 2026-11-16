// Found while applying add-limits (investigations/limits.md, 8): which functions take the script
// time of a drag of a limit. A profile of V8's sampler, every 50 µs, while the lower bound of
// "Einwohner" on /votes/5960/ is dragged across its track and back in 40 moves; the functions
// with the most self time, and the page's functions with the most inclusive time, summed over
// the runs. Run against an unminified build, so that the functions keep their names.
//
// Usage:
//   (cd app && pnpm exec vite build --minify false && pnpm exec sirv build --port 4174) &
//   node investigations/limits/profile_drag.cjs [--runs 5]
const { chromium } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const i = process.argv.indexOf('--runs');
const RUNS = i < 0 ? 5 : Number(process.argv[i + 1]);

const keyOf = (f) =>
  `${f.functionName || '(anonymous)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`;

(async () => {
  const browser = await chromium.launch();
  const self = new Map();
  const inclusive = new Map();
  let total = 0;
  for (let run = 1; run <= RUNS; run += 1) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + 'votes/5960/');
    const list = page.getByLabel('Merkmal hinzufügen');
    await list.waitFor();
    await list.selectOption({ label: 'Einwohner' });
    await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
    const lower = page.getByRole('slider', { name: 'Untere Grenze: Einwohner', exact: true });
    await lower.scrollIntoViewIfNeeded();
    const box = await lower.boundingBox();
    const y = box.y + box.height / 2;
    const [left, right] = [box.x + 10, box.x + box.width - 10];
    await page.mouse.move(left, y);
    await page.waitForTimeout(50);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 50 });
    await cdp.send('Profiler.start');
    await page.mouse.down();
    await page.mouse.move(right, y, { steps: 20 });
    await page.mouse.move(left, y, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(100);
    const { profile } = await cdp.send('Profiler.stop');
    const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
    const parent = new Map();
    for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
    for (let k = 0; k < profile.samples.length; k += 1) {
      const ms = profile.timeDeltas[k] / 1000;
      const node = nodes.get(profile.samples[k]);
      const key = keyOf(node.callFrame);
      if (key.startsWith('(idle)') || key.startsWith('(program)')) continue;
      total += ms;
      self.set(key, (self.get(key) ?? 0) + ms);
      const seen = new Set();
      for (let id = node.id; id !== undefined; id = parent.get(id)) {
        const f = nodes.get(id).callFrame;
        if (f.url.includes('/_app/')) seen.add(keyOf(f));
      }
      for (const s of seen) inclusive.set(s, (inclusive.get(s) ?? 0) + ms);
    }
    await page.close();
  }
  await browser.close();
  console.log(
    `script during a drag: ${(total / RUNS).toFixed(1)} ms per run; self time (ms per run):`,
  );
  for (const [key, ms] of [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18)) {
    console.log(`  ${(ms / RUNS).toFixed(2)}  ${key}`);
  }
  console.log("inclusive, the page's functions (ms per run):");
  for (const [key, ms] of [...inclusive.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18)) {
    console.log(`  ${(ms / RUNS).toFixed(2)}  ${key}`);
  }
})();
