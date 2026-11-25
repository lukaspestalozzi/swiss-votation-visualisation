// The measurement of the budget tests (spec result-map and spec limits).
import type { Page } from '@playwright/test';

// The work of each frame after an input, on the page's main thread (design of add-result-map,
// decision 10): from a listener on `window` that runs before the app's handlers to one that runs
// after them, plus the frame itself, from an animation frame asked for before the app's own to a
// task that runs once the frame is drawn. The limits' sliders send `input`, their list and switch
// `change` (design of add-limits, decision 8).
export const MEASURE_FRAMES = `
  window.__frames = [];
  const started = new WeakMap();
  for (const type of ['wheel', 'pointermove', 'pointerover', 'click', 'input', 'change']) {
    window.addEventListener(type, (event) => {
      const entry = { type, start: performance.now(), handled: 0 };
      started.set(event, entry);
      requestAnimationFrame(() => {
        const frame = performance.now();
        setTimeout(() => {
          const handlers = (entry.handled || frame) - entry.start;
          window.__frames.push({ type, work: Math.max(0, handlers) + (performance.now() - frame) });
        });
      });
    }, { capture: true, passive: true });
    window.addEventListener(type, (event) => {
      const entry = started.get(event);
      if (entry) entry.handled = performance.now();
    }, { passive: true });
  }
`;

/**
 * The work of the frame after the address's hash changes (spec share-link, "The budget of a
 * link"), measured as MEASURE_FRAMES measures an input's. The event is fired at `window` itself,
 * where Chromium runs the listeners in the order they were added, with capture or without
 * (investigations/share-link.md, "Found while applying"): this script, added before the page
 * loads, marks the start before the page's own listener, and HASHCHANGE_HANDLED, added once the
 * page has loaded, the end after it.
 */
export const MEASURE_HASHCHANGE = `
  window.__frames = [];
  window.__hashchanges = [];
  window.addEventListener('hashchange', () => {
    const measured = { start: performance.now(), handled: 0 };
    window.__hashchanges.push(measured);
    requestAnimationFrame(() => {
      const frame = performance.now();
      setTimeout(() => {
        const handlers = (measured.handled || frame) - measured.start;
        window.__frames.push({
          type: 'hashchange',
          work: Math.max(0, handlers) + (performance.now() - frame),
        });
      });
    });
  });
`;

/** The end of the page's handlers of a hash's change, for MEASURE_HASHCHANGE. */
export const HASHCHANGE_HANDLED = `
  window.addEventListener('hashchange', () => {
    const measured = window.__hashchanges.at(-1);
    if (measured) measured.handled = performance.now();
  });
`;

/**
 * Wait until the page's fonts have loaded, so that the font's arrival, which sets the text anew,
 * is never one of the frames a budget test measures (design of add-site-style, "Tests").
 */
export async function fontsLoaded(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

/**
 * The budget of a step of a slider or of an input of the map (spec result-map, "The map's
 * performance budget"; design of redesign-site, decision 31): of a measurement's frames, at least
 * nine in ten take at most 16 ms, and none more than 50 ms. It gives the frames that break it,
 * for a test's message: those over 16 ms when they are more than a tenth, otherwise those over
 * 50 ms; none when the measurement keeps the budget.
 */
export function beyondBudget<Frame extends { work: number }>(frames: readonly Frame[]): Frame[] {
  const slow = frames.filter((frame) => frame.work > 16);
  return slow.length * 10 > frames.length ? slow : slow.filter((frame) => frame.work > 50);
}

/** The frames measured since the page began or was last cleared, printed for the log. */
export async function measuredFrames(page: Page): Promise<{ type: string; work: number }[]> {
  await page.waitForTimeout(100);
  const frames = await page.evaluate(
    () => (window as unknown as { __frames: { type: string; work: number }[] }).__frames,
  );
  console.log(
    `frames: ${String(frames.length)}, longest ${Math.max(...frames.map((f) => f.work)).toFixed(1)} ms;`,
    frames.map((f) => `${f.type} ${f.work.toFixed(1)}`).join(', '),
  );
  return frames;
}
