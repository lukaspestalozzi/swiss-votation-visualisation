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
