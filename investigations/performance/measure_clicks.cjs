// The frames after clicks on the map (investigations/performance.md): the sequence of the browser
// test "the budget of clicking", repeated in fresh pages, each frame labelled with its input and
// its target. With --trace, a Chrome trace of each run splits every frame over 16 ms into the
// main thread's work, by the self time of each kind of event.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/performance/measure_clicks.cjs [--runs 20] [--trace <dir outside the repo>]
//        [--no-reset] [--threshold 16] [--dump] [--end timeout|message|posttask] [--pause 50] [--fresh]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i < 0 ? fallback : args[i + 1];
};
const RUNS = Number(option('--runs', '20'));
const TRACE_DIR = option('--trace', null);
const THRESHOLD = Number(option('--threshold', '16'));
const RESET = !args.includes('--no-reset');
// How a frame's measurement ends once the frame is drawn: a timer, as the browser tests do, a
// message on a channel, or a task of the highest priority.
const END = option('--end', 'timeout');
// A pause between the pointer's arrival and the click, in ms.
const PAUSE = Number(option('--pause', '0'));
// A new browser for every run, as for a first visit; otherwise one browser for all runs.
const FRESH = args.includes('--fresh');
const AFTER = {
  timeout: 'setTimeout(done)',
  message: '{ const c = new MessageChannel(); c.port1.onmessage = done; c.port2.postMessage(0); }',
  posttask: "scheduler.postTask(done, { priority: 'user-blocking' })",
}[END];

// As the browser tests' MEASURE_FRAMES, with a label and user-timing marks around each frame.
const MEASURE = () => `
  window.__frames = [];
  const started = new WeakMap();
  let next = 0;
  const label = (event) => {
    const t = event.target;
    if (!(t instanceof Element)) return '';
    if (t.closest('button')) return 'button ' + t.closest('button').textContent.trim();
    if (t.dataset && t.dataset.number) return 'path ' + t.dataset.number;
    return t.tagName.toLowerCase() + (t.className && typeof t.className === 'string' ? '.' + t.className : '');
  };
  for (const type of ['wheel', 'pointermove', 'pointerover', 'click']) {
    window.addEventListener(type, (event) => {
      const id = next++;
      const entry = { id, type, target: label(event), start: performance.now(), handled: 0 };
      performance.mark('in-' + id);
      started.set(event, entry);
      requestAnimationFrame(() => {
        const frame = performance.now();
        const done = () => {
          const handlers = (entry.handled || frame) - entry.start;
          performance.mark('out-' + id);
          window.__frames.push({ id, type, target: entry.target,
            work: Math.max(0, handlers) + (performance.now() - frame) });
        };
        ${AFTER};
      });
    }, { capture: true, passive: true });
    window.addEventListener(type, (event) => {
      const entry = started.get(event);
      if (entry) entry.handled = performance.now();
    }, { passive: true });
  }
`;

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

(async () => {
  let browser = await chromium.launch();
  const long = [];
  const longest = [];
  for (let run = 1; run <= RUNS; run += 1) {
    if (FRESH && run > 1) {
      await browser.close();
      browser = await chromium.launch();
    }
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(MEASURE());
    await page.goto(BASE + 'votes/5960/');
    await page.locator('.municipalities path').nth(2000).waitFor();
    await page.locator('.panel').getByText('Klicken Sie auf eine Gemeinde').waitFor();
    await page.evaluate(() => {
      window.__frames = [];
    });
    if (TRACE_DIR) {
      await browser.startTracing(page, {
        path: path.join(TRACE_DIR, `run-${run}.json`),
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
    for (const number of [261, 351, 6621]) {
      if (RESET) await page.getByRole('button', { name: 'Ganze Schweiz' }).click();
      const point = await pointIn(page, `.municipalities [data-number="${number}"]`);
      await page.mouse.move(point.x, point.y, { steps: 5 });
      if (PAUSE > 0) await page.waitForTimeout(PAUSE);
      await page.mouse.click(point.x, point.y);
    }
    await page.locator('.panel .name').getByText('Genève (GE)').waitFor();
    await page.waitForTimeout(100);
    const frames = await page.evaluate(() => window.__frames);
    let trace = null;
    if (TRACE_DIR) trace = JSON.parse((await browser.stopTracing()).toString());
    if (args.includes('--dump') && run <= 3) {
      console.log(
        `run ${run}: ` + frames.map((f) => `${f.type} ${f.target} ${f.work.toFixed(1)}`).join('; '),
      );
    }
    const max = Math.max(...frames.map((f) => f.work));
    longest.push(max);
    for (const [i, f] of frames.entries()) {
      if (f.work <= THRESHOLD) continue;
      const before = frames
        .slice(Math.max(0, i - 2), i)
        .map((g) => `${g.type} ${g.target}`)
        .join(' | ');
      const split = trace ? breakdown(trace, f.id) : null;
      long.push(
        `run ${run}, frame ${i + 1} of ${frames.length}: ${f.type} ${f.target} ${f.work.toFixed(1)} ms` +
          ` (after: ${before})` +
          (split ? `\n    ${split}` : ''),
      );
    }
    await context.close();
  }
  await browser.close();
  console.log(
    `runs: ${RUNS}, fresh: ${FRESH}, end: ${END}, pause: ${PAUSE} ms, reset: ${RESET}, trace: ${Boolean(TRACE_DIR)}, threshold: ${THRESHOLD} ms`,
  );
  console.log(`longest frame per run: ${longest.map((m) => m.toFixed(1)).join(', ')}`);
  console.log(
    `runs with a frame over ${THRESHOLD} ms: ${longest.filter((m) => m > THRESHOLD).length}`,
  );
  for (const line of long) console.log(line);
})();
