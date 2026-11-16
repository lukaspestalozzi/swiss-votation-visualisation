// Found while proposing add-limits (investigations/limits.md): the map of 2016-02-28 with the
// municipalities whose SVP strength in the election of 2015 is below 30% (or who have none) set
// aside, in a mid grey and in a dark one, with normal vision and with deuteranopia as Chrome
// emulates it. Writes four PNG files into the directory it is given.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/limits/render_set_aside.cjs <directory outside the repository>
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const out = process.argv[2];
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../app/static/data/characteristics.json'), 'utf8'),
);
const election = data.elections.find((e) => e.year === 2015);
const aside = data.municipalities.filter((number, i) => {
  const votes = election.votes[i];
  return votes === null || (100 * votes[3]) / votes.reduce((a, b) => a + b, 0) < 30;
});

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const cdp = await page.context().newCDPSession(page);
  await page.goto('http://localhost:4174/swiss-votation-visualisation/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  for (const grey of ['#999999', '#2c2c2c']) {
    await page.evaluate(
      ([aside, grey]) => {
        for (const n of aside) {
          document
            .querySelector(`.municipalities [data-number="${n}"]`)
            ?.setAttribute('fill', grey);
        }
      },
      [aside, grey],
    );
    for (const type of ['none', 'deuteranopia']) {
      await cdp.send('Emulation.setEmulatedVisionDeficiency', { type });
      const file = path.join(out, `set-aside-${grey.slice(1)}-${type}.png`);
      await page.locator('.frame svg').screenshot({ path: file });
    }
  }
  console.log(`${aside.length} municipalities set aside; four images in ${out}`);
  await browser.close();
})();
