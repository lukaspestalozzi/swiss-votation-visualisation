// How to run (investigations/performance.md, M10): copy this file into app/e2e/, build, run
// `TRACE_DIR=<dir outside the repo> pnpm --filter app exec playwright test e2e/zz-trace-spike.spec.ts --repeat-each 10 --trace off`
// right after `pnpm run build`, and delete the copy afterwards; it is not one of the browser tests.
// TEMPORARY spike (investigations/performance.md), not to be committed: the two budget tests of
// result-map.spec.ts with a Chrome trace, logging CPU against wall time of every frame over 16 ms.
import { writeFileSync } from 'node:fs';
import { test, type Page } from '@playwright/test';

const OUT = process.env.TRACE_DIR ?? '/tmp';
const MEASURE = `
  window.__frames = [];
  const started = new WeakMap();
  let next = 0;
  for (const type of ['wheel', 'pointermove', 'pointerover', 'click']) {
    window.addEventListener(type, (event) => {
      const id = next++;
      const entry = { id, type, start: performance.now(), handled: 0 };
      performance.mark('in-' + id);
      started.set(event, entry);
      requestAnimationFrame(() => {
        const frame = performance.now();
        setTimeout(() => {
          const handlers = (entry.handled || frame) - entry.start;
          performance.mark('out-' + id);
          window.__frames.push({ id, type, work: Math.max(0, handlers) + (performance.now() - frame) });
        });
      });
    }, { capture: true, passive: true });
    window.addEventListener(type, (event) => {
      const entry = started.get(event);
      if (entry) entry.handled = performance.now();
    }, { passive: true });
  }
`;

type Ev = {
  name: string;
  cat: string;
  ph: string;
  ts: number;
  dur?: number;
  tdur?: number;
  pid: number;
  tid: number;
};

function breakdown(events: Ev[], id: number): string {
  const mark = (n: string) =>
    events.find((e) => e.name === n && e.cat.includes('blink.user_timing'));
  const begin = mark(`in-${id}`);
  const end = mark(`out-${id}`);
  if (!begin || !end) return 'no marks';
  const main = events
    .filter(
      (e) =>
        e.pid === begin.pid &&
        e.tid === begin.tid &&
        e.ph === 'X' &&
        e.dur !== undefined &&
        e.ts < end.ts &&
        e.ts + (e.dur ?? 0) > begin.ts,
    )
    .sort((a, b) => a.ts - b.ts || (b.dur ?? 0) - (a.dur ?? 0));
  const self = new Map<string, number>();
  const stack: Ev[] = [];
  let wall = 0;
  let cpu = 0;
  for (const e of main) {
    while (stack.length && stack[stack.length - 1].ts + (stack[stack.length - 1].dur ?? 0) <= e.ts)
      stack.pop();
    const parent = stack[stack.length - 1];
    const clipped = Math.min(e.ts + (e.dur ?? 0), end.ts) - Math.max(e.ts, begin.ts);
    self.set(e.name, (self.get(e.name) ?? 0) + clipped);
    if (parent) self.set(parent.name, (self.get(parent.name) ?? 0) - clipped);
    else if (e.tdur !== undefined && (e.dur ?? 0) > 0) {
      wall += clipped;
      cpu += (e.tdur * clipped) / (e.dur ?? 1);
    }
    stack.push(e);
  }
  const busy = [...self.values()].reduce((a, b) => a + b, 0);
  const top = [...self.entries()]
    .filter(([, us]) => us > 500)
    .sort((a, b) => b[1] - a[1])
    .map(([n, us]) => `${n} ${(us / 1000).toFixed(1)}`)
    .join(', ');
  return `window ${((end.ts - begin.ts) / 1000).toFixed(1)}, busy ${(busy / 1000).toFixed(1)}, top-level wall ${(wall / 1000).toFixed(1)} cpu ${(cpu / 1000).toFixed(1)}: ${top}`;
}

async function pointIn(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  return page.locator(selector).evaluate((element) => {
    const path = element as SVGPathElement;
    const box = path.getBBox();
    const matrix = path.getScreenCTM();
    if (matrix === null) throw new Error('off screen');
    for (let i = 1; i < 40; i += 1)
      for (let j = 1; j < 40; j += 1) {
        const inside = new DOMPoint(box.x + (box.width * i) / 40, box.y + (box.height * j) / 40);
        if (!path.isPointInFill(inside)) continue;
        const p = inside.matrixTransform(matrix);
        if (document.elementFromPoint(p.x, p.y) === path) return { x: p.x, y: p.y };
      }
    throw new Error('no point');
  });
}

async function traced(page: Page, label: string, act: () => Promise<void>) {
  const browser = page.context().browser();
  if (browser === null) throw new Error('no browser');
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
  await page.evaluate(() => {
    (window as unknown as { __frames: unknown[] }).__frames = [];
  });
  await act();
  await page.waitForTimeout(100);
  const frames = await page.evaluate(
    () =>
      (window as unknown as { __frames: { id: number; type: string; work: number }[] }).__frames,
  );
  const buffer = await browser.stopTracing();
  const long = frames.filter((f) => f.work > 16);
  console.log(
    `${label}: frames ${frames.length}, longest ${Math.max(...frames.map((f) => f.work)).toFixed(1)}, over 16: ${long.length}`,
  );
  if (long.length === 0) return;
  const events = (JSON.parse(buffer.toString()) as { traceEvents: Ev[] }).traceEvents;
  const file = `${OUT}/${label}-${Date.now()}.json`;
  writeFileSync(file, buffer);
  for (const f of long) {
    const i = frames.indexOf(f);
    console.log(
      `  LONG ${label} frame ${i + 1} ${f.type} ${f.work.toFixed(1)} (before: ${frames
        .slice(Math.max(0, i - 2), i)
        .map((g) => `${g.type} ${g.work.toFixed(1)}`)
        .join(' | ')}) ${breakdown(events, f.id)} [${file}]`,
    );
  }
}

test('spike: zoom, move, point', async ({ page }) => {
  await page.addInitScript(MEASURE);
  await page.goto('votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator('.panel').getByText('Klicken Sie auf eine Gemeinde').waitFor();
  await page.locator('.map svg').scrollIntoViewIfNeeded();
  const box = await page.locator('.map svg').boundingBox();
  if (box === null) throw new Error('no map');
  await traced(page, 'zoom', async () => {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 4; i += 1) {
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(50);
    }
    const b = await page.locator('.map svg').boundingBox();
    if (b === null) throw new Error('no map');
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2 - 120, b.y + b.height / 2 + 40, { steps: 10 });
    await page.mouse.up();
    for (const number of [261, 351, 6621]) {
      await page.getByRole('button', { name: 'Ganze Schweiz' }).click();
      const point = await pointIn(page, `.municipalities [data-number="${String(number)}"]`);
      await page.mouse.move(point.x, point.y, { steps: 5 });
    }
  });
});

test('spike: clicking', async ({ page }) => {
  await page.addInitScript(MEASURE);
  await page.goto('votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator('.panel').getByText('Klicken Sie auf eine Gemeinde').waitFor();
  await traced(page, 'click', async () => {
    for (const number of [261, 351, 6621]) {
      await page.getByRole('button', { name: 'Ganze Schweiz' }).click();
      const point = await pointIn(page, `.municipalities [data-number="${String(number)}"]`);
      await page.mouse.move(point.x, point.y, { steps: 5 });
      await page.waitForTimeout(50);
      await page.mouse.click(point.x, point.y);
    }
  });
});
