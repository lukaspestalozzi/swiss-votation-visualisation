// How the browser tests reach the parts of a page: the limits' controls, a result and the head.
// A part that changes its markup changes here, and the tests keep their assertions.
import { expect, type Locator, type Page } from '@playwright/test';

export type Language = 'de' | 'fr' | 'it';

/** The words by which a test finds the control that adds a limit, in each language. */
const ADDING: Record<Language, { list: string; add: string }> = {
  de: { list: 'Merkmal hinzufügen', add: 'Hinzufügen' },
  fr: { list: 'Ajouter une caractéristique', add: 'Ajouter' },
  it: { list: 'Aggiungere una caratteristica', add: 'Aggiungere' },
};

/** The list of the characteristics that have no limit yet. */
export const limitList = (page: Page, language: Language = 'de'): Locator =>
  page.getByLabel(ADDING[language].list);

/** The button that adds the limit of the characteristic chosen in the list. */
export const addButton = (page: Page, language: Language = 'de'): Locator =>
  page.getByRole('button', { name: ADDING[language].add, exact: true });

/** Open a vote's page and wait until the limits can be used. */
export async function openVote(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(limitList(page)).toBeVisible();
}

/** Add the limit of a characteristic, by a click or, on a touch screen, by a tap. */
export async function addLimit(
  page: Page,
  name: string,
  language: Language = 'de',
  by: 'click' | 'tap' = 'click',
): Promise<void> {
  await limitList(page, language).selectOption({ label: name });
  await addButton(page, language)[by]();
}

/** The names of the characteristics a limit can be added for. */
export const offered = (page: Page): Promise<string[]> =>
  limitList(page).locator('option:not([value=""])').allTextContents();

/** The headings of the list of characteristics, each with the number of its entries. */
export const listHeadings = (page: Page, language: Language = 'de'): Promise<[string, number][]> =>
  limitList(page, language)
    .locator('optgroup')
    .evaluateAll((groups) =>
      groups.map((group) => [
        (group as HTMLOptGroupElement).label,
        group.querySelectorAll('option').length,
      ]),
    );

/** A slider of a limit, by its bound and its characteristic's name, in German. */
export const slider = (page: Page, bound: 'Untere' | 'Obere', name: string): Locator =>
  page.getByRole('slider', { name: `${bound} Grenze: ${name}`, exact: true });

/** The label of the limit of a characteristic. */
export const limitLabel = (page: Page, name: string): Locator =>
  page.locator('.limit .label').filter({ hasText: new RegExp(`^${name} \\(`) });

/** The switch for the Swiss abroad, by its German name. */
export const abroadSwitch = (page: Page): Locator =>
  page.getByRole('checkbox', { name: /Auslandschweizerinnen und Auslandschweizer mitzählen/ });

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

/** The head of a page. */
export const pageHead = (page: Page): Locator => page.locator('header');

/** The switch between the languages, in the head. */
export const languageSwitch = (page: Page): Locator => page.locator('nav.languages');
