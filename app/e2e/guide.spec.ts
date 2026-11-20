// The reading guide (spec reading-guide), against the built site. The figures are those of
// investigations/limits.md.
import { expect, test, type Page } from '@playwright/test';

/** A section of the guide, by its heading. */
const section = (page: Page, heading: string) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: heading }) });

test('the page "Lesehilfe": its heading, the way back and its seven sections', async ({ page }) => {
  await page.goto('de/guide/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lesehilfe');
  await expect(page.getByRole('link', { name: 'Alle Abstimmungen' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Das echte Ergebnis',
    'Gemeinden auswählen',
    'Was die Auswahl nicht zeigt',
    'Auslandschweizerinnen und Auslandschweizer',
    'Gemeinden ohne eigenes Ergebnis oder ohne Angabe',
    'Die Merkmale',
    'Quellen',
  ]);
  await expect(section(page, 'Quellen')).toHaveCount(1);
});

test('the real result: the official result first', async ({ page }) => {
  await page.goto('de/guide/');
  await expect(section(page, 'Das echte Ergebnis')).toContainText(
    'Oben auf der Seite einer Abstimmung steht ihr amtliches Ergebnis.',
  );
  await expect(section(page, 'Das echte Ergebnis')).toContainText('Mit Ihrer Auswahl');
});

test('how a selection works: the rule in plain words', async ({ page }) => {
  await page.goto('de/guide/');
  const rule = section(page, 'Gemeinden auswählen');
  await expect(rule).toContainText(
    'Eine Gemeinde bleibt nur, wenn sie innerhalb aller Grenzen liegt.',
  );
  await expect(rule).toContainText(
    'Ein Kanton, in dem keine Gemeinde übrig ist, hat keine Standesstimme.',
  );
  await expect(rule).toContainText('dunkelgrau');
});

test('The sentence in the guide: the address holds the selection', async ({ page }) => {
  // Spec reading-guide, "Sharing a selection explained".
  await page.goto('de/guide/');
  await expect(section(page, 'Gemeinden auswählen').locator('p').last()).toHaveText(
    'Die Adresse der Seite hält Ihre Auswahl fest: Wer sie öffnet, sieht dieselbe Auswahl.',
  );
});

test('what a selection does not show: municipalities, not people, and no forecast', async ({
  page,
}) => {
  await page.goto('de/guide/');
  const not = section(page, 'Was die Auswahl nicht zeigt');
  await expect(not).toContainText(
    'Eine Gemeinde mit vielen über 65-Jährigen zählt mit allen ihren Stimmen, auch mit denen der Jüngeren.',
  );
  await expect(not).toContainText('Die Auswahl ist keine Prognose.');
});

test('the Swiss abroad explained: they count only where a municipality remains', async ({
  page,
}) => {
  // investigations/limits.md, 1.
  await page.goto('de/guide/');
  const abroad = section(page, 'Auslandschweizerinnen und Auslandschweizer');
  await expect(abroad).toContainText('11 oder 12 Kantone');
  await expect(abroad).toContainText('1.0% bis 1.6% der gültigen Stimmen');
  await expect(abroad).toContainText(
    'Sie zählen nur in einem Kanton, in dem noch eine Gemeinde übrig ist.',
  );
});

test('municipalities without a figure explained', async ({ page }) => {
  // investigations/limits.md, 2.
  await page.goto('de/guide/');
  const without = section(page, 'Gemeinden ohne eigenes Ergebnis oder ohne Angabe');
  await expect(without).toContainText(
    'Eine Gemeinde ohne Angabe fällt weg, sobald die Grenze dieses Merkmals enger gestellt ist.',
  );
  await expect(without).toContainText('schraffiert');
});

test('the characteristics explained: the dates of their figures, the four logarithmic tracks', async ({
  page,
}) => {
  await page.goto('de/guide/');
  const characteristics = section(page, 'Die Merkmale');
  await expect(characteristics).toContainText('Volkszählung 2000');
  await expect(characteristics).toContainText('letzten Nationalratswahl vor ihrem Tag');
  await expect(characteristics).toContainText(
    'Die Grenzen von «Einwohner», «Einwohner je km²», «Fläche» und «Rinder je Einwohner» wachsen ' +
      'von Schritt zu Schritt um den gleichen Faktor',
  );
});

test('the sources, with the dates of the data files of 2026-11-16', async ({ page }) => {
  await page.goto('de/guide/');
  const sources = section(page, 'Quellen');
  for (const name of [
    'Bundesamt für Statistik (BFS)',
    'Bundeskanzlei',
    'Stand 1. Januar 2026',
    'ThemaKart 2026',
    'STATPOP',
    'Nationalratswahlen',
    'Volkszählung 2000',
    'Landwirtschaftliche Strukturerhebung',
    'swissBOUNDARIES3D 2026',
  ]) {
    await expect(sources).toContainText(name);
  }
  const record = sources.getByRole('link', { name: 'data/sources.json' });
  await expect(record).toHaveAttribute('href', /\/data\/sources\.json$/);
  const response = await page.request.get((await record.getAttribute('href')) ?? '');
  expect(response.ok()).toBe(true);
});

// Spec reading-guide, "Every page links to the guide": from the head of every page (spec
// site-style, "The head of every page").
test('from the start page: "Lesehilfe" in its head, and no other link below its heading', async ({
  page,
}) => {
  await page.goto('de/');
  await expect(page.getByRole('link', { name: 'Lesehilfe und Quellen' })).toHaveCount(0);
  await page.locator('header').getByRole('link', { name: 'Lesehilfe' }).click();
  await expect(page).toHaveURL(/\/de\/guide\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lesehilfe');
});

test('from a vote\'s page: "Lesehilfe" in its head', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.locator('header').getByRole('link', { name: 'Lesehilfe' }).click();
  await expect(page).toHaveURL(/\/de\/guide\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lesehilfe');
});

test('the sentence at the limits, with its link to the guide', async ({ page }) => {
  await page.goto('de/votes/5960/');
  const limits = page.locator('.limits');
  await expect(limits.locator('p').first()).toHaveText(
    'Ein Gedankenexperiment: So wäre die Abstimmung ausgegangen, wenn nur die ausgewählten ' +
      'Gemeinden abgestimmt hätten. Es zeigt nicht, wie einzelne Menschen gestimmt haben, und ist ' +
      'keine Prognose. Lesehilfe und Quellen',
  );
  await limits.getByRole('link', { name: 'Lesehilfe und Quellen' }).click();
  await expect(page).toHaveURL(/\/de\/guide\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lesehilfe');
});
