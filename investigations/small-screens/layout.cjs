// Found while proposing add-small-screens (investigations/small-screens.md, 2): where the parts of
// a vote's page lie on two phones while a selection applies, in pixels from the top of the page,
// against the height of the screen: can a visitor dragging a limit see the selection's result and
// the map? Optionally writes a screenshot of each whole page into a directory.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/small-screens/layout.cjs [<directory outside the repository>]
const { chromium, devices } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const SHOTS = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  for (const name of ['Pixel 7', 'iPhone 13 Mini']) {
    const { defaultBrowserType, ...device } = devices[name];
    const page = await browser.newPage(device);
    await page.goto(BASE + 'de/votes/5960/');
    await page.locator('svg[role="img"] path[data-number]').first().waitFor();
    await page.waitForFunction(() => !document.body.textContent.includes('werden geladen'));
    await page.getByLabel('Merkmal hinzufügen').selectOption('Ausländeranteil');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await page.getByLabel('Obere Grenze: Ausländeranteil').fill('327');
    await page.waitForTimeout(300);
    const at = await page.evaluate(() => {
      const top = (e) => Math.round(e.getBoundingClientRect().top + scrollY);
      const bottom = (e) => Math.round(e.getBoundingClientRect().bottom + scrollY);
      const svg = document.querySelector('svg[role="img"]');
      return {
        screen: innerHeight,
        result: [top(document.querySelector('.result')), bottom(document.querySelector('.result'))],
        selection: [
          top(document.querySelector('.selection')),
          bottom(document.querySelector('.selection')),
        ],
        slider: top(document.querySelector('.track')),
        map: [top(svg), bottom(svg)],
        table: top(document.querySelector('table')),
        page: document.documentElement.scrollHeight,
      };
    });
    console.log(name, JSON.stringify(at));
    if (SHOTS !== undefined) {
      await page.screenshot({
        path: `${SHOTS}/${name.replaceAll(' ', '-')}-selection.png`,
        fullPage: true,
        scale: 'css',
      });
    }
    await page.close();
  }
  await browser.close();
})();
