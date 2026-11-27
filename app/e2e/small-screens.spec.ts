// The site in a narrow window and on a touch screen (spec small-screens), against the built site.
// The widths and sizes are those of investigations/small-screens.md.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { phone } from './fingers.ts';
import { pointIn } from './pointing.ts';
import {
  addButton,
  addLimit,
  barDrawn,
  cantonsBarOf,
  explanationsLink,
  keptButton,
  limitList,
  listEntries,
  majoritiesOf,
  outcomeOf,
  ownResult,
  searchField,
  selectionResult,
  votersBarOf,
  type Language,
} from './parts.ts';

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

  test('the start page, the guide, the comparison, the tie-break question and a French vote fit the window', async ({
    page,
  }) => {
    // Spec small-screens, "The other pages": the comparison with two votes and a selection.
    const comparison = 'compare/#votes=5960,5970&foreigners=-19.98';
    const paths = ['de', 'fr', 'it'].flatMap((lang) => [
      `${lang}/`,
      `${lang}/guide/`,
      `${lang}/${comparison}`,
      `${lang}/votes/6823/`,
    ]);
    for (const path of [...paths, 'fr/votes/5960/']) {
      await page.goto(path);
      if (path === 'fr/votes/5960/') await page.locator('.municipalities path').nth(2000).waitFor();
      if (path.endsWith(comparison)) await expect(page.locator('.result.selection')).toHaveCount(2);
      expect(await pageWidth(page), path).toBeLessThanOrEqual(360);
    }
  });
});

test.describe('the list of the limits in a window 360 pixels wide', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('the list and the limit of the longest name fit the window, in three languages', async ({
    page,
  }) => {
    // The list holds the longest name of each language (design of add-more-characteristics,
    // decisions 2 and 13), and is no wider than the window.
    const longest = [
      ['de', 'Bio-Anteil der landwirtschaftlichen Nutzfläche'],
      ['fr', 'Haute école ou formation professionnelle supérieure'],
      ['it', 'Scuola universitaria o formazione professionale superiore'],
    ] as const;
    for (const [language, name] of longest) {
      await page.goto(`${language}/votes/5960/`);
      await page.locator('.municipalities path').nth(2000).waitFor();
      await addButton(page, language).click();
      const list = await limitList(page, language).boundingBox();
      expect(list?.x, `${language}: the list`).toBeGreaterThanOrEqual(0);
      expect((list?.x ?? 0) + (list?.width ?? 361), `${language}: the list`).toBeLessThanOrEqual(
        360,
      );
      expect(await pageWidth(page), `${language}: the list`).toBeLessThanOrEqual(360);
      await page.keyboard.press('Escape');
      await addLimit(page, name, language);
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

  // A thumb is drawn by the browser, which tells no script its size (for the thumb it reports
  // the slider's own). Its 44 pixels are tested by what they are for: the slider is 44 pixels
  // tall, and a press 20 pixels beside a thumb's centre moves it ("a thumb takes a press").
  test('the controls are at least 44 × 44 pixels', async ({ page }) => {
    await page.goto('de/votes/5960/');
    await page.locator('.municipalities path').nth(2000).waitFor();
    await addLimit(page, 'Ausländeranteil', 'de', 'tap');
    await page.getByRole('slider', { name: 'Obere Grenze: Ausländeranteil' }).fill('327');
    const controls = {
      '+': page.getByRole('button', { name: 'Vergrössern' }),
      '−': page.getByRole('button', { name: 'Verkleinern' }),
      'Ganze Schweiz': page.getByRole('button', { name: 'Ganze Schweiz' }),
      'Merkmal hinzufügen': addButton(page),
      Entfernen: page.getByRole('button', { name: 'Entfernen: Ausländeranteil' }),
      'Zurück zum echten Ergebnis': page.getByRole('button', {
        name: 'Zurück zum echten Ergebnis',
      }),
      // The switch by its label, which a tap on its text toggles too.
      switch: page.locator('label').filter({ has: page.getByRole('checkbox') }),
      // The link below the summary (spec vote-summaries).
      'Erläuterungen des Bundesrates (PDF)': explanationsLink(page),
    };
    const sizes = await Promise.all(
      Object.entries(controls).map(async ([name, control]) => {
        const box = await control.boundingBox();
        return [name, box === null ? null : [box.width >= 44, box.height >= 44]] as const;
      }),
    );
    expect(sizes).toEqual(Object.keys(controls).map((name) => [name, [true, true]]));
  });

  test("the start page's controls are at least 44 × 44 pixels", async ({ page }) => {
    // Spec small-screens, "The start page's controls on a phone".
    await page.goto('de/');
    const controls = {
      'Titel suchen': searchField(page),
      Alle: keptButton(page, 'Alle'),
      Angenommen: keptButton(page, 'Angenommen'),
      Abgelehnt: keptButton(page, 'Abgelehnt'),
    };
    const sizes = await Promise.all(
      Object.entries(controls).map(async ([name, control]) => {
        const box = await control.boundingBox();
        return [name, box === null ? null : [box.width >= 44, box.height >= 44]] as const;
      }),
    );
    expect(sizes).toEqual(Object.keys(controls).map((name) => [name, [true, true]]));
    // A tap on a button presses it.
    await keptButton(page, 'Angenommen').tap();
    await expect(keptButton(page, 'Angenommen')).toHaveAttribute('aria-pressed', 'true');
  });

  test('the list of characteristics: each entry and "Schliessen" at least 44 × 44 pixels', async ({
    page,
  }) => {
    // Spec small-screens, "The list of characteristics on a phone".
    await page.goto('de/votes/5960/');
    await addButton(page).tap();
    await expect(limitList(page)).toBeVisible();
    await expect(listEntries(page)).toHaveCount(35);
    const small = await limitList(page)
      .locator('button')
      .evaluateAll((buttons) =>
        buttons
          .map((button) => [button.textContent.trim(), button.getBoundingClientRect()] as const)
          .filter(([, box]) => box.width < 44 || box.height < 44)
          .map(([name, box]) => `${name}: ${String(box.width)} × ${String(box.height)}`),
      );
    expect(small).toEqual([]);
    const list = await limitList(page).boundingBox();
    const width = page.viewportSize()?.width ?? 0;
    expect(list?.x).toBeGreaterThanOrEqual(0);
    expect((list?.x ?? 0) + (list?.width ?? width + 1)).toBeLessThanOrEqual(width);
  });

  test('a thumb takes a press 20 pixels beside its centre', async ({ page }) => {
    await page.goto('de/votes/5960/');
    await addLimit(page, 'Ausländeranteil', 'de', 'tap');
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
  language: Language = 'de',
  name = 'Ausländeranteil',
) {
  await page.goto(path);
  await addLimit(page, name, language);
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
    await selectionResult(page).evaluate((box) => {
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
    const selection = selectionResult(page);
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
    await foreignersUpTo1998(page, 'fr/votes/5960/', 'fr', 'Part des étrangers');
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

/**
 * How a result's parts stand: in one row, the outcome above the two majorities side by side, or
 * all three one below the other.
 */
async function arrangementOf(result: Locator): Promise<string> {
  const [outcome, voters, cantons] = await Promise.all(
    [outcomeOf(result), majoritiesOf(result).nth(0), majoritiesOf(result).nth(1)].map((part) =>
      part.boundingBox(),
    ),
  );
  if (outcome === null || voters === null || cantons === null) {
    throw new Error('a part of the result is not shown');
  }
  const outcomeAbove = outcome.y + outcome.height <= voters.y;
  const sideBySide = Math.abs(voters.y - cantons.y) <= 1 && voters.x + voters.width <= cantons.x;
  const below = voters.y + voters.height <= cantons.y && Math.abs(voters.x - cantons.x) <= 1;
  if (!outcomeAbove && sideBySide && outcome.x + outcome.width <= voters.x) return 'one row';
  if (outcomeAbove && sideBySide) return 'the outcome above';
  if (outcomeAbove && below) return 'one below the other';
  return 'none of the three';
}

test('a result follows the room it has: 640 pixels for one row, 448 for the majorities side by side', async ({
  page,
}) => {
  // Design of redesign-site, decision 10. A page leaves 32 pixels at each side of a window, 16
  // of one narrower than 640, so a result has 640 pixels in a window of 704 and 448 in one of 480.
  for (const [width, arrangement] of [
    [800, 'one row'],
    [704, 'one row'],
    [703, 'the outcome above'],
    [480, 'the outcome above'],
    [479, 'one below the other'],
    [360, 'one below the other'],
  ] as const) {
    await page.setViewportSize({ width, height: 780 });
    await page.goto('de/votes/5960/');
    expect(await arrangementOf(ownResult(page)), `${String(width)} pixels`).toBe(arrangement);
    expect(await pageWidth(page), `${String(width)} pixels`).toBeLessThanOrEqual(width);
  }
});

// A browser without a dictionary for hyphenating Italian (this one has it, and breaks
// "Maggio-ranza"): the heads of the majorities must fit by breaking the word where they need to,
// in each of the three arrangements of a result.
test('without hyphenation the Italian verdicts with a selection fit at 360, 640 and 800 pixels', async ({
  page,
}) => {
  for (const width of [360, 640, 800]) {
    await page.setViewportSize({ width, height: 780 });
    await page.goto('it/votes/5960/');
    await page.addStyleTag({ content: '* { hyphens: manual !important; }' });
    await addLimit(page, 'Quota di stranieri', 'it');
    await page.getByRole('slider', { name: 'Limite superiore: Quota di stranieri' }).fill('327');
    await expect(page.getByRole('heading', { name: 'Con la Sua selezione' })).toBeVisible();
    expect(await pageWidth(page), `${String(width)} pixels`).toBeLessThanOrEqual(width);
  }
});

test.describe('on a touch screen 360 pixels wide', () => {
  test.use({ ...phone, viewport: { width: 360, height: 780 } });

  test('the verdicts in Italian stand one below the other, each bar as wide as the result', async ({
    page,
  }) => {
    // Spec small-screens, "The verdicts in Italian".
    await page.goto('it/votes/5960/');
    await addLimit(page, 'Quota di stranieri', 'it', 'tap');
    await page.getByRole('slider', { name: 'Limite superiore: Quota di stranieri' }).fill('327');
    await expect(page.getByRole('heading', { name: 'Con la Sua selezione' })).toBeVisible();
    // A page wider than the window is shown smaller, and a tap would miss: the width comes first.
    expect(await pageWidth(page)).toBeLessThanOrEqual(360);
    // A point four pixels inside Zürich, which is a dozen pixels wide here: Chrome moves a tap
    // at a point up to two pixels inside to a neighbour (investigations/small-screens.md, 8).
    const zurich = await pointIn(page, '.municipalities [data-number="261"]', 4);
    await page.touchscreen.tap(zurich.x, zurich.y);
    await expect(page.getByText("Abitanti: 396'955")).toBeVisible();
    expect(await pageWidth(page)).toBeLessThanOrEqual(360);
    // "Maggioranza del popolo" above "Maggioranza dei Cantoni", for the vote and the selection,
    // each of their bars as wide as the window less 16 pixels at each side.
    for (const result of [ownResult(page), selectionResult(page)]) {
      await expect(majoritiesOf(result).locator('h3')).toHaveText([
        'Maggioranza del popolo',
        'Maggioranza dei Cantoni',
      ]);
      expect(await arrangementOf(result)).toBe('one below the other');
      for (const bar of [votersBarOf(result), cantonsBarOf(result)]) {
        expect(Math.abs((await barDrawn(bar)).width - 328)).toBeLessThanOrEqual(1);
      }
    }
  });
});

// The bound of spec small-screens, "The selection's result while a limit is set on a phone": a
// phone held upright, in a window 700 pixels high, where at most 666 are needed
// (investigations/redesign.md, "Found after the merge").
const PHONE_LIMIT = {
  de: ['Einwohner', 'Untere Grenze: Einwohner'],
  fr: ['Habitants', 'Limite inférieure: Habitants'],
  it: ['Abitanti', 'Limite inferiore: Abitanti'],
} as const;

test.describe('on a phone 360 by 700 pixels', () => {
  test.use({ ...phone, viewport: { width: 360, height: 700 } });

  for (const [language, [name, lower]] of Object.entries(PHONE_LIMIT)) {
    test(`the selection's result and the first limit's sliders lie in one window, ${language}`, async ({
      page,
    }) => {
      // Spec small-screens, "The result and the first limit in one window": the limits stand
      // between the result and the map (design of redesign-site, decision 9).
      await page.goto(`${language}/votes/5960/`);
      await addLimit(page, name, language as Language, 'tap');
      await page.getByRole('slider', { name: lower, exact: true }).fill('50');
      const result = selectionResult(page);
      await expect(result).toBeVisible();
      await result.evaluate((row) => {
        scrollTo(0, row.getBoundingClientRect().top + scrollY);
      });
      expect(Math.abs((await result.boundingBox())?.y ?? NaN)).toBeLessThanOrEqual(1);
      for (const slider of await page.locator('.limit').first().getByRole('slider').all()) {
        await expect(slider).toBeInViewport({ ratio: 1 });
      }
    });
  }
});
