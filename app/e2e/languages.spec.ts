// The three languages (spec interface-languages), against the built site. The terms are those of
// investigations/languages.md.
import { expect, test, type Page } from '@playwright/test';

/** The language a page declares in its markup. */
const languageOf = (page: Page) => page.locator('html').getAttribute('lang');

/** The switch at the top of a page. */
const switchOf = (page: Page) => page.locator('nav.languages');

test('from German to French: the same page, in French', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await switchOf(page).getByRole('link', { name: 'Français' }).click();
  // The link has no final slash; GitHub Pages adds it, and the page is the same without it (Q,
  // 2026-11-17; spec verdicts, "A vote's address without the final slash").
  await expect(page).toHaveURL(/\/fr\/votes\/5960\/?$/);
  expect(await languageOf(page)).toBe('fr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Initiative populaire «Pour le couple et la famille - Non à la pénalisation du mariage»',
  );
});

test('the switch on the start page and the guide: the others are links, the own is not', async ({
  page,
}) => {
  for (const path of ['it/', 'it/guide/']) {
    await page.goto(path);
    const languages = switchOf(page);
    await expect(languages).toHaveText(/Deutsch\s*Français\s*Italiano/);
    const target = path.replace(/^it\//, '');
    // A link of the switch has no final slash (resolve); the page is the same with it.
    await expect(languages.getByRole('link', { name: 'Deutsch' })).toHaveAttribute(
      'href',
      new RegExp(`/de/${target}?$`),
    );
    await expect(languages.getByRole('link', { name: 'Français' })).toHaveAttribute(
      'href',
      new RegExp(`/fr/${target}?$`),
    );
    await expect(languages.getByRole('link', { name: 'Italiano' })).toHaveCount(0);
    await expect(languages.getByText('Italiano')).toHaveAttribute('aria-current', 'page');
  }
});

test('a selection stays behind: the other language opens the page anew', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.getByLabel('Merkmal hinzufügen').selectOption({ label: 'Ausländeranteil' });
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  await page
    .getByRole('slider', { name: 'Obere Grenze: Ausländeranteil', exact: true })
    .fill('327');
  await expect(page.locator('.selection')).toHaveCount(1);
  await switchOf(page).getByRole('link', { name: 'Italiano' }).click();
  await expect(page).toHaveURL(/\/it\/votes\/5960\/?$/);
  // Wait until the Italian page's limits and map are there before counting what they hold.
  await expect(page.getByLabel('Aggiungere una caratteristica')).toBeVisible();
  await expect(page.locator('.municipalities [data-number="261"]')).toBeVisible();
  await expect(page.locator('.limit')).toHaveCount(0);
  await expect(page.locator('.selection')).toHaveCount(0);
  await expect(page.locator('.municipalities [fill="#2c2c2c"]')).toHaveCount(0);
});
