// The selection in the address (spec share-link), against the built site. The figures are those of
// investigations/limits.md and investigations/share-link.md.
import { expect, test, type Page } from '@playwright/test';

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
