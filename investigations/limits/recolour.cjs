// Found while proposing add-limits (investigations/limits.md): the work of a frame in which N
// municipalities of the map change their fill, set by the DOM directly, without Svelte: the
// floor of a step of a limit. Measured as the map's budget tests measure: the script's own time
// plus the time from the next animation frame to a timer after it.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/limits/recolour.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4174/swiss-votation-visualisation/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  for (const n of [100, 1000, 2110]) {
    const times = [];
    for (let run = 0; run < 15; run += 1) {
      times.push(
        await page.evaluate(
          (n) =>
            new Promise((resolve) => {
              const paths = [...document.querySelectorAll('.municipalities path')].slice(0, n);
              const grey = paths[0].getAttribute('fill') === '#d9d9d9';
              const start = performance.now();
              for (const p of paths) p.setAttribute('fill', grey ? '#4a9a8a' : '#d9d9d9');
              const script = performance.now() - start;
              requestAnimationFrame(() => {
                const frame = performance.now();
                setTimeout(() => resolve(script + performance.now() - frame));
              });
            }),
          n,
        ),
      );
      await page.waitForTimeout(50);
    }
    times.sort((a, b) => a - b);
    console.log(
      `${n} fills changed: median ${times[7].toFixed(1)} ms, max ${times[14].toFixed(1)} ms`,
    );
  }
  await browser.close();
})();
