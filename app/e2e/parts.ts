// How the browser tests reach the parts of a page: the limits' controls, a result and the head.
// A part that changes its markup changes here, and the tests keep their assertions.
import { expect, type Locator, type Page } from '@playwright/test';

export type Language = 'de' | 'fr' | 'it';

/** The words by which a test finds the button that adds a limit and its list, in each language. */
const ADDING: Record<Language, { add: string; close: string }> = {
  de: { add: 'Merkmal hinzufügen', close: 'Schliessen' },
  fr: { add: 'Ajouter une caractéristique', close: 'Fermer' },
  it: { add: 'Aggiungere una caratteristica', close: 'Chiudere' },
};

/** The button that opens the list of the characteristics that have no limit yet. */
export const addButton = (page: Page, language: Language = 'de'): Locator =>
  page.getByRole('button', { name: ADDING[language].add, exact: true });

/** The list it opens: a dialog headed as the button. */
export const limitList = (page: Page, language: Language = 'de'): Locator =>
  page.getByRole('dialog', { name: ADDING[language].add, exact: true });

/** The entries of the list: a button for each characteristic without a limit. */
export const listEntries = (page: Page, language: Language = 'de'): Locator =>
  limitList(page, language).locator('li button');

/** The button that closes the list without a choice. */
export const closeButton = (page: Page, language: Language = 'de'): Locator =>
  limitList(page, language).getByRole('button', { name: ADDING[language].close, exact: true });

/** Open a vote's page and wait until the limits can be used. */
export async function openVote(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(addButton(page)).toBeVisible();
}

/** Add the limit of a characteristic, by clicks or, on a touch screen, by taps. */
export async function addLimit(
  page: Page,
  name: string,
  language: Language = 'de',
  by: 'click' | 'tap' = 'click',
): Promise<void> {
  await addButton(page, language)[by]();
  await limitList(page, language).getByRole('button', { name, exact: true })[by]();
}

/** Close the open list with the Escape key. */
async function closeList(page: Page, language: Language): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(limitList(page, language)).toBeHidden();
}

/**
 * The names of the characteristics a limit can be added for: the list is opened, read and closed.
 * With a limit on every characteristic the button cannot be pressed, and there is none.
 */
export async function offered(page: Page): Promise<string[]> {
  if (await addButton(page).isDisabled()) return [];
  await addButton(page).click();
  const names = await listEntries(page).allTextContents();
  await closeList(page, 'de');
  return names.map((name) => name.trim());
}

/**
 * The headings of the list of characteristics, each with the number of its entries: the list is
 * opened, read and closed.
 */
export async function listHeadings(
  page: Page,
  language: Language = 'de',
): Promise<[string, number][]> {
  await addButton(page, language).click();
  const headings = await limitList(page, language)
    .locator('.group')
    .evaluateAll((groups) =>
      groups.map((group): [string, number] => [
        group.querySelector('h4')?.textContent.trim() ?? '',
        group.querySelectorAll('li').length,
      ]),
    );
  await closeList(page, language);
  return headings;
}

/** A slider of a limit, by its bound and its characteristic's name, in German. */
export const slider = (page: Page, bound: 'Untere' | 'Obere', name: string): Locator =>
  page.getByRole('slider', { name: `${bound} Grenze: ${name}`, exact: true });

/** The label of the limit of a characteristic. */
export const limitLabel = (page: Page, name: string): Locator =>
  page.locator('.limit .label').filter({ hasText: new RegExp(`^${name} \\(`) });

/** A limit, by its characteristic's name: its label, its bars, its track and "Entfernen". */
export const limitOf = (page: Page, name: string): Locator =>
  page
    .locator('.limit')
    .filter({ has: page.locator('.label', { hasText: new RegExp(`^${name} \\(`) }) });

/**
 * The heights of the 50 bars above a limit's track, in hundredths of the fullest bar's, as the
 * grey drawing of them holds them; the drawing in the text's colour is the same, clipped.
 */
export const barHeights = (limit: Locator): Promise<number[]> =>
  limit
    .locator('.hist .out path')
    .evaluate((path) =>
      [...(path.getAttribute('d') ?? '').matchAll(/v-([\d.]+)/g)].map((match) => Number(match[1])),
    );

/**
 * Where the drawing of a limit's bars in the text's colour begins and ends, in hundredths of
 * the bars' width: it is clipped to the part between the two bounds.
 */
export const barsBetween = (limit: Locator): Promise<{ from: number; to: number }> =>
  limit.locator('.hist .in').evaluate((drawing) => {
    const clip = getComputedStyle(drawing).clipPath;
    const inset = /^inset\(([^)]*)\)$/.exec(clip);
    if (inset === null) throw new Error(`no inset: ${clip}`);
    // Top, right, bottom and left, in the short forms a browser writes when edges are equal.
    const [top = '0', right = top, , left = right] = inset[1].split(' ');
    return { from: parseFloat(left), to: 100 - parseFloat(right) };
  });

/** The mark of the municipality last clicked, below a limit's track: its name and its value. */
export const markOf = (limit: Locator): Locator => limit.locator('.here');

/**
 * Where a limit's mark of the municipality last clicked stands: its middle from the left end of
 * the bars above the track, which are as wide as the way of a thumb's middle, and that width.
 */
export const markPlace = (limit: Locator): Promise<{ at: number; width: number }> =>
  limit.evaluate((element) => {
    const bars = element.querySelector('.hist')?.getBoundingClientRect();
    const mark = element.querySelector('.here .mark')?.getBoundingClientRect();
    if (bars === undefined || mark === undefined) throw new Error('no bars or no mark');
    return { at: mark.left + mark.width / 2 - bars.left, width: bars.width };
  });

/** The bar of the municipalities that remain, below their number: how much of it is filled. */
export const countBarFilled = (page: Page): Promise<{ width: number; filled: number }> =>
  page.locator('.limits .count-bar').evaluate((bar) => ({
    width: bar.getBoundingClientRect().width,
    filled: bar.firstElementChild?.getBoundingClientRect().width ?? 0,
  }));

/** The switch for the Swiss abroad, by its German name. */
export const abroadSwitch = (page: Page): Locator =>
  page.getByRole('checkbox', { name: /Auslandschweizerinnen und Auslandschweizer mitzählen/ });

// A vote's summary and the link to its explanations (spec vote-summaries), within `scope`: the
// page, or one vote of the comparison.
export const summaryOf = (scope: Page | Locator): Locator => scope.locator('.summary').first();
export const summaryText = (scope: Page | Locator): Locator =>
  summaryOf(scope).locator('p').first();
export const explanationsLink = (scope: Page | Locator): Locator =>
  summaryOf(scope).locator('.explanations a');

/** The result of the vote itself, on its page. */
export const ownResult = (page: Page): Locator =>
  page.locator('.results > .result:not(.selection)');

/** The result with the selection, on a vote's page. */
export const selectionResult = (page: Page): Locator => page.locator('.result.selection');

/** The heading of the result with the selection: "Mit Ihrer Auswahl". */
export const selectionHeading = (page: Page): Locator => selectionResult(page).locator('h2');

/**
 * A result's figures below its bars, in their order: yes votes, no votes and, for the vote, the
 * turnout. The yes share is the first of `verdictFiguresOf`.
 */
export const figuresOf = (result: Locator): Locator => result.locator('.figures dd');

/** The names of a result's figures, in the order of `figuresOf`. */
export const figureNamesOf = (result: Locator): Locator => result.locator('dt');

/** A result's two majorities, the voters' first. */
export const majoritiesOf = (result: Locator): Locator => result.locator('.verdict');

/** The headings of a result's two majorities. */
export const majorityHeadingsOf = (result: Locator): Locator => result.locator('.verdict h3');

/** The words of a result's two majorities: "Ja", "Nein" or "nicht nötig". */
export const verdictWordsOf = (result: Locator): Locator => result.locator('.verdict .word');

/** The figures of a result's two majorities: the yes share and the cantonal votes. */
export const verdictFiguresOf = (result: Locator): Locator => result.locator('.verdict .figure');

/** The cantonal votes of a majority that is not needed, greyed out. */
export const greyedOf = (result: Locator): Locator => result.locator('.verdict .greyed');

/** A result's outcome: "Angenommen" or "Abgelehnt". */
export const outcomeOf = (result: Locator): Locator => result.locator('.outcome');

/** The bar of a result's Volksmehr. */
export const votersBarOf = (result: Locator): Locator =>
  majoritiesOf(result).nth(0).locator('.bar');

/** The bar of a result's Ständemehr; a majority that is not needed has none. */
export const cantonsBarOf = (result: Locator): Locator =>
  majoritiesOf(result).nth(1).locator('.bar');

/** A bar as the screen draws it. */
export interface BarDrawn {
  /** The bar's box in the window. */
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  /** Its parts from the left: the side, the canton of a canton's segment, and the width. */
  readonly parts: readonly { side: 'yes' | 'no'; canton: string | null; width: number }[];
  /** The middle of its mark, from the bar's left edge. */
  readonly mark: number | null;
}

/** Measure a bar: its box, its parts and its mark. */
export const barDrawn = (bar: Locator): Promise<BarDrawn> =>
  bar.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const mark = element.querySelector('.half')?.getBoundingClientRect();
    return {
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
      parts: [...element.querySelectorAll('.yes, .no')].map((part) => ({
        side: part.classList.contains('yes') ? ('yes' as const) : ('no' as const),
        canton: part.getAttribute('title'),
        width: part.getBoundingClientRect().width,
      })),
      mark: mark === undefined ? null : mark.left + mark.width / 2 - box.left,
    };
  });

/** The sentence in the place of the selection's result, until a selection applies. */
export const selectionPlace = (page: Page): Locator => page.locator('.results .place');

/** The box of the first element a selector finds, on the screen. */
export async function boxOf(
  page: Page,
  selector: string,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await page.locator(selector).first().boundingBox();
  if (box === null) throw new Error(`${selector} is not shown`);
  return box;
}

/** Wait until the map of a vote's page has drawn its municipalities. */
export const mapDrawn = (page: Page): Promise<void> =>
  page.locator('.municipalities path').nth(2000).waitFor();

/** A canton's row in the table of the cantons, by its abbreviation. */
export const cantonRow = (page: Page, canton: string): Locator =>
  page.locator('.canton-results').getByRole('row', { name: new RegExp(`^${canton} `) });

/**
 * The bar of a canton's row as the screen draws it: its track's width; where its fill begins and
 * ends, from the track's left edge; the fill's colour; and the middle of the mark of the
 * canton's real share, which only a selection shows.
 */
export const cantonBar = (
  page: Page,
  canton: string,
): Promise<{ width: number; from: number; to: number; colour: string; real: number | null }> =>
  cantonRow(page, canton)
    .locator('.canton-bar')
    .evaluate((track) => {
      const box = track.getBoundingClientRect();
      const fill = track.querySelector('.fill');
      if (fill === null) throw new Error('the bar has no fill');
      const filled = fill.getBoundingClientRect();
      const real = track.querySelector('.real')?.getBoundingClientRect();
      return {
        width: box.width,
        from: filled.left - box.left,
        to: filled.right - box.left,
        colour: getComputedStyle(fill).backgroundColor,
        real: real === undefined ? null : real.left + real.width / 2 - box.left,
      };
    });

/** The head of a page. */
export const pageHead = (page: Page): Locator => page.locator('header');

/** The switch between the languages, in the head. */
export const languageSwitch = (page: Page): Locator => page.locator('nav.languages');

/** A row of the start page's list, by its vote's id. */
export const voteRow = (page: Page, id: number): Locator =>
  page.locator('.vote-row', { has: page.locator(`a[href$="/votes/${String(id)}"]`) });

/** The rows of the start page's list that are shown, in their order. */
export const voteRows = (page: Page): Locator => page.locator('.vote-row');

/** The ids of the votes whose rows the start page's list shows, in their order. */
export const votesShown = (page: Page): Promise<number[]> =>
  page
    .locator('.vote-row a')
    .evaluateAll((links) =>
      links.map((link) => Number(/\/votes\/(\d+)$/.exec(link.getAttribute('href') ?? '')?.[1])),
    );

/** The year and the vote day a row of the start page's list stands under. */
export const placeOf = (row: Locator): Promise<[string, string]> =>
  row.evaluate((element): [string, string] => {
    const written = (part: Element | null | undefined) =>
      (part?.textContent ?? '').replace(/\u00a0/g, ' ').trim();
    return [
      written(element.closest('.year')?.querySelector('h2')),
      written(element.closest('.day')?.querySelector('.day-date')),
    ];
  });

/** The headings of the years the start page's list shows. */
export const yearHeadings = (page: Page): Locator => page.locator('.year h2');

/**
 * The vote days of a year of the start page's list, from the newest: each with the number of
 * its rows.
 */
export const voteDays = (page: Page, year: string): Promise<[string, number][]> =>
  page
    .locator('.year', { has: page.getByRole('heading', { level: 2, name: year, exact: true }) })
    .locator('.day')
    .evaluateAll((days) =>
      days.map((day): [string, number] => [
        (day.querySelector('.day-date')?.textContent ?? '').replace(/\u00a0/g, ' ').trim(),
        day.querySelectorAll('.vote-row').length,
      ]),
    );

/** The kind of a row's vote, below its title. */
export const kindOf = (row: Locator): Locator => row.locator('.vote-kind');

/** A row's yes share as it writes it: "49.16% Ja". */
export const shareOf = (row: Locator): Locator => row.locator('.vote-share');

/** A row's official result: "angenommen" or "abgelehnt". */
export const verdictOf = (row: Locator): Locator => row.locator('.vote-verdict');

/** A row's marks: "Hinweis". */
export const marksOf = (row: Locator): Locator => row.locator('.mark');

/** The words of the start page's search field, in each language. */
const SEARCH: Record<Language, string> = {
  de: 'Titel suchen',
  fr: 'Rechercher un titre',
  it: 'Cercare un titolo',
};

/** The start page's search field. */
export const searchField = (page: Page, language: Language = 'de'): Locator =>
  page.getByRole('searchbox', { name: SEARCH[language], exact: true });

/** One of the start page's four buttons, by its name. */
export const keptButton = (page: Page, name: string): Locator =>
  page.getByRole('button', { name, exact: true });

/** The start page's links to the years of its list. */
export const yearLinks = (page: Page): Locator => page.locator('nav.years a');

/** The part of the start page that stays at the top: the field, the buttons and the years. */
export const finder = (page: Page): Locator => page.locator('.finder');
