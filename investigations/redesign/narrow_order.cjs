// Found after the merge (investigations/redesign.md, "Found after the merge"): where a narrow
// window shows the parts of a vote's page, the result, the limits and the map, with one limit,
// "Einwohner", before a selection and with one; how far the first slider begins below the top
// of the selection's result; and what the step with which a selection first applies moves.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/redesign/narrow_order.cjs [--injected] [--port 4174]
// --injected shows the limits between the result and the map by a stylesheet added to the page,
// on a site built before that order, whose place of the selection's result is a sentence's height.
const { chromium } = require('playwright');

const option = (name, otherwise) => {
  const at = process.argv.indexOf(name);
  return at === -1 ? otherwise : process.argv[at + 1];
};
const BASE = `http://localhost:${option('--port', '4174')}/swiss-votation-visualisation/`;
const injected = process.argv.includes('--injected');
const ORDER = `@media (max-width: 1023.98px) {
  .watch, .stay { display: contents !important; }
  .setting { order: 1 !important; }
  section.map { order: 2 !important; }
  .watch > p { order: 3 !important; }
}`;

(async () => {
  const browser = await chromium.launch();
  for (const [width, height] of [
    [360, 740],
    [412, 915],
    [800, 1000],
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
    const page = await context.newPage();
    await page.goto(`${BASE}de/votes/5960/`);
    await page.locator('.municipalities path').nth(2000).waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (injected) await page.addStyleTag({ content: ORDER });
    await page.getByRole('button', { name: 'Merkmal hinzufügen', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Einwohner', exact: true }).click();
    const lower = page.getByRole('slider', { name: 'Untere Grenze: Einwohner', exact: true });
    // Each part's top on the page and its height.
    const parts = () =>
      page.evaluate(() => {
        const at = (selector) => {
          const element = document.querySelector(selector);
          if (element === null) return 'none';
          const box = element.getBoundingClientRect();
          return `${Math.round(box.top + scrollY)}+${Math.round(box.height)}`;
        };
        return [
          `result ${at('.results > .result')}`,
          `place ${at('.results .place')}`,
          `selection ${at('.result.selection')}`,
          `limits ${at('.limits')}`,
          `slider ${at('input[type=range]')}`,
          `map ${at('section.map')}`,
        ].join(' | ');
      });
    const before = await parts();
    await lower.scrollIntoViewIfNeeded();
    await lower.focus();
    const inWindow = async () => Math.round((await lower.boundingBox()).y);
    let [slider, scroll, steps] = [0, 0, 0];
    // Steps by key until the selection's result stands: the last is the step measured.
    while (steps < 200 && (await page.locator('.result.selection').count()) === 0) {
      [slider, scroll] = [await inWindow(), await page.evaluate(() => scrollY)];
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(60);
      steps++;
    }
    await page.waitForTimeout(300);
    const [sliderAfter, scrollAfter] = [await inWindow(), await page.evaluate(() => scrollY)];
    const tops = await page.evaluate(() => {
      const top = (selector) =>
        Math.round(document.querySelector(selector).getBoundingClientRect().top + scrollY);
      return [top('.result.selection'), top('input[type=range]')];
    });
    console.log(`${String(width)} x ${String(height)}${injected ? ', order injected' : ''}:`);
    console.log(`  before a selection: ${before}`);
    console.log(`  with a selection:   ${await parts()}`);
    console.log(
      `  from the top of the selection's result to the first slider: ${String(tops[1] - tops[0])} px`,
    );
    console.log(
      `  the step with which the selection first applies (step ${String(steps)}): the slider in the window ${String(slider)} -> ${String(sliderAfter)}, the page's scroll ${String(scroll)} -> ${String(scrollAfter)}`,
    );
    await context.close();
  }
  await browser.close();
})();
