// Found while applying add-small-screens (investigations/small-screens.md, 8): two things this
// machine's browser does with a tap on a phone 412 pixels wide.
// 1. A tap on "Ganze Schweiz" soon after a finger left an element with touch-action: none: does
//    it still get its click? After a move of one finger over the map, over a paragraph, and over
//    that paragraph with touch-action: none, with a pause of 0 to 150 ms before the tap.
// 2. A tap on a municipality at the whole of Switzerland, at a point inside it whose neighbours
//    within 0, 2 or 4 pixels are inside too: which municipality gets the tap's events?
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --dev --port 4174) &
//   node investigations/small-screens/taps.cjs
const { chromium, devices } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/de/votes/5960/';

async function open(browser) {
  const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
  const context = await browser.newContext(pixel);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto(BASE);
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator('.map svg').scrollIntoViewIfNeeded();
  return { context, page, cdp };
}

/** One finger moved 120 pixels to the right in ten steps, an animation frame after each. */
async function swipe(page, cdp, at) {
  const send = (type, points) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: points.map((p) => ({ x: p.x, y: p.y, id: 1 })),
    });
  const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
  await send('touchStart', [at]);
  await frame();
  for (let step = 1; step <= 10; step += 1) {
    await send('touchMove', [{ x: at.x + 12 * step, y: at.y }]);
    await frame();
  }
  await send('touchEnd', []);
  await frame();
}

async function clickAfter(browser, over, pause) {
  const { context, page, cdp } = await open(browser);
  await page.getByRole('button', { name: 'Vergrössern' }).click();
  if (over === 'paragraph, none') {
    await page.addStyleTag({ content: '.source { touch-action: none; }' });
  }
  const box = await page.locator(over === 'map' ? '.map svg' : '.source').boundingBox();
  const at =
    over === 'map'
      ? { x: box.x + box.width / 2, y: box.y + box.height / 2 }
      : { x: box.x + 20, y: box.y + box.height / 2 };
  await swipe(page, cdp, at);
  if (pause > 0) await page.waitForTimeout(pause);
  await page.evaluate(() => {
    window.__clicks = 0;
    document.addEventListener('click', () => (window.__clicks += 1), true);
  });
  await page.getByRole('button', { name: 'Ganze Schweiz' }).tap();
  await page.waitForTimeout(300);
  const clicks = await page.evaluate(() => window.__clicks);
  await context.close();
  return clicks > 0 ? 'click' : 'no click';
}

async function tapWithMargin(browser, number, margin) {
  const { context, page } = await open(browser);
  const point = await page
    .locator(`.municipalities [data-number="${String(number)}"]`)
    .evaluate((path, around) => {
      const box = path.getBBox();
      const matrix = path.getScreenCTM();
      for (let i = 1; i < 40; i += 1) {
        for (let j = 1; j < 40; j += 1) {
          const inside = new DOMPoint(box.x + (box.width * i) / 40, box.y + (box.height * j) / 40);
          if (!path.isPointInFill(inside)) continue;
          const p = inside.matrixTransform(matrix);
          const offsets = [
            [0, 0],
            [-around, 0],
            [around, 0],
            [0, -around],
            [0, around],
          ];
          if (offsets.every(([dx, dy]) => document.elementFromPoint(p.x + dx, p.y + dy) === path)) {
            return { x: p.x, y: p.y };
          }
        }
      }
      return null;
    }, margin);
  let result = 'no such point';
  if (point !== null) {
    await page.evaluate(() => {
      window.__down = null;
      document.addEventListener(
        'pointerdown',
        (e) =>
          (window.__down = `${String(e.target.dataset.number)} at ${String(Math.round(e.clientX))},${String(Math.round(e.clientY))}`),
        true,
      );
    });
    await page.touchscreen.tap(point.x, point.y);
    await page.waitForTimeout(100);
    const down = await page.evaluate(() => window.__down);
    result = `tap at ${String(Math.round(point.x))},${String(Math.round(point.y))}: ${String(down)}`;
  }
  await context.close();
  return result;
}

(async () => {
  const browser = await chromium.launch();
  for (const over of ['map', 'paragraph', 'paragraph, none']) {
    const results = [];
    for (const pause of [0, 20, 50, 100, 150]) {
      results.push(`${String(pause)} ms: ${await clickAfter(browser, over, pause)}`);
    }
    console.log(`a tap after one finger over the ${over}: ${results.join(', ')}`);
  }
  for (const [name, number] of [
    ['Genève', 6621],
    ['Davos', 3851],
    ['Lausanne', 5586],
  ]) {
    const results = [];
    for (const margin of [0, 2, 4]) {
      results.push(`margin ${String(margin)}: ${await tapWithMargin(browser, number, margin)}`);
    }
    console.log(`${name} (${String(number)}): ${results.join('; ')}`);
  }
  await browser.close();
})();
