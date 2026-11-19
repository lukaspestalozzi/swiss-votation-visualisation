// Found while applying add-small-screens (investigations/small-screens.md, 9): the frame of the
// first tap on a municipality after the page has loaded, and of the next tap, on a phone. A tap
// sends pointerover, pointerdown, pointerup and click at once, so its frame holds the pointing
// and the click that a mouse spreads over two frames. Each frame is measured as the browser
// tests measure it (app/e2e/frames.ts), with user-timing marks around it, and a Chrome trace
// splits it into the main thread's work by the self time of each kind of event.
//
// With --after-fingers, the sequence of the budget test of fingers (app/e2e/result-map.spec.ts):
// two pinches and a move of one finger first, then "Ganze Schweiz" before each tap; each frame is
// named by the input it follows.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --dev --port 4174) &
//   node investigations/small-screens/first_tap.cjs [--runs 5] [--after-fingers [--pause 150]]
const { chromium, devices } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const i = process.argv.indexOf('--runs');
const RUNS = i < 0 ? 5 : Number(process.argv[i + 1]);
const AFTER_FINGERS = process.argv.includes('--after-fingers');
// With --pause <ms>, that long between the gestures, as a person leaves.
const p = process.argv.indexOf('--pause');
const PAUSE = p < 0 ? 0 : Number(process.argv[p + 1]);

// As the browser tests' MEASURE_FRAMES, with marks around each frame.
const MEASURE = `
  window.__frames = [];
  const started = new WeakMap();
  let next = 0;
  for (const type of ['pointerover', 'pointermove', 'click']) {
    window.addEventListener(type, (event) => {
      const id = next++;
      const entry = { id, type, start: performance.now(), handled: 0 };
      performance.mark('in-' + id);
      started.set(event, entry);
      requestAnimationFrame(() => {
        const frame = performance.now();
        setTimeout(() => {
          performance.mark('out-' + id);
          const handlers = (entry.handled || frame) - entry.start;
          window.__frames.push({ id, type, input: window.__input, work: Math.max(0, handlers) + (performance.now() - frame) });
        });
      });
    }, { capture: true, passive: true });
    window.addEventListener(type, (event) => {
      const entry = started.get(event);
      if (entry) entry.handled = performance.now();
    }, { passive: true });
  }
`;

// Self time of each event name on the renderer's main thread between two user-timing marks
// (investigations/limits/measure_drag.cjs).
function breakdown(trace, id) {
  const events = trace.traceEvents;
  const mark = (name) => events.find((e) => e.name === name && e.cat.includes('blink.user_timing'));
  const begin = mark(`in-${id}`);
  const end = mark(`out-${id}`);
  if (!begin || !end) return null;
  const main = events.filter(
    (e) =>
      e.pid === begin.pid &&
      e.tid === begin.tid &&
      e.ph === 'X' &&
      e.dur !== undefined &&
      e.ts < end.ts &&
      e.ts + e.dur > begin.ts,
  );
  main.sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const self = new Map();
  const stack = [];
  for (const e of main) {
    while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];
    const clipped = Math.min(e.ts + e.dur, end.ts) - Math.max(e.ts, begin.ts);
    self.set(e.name, (self.get(e.name) ?? 0) + clipped);
    if (parent) self.set(parent.name, (self.get(parent.name) ?? 0) - clipped);
    stack.push(e);
  }
  const busy = [...self.values()].reduce((a, b) => a + b, 0);
  return (
    `busy ${(busy / 1000).toFixed(1)} of ${((end.ts - begin.ts) / 1000).toFixed(1)} ms: ` +
    [...self.entries()]
      .filter(([, us]) => us > 300)
      .sort((a, b) => b[1] - a[1])
      .map(([name, us]) => `${name} ${(us / 1000).toFixed(1)}`)
      .join(', ')
  );
}

/** A point well inside a municipality, the points 2 pixels around it in it too. */
const pointIn = (page, number) =>
  page.locator(`.municipalities [data-number="${String(number)}"]`).evaluate((path) => {
    const box = path.getBBox();
    const matrix = path.getScreenCTM();
    for (let i = 1; i < 40; i += 1) {
      for (let j = 1; j < 40; j += 1) {
        const inside = new DOMPoint(box.x + (box.width * i) / 40, box.y + (box.height * j) / 40);
        if (!path.isPointInFill(inside)) continue;
        const p = inside.matrixTransform(matrix);
        const around = [
          [0, 0],
          [-2, 0],
          [2, 0],
          [0, -2],
          [0, 2],
        ];
        if (around.every(([dx, dy]) => document.elementFromPoint(p.x + dx, p.y + dy) === path)) {
          return { x: p.x, y: p.y };
        }
      }
    }
    throw new Error('no point well inside the shape');
  });

(async () => {
  const browser = await chromium.launch();
  const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
  for (let run = 1; run <= RUNS; run += 1) {
    const page = await browser.newPage(pixel);
    await page.addInitScript(MEASURE);
    await page.goto(BASE + 'de/votes/5960/');
    await page.locator('.municipalities path').nth(2000).waitFor();
    await page.waitForFunction(() =>
      document.querySelector('.panel')?.textContent.includes('Klicken Sie'),
    );
    await page.locator('.map svg').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const zurich = await pointIn(page, 261);
    const bern = await pointIn(page, 351);
    const label = (input) =>
      page.evaluate((name) => {
        window.__input = name;
      }, input);
    await page.evaluate(() => {
      window.__frames = [];
    });
    await browser.startTracing(page, {
      categories: [
        'devtools.timeline',
        'disabled-by-default-devtools.timeline',
        'blink.user_timing',
        'v8.execute',
        'disabled-by-default-v8.gc',
        'toplevel',
      ],
    });
    if (AFTER_FINGERS) {
      const cdp = await page.context().newCDPSession(page);
      const box = await page.locator('.map svg').boundingBox();
      const c = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const send = (type, points) =>
        cdp.send('Input.dispatchTouchEvent', {
          type,
          touchPoints: points.map((p, k) => ({ x: p.x, y: p.y, id: k + 1 })),
        });
      const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
      const move = async (from, to) => {
        await send('touchStart', from);
        await frame();
        for (let step = 1; step <= 10; step += 1) {
          const at = from.map((a, k) => ({
            x: a.x + ((to[k].x - a.x) * step) / 10,
            y: a.y + ((to[k].y - a.y) * step) / 10,
          }));
          await send('touchMove', at);
          await frame();
        }
        await send('touchEnd', []);
        await frame();
      };
      await label('pinch');
      for (let k = 0; k < 2; k += 1) {
        if (PAUSE > 0) await page.waitForTimeout(PAUSE);
        await move(
          [
            { x: c.x - 50, y: c.y },
            { x: c.x + 50, y: c.y },
          ],
          [
            { x: c.x - 100, y: c.y },
            { x: c.x + 100, y: c.y },
          ],
        );
      }
      if (PAUSE > 0) await page.waitForTimeout(PAUSE);
      await label('one finger');
      await move([c], [{ x: c.x - 120, y: c.y + 40 }]);
      for (const [name, number] of [
        ['Zürich', 261],
        ['Bern', 351],
        ['Davos', 3851],
      ]) {
        await page.waitForTimeout(150);
        await label(`Ganze Schweiz before ${name}`);
        await page.getByRole('button', { name: 'Ganze Schweiz' }).tap();
        await page.waitForTimeout(100);
        const point = await pointIn(page, number);
        await page.waitForTimeout(50);
        await label(`tap ${name}`);
        await page.touchscreen.tap(point.x, point.y);
        await page.waitForTimeout(100);
      }
    } else {
      await label('first tap, Zürich');
      await page.touchscreen.tap(zurich.x, zurich.y);
      await page.waitForTimeout(300);
      await label('next tap, Bern');
      await page.touchscreen.tap(bern.x, bern.y);
      await page.waitForTimeout(300);
    }
    const traced = JSON.parse((await browser.stopTracing()).toString());
    const frames = await page.evaluate(() => window.__frames);
    for (const f of frames) {
      if (AFTER_FINGERS && f.work <= 8) continue;
      console.log(`run ${String(run)}, ${String(f.input)}, ${f.type} ${f.work.toFixed(1)} ms`);
      if (f.work > 8) console.log(`  ${String(breakdown(traced, f.id))}`);
    }
    await page.close();
  }
  await browser.close();
})();
