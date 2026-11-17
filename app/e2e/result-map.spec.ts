// The map of a vote (spec result-map), against the built site. The municipal figures are those
// of investigations/map-data.md.
import { expect, test, type Page } from '@playwright/test';
import { MEASURE_FRAMES, measuredFrames } from './frames.ts';
import { pointIn } from './pointing.ts';

const municipality = (page: Page, number: number) =>
  page.locator(`.municipalities [data-number="${String(number)}"]`);

test('the map of a vote: between the outcome and the table of the cantons', async ({ page }) => {
  await page.goto('de/votes/5960/');
  const heading = page.getByRole('heading', { name: 'Karte der Gemeinden' });
  await expect(heading).toBeVisible();
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
  await expect(page.locator('.outcome')).toHaveText('Abgelehnt');
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

test('pointing at a lake shows no details', async ({ page }) => {
  await page.goto('de/votes/5960/');
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

test('the wheel zooms in around the point under the pointer', async ({ page }) => {
  await page.goto('de/votes/5960/');
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
  await expect(page.locator('.figures dd')).toHaveText([
    "1'609'152",
    "1'664'224",
    '49.16%',
    '63.25%',
  ]);
  await expect(page.locator('.verdict .word')).toHaveText(['Nein', 'Ja']);
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
    await page.locator('.map svg').scrollIntoViewIfNeeded();
    const box = await page.locator('.map svg').boundingBox();
    if (box === null) throw new Error('the map is not on the screen');
    await page.evaluate(() => {
      (window as unknown as { __frames: unknown[] }).__frames = [];
    });
    // The first pointing at a municipality after the page has loaded (Sachseln, at the map's
    // centre) is measured too (design of tighten-map-budget, decision 4).
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 4; i += 1) {
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(50);
    }
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

// The panel of characteristics beside the map (spec result-map); the figures are those of
// investigations/characteristics.md.
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
  await expect(panel(page).getByRole('heading', { level: 3 })).toHaveText('Merkmale der Gemeinde');
  await expect(panel(page).locator('.name')).toHaveText('Zürich (ZH)');
  await expect(panel(page).locator('h4')).toHaveText([
    'Bevölkerung Ende 2015',
    'Nationalratswahl 2015',
    'Hauptsprache, Volkszählung 2000',
    'Fläche und Landwirtschaft',
  ]);
  await expect(panel(page).locator('li')).toHaveText([
    "Einwohner: 396'955",
    'Ausländeranteil: 32.03%',
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
    'Fläche (2026): 91.88 km²',
    'Rinder je Einwohner (2015): 0.002',
  ]);
});

test('the panel takes the figures that apply to the vote', async ({ page }) => {
  await page.goto('de/votes/6850/');
  await clickAt(page, 261);
  await expect(panel(page).locator('h4')).toHaveText([
    'Bevölkerung Ende 2025',
    'Nationalratswahl 2023',
    'Hauptsprache, Volkszählung 2000',
    'Fläche und Landwirtschaft',
  ]);
});

test('the density, the area and the cattle are written with their decimals', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await clickAt(page, 389);
  await expect(panel(page).locator('li', { hasText: 'Einwohner je km²' })).toHaveText(
    'Einwohner je km²: 80',
  );
  await expect(panel(page).locator('li', { hasText: 'Fläche' })).toHaveText(
    'Fläche (2026): 0.65 km²',
  );
  await expect(panel(page).locator('li', { hasText: 'Rinder' })).toHaveText(
    'Rinder je Einwohner (2015): 2.519',
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
  ]);
});

test('the panel names the sources of the characteristics', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await clickAt(page, 261);
  await expect(panel(page).locator('.source')).toHaveText(
    'Quellen: BFS (STATPOP, Nationalratswahlen, Volkszählung 2000, ' +
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

test('in a wide window the panel stands to the right of the map', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  const map = await page.locator('.map svg').boundingBox();
  const beside = await panel(page).boundingBox();
  if (map === null || beside === null) throw new Error('the map or the panel is not shown');
  expect(beside.x).toBeGreaterThanOrEqual(map.x + map.width);
  expect(Math.abs(beside.y - map.y)).toBeLessThan(1);
});

test('in a narrow window the panel stands below the map', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  const map = await page.locator('.map svg').boundingBox();
  const below = await panel(page).boundingBox();
  if (map === null || below === null) throw new Error('the map or the panel is not shown');
  expect(below.y).toBeGreaterThanOrEqual(map.y + map.height);
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
