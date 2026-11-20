// Where the result boxes of a vote's page stand, at 360 and 1,280 pixels wide, with a selection:
// the height of the pair (the real result and "Mit Ihrer Auswahl"), the width of each box, and
// where the limits begin. It uses the global Playwright against the built site.
//
// Usage, with the built site served:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/vote-comparison/layout.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const browser = await chromium.launch();
for (const width of [360, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  await page.goto(`${BASE}de/votes/5960/#foreigners=-19.98`);
  await page.locator('.result.selection').waitFor();
  const box = await page.evaluate(() => {
    const top = (s) => Math.round(document.querySelector(s).getBoundingClientRect().top + scrollY);
    const r = document.querySelector('.results').getBoundingClientRect();
    return {
      resultsTop: top('.results'),
      resultsHeight: Math.round(r.height),
      limitsTop: top('.limits'),
      boxes: [...document.querySelectorAll('.results > .result')].map((b) =>
        Math.round(b.getBoundingClientRect().width),
      ),
    };
  });
  console.log(`${width} px:`, JSON.stringify(box));
  await page.close();
}
await browser.close();
