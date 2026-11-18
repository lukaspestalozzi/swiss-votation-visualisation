// Found while proposing add-small-screens (investigations/small-screens.md, 5): the size on the
// screen of each control of a vote's page, with a limit added, as a phone 412 pixels wide shows it
// and as a computer does, and which media queries of the pointer each matches.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/small-screens/targets.cjs
const { chromium, devices } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';

(async () => {
  const browser = await chromium.launch();
  const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
  for (const [name, options] of [
    ['Pixel 7', pixel],
    ['computer', { viewport: { width: 1280, height: 900 } }],
  ]) {
    const page = await browser.newPage(options);
    await page.goto(BASE + 'de/votes/5960/');
    await page.locator('svg[role="img"] path[data-number]').first().waitFor();
    await page.waitForFunction(() => !document.body.textContent.includes('werden geladen'));
    await page.getByLabel('Merkmal hinzufügen').selectOption('Ausländeranteil');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await page.getByLabel('Obere Grenze: Ausländeranteil').fill('327');
    const found = await page.evaluate(() => {
      const size = (e) => {
        const r = e.getBoundingClientRect();
        return `${String(Math.round(r.width))}×${String(Math.round(r.height))}`;
      };
      const out = {
        'pointer: coarse': matchMedia('(pointer: coarse)').matches,
        'hover: none': matchMedia('(hover: none)').matches,
      };
      for (const e of document.querySelectorAll('button, select, input[type=checkbox], .track')) {
        const name =
          e.getAttribute('aria-label') ??
          (e.tagName === 'SELECT' ? 'list' : e.className.includes('track') ? 'track' : null) ??
          (e.type === 'checkbox' ? 'switch' : e.textContent.trim());
        out[name] = size(e);
      }
      out['language link'] = size(document.querySelector('.languages a'));
      return out;
    });
    console.log(name, JSON.stringify(found));
    await page.close();
  }
  await browser.close();
})();
