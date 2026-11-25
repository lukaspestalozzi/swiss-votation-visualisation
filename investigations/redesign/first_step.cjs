// Found while applying (investigations/redesign.md, "Found while applying"): what the first step
// of a limit moves on a vote's page, the step with which a selection first applies. Five limits
// at the ends of their tracks, the page scrolled to the last; then its lower bound at step 50.
// For each part, its top in the window and its height, before and after, and the page's scroll.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/redesign/first_step.cjs [<width> <height>]
const { chromium } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const [width, height] = [Number(process.argv[2] ?? 1280), Number(process.argv[3] ?? 800)];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${BASE}de/votes/5960/`);
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.evaluate(() => document.fonts.ready);
  for (const name of ['Ausländeranteil', 'Einwohner', 'Deutsch', 'Französisch', 'SVP']) {
    await page.getByRole('button', { name: 'Merkmal hinzufügen', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
  }
  const lower = page.getByRole('slider', { name: 'Untere Grenze: SVP', exact: true });
  await lower.scrollIntoViewIfNeeded();
  const parts = () =>
    page.evaluate(() => {
      const box = (selector) => {
        const element = document.querySelector(selector);
        if (element === null) return null;
        const { top, height } = element.getBoundingClientRect();
        return `${Math.round(top)}+${Math.round(height)}`;
      };
      return {
        scroll: Math.round(scrollY),
        results: box('.results'),
        place: box('.results .place'),
        selection: box('.result.selection'),
        map: box('.map svg'),
        legend: box('.legend-box'),
        stays: box('.stay'),
        'last slider': box('.limit:last-child input[type=range]'),
      };
    });
  console.log(`${String(width)} x ${String(height)}`);
  console.log('before', JSON.stringify(await parts()));
  await lower.fill('50');
  await page.locator('.result.selection').waitFor();
  console.log('after ', JSON.stringify(await parts()));
  await browser.close();
})();
