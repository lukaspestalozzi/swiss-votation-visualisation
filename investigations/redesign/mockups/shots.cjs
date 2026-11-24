// The mockups as `build.mjs` wrote them to <dir> (investigations/redesign.md, 6): where the parts
// of a vote's page stand by window, each page's size, whether a page is wider than a window of
// 360 pixels, and, with --shots, a screenshot of each in windows 1,280 and 360 pixels wide, in
// the light and in the dark scheme, written to <dir>/shots.
//
// Usage: node investigations/redesign/mockups/shots.cjs <dir outside the repository> [--shots]
const { chromium } = require('playwright');
const { mkdirSync } = require('node:fs');
const path = require('node:path');

const dir = path.resolve(process.argv[2]);
const SHOTS = process.argv.includes('--shots');
const PAGES = ['vote-b', 'vote-b-real', 'start', 'compare', 'guide', 'parts'];
const mock = (name) => `file://${path.join(dir, `${name}.html`)}?clean`;

(async () => {
  const browser = await chromium.launch();
  const open = async (name, options, scheme = 'light') => {
    const page = await (await browser.newContext({ ...options, colorScheme: scheme })).newPage();
    await page.goto(mock(name));
    await page.evaluate(() => document.fonts.ready);
    return page;
  };

  // A vote's page by window: left, top, width and height of its parts.
  for (const [width, height] of [
    [1920, 1080],
    [1600, 900],
    [1280, 800],
    [1024, 768],
    [1023, 768],
    [640, 800],
    [480, 800],
    [360, 740],
  ]) {
    const page = await open('vote-b', { viewport: { width, height } });
    const box = (selector) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          return [r.x, r.y + window.scrollY, r.width, r.height].map(Math.round).join(' ');
        });
    const parts = {
      head: await box('.head-inner'),
      result: await box('.results'),
      map: await box('.map-svg'),
      limits: await box('.rail'),
      panel: await box('.panel'),
      cantons: await box('section.cantons'),
      'result and map': await page
        .locator('.watch')
        .evaluate((el) => getComputedStyle(el).position),
      page: await page.evaluate(
        () =>
          `${String(document.documentElement.scrollWidth)} x ${String(document.documentElement.scrollHeight)}`,
      ),
    };
    console.log(
      `${String(width)} x ${String(height)}: ${Object.entries(parts)
        .map(([k, v]) => `${k} ${v}`)
        .join(' | ')}`,
    );
    await page.close();
  }

  // Each page's size, and whether it is wider than a window of 360 pixels.
  for (const name of PAGES) {
    const sizes = [];
    for (const [width, height] of [
      [1280, 800],
      [360, 740],
    ]) {
      const page = await open(name, {
        viewport: { width, height },
        isMobile: width === 360,
        hasTouch: width === 360,
      });
      sizes.push(
        await page.evaluate(
          () =>
            `${String(document.documentElement.scrollWidth)} x ${String(document.documentElement.scrollHeight)}`,
        ),
      );
      await page.close();
    }
    console.log(`${name}: ${sizes[0]} in a window 1,280 wide, ${sizes[1]} in one 360 wide`);
  }

  if (SHOTS) {
    mkdirSync(path.join(dir, 'shots'), { recursive: true });
    for (const scheme of ['light', 'dark']) {
      for (const [windowName, options] of [
        ['1280', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }],
        [
          '360',
          {
            viewport: { width: 360, height: 740 },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
          },
        ],
      ]) {
        for (const name of PAGES) {
          const page = await open(name, options, scheme);
          await page.screenshot({
            path: path.join(dir, 'shots', `${name}-${windowName}-${scheme}.png`),
            fullPage: true,
          });
          await page.close();
        }
      }
    }
    console.log(`screenshots written to ${path.join(dir, 'shots')}`);
  }
  await browser.close();
})();
