// The comparison of two votes (spec vote-comparison), against the built site. The figures are
// those of investigations/vote-comparison.md and investigations/limits.md.
import { expect, test, type Page } from '@playwright/test';

/** The language a page declares in its markup. */
const languageOf = (page: Page) => page.locator('html').getAttribute('lang');

test('A page in each language', async ({ page }) => {
  const headings = {
    de: 'Zwei Abstimmungen vergleichen',
    fr: 'Comparer deux votations',
    it: 'Confrontare due votazioni',
  };
  for (const [language, heading] of Object.entries(headings)) {
    const response = await page.goto(`${language}/compare/`);
    expect(response?.status(), language).toBe(200);
    expect(await languageOf(page)).toBe(language);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
  }
});

test('The head of the comparison', async ({ page }) => {
  await page.goto('de/compare/');
  const head = page.locator('header.head');
  await expect(head.getByRole('link', { name: 'Popular Vote Explorer' })).toHaveAttribute(
    'href',
    /\/swiss-votation-visualisation\/de\/?$/,
  );
  await expect(head.getByRole('link', { name: 'Lesehilfe' })).toHaveAttribute(
    'href',
    /\/swiss-votation-visualisation\/de\/guide\/?$/,
  );
  await expect(head.getByText('Deutsch')).toHaveAttribute('aria-current', 'page');
  await expect(head.getByRole('link', { name: 'Français' })).toHaveAttribute(
    'href',
    /\/swiss-votation-visualisation\/fr\/compare\/?$/,
  );
  await expect(head.getByRole('link', { name: 'Italiano' })).toHaveAttribute(
    'href',
    /\/swiss-votation-visualisation\/it\/compare\/?$/,
  );
  await expect(page.getByLabel('Erste Abstimmung')).toBeVisible();
  await expect(page.getByLabel('Zweite Abstimmung')).toBeVisible();
  await expect(page.locator('.limit')).toHaveCount(0);
  await expect(page.locator('table')).toHaveCount(0);
});

/** The ids a list offers, without its empty choice. */
const offered = (page: Page, list: string) =>
  page
    .getByLabel(list)
    .locator('option:not([value=""])')
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));

test('The lists of a vote of 2016-02-28', async ({ page }) => {
  await page.goto('de/compare/#votes=5960');
  const first = page.getByLabel('Erste Abstimmung');
  await expect(first).toHaveValue('5960');
  await expect(first.locator('option:checked')).toHaveText(
    '28. Februar 2016 · Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»',
  );
  await expect(page.getByLabel('Zweite Abstimmung')).toHaveValue('');
  const firsts = await offered(page, 'Erste Abstimmung');
  const seconds = await offered(page, 'Zweite Abstimmung');
  expect(firsts).toHaveLength(124);
  expect(seconds).toHaveLength(123);
  expect(seconds.slice(0, 3)).toEqual(['5970', '5980', '5990']);
  expect([...firsts, ...seconds]).not.toContain('6823');
});

/** The table of a chosen vote. */
const tableOf = (page: Page, id: number) => page.locator(`[data-vote="${String(id)}"] table`);

/** The columns of a vote's table, and its rows, each as its heading and its cells' texts. */
async function rowsOf(page: Page, id: number) {
  const table = tableOf(page, id);
  await expect(table).toBeVisible();
  return {
    columns: await table.locator('thead th').allInnerTexts(),
    rows: await table
      .locator('tbody tr')
      .evaluateAll((rows) =>
        rows.map((row) =>
          [...row.querySelectorAll('th, td')].map((cell) => (cell as HTMLElement).innerText.trim()),
        ),
      ),
  };
}

test('The real results', async ({ page }) => {
  await page.goto('de/compare/#votes=5960,5970');
  expect(await rowsOf(page, 5960)).toEqual({
    columns: ['Echtes Ergebnis'],
    rows: [
      ['Ja-Stimmen', "1'609'152"],
      ['Nein-Stimmen', "1'664'224"],
      ['Ja-Anteil', '49.16%'],
      ['Volksmehr', 'Nein 49.16%'],
      ['Ständemehr', 'Ja 16½ : 6½'],
      ['Vorlage', 'Abgelehnt'],
    ],
  });
  expect(await rowsOf(page, 5970)).toEqual({
    columns: ['Echtes Ergebnis'],
    rows: [
      ['Ja-Stimmen', "1'375'098"],
      ['Nein-Stimmen', "1'966'965"],
      ['Ja-Anteil', '41.15%'],
      ['Volksmehr', 'Nein 41.15%'],
      ['Ständemehr', 'Nein 4½ : 18½'],
      ['Vorlage', 'Abgelehnt'],
    ],
  });
});

test('A known difference', async ({ page }) => {
  await page.goto('de/compare/#votes=6650,6660');
  await expect(tableOf(page, 6650)).toBeVisible();
  await expect(page.locator('[data-vote="6650"] p.secondary').last()).toHaveText(
    "Das erwahrte Ergebnis zählt 1'350'325 Nein-Stimmen (BBl 2024 996); die Zahlen der " +
      'Gemeinden, aus denen hier gerechnet wird, ergeben 200 mehr.',
  );
});

test('A file that cannot be loaded', async ({ page }) => {
  await page.route('**/data/votes/5970.json', (route) => route.abort());
  await page.goto('de/compare/#votes=5960,5970');
  await expect(tableOf(page, 5960)).toBeVisible();
  await expect(page.locator('[data-vote="5970"]')).toContainText(
    'Die Ergebnisse dieser Abstimmung lassen sich nicht laden.',
  );
  await expect(tableOf(page, 5970)).toHaveCount(0);
});

test('Each file once', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await page.goto('de/compare/#votes=5960');
  await expect(tableOf(page, 5960)).toBeVisible();
  for (const second of ['5970', '5980', '5970']) {
    await page.getByLabel('Zweite Abstimmung').selectOption(second);
    await expect(tableOf(page, Number(second))).toBeVisible();
  }
  const files = requested
    .filter((url) => url.includes('/data/votes/'))
    .map((url) => new URL(url).pathname.split('/').pop());
  expect(files.sort()).toEqual(['5960.json', '5970.json', '5980.json']);
  expect(requested.filter((url) => !url.startsWith('http://localhost:4173/'))).toEqual([]);
});

/** The columns of a vote's table once its selection applies, then its rows and its count. */
async function selectedOf(page: Page, id: number) {
  await expect(tableOf(page, id).locator('thead th')).toHaveText([
    'Echtes Ergebnis',
    'Mit Ihrer Auswahl',
  ]);
  const { rows } = await rowsOf(page, id);
  return {
    selected: rows.map((row) => row[2]),
    count: await page.locator(`[data-vote="${String(id)}"] p.count`).innerText(),
  };
}

test('Two votes of one day', async ({ page }) => {
  await page.goto('de/compare/#votes=5960,5970&foreigners=-19.98');
  await expect(page.locator('.limit .label')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await expect(
    page.getByText(
      'Die Gemeinden werden nach den Zahlen der ersten Abstimmung ausgewählt; in beiden ' +
        'Abstimmungen zählen dieselben Gemeinden.',
    ),
  ).toBeVisible();
  expect(await selectedOf(page, 5960)).toEqual({
    selected: ["733'402", "664'373", '52.47%', 'Ja 52.47%', 'Ja 18 : 4½', 'Angenommen'],
    count: "In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis.",
  });
  expect(await selectedOf(page, 5970)).toEqual({
    selected: ["654'548", "769'763", '45.96%', 'Nein 45.96%', 'Nein 8½ : 14', 'Abgelehnt'],
    count: "In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis.",
  });
  // The limits' own count stands below each table instead (design, decision 6).
  await expect(page.locator('.limits p.count')).toHaveCount(0);
});

test('Two votes years apart', async ({ page }) => {
  await page.goto('de/compare/#votes=5960,6310&foreigners=-19.98');
  await expect(page.locator('.limit .label')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  expect(await selectedOf(page, 6310)).toEqual({
    selected: ["603'173", "796'237", '43.10%', 'Nein 43.10%', 'Nein 4½ : 18', 'Abgelehnt'],
    count: "In der Auswahl: 1'456 von 2'104 Gemeinden mit eigenem Ergebnis.",
  });
});

test('A link to a comparison', async ({ page }) => {
  await page.goto('de/compare/#votes=5960,6310&foreigners=-19.98');
  await expect(page.getByLabel('Erste Abstimmung')).toHaveValue('5960');
  await expect(page.getByLabel('Zweite Abstimmung')).toHaveValue('6310');
  await expect(page.locator('.limit .label')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
});

test('The address follows the choice', async ({ page }) => {
  await page.goto('de/compare/#votes=5960');
  await expect(page.locator('.limits select')).toBeVisible();
  await page.getByLabel('Zweite Abstimmung').selectOption('5970');
  await expect(page).toHaveURL(/\/de\/compare\/#votes=5960,5970$/);
});

test('A vote the comparison cannot use', async ({ page }) => {
  await page.goto('de/compare/#votes=5960,6823&foreigners=-19.98');
  await expect(page.locator('.limit .label')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await expect(page.getByLabel('Erste Abstimmung')).toHaveValue('5960');
  await expect(page.getByLabel('Zweite Abstimmung')).toHaveValue('');
  await expect(
    page.getByText('Diese Angaben der Adresse liessen sich nicht anwenden: «votes=5960,6823».'),
  ).toBeVisible();
});

test('A link to a comparison in the same tab', async ({ page }) => {
  await page.goto('de/compare/#votes=5960,5970');
  await expect(page.locator('.limits select')).toBeVisible();
  await page.goto('de/compare/#votes=6310,5960&foreigners=-19.98');
  await expect(page.getByLabel('Erste Abstimmung')).toHaveValue('6310');
  await expect(page.getByLabel('Zweite Abstimmung')).toHaveValue('5960');
  await expect(page.locator('.limit .label')).toHaveText(
    'Ausländeranteil (Ende 2019): von 0.00% bis 19.99%',
  );
});

test('Another first vote', async ({ page }) => {
  await page.goto('de/compare/#votes=5960,5970&foreigners=-19.98');
  await expect(page.locator('.limit .label')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await page.getByLabel('Erste Abstimmung').selectOption('6310');
  // investigations/vote-comparison.md, 1: 19.98% on the track of 2020-09-27 is step 346, 19.99%.
  await expect(page.locator('.limit .label')).toHaveText(
    'Ausländeranteil (Ende 2019): von 0.00% bis 19.99%',
  );
  await expect(page.getByLabel('Zweite Abstimmung')).toHaveValue('5970');
});

test('A link without votes', async ({ page }) => {
  // Its selection waits for a first vote, on whose tracks the page reads it.
  await page.goto('de/compare/#foreigners=-19.98');
  await expect(page.locator('.limit')).toHaveCount(0);
  await page.getByLabel('Erste Abstimmung').selectOption('5960');
  await expect(page.locator('.limit .label')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await expect(page).toHaveURL(/\/de\/compare\/#votes=5960&foreigners=-19.98$/);
});
