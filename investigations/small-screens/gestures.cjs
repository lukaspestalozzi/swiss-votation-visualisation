// Found while proposing add-small-screens (investigations/small-screens.md, 4): a control. Does
// this machine's Chromium do what a phone's browser does with a finger by default: scroll the page,
// zoom it with two fingers, move a slider's thumb? Chrome's synthetic gestures
// (Input.synthesizeScrollGesture, Input.synthesizePinchGesture) on the guide, which has no
// handler of its own, and on a plain range input; a scroll with the mouse as the control's control.
//
// Usage, with the built site served as the browser tests serve it:
//   (cd app && pnpm exec sirv build --port 4174) &
//   node investigations/small-screens/gestures.cjs
const { chromium, devices } = require('playwright');

const BASE = 'http://localhost:4174/swiss-votation-visualisation/';

(async () => {
  const browser = await chromium.launch();
  const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
  const phone = await browser.newContext(pixel);
  const page = await phone.newPage();
  const cdp = await phone.newCDPSession(page);
  const where = () =>
    page.evaluate(
      () => `scrollY ${String(Math.round(scrollY))}, scale ${String(visualViewport.scale)}`,
    );

  await page.goto(BASE + 'de/guide/');
  await cdp.send('Input.synthesizeScrollGesture', {
    x: 200,
    y: 500,
    yDistance: -300,
    gestureSourceType: 'touch',
    speed: 800,
  });
  await page.waitForTimeout(500);
  console.log('guide, a finger moved up 300 px:', await where());
  await cdp.send('Input.synthesizePinchGesture', {
    x: 200,
    y: 400,
    scaleFactor: 2,
    gestureSourceType: 'touch',
    relativeSpeed: 800,
  });
  await page.waitForTimeout(800);
  console.log('guide, two fingers spread to twice their distance:', await where());

  await page.setContent(
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<input type="range" min="0" max="1000" value="1000" style="width:390px;margin:100px 0 0 10px">',
  );
  const slider = page.locator('input');
  const b = await slider.boundingBox();
  await cdp.send('Input.synthesizeScrollGesture', {
    x: b.x + b.width - 8,
    y: b.y + b.height / 2,
    xDistance: -150,
    gestureSourceType: 'touch',
    speed: 400,
  });
  await page.waitForTimeout(300);
  console.log(
    'plain slider at 1000, its thumb moved 150 px left by a finger:',
    await slider.inputValue(),
  );

  const desktop = await browser.newPage({ viewport: { width: 412, height: 800 } });
  const desktopCdp = await desktop.context().newCDPSession(desktop);
  await desktop.goto(BASE + 'de/guide/');
  for (const source of ['touch', 'mouse']) {
    await desktopCdp.send('Input.synthesizeScrollGesture', {
      x: 200,
      y: 500,
      yDistance: -300,
      gestureSourceType: source,
      speed: 800,
    });
    await desktop.waitForTimeout(500);
    console.log(
      `guide without a phone's emulation, ${source} moved up 300 px: scrollY`,
      await desktop.evaluate(() => Math.round(scrollY)),
    );
    await desktop.evaluate(() => scrollTo(0, 0));
  }
  await browser.close();
})();
