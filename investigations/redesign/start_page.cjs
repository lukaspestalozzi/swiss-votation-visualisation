// Found while applying (investigations/redesign.md, "Found while applying"): the start page by
// window and language. For each, the page's size, the narrowest title of a row, the widest share
// and the widest result with its marks, and how many of them reach past their box; then, after
// the link to 2016 is followed, the height of the part that stays at the top (the field, the
// buttons, the years), the room a year keeps for it, and where the year and its heading stand.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/redesign/start_page.cjs
const { chromium, devices } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const WINDOWS = [
  ['1920 x 1080', { viewport: { width: 1920, height: 1080 } }],
  ['1280 x 800', { viewport: { width: 1280, height: 800 } }],
  ['1024 x 768', { viewport: { width: 1024, height: 768 } }],
  ['1023 x 768', { viewport: { width: 1023, height: 768 } }],
  ['768 x 800', { viewport: { width: 768, height: 800 } }],
  ['700 x 800', { viewport: { width: 700, height: 800 } }],
  ['640 x 800', { viewport: { width: 640, height: 800 } }],
  ['360 x 740', { viewport: { width: 360, height: 740 } }],
  ['a phone', { ...devices['Pixel 7'] }],
  ['a phone held wide', { ...devices['Pixel 7 landscape'] }],
];

(async () => {
  const browser = await chromium.launch();
  for (const [name, options] of WINDOWS) {
    for (const language of ['de', 'fr', 'it']) {
      const context = await browser.newContext(options);
      const page = await context.newPage();
      await page.goto(`${BASE}${language}/`);
      await page.evaluate(() => document.fonts.ready);
      const rows = await page.evaluate(() => {
        const widest = (selector) =>
          Math.max(
            ...[...document.querySelectorAll(selector)].map((part) => {
              const range = document.createRange();
              range.selectNodeContents(part);
              return range.getBoundingClientRect().width;
            }),
          );
        const over = [...document.querySelectorAll('.vote-share, .vote-result')].filter(
          (part) => part.scrollWidth > part.clientWidth + 0.5,
        ).length;
        return {
          page: `${document.documentElement.scrollWidth} x ${document.documentElement.scrollHeight}`,
          'narrowest title': Math.round(
            Math.min(
              ...[...document.querySelectorAll('.vote-title')].map(
                (part) => part.getBoundingClientRect().width,
              ),
            ),
          ),
          'widest share': Math.round(widest('.vote-share:not(.alone)') * 10) / 10,
          'widest result': Math.round(widest('.vote-result') * 10) / 10,
          'past their box': over,
        };
      });
      await page.locator('nav.years a', { hasText: '2016' }).click();
      await page.waitForTimeout(300);
      const stays = await page.evaluate(() => {
        const year = document.querySelector('#y2016');
        return {
          stays: Math.round(document.querySelector('.finder').getBoundingClientRect().height),
          room: Math.round(parseFloat(getComputedStyle(year).scrollMarginTop)),
          'year at': Math.round(year.getBoundingClientRect().top),
          'heading at': Math.round(year.querySelector('h2').getBoundingClientRect().top),
        };
      });
      console.log(`${name} ${language}:`, JSON.stringify({ ...rows, ...stays }));
      await context.close();
    }
  }
  await browser.close();
})();
