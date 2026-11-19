// The look of every page (spec site-style), against the built site. The font's figures, the
// contrasts and the widths are those of investigations/site-style.md.
import { expect, test, type Page } from '@playwright/test';
import {
  controlContrast,
  lowContrast,
  pixelAt,
  ratioOf,
  type LowContrast,
} from './contrast.ts';
import { phone } from './fingers.ts';

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
  await page.locator('.limits select').selectOption({ label: FOREIGNERS[language] });
  // The first button of the limits is the one that adds.
  await page.locator('.limits button').first().click();
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
    await expect(page.locator('.selection .outcome')).toHaveText('Angenommen');
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
    await expect(page.locator('.selection .outcome')).toBeVisible();
    await page.locator('.municipalities path').nth(2000).waitFor();
    found.push([path, await lowContrast(page)]);
  }
  return found;
}

test.describe('the light scheme', () => {
  test('every text has its contrast; text #1c1c1c on #ffffff, links #1a5fb4', async ({ page }) => {
    for (const [path, low] of await contrastOfThePages(page)) expect(low, path).toEqual([]);
    await page.goto('de/guide/');
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator('section p').first()).toHaveCSS('color', 'rgb(28, 28, 28)');
    await expect(page.locator('a').first()).toHaveCSS('color', 'rgb(26, 95, 180)');
  });

  test('a majority that is not needed: its word #1c1c1c, its cantonal votes #767676', async ({
    page,
  }) => {
    await page.goto('de/votes/5950/');
    const standesmehr = page.locator('.verdict').nth(1);
    await expect(standesmehr.locator('.word')).toHaveText('nicht nötig');
    await expect(standesmehr.locator('.word')).toHaveCSS('color', 'rgb(28, 28, 28)');
    await expect(standesmehr.locator('.greyed')).toHaveCSS('color', 'rgb(118, 118, 118)');
  });
});

test.describe('the dark scheme', () => {
  test.use({ colorScheme: 'dark' });

  test('every text has its contrast; text #e8e8e8 on #121212, links #8ab4f8', async ({ page }) => {
    for (const [path, low] of await contrastOfThePages(page)) expect(low, path).toEqual([]);
    await page.goto('de/guide/');
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(18, 18, 18)');
    await expect(page.locator('section p').first()).toHaveCSS('color', 'rgb(232, 232, 232)');
    await expect(page.locator('a').first()).toHaveCSS('color', 'rgb(138, 180, 248)');
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
  await expect(page.locator('.selection .outcome')).toHaveText('Angenommen');
});

// The map's darkest classes, and in the dark scheme its class 2 (spec site-style, "The verdicts in
// the map's colours").
const YES = 'rgb(0, 114, 96)'; // #007260
const NO = 'rgb(147, 67, 25)'; // #934319
const YES_DARK = 'rgb(75, 193, 173)'; // #4bc1ad
const NO_DARK = 'rgb(229, 148, 111)'; // #e5946f

/** The vote's own result on its page, beside which a selection's stands. */
const ownResult = (page: Page) => page.locator('.results > .result:not(.selection)');

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
    await expect(ownResult(page).locator('.outcome')).toHaveText('Abgelehnt');
    await expect(ownResult(page).locator('.outcome')).toHaveCSS('color', NO);
    const zurich = page.getByRole('row', { name: /^ZH / }).locator('td').last();
    await expect(zurich).toHaveText('Nein');
    await expect(zurich).toHaveCSS('color', NO);
    await page.goto('de/');
    const result = page
      .locator('li', { has: page.locator('a[href$="/votes/5960"]') })
      .locator('span', { hasText: /^abgelehnt/ });
    await expect(result).toHaveCSS('color', NO);
  });

  test.describe('on a phone', () => {
    test.use(phone);

    test('a selection: "Angenommen" and both "Ja" #007260, in the box and the bar', async ({
      page,
    }) => {
      await foreignersUpTo1998(page);
      await expect(page.locator('.selection .outcome')).toHaveText('Angenommen');
      await expect(page.locator('.selection .outcome')).toHaveCSS('color', YES);
      const words = page.locator('.selection-bar span');
      await expect(words).toHaveText(['Angenommen', 'Ja', 'Ja']);
      for (const word of await words.all()) await expect(word).toHaveCSS('color', YES);
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
      await expect(ownResult(page).locator('.outcome')).toHaveText('Rejeté');
      await expect(ownResult(page).locator('.outcome')).toHaveCSS('color', NO_DARK);
    });
  });
});

test.describe('the head of every page', () => {
  test("on a vote's page: the title, the guide and the languages, before the heading", async ({
    page,
  }) => {
    await page.goto('fr/votes/5960/');
    const head = page.locator('header');
    await expect(head).toHaveText(
      /^\s*Popular Vote Explorer\s*Guide de lecture\s*Deutsch\s*Français\s*Italiano\s*$/,
    );
    await expect(head.getByRole('link', { name: 'Popular Vote Explorer' })).toHaveAttribute(
      'href',
      /\/fr\/?$/,
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

  test('on the start page the title, on the guide its name, is no link', async ({ page }) => {
    const head = page.locator('header');
    await page.goto('de/');
    await expect(head.getByRole('link', { name: 'Popular Vote Explorer' })).toHaveCount(0);
    await expect(head.getByText('Popular Vote Explorer')).toHaveAttribute('aria-current', 'page');
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

    test('the head fits the window, and none of its parts breaks', async ({ page }) => {
      await page.goto('it/votes/5960/');
      const lines = await page.evaluate(() => {
        const head = document.querySelector('header');
        if (head === null) return null;
        // The lines each text of the head takes: one, if it does not break.
        return {
          right: head.getBoundingClientRect().right,
          parts: [...head.querySelectorAll('a, span')].map((part) => {
            const range = document.createRange();
            range.selectNodeContents(part);
            const tops = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
            return [part.textContent.trim(), tops.size];
          }),
        };
      });
      expect(lines?.right).toBeLessThanOrEqual(360);
      expect(lines?.parts).toEqual([
        ['Popular Vote Explorer', 1],
        ['Guida alla lettura', 1],
        ['Deutsch', 1],
        ['Français', 1],
        ['Italiano', 1],
      ]);
    });
  });
});

test.describe('the width of a page', () => {
  test.describe('in a window 1,920 pixels wide', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('16 pixels at the left, the map 1,552 wide beside its panel, a paragraph at most 640', async ({
      page,
    }) => {
      await page.goto('de/votes/5960/');
      await page.locator('.municipalities path').nth(2000).waitFor();
      const box = async (selector: string) => {
        const found = await page.locator(selector).first().boundingBox();
        if (found === null) throw new Error(`${selector} has no box`);
        return found;
      };
      expect((await box('header')).x).toBe(16);
      expect((await box('h1')).x).toBe(16);
      const map = await box('.map svg');
      expect(Math.abs(map.width - 1552)).toBeLessThanOrEqual(1);
      expect((await box('.panel')).x).toBeGreaterThan(map.x + map.width);
      expect((await box('.limits p')).width).toBeLessThanOrEqual(640);
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
      // "Hinzufügen" cannot be used once its limit is added: WCAG exempts it.
      const controls = await controlContrast(page, [
        '.zoom button:nth-of-type(1)',
        '.zoom button:nth-of-type(2)',
        '.zoom button:nth-of-type(3)',
        '.limits select',
        '.limit button',
        '.limits > button:last-of-type',
        '.track::before',
      ]);
      expect(controls.filter((c) => c.boundary < 3 || (c.text !== null && c.text < 4.5))).toEqual(
        [],
      );
      // The switch's box and the thumbs are drawn by the browser: their pixels on the screen.
      const ground = (
        await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
      )
        .match(/\d+/g)
        ?.slice(0, 3)
        .map(Number) ?? [0, 0, 0];
      const box = await page.locator('.switch input').boundingBox();
      if (box === null) throw new Error('the switch has no box');
      const drawn: [string, number[]][] = [['switch', await pixelAt(page, box.x + 3, box.y + 3)]];
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
        drawn.filter(([, pixel]) => ratioOf(pixel, ground) < 3).map(([name, pixel]) => [name, pixel]),
      ).toEqual([]);
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
