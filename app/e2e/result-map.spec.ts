// The map of a vote (spec result-map), against the built site. The municipal figures are those
// of investigations/map-data.md.
import { expect, test, type Page } from '@playwright/test';

const municipality = (page: Page, number: number) =>
  page.locator(`.municipalities [data-number="${String(number)}"]`);

test('the map of a vote: between the outcome and the table of the cantons', async ({ page }) => {
  await page.goto('votes/5960/');
  const heading = page.getByRole('heading', { name: 'Karte der Gemeinden' });
  await expect(heading).toBeVisible();
  await expect(page.locator('.municipalities path')).toHaveCount(2110);
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
  await expect(page.locator('.outcome')).toHaveText('Abgelehnt');
});

test('no map for a tie-break question', async ({ page }) => {
  await page.goto('votes/6823/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Karte der Gemeinden')).toHaveCount(0);
  await expect(page.locator('svg')).toHaveCount(0);
});

test('the colour of a municipality, by its side and class', async ({ page }) => {
  await page.goto('votes/5960/');
  await expect(municipality(page, 261)).toHaveAttribute('fill', '#e5946f'); // Zürich, no, 2
  await expect(municipality(page, 351)).toHaveAttribute('fill', '#c2673b'); // Bern, no, 3
  await expect(municipality(page, 946)).toHaveAttribute('fill', '#009c86'); // Wachseldorn, yes, 3
});

test('as many yes as no votes: the colour of neither side', async ({ page }) => {
  await page.goto('votes/5960/');
  await expect(municipality(page, 1703)).toHaveAttribute('fill', '#f0efec'); // Hünenberg
});

test('the municipalities without a result are hatched, and no other', async ({ page }) => {
  await page.goto('votes/5960/');
  await expect(page.locator('.municipalities [fill="url(#hatch)"]')).toHaveCount(7);
  await expect(municipality(page, 389)).toHaveAttribute('fill', 'url(#hatch)'); // Meienried
  await expect(page.locator('pattern#hatch')).toHaveCount(1);
});

test('the legend: ten entries from the clearest no to the clearest yes', async ({ page }) => {
  await page.goto('votes/5960/');
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

test('the cantons and the lakes, on the outline of Switzerland in the lakes colour', async ({
  page,
}) => {
  await page.goto('votes/5960/');
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
});

test('the source of the map, with the dates of its data', async ({ page }) => {
  await page.goto('votes/5960/');
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
  await page.goto('votes/5960/');
  await expect(page.getByText(abroad(12), { exact: true })).toBeVisible();
});

test('the Swiss abroad: eleven cantons in 2013', async ({ page }) => {
  await page.goto('votes/5670/');
  await expect(page.getByText(abroad(11), { exact: true })).toBeVisible();
});

// A point on the screen inside a shape of the map, where the shape is the topmost element. The
// shape is scrolled into view first: outside the window no element is found at a point.
async function pointIn(page: Page, selector: string): Promise<{ x: number; y: number }> {
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator(selector).scrollIntoViewIfNeeded();
  return page.locator(selector).evaluate((element) => {
    const path = element as SVGPathElement;
    const box = path.getBBox();
    const matrix = path.getScreenCTM();
    if (matrix === null) throw new Error('the shape is not on the screen');
    for (let i = 1; i < 40; i += 1) {
      for (let j = 1; j < 40; j += 1) {
        const inside = new DOMPoint(box.x + (box.width * i) / 40, box.y + (box.height * j) / 40);
        if (!path.isPointInFill(inside)) continue;
        const onScreen = inside.matrixTransform(matrix);
        if (document.elementFromPoint(onScreen.x, onScreen.y) === path) {
          return { x: onScreen.x, y: onScreen.y };
        }
      }
    }
    throw new Error('no point inside the shape is on top');
  });
}

const details = (page: Page) => page.locator('.details');

test('pointing at a municipality shows its details', async ({ page }) => {
  await page.goto('votes/5960/');
  const zurich = await pointIn(page, '.municipalities [data-number="261"]');
  await page.mouse.move(zurich.x, zurich.y);
  await expect(details(page).locator('.name')).toHaveText('Zürich (ZH)');
  await expect(details(page).locator('li')).toHaveText([
    'Ja-Anteil: 31.85%',
    "Ja-Stimmen: 46'565",
    "Nein-Stimmen: 99'614",
  ]);
  await expect(details(page)).toHaveAttribute('aria-live', 'polite');
});

test('a name that holds its canton is shown once with it', async ({ page }) => {
  await page.goto('votes/5960/');
  const benken = await pointIn(page, '.municipalities [data-number="22"]');
  await page.mouse.move(benken.x, benken.y);
  await expect(details(page).locator('.name')).toHaveText('Benken (ZH)');
});

test('clicking a municipality shows its details, without pointing first', async ({ page }) => {
  await page.goto('votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  // Only a click, as a tap ends with, and no pointer moving over it before.
  await page.locator('.municipalities [data-number="351"]').dispatchEvent('click');
  await expect(details(page).locator('.name')).toHaveText('Bern (BE)');
  await expect(details(page).locator('li').first()).toHaveText('Ja-Anteil: 27.61%');
});

test('pointing at a lake shows no details', async ({ page }) => {
  await page.goto('votes/5960/');
  const zurich = await pointIn(page, '.municipalities [data-number="261"]');
  await page.mouse.move(zurich.x, zurich.y);
  await expect(details(page).locator('.name')).toHaveText('Zürich (ZH)');
  // The lakes have no names in the data: the Zürichsee is the lake nearest to Zürich, measured
  // in the map's own coordinates, which do not change as the page scrolls.
  const nearest = await page.evaluate(() => {
    const centre = (element: Element | null) => {
      if (!(element instanceof SVGGraphicsElement)) throw new Error('no shape');
      const box = element.getBBox();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    const city = centre(document.querySelector('.municipalities [data-number="261"]'));
    const distances = [...document.querySelectorAll('.lakes path')].map((lake) => {
      const c = centre(lake);
      return Math.hypot(c.x - city.x, c.y - city.y);
    });
    return distances.indexOf(Math.min(...distances));
  });
  const lake = await pointIn(page, `.lakes path >> nth=${String(nearest)}`);
  await page.mouse.move(lake.x, lake.y);
  await expect(details(page).locator('.name')).toHaveCount(0);
});

test('pointing at a municipality without a result says why it has no figures', async ({ page }) => {
  await page.goto('votes/5960/');
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
  await page.goto('votes/5960/');
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
  await page.goto('votes/5960/');
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

test('the wheel zooms in around the point under the pointer', async ({ page }) => {
  await page.goto('votes/5960/');
  const zurich = await pointIn(page, '.municipalities [data-number="261"]');
  await page.mouse.move(zurich.x, zurich.y);
  const inMap = await toMap(page, zurich);
  const whole = await viewOf(page);
  await page.mouse.wheel(0, -300);
  await expect.poll(async () => (await viewOf(page)).width).toBeLessThan(whole.width);
  const after = await toScreen(page, inMap);
  expect(Math.abs(after.x - zurich.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.y - zurich.y)).toBeLessThanOrEqual(1);
});

// Drag the map from its centre by (dx, dy) pixels, in steps as a hand would.
async function drag(page: Page, dx: number, dy: number) {
  const box = await page.locator('.map svg').boundingBox();
  if (box === null) throw new Error('the map is not on the screen');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + dx, start.y + dy, { steps: 10 });
  await page.mouse.up();
  return box.width;
}

test('dragging moves the map with the pointer', async ({ page }) => {
  await page.goto('votes/5960/');
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
  await page.goto('votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator('.map svg').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Vergrössern' }).click();
  await drag(page, 2000, 0);
  const view = await viewOf(page);
  // The centre of the view is on the western edge of the rectangle around Switzerland, x = 0.
  expect(view.x + view.width / 2).toBeCloseTo(0, 6);
});

test('a drag that ends on a municipality shows no details', async ({ page }) => {
  await page.goto('votes/5960/');
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
  await page.goto('votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.getByRole('link', { name: 'Alle Abstimmungen' }).click();
  await page.locator('a[href$="votes/5670"]').click();
  await expect(page).toHaveURL('votes/5670/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  const path = (file: string) => new URL(file, baseURL).pathname;
  expect(requested.filter((p) => p === path('data/map.json'))).toHaveLength(1);
  expect(requested.filter((p) => p === path('data/municipalities.json'))).toHaveLength(1);
  expect(requested.filter((p) => p.startsWith(path('data/votes/')))).toEqual([]);
});

test('a map that cannot be loaded: a message, and the rest of the page', async ({ page }) => {
  await page.route('**/data/map.json', (route) => route.abort());
  await page.goto('votes/5960/');
  await expect(
    page.getByText('Die Karte kann nicht geladen werden.', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.municipalities')).toHaveCount(0);
  await expect(page.locator('.figures dd')).toHaveText([
    "1'609'152",
    "1'664'224",
    '49.16%',
    '63.25%',
  ]);
  await expect(page.locator('.verdict .word')).toHaveText(['Nein', 'Ja']);
  await expect(page.locator('tbody tr')).toHaveCount(26);
});
