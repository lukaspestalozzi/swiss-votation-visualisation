// The selection in the address (spec share-link), against the built site. The figures are those of
// investigations/limits.md and investigations/share-link.md.
import { expect, test, type Page } from '@playwright/test';
import { HASHCHANGE_HANDLED, MEASURE_HASHCHANGE, fontsLoaded, measuredFrames } from './frames.ts';

// The site's path, before the addresses the spec names.
const SITE = '/swiss-votation-visualisation';

/** Open a vote's page and wait until the limits can be used. */
async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByLabel('Merkmal hinzufügen')).toBeVisible();
}

/** Add the limit of a characteristic from the list. */
async function addLimit(page: Page, name: string): Promise<void> {
  await page.getByLabel('Merkmal hinzufügen').selectOption({ label: name });
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
}

/** A slider of a limit, by its bound and its characteristic's name. */
const slider = (page: Page, bound: 'Untere' | 'Obere', name: string) =>
  page.getByRole('slider', { name: `${bound} Grenze: ${name}`, exact: true });

/** The page's address as the spec writes it: its path below the site's, and its hash. */
function address(page: Page): string {
  const { pathname, hash } = new URL(page.url());
  return `${pathname.slice(SITE.length)}${hash}`;
}

/** Twice the half second after which the address follows the selection (design, decision 5). */
const waitASecond = (page: Page) => page.waitForTimeout(1000);

test('A limit', async ({ page }) => {
  await open(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-19.98');
});

/** The switch for the Swiss abroad. */
const abroadSwitch = (page: Page) =>
  page.getByRole('checkbox', { name: /Auslandschweizerinnen und Auslandschweizer mitzählen/ });

test('Two limits and the switch', async ({ page }) => {
  await open(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await addLimit(page, 'Einwohner');
  await slider(page, 'Untere', 'Einwohner').fill('500');
  await abroadSwitch(page).uncheck();
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-19.98&inhabitants=3508-&abroad=no');
});

test('A limit that sets nothing aside', async ({ page }) => {
  await open(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-');
});

test('Back to the real result', async ({ page }) => {
  await open(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-');
  await page.getByRole('button', { name: 'Zurück zum echten Ergebnis' }).click();
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/');
});

test('The keys in French', async ({ page }) => {
  await page.goto('fr/votes/5960/');
  const list = page.getByLabel('Ajouter une caractéristique');
  for (const name of ['Habitants', 'Part des étrangers']) {
    await list.selectOption({ label: name });
    await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
  }
  await waitASecond(page);
  expect(address(page)).toBe('/fr/votes/5960/#inhabitants=-&foreigners=-');
});

test('Back leaves the page', async ({ page }) => {
  await page.goto('de/');
  await page
    .getByRole('link', { name: 'Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»' })
    .click();
  await expect(page.getByLabel('Merkmal hinzufügen')).toBeVisible();
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-19.98');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Popular Vote Explorer');
  expect(address(page)).toBe('/de/');
});

test('Nothing is sent', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await open(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await waitASecond(page);
  await page.reload();
  await expect(page.getByLabel('Merkmal hinzufügen')).toBeVisible();
  expect(requested.length).toBeGreaterThan(0);
  expect(requested.filter((url) => url.includes('foreigners'))).toEqual([]);
});

test('A held key', async ({ page }) => {
  // The page's calls of history.replaceState, which SvelteKit's shallow goto makes
  // (investigations/share-link.md, 2).
  await page.addInitScript(() => {
    const counted = window as unknown as { replaced: number };
    counted.replaced = 0;
    const replace = history.replaceState.bind(history);
    history.replaceState = (...args: Parameters<History['replaceState']>) => {
      counted.replaced += 1;
      replace(...args);
    };
  });
  const replaced = () => page.evaluate(() => (window as unknown as { replaced: number }).replaced);
  await open(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await waitASecond(page);
  await page.evaluate(() => {
    (window as unknown as { replaced: number }).replaced = 0;
  });
  await slider(page, 'Obere', 'Ausländeranteil').focus();
  for (let press = 0; press < 100; press += 1) {
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(33);
  }
  await waitASecond(page);
  expect(await replaced()).toBe(1);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-54.99');
});

/** The label of the limit of a characteristic. */
const label = (page: Page, name: string) =>
  page.locator('.limit .label').filter({ hasText: new RegExp(`^${name} \\(`) });

test('A link', async ({ page }) => {
  await page.goto('de/votes/5960/#foreigners=-19.98');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  ]);
  const selection = page.locator('.result.selection');
  await expect(selection.getByRole('heading', { name: 'Mit Ihrer Auswahl' })).toBeVisible();
  await expect(selection.locator('.figures dd').nth(2)).toHaveText('52.47%');
  await expect(page.locator('.limits .count')).toHaveText(
    "In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis.",
  );
});

test('A value no step has', async ({ page }) => {
  await page.goto('de/votes/5960/#foreigners=-20&inhabitants=3000-');
  await expect(label(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await expect(label(page, 'Einwohner')).toHaveText("Einwohner (Ende 2015): von 2'987 bis 396'955");
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-19.98&inhabitants=2987-');
});

test('A reload', async ({ page }) => {
  await open(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await abroadSwitch(page).uncheck();
  const figures = page.locator('.result.selection .figures dd');
  await expect(figures).toHaveCount(3);
  const before = await figures.allTextContents();
  await waitASecond(page);
  await page.reload();
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  ]);
  await expect(abroadSwitch(page)).not.toBeChecked();
  await expect(figures).toHaveText(before);
});

test('The characteristics cannot be loaded', async ({ page }) => {
  await page.route('**/data/characteristics.json', (route) => route.abort());
  await page.goto('de/votes/5960/#foreigners=-19.98');
  await expect(
    page.locator('.limits').getByText('Ohne die Merkmale lassen sich keine Gemeinden auswählen.'),
  ).toBeVisible();
  await expect(page.locator('.figures dd').first()).toHaveText("1'609'152");
  await expect(page.getByText('Mit Ihrer Auswahl')).toHaveCount(0);
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-19.98');
});

test('Another link to the same vote', async ({ page }) => {
  await open(page, 'de/votes/5960/');
  await addLimit(page, 'Einwohner');
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#inhabitants=-');
  // A mark that a page loaded again would not have.
  await page.evaluate(() => {
    (window as unknown as { mark: string }).mark = 'the same page';
  });
  await page.goto('de/votes/5960/#foreigners=-19.98');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  ]);
  expect(await page.evaluate(() => (window as unknown as { mark?: string }).mark)).toBe(
    'the same page',
  );
});

/** The sentence that names the parts of the address the page could not use. */
const unusable = (page: Page) =>
  page.locator('.limits').getByText('Diese Angaben der Adresse liessen sich nicht anwenden:');

test('An unknown characteristic', async ({ page }) => {
  await page.goto('de/votes/5960/#rainfall=1-2&foreigners=-19.98');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  ]);
  await expect(unusable(page)).toHaveText(
    'Diese Angaben der Adresse liessen sich nicht anwenden: «rainfall=1-2».',
  );
});

test('Bounds that cannot be used', async ({ page }) => {
  await page.goto("de/votes/5960/#foreigners=30-20&inhabitants=1'000-&abroad=yes");
  await expect(unusable(page)).toHaveText(
    'Diese Angaben der Adresse liessen sich nicht anwenden: «foreigners=30-20», ' +
      "«inhabitants=1'000-», «abroad=yes».",
  );
  await expect(page.locator('.limit')).toHaveCount(0);
  await expect(abroadSwitch(page)).toBeChecked();
});

test('A characteristic twice', async ({ page }) => {
  await page.goto('de/votes/5960/#foreigners=-19.98&foreigners=10-');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  ]);
  await expect(unusable(page)).toHaveText(
    'Diese Angaben der Adresse liessen sich nicht anwenden: «foreigners=10-».',
  );
});

test('Adding a limit', async ({ page }) => {
  await page.goto('de/votes/5960/#rainfall=1-2');
  await expect(unusable(page)).toBeVisible();
  await addLimit(page, 'Einwohner');
  await expect(unusable(page)).toHaveCount(0);
});

test('A link to a tie-break question', async ({ page }) => {
  await page.goto('de/votes/6823/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await waitASecond(page);
  const shown = await page.evaluate(() => document.body.innerText);
  // The spec's link, and one that a page reading its address would write anew.
  for (const hash of ['#foreigners=-19.98', '#rainfall=1-2&foreigners=-20']) {
    await page.goto('about:blank');
    await page.goto(`de/votes/6823/${hash}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await waitASecond(page);
    expect(await page.evaluate(() => document.body.innerText)).toBe(shown);
    expect(address(page)).toBe(`/de/votes/6823/${hash}`);
  }
});

test.describe(() => {
  // A budget test runs once more when a frame exceeds its budget (spec share-link, "The budget of
  // a link"), as the limits' do.
  test.describe.configure({ retries: 1 });

  test('All 21 limits in the same tab', async ({ page }) => {
    // The link, as the page writes it: every characteristic, each bound at step 100 or 900.
    await open(page, 'de/votes/5960/');
    const list = page.getByLabel('Merkmal hinzufügen');
    for (let added = 0; added < 21; added += 1) {
      const [name] = await list.locator('option:not([value=""])').allTextContents();
      await addLimit(page, name);
    }
    const sliders = page.getByRole('slider');
    await expect(sliders).toHaveCount(42);
    for (let i = 0; i < 42; i += 1) await sliders.nth(i).fill(i % 2 === 0 ? '100' : '900');
    await waitASecond(page);
    const { hash } = new URL(page.url());
    expect(hash.split('&')).toHaveLength(21);

    await page.goto('about:blank');
    await page.addInitScript(MEASURE_HASHCHANGE);
    await open(page, 'de/votes/5960/');
    await fontsLoaded(page);
    await page.evaluate(HASHCHANGE_HANDLED);
    await page.goto(`de/votes/5960/${hash}`);
    await expect(page.locator('.limit')).toHaveCount(21);
    const frames = await measuredFrames(page);
    expect(frames.map((frame) => frame.type)).toEqual(['hashchange']);
    expect(frames.filter((frame) => frame.work > 100)).toEqual([]);
  });
});
