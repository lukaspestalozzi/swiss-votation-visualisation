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
 * Wait until the page's fonts have loaded, so that the font's arrival, which sets the text anew,
 * is never one of the frames a budget test measures (design of add-site-style, "Tests").
 */
export async function fontsLoaded(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
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
