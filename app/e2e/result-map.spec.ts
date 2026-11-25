// The map of a vote (spec result-map), against the built site. The municipal figures are those
// of investigations/map-data.md.
import { expect, test, type Page } from '@playwright/test';
import config from '../playwright.config.ts';
import { fingersOn, phone } from './fingers.ts';
import { MEASURE_FRAMES, fontsLoaded, measuredFrames } from './frames.ts';
import { pointIn } from './pointing.ts';
import {
  addLimit,
  barDrawn,
  boxOf,
  figuresOf,
  mapDrawn,
  outcomeOf,
  ownResult,
  verdictWordsOf,
} from './parts.ts';

const municipality = (page: Page, number: number) =>
  page.locator(`.municipalities [data-number="${String(number)}"]`);

test('the map of a vote: between the outcome and the table of the cantons', async ({ page }) => {
  await page.goto('de/votes/5960/');
  // The map's heading names it for a screen reader and takes no room: a box of one pixel.
  const heading = page.getByRole('heading', { name: 'Karte der Gemeinden' });
  await expect(heading).toHaveCount(1);
  const room = await heading.boundingBox();
  expect(room?.width).toBeLessThanOrEqual(1);
  expect(room?.height).toBeLessThanOrEqual(1);
  await expect(page.locator('.municipalities path')).toHaveCount(2110);
  // To assistive technology the map is an image, named after the vote, that points to the table.
  await expect(
    page.getByRole('img', {
      name:
        'Karte der Gemeinden: Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe». ' +
        'Die Zahlen der Kantone stehen in der Tabelle unter der Karte.',
    }),
  ).toBeVisible();
  // In the order of the page: the outcome, the map, the table.
  const order = await page.evaluate(() => {
    const at = (element: Element | null) =>
      element ? [...document.querySelectorAll('*')].indexOf(element) : -1;
    return [
      at(document.querySelector('.outcome')),
      at(document.querySelector('.municipalities')),
      at(document.querySelector('table')),
    ];
  });
  expect(order[0]).toBeLessThan(order[1] ?? -1);
  expect(order[1]).toBeLessThan(order[2] ?? -1);
  await expect(outcomeOf(ownResult(page))).toHaveText('Abgelehnt');
});

test('no map for a tie-break question', async ({ page }) => {
  await page.goto('de/votes/6823/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Karte der Gemeinden')).toHaveCount(0);
  await expect(page.locator('svg')).toHaveCount(0);
});

test('the colour of a municipality, by its side and class', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await expect(municipality(page, 261)).toHaveAttribute('fill', '#e5946f'); // Zürich, no, 2
  await expect(municipality(page, 351)).toHaveAttribute('fill', '#c2673b'); // Bern, no, 3
  await expect(municipality(page, 946)).toHaveAttribute('fill', '#009c86'); // Wachseldorn, yes, 3
});

test('as many yes as no votes: the colour of neither side', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await expect(municipality(page, 1703)).toHaveAttribute('fill', '#f0efec'); // Hünenberg
});

test('the municipalities without a result are hatched, and no other', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await expect(page.locator('.municipalities [fill="url(#hatch)"]')).toHaveCount(7);
  await expect(municipality(page, 389)).toHaveAttribute('fill', 'url(#hatch)'); // Meienried
  await expect(page.locator('pattern#hatch')).toHaveCount(1);
});

test('the legend: ten entries from the clearest no to the clearest yes', async ({ page }) => {
  await page.goto('de/votes/5960/');
  const entries = page.locator('.legend li');
  await expect(entries).toHaveText([
    'Nein: 80% und mehr',
    'Nein: 70–80%',
    'Nein: 60–70%',
    'Nein: 50–60%',
    'Ja: 50–60%',
    'Ja: 60–70%',
    'Ja: 70–80%',
    'Ja: 80% und mehr',
    'Gleich viele Ja wie Nein',
    'Kein eigenes Ergebnis',
  ]);
  const swatch = (i: number) => entries.nth(i).locator('.swatch');
  await expect(swatch(0)).toHaveCSS('background-color', 'rgb(147, 67, 25)'); // #934319
  await expect(swatch(7)).toHaveCSS('background-color', 'rgb(0, 114, 96)'); // #007260
  await expect(swatch(8)).toHaveCSS('background-color', 'rgb(240, 239, 236)'); // #f0efec
  await expect(swatch(9)).toHaveCSS('background-image', /repeating-linear-gradient/);
});

test("the legend's scale: the eight classes in one row, the yes shares below their borders", async ({
  page,
}) => {
  // Spec result-map, "The legend of a vote"; design of redesign-site, decision 16.
  await page.goto('de/votes/5960/');
  await mapDrawn(page);
  const scale = page.locator('.map .scale');
  await expect(scale.locator('.scale-name span')).toHaveText(['Nein', 'Ja-Anteil in %', 'Ja']);
  const cells = await scale.locator('.swatch').evaluateAll((swatches) =>
    swatches.map((swatch) => {
      const box = swatch.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        colour: getComputedStyle(swatch).backgroundColor,
      };
    }),
  );
  // From the clearest no to the clearest yes: #934319, #c2673b, #e5946f, #fbbea3, #92dfd0,
  // #4bc1ad, #009c86 and #007260.
  expect(cells.map((cell) => cell.colour)).toEqual([
    'rgb(147, 67, 25)',
    'rgb(194, 103, 59)',
    'rgb(229, 148, 111)',
    'rgb(251, 190, 163)',
    'rgb(146, 223, 208)',
    'rgb(75, 193, 173)',
    'rgb(0, 156, 134)',
    'rgb(0, 114, 96)',
  ]);
  // One row: each class begins where the one before it ends.
  cells.slice(1).forEach((cell, i) => {
    expect(Math.abs(cell.left - (cells[i]?.right ?? 0))).toBeLessThanOrEqual(1);
    expect(cell.top).toBe(cells[0]?.top);
  });
  // The seven yes shares, each below the border between two classes.
  const shares = await scale.locator('.scale-ticks span').evaluateAll((spans) =>
    spans.map((span) => {
      const box = span.getBoundingClientRect();
      return { text: span.textContent.trim(), middle: box.left + box.width / 2, top: box.top };
    }),
  );
  expect(shares.map((share) => share.text)).toEqual(['20', '30', '40', '50', '60', '70', '80']);
  shares.forEach((share, i) => {
    expect(Math.abs(share.middle - (cells[i]?.right ?? 0))).toBeLessThanOrEqual(1);
    expect(share.top).toBeGreaterThanOrEqual((cells[i]?.bottom ?? 0) - 1);
  });
  // The other entries stand after the scale, each with its words.
  await expect(page.locator('.map .keys li')).toHaveText([
    'Gleich viele Ja wie Nein',
    'Kein eigenes Ergebnis',
  ]);
});

test('the cantons and the lakes, on the outline of Switzerland in the lakes colour', async ({
  page,
}) => {
  await page.goto('de/votes/5960/');
  await expect(page.locator('.cantons path')).toHaveCount(26);
  await expect(page.locator('.lakes path')).toHaveCount(37);
  for (const shape of ['.outline', '.lakes path >> nth=0']) {
    await expect(page.locator(shape)).toHaveAttribute('fill', '#9fb8e8');
  }
  // The outline lies under the municipalities, the lakes and the cantons above them.
  const order = await page.evaluate(() => {
    const all = [...document.querySelectorAll('svg *')];
    return ['.outline', '.municipalities', '.lakes', '.cantons'].map((selector) => {
      const element = document.querySelector(selector);
      return element ? all.indexOf(element) : -1;
    });
  });
  expect(order).not.toContain(-1);
  expect(order).toEqual([...order].sort((a, b) => a - b));
  // The lakes are whole: the Lago Maggiore reaches south of Switzerland's outline, by far more
  // than a kilometre in the map's metres.
  const beyond = await page.evaluate(() => {
    const bottom = (element: Element) =>
      element instanceof SVGGraphicsElement ? element.getBBox().y + element.getBBox().height : NaN;
    const outline = document.querySelector('.outline');
    if (outline === null) throw new Error('no outline');
    const lakes = [...document.querySelectorAll('.lakes path')].map(bottom);
    return Math.max(...lakes) - bottom(outline);
  });
  expect(beyond).toBeGreaterThan(1000);
});

test('the source of the map, with the dates of its data', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await expect(
    page.getByText(
      'Kartengrundlage: © BFS, Gemeinden und Kantone am 1. Januar 2026, Seen: ThemaKart 2026',
      { exact: true },
    ),
  ).toBeVisible();
});

const abroad = (cantons: number) =>
  'Nicht auf der Karte: die Stimmen der Auslandschweizerinnen und Auslandschweizer, ' +
  `die ${String(cantons)} Kantone getrennt zählen.`;

test('the Swiss abroad are not on the map: twelve cantons in 2016', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await expect(page.getByText(abroad(12), { exact: true })).toBeVisible();
});

test('the Swiss abroad: eleven cantons in 2013', async ({ page }) => {
  await page.goto('de/votes/5670/');
  await expect(page.getByText(abroad(11), { exact: true })).toBeVisible();
});

const details = (page: Page) => page.locator('.details');

test('pointing at a municipality shows its details', async ({ page }) => {
  await page.goto('de/votes/5960/');
  const zurich = await pointIn(page, '.municipalities [data-number="261"]');
  await page.mouse.move(zurich.x, zurich.y);
  await expect(details(page).locator('.name')).toHaveText('Zürich (ZH)');
  await expect(details(page).locator('li')).toHaveText([
    'Ja-Anteil: 31.85%',
    "Ja-Stimmen: 46'565",
    "Nein-Stimmen: 99'614",
  ]);
  await expect(details(page)).toHaveAttribute('aria-live', 'polite');
  // A bar of its yes share, drawn as a result's: 31.85% of its width, a mark at half.
  const bar = await barDrawn(details(page).locator('.bar'));
  expect(bar.parts.map((part) => part.side)).toEqual(['yes', 'no']);
  expect(bar.width).toBeGreaterThan(80);
  expect(Math.abs((bar.parts[0]?.width ?? 0) - bar.width * 0.3185)).toBeLessThanOrEqual(1);
  expect(Math.abs((bar.mark ?? 0) - bar.width / 2)).toBeLessThanOrEqual(1);
});

test('the details of a municipality without a result draw no bar', async ({ page }) => {
  // Meienried counts with another municipality: its details say so, and have no yes share.
  await page.goto('de/votes/5960/');
  const meienried = await pointIn(page, '.municipalities [data-number="389"]');
  await page.mouse.move(meienried.x, meienried.y);
  await expect(details(page).locator('.name')).toHaveText('Meienried (BE)');
  await expect(details(page).locator('.bar')).toHaveCount(0);
});

test('a name that holds its canton is shown once with it', async ({ page }) => {
  await page.goto('de/votes/5960/');
  const benken = await pointIn(page, '.municipalities [data-number="22"]');
  await page.mouse.move(benken.x, benken.y);
  await expect(details(page).locator('.name')).toHaveText('Benken (ZH)');
});

test('clicking a municipality shows its details, without pointing first', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  // Only a click, as a tap ends with, and no pointer moving over it before.
  await page.locator('.municipalities [data-number="351"]').dispatchEvent('click');
  await expect(details(page).locator('.name')).toHaveText('Bern (BE)');
  await expect(details(page).locator('li').first()).toHaveText('Ja-Anteil: 27.61%');
});

// The lakes have no names in the data: the Zürichsee is the lake nearest to Zürich, measured in
// the map's own coordinates, which do not change as the page scrolls. A point inside it.
/**
 * A point in the Zürichsee: the lake whose box overlaps Zürich's, the largest if several do, as
 * Zürich borders it and the Greifensee, whose centre lies nearer, does not. With a `margin`, as
 * `pointIn` takes it.
 */
async function zurichsee(page: Page, margin = 0): Promise<{ x: number; y: number }> {
  const index = await page.evaluate(() => {
    const boxOf = (element: Element | null) => {
      if (!(element instanceof SVGGraphicsElement)) throw new Error('no shape');
      return element.getBBox();
    };
    const city = boxOf(document.querySelector('.municipalities [data-number="261"]'));
    const lakes = [...document.querySelectorAll('.lakes path')].map((lake, at) => ({
      at,
      box: boxOf(lake),
    }));
    const touching = lakes.filter(
      ({ box }) =>
        box.x < city.x + city.width &&
        city.x < box.x + box.width &&
        box.y < city.y + city.height &&
        city.y < box.y + box.height,
    );
    const largest = touching.sort(
      (a, b) => b.box.width * b.box.height - a.box.width * a.box.height,
    );
    return largest[0]?.at ?? -1;
  });
  if (index < 0) throw new Error('no lake borders Zürich');
  return pointIn(page, `.lakes path >> nth=${String(index)}`, margin);
}

test('pointing at a lake shows no details', async ({ page }) => {
  await page.goto('de/votes/5960/');
  const zurich = await pointIn(page, '.municipalities [data-number="261"]');
  await page.mouse.move(zurich.x, zurich.y);
  await expect(details(page).locator('.name')).toHaveText('Zürich (ZH)');
  const lake = await zurichsee(page);
  await page.mouse.move(lake.x, lake.y);
  await expect(details(page).locator('.name')).toHaveCount(0);
});

test('pointing at a municipality without a result says why it has no figures', async ({ page }) => {
  await page.goto('de/votes/5960/');
  const meienried = await pointIn(page, '.municipalities [data-number="389"]');
  await page.mouse.move(meienried.x, meienried.y);
  await expect(details(page).locator('.name')).toHaveText('Meienried (BE)');
  await expect(details(page).locator('li')).toHaveText([
    'Kein eigenes Ergebnis: seine Stimmen sind mit denen einer anderen Gemeinde gezählt.',
  ]);
});

// The part of the map shown: the SVG's view box.
async function viewOf(page: Page) {
  const box = await page.locator('.map svg').getAttribute('viewBox');
  const [x = NaN, y = NaN, width = NaN, height = NaN] = (box ?? '').split(' ').map(Number);
  return { x, y, width, height };
}

test('"+" zooms in by 2 around the centre of the view', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  const whole = await viewOf(page);
  expect([whole.x, whole.y]).toEqual([0, 0]);
  await page.getByRole('button', { name: 'Vergrössern' }).click();
  const zoomed = await viewOf(page);
  expect(zoomed.width).toBeCloseTo(whole.width / 2, 6);
  expect(zoomed.height).toBeCloseTo(whole.height / 2, 6);
  expect(zoomed.x + zoomed.width / 2).toBeCloseTo(whole.width / 2, 6);
  expect(zoomed.y + zoomed.height / 2).toBeCloseTo(whole.height / 2, 6);
});

test('the zoom stays between the whole of Switzerland and 16 times', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  const whole = await viewOf(page);
  for (let i = 0; i < 5; i += 1) {
    await page.getByRole('button', { name: 'Vergrössern' }).click();
  }
  expect((await viewOf(page)).width).toBeCloseTo(whole.width / 16, 6);
  await page.getByRole('button', { name: 'Ganze Schweiz' }).click();
  await page.getByRole('button', { name: 'Verkleinern' }).click();
  expect(await viewOf(page)).toEqual(whole);
});

// The point of the map at a point of the screen, and back.
const toMap = (page: Page, point: { x: number; y: number }) =>
  page.locator('.map svg').evaluate((svg, p) => {
    const matrix = svg instanceof SVGSVGElement ? svg.getScreenCTM() : null;
    if (matrix === null) throw new Error('the map is not on the screen');
    const inMap = new DOMPoint(p.x, p.y).matrixTransform(matrix.inverse());
    return { x: inMap.x, y: inMap.y };
  }, point);
const toScreen = (page: Page, point: { x: number; y: number }) =>
  page.locator('.map svg').evaluate((svg, p) => {
    const matrix = svg instanceof SVGSVGElement ? svg.getScreenCTM() : null;
    if (matrix === null) throw new Error('the map is not on the screen');
    const onScreen = new DOMPoint(p.x, p.y).matrixTransform(matrix);
    return { x: onScreen.x, y: onScreen.y };
  }, point);

// The mouse wheel over the map (spec result-map, "Zoom" and "The mouse wheel over the map"; design
// of redesign-site, decision 15): it zooms while Ctrl or ⌘ is held, and scrolls the page otherwise.
for (const key of ['Control', 'Meta'] as const) {
  test(`with ${key} held, the wheel zooms in around the point under the pointer`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('de/votes/5960/');
    const zurich = await pointIn(page, '.municipalities [data-number="261"]');
    await page.mouse.move(zurich.x, zurich.y);
    const inMap = await toMap(page, zurich);
    const whole = await viewOf(page);
    const scrolled = await page.evaluate(() => scrollY);
    await page.keyboard.down(key);
    await page.mouse.wheel(0, -300);
    await page.keyboard.up(key);
    await expect.poll(async () => (await viewOf(page)).width).toBeLessThan(whole.width);
    const after = await toScreen(page, inMap);
    expect(Math.abs(after.x - zurich.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.y - zurich.y)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => scrollY)).toBe(scrolled);
  });
}

test('the wheel alone scrolls the page, and the map still shows the whole of Switzerland', async ({
  page,
}) => {
  // Spec result-map, "The wheel alone scrolls the page".
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('de/votes/5960/');
  const zurich = await pointIn(page, '.municipalities [data-number="261"]');
  await page.mouse.move(zurich.x, zurich.y);
  const whole = await viewOf(page);
  const scrolled = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrolled);
  expect(await viewOf(page)).toEqual(whole);
});

// Drag the map from its centre by (dx, dy) pixels, in steps as a hand would.
async function drag(page: Page, dx: number, dy: number, pause = 0) {
  const box = await page.locator('.map svg').boundingBox();
  if (box === null) throw new Error('the map is not on the screen');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  // A pause before the press, for the budget tests (design of tighten-map-budget, decision 3).
  if (pause > 0) await page.waitForTimeout(pause);
  await page.mouse.down();
  await page.mouse.move(start.x + dx, start.y + dy, { steps: 10 });
  await page.mouse.up();
  return box.width;
}

test('dragging moves the map with the pointer', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator('.map svg').scrollIntoViewIfNeeded();
  for (let i = 0; i < 2; i += 1) {
    await page.getByRole('button', { name: 'Vergrössern' }).click();
  }
  const before = await viewOf(page);
  const pixelsWide = await drag(page, -100, 0);
  const after = await viewOf(page);
  // 100 pixels to the left: the area 100 pixels further east.
  expect(after.x - before.x).toBeCloseTo((100 * before.width) / pixelsWide, 3);
  expect(after.y).toBeCloseTo(before.y, 6);
});

test('dragging past the western edge stops at it', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator('.map svg').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Vergrössern' }).click();
  await drag(page, 2000, 0);
  const view = await viewOf(page);
  // The centre of the view is on the western edge of the rectangle around Switzerland, x = 0.
  expect(view.x + view.width / 2).toBeCloseTo(0, 6);
});

// Fingers on the map, on a phone (spec result-map, "Zoom" and "Moving the map"; design of
// add-small-screens, decisions 8, 9 and 13).
test.describe('on a phone', () => {
  test.use(phone);

  /** The map's box on the screen, scrolled into view, at the given number of zoom steps. */
  async function mapAt(page: Page, zoomSteps: number) {
    await page.goto('de/votes/5960/');
    await page.locator('.municipalities path').nth(2000).waitFor();
    for (let i = 0; i < zoomSteps; i += 1) {
      await page.getByRole('button', { name: 'Vergrössern' }).tap();
    }
    await page.locator('.map svg').scrollIntoViewIfNeeded();
    const box = await page.locator('.map svg').boundingBox();
    if (box === null) throw new Error('the map is not on the screen');
    return box;
  }

  test('one finger moves the map, and the page does not scroll', async ({ page }) => {
    const box = await mapAt(page, 4);
    const before = await viewOf(page);
    const scrolled = await page.evaluate(() => scrollY);
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await (await fingersOn(page)).move([centre], [{ x: centre.x - 100, y: centre.y }]);
    const after = await viewOf(page);
    // 100 pixels to the left: the area 100 pixels further east, within a pixel.
    const unitsPerPixel = before.width / box.width;
    expect(Math.abs(after.x - before.x - 100 * unitsPerPixel)).toBeLessThanOrEqual(unitsPerPixel);
    expect(after.y).toBeCloseTo(before.y, 6);
    expect(await page.evaluate(() => scrollY)).toBe(scrolled);
    await expect(details(page).locator('.name')).toHaveCount(0);
  });

  test('two fingers moved apart zoom in around the point midway between them', async ({ page }) => {
    await mapAt(page, 0);
    const zurich = await pointIn(page, '.municipalities [data-number="261"]');
    const inMap = await toMap(page, zurich);
    const before = await viewOf(page);
    await (
      await fingersOn(page)
    ).move(
      [
        { x: zurich.x - 50, y: zurich.y },
        { x: zurich.x + 50, y: zurich.y },
      ],
      [
        { x: zurich.x - 100, y: zurich.y },
        { x: zurich.x + 100, y: zurich.y },
      ],
    );
    const after = await viewOf(page);
    // Half as wide and half as high, within a pixel: a finger's point on a phone is a fraction of
    // its screen's pixels, so the fingers' distances are 100 and 200 within a fraction.
    const box = await page.locator('.map svg').boundingBox();
    const unitsPerPixel = after.width / (box?.width ?? NaN);
    expect(Math.abs(after.width - before.width / 2)).toBeLessThanOrEqual(unitsPerPixel);
    expect(Math.abs(after.height - before.height / 2)).toBeLessThanOrEqual(unitsPerPixel);
    // Zürich stays midway between the fingers, within a pixel.
    const at = await toScreen(page, inMap);
    expect(Math.abs(at.x - zurich.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(at.y - zurich.y)).toBeLessThanOrEqual(1);
  });

  test('two fingers moved together at the whole of Switzerland keep it whole', async ({ page }) => {
    const box = await mapAt(page, 0);
    const whole = await viewOf(page);
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await (
      await fingersOn(page)
    ).move(
      [
        { x: centre.x - 100, y: centre.y },
        { x: centre.x + 100, y: centre.y },
      ],
      [
        { x: centre.x - 50, y: centre.y },
        { x: centre.x + 50, y: centre.y },
      ],
    );
    expect(await viewOf(page)).toEqual(whole);
  });

  test('two fingers moved together move the map, as wide as before', async ({ page }) => {
    const box = await mapAt(page, 4);
    const before = await viewOf(page);
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await (
      await fingersOn(page)
    ).move(
      [
        { x: centre.x - 50, y: centre.y },
        { x: centre.x + 50, y: centre.y },
      ],
      [
        { x: centre.x - 110, y: centre.y },
        { x: centre.x - 10, y: centre.y },
      ],
    );
    const after = await viewOf(page);
    // 60 pixels to the left: the area 60 pixels further east, as wide as before, within a pixel.
    const unitsPerPixel = before.width / box.width;
    expect(Math.abs(after.x - before.x - 60 * unitsPerPixel)).toBeLessThanOrEqual(unitsPerPixel);
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(unitsPerPixel);
  });

  // A third finger is ignored: it neither ends the pinch of the other two nor moves the map
  // (design of add-small-screens, decision 9).
  test('a third finger that touches and lifts does not end a pinch', async ({ page }) => {
    const box = await mapAt(page, 0);
    const before = await viewOf(page);
    const c = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const fingers = await fingersOn(page);
    const third = { x: c.x, y: c.y + 60, id: 3 };
    const at = (spread: number) => [
      { x: c.x - spread, y: c.y, id: 1 },
      { x: c.x + spread, y: c.y, id: 2 },
    ];
    await fingers.touch('touchStart', at(50));
    await fingers.touch('touchStart', [...at(50), third]);
    await fingers.touch('touchEnd', [third]);
    for (let spread = 60; spread <= 100; spread += 10) {
      await fingers.touch('touchMove', at(spread));
    }
    await fingers.touch('touchEnd', []);
    // 100 pixels apart to 200: half as wide, within a pixel.
    const after = await viewOf(page);
    expect(Math.abs(after.width - before.width / 2)).toBeLessThanOrEqual(after.width / box.width);
  });

  test("a third finger's move does not move the map", async ({ page }) => {
    const box = await mapAt(page, 4);
    const c = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const fingers = await fingersOn(page);
    const a = { x: c.x - 50, y: c.y, id: 1 };
    const b = { x: c.x + 50, y: c.y, id: 2 };
    const third = { x: c.x, y: c.y + 60, id: 3 };
    await fingers.touch('touchStart', [a, b]);
    await fingers.touch('touchStart', [a, b, third]);
    // One of the two lifts; the other stays where it is, and the third moves 100 pixels.
    await fingers.touch('touchEnd', [a]);
    const before = await viewOf(page);
    for (let step = 1; step <= 5; step += 1) {
      await fingers.touch('touchMove', [b, { ...third, x: third.x - 20 * step }]);
    }
    expect(await viewOf(page)).toEqual(before);
    await fingers.touch('touchEnd', []);
  });

  // A tap is a click (spec result-map, "A tap does what a click does").
  test('tapping Zürich shows its details and its characteristics, and outlines it', async ({
    page,
  }) => {
    await mapAt(page, 0);
    const zurich = await pointIn(page, '.municipalities [data-number="261"]');
    await page.touchscreen.tap(zurich.x, zurich.y);
    await expect(details(page).locator('.name')).toHaveText('Zürich (ZH)');
    await expect(details(page).locator('li').first()).toHaveText('Ja-Anteil: 31.85%');
    await expect(panel(page).locator('.name')).toHaveText('Zürich (ZH)');
    await expect(panel(page).locator('li').first()).toHaveText("Einwohner: 396'955");
    await expectOutlined(page, 261);
  });

  test('tapping a lake shows no details, and keeps the panel and the outline', async ({ page }) => {
    await mapAt(page, 0);
    const zurich = await pointIn(page, '.municipalities [data-number="261"]');
    await page.touchscreen.tap(zurich.x, zurich.y);
    await expect(panel(page).locator('.name')).toHaveText('Zürich (ZH)');
    // At the whole of Switzerland the lake is a few pixels wide on a phone, and Chrome moves a tap
    // near its shore to the municipality beside it: the map zoomed in twice as far, the tap at
    // least 4 pixels from the shore (2 were too few beside Zürich).
    await page.getByRole('button', { name: 'Vergrössern' }).tap();
    const lake = await zurichsee(page, 4);
    await page.touchscreen.tap(lake.x, lake.y);
    await expect(details(page).locator('.name')).toHaveCount(0);
    await expect(panel(page).locator('.name')).toHaveText('Zürich (ZH)');
    await expectOutlined(page, 261);
  });
});

test('a drag that ends on a municipality shows no details', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator('.map svg').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Vergrössern' }).click();
  const box = await page.locator('.map svg').boundingBox();
  if (box === null) throw new Error('the map is not on the screen');
  await drag(page, -150, 0);
  const end = { x: box.x + box.width / 2 - 150, y: box.y + box.height / 2 };
  const under = await page.evaluate(
    (p) => document.elementFromPoint(p.x, p.y)?.getAttribute('data-number') ?? null,
    end,
  );
  expect(under).not.toBeNull();
  await expect(details(page).locator('.name')).toHaveCount(0);
});

test("the map's files are loaded once, from one vote to another", async ({ page, baseURL }) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(new URL(request.url()).pathname));
  const loaded = 'Klicken Sie auf eine Gemeinde, um ihre Merkmale zu sehen.';
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await expect(page.locator('.panel')).toContainText(loaded);
  await page.getByRole('link', { name: 'Alle Abstimmungen' }).click();
  await page.locator('a[href$="votes/5670"]').click();
  await expect(page).toHaveURL('de/votes/5670/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await expect(page.locator('.panel')).toContainText(loaded);
  const path = (file: string) => new URL(file, baseURL).pathname;
  expect(requested.filter((p) => p === path('data/map.json'))).toHaveLength(1);
  expect(requested.filter((p) => p === path('data/municipalities.json'))).toHaveLength(1);
  expect(requested.filter((p) => p === path('data/characteristics.json'))).toHaveLength(1);
  expect(requested.filter((p) => p.startsWith(path('data/votes/')))).toEqual([]);
});

test('a map that cannot be loaded: a message, and the rest of the page', async ({ page }) => {
  await page.route('**/data/map.json', (route) => route.abort());
  await page.goto('de/votes/5960/');
  await expect(
    page.getByText('Die Karte kann nicht geladen werden.', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.municipalities')).toHaveCount(0);
  await expect(figuresOf(ownResult(page))).toHaveText(["1'609'152", "1'664'224", '63.25%']);
  await expect(verdictWordsOf(ownResult(page))).toHaveText(['Nein', 'Ja']);
  await expect(page.locator('tbody tr')).toHaveCount(26);
});

/** "Ganze Schweiz" at a person's pace: the pointer rests on it 50 ms before the click, so that
 * the click is not counted in the measurement of the pointer's arrival (design of
 * tighten-map-budget, decision 3). */
async function showWholeSwitzerland(page: Page) {
  const button = page.getByRole('button', { name: 'Ganze Schweiz' });
  await button.hover();
  await page.waitForTimeout(50);
  await button.click();
}

// No other test runs beside a budget test (scenario "No other test beside a budget test"; design
// of steady-budget-tests, decision 1). The configuration is checked, not the run, so that a
// measurement may still ask for more workers (investigations/performance.md, M11).
test('the browser tests run one at a time: the configuration asks for one worker', () => {
  expect(config.workers).toBe(1);
});

// A busy machine can stretch a frame of a page that meets the budget: the budget tests run once
// more when they fail (design of tighten-map-budget, decision 7).
test.describe(() => {
  test.describe.configure({ retries: 1 });

  test('the budget: no frame after zooming, moving or pointing takes more than 16 ms', async ({
    page,
  }) => {
    await page.addInitScript(MEASURE_FRAMES);
    await page.goto('de/votes/5960/');
    await page.locator('.municipalities path').nth(2000).waitFor();
    await expect(page.locator('.panel')).toContainText('Klicken Sie auf eine Gemeinde');
    await fontsLoaded(page);
    await page.locator('.map svg').scrollIntoViewIfNeeded();
    const box = await page.locator('.map svg').boundingBox();
    if (box === null) throw new Error('the map is not on the screen');
    await page.evaluate(() => {
      (window as unknown as { __frames: unknown[] }).__frames = [];
    });
    // The first pointing at a municipality after the page has loaded (Sachseln, at the map's
    // centre) is measured too (design of tighten-map-budget, decision 4).
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // The wheel zooms while Ctrl is held (spec result-map, "The mouse wheel over the map"). The
    // key is pressed at a person's pace, 50 ms after the pointing: pressed in the same frame, it
    // adds about 10 ms to what this measure counts for the pointing, though a key press costs
    // the page no work (investigations/redesign.md, "Found while applying").
    await page.waitForTimeout(50);
    await page.keyboard.down('Control');
    for (let i = 0; i < 4; i += 1) {
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(50);
    }
    await page.keyboard.up('Control');
    await drag(page, -120, 40, 50);
    for (const number of [261, 351, 6621]) {
      await showWholeSwitzerland(page);
      const point = await pointIn(page, `.municipalities [data-number="${String(number)}"]`);
      await page.mouse.move(point.x, point.y, { steps: 5 });
    }
    const frames = await measuredFrames(page);
    expect(frames[0]?.type).toBe('pointerover');
    expect(frames.filter((f) => f.type === 'wheel')).toHaveLength(4);
    expect(frames.length).toBeGreaterThan(10);
    expect(frames.filter((f) => f.work > 16)).toEqual([]);
  });
});

test('after a drag, a click on the spot where it ended shows the details', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator('.map svg').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Vergrössern' }).click();
  await drag(page, -150, 0);
  await expect(details(page).locator('.name')).toHaveCount(0);
  // A new press and release, without moving: a click.
  await page.mouse.down();
  await page.mouse.up();
  await expect(details(page).locator('.name')).toHaveCount(1);
});

test('after a drag, the first move shows the municipality under the pointer', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator('.map svg').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Vergrössern' }).click();
  const box = await page.locator('.map svg').boundingBox();
  if (box === null) throw new Error('the map is not on the screen');
  await drag(page, -150, 0);
  await expect(details(page).locator('.name')).toHaveCount(0);
  // One pixel further, still on the same municipality: pointing again.
  await page.mouse.move(box.x + box.width / 2 - 149, box.y + box.height / 2);
  await expect(details(page).locator('.name')).toHaveCount(1);
});

test('a press let go outside the map does not move it later', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator('.map svg').scrollIntoViewIfNeeded();
  const box = await page.locator('.map svg').boundingBox();
  if (box === null) throw new Error('the map is not on the screen');
  const before = await viewOf(page);
  // Pressed just inside the right edge, let go just outside: less than 4 pixels, no drag.
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width - 1, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 2, y);
  await page.mouse.up();
  // Back over the map with no button held.
  await page.mouse.move(box.x + box.width / 2, y, { steps: 10 });
  expect(await viewOf(page)).toEqual(before);
});

// The panel of characteristics below the map (spec result-map); the figures are those of
// investigations/characteristics.md and investigations/more-characteristics.md.
const panel = (page: Page) => page.locator('.panel');

async function pointAt(page: Page, number: number): Promise<void> {
  const point = await pointIn(page, `.municipalities [data-number="${String(number)}"]`);
  await page.mouse.move(point.x, point.y);
}

async function clickAt(page: Page, number: number): Promise<void> {
  const point = await pointIn(page, `.municipalities [data-number="${String(number)}"]`);
  await page.mouse.click(point.x, point.y);
}

test('the panel shows the characteristics of the municipality clicked', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await clickAt(page, 261);
  await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText('Merkmale der Gemeinde');
  await expect(panel(page).locator('.name')).toHaveText('Zürich (ZH)');
  await expect(panel(page).locator('h3')).toHaveText([
    'Bevölkerung Ende 2015',
    'Nationalratswahl 2015',
    'Hauptsprache, Volkszählung 2000',
    'Religion, Volkszählung 2000',
    'Ausbildung, Volkszählung 2000',
    'Wohnen, Volkszählung 2000',
    'Arbeit Ende 2015',
    'Fläche und Landwirtschaft',
  ]);
  await expect(panel(page).locator('li')).toHaveText([
    "Einwohner: 396'955",
    'Ausländeranteil: 32.03%',
    'Im Ausland geboren: 41.07%',
    '0–17 Jahre: 15.37%',
    '18–34 Jahre: 27.13%',
    '35–49 Jahre: 25.41%',
    '50–64 Jahre: 16.43%',
    '65 Jahre und älter: 15.66%',
    "Einwohner je km²: 4'320",
    'FDP: 14.07%',
    'Die Mitte (bis 2020 CVP und BDP): 5.77%',
    'SP: 31.60%',
    'SVP: 17.93%',
    'GLP: 9.22%',
    'Grüne: 10.66%',
    'Übrige Parteien: 10.74%',
    'Deutsch: 77.70%',
    'Französisch: 2.13%',
    'Italienisch: 4.70%',
    'Rätoromanisch: 0.27%',
    'Evangelisch-reformiert: 30.28%',
    'Römisch-katholisch: 33.27%',
    'Keine Religionszugehörigkeit: 16.83%',
    'Hochschule oder höhere Berufsbildung: 24.92%',
    'Obligatorische Schule oder keine Ausbildung: 26.20%',
    'Vom Eigentümer bewohnte Wohnungen: 7.11%',
    'Einfamilienhäuser: 23.62%',
    'Arbeitsplätze je 100 Einwohner: 118.1',
    'Arbeitsplätze im Primärsektor: 0.05%',
    'Arbeitsplätze im Sekundärsektor: 6.41%',
    'Arbeitsplätze im Tertiärsektor: 93.54%',
    'Fläche (2026): 91.88 km²',
    'Rinder je Einwohner (2015): 0.002',
    "Landwirtschaftsbetriebe je 1'000 Einwohner (2015): 0.1",
    'Bio-Anteil der landwirtschaftlichen Nutzfläche (2015): 44.56%',
  ]);
});

test('the panel takes the figures that apply to the vote', async ({ page }) => {
  await page.goto('de/votes/6850/');
  await clickAt(page, 261);
  // The data file of 2026-11-23, whose newest jobs are those of 2024.
  await expect(panel(page).locator('h3')).toHaveText([
    'Bevölkerung Ende 2025',
    'Nationalratswahl 2023',
    'Hauptsprache, Volkszählung 2000',
    'Religion, Volkszählung 2000',
    'Ausbildung, Volkszählung 2000',
    'Wohnen, Volkszählung 2000',
    'Arbeit Ende 2024',
    'Fläche und Landwirtschaft',
  ]);
  await expect(panel(page).locator('li', { hasText: 'Arbeitsplätze je 100' })).toHaveText(
    'Arbeitsplätze je 100 Einwohner: 124.9',
  );
});

test('A line of another year than its group', async ({ page }) => {
  // A data file whose newest figures of those born abroad are of 2024, the population's of 2025:
  // the site's own file without its last year of them.
  await page.route('**/data/characteristics.json', async (route) => {
    const response = await route.fetch();
    const file = (await response.json()) as {
      bornAbroad: { years: number[]; counts: number[][] };
    };
    expect(file.bornAbroad.years.at(-1)).toBe(2025);
    file.bornAbroad.years.pop();
    file.bornAbroad.counts.pop();
    await route.fulfill({ response, json: file });
  });
  await page.goto('de/votes/6850/');
  await clickAt(page, 261);
  await expect(panel(page).locator('h3').first()).toHaveText('Bevölkerung Ende 2025');
  await expect(panel(page).locator('li').nth(2)).toHaveText(
    'Im Ausland geboren (Ende 2024): 44.58%',
  );
  await expect(panel(page).locator('li').nth(1)).toHaveText(/^Ausländeranteil: [0-9.]+%$/);
});

test('the density, the area and the cattle are written with their decimals', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await clickAt(page, 389);
  await expect(panel(page).locator('li', { hasText: 'Einwohner je km²' })).toHaveText(
    'Einwohner je km²: 80',
  );
  await expect(panel(page).locator('li', { hasText: /^Fläche/ })).toHaveText(
    'Fläche (2026): 0.65 km²',
  );
  await expect(panel(page).locator('li', { hasText: 'Rinder' })).toHaveText(
    'Rinder je Einwohner (2015): 2.519',
  );
  // With one decimal: 23 jobs and 4 farms, 52 inhabitants.
  await expect(panel(page).locator('li', { hasText: 'Arbeitsplätze je 100' })).toHaveText(
    'Arbeitsplätze je 100 Einwohner: 44.2',
  );
  await expect(panel(page).locator('li', { hasText: 'Landwirtschaftsbetriebe' })).toHaveText(
    "Landwirtschaftsbetriebe je 1'000 Einwohner (2015): 76.9",
  );
});

test('Without a figure: a withheld count and no farmland', async ({ page }) => {
  // Spec result-map, "Without a figure": Oberrieden's primary and secondary sector are
  // withheld, and it has no farmland.
  await page.goto('de/votes/5960/');
  await clickAt(page, 137);
  await expect(panel(page).locator('.name')).toHaveText('Oberrieden (ZH)');
  await expect(panel(page).locator('li', { hasText: 'Arbeitsplätze' })).toHaveText([
    'Arbeitsplätze je 100 Einwohner: 20.6',
    'Arbeitsplätze im Primärsektor: keine Angabe',
    'Arbeitsplätze im Sekundärsektor: keine Angabe',
    'Arbeitsplätze im Tertiärsektor: 89.39%',
  ]);
  await expect(panel(page).locator('li', { hasText: 'Bio-Anteil' })).toHaveText(
    'Bio-Anteil der landwirtschaftlichen Nutzfläche (2015): keine Angabe',
  );
});

test('a characteristic without a figure: "keine Angabe"', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await clickAt(page, 389);
  await expect(panel(page).locator('.name')).toHaveText('Meienried (BE)');
  await expect(panel(page).locator('li').first()).toHaveText('Einwohner: 52');
  await expect(panel(page).locator('li', { hasText: 'keine Angabe' })).toHaveText([
    'FDP: keine Angabe',
    'Die Mitte (bis 2020 CVP und BDP): keine Angabe',
    'SP: keine Angabe',
    'SVP: keine Angabe',
    'GLP: keine Angabe',
    'Grüne: keine Angabe',
    'Übrige Parteien: keine Angabe',
    'Arbeitsplätze im Sekundärsektor: keine Angabe',
    'Arbeitsplätze im Tertiärsektor: keine Angabe',
  ]);
});

test('the bars of the shares: 29 for Zürich, none for a line without a share or a figure', async ({
  page,
}) => {
  // Spec result-map, "The bars of the shares".
  await page.goto('de/votes/5960/');
  await clickAt(page, 261);
  await expect(panel(page).locator('.name')).toHaveText('Zürich (ZH)');
  await expect(panel(page).locator('li')).toHaveCount(35);
  await expect(panel(page).locator('li .share')).toHaveCount(29);
  // The bar of 32.03% is filled to that share of its width, in the text's colour.
  const foreigners = panel(page).locator('li', { hasText: /^Ausländeranteil: 32\.03%$/ });
  const drawn = await foreigners.locator('.share').evaluate((bar) => ({
    width: bar.getBoundingClientRect().width,
    filled: bar.firstElementChild?.getBoundingClientRect().width ?? 0,
  }));
  expect(drawn.width).toBeGreaterThanOrEqual(40);
  expect(Math.abs(drawn.filled - drawn.width * 0.3203)).toBeLessThanOrEqual(1);
  await expect(foreigners.locator('.share > span')).toHaveCSS(
    'background-color',
    'rgb(28, 28, 28)',
  );
  // The six lines that are no shares.
  for (const line of [
    /^Einwohner: /,
    /^Einwohner je km²: /,
    /^Arbeitsplätze je 100 Einwohner: /,
    /^Fläche \(2026\): /,
    /^Rinder je Einwohner \(2015\): /,
    /^Landwirtschaftsbetriebe je 1'000 Einwohner \(2015\): /,
  ]) {
    const found = panel(page).locator('li', { hasText: line });
    await expect(found, String(line)).toHaveCount(1);
    await expect(found.locator('.share'), String(line)).toHaveCount(0);
  }
  // A share without a figure: Oberrieden's jobs in two sectors and its organic farmland.
  await clickAt(page, 137);
  await expect(panel(page).locator('.name')).toHaveText('Oberrieden (ZH)');
  const without = panel(page).locator('li', { hasText: 'keine Angabe' });
  await expect(without).toHaveCount(3);
  await expect(without.locator('.share')).toHaveCount(0);
});

test('the panel names the sources of the characteristics', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await clickAt(page, 261);
  await expect(panel(page).locator('.source')).toHaveText(
    'Quellen: BFS (STATPOP, STATENT, Nationalratswahlen, Volkszählung 2000, ' +
      'Landwirtschaftliche Strukturerhebung); swisstopo (swissBOUNDARIES3D 2026).',
  );
});

test('before clicking, the panel asks for a click on a municipality', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await expect(panel(page)).toContainText(
    'Klicken Sie auf eine Gemeinde, um ihre Merkmale zu sehen.',
  );
  await expect(panel(page).locator('li')).toHaveCount(0);
});

test('the panel keeps the municipality clicked while the pointer crosses the map to it', async ({
  page,
}) => {
  await page.goto('de/votes/5960/');
  await clickAt(page, 261);
  const box = await panel(page).boundingBox();
  if (box === null) throw new Error('the panel is not on the screen');
  // On its way the pointer crosses the municipalities east of Zürich.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
  await expect(details(page)).toBeEmpty();
  await expect(panel(page).locator('.name')).toHaveText('Zürich (ZH)');
  await expect(panel(page).locator('li').first()).toHaveText("Einwohner: 396'955");
});

test('pointing at another municipality does not change the panel', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await clickAt(page, 261);
  await pointAt(page, 351);
  await expect(details(page).locator('.name')).toHaveText('Bern (BE)');
  await expect(panel(page).locator('.name')).toHaveText('Zürich (ZH)');
});

test('clicking another municipality shows it in the panel', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await clickAt(page, 261);
  await clickAt(page, 351);
  await expect(panel(page).locator('.name')).toHaveText('Bern (BE)');
  await expect(panel(page).locator('li').first()).toHaveText("Einwohner: 131'554");
});

// The outline of the municipality last clicked or tapped (spec result-map; design of
// add-small-screens, decisions 3 and 4): two paths, black on a white halo, after the cantons.
const outline = (page: Page) => page.locator('.map .outlined path');

test('before a click no municipality is outlined', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await expect(outline(page)).toHaveCount(0);
});

/** Whether the outline is that of the municipality `number`, black 3 pixels on white 7. */
async function expectOutlined(page: Page, number: number): Promise<void> {
  const shape = await municipality(page, number).getAttribute('d');
  await expect(outline(page)).toHaveCount(2);
  for (const path of await outline(page).all())
    await expect(path).toHaveAttribute('d', shape ?? '');
  const strokes = await outline(page).evaluateAll((paths) =>
    paths.map((path) => {
      const style = getComputedStyle(path);
      return [style.stroke, style.strokeWidth, style.fill, style.pointerEvents];
    }),
  );
  expect(strokes).toEqual([
    ['rgb(255, 255, 255)', '7px', 'none', 'none'],
    ['rgb(0, 0, 0)', '3px', 'none', 'none'],
  ]);
  // Above the borders of the cantons: after them in the drawing.
  const after = await page.evaluate(() => {
    const cantons = document.querySelector('.map .cantons');
    const outlined = document.querySelector('.map .outlined');
    return cantons !== null && outlined !== null
      ? (cantons.compareDocumentPosition(outlined) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
      : false;
  });
  expect(after).toBe(true);
}

test('the municipality last clicked is outlined, also while pointing at another', async ({
  page,
}) => {
  await page.goto('de/votes/5960/');
  await clickAt(page, 261);
  await expectOutlined(page, 261);
  await pointAt(page, 351);
  await expect(details(page).locator('.name')).toHaveText('Bern (BE)');
  await expectOutlined(page, 261);
  await clickAt(page, 351);
  await expectOutlined(page, 351);
});

test('a set-aside municipality is outlined too', async ({ page }) => {
  // Zürich set aside by "Ausländeranteil" up to step 327 (investigations/limits.md, 3).
  await page.goto('de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await page
    .getByRole('slider', { name: 'Obere Grenze: Ausländeranteil', exact: true })
    .fill('327');
  await expect(municipality(page, 261)).toHaveAttribute('fill', '#2c2c2c');
  await clickAt(page, 261);
  await expectOutlined(page, 261);
});

// The map on the dark ground of the page (spec result-map, "A municipality without a result" and
// "The map in the dark scheme"; investigations/site-style.md, 4).
test.describe('in the dark scheme', () => {
  test.use({ colorScheme: 'dark' });

  test('a municipality without a result is hatched on #121212', async ({ page }) => {
    await page.goto('de/votes/5960/');
    await expect(municipality(page, 389)).toHaveAttribute('fill', 'url(#hatch)'); // Meienried
    await expect(page.locator('pattern#hatch rect')).toHaveCSS('fill', 'rgb(18, 18, 18)');
  });

  test('a selection: set aside #2c2c2c, outlined black on white, borders #121212', async ({
    page,
  }) => {
    await page.goto('de/votes/5960/');
    await addLimit(page, 'Ausländeranteil');
    await page
      .getByRole('slider', { name: 'Obere Grenze: Ausländeranteil', exact: true })
      .fill('327');
    await expect(municipality(page, 261)).toHaveAttribute('fill', '#2c2c2c'); // Zürich
    await expect(municipality(page, 1)).toHaveAttribute('fill', '#fbbea3'); // Aeugst am Albis
    await expect(municipality(page, 1)).toHaveCSS('stroke', 'rgb(18, 18, 18)');
    await clickAt(page, 261);
    await expectOutlined(page, 261);
  });

  test('the colours of the classes stay', async ({ page }) => {
    await page.goto('de/votes/5960/');
    await expect(municipality(page, 261)).toHaveAttribute('fill', '#e5946f'); // Zürich, no, 2
    await expect(municipality(page, 351)).toHaveAttribute('fill', '#c2673b'); // Bern, no, 3
    await expect(municipality(page, 946)).toHaveAttribute('fill', '#009c86'); // Wachseldorn
  });
});

test('in a wide window the panel stands below the map and the limits, the cantons to its right', async ({
  page,
}) => {
  // Spec result-map, "Where the panel stands", "A wide window".
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('de/votes/5960/');
  await mapDrawn(page);
  const [map, limits, below, cantons] = await Promise.all(
    ['.map svg', '.limits', '.panel', '.canton-results'].map((part) => boxOf(page, part)),
  );
  expect(below.y).toBeGreaterThanOrEqual(map.y + map.height);
  expect(below.y).toBeGreaterThanOrEqual(limits.y + limits.height);
  expect(cantons.x).toBeGreaterThanOrEqual(below.x + below.width);
  expect(Math.abs(cantons.y - below.y)).toBeLessThanOrEqual(1);
});

test('in a narrow window the panel stands below the limits, the cantons below the panel', async ({
  page,
}) => {
  // Spec result-map, "Where the panel stands", "A narrow window".
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('de/votes/5960/');
  await mapDrawn(page);
  const [limits, below, cantons] = await Promise.all(
    ['.limits', '.panel', '.canton-results'].map((part) => boxOf(page, part)),
  );
  expect(below.y).toBeGreaterThanOrEqual(limits.y + limits.height);
  expect(cantons.y).toBeGreaterThanOrEqual(below.y + below.height);
});

// The result and the map stay in the window (spec result-map; design of redesign-site, decision
// 8); the sizes are those of investigations/redesign.md, 6.
const backToReal = (page: Page) =>
  page.getByRole('button', { name: 'Zurück zum echten Ergebnis', exact: true });
const FIVE = ['Einwohner', 'Ausländeranteil', 'Deutsch', 'Französisch', 'SVP'];
const FIVE_MORE = ['Italienisch', 'FDP', 'SP', 'GLP', 'Grüne'];

/** Scroll no further than until "Zurück zum echten Ergebnis" lies in the window. */
const scrollToBack = (page: Page) =>
  backToReal(page).evaluate((button) => {
    button.scrollIntoView({ block: 'nearest' });
  });

/** Open the vote of 2016-02-28 and add limits, which lengthen the limits' column. */
async function openWithLimits(page: Page, names: readonly string[]): Promise<void> {
  await page.goto('de/votes/5960/');
  await mapDrawn(page);
  for (const name of names) await addLimit(page, name);
  await expect(page.locator('.limit')).toHaveCount(names.length);
}

test('the result and the map stay in the window while the page scrolls along the limits', async ({
  page,
}) => {
  // Spec result-map, "Scrolling along five limits".
  await page.setViewportSize({ width: 1280, height: 800 });
  await openWithLimits(page, FIVE);
  await scrollToBack(page);
  const [result, map] = await Promise.all(
    ['.results', '.map svg'].map((part) => boxOf(page, part)),
  );
  expect(result.y).toBeGreaterThanOrEqual(0);
  expect(map.y).toBeGreaterThanOrEqual(0);
  expect(map.y).toBeLessThan(800);
  expect(Math.abs(map.width - 784)).toBeLessThanOrEqual(1);
  expect(Math.abs(map.height - 496)).toBeLessThanOrEqual(1);
  // With ten limits the page scrolls much further than the result stands down the page, and the
  // result is still there.
  for (const name of FIVE_MORE) await addLimit(page, name);
  await scrollToBack(page);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(400);
  expect((await boxOf(page, '.results')).y).toBeGreaterThanOrEqual(0);
  expect((await boxOf(page, '.map svg')).y).toBeLessThan(800);
});

test('a high window: the map no taller than the window less 272 pixels, whole in its middle', async ({
  page,
}) => {
  // Spec result-map, "A wide and a low window": 900 less 272 is 628.
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('de/votes/5960/');
  await mapDrawn(page);
  const [map, outline, column] = await Promise.all(
    ['.map svg', '.map .outline', '.map'].map((part) => boxOf(page, part)),
  );
  expect(Math.abs(map.height - 628)).toBeLessThanOrEqual(1);
  // The map keeps its shape, so its box is narrower than its column, 1,104 pixels, and stands
  // in the column's middle, with Switzerland whole within it.
  const left = map.x - column.x;
  const right = column.x + column.width - (map.x + map.width);
  expect(left).toBeGreaterThan(40);
  expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  expect(outline.x).toBeGreaterThanOrEqual(map.x);
  expect(outline.x + outline.width).toBeLessThanOrEqual(map.x + map.width);
  expect(outline.y).toBeGreaterThanOrEqual(map.y);
  expect(outline.y + outline.height).toBeLessThanOrEqual(map.y + map.height);
});

test('the result, the map and its legend end within the window, whatever room the result takes', async ({
  page,
}) => {
  // Spec result-map, "The result and the map stay in the window": a result takes more room in a
  // narrower column and in French or Italian, and the map leaves it that room
  // (investigations/redesign.md, "Found while applying").
  for (const [width, height, language] of [
    [1024, 700, 'de'],
    [1024, 768, 'it'],
    [1100, 700, 'fr'],
    [1150, 720, 'it'],
    [1280, 800, 'de'],
    [1600, 900, 'fr'],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto(`${language}/votes/5960/#foreigners=-19.98`);
    await mapDrawn(page);
    await expect(page.locator('.result.selection')).toBeVisible();
    const [stays, legend] = await Promise.all(
      ['.stay', '.map .legend-box'].map((part) => boxOf(page, part)),
    );
    const at = `${String(width)} × ${String(height)}, ${language}`;
    expect(stays.height, at).toBeLessThanOrEqual(height);
    expect(legend.y + legend.height, at).toBeLessThanOrEqual(height + stays.y);
  }
});

test('in a low window the result and the map scroll away with the page', async ({ page }) => {
  // Spec result-map, "A wide and a low window": 600 pixels high.
  await page.setViewportSize({ width: 1280, height: 600 });
  await openWithLimits(page, [...FIVE, ...FIVE_MORE]);
  await scrollToBack(page);
  const result = await boxOf(page, '.results');
  expect(result.y + result.height).toBeLessThan(0);
});

test('on a screen 360 pixels wide the map reaches from side to side and scrolls with the page', async ({
  page,
}) => {
  // Spec result-map, "A phone".
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('de/votes/5960/');
  await mapDrawn(page);
  const map = await boxOf(page, '.map svg');
  expect(map.x).toBe(0);
  expect(Math.abs(map.width - 360)).toBeLessThanOrEqual(1);
  expect(Math.abs(map.height - 228)).toBeLessThanOrEqual(1);
  await page.evaluate(() => {
    scrollBy(0, 200);
  });
  expect(Math.abs((await boxOf(page, '.map svg')).y - (map.y - 200))).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('characteristics that cannot be loaded: a message, and the map works', async ({ page }) => {
  await page.route('**/data/characteristics.json', (route) => route.abort());
  await page.goto('de/votes/5960/');
  await expect(panel(page)).toContainText('Die Merkmale können nicht geladen werden.');
  await pointAt(page, 261);
  await expect(details(page).locator('.name')).toHaveText('Zürich (ZH)');
  await expect(details(page).locator('li').first()).toHaveText('Ja-Anteil: 31.85%');
});

test('the map does not wait for the characteristics', async ({ page }) => {
  await page.route('**/data/characteristics.json', () => {
    // Never answered while the test runs.
  });
  await page.goto('de/votes/5960/');
  await expect(page.locator('.municipalities path')).toHaveCount(2110);
  await expect(panel(page)).toContainText('Die Merkmale werden geladen …');
});

// A busy machine can stretch a frame of a page that meets the budget: the budget tests run once
// more when they fail (design of tighten-map-budget, decision 7).
test.describe(() => {
  test.describe.configure({ retries: 1 });

  // Clicking a municipality fills the panel. The test clicks 50 ms after the pointer arrives, at a
  // person's pace: a click within the same frame would be counted in the arrival's measurement
  // (design of tighten-map-budget, decision 3).
  test('the budget of clicking: no frame after clicking a municipality takes more than 16 ms', async ({
    page,
  }) => {
    await page.addInitScript(MEASURE_FRAMES);
    await page.goto('de/votes/5960/');
    await page.locator('.municipalities path').nth(2000).waitFor();
    await expect(panel(page)).toContainText('Klicken Sie auf eine Gemeinde');
    await fontsLoaded(page);
    await page.evaluate(() => {
      (window as unknown as { __frames: unknown[] }).__frames = [];
    });
    for (const number of [261, 351, 6621]) {
      await showWholeSwitzerland(page);
      const point = await pointIn(page, `.municipalities [data-number="${String(number)}"]`);
      await page.mouse.move(point.x, point.y, { steps: 5 });
      await page.waitForTimeout(50);
      await page.mouse.click(point.x, point.y);
    }
    await expect(panel(page).locator('.name')).toHaveText('Genève (GE)');
    const frames = await measuredFrames(page);
    expect(frames.filter((f) => f.type === 'click').length).toBeGreaterThanOrEqual(6);
    expect(frames.filter((f) => f.work > 16)).toEqual([]);
  });
});
test.describe('on a phone', () => {
  test.use(phone);
  test.describe.configure({ retries: 1 });

  // Fingers keep the map's budget (spec result-map, "The budget of fingers"; design of
  // add-small-screens, decision 12): two fingers, one finger, and taps, each tap after showing the
  // whole of Switzerland and 50 ms after the finger's arrival there.
  test('the budget of fingers: no frame after pinching, moving or tapping takes more than 16 ms', async ({
    page,
  }) => {
    await page.addInitScript(MEASURE_FRAMES);
    await page.goto('de/votes/5960/');
    await page.locator('.municipalities path').nth(2000).waitFor();
    await expect(panel(page)).toContainText('Klicken Sie auf eine Gemeinde');
    await fontsLoaded(page);
    await page.locator('.map svg').scrollIntoViewIfNeeded();
    const box = await page.locator('.map svg').boundingBox();
    if (box === null) throw new Error('the map is not on the screen');
    await page.evaluate(() => {
      (window as unknown as { __frames: unknown[] }).__frames = [];
    });
    const fingers = await fingersOn(page);
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    for (let i = 0; i < 2; i += 1) {
      await fingers.move(
        [
          { x: centre.x - 50, y: centre.y },
          { x: centre.x + 50, y: centre.y },
        ],
        [
          { x: centre.x - 100, y: centre.y },
          { x: centre.x + 100, y: centre.y },
        ],
      );
    }
    await fingers.move([centre], [{ x: centre.x - 120, y: centre.y + 40 }]);
    // The frames of the fingers' moves. A finger's touchdown before a move is not measured: its
    // frame waits on the browser, with 4 ms of the page's work in 36 ms (Q, 2026-11-19;
    // investigations/small-screens.md, 9).
    const moves = (await measuredFrames(page)).filter((f) => f.type === 'pointermove');
    await page.evaluate(() => {
      (window as unknown as { __frames: unknown[] }).__frames = [];
    });
    // Points 2 pixels inside their municipality's border (app/e2e/pointing.ts). Davos for Genève:
    // on a phone's whole of Switzerland Genève is a few pixels wide, and Chrome moves a tap on it
    // to its neighbour (investigations/small-screens.md, 8).
    for (const number of [261, 351, 3851]) {
      // In this browser a tap less than about 100 ms after a finger left the map gets no click,
      // faster than a person taps again (investigations/small-screens.md, 8).
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: 'Ganze Schweiz' }).tap();
      const point = await pointIn(page, `.municipalities [data-number="${String(number)}"]`, 2);
      await page.waitForTimeout(50);
      await page.touchscreen.tap(point.x, point.y);
    }
    await expect(panel(page).locator('.name')).toHaveText('Davos (GR)');
    // The frames of the taps, of "Ganze Schweiz" and of the municipalities, pointing and click.
    const taps = await measuredFrames(page);
    expect(moves.length).toBeGreaterThan(20);
    expect(taps.filter((f) => f.type === 'click').length).toBeGreaterThanOrEqual(6);
    expect([...moves, ...taps].filter((f) => f.work > 16)).toEqual([]);
  });
});
