// Found while applying add-limits (investigations/limits.md, 8): the frames of a drag of a limit,
// the sequence of the browser test "the budget of dragging", with a Chrome trace that splits each
// of the longest frames into the main thread's work by the self time of each kind of event, and
// gives the top-level tasks' wall time against their CPU time (`tdur`).
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/limits/measure_drag.cjs [--runs 5] [--steps 20] [--trace <dir outside the repo>] [--busy]
// --busy runs a second drag in another browser at the same time, as a second worker does.
const { chromium } = require('playwright');
const path = require('node:path');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i < 0 ? fallback : args[i + 1];
};
const RUNS = Number(option('--runs', '5'));
const STEPS = Number(option('--steps', '20'));
const TRACE_DIR = option('--trace', null);
const BUSY = args.includes('--busy');

// As the browser tests' MEASURE_FRAMES (app/e2e/frames.ts), with user-timing marks around each
// frame, so that the trace can be cut at them.
const MEASURE = `
  window.__frames = [];
  const started = new WeakMap();
  let next = 0;
  for (const type of ['pointermove', 'input']) {
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

// Self time of each event name on the renderer's main thread between two user-timing marks.
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
  // The top-level tasks' wall time and the main thread's CPU time in them (`tdur`, the thread's
  // own clock): much less CPU than wall time means the thread waited for a processor.
  let wall = 0;
  let cpu = 0;
  for (const e of main) {
    while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts)
      stack.pop();
    const parent = stack[stack.length - 1];
    const clipped = Math.min(e.ts + e.dur, end.ts) - Math.max(e.ts, begin.ts);
    self.set(e.name, (self.get(e.name) ?? 0) + clipped);
    if (parent) {
      self.set(parent.name, (self.get(parent.name) ?? 0) - clipped);
    } else if (e.tdur !== undefined && e.dur > 0) {
      wall += clipped;
      cpu += (e.tdur * clipped) / e.dur;
    }
    stack.push(e);
  }
  const busy = [...self.values()].reduce((a, b) => a + b, 0);
  return (
    `busy ${(busy / 1000).toFixed(1)} of ${((end.ts - begin.ts) / 1000).toFixed(1)} ms ` +
    `(top-level tasks: wall ${(wall / 1000).toFixed(1)}, cpu ${(cpu / 1000).toFixed(1)}): ` +
    [...self.entries()]
      .filter(([, us]) => us > 300)
      .sort((a, b) => b[1] - a[1])
      .map(([name, us]) => `${name} ${(us / 1000).toFixed(1)}`)
      .join(', ')
  );
}

/** Open a vote's page, add the limit "Einwohner", and drag its lower bound across and back. */
async function drag(browser, trace, run) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(MEASURE);
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
  await page.evaluate(() => {
    window.__frames = [];
  });
  if (trace) {
    await browser.startTracing(page, {
      path: path.join(TRACE_DIR, `drag-${run}.json`),
      categories: [
        'devtools.timeline',
        'disabled-by-default-devtools.timeline',
        'blink.user_timing',
        'v8.execute',
        'disabled-by-default-v8.gc',
        'toplevel',
      ],
    });
  }
  await page.mouse.down();
  await page.mouse.move(right, y, { steps: STEPS });
  await page.mouse.move(left, y, { steps: STEPS });
  await page.mouse.up();
  await page.waitForTimeout(100);
  const frames = await page.evaluate(() => window.__frames);
  const traced = trace ? JSON.parse((await browser.stopTracing()).toString()) : null;
  await context.close();
  return { frames, traced };
}

(async () => {
  const browser = await chromium.launch();
  const other = BUSY ? await chromium.launch() : null;
  for (let run = 1; run <= RUNS; run += 1) {
    const busy = other ? drag(other, false, run) : null;
    const { frames, traced } = await drag(browser, Boolean(TRACE_DIR), run);
    if (busy) await busy;
    const inputs = frames.filter((f) => f.type === 'input');
    const sorted = [...inputs].sort((a, b) => b.work - a.work);
    console.log(
      `run ${run}: ${inputs.length} input frames, longest ${sorted[0].work.toFixed(1)} ms, ` +
        `median ${sorted[Math.floor(sorted.length / 2)].work.toFixed(1)} ms`,
    );
    if (traced) {
      for (const f of sorted.slice(0, 3)) {
        console.log(`  input ${f.work.toFixed(1)} ms: ${breakdown(traced, f.id)}`);
      }
    }
  }
  await browser.close();
  if (other) await other.close();
})();
