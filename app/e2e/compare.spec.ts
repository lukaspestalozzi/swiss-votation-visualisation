// The comparison of two votes (spec vote-comparison), against the built site. The figures are
// those of investigations/vote-comparison.md and investigations/limits.md.
import { expect, test, type Page } from '@playwright/test';
import { lowContrast } from './contrast.ts';
import { phone } from './fingers.ts';
import { MEASURE_FRAMES, fontsLoaded, measuredFrames } from './frames.ts';
import { addButton, addLimit, pageHead, languageSwitch, limitList } from './parts.ts';

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
  const head = pageHead(page);
  await expect(head.getByRole('link', { name: 'Popular Vote Explorer' })).toHaveAttribute(
    'href',
    /\/swiss-votation-visualisation\/de\/?$/,
  );
  await expect(head.getByRole('link', { name: 'Vergleichen' })).toHaveCount(0);
  await expect(head.getByText('Vergleichen', { exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(head.getByRole('link', { name: 'Lesehilfe' })).toHaveAttribute(
    'href',
    /\/swiss-votation-visualisation\/de\/guide\/?$/,
  );
  await expect(languageSwitch(page).locator('[aria-current="page"]')).toHaveText('Deutsch');
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

test('The characteristics cannot be loaded', async ({ page }) => {
  // Spec vote-comparison, "Loading the votes": the tables show their real results.
  await page.route('**/data/characteristics.json', (route) => route.abort());
  await page.goto('de/compare/#votes=5960,5970&foreigners=-19.98');
  await expect(
    page.getByText('Ohne die Merkmale lassen sich keine Gemeinden auswählen.'),
  ).toBeVisible();
  for (const id of [5960, 5970]) {
    await expect(tableOf(page, id).locator('thead th')).toHaveText(['Echtes Ergebnis']);
  }
  expect((await rowsOf(page, 5960)).rows[0]).toEqual(['Ja-Stimmen', "1'609'152"]);
  // Without the characteristics the page writes nothing (design, decision 8).
  await page.waitForTimeout(1000);
  expect(new URL(page.url()).hash).toBe('#votes=5960,5970&foreigners=-19.98');
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
  await expect(addButton(page)).toBeVisible();
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
  await expect(addButton(page)).toBeVisible();
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

test('The language switch carries the comparison', async ({ page }) => {
  // Spec interface-languages, "The switch between the languages": the address the page wrote.
  await page.goto('de/compare/#votes=5960&foreigners=-19.98');
  await expect(page.locator('.limit .label')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await page.getByLabel('Zweite Abstimmung').selectOption('5970');
  await expect(page).toHaveURL(/#votes=5960,5970&foreigners=-19\.98$/);
  await languageSwitch(page).getByRole('link', { name: 'Français' }).click();
  await expect(page).toHaveURL(/\/fr\/compare\/?#votes=5960,5970&foreigners=-19\.98$/);
  expect(await languageOf(page)).toBe('fr');
  await expect(page.getByLabel('Première votation')).toHaveValue('5960');
  await expect(page.getByLabel('Deuxième votation')).toHaveValue('5970');
  await expect(page.locator('.limit .label')).toHaveText(
    'Part des étrangers (fin 2015): de 0.00% à 19.98%',
  );
  await expect(tableOf(page, 5970).locator('thead th')).toHaveText([
    'Vrai résultat',
    'Avec votre sélection',
  ]);
});

test('A link without votes in the same tab', async ({ page }) => {
  // The address keeps a selection that waits for a first vote, as when the page opens with it.
  await page.goto('de/compare/#votes=5960');
  await expect(addButton(page)).toBeVisible();
  await page.goto('de/compare/#foreigners=-19.98');
  await expect(page.getByLabel('Erste Abstimmung')).toHaveValue('');
  await expect(page.locator('.limit')).toHaveCount(0);
  await page.waitForTimeout(1000);
  expect(new URL(page.url()).hash).toBe('#foreigners=-19.98');
  await page.getByLabel('Erste Abstimmung').selectOption('5960');
  await expect(page.locator('.limit .label')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await expect(page).toHaveURL(/\/de\/compare\/#votes=5960&foreigners=-19\.98$/);
});

test('The second vote chosen as the first', async ({ page }) => {
  // Design, decision 9: the second choice is emptied.
  await page.goto('de/compare/#votes=5960,5970');
  await expect(addButton(page)).toBeVisible();
  await page.getByLabel('Erste Abstimmung').selectOption('5970');
  await expect(page.getByLabel('Zweite Abstimmung')).toHaveValue('');
  await expect(page.locator('[data-vote]')).toHaveCount(1);
  await expect(page).toHaveURL(/\/de\/compare\/#votes=5970$/);
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

test('From a vote with a selection', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await page
    .getByRole('slider', { name: 'Obere Grenze: Ausländeranteil', exact: true })
    .fill('327');
  await page.getByRole('link', { name: 'Mit einer anderen Abstimmung vergleichen' }).click();
  await expect(page).toHaveURL(
    /\/swiss-votation-visualisation\/de\/compare\/#votes=5960&foreigners=-19\.98$/,
  );
  await expect(page.locator('.limit .label')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await expect(tableOf(page, 5960).locator('thead th')).toHaveText([
    'Echtes Ergebnis',
    'Mit Ihrer Auswahl',
  ]);
  await expect(page.getByLabel('Zweite Abstimmung')).toHaveValue('');
});

test('No comparison of the tie-break question', async ({ page }) => {
  await page.goto('de/votes/6823/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Mit einer anderen Abstimmung vergleichen' }),
  ).toHaveCount(0);
});

/** The width of the page, which is the window's when nothing reaches past it. */
const pageWidth = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth);

/** The boxes of the chosen votes 5960 and 5970, once both tables show the selection. */
async function boxesOf(page: Page) {
  for (const id of [5960, 5970]) await expect(tableOf(page, id).locator('thead th')).toHaveCount(2);
  const [first, second] = await Promise.all(
    [5960, 5970].map((id) => page.locator(`[data-vote="${String(id)}"]`).boundingBox()),
  );
  if (first === null || second === null) throw new Error('not on the screen');
  return { first, second };
}

test.describe('in a window 360 pixels wide', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('Two tables in a narrow window', async ({ page }) => {
    for (const language of ['de', 'fr', 'it']) {
      await page.goto(`${language}/compare/#votes=5960,5970&foreigners=-19.98`);
      const { first, second } = await boxesOf(page);
      expect(second.y, language).toBeGreaterThanOrEqual(first.y + first.height);
      expect(await pageWidth(page), language).toBeLessThanOrEqual(360);
    }
  });
});

test.describe('in a window 1,280 pixels wide', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the tables stand side by side', async ({ page }) => {
    await page.goto('de/compare/#votes=5960,5970&foreigners=-19.98');
    const { first, second } = await boxesOf(page);
    expect(second.x).toBeGreaterThanOrEqual(first.x + first.width);
    expect(second.y).toBe(first.y);
  });
});

test.describe('on a phone', () => {
  test.use(phone);

  test('the lists are at least 44 × 44 pixels', async ({ page }) => {
    await page.goto('de/compare/#votes=5960,5970');
    await expect(tableOf(page, 5970)).toBeVisible();
    const lists = ['Erste Abstimmung', 'Zweite Abstimmung'];
    const sizes = await Promise.all(
      lists.map(async (name) => {
        const box = await page.getByLabel(name).boundingBox();
        return [name, box === null ? null : [box.width >= 44, box.height >= 44]] as const;
      }),
    );
    expect(sizes).toEqual(lists.map((name) => [name, [true, true]]));
  });
});

test.describe('the bar on a phone', () => {
  test.use(phone);

  test('The bar', async ({ page }) => {
    await page.goto('de/compare/#votes=5960,5970&foreigners=-19.98');
    for (const id of [5960, 5970])
      await expect(tableOf(page, id).locator('thead th')).toHaveCount(2);
    await page.locator('.limits').evaluate((limits) => {
      limits.scrollIntoView({ block: 'center' });
    });
    const bar = page.locator('.comparison-bar');
    await expect(bar.locator('p')).toHaveText([
      'Erste Abstimmung: Angenommen',
      'Zweite Abstimmung: Abgelehnt',
    ]);
    await expect(bar.locator('.side-yes')).toHaveText('Angenommen');
    await expect(bar.locator('.side-no')).toHaveText('Abgelehnt');
    // At the bottom of the window.
    const box = await bar.boundingBox();
    const height = await page.evaluate(() => innerHeight);
    expect(Math.abs((box?.y ?? NaN) + (box?.height ?? NaN) - height)).toBeLessThanOrEqual(1);
    // Without a selection, no bar.
    await page.getByRole('button', { name: 'Zurück zum echten Ergebnis' }).click();
    await expect(bar).toBeHidden();
  });
});

// The map's darkest classes in the light scheme and its class 2 in the dark one (spec site-style,
// "The verdicts in the map's colours").
const SIDES = {
  light: { yes: 'rgb(0, 114, 96)', no: 'rgb(147, 67, 25)' },
  dark: { yes: 'rgb(75, 193, 173)', no: 'rgb(229, 148, 111)' },
} as const;

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`in the ${colorScheme} scheme`, () => {
    test.use({ colorScheme });

    test('The colours of the tables', async ({ page }) => {
      await page.goto('de/compare/#votes=5960,5970&foreigners=-19.98');
      for (const id of [5960, 5970]) {
        await expect(tableOf(page, id).locator('thead th')).toHaveCount(2);
      }
      // Each word of a side, row by row: the real result, then the selection's.
      const words = await page
        .locator('table td span')
        .evaluateAll((spans) =>
          spans.map((span) => [span.textContent.trim(), getComputedStyle(span).color]),
        );
      const { yes, no } = SIDES[colorScheme];
      expect(
        words.filter(([word]) => ['Ja', 'Nein', 'Angenommen', 'Abgelehnt'].includes(word)),
      ).toEqual([
        ['Nein', no],
        ['Ja', yes],
        ['Ja', yes],
        ['Ja', yes],
        ['Abgelehnt', no],
        ['Angenommen', yes],
        ['Nein', no],
        ['Nein', no],
        ['Nein', no],
        ['Nein', no],
        ['Abgelehnt', no],
        ['Abgelehnt', no],
      ]);
      expect(await lowContrast(page)).toEqual([]);
    });
  });
}

/** The comparison of 5960 and 5970 with the share of foreigners at its track's ends, measured. */
async function openMeasured(page: Page): Promise<void> {
  await page.addInitScript(MEASURE_FRAMES);
  await page.goto('de/compare/#votes=5960,5970&foreigners=-');
  for (const id of [5960, 5970]) await expect(tableOf(page, id)).toBeVisible();
  await expect(page.locator('.limit')).toHaveCount(1);
  await fontsLoaded(page);
}

/** Forget the frames measured so far. */
const forgetFrames = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as { __frames: unknown[] }).__frames = [];
  });

// The budget of the comparison (spec vote-comparison; design of add-vote-comparison, decision 11),
// measured as the limits' budget, and once more when a frame exceeds it.
test.describe(() => {
  test.describe.configure({ retries: 1 });

  test('the budget: Dragging a bound with two votes', async ({ page }) => {
    await openMeasured(page);
    const upper = page.getByRole('slider', { name: 'Obere Grenze: Ausländeranteil', exact: true });
    await upper.scrollIntoViewIfNeeded();
    const box = await upper.boundingBox();
    if (box === null) throw new Error('the slider has no box');
    const y = box.y + box.height / 2;
    const [left, right] = [box.x + 10, box.x + box.width - 10];
    // The pointer rests on the thumb 50 ms before the press, as a person's does.
    await page.mouse.move(right, y);
    await page.waitForTimeout(50);
    await forgetFrames(page);
    await page.mouse.down();
    await page.mouse.move(left, y, { steps: 20 });
    await page.mouse.move(right, y, { steps: 20 });
    await page.mouse.up();
    const frames = await measuredFrames(page);
    expect(frames.filter((f) => f.type === 'input').length).toBeGreaterThanOrEqual(30);
    expect(frames.filter((f) => f.work > 16)).toEqual([]);
  });

  test('the budget: Jumps with two votes', async ({ page }) => {
    await openMeasured(page);
    await forgetFrames(page);
    // Each control at a person's pace: the pointer rests on it 50 ms before the click.
    const press = async (control: ReturnType<Page['getByRole']>) => {
      await control.hover();
      await page.waitForTimeout(50);
      await control.click();
    };
    await press(addButton(page));
    await press(limitList(page).getByRole('button', { name: 'Einwohner', exact: true }));
    const abroad = page.getByRole('checkbox', {
      name: /Auslandschweizerinnen und Auslandschweizer mitzählen/,
    });
    await press(abroad);
    await press(abroad);
    const second = page.getByLabel('Zweite Abstimmung');
    await second.selectOption('5980');
    await expect(tableOf(page, 5980)).toBeVisible();
    await page.waitForTimeout(50);
    await second.selectOption('5970');
    await expect(tableOf(page, 5970)).toBeVisible();
    await page.waitForTimeout(50);
    await press(page.getByRole('button', { name: 'Zurück zum echten Ergebnis' }));
    await expect(page.locator('.limit')).toHaveCount(0);
    const frames = await measuredFrames(page);
    expect(frames.filter((f) => f.type === 'click').length).toBeGreaterThanOrEqual(4);
    expect(frames.filter((f) => f.type === 'change').length).toBeGreaterThanOrEqual(3);
    expect(frames.filter((f) => f.work > 50)).toEqual([]);
  });
});
