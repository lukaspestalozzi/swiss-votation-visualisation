// Found after the merge (investigations/redesign.md, "Found after the merge"): the height a window
// needs so that the selection's result, scrolled to the window's top, and the first limit's
// sliders lie in one window, by language and width: 360, 375 and 412 pixels for a phone held
// upright, 740 and 915 for one held wide, whose window is then 360 and 412 pixels high. One limit,
// "Einwohner", its lower bound at step 50. Below 1,024 pixels the window's height does not change
// where the parts stand.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/redesign/phone_heights.cjs
const { chromium } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
// The button, the characteristic and the lower slider, as each language names them.
const NAMES = {
  de: ['Merkmal hinzufügen', 'Einwohner', 'Untere Grenze: Einwohner'],
  fr: ['Ajouter une caractéristique', 'Habitants', 'Limite inférieure: Habitants'],
  it: ['Aggiungere una caratteristica', 'Abitanti', 'Limite inferiore: Abitanti'],
};

(async () => {
  const browser = await chromium.launch();
  for (const [language, [add, name, lower]] of Object.entries(NAMES)) {
    for (const width of [360, 375, 412, 740, 915]) {
      const context = await browser.newContext({
        viewport: { width, height: 740 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();
      await page.goto(`${BASE}${language}/votes/5960/`);
      await page.locator('.municipalities path').nth(2000).waitFor();
      await page.getByRole('button', { name: add, exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
      await page.getByRole('slider', { name: lower, exact: true }).fill('50');
      await page.locator('.result.selection').waitFor();
      // From the selection's result's top edge to the lower edge of the first slider.
      const needed = await page.evaluate(() => {
        const top = document.querySelector('.result.selection').getBoundingClientRect().top;
        const slider = document.querySelector('.limits input[type=range]').getBoundingClientRect();
        return Math.ceil(slider.bottom - top);
      });
      console.log(`${language}, ${String(width)} pixels wide: ${String(needed)} pixels needed`);
      await context.close();
    }
  }
  await browser.close();
})();
