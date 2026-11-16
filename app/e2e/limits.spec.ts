// The limits (spec limits) and what follows them: the selection's result (spec verdicts) and the
// map (spec result-map), against the built site. The figures are those of
// investigations/limits.md.
import { expect, test, type Page } from '@playwright/test';

/** Open a vote's page and wait until the limits can be used. */
async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByLabel('Merkmal hinzufügen')).toBeVisible();
}

test('the section of a vote: between the outcome and the map, without a limit', async ({
  page,
}) => {
  await open(page, 'votes/5960/');
  await expect(page.getByRole('heading', { name: 'Gemeinden auswählen' })).toBeVisible();
  const order = await page.evaluate(() => {
    const at = (element: Element | null) =>
      element ? [...document.querySelectorAll('*')].indexOf(element) : -1;
    return [
      at(document.querySelector('.outcome')),
      at(document.querySelector('.limits')),
      at(document.querySelector('.map')),
    ];
  });
  expect(order[0]).toBeLessThan(order[1] ?? -1);
  expect(order[1]).toBeLessThan(order[2] ?? -1);
  await expect(page.getByRole('slider')).toHaveCount(0);
  await expect(
    page.getByRole('checkbox', { name: /Auslandschweizerinnen und Auslandschweizer mitzählen/ }),
  ).toBeChecked();
});

test('no limits for a tie-break question', async ({ page }) => {
  await page.goto('votes/6823/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Gemeinden auswählen')).toHaveCount(0);
});

/** The names the list "Merkmal hinzufügen" offers. */
async function offered(page: Page): Promise<string[]> {
  return page.getByLabel('Merkmal hinzufügen').locator('option:not([value=""])').allTextContents();
}

/** Add the limit of a characteristic from the list. */
async function addLimit(page: Page, name: string): Promise<void> {
  await page.getByLabel('Merkmal hinzufügen').selectOption({ label: name });
}

test('adding a limit: its label, and the list offers the others', async ({ page }) => {
  await open(page, 'votes/5960/');
  expect(await offered(page)).toHaveLength(21);
  await addLimit(page, 'Ausländeranteil');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 61.10%',
  ]);
  const others = await offered(page);
  expect(others).toHaveLength(20);
  expect(others).not.toContain('Ausländeranteil');
});

test('removing a limit: the list offers all 21 again', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await page.getByRole('button', { name: 'Entfernen: Ausländeranteil' }).click();
  await expect(page.locator('.limit')).toHaveCount(0);
  expect(await offered(page)).toHaveLength(21);
});

/** A slider of a limit, by its bound and its characteristic's name. */
const slider = (page: Page, bound: 'Untere' | 'Obere', name: string) =>
  page.getByRole('slider', { name: `${bound} Grenze: ${name}`, exact: true });

/** The label of the limit of a characteristic. */
const label = (page: Page, name: string) =>
  page.locator('.limit .label').filter({ hasText: new RegExp(`^${name} \\(`) });

test('a linear track: steps 327 and 328 of the foreigners', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await expect(label(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await slider(page, 'Obere', 'Ausländeranteil').fill('328');
  await expect(label(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 20.04%',
  );
});

test('a logarithmic track: the inhabitants from step 500', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Einwohner');
  await slider(page, 'Untere', 'Einwohner').fill('500');
  await expect(label(page, 'Einwohner')).toHaveText("Einwohner (Ende 2015): von 3'508 bis 396'955");
});

test('a logarithmic track from zero: the cattle at steps 1 and 500', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Rinder je Einwohner');
  await slider(page, 'Obere', 'Rinder je Einwohner').fill('1');
  await expect(label(page, 'Rinder je Einwohner')).toHaveText(
    'Rinder je Einwohner (2015): von 0.000 bis 0.001',
  );
  await slider(page, 'Obere', 'Rinder je Einwohner').fill('500');
  await expect(label(page, 'Rinder je Einwohner')).toHaveText(
    'Rinder je Einwohner (2015): von 0.000 bis 0.090',
  );
});

test('a step by key: the left arrow moves the upper bound one step', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(label(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 61.04%',
  );
  await expect(slider(page, 'Obere', 'Ausländeranteil')).toHaveAttribute(
    'aria-valuetext',
    '61.04%',
  );
});

test('the bounds do not cross: the lower one stops at the upper one', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await slider(page, 'Untere', 'Ausländeranteil').fill('1000');
  await expect(slider(page, 'Untere', 'Ausländeranteil')).toHaveValue('327');
  await expect(label(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 19.98% bis 19.98%',
  );
});

test('the labels of a vote: the date of each characteristic, its bounds as the panel writes them', async ({
  page,
}) => {
  await open(page, 'votes/6400/');
  for (const name of ['SVP', 'Italienisch', 'Fläche']) await addLimit(page, name);
  await expect(page.locator('.limit .label')).toHaveText([
    'SVP (Nationalratswahl 2019): von 0.00% bis 84.11%',
    'Italienisch (Volkszählung 2000): von 0.00% bis 96.84%',
    'Fläche (2026): von 0.32 km² bis 438.61 km²',
  ]);
});
