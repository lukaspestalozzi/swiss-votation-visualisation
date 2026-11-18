// The site in a narrow window and on a touch screen (spec small-screens), against the built site.
// The widths and sizes are those of investigations/small-screens.md.
import { expect, test, type Page } from '@playwright/test';
import { phone } from './fingers.ts';
import { pointIn } from './pointing.ts';

/** The width of the page, which is the window's when nothing reaches past it. */
const pageWidth = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth);

test.describe('in a window 360 pixels wide', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('the longest word of a title breaks, and the page fits the window', async ({
    page,
    request,
  }) => {
    const list = (await (await request.get('data/votes.json')).json()) as {
      votes: { id: number; title: { de: string } }[];
    };
    const title = list.votes.find((vote) => vote.id === 6400)?.title.de;
    expect(title).toContain('Wirtschaftspartnerschaftsabkommens');
    await page.goto('de/votes/6400/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title ?? '');
    expect(await pageWidth(page)).toBeLessThanOrEqual(360);
  });

  test('the start page, the guide, the tie-break question and a French vote fit the window', async ({
    page,
  }) => {
    const paths = ['de', 'fr', 'it'].flatMap((lang) => [
      `${lang}/`,
      `${lang}/guide/`,
      `${lang}/votes/6823/`,
    ]);
    for (const path of [...paths, 'fr/votes/5960/']) {
      await page.goto(path);
      if (path === 'fr/votes/5960/') await page.locator('.municipalities path').nth(2000).waitFor();
      expect(await pageWidth(page), path).toBeLessThanOrEqual(360);
    }
  });
});

test.describe('on a touch screen 360 pixels wide', () => {
  test.use({ ...phone, viewport: { width: 360, height: 780 } });

  test('the verdicts in Italian stand side by side, and the page fits the window', async ({
    page,
  }) => {
    await page.goto('it/votes/5960/');
    await page.getByLabel('Aggiungere una caratteristica').selectOption('Quota di stranieri');
    await page.getByRole('button', { name: 'Aggiungere', exact: true }).tap();
    await page.getByRole('slider', { name: 'Limite superiore: Quota di stranieri' }).fill('327');
    await expect(page.getByRole('heading', { name: 'Con la Sua selezione' })).toBeVisible();
    // A page wider than the window is shown smaller, and a tap would miss: the width comes first.
    expect(await pageWidth(page)).toBeLessThanOrEqual(360);
    const zurich = await pointIn(page, '.municipalities [data-number="261"]');
    await page.touchscreen.tap(zurich.x, zurich.y);
    await expect(page.getByText("Abitanti: 396'955")).toBeVisible();
    expect(await pageWidth(page)).toBeLessThanOrEqual(360);
    // Side by side: each box's heading level with the other's, for the vote and the selection.
    for (const level of [2, 3]) {
      const top = async (name: string) =>
        (await page.getByRole('heading', { level, name, exact: true }).boundingBox())?.y;
      expect(await top('Maggioranza dei Cantoni')).toBe(await top('Maggioranza del popolo'));
    }
  });
});
