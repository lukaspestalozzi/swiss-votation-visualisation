// The three languages (spec interface-languages), against the built site. The terms are those of
// investigations/languages.md.
import { expect, test, type Page } from '@playwright/test';
import { pointIn } from './pointing.ts';
import {
  addLimit,
  figureNamesOf,
  figuresOf,
  kindOf,
  languageSwitch,
  majorityHeadingsOf,
  outcomeOf,
  ownResult,
  pageHead,
  placeOf,
  selectionHeading,
  selectionResult,
  shareOf,
  verdictOf,
} from './parts.ts';

/** The language a page declares in its markup. */
const languageOf = (page: Page) => page.locator('html').getAttribute('lang');

/** The switch at the top of a page. */
const switchOf = (page: Page) => languageSwitch(page);

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

test.describe('the switch in a narrow window', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('it writes "DE", "FR", "IT", each still named with its word', async ({ page }) => {
    // Spec interface-languages, "The switch in a narrow window"; design of redesign-site, 7.
    await page.goto('de/votes/5960/');
    const languages = switchOf(page);
    const french = languages.getByRole('link', { name: 'FR – Français', exact: true });
    await expect(french).toHaveAttribute('href', /\/fr\/votes\/5960\/?$/);
    await expect(languages.getByRole('link', { name: 'IT – Italiano', exact: true })).toHaveCount(
      1,
    );
    await expect(languages.getByRole('link', { name: /Deutsch/ })).toHaveCount(0);
    // What is written: the code before a name that is left a box of one pixel.
    const written = await languages.evaluate((switchOfPage) =>
      [...switchOfPage.children].map((language) => [
        getComputedStyle(language, '::before').content,
        language.querySelector('.name')?.getBoundingClientRect().width,
      ]),
    );
    expect(written).toEqual([
      ['"DE"', 1],
      ['"FR"', 1],
      ['"IT"', 1],
    ]);
    await expect(languages.locator('[aria-current="page"]')).toHaveText('Deutsch');
  });
});

test('the switch in a wide window writes the names, and no code', async ({ page }) => {
  await page.goto('de/votes/5960/');
  const written = await switchOf(page).evaluate((switchOfPage) =>
    [...switchOfPage.children].map((language) => [
      getComputedStyle(language, '::before').content,
      language.textContent.trim(),
    ]),
  );
  expect(written).toEqual([
    ['none', 'Deutsch'],
    ['none', 'Français'],
    ['none', 'Italiano'],
  ]);
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
    await expect(languages.locator('[aria-current="page"]')).toHaveText('Italiano');
  }
});

test('A selection goes along: the other language opens the page anew with it', async ({ page }) => {
  // Spec interface-languages, "The switch between the languages"; spec share-link.
  await page.goto('de/votes/5960/');
  const zurich = await pointIn(page, '.municipalities [data-number="261"]');
  await page.mouse.click(zurich.x, zurich.y);
  await expect(page.locator('.map .outlined path')).toHaveCount(2);
  await addLimit(page, 'Ausländeranteil');
  await page
    .getByRole('slider', { name: 'Obere Grenze: Ausländeranteil', exact: true })
    .fill('327');
  await page.waitForTimeout(1000);
  await switchOf(page).getByRole('link', { name: 'Italiano' }).click();
  await expect(page).toHaveURL(/\/it\/votes\/5960\/?#foreigners=-19\.98$/);
  await expect(page.locator('.limit .label')).toHaveText([
    'Quota di stranieri (fine 2015): da 0.00% a 19.98%',
  ]);
  await expect(selectionHeading(page)).toHaveText('Con la Sua selezione');
  // Wait until the Italian page's map is there before looking at what it outlines.
  await expect(page.locator('.municipalities [data-number="261"]')).toBeVisible();
  await expect(page.locator('.map .outlined path')).toHaveCount(0);
  await expect(page.locator('.panel')).toContainText(
    'Clicchi su un Comune per vederne le caratteristiche.',
  );
});

test('A selection goes along after a link opened in the same tab', async ({ page }) => {
  // The browser's address changes, not SvelteKit's, which the switch carries: the page writes it.
  await page.goto('de/votes/5960/');
  await addLimit(page, 'Einwohner');
  await page.waitForTimeout(1000);
  await page.goto('de/votes/5960/#foreigners=-19.98');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  ]);
  await page.waitForTimeout(1000);
  await switchOf(page).getByRole('link', { name: 'Italiano' }).click();
  await expect(page).toHaveURL(/\/it\/votes\/5960\/?#foreigners=-19\.98$/);
  await expect(page.locator('.limit .label')).toHaveText([
    'Quota di stranieri (fine 2015): da 0.00% a 19.98%',
  ]);
});

test('the three pages of a vote, each in its language, and every vote in each', async ({
  page,
}) => {
  // Every vote of the site's own list has its page under each language: 125 in the data files of
  // 2026-11-14.
  const { votes } = (await (await page.request.get('data/votes.json')).json()) as {
    votes: { id: number }[];
  };
  expect(votes).toHaveLength(125);
  for (const language of ['de', 'fr', 'it']) {
    await page.goto(`${language}/votes/5960/`);
    expect(await languageOf(page)).toBe(language);
    for (const { id } of votes) {
      const response = await page.request.get(`${language}/votes/${String(id)}/`);
      expect(response.status(), `${language}/votes/${String(id)}/`).toBe(200);
    }
  }
});

test('the start page and the guide in each language: the same working title', async ({ page }) => {
  // The start page's heading is the question in its language (spec vote-list, "The list of
  // votes"); the French one holds a word joiner, which keeps "aurait-elle" on one line.
  const questions = {
    fr:
      'Comment la Suisse aurait-\u2060elle voté si seule une partie des communes ' +
      "s'était rendue aux urnes?",
    it: 'Come avrebbe votato la Svizzera se solo una parte dei Comuni si fosse recata alle urne?',
  };
  for (const [language, question] of Object.entries(questions)) {
    await page.goto(`${language}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(question);
    await expect(page).toHaveTitle('Popular Vote Explorer');
    await expect(pageHead(page).getByText('Popular Vote Explorer')).toBeVisible();
    expect(await languageOf(page)).toBe(language);
  }
  await page.goto('fr/guide/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Guide de lecture');
  expect(await languageOf(page)).toBe('fr');
});

test('a language that has no page: 404', async ({ page }) => {
  for (const path of ['en/', 'rm/votes/5960/']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
});

/** Point at a municipality on the map, by its number. */
async function pointAt(page: Page, number: number): Promise<void> {
  const point = await pointIn(page, `.municipalities [data-number="${String(number)}"]`);
  await page.mouse.move(point.x, point.y);
}

test('the details of a municipality in Italian: the same figures under Italian names', async ({
  page,
}) => {
  // As result-map's "The details of a municipality" on the German page;
  // investigations/map-data.md.
  await page.goto('it/votes/5960/');
  await pointAt(page, 261);
  await expect(page.locator('.details .name')).toHaveText('Zürich (ZH)');
  await expect(page.locator('.details li')).toHaveText([
    'Percentuale di sì: 31.85%',
    "Sì: 46'565",
    "No: 99'614",
  ]);
});

/** Add a limit and move its upper bound to a step, with the words of the page's language. */
async function upperTo(
  page: Page,
  language: 'de' | 'fr',
  name: string,
  step: number,
): Promise<void> {
  await addLimit(page, name, language);
  const upper = { de: 'Obere Grenze', fr: 'Limite supérieure' }[language];
  await page.getByRole('slider', { name: `${upper}: ${name}`, exact: true }).fill(String(step));
}

/** What a selection shows: the count, the dark grey municipalities, the selection's figures. */
async function selectionShown(page: Page) {
  return {
    count: await page.locator('.limits .count').textContent(),
    aside: await page.locator('.municipalities [fill="#2c2c2c"]').count(),
    figures: await figuresOf(selectionResult(page)).allTextContents(),
  };
}

test('a selection in French: the same municipalities and result as in German', async ({ page }) => {
  // The share of foreigners up to step 327, 19.98% (investigations/limits.md, 5).
  await page.goto('de/votes/5960/');
  await upperTo(page, 'de', 'Ausländeranteil', 327);
  await expect(selectionResult(page)).toHaveCount(1);
  const german = await selectionShown(page);
  await page.goto('fr/votes/5960/');
  await upperTo(page, 'fr', 'Part des étrangers', 327);
  await expect(selectionHeading(page)).toHaveText('Avec votre sélection');
  const french = await selectionShown(page);
  expect(german.count).toBe("In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis.");
  expect(french.count).toBe("Dans la sélection: 1'455 des 2'103 communes avec un résultat propre.");
  expect(french.aside).toBe(german.aside);
  expect(french.aside).toBeGreaterThan(0);
  expect(french.figures).toEqual(german.figures);
});

/**
 * The kind, figures, verdicts and outcome of the vote's own result, and the table's columns of
 * the yes share and of the cantonal votes.
 */
async function verdictsShown(page: Page) {
  const own = ownResult(page);
  return {
    head: await page.locator('h1 + p').textContent(),
    figures: await figureNamesOf(own).allTextContents(),
    verdicts: await majorityHeadingsOf(own).allTextContents(),
    outcome: await outcomeOf(own).textContent(),
    share: await page.locator('thead th').nth(1).textContent(),
    column: await page.locator('thead th').nth(2).textContent(),
  };
}

test('the verdicts in French, with the Constitution\'s "voix des cantons"', async ({ page }) => {
  await page.goto('fr/votes/5960/');
  expect(await verdictsShown(page)).toEqual({
    head: '28\u00a0février 2016 · Initiative populaire',
    figures: ['Oui', 'Non', 'Participation'],
    verdicts: ['Majorité du peuple', 'Majorité des cantons'],
    outcome: 'Rejeté',
    share: 'Pourcentage de oui',
    column: 'Voix des cantons',
  });
});

test('the verdicts in Italian', async ({ page }) => {
  await page.goto('it/votes/5960/');
  expect(await verdictsShown(page)).toEqual({
    head: '28\u00a0febbraio 2016 · Iniziativa popolare',
    figures: ['Sì', 'No', 'Partecipazione'],
    verdicts: ['Maggioranza del popolo', 'Maggioranza dei Cantoni'],
    outcome: 'Respinto',
    share: 'Percentuale di sì',
    column: 'Voti dei Cantoni',
  });
});

/** The entry of a vote on a start page, by the link to its page. */
const entryOf = (page: Page, language: string, id: number) =>
  page
    .getByRole('listitem')
    .filter({ has: page.locator(`a[href$="/${language}/votes/${String(id)}"]`) });

test("the list's verdicts in French and Italian", async ({ page }) => {
  // The share and the result of the votes 5960 and 6790.
  const results = {
    fr: [
      ['49.16% de oui', 'rejeté'],
      ['50.39% de oui', 'accepté'],
    ],
    it: [
      ['49.16% di sì', 'respinto'],
      ['50.39% di sì', 'accettato'],
    ],
  };
  for (const [language, [failed, passed]] of Object.entries(results)) {
    await page.goto(`${language}/`);
    for (const [id, [share, verdict]] of [
      [5960, failed],
      [6790, passed],
    ] as const) {
      await expect(shareOf(entryOf(page, language, id))).toHaveText(share);
      await expect(verdictOf(entryOf(page, language, id))).toHaveText(verdict);
    }
  }
});

test('a result not validated yet, in French and Italian', async ({ page }) => {
  // The data files of 2026-11-14: vote 6850 is not validated yet.
  await page.goto('fr/votes/6850/');
  await expect(
    page.getByText('Résultat provisoire: pas encore validé par le Conseil fédéral.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto('it/votes/6850/');
  await expect(
    page.getByText('Risultato provvisorio: non ancora accertato dal Consiglio federale.', {
      exact: true,
    }),
  ).toBeVisible();
});

test('the parties in French and Italian, in the panel', async ({ page }) => {
  // investigations/languages.md, 4: STAT-TAB's French, the party register's Italian.
  const parties = {
    fr: [
      'PLR',
      "Le Centre (jusqu'en 2020 PDC et PBD)",
      'PS',
      'UDC',
      'PVL',
      'Verts',
      'Autres partis',
    ],
    it: [
      'PLR',
      'Il Centro (fino al 2020 PPD e PBD)',
      'PS',
      'UDC',
      'PVL',
      'I Verdi',
      'Altri partiti',
    ],
  };
  for (const [language, names] of Object.entries(parties)) {
    await page.goto(`${language}/votes/5960/`);
    const point = await pointIn(page, '.municipalities [data-number="261"]');
    await page.mouse.click(point.x, point.y);
    const panel = page.locator('.panel');
    await expect(panel.locator('.name')).toHaveText('Zürich (ZH)');
    for (const name of names) await expect(panel).toContainText(`${name}: `);
  }
});

test("the Swiss abroad in French and Italian: the Swiss Abroad Act's words", async ({ page }) => {
  // investigations/languages.md, 3.
  const words = { fr: "Suisses de l'étranger", it: "Svizzeri all'estero" };
  for (const [language, term] of Object.entries(words)) {
    await page.goto(`${language}/votes/5960/`);
    await expect(page.getByRole('checkbox', { name: new RegExp(term) })).toBeChecked();
    // Below the map: the sentence on those who are not on it.
    await expect(page.locator('.watch')).toContainText(term);
  }
});

test('the sources in French and Italian: the offices and the register by their names', async ({
  page,
}) => {
  // investigations/languages.md, 5.
  const names = {
    fr: [
      'Office fédéral de la statistique (OFS)',
      'Chancellerie fédérale',
      'Répertoire officiel des communes de Suisse',
    ],
    it: [
      'Ufficio federale di statistica (UST)',
      'Cancelleria federale',
      'Elenco ufficiale dei Comuni della Svizzera',
    ],
  };
  for (const [language, expected] of Object.entries(names)) {
    await page.goto(`${language}/guide/`);
    const sources = page.locator('section').last();
    for (const name of expected) await expect(sources).toContainText(name);
  }
});

/** A section of a page, by its heading. */
const sectionOf = (page: Page, heading: string) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: heading }) });

test('the annulled vote in French: its reference and the note of the Chancellery', async ({
  page,
}) => {
  await page.goto('fr/votes/5960/');
  await expect(page.getByText('Source: FF 2019 4421', { exact: true })).toBeVisible();
  await expect(sectionOf(page, 'Note de la Chancellerie fédérale').locator('p')).toHaveText(
    /^Par arrêts du 10 avril 2019/,
  );
});

test('the annulled vote in Italian: its title, reference and note', async ({ page }) => {
  await page.goto('it/votes/5960/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Iniziativa popolare «Per il matrimonio e la famiglia - No agli svantaggi per le coppie sposate»',
  );
  await expect(page.getByText('Fonte: FF 2019 3843', { exact: true })).toBeVisible();
  await expect(sectionOf(page, 'Nota della Cancelleria federale').locator('p')).toHaveText(
    /^Con sentenze del 10 aprile 2019/,
  );
});

test("a title as the BFS gives it, beside the Constitution's kind", async ({ page }) => {
  // investigations/languages.md, 1: the BFS writes "domanda sussidiaria" in the title.
  await page.goto('it/votes/6823/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Iniziativa denaro contante e controprogetto: domanda sussidiaria',
  );
  await expect(page.locator('h1 + p')).toHaveText('8 marzo 2026 · Domanda risolutiva');
});

test('a municipality with two names keeps them in every language', async ({ page }) => {
  for (const language of ['it', 'fr']) {
    await page.goto(`${language}/votes/5960/`);
    await pointAt(page, 371);
    await expect(page.locator('.details .name')).toHaveText('Biel/Bienne (BE)');
  }
});

test('the cantons in the table: their abbreviations, in the order of the German page', async ({
  page,
}) => {
  const cantonsOn = async (language: string) => {
    await page.goto(`${language}/votes/5960/`);
    return page.locator('tbody th').allTextContents();
  };
  const german = await cantonsOn('de');
  expect(german.slice(0, 3)).toEqual(['ZH', 'BE', 'LU']);
  expect(german.at(-1)).toBe('JU');
  expect(await cantonsOn('fr')).toEqual(german);
  expect(await cantonsOn('it')).toEqual(german);
});

test('the same vote in French and Italian on the start page, linked in its language', async ({
  page,
}) => {
  // Spec vote-list, "The same vote in French and Italian".
  const entries = {
    fr: [
      '28 février',
      'Initiative populaire «Pour le couple et la famille - Non à la pénalisation du mariage»',
      'Initiative populaire',
    ],
    it: [
      '28 febbraio',
      'Iniziativa popolare «Per il matrimonio e la famiglia - No agli svantaggi per le coppie sposate»',
      'Iniziativa popolare',
    ],
  };
  for (const [language, [day, title, kind]] of Object.entries(entries)) {
    await page.goto(`${language}/`);
    const entry = entryOf(page, language, 5960);
    expect(await placeOf(entry)).toEqual(['2016', day]);
    await expect(entry.getByRole('link')).toHaveText(title);
    await expect(kindOf(entry)).toHaveText(kind);
  }
});

test('the page of a vote in French: its title, date and kind', async ({ page }) => {
  // Spec verdicts, "The page of a vote in French".
  await page.goto('fr/votes/5960/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Initiative populaire «Pour le couple et la famille - Non à la pénalisation du mariage»',
  );
  await expect(page.locator('h1 + p')).toHaveText('28 février 2016 · Initiative populaire');
});

test('a validated vote in French and Italian: its reference in each', async ({ page }) => {
  // Spec verdicts, "A validated vote in French and Italian", by the address without its slash.
  await page.goto('fr/votes/5670');
  await expect(page.getByText('Source: FF 2013 2759', { exact: true })).toBeVisible();
  await page.goto('it/votes/5670');
  await expect(page.getByText('Fonte: FF 2013 2619', { exact: true })).toBeVisible();
});

// The address without a language (spec interface-languages): the browser's preferred languages
// are Playwright's locale, or the list an init script puts in their place.
test.describe('a browser that prefers French', () => {
  test.use({ locale: 'fr-CH' });

  test("a vote's old address without the final slash opens its French page", async ({ page }) => {
    await page.goto('votes/5960');
    await expect(page).toHaveURL('fr/votes/5960/');
  });

  test('the address without a language opens the French start page', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveURL('fr/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Comment la Suisse aurait/);
  });
});

test.describe('a browser without scripts', () => {
  test.use({ javaScriptEnabled: false, locale: 'fr-CH' });

  test("the guide's old address opens the German guide", async ({ page }) => {
    await page.goto('guide/');
    await expect(page).toHaveURL('de/guide/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lesehilfe');
  });

  test('the address without a language opens the German start page', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveURL('de/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      /^Wie hätte die Schweiz abgestimmt/,
    );
  });
});

/** Make the browser prefer `languages`, in this order, before any page loads. */
async function prefer(page: Page, languages: string[]): Promise<void> {
  await page.addInitScript((list) => {
    Object.defineProperty(navigator, 'languages', { get: () => list });
  }, languages);
}

test('the first of the three among the preferred languages: Italian', async ({ page }) => {
  await prefer(page, ['en-US', 'it-CH', 'de-CH']);
  await page.goto('./');
  await expect(page).toHaveURL('it/');
});

test.describe('a browser that prefers none of the three', () => {
  test.use({ locale: 'en-US' });

  test('the address without a language opens the German start page', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveURL('de/');
  });
});

test.describe('a browser that prefers German', () => {
  test.use({ locale: 'de-CH' });

  test("the built files served under the site's path: the German start page", async ({ page }) => {
    // Spec app-shell, "The built files are served by a static file server".
    await page.goto('./');
    await expect(page).toHaveURL('de/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      /^Wie hätte die Schweiz abgestimmt/,
    );
  });

  test('the choice is not remembered', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveURL('de/');
    await switchOf(page).getByRole('link', { name: 'Italiano' }).click();
    await expect(page).toHaveURL(/\/it\/?$/);
    await page.goto('./');
    await expect(page).toHaveURL('de/');
  });
});

// The addresses of before (spec interface-languages): a vote's and the guide's.
test.describe('a browser that prefers Italian', () => {
  test.use({ locale: 'it-CH' });

  test("a vote's old address opens its Italian page", async ({ page }) => {
    await page.goto('votes/5960/');
    await expect(page).toHaveURL('it/votes/5960/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Iniziativa popolare «Per il matrimonio e la famiglia - No agli svantaggi per le coppie sposate»',
    );
  });
});

test('an old address that names no vote: 404', async ({ page }) => {
  const response = await page.goto('votes/9999/');
  expect(response?.status()).toBe(404);
});

test('a date keeps its day with its month on the line: the Italian guide, 800 pixels wide', async ({
  page,
}) => {
  // Spec vote-list, "A date keeps its day with its month": the guide's sources name the list's
  // date, 2026-01-01, where a line broke after "1°" before (task 6.1).
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('it/guide/');
  const tops = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const text = node.textContent ?? '';
      const day = text.indexOf('1°');
      const month = text.indexOf('gennaio 2026', day);
      if (day < 0 || month < 0) continue;
      const topOf = (from: number, to: number): number => {
        const range = document.createRange();
        range.setStart(node, from);
        range.setEnd(node, to);
        const rect = range.getClientRects().item(0);
        return rect === null ? Number.NaN : rect.top;
      };
      return [topOf(day, day + 2), topOf(month, month + 'gennaio'.length)];
    }
    return [];
  });
  expect(tops).toHaveLength(2);
  expect(tops[0]).toBe(tops[1]);
});
