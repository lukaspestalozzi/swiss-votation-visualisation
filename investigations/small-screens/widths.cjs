// Found while proposing add-small-screens (investigations/small-screens.md, 1): every page of the
// site in the three languages, in a window of the given width: which pages are wider than the
// window, by how much, and the innermost elements that reach past its right edge. A vote's page
// is measured once its map has loaded.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/small-screens/widths.cjs [width, default 360]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const WIDTH = Number(process.argv[2] ?? '360');
const list = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../app/static/data/votes.json'), 'utf8'),
);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 700 } });
  const paths = [];
  for (const lang of ['de', 'fr', 'it']) {
    paths.push(`${lang}/`, `${lang}/guide/`);
    for (const vote of list.votes) paths.push(`${lang}/votes/${String(vote.id)}/`);
  }
  let wider = 0;
  for (const address of paths) {
    await page.goto(BASE + address);
    if (address.includes('/votes/')) {
      // A tie-break question has no map: its page is measured after the wait.
      await page
        .locator('svg[role="img"] path[data-number]')
        .first()
        .waitFor({ timeout: 5000 })
        .catch(() => {});
    }
    const found = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      over: [...document.querySelectorAll('body *')]
        .filter((e) => !e.closest('svg') || e.tagName === 'svg')
        .filter(
          (e) => e.getBoundingClientRect().right > innerWidth + 0.5 && e.children.length === 0,
        )
        .map((e) => `${e.tagName.toLowerCase()} "${e.textContent.trim().slice(0, 40)}"`),
    }));
    if (found.width > WIDTH) {
      wider++;
      console.log(address, found.width, found.over.slice(0, 3).join(' | '));
    }
  }
  console.log(`${String(wider)} of ${String(paths.length)} pages wider than ${String(WIDTH)} px`);
  await browser.close();
})();
