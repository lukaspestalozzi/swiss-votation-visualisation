// The look of every page (spec site-style), against the built site. The font's figures, the
// contrasts and the widths are those of investigations/site-style.md.
import { expect, test, type Page } from '@playwright/test';
import { controlContrast, lowContrast, pixelAt, ratioOf, type LowContrast } from './contrast.ts';
import { phone } from './fingers.ts';
import {
  addLimit,
  barDrawn,
  greyedOf,
  pageHead,
  outcomeOf,
  ownResult,
  selectionResult,
  verdictOf,
  verdictWordsOf,
  voteRow,
  votersBarOf,
} from './parts.ts';

/**
 * The fonts Chrome renders the text of the first element matching `selector` in, by the DevTools
 * protocol: the text directly inside it, not that of its children.
 */
async function renderedFonts(page: Page, selector: string): Promise<string[]> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  expect(nodeId, selector).not.toBe(0);
  const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
  await cdp.detach();
  return fonts.map((font) => font.familyName);
}

/** The share of foreigners in each language, as the list of characteristics names it. */
const FOREIGNERS = { de: 'Ausländeranteil', fr: 'Part des étrangers', it: 'Quota di stranieri' };

/**
 * On `/de/votes/5960/` (or another vote's page, in any language), the limit of the share of
 * foreigners with its upper bound at step 327, 19.98% (investigations/limits.md, 5), and the
 * slider in the middle of the window.
 */
async function foreignersUpTo1998(page: Page, path = 'de/votes/5960/'): Promise<void> {
  await page.goto(path);
  const language = path.slice(0, 2) as keyof typeof FOREIGNERS;
  await addLimit(page, FOREIGNERS[language], language);
  const upper = page.getByRole('slider').last();
  await upper.fill('327');
  await upper.evaluate((slider) => {
    slider.scrollIntoView({ block: 'center' });
  });
}

test.describe('the font', () => {
  test('the pages are set in Source Sans 3, one file from the site itself', async ({ page }) => {
    const pages: [string, string[]][] = [
      ['de/', ['h1', 'li span']],
      ['fr/guide/', ['h1', 'p']],
      ['it/votes/5960/', ['h1', 'p', 'td', 'button']],
    ];
    for (const [path, selectors] of pages) {
      const fonts: string[] = [];
      page.on('request', (request) => {
        if (request.resourceType() === 'font') fonts.push(request.url());
      });
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      // Chrome names the variable file by its default instance, "Source Sans 3 ExtraLight",
      // whatever weight it draws.
      for (const selector of selectors) {
        expect(await renderedFonts(page, selector), `${path} ${selector}`).toEqual([
          expect.stringMatching(/^Source Sans 3\b/),
        ]);
      }
      expect(fonts, path).toHaveLength(1);
      expect(new URL(fonts[0] ?? '').origin, path).toBe(new URL(page.url()).origin);
      page.removeAllListeners('request');
    }
  });

  test('without the font file, the system sans-serif, and the page works', async ({ page }) => {
    await page.route('**/*.woff2', (route) => route.abort());
    await foreignersUpTo1998(page);
    await page.evaluate(() => document.fonts.ready);
    const fonts = await renderedFonts(page, 'h1');
    expect(fonts).toHaveLength(1);
    expect(fonts[0]).not.toMatch(/Source Sans 3|Serif/);
    await expect(outcomeOf(selectionResult(page))).toHaveText('Angenommen');
    await expect(page.locator('.municipalities path:not([fill="url(#hatch)"])')).toHaveCount(2103);
  });
});

/**
 * The start page, the guide, and the page of the vote of 2016-02-28 with the share of foreigners
 * up to step 327, in each language: each page and the texts below their threshold.
 */
async function contrastOfThePages(page: Page): Promise<[string, LowContrast[]][]> {
  const found: [string, LowContrast[]][] = [];
  for (const language of ['de', 'fr', 'it']) {
    for (const path of [`${language}/`, `${language}/guide/`]) {
      await page.goto(path);
      found.push([path, await lowContrast(page)]);
    }
    const path = `${language}/votes/5960/`;
    await foreignersUpTo1998(page, path);
    await expect(outcomeOf(selectionResult(page))).toBeVisible();
    await page.locator('.municipalities path').nth(2000).waitFor();
    found.push([path, await lowContrast(page)]);
  }
  return found;
}

test.describe('the light scheme', () => {
  test('every text has its contrast; text #1c1c1c on #ffffff, links underlined in it', async ({
    page,
  }) => {
    for (const [path, low] of await contrastOfThePages(page)) expect(low, path).toEqual([]);
    await page.goto('de/guide/');
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator('section p').first()).toHaveCSS('color', 'rgb(28, 28, 28)');
    const back = page.getByRole('link', { name: 'Alle Abstimmungen' });
    await expect(back).toHaveCSS('color', 'rgb(28, 28, 28)');
    await expect(back).toHaveCSS('text-decoration-line', 'underline');
    // A vote's date and kind #595959; the cantonal votes of a majority not needed #767676.
    await page.goto('de/votes/5950/');
    await expect(page.locator('p.secondary').first()).toHaveCSS('color', 'rgb(89, 89, 89)');
    await expect(greyedOf(ownResult(page)).first()).toHaveCSS('color', 'rgb(118, 118, 118)');
  });

  test('a majority that is not needed: its word #1c1c1c, its cantonal votes #767676', async ({
    page,
  }) => {
    await page.goto('de/votes/5950/');
    const standesmehr = verdictWordsOf(ownResult(page)).nth(1);
    await expect(standesmehr).toHaveText('nicht nötig');
    await expect(standesmehr).toHaveCSS('color', 'rgb(28, 28, 28)');
    await expect(greyedOf(ownResult(page))).toHaveCSS('color', 'rgb(118, 118, 118)');
  });
});

test.describe('the dark scheme', () => {
  test.use({ colorScheme: 'dark' });

  test('every text has its contrast; text #e8e8e8 on #121212, links underlined in it', async ({
    page,
  }) => {
    for (const [path, low] of await contrastOfThePages(page)) expect(low, path).toEqual([]);
    await page.goto('de/guide/');
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(18, 18, 18)');
    await expect(page.locator('section p').first()).toHaveCSS('color', 'rgb(232, 232, 232)');
    const back = page.getByRole('link', { name: 'Alle Abstimmungen' });
    await expect(back).toHaveCSS('color', 'rgb(232, 232, 232)');
    await expect(back).toHaveCSS('text-decoration-line', 'underline');
    // A vote's date and kind #b0b0b0; the cantonal votes of a majority not needed #9a9a9a.
    await page.goto('de/votes/5950/');
    await expect(page.locator('p.secondary').first()).toHaveCSS('color', 'rgb(176, 176, 176)');
    await expect(greyedOf(ownResult(page)).first()).toHaveCSS('color', 'rgb(154, 154, 154)');
  });
});

test('the preference changes on an open page: dark at once, the selection kept', async ({
  page,
}) => {
  await foreignersUpTo1998(page);
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  // A mark on the page, which a page loaded anew would not have.
  await page.evaluate(() => {
    (window as unknown as { mark: string }).mark = 'kept';
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(18, 18, 18)');
  expect(await page.evaluate(() => (window as unknown as { mark?: string }).mark)).toBe('kept');
  await expect(page.getByRole('slider').last()).toHaveValue('327');
  await expect(outcomeOf(selectionResult(page))).toHaveText('Angenommen');
});

// The map's darkest classes, and in the dark scheme its class 2 (spec site-style, "The verdicts in
// the map's colours").
const YES = 'rgb(0, 114, 96)'; // #007260
const NO = 'rgb(147, 67, 25)'; // #934319
const YES_DARK = 'rgb(75, 193, 173)'; // #4bc1ad
const NO_DARK = 'rgb(229, 148, 111)'; // #e5946f

/** The vote's own result on its page, beside which a selection's stands. */

test.describe('the colours of a bar', () => {
  // Spec site-style, "The colours of a bar": the yes and the no part, their contrast against
  // the ground, the text's colour and the ground (investigations/redesign.md, 5).
  for (const [colorScheme, yes, no, contrasts, text, ground] of [
    ['light', [0, 156, 134], [194, 103, 59], [3.44, 3.96], [28, 28, 28], [255, 255, 255]],
    ['dark', [75, 193, 173], [229, 148, 111], [8.5, 7.85], [232, 232, 232], [18, 18, 18]],
  ] as const) {
    test(`the Volksmehr's bar in the ${colorScheme} scheme: yes, a gap, no, and a mark at half`, async ({
      page,
    }) => {
      // The vote of 2016-02-28: 49.16% yes.
      await page.emulateMedia({ colorScheme });
      await page.goto('de/votes/5960/');
      const drawn = await barDrawn(votersBarOf(ownResult(page)));
      const y = drawn.top + drawn.height / 2;
      const at = (x: number) => pixelAt(page, drawn.left + x, y);
      // What the screen draws a quarter and three quarters along the bar.
      expect(await at(drawn.width / 4)).toEqual(yes);
      expect(await at((drawn.width * 3) / 4)).toEqual(no);
      expect(ratioOf(yes, ground)).toBeCloseTo(contrasts[0], 2);
      expect(ratioOf(no, ground)).toBeCloseTo(contrasts[1], 2);
      // The gap of two pixels where the yes part ends, and the mark of two pixels at half.
      expect(await at((drawn.parts[0]?.width ?? 0) - 1)).toEqual(ground);
      expect(Math.abs((drawn.mark ?? 0) - drawn.width / 2)).toBeLessThanOrEqual(1);
      expect(await at((drawn.mark ?? 0) - 1)).toEqual(text);
    });
  }
});

test("a bar that judges nothing takes no side's colour: the tie-break question's", async ({
  page,
}) => {
  // Spec site-style, "A bar that judges nothing": the text's colour and #8c8c8c.
  await page.goto('de/votes/6823/');
  const drawn = await barDrawn(page.locator('.bar'));
  const y = drawn.top + drawn.height / 2;
  expect(await pixelAt(page, drawn.left + drawn.width / 8, y)).toEqual([28, 28, 28]);
  expect(await pixelAt(page, drawn.left + (drawn.width * 7) / 8, y)).toEqual([140, 140, 140]);
});

test.describe('the colours of rows', () => {
  // The ground of a row pointed at in each scheme (investigations/redesign.md, 5).
  const grounds = { light: [244, 244, 244], dark: [28, 28, 28] };

  for (const [colorScheme, ground] of Object.entries(grounds)) {
    test(`a row of the start page pointed at, ${colorScheme}: its ground, its title underlined`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: colorScheme as 'light' | 'dark' });
      await page.goto('de/');
      const row = voteRow(page, 5960);
      const title = row.getByRole('link');
      await expect(title).toHaveCSS('text-decoration-line', 'none');
      await row.hover();
      await expect(row).toHaveCSS('background-color', `rgb(${ground.join(', ')})`);
      await expect(title).toHaveCSS('text-decoration-line', 'underline');
      // Every text of the page keeps its contrast, the row's on its ground.
      expect(await lowContrast(page)).toEqual([]);
      if (colorScheme === 'light') {
        // "abgelehnt" in #934319 on #f4f4f4.
        await expect(verdictOf(row)).toHaveCSS('color', NO);
        expect(ratioOf([147, 67, 25], ground)).toBeCloseTo(6.24, 2);
      }
    });
  }
});

test.describe("the verdicts in the map's colours", () => {
  test('2016-02-28: "Nein" and "Abgelehnt" #934319, "Ja" #007260, also in the list', async ({
    page,
  }) => {
    // 49.16% yes, 16½ : 6½ cantonal votes (investigations/data-sources.md).
    await page.goto('de/votes/5960/');
    const words = ownResult(page).locator('.word');
    await expect(words).toHaveText(['Nein', 'Ja']);
    await expect(words.first()).toHaveCSS('color', NO);
    await expect(words.last()).toHaveCSS('color', YES);
    await expect(outcomeOf(ownResult(page))).toHaveText('Abgelehnt');
    await expect(outcomeOf(ownResult(page))).toHaveCSS('color', NO);
    const zurich = page.getByRole('row', { name: /^ZH / }).locator('td').last();
    await expect(zurich).toHaveText('Nein');
    await expect(zurich).toHaveCSS('color', NO);
    await page.goto('de/');
    await expect(verdictOf(voteRow(page, 5960))).toHaveText('abgelehnt');
    await expect(verdictOf(voteRow(page, 5960))).toHaveCSS('color', NO);
  });

  test("a tie-break question's figures keep the text's colour", async ({ page }) => {
    await page.goto('de/votes/6823/');
    const figures = page.locator('section', { hasText: 'Für die Initiative' }).locator('p');
    await expect(figures).toHaveCount(4);
    for (const figure of await figures.all()) {
      await expect(figure).toHaveCSS('color', 'rgb(28, 28, 28)');
    }
  });

  test.describe('on a phone', () => {
    test.use(phone);

    test('a selection: "Angenommen" and both "Ja" #007260, in the box and the bar', async ({
      page,
    }) => {
      await foreignersUpTo1998(page);
      await expect(outcomeOf(selectionResult(page))).toHaveText('Angenommen');
      await expect(outcomeOf(selectionResult(page))).toHaveCSS('color', YES);
      const words = page.locator('.selection-bar span');
      await expect(words).toHaveText(['Angenommen', 'Ja', 'Ja']);
      for (const word of await words.all()) await expect(word).toHaveCSS('color', YES);
    });

    test("the bar's top border in the colour of borders, #767676", async ({ page }) => {
      // Design of add-site-style, decision 10.
      await foreignersUpTo1998(page);
      await expect(page.locator('.selection-bar')).toHaveCSS(
        'border-top-color',
        'rgb(118, 118, 118)',
      );
    });
  });

  test.describe('in the dark scheme', () => {
    test.use({ colorScheme: 'dark' });

    test('in French: "Non" and "Rejeté" #e5946f, "Oui" #4bc1ad', async ({ page }) => {
      await page.goto('fr/votes/5960/');
      const words = ownResult(page).locator('.word');
      await expect(words).toHaveText(['Non', 'Oui']);
      await expect(words.first()).toHaveCSS('color', NO_DARK);
      await expect(words.last()).toHaveCSS('color', YES_DARK);
      await expect(outcomeOf(ownResult(page))).toHaveText('Rejeté');
      await expect(outcomeOf(ownResult(page))).toHaveCSS('color', NO_DARK);
    });
  });
});

test.describe('the head of every page', () => {
  test("on a vote's page: the title, the comparison, the guide and the languages, before the heading", async ({
    page,
  }) => {
    await page.goto('fr/votes/5960/');
    const head = pageHead(page);
    await expect(head).toHaveText(
      /^\s*Popular Vote Explorer\s*Comparer\s*Guide de lecture\s*Deutsch\s*Français\s*Italiano\s*$/,
    );
    await expect(head.getByRole('link', { name: 'Popular Vote Explorer' })).toHaveAttribute(
      'href',
      /\/fr\/?$/,
    );
    await expect(head.getByRole('link', { name: 'Comparer' })).toHaveAttribute(
      'href',
      /\/fr\/compare\/?$/,
    );
    await expect(head.getByRole('link', { name: 'Guide de lecture' })).toHaveAttribute(
      'href',
      /\/fr\/guide\/?$/,
    );
    const headFirst = await page.evaluate(() => {
      const [head, heading] = [document.querySelector('header'), document.querySelector('h1')];
      return head !== null && heading !== null
        ? Boolean(head.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING)
        : false;
    });
    expect(headFirst).toBe(true);
  });

  test('the entry of the page shown is no link: the title, the comparison, the guide', async ({
    page,
  }) => {
    const head = pageHead(page);
    await page.goto('de/compare/');
    await expect(head.getByRole('link', { name: 'Vergleichen' })).toHaveCount(0);
    await expect(head.getByText('Vergleichen', { exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(head.getByRole('link', { name: 'Popular Vote Explorer' })).toHaveAttribute(
      'href',
      /\/de\/?$/,
    );
    await page.goto('de/');
    await expect(head.getByRole('link', { name: 'Popular Vote Explorer' })).toHaveCount(0);
    await expect(head.getByText('Popular Vote Explorer')).toHaveAttribute('aria-current', 'page');
    await expect(head.getByRole('link', { name: 'Vergleichen' })).toHaveAttribute(
      'href',
      /\/de\/compare\/?$/,
    );
    await expect(head.getByRole('link', { name: 'Lesehilfe' })).toHaveAttribute(
      'href',
      /\/de\/guide\/?$/,
    );
    await page.goto('de/guide/');
    await expect(head.getByRole('link', { name: 'Popular Vote Explorer' })).toHaveAttribute(
      'href',
      /\/de\/?$/,
    );
    await expect(head.getByRole('link', { name: 'Lesehilfe' })).toHaveCount(0);
    await expect(head.getByText('Lesehilfe', { exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test.describe('in a window 360 pixels wide', () => {
    test.use({ viewport: { width: 360, height: 780 } });

    test('the head fits the window in two lines, and none of its parts breaks', async ({
      page,
    }) => {
      await page.goto('it/votes/5960/');
      const lines = await page.evaluate(() => {
        const head = document.querySelector('header');
        if (head === null) return null;
        // The lines a part's text takes, one if it does not break, and the middle of its box.
        const part = (element: Element) => {
          const range = document.createRange();
          // The title's text follows its mark, which is no text.
          range.selectNodeContents(element.lastChild ?? element);
          const tops = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
          const box = element.getBoundingClientRect();
          return { lines: tops.size, middle: Math.round(box.top + box.height / 2) };
        };
        const title = head.querySelector('.title');
        if (title === null) return null;
        return {
          right: head.getBoundingClientRect().right,
          title: [title.textContent.trim(), part(title)] as const,
          entries: [...head.querySelectorAll('.entries > *')].map(
            (entry) => [entry.textContent.trim(), part(entry)] as const,
          ),
          // A language writes its code before its name, which is left a box of one pixel.
          languages: [...head.querySelectorAll('.languages > *')].map((language) => {
            const name = language.querySelector('.name');
            return [
              getComputedStyle(language, '::before').content,
              name === null ? null : name.getBoundingClientRect().width,
              part(language).middle,
            ] as const;
          }),
        };
      });
      if (lines === null) throw new Error('the page has no head');
      expect(lines.right).toBeLessThanOrEqual(360);
      const [title, titlePart] = lines.title;
      expect([title, titlePart.lines]).toEqual(['Popular Vote Explorer', 1]);
      // The first line: the title with the three codes.
      expect(lines.languages.map(([code, name]) => [code, name])).toEqual([
        ['"DE"', 1],
        ['"FR"', 1],
        ['"IT"', 1],
      ]);
      for (const [, , middle] of lines.languages) {
        expect(Math.abs(middle - titlePart.middle)).toBeLessThanOrEqual(4);
      }
      // The second line: the comparison and the guide.
      expect(lines.entries.map(([text, entry]) => [text, entry.lines])).toEqual([
        ['Confrontare', 1],
        ['Guida alla lettura', 1],
      ]);
      const [first, second] = lines.entries.map(([, entry]) => entry.middle);
      expect(first).toBe(second);
      expect(first).toBeGreaterThan(titlePart.middle + 12);
    });
  });

  test('the mark is no image: a tie-break question has none', async ({ page }) => {
    await page.goto('de/votes/6823/');
    const mark = await pageHead(page).locator('.mark').boundingBox();
    expect(mark?.width).toBeGreaterThan(10);
    expect(mark?.height).toBeGreaterThan(5);
    await expect(page.locator('img, svg')).toHaveCount(0);
  });

  for (const [colorScheme, link, shown] of [
    ['light', 'rgb(89, 89, 89)', 'rgb(28, 28, 28)'],
    ['dark', 'rgb(176, 176, 176)', 'rgb(232, 232, 232)'],
  ] as const) {
    test(`the entries in the ${colorScheme} scheme: links without a line, the page shown in the text's colour`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('de/guide/');
      const head = pageHead(page);
      const compare = head.getByRole('link', { name: 'Vergleichen' });
      await expect(compare).toHaveCSS('color', link);
      await expect(compare).toHaveCSS('text-decoration-line', 'none');
      await compare.hover();
      await expect(compare).toHaveCSS('text-decoration-line', 'underline');
      const guide = head.getByText('Lesehilfe', { exact: true });
      await expect(guide).toHaveCSS('color', shown);
      await expect(guide).toHaveCSS('font-weight', '600');
    });
  }
});

test.describe('the width of a page', () => {
  test.describe('in a window 1,920 pixels wide', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    const box = async (page: Page, selector: string) => {
      const found = await page.locator(selector).first().boundingBox();
      if (found === null) throw new Error(`${selector} has no box`);
      return found;
    };

    test('a page of 1,600 pixels in the middle: 192 at each side, a paragraph at most 640', async ({
      page,
    }) => {
      await page.goto('de/votes/5960/');
      await page.locator('.municipalities path').nth(2000).waitFor();
      const header = await box(page, 'header');
      expect(header.x).toBe(192);
      expect(header.x + header.width).toBe(1728);
      expect((await box(page, 'h1')).x).toBe(192);
      expect((await box(page, '.limits p')).width).toBeLessThanOrEqual(640);
      // The map, and to its right the limits' column, which ends where the page does
      // (investigations/redesign.md, 6).
      expect(Math.abs((await box(page, '.map svg')).width - 1104)).toBeLessThanOrEqual(1);
      const column = await box(page, '.workbench > :nth-child(2)');
      expect(Math.abs(column.width - 384)).toBeLessThanOrEqual(1);
      expect(Math.abs(column.x + column.width - 1728)).toBeLessThanOrEqual(1);
    });

    test('the start page and the guide: a page of 1,216 pixels, 384 at each side', async ({
      page,
    }) => {
      for (const path of ['de/', 'de/guide/']) {
        await page.goto(path);
        const header = await box(page, 'header');
        expect(Math.abs(header.x - 384), path).toBeLessThanOrEqual(1);
        expect(Math.abs(header.x + header.width - 1536), path).toBeLessThanOrEqual(1);
        expect(Math.abs((await box(page, 'h1')).x - 384), path).toBeLessThanOrEqual(1);
      }
    });
  });

  test.describe('in a window 360 pixels wide', () => {
    test.use({ viewport: { width: 360, height: 780 } });

    test('the head and the list from 16 pixels to at most 344', async ({ page }) => {
      await page.goto('de/');
      for (const selector of ['header', 'ul']) {
        const found = await page.locator(selector).first().boundingBox();
        expect(found?.x, selector).toBe(16);
        expect((found?.x ?? 0) + (found?.width ?? 0), selector).toBeLessThanOrEqual(344);
      }
    });
  });
});

test.describe('the controls', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`in the ${colorScheme} scheme: borders or fills at least 3:1, texts 4.5:1`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await foreignersUpTo1998(page);
      await page.locator('.municipalities path').nth(2000).waitFor();
      const controls = await controlContrast(page, [
        '.zoom button:nth-of-type(1)',
        '.zoom button:nth-of-type(2)',
        '.zoom button:nth-of-type(3)',
        '.limits .add',
        '.limits > button:last-of-type',
        '.switch .knob',
        '.track::before',
      ]);
      expect(controls.filter((c) => c.boundary < 3 || (c.text !== null && c.text < 4.5))).toEqual(
        [],
      );
      // "Entfernen" is a quiet button, underlined text without a border or a fill.
      const [remove] = await controlContrast(page, ['.limit .remove']);
      expect(remove.text).toBeGreaterThanOrEqual(4.5);
      await expect(page.locator('.limit .remove')).toHaveCSS('text-decoration-line', 'underline');
      // The bars above the track: those outside the bounds #8c8c8c, or #6e6e6e in the dark scheme.
      await expect(page.locator('.limit .hist .out path')).toHaveCSS(
        'fill',
        colorScheme === 'light' ? 'rgb(140, 140, 140)' : 'rgb(110, 110, 110)',
      );
      // The thumbs are drawn by the browser: their pixels on the screen.
      const ground = (
        await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
      )
        .match(/\d+/g)
        ?.slice(0, 3)
        .map(Number) ?? [0, 0, 0];
      const drawn: [string, number[]][] = [];
      const track = await page.getByRole('slider').last().boundingBox();
      if (track === null) throw new Error('the slider has no box');
      // The thumb's centre runs from half a thumb inside one end of the input to the other.
      const at = (step: number) => track.x + 10 + ((track.width - 20) * step) / 1000;
      for (const [name, step] of [
        ['lower thumb', 0],
        ['upper thumb', 327],
      ] as const) {
        drawn.push([name, await pixelAt(page, at(step), track.y + track.height / 2)]);
      }
      expect(
        drawn
          .filter(([, pixel]) => ratioOf(pixel, ground) < 3)
          .map(([name, pixel]) => [name, pixel]),
      ).toEqual([]);
    });
  }
});

test.describe('a control focused from the keyboard', () => {
  for (const [colorScheme, ring] of [
    ['light', 'rgb(28, 28, 28)'], // #1c1c1c
    ['dark', 'rgb(232, 232, 232)'], // #e8e8e8
  ] as const) {
    test(`in the ${colorScheme} scheme: a ring of 2 pixels in the text's colour`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('de/votes/5960/');
      await page.locator('.municipalities path').nth(2000).waitFor();
      const target = page.getByRole('button', { name: 'Ganze Schweiz' });
      for (let presses = 0; presses < 80; presses += 1) {
        if (await target.evaluate((button) => button === document.activeElement)) break;
        await page.keyboard.press('Tab');
      }
      await expect(target).toBeFocused();
      await expect(target).toHaveCSS('outline-style', 'solid');
      await expect(target).toHaveCSS('outline-width', '2px');
      await expect(target).toHaveCSS('outline-color', ring);
    });
  }
});

// What outlives the tab: cookies and local storage. `sessionStorage` is SvelteKit's, whose router
// writes the scroll position there when a page is left (design of add-site-style, decision 6).
test('nothing stored: no switch of the scheme, no cookie, no local storage', async ({ page }) => {
  for (const colorScheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('de/');
    await expect(page.locator('h1')).toBeVisible();
    // The start page has no control at all, so none that switches the scheme.
    await expect(page.locator('button, input, select')).toHaveCount(0);
    expect(await page.evaluate(() => [document.cookie, localStorage.length]), colorScheme).toEqual([
      '',
      0,
    ]);
  }
});
