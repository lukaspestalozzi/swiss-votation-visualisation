// The reading guide (spec reading-guide), against the built site. The figures are those of
// investigations/limits.md.
import { expect, test, type Page } from '@playwright/test';
import { pageHead } from './parts.ts';

/** A section of the guide, by its heading. */
const section = (page: Page, heading: string) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: heading }) });

test('the page "Lesehilfe": its heading, the way back and its seven sections', async ({ page }) => {
  await page.goto('de/guide/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lesehilfe');
  await expect(page.getByRole('link', { name: 'Alle Abstimmungen' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Das echte Ergebnis',
    'Gemeinden auswählen',
    'Was die Auswahl nicht zeigt',
    'Auslandschweizerinnen und Auslandschweizer',
    'Gemeinden ohne eigenes Ergebnis oder ohne Angabe',
    'Die Merkmale',
    'Quellen',
  ]);
  await expect(section(page, 'Quellen')).toHaveCount(1);
});

test('the real result: the official result first', async ({ page }) => {
  await page.goto('de/guide/');
  await expect(section(page, 'Das echte Ergebnis')).toContainText(
    'Oben auf der Seite einer Abstimmung steht ihr amtliches Ergebnis.',
  );
  await expect(section(page, 'Das echte Ergebnis')).toContainText('Mit Ihrer Auswahl');
});

test("Where the selection's result stands: below the real one, in three languages", async ({
  page,
}) => {
  // The first section of each guide, and its sentence on the second result.
  const sentences = {
    de: [
      'Das echte Ergebnis',
      'Erst wenn Sie Gemeinden auswählen, steht darunter ein zweites, neu berechnetes ' +
        'Ergebnis: «Mit Ihrer Auswahl».',
    ],
    fr: [
      'Le vrai résultat',
      "Ce n'est que lorsque vous choisissez des communes qu'un second résultat, recalculé, " +
        'apparaît au-dessous: «Avec votre sélection».',
    ],
    it: [
      'Il risultato reale',
      'Solo quando sceglie dei Comuni compare sotto un secondo risultato, ricalcolato: «Con la ' +
        'Sua selezione».',
    ],
  };
  for (const [language, [heading, sentence]] of Object.entries(sentences)) {
    await page.goto(`${language}/guide/`);
    await expect(section(page, heading)).toContainText(sentence);
    await expect(page.locator('body')).not.toContainText(/daneben|à côté|accanto/);
  }
});

test('the guide is one column of text, at most 42rem wide', async ({ page }) => {
  // Design of redesign-site, decision 27; a paragraph at most 40rem (spec site-style, "The
  // width of a page").
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('de/guide/');
  const widths = (selector: string) =>
    page
      .locator(selector)
      .evaluateAll((parts) => parts.map((part) => part.getBoundingClientRect().width));
  const sections = await widths('section');
  expect(sections).toHaveLength(7);
  expect(Math.max(...sections)).toBe(672);
  expect(Math.max(...(await widths('section p')))).toBeLessThanOrEqual(640);
  // One column: each section begins at the page's left edge.
  const lefts = await page
    .locator('h1, section')
    .evaluateAll((parts) => parts.map((part) => part.getBoundingClientRect().left));
  expect(new Set(lefts).size).toBe(1);
});

test('how a selection works: the rule in plain words', async ({ page }) => {
  await page.goto('de/guide/');
  const rule = section(page, 'Gemeinden auswählen');
  await expect(rule).toContainText(
    'Eine Gemeinde bleibt nur, wenn sie innerhalb aller Grenzen liegt.',
  );
  await expect(rule).toContainText(
    'Ein Kanton, in dem keine Gemeinde übrig ist, hat keine Standesstimme.',
  );
  await expect(rule).toContainText('dunkelgrau');
});

test('The sentence in the guide: the address holds the selection', async ({ page }) => {
  // Spec reading-guide, "Sharing a selection explained".
  await page.goto('de/guide/');
  await expect(section(page, 'Gemeinden auswählen').locator('p').last()).toHaveText(
    'Die Adresse der Seite hält Ihre Auswahl fest: Wer sie öffnet, sieht dieselbe Auswahl.',
  );
});

test('what a selection does not show: municipalities, not people, and no forecast', async ({
  page,
}) => {
  await page.goto('de/guide/');
  const not = section(page, 'Was die Auswahl nicht zeigt');
  await expect(not).toContainText(
    'Eine Gemeinde mit vielen über 65-Jährigen zählt mit allen ihren Stimmen, auch mit denen der Jüngeren.',
  );
  await expect(not).toContainText('Die Auswahl ist keine Prognose.');
});

test('the Swiss abroad explained: they count only where a municipality remains', async ({
  page,
}) => {
  // investigations/limits.md, 1.
  await page.goto('de/guide/');
  const abroad = section(page, 'Auslandschweizerinnen und Auslandschweizer');
  await expect(abroad).toContainText('11 oder 12 Kantone');
  await expect(abroad).toContainText('getrennt; das sind 1.0% bis 1.6% der gültigen Stimmen.');
  await expect(abroad).toContainText(
    'Sie zählen nur in einem Kanton, in dem noch eine Gemeinde übrig ist.',
  );
});

test('municipalities without a figure explained', async ({ page }) => {
  // investigations/limits.md, 2.
  await page.goto('de/guide/');
  const without = section(page, 'Gemeinden ohne eigenes Ergebnis oder ohne Angabe');
  await expect(without).toContainText(
    'Eine Gemeinde ohne Angabe fällt weg, sobald die Grenze dieses Merkmals enger gestellt ist.',
  );
  await expect(without).toContainText('Wenige Gemeinden haben kein eigenes Ergebnis');
  await expect(without).toContainText(
    'Sie sind auf der Karte schraffiert. Ob eine Auswahl sie behält oder streicht, ändert am ' +
      'Ergebnis nichts.',
  );
});

test('Jobs and farmland without a figure', async ({ page }) => {
  // investigations/more-characteristics.md, 6 and 7.
  await page.goto('de/guide/');
  await expect(section(page, 'Gemeinden ohne eigenes Ergebnis oder ohne Angabe')).toContainText(
    'Bei den Arbeitsplätzen eines Sektors fehlt die Angabe, wo das BFS die Zahl nicht ' +
      'veröffentlicht, und beim Bio-Anteil, wo es keine landwirtschaftliche Nutzfläche gibt.',
  );
});

test('the characteristics explained: the dates of their figures, the six logarithmic tracks', async ({
  page,
}) => {
  await page.goto('de/guide/');
  const characteristics = section(page, 'Die Merkmale');
  await expect(characteristics).toContainText('Volkszählung 2000');
  await expect(characteristics).toContainText(
    'Für eine Abstimmung gelten Bevölkerung, Arbeitsplätze, Rinder und Landwirtschaftsbetriebe ' +
      'aus dem letzten Jahr vor dem Abstimmungstag und die Parteistärken aus der letzten ' +
      'Nationalratswahl davor.',
  );
  await expect(characteristics).toContainText(
    'Eine Grenze vergleicht die Werte so, wie sie bei der Gemeinde angezeigt sind.',
  );
  await expect(characteristics).toContainText(
    'Die Grenzen von «Einwohner», «Einwohner je km²», «Arbeitsplätze je 100 Einwohner», ' +
      "«Fläche», «Rinder je Einwohner» und «Landwirtschaftsbetriebe je 1'000 Einwohner» wachsen " +
      'von Schritt zu Schritt um den gleichen Faktor',
  );
});

test('the reworded sentences in French and Italian', async ({ page }) => {
  // The sentences of change reword-site-texts; spec reading-guide quotes the German ones.
  const sentences = {
    fr: [
      [
        'Les caractéristiques',
        'Si les chiffres de la dernière année ne sont pas encore publiés, ce sont les plus ' +
          'récents qui comptent.',
      ],
      [
        'Communes sans résultat propre ou sans données',
        'Elles sont hachurées sur la carte. Que la sélection les garde ou les écarte ne change ' +
          'rien au résultat.',
      ],
      ["Suissesses et Suisses de l'étranger", 'soit 1.0% à 1.6% des voix valables.'],
    ],
    it: [
      [
        'Le caratteristiche',
        "Se le cifre dell'ultimo anno non sono ancora pubblicate, valgono le più recenti.",
      ],
      [
        'Comuni senza risultato proprio o senza dati',
        'Sono tratteggiati sulla carta. Che la selezione li tenga o li escluda non cambia il ' +
          'risultato.',
      ],
      ["Svizzere e Svizzeri all'estero", "cioè dall'1.0% all'1.6% dei voti validi."],
    ],
  } as const;
  for (const [language, expected] of Object.entries(sentences)) {
    await page.goto(`${language}/guide/`);
    for (const [heading, sentence] of expected) {
      await expect(section(page, heading)).toContainText(sentence);
    }
  }
});

test('the sources, with the dates of the data files of 2026-11-16', async ({ page }) => {
  await page.goto('de/guide/');
  const sources = section(page, 'Quellen');
  for (const name of [
    'Bundesamt für Statistik (BFS)',
    'Bundeskanzlei',
    'Stand 1. Januar 2026',
    'ThemaKart 2026',
    'STATPOP',
    'Nationalratswahlen',
    'Volkszählung 2000',
    'Landwirtschaftliche Strukturerhebung',
    'swissBOUNDARIES3D 2026',
  ]) {
    await expect(sources).toContainText(name);
  }
  const record = sources.getByRole('link', { name: 'data/sources.json' });
  await expect(record).toHaveAttribute('href', /\/data\/sources\.json$/);
  const response = await page.request.get((await record.getAttribute('href')) ?? '');
  expect(response.ok()).toBe(true);
});

test('What the jobs count', async ({ page }) => {
  // Spec reading-guide, "The characteristics explained"; design of add-more-characteristics, 7.
  await page.goto('de/guide/');
  const characteristics = section(page, 'Die Merkmale');
  await expect(characteristics).toContainText(
    'Arbeitsplätze sind die Beschäftigten der Betriebe in der Gemeinde, wo immer diese wohnen.',
  );
  await expect(characteristics).toContainText(
    'Sind die Zahlen des letzten Jahres noch nicht veröffentlicht, gelten die neuesten davor.',
  );
});

test('The six sources of the characteristics', async ({ page }) => {
  await page.goto('de/guide/');
  const sources = section(page, 'Quellen');
  for (const name of [
    'STATPOP',
    'STATENT',
    'Nationalratswahlen',
    'Volkszählung 2000',
    'Landwirtschaftliche Strukturerhebung',
    'swissBOUNDARIES3D 2026',
  ]) {
    await expect(sources).toContainText(name);
  }
});

// Spec reading-guide, "Every page links to the guide": from the head of every page (spec
// site-style, "The head of every page").
test('from the start page: "Lesehilfe" in its head, and no other link below its heading', async ({
  page,
}) => {
  await page.goto('de/');
  await expect(page.getByRole('link', { name: 'Lesehilfe und Quellen' })).toHaveCount(0);
  await pageHead(page).getByRole('link', { name: 'Lesehilfe' }).click();
  // A link has no final slash, and a click before the page's scripts run opens its address as
  // it is written: the page is the same without the slash (Q, 2026-11-17).
  await expect(page).toHaveURL(/\/de\/guide\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lesehilfe');
});

test('from a vote\'s page: "Lesehilfe" in its head', async ({ page }) => {
  await page.goto('de/votes/5960/');
  await pageHead(page).getByRole('link', { name: 'Lesehilfe' }).click();
  await expect(page).toHaveURL(/\/de\/guide\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lesehilfe');
});

test('the sentence at the limits, with its link to the guide', async ({ page }) => {
  await page.goto('de/votes/5960/');
  const limits = page.locator('.limits');
  await expect(limits.locator('p').first()).toHaveText(
    'Ein Gedankenexperiment: So wäre die Abstimmung ausgegangen, wenn nur die ausgewählten ' +
      'Gemeinden abgestimmt hätten. Es zeigt nicht, wie einzelne Menschen gestimmt haben, und ist ' +
      'keine Prognose. Lesehilfe und Quellen',
  );
  await limits.getByRole('link', { name: 'Lesehilfe und Quellen' }).click();
  await expect(page).toHaveURL(/\/de\/guide\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lesehilfe');
});

// Spec reading-guide, "The sources": the summaries are the site's own (spec vote-summaries).
test("the summaries of the votes named as the site's own, in three languages", async ({ page }) => {
  const expected = {
    de: [
      'Kurzbeschreibungen der Vorlagen',
      '«Erläuterungen des Bundesrates»',
      'kein amtlicher Text',
    ],
    fr: [
      'Descriptions des objets',
      '«Explications du Conseil fédéral»',
      'pas des textes officiels',
    ],
    it: [
      'Descrizioni degli oggetti',
      '«Spiegazioni del Consiglio federale»',
      'non sono testi ufficiali',
    ],
  };
  const headings = { de: 'Quellen', fr: 'Sources', it: 'Fonti' };
  for (const [language, parts] of Object.entries(expected)) {
    await page.goto(`${language}/guide/`);
    const sources = section(page, headings[language as keyof typeof headings]);
    for (const part of parts) await expect(sources).toContainText(part);
  }
});
