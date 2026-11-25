// Found while applying (investigations/redesign.md, "Found while applying"): by how much the
// part of a vote's page that stays in the window, the result, the map and its legend, is taller
// than the window, with a selection that sets municipalities aside; in 12 widths by 6 heights
// and three languages, 216 windows.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/redesign/stays.cjs
const { chromium } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const WIDTHS = [1024, 1050, 1074, 1076, 1100, 1150, 1200, 1280, 1366, 1440, 1600, 1920];
const HEIGHTS = [700, 720, 768, 800, 900, 1080];

(async () => {
  const browser = await chromium.launch();
  for (const language of ['de', 'fr', 'it']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}${language}/votes/5960/#foreigners=-19.98`);
    await page.locator('.municipalities path').nth(2000).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.result.selection');
    console.log(
      `${language}: pixels over the window's height (0 when it fits); a row per width, a column per height ${HEIGHTS.join(', ')}`,
    );
    for (const width of WIDTHS) {
      const row = [];
      for (const height of HEIGHTS) {
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(60);
        const stays = await page.evaluate(() =>
          Math.round(document.querySelector('.stay').getBoundingClientRect().height),
        );
        row.push(String(Math.max(0, stays - height)).padStart(3));
      }
      console.log(`  ${String(width).padStart(4)}: ${row.join(' ')}`);
    }
    await page.close();
  }
  await browser.close();
})();
