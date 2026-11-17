// The three languages (spec interface-languages), against the built site. The terms are those of
// investigations/languages.md.
import { expect, test, type Page } from '@playwright/test';
import { pointIn } from './pointing.ts';

/** The language a page declares in its markup. */
const languageOf = (page: Page) => page.locator('html').getAttribute('lang');

/** The switch at the top of a page. */
const switchOf = (page: Page) => page.locator('nav.languages');

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
    await expect(languages.getByText('Italiano')).toHaveAttribute('aria-current', 'page');
  }
});

test('a selection stays behind: the other language opens the page anew', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await page.getByLabel('Merkmal hinzufügen').selectOption({ label: 'Ausländeranteil' });
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  await page
    .getByRole('slider', { name: 'Obere Grenze: Ausländeranteil', exact: true })
    .fill('327');
  await expect(page.locator('.selection')).toHaveCount(1);
  await switchOf(page).getByRole('link', { name: 'Italiano' }).click();
  await expect(page).toHaveURL(/\/it\/votes\/5960\/?$/);
  // Wait until the Italian page's limits and map are there before counting what they hold.
  await expect(page.getByLabel('Aggiungere una caratteristica')).toBeVisible();
  await expect(page.locator('.municipalities [data-number="261"]')).toBeVisible();
  await expect(page.locator('.limit')).toHaveCount(0);
  await expect(page.locator('.selection')).toHaveCount(0);
  await expect(page.locator('.municipalities [fill="#2c2c2c"]')).toHaveCount(0);
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
  for (const language of ['fr', 'it']) {
    await page.goto(`${language}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Popular Vote Explorer');
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

/** Add a limit and move its upper bound to a step, with the labels of the page's language. */
async function upperTo(
  page: Page,
  labels: { add: string; button: string; upper: string },
  name: string,
  step: number,
): Promise<void> {
  await page.getByLabel(labels.add).selectOption({ label: name });
  await page.getByRole('button', { name: labels.button, exact: true }).click();
  await page
    .getByRole('slider', { name: `${labels.upper}: ${name}`, exact: true })
    .fill(String(step));
}

/** What a selection shows: the count, the dark grey municipalities, the selection's figures. */
async function selectionShown(page: Page) {
  return {
    count: await page.locator('.limits .count').textContent(),
    aside: await page.locator('.municipalities [fill="#2c2c2c"]').count(),
    figures: await page.locator('.selection dd').allTextContents(),
  };
}

test('a selection in French: the same municipalities and result as in German', async ({ page }) => {
  // The share of foreigners up to step 327, 19.98% (investigations/limits.md, 5).
  await page.goto('de/votes/5960/');
  await upperTo(
    page,
    { add: 'Merkmal hinzufügen', button: 'Hinzufügen', upper: 'Obere Grenze' },
    'Ausländeranteil',
    327,
  );
  await expect(page.locator('.selection')).toHaveCount(1);
  const german = await selectionShown(page);
  await page.goto('fr/votes/5960/');
  await upperTo(
    page,
    { add: 'Ajouter une caractéristique', button: 'Ajouter', upper: 'Limite supérieure' },
    'Part des étrangers',
    327,
  );
  await expect(page.locator('.selection h2')).toHaveText('Avec votre sélection');
  const french = await selectionShown(page);
  expect(german.count).toBe("In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis.");
  expect(french.count).toBe("Dans la sélection: 1'455 des 2'103 communes avec un résultat propre.");
  expect(french.aside).toBe(german.aside);
  expect(french.aside).toBeGreaterThan(0);
  expect(french.figures).toEqual(german.figures);
});

/** The kind, figures, verdicts, outcome and table column of the vote's own result. */
async function verdictsShown(page: Page) {
  const own = page.locator('.results > .result').first();
  return {
    head: await page.locator('h1 + p').textContent(),
    figures: await own.locator('dt').allTextContents(),
    verdicts: await own.locator('.verdict h2').allTextContents(),
    outcome: await own.locator('.outcome').textContent(),
    column: await page.locator('thead th').nth(2).textContent(),
  };
}

test('the verdicts in French, with the Constitution\'s "voix des cantons"', async ({ page }) => {
  await page.goto('fr/votes/5960/');
  expect(await verdictsShown(page)).toEqual({
    head: '28 février 2016 · Initiative populaire',
    figures: ['Oui', 'Non', 'Pourcentage de oui', 'Participation'],
    verdicts: ['Majorité du peuple', 'Majorité des cantons'],
    outcome: 'Rejeté',
    column: 'Voix des cantons',
  });
});

test('the verdicts in Italian', async ({ page }) => {
  await page.goto('it/votes/5960/');
  expect(await verdictsShown(page)).toEqual({
    head: '28 febbraio 2016 · Iniziativa popolare',
    figures: ['Sì', 'No', 'Percentuale di sì', 'Partecipazione'],
    verdicts: ['Maggioranza del popolo', 'Maggioranza dei Cantoni'],
    outcome: 'Respinto',
    column: 'Voti dei Cantoni',
  });
});

/** The entry of a vote on a start page, by the link to its page. */
const entryOf = (page: Page, language: string, id: number) =>
  page
    .getByRole('listitem')
    .filter({ has: page.locator(`a[href$="/${language}/votes/${String(id)}"]`) });

test("the list's verdicts in French and Italian", async ({ page }) => {
  const results = {
    fr: ['rejeté, 49.16% de oui', 'accepté, 50.39% de oui'],
    it: ['respinto, 49.16% di sì', 'accettato, 50.39% di sì'],
  };
  for (const [language, [failed, passed]] of Object.entries(results)) {
    await page.goto(`${language}/`);
    await expect(entryOf(page, language, 5960).locator('span:not(.mark)').nth(2)).toHaveText(
      failed,
    );
    await expect(entryOf(page, language, 6790).locator('span:not(.mark)').nth(2)).toHaveText(
      passed,
    );
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
    await expect(page.locator('.map')).toContainText(term);
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
      '28 février 2016',
      'Initiative populaire «Pour le couple et la famille - Non à la pénalisation du mariage»',
      'Initiative populaire',
    ],
    it: [
      '28 febbraio 2016',
      'Iniziativa popolare «Per il matrimonio e la famiglia - No agli svantaggi per le coppie sposate»',
      'Iniziativa popolare',
    ],
  };
  for (const [language, [date, title, kind]] of Object.entries(entries)) {
    await page.goto(`${language}/`);
    const entry = entryOf(page, language, 5960);
    await expect(entry.locator('span:not(.mark)').nth(0)).toHaveText(date);
    await expect(entry.getByRole('link')).toHaveText(title);
    await expect(entry.locator('span:not(.mark)').nth(1)).toHaveText(kind);
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
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Popular Vote Explorer');
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
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Popular Vote Explorer');
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
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Popular Vote Explorer');
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
