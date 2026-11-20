// The order in which Chromium runs the listeners of a hashchange, an event fired at window
// itself: one added without capture, then one with capture, then one without
// (investigations/share-link.md, "Found while applying").
//
// Usage, with the global Playwright:
//   node investigations/share-link/listener_order.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // A page of its own, served by Playwright: a data: URL fires no hashchange.
  await page.route('http://order.test/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>x</p>' }),
  );
  await page.goto('http://order.test/');
  await page.evaluate(() => {
    window.order = [];
    addEventListener('hashchange', () => window.order.push('first, without capture'));
    addEventListener('hashchange', () => window.order.push('second, with capture'), {
      capture: true,
    });
    addEventListener('hashchange', () => window.order.push('third, without capture'));
  });
  await page.evaluate(() => {
    location.hash = 'a';
  });
  await page.waitForTimeout(200);
  console.log(browser.version(), await page.evaluate(() => window.order));
  await browser.close();
})();
