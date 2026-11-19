// A phone and fingers for the browser tests (design of add-small-screens, decision 13).
import { devices, type Page } from '@playwright/test';

// Playwright's Pixel 7, touch and a mobile viewport, in the tests' Chromium, without the device's
// choice of browser.
const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices['Pixel 7'];
export const phone = { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch };

interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Fingers on the page: touch points sent with Chrome's `Input.dispatchTouchEvent`, each with an id
 * of its own, so that a test knows where each finger is. Playwright's own touchscreen only taps.
 */
export async function fingersOn(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', points: readonly Point[]) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: points.map((point, i) => ({ x: point.x, y: point.y, id: i + 1 })),
    });
  const frame = () =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            resolve();
          });
        }),
    );
  return {
    /**
     * One touch event, its fingers named by id, an animation frame after it: on `touchStart` the
     * fingers that are down, on `touchMove` where they are, on `touchEnd` those that lift (none:
     * all of them).
     */
    async touch(
      type: 'touchStart' | 'touchMove' | 'touchEnd',
      points: readonly (Point & { readonly id: number })[],
    ): Promise<void> {
      await cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: points.map(({ x, y, id }) => ({ x, y, id })),
      });
      await frame();
    },
    /**
     * Put the fingers down at `from`, move each to its place in `to` in steps of at most 10
     * pixels, an animation frame after each step, and lift them.
     */
    async move(from: readonly Point[], to: readonly Point[]): Promise<void> {
      const longest = Math.max(
        ...from.map((start, i) => {
          const end = to[i] ?? start;
          return Math.hypot(end.x - start.x, end.y - start.y);
        }),
      );
      const steps = Math.max(1, Math.ceil(longest / 10));
      await send('touchStart', from);
      await frame();
      for (let step = 1; step <= steps; step += 1) {
        const at = from.map((start, i) => {
          const end = to[i] ?? start;
          return {
            x: start.x + ((end.x - start.x) * step) / steps,
            y: start.y + ((end.y - start.y) * step) / steps,
          };
        });
        await send('touchMove', at);
        await frame();
      }
      await send('touchEnd', []);
      await frame();
    },
  };
}
