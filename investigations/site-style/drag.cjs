// Found while applying add-site-style (investigations/site-style.md, 7): the steps of
// app/e2e/limits.spec.ts "recalculated while dragging", in a window 1,280 x 720, with what moves
// at each step: the upper slider's value and place, the scroll, the height of the vote's result
// and of "Mit Ihrer Auswahl", and whether the fonts have loaded. With --scrolled, the slider is
// scrolled into view first, as the test now does.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/site-style/drag.cjs [--scrolled]
const { chromium } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const SCROLLED = process.argv.includes('--scrolled');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(BASE + 'de/votes/5960/');
  await page.getByLabel('Merkmal hinzufügen').waitFor();
  await page.getByLabel('Merkmal hinzufügen').selectOption({ label: 'Ausländeranteil' });
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  const input = page.getByRole('slider', { name: 'Obere Grenze: Ausländeranteil', exact: true });
  const state = () =>
    page.evaluate(() => {
      const upper = [...document.querySelectorAll('input[type=range]')].at(-1);
      const own = document.querySelector('.results > .result:not(.selection)');
      const selection = document.querySelector('.selection');
      return {
        value: upper.value,
        sliderY: Math.round(upper.getBoundingClientRect().y),
        scrollY: Math.round(scrollY),
        own: own ? Math.round(own.getBoundingClientRect().height) : null,
        selection: selection ? Math.round(selection.getBoundingClientRect().height) : null,
        fonts: document.fonts.status,
      };
    });
  if (SCROLLED) await input.scrollIntoViewIfNeeded();
  const box = await input.boundingBox();
  console.log('before the press:', JSON.stringify(await state()));
  // As the test's dragTo: the thumb's centre runs from half a thumb inside one end to the other.
  const at = (step) => box.x + 10 + ((box.width - 20) * step) / 1000;
  const y = box.y + box.height / 2;
  let x = at(1000);
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let tries = 0; tries < 8; tries += 1) {
    x += at(327) - at(Number(await input.inputValue()));
    await page.mouse.move(x, y, { steps: 4 });
    console.log(
      `try ${String(tries)}: pointer at y ${y.toFixed(1)}`,
      JSON.stringify(await state()),
    );
    if (Number(await input.inputValue()) === 327) break;
  }
  await page.mouse.up();
  await browser.close();
})();
