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

test.describe('the list of the limits in a window 360 pixels wide', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('the list and the limit of the longest name fit the window, in three languages', async ({
    page,
  }) => {
    // A list is as wide as its longest entry: the longest name of each language (design of
    // add-more-characteristics, decisions 2 and 13).
    const longest = [
      ['de', 'Merkmal hinzufügen', 'Bio-Anteil der landwirtschaftlichen Nutzfläche', 'Hinzufügen'],
      [
        'fr',
        'Ajouter une caractéristique',
        'Haute école ou formation professionnelle supérieure',
        'Ajouter',
      ],
      [
        'it',
        'Aggiungere una caratteristica',
        'Scuola universitaria o formazione professionale superiore',
        'Aggiungere',
      ],
    ];
    for (const [language, list, name, add] of longest) {
      await page.goto(`${language}/votes/5960/`);
      await page.locator('.municipalities path').nth(2000).waitFor();
      const select = page.getByLabel(list);
      await expect(select).toBeVisible();
      expect(await pageWidth(page), `${language}: the list`).toBeLessThanOrEqual(360);
      await select.selectOption({ label: name });
      await page.getByRole('button', { name: add, exact: true }).click();
      await expect(page.locator('.limit .label')).toContainText(name);
      expect(await pageWidth(page), `${language}: the limit`).toBeLessThanOrEqual(360);
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

// The bar with the selection's result (spec small-screens, "The selection's result at the bottom
// of a narrow window"; design of add-small-screens, decisions 1 and 2). The figures are those of
// investigations/limits.md, 5.
const bar = (page: Page) => page.locator('.selection-bar');

/**
 * On a vote's page, the limit of the share of foreigners with its upper bound at step 327, and
 * the slider in the middle of the window.
 */
async function foreignersUpTo1998(
  page: Page,
  path = 'de/votes/5960/',
  labels = { list: 'Merkmal hinzufügen', add: 'Hinzufügen', name: 'Ausländeranteil' },
) {
  await page.goto(path);
  await page.getByLabel(labels.list).selectOption(labels.name);
  await page.getByRole('button', { name: labels.add, exact: true }).click();
  const upper = page.getByRole('slider').last();
  await upper.fill('327');
  await upper.evaluate((slider) => {
    slider.scrollIntoView({ block: 'center' });
  });
}

test.describe('the bar on a phone', () => {
  test.use(phone);

  test('while a limit is dragged, the bar at the bottom shows the selection', async ({ page }) => {
    await foreignersUpTo1998(page);
    await expect(bar(page).locator('p')).toHaveText([
      'Mit Ihrer Auswahl: Angenommen',
      'Volksmehr: Ja · Ständemehr: Ja',
    ]);
    // At the bottom of the window.
    const box = await bar(page).boundingBox();
    const height = await page.evaluate(() => innerHeight);
    expect(Math.abs((box?.y ?? NaN) + (box?.height ?? NaN) - height)).toBeLessThanOrEqual(1);
  });

  test('with the box "Mit Ihrer Auswahl" wholly in the window there is no bar', async ({
    page,
  }) => {
    await foreignersUpTo1998(page);
    await expect(bar(page)).toBeVisible();
    await page.locator('.selection').evaluate((box) => {
      box.scrollIntoView({ block: 'center' });
    });
    await expect(bar(page)).toBeHidden();
  });

  test('a selection that begins with its box in the window shows no bar, not for a frame', async ({
    page,
  }) => {
    await page.goto('de/votes/5950/');
    const abroad = page.getByRole('checkbox');
    await expect(abroad).toBeChecked();
    // The box will stand below the vote's result: the window from just above the result holds
    // it whole. Every bar that comes into the page is counted.
    await page.evaluate(() => {
      scrollTo(
        0,
        (document.querySelector('.result')?.getBoundingClientRect().top ?? 0) + scrollY - 8,
      );
      const seen = { bars: 0 };
      (window as unknown as { __seen: typeof seen }).__seen = seen;
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof Element && node.matches('.selection-bar')) seen.bars += 1;
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    });
    // The switch, without scrolling to it.
    await abroad.evaluate((box) => {
      (box as HTMLInputElement).click();
    });
    const selection = page.locator('.selection');
    await expect(selection).toBeVisible();
    await page.waitForTimeout(300);
    const [top, bottom, height] = await selection.evaluate((box) => [
      box.getBoundingClientRect().top,
      box.getBoundingClientRect().bottom,
      innerHeight,
    ]);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(bottom).toBeLessThanOrEqual(height);
    expect(
      await page.evaluate(() => (window as unknown as { __seen: { bars: number } }).__seen.bars),
    ).toBe(0);
  });

  test('no bar without a selection, nor in a window 1,280 pixels wide', async ({
    page,
    browser,
  }) => {
    await foreignersUpTo1998(page);
    await expect(bar(page)).toBeVisible();
    await page.getByRole('button', { name: 'Zurück zum echten Ergebnis' }).click();
    await expect(bar(page)).toBeHidden();
    const wide = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await foreignersUpTo1998(wide);
    await expect(wide.getByRole('heading', { name: 'Mit Ihrer Auswahl' })).toHaveCount(1);
    await expect(bar(wide)).toBeHidden();
    await wide.close();
  });

  test('a majority that is not needed: the bar says so', async ({ page }) => {
    await page.goto('de/votes/5950/');
    const abroad = page.getByRole('checkbox');
    await abroad.uncheck();
    await abroad.evaluate((box) => {
      box.scrollIntoView({ block: 'center' });
    });
    await expect(bar(page).locator('p')).toHaveText([
      'Mit Ihrer Auswahl: Abgelehnt',
      'Volksmehr: Nein · Ständemehr: nicht nötig',
    ]);
  });

  test('in French', async ({ page }) => {
    await foreignersUpTo1998(page, 'fr/votes/5960/', {
      list: 'Ajouter une caractéristique',
      add: 'Ajouter',
      name: 'Part des étrangers',
    });
    await expect(bar(page).locator('p')).toHaveText([
      'Avec votre sélection: Accepté',
      'Majorité du peuple: Oui · Majorité des cantons: Oui',
    ]);
  });

  test('at the end of the page the bar hides none of it', async ({ page }) => {
    await foreignersUpTo1998(page);
    // The bar is shown before the page scrolls to its end: a bar that comes later makes the page
    // longer, and the end is then one more scroll away.
    await expect(bar(page)).toBeVisible();
    await page.evaluate(() => {
      scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect(bar(page)).toBeVisible();
    // The page's last line, the element before the bar, lies above it.
    const [lastBottom, barTop] = await bar(page).evaluate((element) => [
      element.previousElementSibling?.getBoundingClientRect().bottom ?? NaN,
      element.getBoundingClientRect().top,
    ]);
    expect(lastBottom).toBeLessThanOrEqual(barTop);
  });
});

// A browser without a dictionary for hyphenating Italian (this one has it, and breaks
// "Maggio-ranza"): the verdict boxes must fit by breaking the word where they need to, also from
// 640 pixels, where the selection's result stands beside the vote's.
test('without hyphenation the Italian verdicts with a selection fit at 360, 640 and 800 pixels', async ({
  page,
}) => {
  for (const width of [360, 640, 800]) {
    await page.setViewportSize({ width, height: 780 });
    await page.goto('it/votes/5960/');
    await page.addStyleTag({ content: '* { hyphens: manual !important; }' });
    await page.getByLabel('Aggiungere una caratteristica').selectOption('Quota di stranieri');
    await page.getByRole('button', { name: 'Aggiungere', exact: true }).click();
    await page.getByRole('slider', { name: 'Limite superiore: Quota di stranieri' }).fill('327');
    await expect(page.getByRole('heading', { name: 'Con la Sua selezione' })).toBeVisible();
    expect(await pageWidth(page), `${String(width)} pixels`).toBeLessThanOrEqual(width);
  }
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
