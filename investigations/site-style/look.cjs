// Found while proposing add-site-style (investigations/site-style.md, 1): what the start page, the
// guide and a vote's page look like in windows 360, 1280 and 1920 pixels wide: the font the
// browser asks for and the one it renders, the size and line height of the text, the colours of
// the text, the ground and the links, the body's margin, the map's size and the page's height.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/site-style/look.cjs
const { chromium } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';
const PAGES = [
  ['start', 'de/'],
  ['guide', 'de/guide/'],
  ['vote', 'de/votes/5960/'],
];

(async () => {
  const browser = await chromium.launch();
  for (const width of [360, 1280, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const cdp = await page.context().newCDPSession(page);
    for (const [name, address] of PAGES) {
      await page.goto(BASE + address);
      if (name === 'vote')
        await page.locator('svg[role="img"] path[data-number]').first().waitFor();
      const facts = await page.evaluate(() => {
        const body = getComputedStyle(document.body);
        const svg = document.querySelector('svg[role="img"]');
        const box = svg?.getBoundingClientRect();
        return {
          family: body.fontFamily,
          size: body.fontSize,
          lineHeight: getComputedStyle(document.querySelector('p, li')).lineHeight,
          text: body.color,
          ground: getComputedStyle(document.documentElement).backgroundColor,
          link: getComputedStyle(document.querySelector('a')).color,
          margin: body.margin,
          map: box ? `${String(Math.round(box.width))} x ${String(Math.round(box.height))}` : '-',
          height: document.documentElement.scrollHeight,
        };
      });
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument');
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: 'h1',
      });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      const rendered = fonts.map((f) => f.familyName).join(', ');
      console.log(`${String(width)} ${name}: ${JSON.stringify(facts)} rendered: ${rendered}`);
    }
    await page.close();
  }
  await browser.close();
})();
