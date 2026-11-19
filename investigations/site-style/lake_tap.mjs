// Found while applying add-site-style (investigations/site-style.md, 7): the tap of
// app/e2e/result-map.spec.ts "tapping a lake" on a phone (Playwright's Pixel 7). Zürich is
// tapped, then "+" `zooms` times, then a lake at a point `margin` pixels inside its shore, as the
// test's `pointIn` finds it. The lake is the one whose centre lies nearest Zürich's (`nearest`,
// what the test took before) or the one whose box overlaps Zürich's (`overlap`, the Zürichsee,
// what it takes now). It prints the map's and the lake's size on the screen, the point, the shape
// at that point, and the details the tap shows.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/site-style/lake_tap.mjs <repository> nearest|overlap <zooms> <margin>
import { createRequire } from 'node:module';

const { chromium, devices } = createRequire(import.meta.url)('playwright');
const [repository, which, zooms, margin] = [
  process.argv[2],
  process.argv[3],
  Number(process.argv[4]),
  Number(process.argv[5]),
];
const { pointIn } = await import(`${repository}/app/e2e/pointing.ts`);
const { defaultBrowserType: _ignored, ...pixel } = devices['Pixel 7'];

const browser = await chromium.launch();
const page = await (await browser.newContext(pixel)).newPage();
await page.goto('http://localhost:4174/swiss-votation-visualisation/de/votes/5960/');
await page.locator('.municipalities path').nth(2000).waitFor();
await page.locator('.map svg').scrollIntoViewIfNeeded();
const map = await page.locator('.map svg').boundingBox();
const zurich = await pointIn(page, '.municipalities [data-number="261"]');
await page.touchscreen.tap(zurich.x, zurich.y);
for (let i = 0; i < zooms; i += 1) await page.getByRole('button', { name: 'Vergrössern' }).tap();
const index = await page.evaluate((how) => {
  const city = document.querySelector('.municipalities [data-number="261"]').getBBox();
  const lakes = [...document.querySelectorAll('.lakes path')].map((lake, at) => ({
    at,
    box: lake.getBBox(),
  }));
  if (how === 'nearest') {
    const centre = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
    const c = centre(city);
    const distance = ({ box }) => Math.hypot(centre(box).x - c.x, centre(box).y - c.y);
    return lakes.sort((a, b) => distance(a) - distance(b))[0].at;
  }
  const touching = lakes.filter(
    ({ box }) =>
      box.x < city.x + city.width &&
      city.x < box.x + box.width &&
      box.y < city.y + city.height &&
      city.y < box.y + box.height,
  );
  return touching.sort((a, b) => b.box.width * b.box.height - a.box.width * a.box.height)[0].at;
}, which);
const selector = `.lakes path >> nth=${String(index)}`;
const lake = await page.locator(selector).boundingBox();
const point = await pointIn(page, selector, margin);
const atPoint = await page.evaluate(({ x, y }) => {
  const element = document.elementFromPoint(x, y);
  return element?.closest('.lakes') ? 'a lake' : (element?.getAttribute('data-number') ?? 'other');
}, point);
await page.touchscreen.tap(point.x, point.y);
await page.waitForTimeout(300);
console.log(
  JSON.stringify({
    which,
    zooms,
    margin,
    map: `${map.width.toFixed(1)} x ${map.height.toFixed(1)}`,
    lake: `${lake.width.toFixed(1)} x ${lake.height.toFixed(1)}`,
    point: `${point.x.toFixed(1)}, ${point.y.toFixed(1)}`,
    atPoint,
    details: await page.locator('.details .name').allTextContents(),
  }),
);
await browser.close();
