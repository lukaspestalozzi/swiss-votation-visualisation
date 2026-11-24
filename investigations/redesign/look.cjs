// The site of today (investigations/redesign.md, 1): for the start page, a vote's page without
// and with a selection, the comparison and the guide, in windows 1,280 and 360 pixels wide, the
// page's size; for the vote's page, how far down its parts begin. With a directory, a screenshot
// of each page in the light and in the dark scheme.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/redesign/look.cjs [<dir outside the repository>]
const { chromium } = require('playwright');
const path = require('node:path');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const out = process.argv[2] ?? null;

const PAGES = [
  ['start', 'de/'],
  ['vote', 'de/votes/5960/'],
  ['vote-selection', 'de/votes/5960/#foreigners=-19.98&inhabitants=3000-'],
  ['compare', 'de/compare/#votes=5960,5970&foreigners=-19.98'],
  ['guide', 'de/guide/'],
];
const WINDOWS = [
  ['1280 x 800', { viewport: { width: 1280, height: 800 } }],
  ['360 x 740', { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true }],
];

// The distance of a part's top from the top of the page.
const tops = () => {
  const top = (el) => (el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null);
  const heading = (text) =>
    [...document.querySelectorAll('h2')].find((h) => h.textContent.trim() === text);
  return {
    result: top(document.querySelector('.results')),
    limits: top(heading('Gemeinden auswählen')),
    'first slider': top(document.querySelector('input[type=range]')),
    map: top(document.querySelector('.map svg')),
    cantons: top(document.querySelector('table')),
  };
};

(async () => {
  const browser = await chromium.launch();
  for (const scheme of out === null ? ['light'] : ['light', 'dark']) {
    for (const [windowName, options] of WINDOWS) {
      const context = await browser.newContext({ ...options, colorScheme: scheme });
      const page = await context.newPage();
      for (const [name, address] of PAGES) {
        await page.goto('about:blank');
        await page.goto(BASE + address);
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);
        if (name.startsWith('vote'))
          await page.locator('.map svg path[data-number]').first().waitFor();
        if (out !== null) {
          const file = path.join(out, `${name}-${windowName.replaceAll(' ', '')}-${scheme}.png`);
          await page.screenshot({ path: file, fullPage: true });
        }
        if (scheme !== 'light') continue;
        const size = await page.evaluate(() => [
          document.documentElement.scrollWidth,
          document.documentElement.scrollHeight,
        ]);
        const parts = name.startsWith('vote')
          ? ' | tops: ' +
            Object.entries(await page.evaluate(tops))
              .map(([part, y]) => `${part} ${String(y)}`)
              .join(', ')
          : '';
        console.log(`${windowName} ${name}: ${size.join(' x ')}${parts}`);
      }
      await context.close();
    }
  }
  await browser.close();
})();
