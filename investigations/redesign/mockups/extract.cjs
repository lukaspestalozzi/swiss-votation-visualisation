// The real content of the built site, for the mockups (investigations/redesign.md, 6): of the
// vote of 2016-02-28, number 596, its figures without and with a selection, the table of the
// cantons, the panel and the details of Köniz, and each municipality's fill; the start page's
// entries; and of a second vote of that day, an optional referendum, the tie-break question and
// the comparison, their figures. Written to site.json and more.json in a directory.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/redesign/mockups/extract.cjs <dir outside the repository>
const { chromium } = require('playwright');
const { writeFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const SELECTION = 'foreigners=-19.98&inhabitants=3000-';
const KOENIZ = 355;
const out = process.argv[2];

// A point of the screen inside a municipality's shape, from the middle of its box outwards.
const inside = (number) => {
  const shape = document.querySelector(`path[data-number="${number}"]`);
  const box = shape.getBBox();
  const matrix = shape.getScreenCTM();
  const order = [10, 9, 11, 8, 12, 7, 13, 6, 14, 5, 15, 4, 16, 3, 17, 2, 18, 1, 19];
  for (const i of order)
    for (const j of order) {
      const point = new DOMPoint(box.x + (box.width * i) / 20, box.y + (box.height * j) / 20);
      if (shape.isPointInFill(point)) {
        const screen = point.matrixTransform(matrix);
        return [screen.x, screen.y];
      }
    }
  return null;
};

// What a vote's page writes.
const readVote = () => {
  const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();
  const classes = (el) => el.className.replace(/svelte-\S+/g, '').trim();
  return {
    title: text(document.querySelector('h1')),
    results: [...document.querySelectorAll('.result')].map((box) => ({
      figures: [...box.querySelectorAll('.figures dt')].map((dt) => [
        text(dt),
        text(dt.nextElementSibling),
      ]),
      verdicts: [...box.querySelectorAll('.verdict')].map((v) =>
        [...v.children].map((child) => [classes(child), text(child)]),
      ),
      outcome: text(box.querySelector('.outcome')),
    })),
    table: [...document.querySelectorAll('table tr')].map((row) => [...row.children].map(text)),
    fills: Object.fromEntries(
      [...document.querySelectorAll('path[data-number]')].map((p) => [
        p.getAttribute('data-number'),
        p.getAttribute('fill'),
      ]),
    ),
    panel: {
      name: document.querySelector('.panel .name')
        ? text(document.querySelector('.panel .name'))
        : null,
      groups: [...document.querySelectorAll('.panel h4')].map((h) => ({
        heading: text(h),
        lines: [...h.nextElementSibling.querySelectorAll('li')].map(text),
      })),
      source: document.querySelector('.panel .source')
        ? text(document.querySelector('.panel .source'))
        : null,
    },
    details: document.querySelector('.details') ? text(document.querySelector('.details')) : null,
  };
};

(async () => {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await (
    await browser.newContext({ viewport: { width: 1280, height: 800 } })
  ).newPage();
  const open = async (address, click) => {
    await page.goto('about:blank');
    await page.goto(BASE + address);
    await page.waitForLoadState('networkidle');
    if (click) {
      const shape = page.locator(`path[data-number="${String(KOENIZ)}"]`);
      await shape.waitFor();
      await shape.scrollIntoViewIfNeeded();
      const point = await page.evaluate(inside, KOENIZ);
      await page.mouse.click(point[0], point[1]);
    }
    await page.waitForTimeout(800);
    return page.evaluate(readVote);
  };

  const site = {
    real: await open('de/votes/5960/', true),
    selection: await open(`de/votes/5960/#${SELECTION}`, true),
  };
  await page.goto(`${BASE}de/`);
  site.start = await page.evaluate(() =>
    [...document.querySelectorAll('section')].map((section) => ({
      year: section.querySelector('h2').textContent.trim(),
      entries: [...section.querySelectorAll('li')].map((li) => ({
        parts: [...li.children].map((child) => [
          child.className.replace(/svelte-\S+/g, '').trim(),
          child.textContent.replace(/\s+/g, ' ').trim(),
        ]),
      })),
    })),
  );
  writeFileSync(path.join(out, 'site.json'), JSON.stringify(site));

  const more = {
    second: await open('de/votes/5970/', false),
    secondSelection: await open(`de/votes/5970/#${SELECTION}`, false),
    optionalSelection: await open('de/votes/6790/#abroad=no', false),
    tiebreak: await open('de/votes/6823/', false),
  };
  writeFileSync(path.join(out, 'more.json'), JSON.stringify(more));
  await browser.close();

  const figures = (result) =>
    `${result.figures.map((f) => f.join(' ')).join(', ')}; ${result.outcome}`;
  console.log(`5960: ${figures(site.real.results[0])}`);
  console.log(`5960 with ${SELECTION}: ${figures(site.selection.results[1])}`);
  console.log(
    `  set aside: ${String(Object.values(site.selection.fills).filter((f) => f === '#2c2c2c').length)} of ${String(Object.keys(site.selection.fills).length)}`,
  );
  console.log(`  clicked: ${site.selection.details}`);
  console.log(`5970 with the same: ${figures(more.secondSelection.results[1])}`);
  console.log(`6790 without the Swiss abroad: ${figures(more.optionalSelection.results[1])}`);
  console.log(
    `start page: ${String(site.start.reduce((n, year) => n + year.entries.length, 0))} entries in ${String(site.start.length)} years`,
  );
})();
