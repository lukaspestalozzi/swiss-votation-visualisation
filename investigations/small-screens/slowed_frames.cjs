// Found while proposing add-small-screens (investigations/small-screens.md, 6): the frames of the
// budget tests' inputs with the CPU slowed as Chrome's DevTools slow it to imitate a phone (4×,
// "mid-tier mobile"; 6×, "low-end mobile"), measured as the browser tests measure them
// (app/e2e/frames.ts): the map zoomed by the wheel and dragged, a click on Zürich that fills the
// panel, and the upper bound of "Ausländeranteil" dragged in 20 steps. Mouse inputs, on a page
// 1,280 pixels wide: what a frame costs, whatever the input.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/small-screens/slowed_frames.cjs [runs per rate, default 3]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const MEASURE = fs
  .readFileSync(path.join(__dirname, '../../app/e2e/frames.ts'), 'utf8')
  .match(/MEASURE_FRAMES = `([\s\S]*?)`;/)[1];
const RUNS = Number(process.argv[2] ?? '3');

async function run(browser, rate) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(MEASURE);
  await page.goto(BASE + 'de/votes/5960/');
  await page.locator('svg[role="img"] path[data-number]').first().waitFor();
  await page.waitForFunction(() => !document.body.textContent.includes('werden geladen'));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  const frames = () =>
    page.evaluate(() => {
      const measured = window.__frames;
      window.__frames = [];
      return measured;
    });
  const longest = (measured) => Math.max(...measured.map((frame) => frame.work));

  const box = await page.locator('svg[role="img"]').boundingBox();
  const mid = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(mid.x, mid.y);
  await page.waitForTimeout(300);
  await frames();
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(150);
  }
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(mid.x - i * 10, mid.y);
    await page.waitForTimeout(30);
  }
  await page.mouse.up();
  await page.waitForTimeout(300);
  const map = await frames();

  await page.getByRole('button', { name: 'Ganze Schweiz' }).click();
  await page.waitForTimeout(300);
  await frames();
  const zurich = await page.evaluate(() => {
    const r = document.querySelector('path[data-number="261"]').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.move(zurich.x, zurich.y);
  await page.waitForTimeout(50);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(400);
  const click = (await frames()).filter((frame) => frame.type === 'click');

  await page.getByLabel('Merkmal hinzufügen').selectOption('Ausländeranteil');
  await page.getByRole('button', { name: 'Hinzufügen' }).click();
  await page.waitForTimeout(500);
  const track = await page.getByLabel('Obere Grenze: Ausländeranteil').boundingBox();
  const y = track.y + track.height / 2;
  await page.mouse.move(track.x + track.width - 9, y);
  await page.waitForTimeout(200);
  await frames();
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(track.x + track.width - 9 - i * 12, y);
    await page.waitForTimeout(40);
  }
  await page.mouse.up();
  await page.waitForTimeout(400);
  const drag = (await frames()).filter((frame) => frame.type === 'input');
  await page.close();
  return { map: longest(map), click: longest(click), drag: longest(drag), steps: drag.length };
}

(async () => {
  const browser = await chromium.launch();
  for (const rate of [1, 4, 6]) {
    for (let i = 0; i < RUNS; i++) {
      const r = await run(browser, rate);
      console.log(
        `CPU ${String(rate)}× slower: longest frame of zoom and move ${r.map.toFixed(1)} ms, ` +
          `of the click ${r.click.toFixed(1)} ms, of the drag ${r.drag.toFixed(1)} ms ` +
          `(${String(r.steps)} steps)`,
      );
    }
  }
  await browser.close();
})();
