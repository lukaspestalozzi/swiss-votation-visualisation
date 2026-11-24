// The selection in the address (spec share-link), against the built site. The figures are those of
// investigations/limits.md and investigations/share-link.md.
import { expect, test, type Page } from '@playwright/test';
import { HASHCHANGE_HANDLED, MEASURE_HASHCHANGE, fontsLoaded, measuredFrames } from './frames.ts';
import {
  abroadSwitch,
  addLimit,
  figuresOf,
  limitLabel,
  limitList,
  offered,
  openVote,
  ownResult,
  selectionResult,
  slider,
} from './parts.ts';

// The site's path, before the addresses the spec names.
const SITE = '/swiss-votation-visualisation';

/** The page's address as the spec writes it: its path below the site's, and its hash. */
function address(page: Page): string {
  const { pathname, hash } = new URL(page.url());
  return `${pathname.slice(SITE.length)}${hash}`;
}

/** Twice the half second after which the address follows the selection (design, decision 5). */
const waitASecond = (page: Page) => page.waitForTimeout(1000);

test('A limit', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-19.98');
});

test('Two limits and the switch', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await addLimit(page, 'Einwohner');
  await slider(page, 'Untere', 'Einwohner').fill('500');
  await abroadSwitch(page).uncheck();
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-19.98&inhabitants=3508-&abroad=no');
});

test('A limit that sets nothing aside', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-');
});

test('Back to the real result', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-');
  await page.getByRole('button', { name: 'Zurück zum echten Ergebnis' }).click();
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/');
  // No "#" at all: the hash of an address ending in "#" is empty too.
  expect(page.url()).toMatch(/\/de\/votes\/5960\/$/);
});

test('The keys in French', async ({ page }) => {
  await page.goto('fr/votes/5960/');
  for (const name of ['Habitants', 'Part des étrangers']) await addLimit(page, name, 'fr');
  await waitASecond(page);
  expect(address(page)).toBe('/fr/votes/5960/#inhabitants=-&foreigners=-');
});

test('A new characteristic in a link', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Arbeitsplätze je 100 Einwohner');
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#jobs=-');
  // A bound is written as its label writes it, with one decimal, and read back.
  await slider(page, 'Untere', 'Arbeitsplätze je 100 Einwohner').fill('500');
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#jobs=48.1-');
  await page.reload();
  await expect(page.locator('.limit .label')).toHaveText([
    'Arbeitsplätze je 100 Einwohner (Ende 2015): von 48.1 bis 445.5',
  ]);
});

// The keys of the 21 characteristics the site had before it had 35 (spec share-link, "The keys of
// the characteristics"): no link the site wrote then may stop applying.
const KEYS_OF_BEFORE = [
  'inhabitants',
  'foreigners',
  'age-0-17',
  'age-18-34',
  'age-35-49',
  'age-50-64',
  'age-65',
  'density',
  'fdp',
  'centre',
  'sp',
  'svp',
  'glp',
  'greens',
  'other-parties',
  'german',
  'french',
  'italian',
  'romansh',
  'area',
  'cattle',
];

test('A link of before', async ({ page }) => {
  await page.goto('de/votes/5960/#foreigners=-19.98');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  ]);
  await page.goto('about:blank');
  await page.goto(`de/votes/5960/#${KEYS_OF_BEFORE.map((key) => `${key}=-`).join('&')}`);
  await expect(page.locator('.limit')).toHaveCount(21);
  await expect(page.locator('.limit .label').nth(20)).toContainText('Rinder je Einwohner (2015)');
  await expect(page.getByText('Diese Angaben der Adresse liessen sich nicht anwenden')).toHaveCount(
    0,
  );
});

test('Back leaves the page', async ({ page }) => {
  await page.goto('de/');
  await page
    .getByRole('link', { name: 'Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»' })
    .click();
  await expect(limitList(page)).toBeVisible();
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
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await waitASecond(page);
  await page.reload();
  await expect(limitList(page)).toBeVisible();
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
  await openVote(page, 'de/votes/5960/');
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

test('A link', async ({ page }) => {
  await page.goto('de/votes/5960/#foreigners=-19.98');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  ]);
  const selection = selectionResult(page);
  await expect(selection.getByRole('heading', { name: 'Mit Ihrer Auswahl' })).toBeVisible();
  await expect(figuresOf(selection).nth(2)).toHaveText('52.47%');
  await expect(page.locator('.limits .count')).toHaveText(
    "In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis.",
  );
});

test('A value no step has', async ({ page }) => {
  await page.goto('de/votes/5960/#foreigners=-20&inhabitants=3000-');
  await expect(limitLabel(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await expect(limitLabel(page, 'Einwohner')).toHaveText(
    "Einwohner (Ende 2015): von 2'987 bis 396'955",
  );
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-19.98&inhabitants=2987-');
});

test('A reload', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await abroadSwitch(page).uncheck();
  const figures = figuresOf(selectionResult(page));
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
  await expect(figuresOf(ownResult(page)).first()).toHaveText("1'609'152");
  await expect(page.getByText('Mit Ihrer Auswahl')).toHaveCount(0);
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-19.98');
});

test('Another link to the same vote', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
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

test('A value no step has, in the same tab', async ({ page }) => {
  // The same selection, written otherwise: the page writes the address anew, as when it opens.
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-19.98');
  await page.goto('de/votes/5960/#foreigners=-20');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  ]);
  await waitASecond(page);
  expect(address(page)).toBe('/de/votes/5960/#foreigners=-19.98');
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

// The names of the 21 characteristics the site had before it had 35, in their order.
const NAMES_OF_BEFORE = [
  'Einwohner',
  'Ausländeranteil',
  '0–17 Jahre',
  '18–34 Jahre',
  '35–49 Jahre',
  '50–64 Jahre',
  '65 Jahre und älter',
  'Einwohner je km²',
  'FDP',
  'Die Mitte (bis 2020 CVP und BDP)',
  'SP',
  'SVP',
  'GLP',
  'Grüne',
  'Übrige Parteien',
  'Deutsch',
  'Französisch',
  'Italienisch',
  'Rätoromanisch',
  'Fläche',
  'Rinder je Einwohner',
];

/**
 * The frames after a link with the limits of `names`, each narrowed on both sides, is opened in
 * the tab that shows the vote: the link as the page writes it, every bound at step 100 or 900.
 */
async function framesOfLinkWith(page: Page, names: readonly string[]) {
  await openVote(page, 'de/votes/5960/');
  for (const name of names) await addLimit(page, name);
  const sliders = page.getByRole('slider');
  await expect(sliders).toHaveCount(2 * names.length);
  for (let i = 0; i < 2 * names.length; i += 1) {
    await sliders.nth(i).fill(i % 2 === 0 ? '100' : '900');
  }
  await waitASecond(page);
  const { hash } = new URL(page.url());
  expect(hash.split('&')).toHaveLength(names.length);

  await page.goto('about:blank');
  await page.addInitScript(MEASURE_HASHCHANGE);
  await openVote(page, 'de/votes/5960/');
  await fontsLoaded(page);
  await page.evaluate(HASHCHANGE_HANDLED);
  await page.goto(`de/votes/5960/${hash}`);
  await expect(page.locator('.limit')).toHaveCount(names.length);
  const frames = await measuredFrames(page);
  expect(frames.map((frame) => frame.type)).toEqual(['hashchange']);
  return frames;
}

test.describe(() => {
  // A budget test runs once more when a frame exceeds its budget (spec share-link, "The budget of
  // a link"), as the limits' do.
  test.describe.configure({ retries: 1 });

  test('All 21 limits in the same tab', async ({ page }) => {
    // The 21 limits the site had before it had 35, by their names.
    const frames = await framesOfLinkWith(page, NAMES_OF_BEFORE);
    expect(frames.filter((frame) => frame.work > 100)).toEqual([]);
  });

  test('All 35 limits in the same tab', async ({ page }) => {
    // Every characteristic of the list, in its order (design of add-more-characteristics, 14).
    await openVote(page, 'de/votes/5960/');
    const names = await offered(page);
    expect(names).toHaveLength(35);
    const frames = await framesOfLinkWith(page, names);
    expect(frames.filter((frame) => frame.work > 170)).toEqual([]);
  });
});
