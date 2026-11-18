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

/** The boxes of the zoom buttons and of the map, once the map has loaded. */
async function zoomButtonsAndMap(page: Page) {
  await page.goto('de/votes/5960/');
  await page.locator('.municipalities path').nth(2000).waitFor();
  const buttons = await Promise.all(
    ['Vergrössern', 'Verkleinern', 'Ganze Schweiz'].map(async (name) =>
      page.getByRole('button', { name, exact: true }).boundingBox(),
    ),
  );
  const map = await page.locator('.map svg').boundingBox();
  if (map === null || buttons.some((box) => box === null)) throw new Error('not on the screen');
  return { buttons: buttons.filter((box) => box !== null), map };
}

test.describe('in a window 1,280 pixels wide', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the zoom buttons stand over the map, at its top right', async ({ page }) => {
    const { buttons, map } = await zoomButtonsAndMap(page);
    for (const button of buttons) {
      expect(button.x).toBeGreaterThanOrEqual(map.x);
      expect(button.x + button.width).toBeLessThanOrEqual(map.x + map.width);
      expect(button.y).toBeGreaterThanOrEqual(map.y);
      // In the top right corner: within its height from the map's top, in its right half.
      expect(button.y + button.height).toBeLessThanOrEqual(map.y + button.height + 1);
      expect(button.x).toBeGreaterThan(map.x + map.width / 2);
    }
  });
});

test.describe('on a phone', () => {
  test.use(phone);

  test('the zoom buttons stand above the map', async ({ page }) => {
    const { buttons, map } = await zoomButtonsAndMap(page);
    for (const button of buttons) expect(button.y + button.height).toBeLessThanOrEqual(map.y);
  });

  test('the controls are at least 44 × 44 pixels', async ({ page }) => {
    await page.goto('de/votes/5960/');
    await page.locator('.municipalities path').nth(2000).waitFor();
    await page.getByLabel('Merkmal hinzufügen').selectOption('Ausländeranteil');
    await page.getByRole('button', { name: 'Hinzufügen', exact: true }).tap();
    await page.getByRole('slider', { name: 'Obere Grenze: Ausländeranteil' }).fill('327');
    const controls = {
      '+': page.getByRole('button', { name: 'Vergrössern' }),
      '−': page.getByRole('button', { name: 'Verkleinern' }),
      'Ganze Schweiz': page.getByRole('button', { name: 'Ganze Schweiz' }),
      'Merkmal hinzufügen': page.getByLabel('Merkmal hinzufügen'),
      Hinzufügen: page.getByRole('button', { name: 'Hinzufügen', exact: true }),
      Entfernen: page.getByRole('button', { name: 'Entfernen: Ausländeranteil' }),
      'Zurück zum echten Ergebnis': page.getByRole('button', {
        name: 'Zurück zum echten Ergebnis',
      }),
      // The switch by its label, which a tap on its text toggles too.
      switch: page.locator('label').filter({ has: page.getByRole('checkbox') }),
    };
    const sizes = await Promise.all(
      Object.entries(controls).map(async ([name, control]) => {
        const box = await control.boundingBox();
        return [name, box === null ? null : [box.width >= 44, box.height >= 44]] as const;
      }),
    );
    expect(sizes).toEqual(Object.keys(controls).map((name) => [name, [true, true]]));
  });

  test('a thumb takes a press 20 pixels beside its centre', async ({ page }) => {
    await page.goto('de/votes/5960/');
    await page.getByLabel('Merkmal hinzufügen').selectOption('Ausländeranteil');
    await page.getByRole('button', { name: 'Hinzufügen', exact: true }).tap();
    const upper = page.getByRole('slider', { name: 'Obere Grenze: Ausländeranteil' });
    const lower = page.getByRole('slider', { name: 'Untere Grenze: Ausländeranteil' });
    await upper.fill('327');
    await upper.scrollIntoViewIfNeeded();
    const track = await upper.boundingBox();
    if (track === null) throw new Error('the track is not on the screen');
    expect(track.height).toBeGreaterThanOrEqual(44);
    // A thumb 44 pixels wide moves from the track's start to its end less its width. This browser
    // moves no native slider for a finger (investigations/small-screens.md, 4): the mouse
    // presses, on the phone's emulation, where the thumb takes the pointer.
    const centre = {
      x: track.x + 22 + (327 / 1000) * (track.width - 44),
      y: track.y + track.height / 2,
    };
    await page.mouse.move(centre.x - 20, centre.y);
    await page.mouse.down();
    await page.mouse.move(centre.x - 120, centre.y, { steps: 10 });
    await page.mouse.up();
    expect(Number(await upper.inputValue())).toBeLessThan(327);
    expect(await lower.inputValue()).toBe('0');
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
