// Found while proposing add-small-screens (investigations/small-screens.md, 3): what the map of a
// vote receives from fingers on a phone 412 pixels wide, sent as touch points with Chrome's
// Input.dispatchTouchEvent: a tap on Zürich (its details and the panel), then one finger and two
// fingers moved over the map. Prints the pointer events the map received and its view box.
// --touch-action <value> gives the map that CSS touch-action first; without it the map has the
// browser's default, auto, as the app sets no touch-action on 2026-11-18.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/small-screens/touch.cjs [--touch-action none]
const { chromium, devices } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const args = process.argv.slice(2);
const i = args.indexOf('--touch-action');
const TOUCH_ACTION = i < 0 ? null : args[i + 1];

(async () => {
  const browser = await chromium.launch();
  const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
  const context = await browser.newContext(pixel);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto(BASE + 'de/votes/5960/');
  const svg = page.locator('svg[role="img"]');
  await svg.locator('path[data-number]').first().waitFor();
  await page.waitForFunction(() => !document.body.textContent.includes('werden geladen'));
  await svg.scrollIntoViewIfNeeded();
  if (TOUCH_ACTION !== null) {
    await page.addStyleTag({ content: `svg[role="img"] { touch-action: ${TOUCH_ACTION}; }` });
  }
  await page.evaluate(() => {
    window.__log = [];
    const map = document.querySelector('svg[role="img"]');
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'click']) {
      map.addEventListener(type, (e) =>
        window.__log.push(`${type}#${String(e.pointerId)}@${String(Math.round(e.clientX))}`),
      );
    }
  });
  const events = () =>
    page.evaluate(() => {
      const log = window.__log;
      window.__log = [];
      return log.join(' ');
    });

  // A tap on Zürich.
  const zurich = await page.evaluate(() => {
    const r = document.querySelector('path[data-number="261"]').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.touchscreen.tap(zurich.x, zurich.y);
  await page.waitForTimeout(300);
  const shown = await page.evaluate(() => ({
    details: document.querySelector('.details').textContent.trim().slice(0, 30),
    panel: document.body.textContent.includes("Einwohner: 396'955"),
  }));
  console.log('tap on Zürich:', await events(), JSON.stringify(shown));

  // One finger, then two moving apart, each in five steps of 10 pixels per finger.
  const box = await svg.boundingBox();
  const y = box.y + box.height / 2;
  for (const fingers of [1, 2]) {
    await page.getByRole('button', { name: 'Ganze Schweiz' }).click();
    const before = await svg.getAttribute('viewBox');
    await events();
    const at = (step) =>
      fingers === 1
        ? [{ x: 250 + 10 * step, y, id: 2 }]
        : [
            { x: 150 - 10 * step, y, id: 1 },
            { x: 250 + 10 * step, y, id: 2 },
          ];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(0) });
    for (let step = 1; step <= 5; step++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(step) });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(200);
    console.log(
      `${String(fingers)} finger(s):`,
      await events(),
      `| view box ${String(before)} -> ${String(await svg.getAttribute('viewBox'))}`,
    );
  }
  await browser.close();
})();
