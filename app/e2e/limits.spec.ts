// The limits (spec limits) and what follows them: the selection's result (spec verdicts) and the
// map (spec result-map), against the built site. The figures are those of
// investigations/limits.md.
import { expect, test, type Page } from '@playwright/test';
import { pixelAt } from './contrast.ts';
import { MEASURE_FRAMES, fontsLoaded, measuredFrames } from './frames.ts';
import { pointIn } from './pointing.ts';
import {
  abroadSwitch,
  addButton,
  addLimit,
  barDrawn,
  barHeights,
  barsBetween,
  boxOf,
  cantonBar,
  cantonRow,
  cantonsBarOf,
  closeButton,
  countBarFilled,
  figuresOf,
  greyedOf,
  limitLabel,
  limitList,
  limitOf,
  markOf,
  markPlace,
  listHeadings,
  mapDrawn,
  offered,
  openVote,
  outcomeOf,
  ownResult,
  selectionHeading,
  selectionPlace,
  selectionResult,
  slider,
  verdictFiguresOf,
  verdictWordsOf,
  votersBarOf,
} from './parts.ts';

test('the section of a vote: right of the map, level with the result, without a limit', async ({
  page,
}) => {
  // Spec limits, "The section of a vote".
  await page.setViewportSize({ width: 1280, height: 800 });
  await openVote(page, 'de/votes/5960/');
  await mapDrawn(page);
  await expect(page.getByRole('heading', { name: 'Gemeinden auswählen' })).toBeVisible();
  const [limits, map, result] = await Promise.all(
    ['.limits', '.map svg', '.results'].map((part) => boxOf(page, part)),
  );
  expect(limits.x).toBeGreaterThanOrEqual(map.x + map.width);
  expect(Math.abs(limits.y - result.y)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('slider')).toHaveCount(0);
  await expect(abroadSwitch(page)).toBeChecked();
});

test('the section in a narrow window: below the map, above the panel, as wide as the result', async ({
  page,
}) => {
  // Spec limits, "The section in a narrow window" (investigations/redesign.md, 6).
  for (const width of [1023, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await openVote(page, 'de/votes/5960/');
    await mapDrawn(page);
    const [result, map, limits, panel] = await Promise.all(
      ['.results', '.map svg', '.limits', '.panel'].map((part) => boxOf(page, part)),
    );
    const at = `${String(width)} pixels`;
    expect(map.y, at).toBeGreaterThanOrEqual(result.y + result.height);
    expect(limits.y, at).toBeGreaterThanOrEqual(map.y + map.height);
    expect(panel.y, at).toBeGreaterThanOrEqual(limits.y + limits.height);
    expect(Math.abs(limits.width - result.width), at).toBeLessThanOrEqual(1);
    expect(Math.abs(limits.x - result.x), at).toBeLessThanOrEqual(1);
  }
});

test('no limits for a tie-break question', async ({ page }) => {
  await page.goto('de/votes/6823/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Gemeinden auswählen')).toHaveCount(0);
});

test('The headings of the list', async ({ page }) => {
  // Spec limits, "The headings of the list": the panel's headings, without their dates.
  await openVote(page, 'de/votes/5960/');
  expect(await listHeadings(page)).toEqual([
    ['Bevölkerung', 9],
    ['Nationalratswahl', 7],
    ['Hauptsprache', 4],
    ['Religion', 3],
    ['Ausbildung', 2],
    ['Wohnen', 2],
    ['Arbeit', 4],
    ['Fläche und Landwirtschaft', 4],
  ]);
  await page.goto('fr/votes/5960/');
  await expect(addButton(page, 'fr')).toBeVisible();
  expect((await listHeadings(page, 'fr')).map(([heading]) => heading)).toEqual([
    'Population',
    'Élection du Conseil national',
    'Langue principale',
    'Religion',
    'Formation',
    'Logement',
    'Travail',
    'Surface et agriculture',
  ]);
  await page.goto('it/votes/5960/');
  await expect(addButton(page, 'it')).toBeVisible();
  expect((await listHeadings(page, 'it')).map(([heading]) => heading)).toEqual([
    'Popolazione',
    'Elezione del Consiglio nazionale',
    'Lingua principale',
    'Religione',
    'Formazione',
    'Abitazione',
    'Lavoro',
    'Superficie e agricoltura',
  ]);
});

test('A heading without an entry left', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Hochschule oder höhere Berufsbildung');
  expect(await listHeadings(page)).toContainEqual(['Ausbildung', 1]);
  await addLimit(page, 'Obligatorische Schule oder keine Ausbildung');
  expect((await listHeadings(page)).map(([heading]) => heading)).toEqual([
    'Bevölkerung',
    'Nationalratswahl',
    'Hauptsprache',
    'Religion',
    'Wohnen',
    'Arbeit',
    'Fläche und Landwirtschaft',
  ]);
  await page
    .getByRole('button', { name: 'Entfernen: Hochschule oder höhere Berufsbildung' })
    .click();
  expect(await listHeadings(page)).toContainEqual(['Ausbildung', 1]);
});

test('New characteristics with their tracks', async ({ page }) => {
  // investigations/more-characteristics.md, 12: the least and the most of 2015.
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Im Ausland geboren');
  await addLimit(page, 'Arbeitsplätze je 100 Einwohner');
  await expect(page.locator('.limit .label')).toHaveText([
    'Im Ausland geboren (Ende 2015): von 0.00% bis 66.13%',
    'Arbeitsplätze je 100 Einwohner (Ende 2015): von 5.2 bis 445.5',
  ]);
});

test('adding a limit: its label, and the list offers the others', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  expect(await offered(page)).toHaveLength(35);
  await addLimit(page, 'Ausländeranteil');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 61.10%',
  ]);
  const others = await offered(page);
  expect(others).toHaveLength(34);
  expect(others).not.toContain('Ausländeranteil');
});

test('removing a limit: the list offers all 35 again', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await page.getByRole('button', { name: 'Entfernen: Ausländeranteil' }).click();
  await expect(page.locator('.limit')).toHaveCount(0);
  expect(await offered(page)).toHaveLength(35);
});

test('the elderly are the elderly: the limit of 65 and over has their range', async ({ page }) => {
  // Spec limits, "One definition for a limit"; investigations/limits.md, 5.
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, '65 Jahre und älter');
  await expect(page.locator('.limit .label')).toHaveText([
    '65 Jahre und älter (Ende 2015): von 5.81% bis 36.16%',
  ]);
});

test('a linear track: steps 327 and 328 of the foreigners', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await expect(limitLabel(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await slider(page, 'Obere', 'Ausländeranteil').fill('328');
  await expect(limitLabel(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 20.04%',
  );
});

test('a logarithmic track: the inhabitants from step 500', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Einwohner');
  await slider(page, 'Untere', 'Einwohner').fill('500');
  await expect(limitLabel(page, 'Einwohner')).toHaveText(
    "Einwohner (Ende 2015): von 3'508 bis 396'955",
  );
});

test('a logarithmic track from zero: the cattle at steps 1 and 500', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Rinder je Einwohner');
  await slider(page, 'Obere', 'Rinder je Einwohner').fill('1');
  await expect(limitLabel(page, 'Rinder je Einwohner')).toHaveText(
    'Rinder je Einwohner (2015): von 0.000 bis 0.001',
  );
  await slider(page, 'Obere', 'Rinder je Einwohner').fill('500');
  await expect(limitLabel(page, 'Rinder je Einwohner')).toHaveText(
    'Rinder je Einwohner (2015): von 0.000 bis 0.090',
  );
});

test('a step by key: the left arrow moves the upper bound one step', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(limitLabel(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 61.04%',
  );
  await expect(slider(page, 'Obere', 'Ausländeranteil')).toHaveAttribute(
    'aria-valuetext',
    '61.04%',
  );
});

test('the bounds do not cross: the lower one stops at the upper one', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  // The lower thumb dragged by pointer from the start of the track to its end.
  const lower = slider(page, 'Untere', 'Ausländeranteil');
  const box = await lower.boundingBox();
  if (box === null) throw new Error('the slider has no box');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 10, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 10, y, { steps: 10 });
  await page.mouse.up();
  await expect(lower).toHaveValue('327');
  await expect(limitLabel(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 19.98% bis 19.98%',
  );
});

test('the labels of a vote: the date of each characteristic, its bounds as the panel writes them', async ({
  page,
}) => {
  await openVote(page, 'de/votes/6400/');
  for (const name of ['SVP', 'Italienisch', 'Fläche']) await addLimit(page, name);
  await expect(page.locator('.limit .label')).toHaveText([
    'SVP (Nationalratswahl 2019): von 0.00% bis 84.11%',
    'Italienisch (Volkszählung 2000): von 0.00% bis 96.84%',
    'Fläche (2026): von 0.32 km² bis 438.61 km²',
  ]);
});

test('without the Swiss abroad: the selection fails beside the real result', async ({ page }) => {
  // investigations/limits.md, 1 and 5; BBl 2015 6313.
  await openVote(page, 'de/votes/5950/');
  await abroadSwitch(page).uncheck();
  const selection = selectionResult(page);
  await expect(selection.getByRole('heading', { name: 'Mit Ihrer Auswahl' })).toBeVisible();
  await expect(figuresOf(selection)).toHaveText(["1'107'734", "1'113'998"]);
  await expect(verdictWordsOf(selection)).toHaveText(['Nein', 'nicht nötig']);
  await expect(verdictFiguresOf(selection)).toHaveText(['49.86%', '6½ : 16½']);
  await expect(greyedOf(selection)).toHaveText('6½ : 16½');
  await expect(outcomeOf(selection)).toHaveText('Abgelehnt');
  const real = ownResult(page);
  await expect(verdictFiguresOf(real).first()).toHaveText('50.08%');
  await expect(outcomeOf(real)).toHaveText('Angenommen');
});

const municipality = (page: Page, number: number) =>
  page.locator(`.municipalities [data-number="${String(number)}"]`);

test('a narrowed limit sets aside a municipality without a figure: Rüti bei Lyssach', async ({
  page,
}) => {
  // investigations/limits.md, 2 and 5: 422 has a result and no party figure in 2019.
  await openVote(page, 'de/votes/6400/');
  await addLimit(page, 'SVP');
  await expect(municipality(page, 422)).not.toHaveAttribute('fill', '#2c2c2c');
  await slider(page, 'Obere', 'SVP').fill('999');
  await expect(limitLabel(page, 'SVP')).toHaveText(
    'SVP (Nationalratswahl 2019): von 0.00% bis 84.03%',
  );
  await expect(municipality(page, 422)).toHaveAttribute('fill', '#2c2c2c');
  await expect(municipality(page, 932)).toHaveAttribute('fill', '#2c2c2c'); // Horrenbach-Buchen
  await expect(page.locator('.municipalities [fill="#2c2c2c"]')).toHaveCount(2);
  await slider(page, 'Obere', 'SVP').fill('1000');
  await expect(municipality(page, 422)).not.toHaveAttribute('fill', '#2c2c2c');
});

test('several limits at once: German and French each from their last step leave nothing', async ({
  page,
}) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Deutsch');
  await addLimit(page, 'Französisch');
  await slider(page, 'Untere', 'Deutsch').fill('1000');
  await expect(page.locator('.municipalities [fill="#2c2c2c"]')).not.toHaveCount(0);
  await slider(page, 'Untere', 'Französisch').fill('1000');
  await expect(limitLabel(page, 'Französisch')).toHaveText(
    'Französisch (Volkszählung 2000): von 99.78% bis 99.78%',
  );
  // Every municipality with a result is set aside; the seven without one stay hatched.
  await expect(page.locator('.municipalities [fill="#2c2c2c"]')).toHaveCount(2103);
  await expect(page.locator('.municipalities [fill="url(#hatch)"]')).toHaveCount(7);
});

/** Add the limit "Ausländeranteil" and move its upper bound to step 327, 19.98%. */
async function foreignersUpTo1998(page: Page): Promise<void> {
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
}

test('a canton with nothing left loses its Swiss abroad: BS', async ({ page }) => {
  // investigations/limits.md, 5: 18 : 4½ in 25 cantons, the Swiss abroad of 11.
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  const selection = selectionResult(page);
  await expect(verdictFiguresOf(selection).nth(1)).toHaveText('18 : 4½');
  await expect(page.getByRole('row', { name: /^BS / })).toContainText('keine Gemeinde übrig');
});

/**
 * Press the thumb of a slider at a step, and drag it, without letting go, until the slider shows
 * the step `to`: a pixel of the track holds about two steps, so the pointer is moved by the
 * difference until it lands there.
 */
async function dragTo(page: Page, input: ReturnType<typeof slider>, from: number, to: number) {
  // The pointer reaches only what is in the window: below its first screen the press would miss.
  await input.scrollIntoViewIfNeeded();
  const box = await input.boundingBox();
  if (box === null) throw new Error('the slider has no box');
  // The thumb's centre runs from half a thumb inside one end of the input to the other.
  const half = 10;
  const at = (step: number) => box.x + half + ((box.width - 2 * half) * step) / 1000;
  const y = box.y + box.height / 2;
  let x = at(from);
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let tries = 0; tries < 8; tries += 1) {
    x += at(to) - at(Number(await input.inputValue()));
    await page.mouse.move(x, y, { steps: 4 });
    if (Number(await input.inputValue()) === to) return;
  }
  throw new Error(`the slider did not reach step ${String(to)}`);
}

test('recalculated while dragging, before the bound is let go', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  const upper = slider(page, 'Obere', 'Ausländeranteil');
  await dragTo(page, upper, 1000, 327);
  // The pointer is still pressed.
  await expect(verdictFiguresOf(selectionResult(page)).first()).toHaveText('52.47%');
  await expect(municipality(page, 261)).toHaveAttribute('fill', '#2c2c2c'); // Zürich, 32.03%
  await page.mouse.up();
});

test('the entries a selection needs are on the page: no file of entries is loaded', async ({
  page,
}) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await openVote(page, 'de/votes/5950/');
  await abroadSwitch(page).uncheck();
  await expect(outcomeOf(selectionResult(page))).toHaveText('Abgelehnt');
  await page.waitForLoadState('networkidle');
  expect(requested.filter((url) => url.includes('/data/votes/'))).toEqual([]);
});

test('the cantons of a selection: the table follows it, BS has nothing left', async ({ page }) => {
  // investigations/limits.md, 5.
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  const table = page.locator('table');
  await expect(table.locator('caption')).toHaveText('Mit Ihrer Auswahl');
  await expect(table.locator('tbody tr')).toHaveCount(26);
  await expect(table.getByRole('row', { name: /^BS / }).locator('th, td')).toHaveText([
    'BS',
    '–',
    'keine Gemeinde übrig',
    '–',
  ]);
  const rows = await table
    .locator('tbody tr')
    .evaluateAll((trs) => trs.map((tr) => [...tr.children].map((cell) => cell.textContent.trim())));
  const inFavour = rows
    .filter((cells) => cells[3] === 'Ja')
    .reduce((sum, cells) => sum + (cells[2] === '½' ? 0.5 : Number(cells[2])), 0);
  expect(inFavour).toBe(18);
});

test('a limit not moved: no selection, the official result', async ({ page }) => {
  // investigations/limits.md, 5; BBl 2015 6313.
  await openVote(page, 'de/votes/5950/');
  await addLimit(page, 'Einwohner');
  await expect(page.locator('.limit')).toHaveCount(1);
  await expect(page.getByText('Mit Ihrer Auswahl')).toHaveCount(0);
  const figures = await figuresOf(ownResult(page)).allTextContents();
  expect(figures.slice(0, 2)).toEqual(["1'128'522", "1'124'873"]);
  await expect(verdictFiguresOf(ownResult(page)).first()).toHaveText('50.08%');
  await expect(outcomeOf(ownResult(page))).toHaveText('Angenommen');
  await expect(page.locator('.municipalities [fill="#2c2c2c"]')).toHaveCount(0);
});

test('a selection that turns the verdict: foreigners up to 19.98% in 2016', async ({ page }) => {
  // investigations/limits.md, 5.
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  const selection = selectionResult(page);
  await expect(figuresOf(selection)).toHaveText(["733'402", "664'373"]);
  await expect(verdictWordsOf(selection)).toHaveText(['Ja', 'Ja']);
  await expect(verdictFiguresOf(selection)).toHaveText(['52.47%', '18 : 4½']);
  await expect(outcomeOf(selection)).toHaveText('Angenommen');
  const real = ownResult(page);
  await expect(verdictFiguresOf(real).first()).toHaveText('49.16%');
  await expect(outcomeOf(real)).toHaveText('Abgelehnt');
});

test('a selection on a logarithmic track: inhabitants from 3,508 in 2016', async ({ page }) => {
  // investigations/limits.md, 5.
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Einwohner');
  await slider(page, 'Untere', 'Einwohner').fill('500');
  const selection = selectionResult(page);
  await expect(figuresOf(selection)).toHaveText(["1'137'986", "1'266'006"]);
  await expect(verdictWordsOf(selection)).toHaveText(['Nein', 'Ja']);
  await expect(verdictFiguresOf(selection)).toHaveText(['47.34%', '12½ : 10½']);
  await expect(outcomeOf(selection)).toHaveText('Abgelehnt');
});

test('nothing remains: no votes, no yes share, no cantonal vote, the vote fails', async ({
  page,
}) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Deutsch');
  await addLimit(page, 'Französisch');
  await slider(page, 'Untere', 'Deutsch').fill('1000');
  await slider(page, 'Untere', 'Französisch').fill('1000');
  const selection = selectionResult(page);
  await expect(figuresOf(selection)).toHaveText(['0', '0']);
  await expect(verdictWordsOf(selection)).toHaveText(['Nein', 'Nein']);
  await expect(verdictFiguresOf(selection)).toHaveText(['–', '0 : 0']);
  await expect(outcomeOf(selection)).toHaveText('Abgelehnt');
});

test('the legend of a selection ends with the dark grey of the set-aside', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await expect(page.locator('.legend li')).toHaveCount(10);
  await foreignersUpTo1998(page);
  const entries = page.locator('.legend li');
  await expect(entries).toHaveCount(11);
  await expect(entries.nth(10)).toHaveText('Nicht in der Auswahl');
  await expect(entries.nth(10).locator('.swatch')).toHaveCSS(
    'background-color',
    'rgb(44, 44, 44)', // #2c2c2c
  );
});

test('set aside and kept: Zürich dark grey, Aeugst am Albis its colour, the hatching kept', async ({
  page,
}) => {
  // investigations/limits.md, 3: Zürich 32.03%, Aeugst am Albis 12.77% foreigners.
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  await expect(municipality(page, 261)).toHaveAttribute('fill', '#2c2c2c');
  await expect(municipality(page, 1)).toHaveAttribute('fill', '#fbbea3'); // no, class 1
  await expect(page.locator('.municipalities [fill="url(#hatch)"]')).toHaveCount(7);
});

test('without a result and without a figure: Meienried stays hatched', async ({ page }) => {
  // investigations/limits.md, 2: Meienried has neither a result nor a party figure in 2021.
  await openVote(page, 'de/votes/6400/');
  await addLimit(page, 'SVP');
  await slider(page, 'Obere', 'SVP').fill('999');
  await expect(municipality(page, 389)).toHaveAttribute('fill', 'url(#hatch)');
  await expect(municipality(page, 422)).toHaveAttribute('fill', '#2c2c2c');
});

test('the details of a set-aside municipality: its own figures, and that it is not selected', async ({
  page,
}) => {
  // investigations/map-data.md: Zürich in 2016.
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  const zurich = await pointIn(page, '.municipalities [data-number="261"]');
  await page.mouse.move(zurich.x, zurich.y);
  const details = page.locator('.details');
  await expect(details.locator('.name')).toHaveText('Zürich (ZH)');
  await expect(details.locator('li')).toHaveText([
    'Ja-Anteil: 31.85%',
    "Ja-Stimmen: 46'565",
    "Nein-Stimmen: 99'614",
    'Nicht in der Auswahl.',
  ]);
});

const count = (page: Page) => page.locator('.limits .count');

test('the number of municipalities that remain: all of them without a limit', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await expect(count(page)).toHaveText(
    "In der Auswahl: 2'103 von 2'103 Gemeinden mit eigenem Ergebnis.",
  );
  // Its bar is full.
  const bar = await countBarFilled(page);
  expect(bar.width).toBeGreaterThan(100);
  expect(Math.abs(bar.filled - bar.width)).toBeLessThanOrEqual(1);
});

test('the number of municipalities that remain under a limit', async ({ page }) => {
  // investigations/limits.md, 5.
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  await expect(count(page)).toHaveText(
    "In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis.",
  );
  // Its bar is filled to 1,455 of 2,103, 69.2% of its width.
  const bar = await countBarFilled(page);
  expect(Math.abs(bar.filled - bar.width * 0.692)).toBeLessThanOrEqual(1);
});

test('the number of municipalities that remain: none', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Deutsch');
  await addLimit(page, 'Französisch');
  await slider(page, 'Untere', 'Deutsch').fill('1000');
  await slider(page, 'Untere', 'Französisch').fill('1000');
  await expect(count(page)).toHaveText('Keine Gemeinde mit eigenem Ergebnis ist übrig.');
  // Its bar is empty.
  const bar = await countBarFilled(page);
  expect(bar.width).toBeGreaterThan(100);
  expect(bar.filled).toBe(0);
});

// Where the municipalities lie on a track (spec limits; design of redesign-site, decision 21);
// the counts are those of investigations/redesign.md, "Output" of hist.mjs.
test('the bars above a track: 50, the ninth the tallest, all in the colour of the text', async ({
  page,
}) => {
  // Spec limits, "The foreigners of 2015": 140 municipalities in the ninth bar, 10 in the first.
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  const limit = limitOf(page, 'Ausländeranteil');
  const heights = await barHeights(limit);
  expect(heights).toHaveLength(50);
  expect(heights[8]).toBe(100);
  expect(heights.filter((height) => height === 100)).toHaveLength(1);
  expect(heights[0]).toBeCloseTo((10 / 140) * 100, 1);
  // Above the track, as wide as the way of a thumb's middle.
  const [bars, track] = await Promise.all(
    ['.hist', '.track'].map((part) => limit.locator(part).boundingBox()),
  );
  if (bars === null || track === null) throw new Error('the bars or the track are not shown');
  expect(bars.y + bars.height).toBeLessThanOrEqual(track.y + 1);
  expect(bars.height).toBeGreaterThanOrEqual(30);
  // With both bounds at the ends, every bar is in the text's colour.
  expect(await barsBetween(limit)).toEqual({ from: 0, to: 100 });
  await expect(limit.locator('.hist .in path')).toHaveCSS('fill', 'rgb(28, 28, 28)');
  await expect(limit.locator('.hist .out path')).toHaveCSS('fill', 'rgb(140, 140, 140)');
});

test('the bars between the bounds are in the colour of the text, the others grey', async ({
  page,
}) => {
  // Spec limits, "Between the bounds": step 327 of 1,000.
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  const limit = limitOf(page, 'Ausländeranteil');
  const between = await barsBetween(limit);
  expect(between.from).toBe(0);
  expect(between.to).toBeCloseTo(32.7, 5);
  // What the screen draws at the foot of the 16th bar, of steps 300 to 319, and of the 18th.
  const bars = await limit.locator('.hist').boundingBox();
  if (bars === null) throw new Error('the bars are not shown');
  const foot = bars.y + bars.height - 2;
  const middleOf = (bar: number) => bars.x + (bars.width * (bar - 0.5)) / 50;
  expect(await pixelAt(page, middleOf(16), foot)).toEqual([28, 28, 28]);
  expect(await pixelAt(page, middleOf(18), foot)).toEqual([140, 140, 140]);
  // The lower bound moves the other edge: step 100.
  await slider(page, 'Untere', 'Ausländeranteil').fill('100');
  expect((await barsBetween(limit)).from).toBeCloseTo(10, 5);
});

test('the bars of a logarithmic track: the 21st is the tallest', async ({ page }) => {
  // Spec limits, "A logarithmic track": 146 municipalities at steps 400 to 419.
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Einwohner');
  const heights = await barHeights(limitOf(page, 'Einwohner'));
  expect(heights).toHaveLength(50);
  expect(heights.indexOf(100)).toBe(20);
});

// The municipality last clicked on a track (spec limits; design of redesign-site, decision 22);
// the steps are those of investigations/redesign.md, "Output" of hist.mjs.
async function clickOn(page: Page, number: number): Promise<void> {
  const point = await pointIn(page, `.municipalities [data-number="${String(number)}"]`);
  await page.mouse.click(point.x, point.y);
}

test('the municipality clicked is marked under each track: Köniz on two', async ({ page }) => {
  // Spec limits, "Köniz on two tracks": 18.02% at step 295, 40,214 inhabitants at step 758.
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await addLimit(page, 'Einwohner');
  await clickOn(page, 355);
  for (const [name, text, step] of [
    ['Ausländeranteil', 'Köniz (BE): 18.02%', 295],
    ['Einwohner', "Köniz (BE): 40'214", 758],
  ] as const) {
    const limit = limitOf(page, name);
    await expect(markOf(limit)).toHaveText(text);
    const place = await markPlace(limit);
    expect(Math.abs(place.at - (place.width * step) / 1000), name).toBeLessThanOrEqual(1);
    // Below the track.
    const [track, mark] = await Promise.all(
      ['.track', '.here'].map((part) => limit.locator(part).boundingBox()),
    );
    if (track === null || mark === null) throw new Error('the track or the mark is not shown');
    expect(mark.y, name).toBeGreaterThanOrEqual(track.y + track.height - 1);
  }
});

test('before a click a limit shows no mark', async ({ page }) => {
  // Spec limits, "Before a click".
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await expect(page.locator('.limit')).toHaveCount(1);
  await expect(markOf(limitOf(page, 'Ausländeranteil'))).toHaveCount(0);
});

test('the mark follows the municipality clicked: Zürich at the end of the track, then Bern', async ({
  page,
}) => {
  // Spec limits, "Another municipality": Zürich has the most inhabitants.
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Einwohner');
  const limit = limitOf(page, 'Einwohner');
  await clickOn(page, 261);
  await expect(markOf(limit)).toHaveText("Zürich (ZH): 396'955");
  const place = await markPlace(limit);
  expect(Math.abs(place.at - place.width)).toBeLessThanOrEqual(1);
  // Its words end where the track ends: they do not reach past the section.
  const [words, section] = await Promise.all(
    [limit.locator('.here .at'), page.locator('.limits')].map((part) => part.boundingBox()),
  );
  if (words === null || section === null) throw new Error('the mark is not shown');
  expect(words.x + words.width).toBeLessThanOrEqual(section.x + section.width + 1);
  await clickOn(page, 351);
  await expect(markOf(limit)).toHaveText("Bern (BE): 131'554");
});

test('a municipality without a figure has no mark: Meienried and the SVP', async ({ page }) => {
  // Spec limits, "A municipality without a figure": Meienried has no election result.
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'SVP');
  await addLimit(page, 'Einwohner');
  await clickOn(page, 389);
  await expect(markOf(limitOf(page, 'Einwohner'))).toContainText('Meienried (BE): ');
  await expect(markOf(limitOf(page, 'SVP'))).toHaveCount(0);
});

test("a limit's label in three parts: the name, the date, and the bounds on a line of their own", async ({
  page,
}) => {
  // Design of redesign-site, decision 20: the same text as before, written in three parts.
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  const label = limitLabel(page, 'Ausländeranteil');
  await expect(label).toHaveText('Ausländeranteil (Ende 2015): von 0.00% bis 19.98%');
  await expect(label.locator('.name')).toHaveText('Ausländeranteil');
  await expect(label.locator('.date')).toHaveText('(Ende 2015)');
  await expect(label.locator('.bounds')).toHaveText('von 0.00% bis 19.98%');
  await expect(label.locator('.name')).toHaveCSS('font-weight', '700');
  const [name, bounds] = await Promise.all(
    ['.name', '.bounds'].map((part) => label.locator(part).boundingBox()),
  );
  expect(bounds?.y).toBeGreaterThanOrEqual((name?.y ?? 0) + (name?.height ?? 0) - 2);
});

test('back to the real result: no limit, the switch on, no selection, the legend of ten', async ({
  page,
}) => {
  await openVote(page, 'de/votes/5960/');
  const back = page.getByRole('button', { name: 'Zurück zum echten Ergebnis' });
  await expect(back).toHaveCount(0);
  await foreignersUpTo1998(page);
  await addLimit(page, 'Einwohner');
  await slider(page, 'Untere', 'Einwohner').fill('500');
  await abroadSwitch(page).uncheck();
  await expect(page.locator('.legend li')).toHaveCount(11);
  await back.click();
  await expect(page.locator('.limit')).toHaveCount(0);
  await expect(abroadSwitch(page)).toBeChecked();
  await expect(page.getByText('Mit Ihrer Auswahl')).toHaveCount(0);
  await expect(page.locator('.municipalities [fill="#2c2c2c"]')).toHaveCount(0);
  await expect(page.locator('.legend li')).toHaveCount(10);
  await expect(back).toHaveCount(0);
});

test("the cantons' bars under a selection: a mark at each canton's real share, none for BS", async ({
  page,
}) => {
  // Spec verdicts, "The cantons' bars under a selection": ZH's real share is 43.46%.
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  await expect(page.locator('.canton-results caption')).toHaveText('Mit Ihrer Auswahl');
  const zurich = await cantonBar(page, 'ZH');
  expect(zurich.real).not.toBeNull();
  expect(Math.abs((zurich.real ?? 0) - zurich.width * 0.4346)).toBeLessThanOrEqual(1);
  // 25 rows with a yes share, each with its bar and its mark; BS, with nothing left, has neither.
  await expect(page.locator('.canton-results .canton-bar')).toHaveCount(25);
  await expect(page.locator('.canton-results .canton-bar .real')).toHaveCount(25);
  await expect(cantonRow(page, 'BS').locator('.canton-bar')).toHaveCount(0);
  await expect(
    page
      .locator('.canton-results')
      .getByText(
        'Jeder Balken reicht von 50% bis zum Ja-Anteil des Kantons; der Strich zeigt sein echtes ' +
          'Ergebnis.',
        { exact: true },
      ),
  ).toBeVisible();
});

test('back to the real cantons: the table of the vote again', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  await expect(page.locator('table caption')).toHaveText('Mit Ihrer Auswahl');
  await page.getByRole('button', { name: 'Zurück zum echten Ergebnis' }).click();
  await expect(page.locator('table caption')).toHaveCount(0);
  const bs = page.locator('table').getByRole('row', { name: /^BS / }).locator('th, td');
  await expect(bs.nth(1)).toHaveText(/^\d+\.\d\d%$/);
  await expect(bs.nth(2)).toHaveText('½');
  await expect(bs.nth(3)).toHaveText(/^(Ja|Nein)$/);
});

test('limits belong to the page: another vote starts without them', async ({ page }) => {
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  await abroadSwitch(page).uncheck();
  await page.getByRole('link', { name: 'Alle Abstimmungen' }).click();
  await page.locator('a[href$="/votes/5670"], a[href$="/votes/5670/"]').first().click();
  await expect(addButton(page)).toBeVisible();
  await expect(page).toHaveURL(/\/de\/votes\/5670\/?$/);
  await expect(page.locator('.limit')).toHaveCount(0);
  await expect(abroadSwitch(page)).toBeChecked();
  await expect(page.getByText('Mit Ihrer Auswahl')).toHaveCount(0);
});

test('limits belong to the page: a link with a selection', async ({ page }) => {
  // Spec share-link: the page starts with the selection its address holds.
  await page.goto('de/votes/5960/#foreigners=-19.98&abroad=no');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  ]);
  await expect(abroadSwitch(page)).not.toBeChecked();
});

test('characteristics that cannot be loaded: no limits, and the rest of the page', async ({
  page,
}) => {
  await page.route('**/data/characteristics.json', (route) => route.abort());
  await page.goto('de/votes/5960/');
  await expect(
    page.locator('.limits').getByText('Ohne die Merkmale lassen sich keine Gemeinden auswählen.'),
  ).toBeVisible();
  await expect(addButton(page)).toHaveCount(0);
  await expect(figuresOf(ownResult(page)).first()).toHaveText("1'609'152");
  await expect(verdictWordsOf(ownResult(page))).toHaveText(['Nein', 'Ja']);
  await expect(page.locator('.municipalities path')).toHaveCount(2110);
  await expect(page.locator('table tbody tr')).toHaveCount(26);
});

test("the selection's place: a sentence until a selection applies, then its result", async ({
  page,
}) => {
  // Spec verdicts, "The place of the selection's result": before a limit, and with a selection.
  await openVote(page, 'de/votes/5960/');
  const place = selectionPlace(page);
  await expect(place).toHaveText(
    'Setzen Sie eine Grenze auf ein Merkmal: Hier steht dann das Ergebnis der Gemeinden, die ' +
      'übrig bleiben.',
  );
  await expect(page.getByText('Mit Ihrer Auswahl')).toHaveCount(0);
  const bottomOfOwn = async () => {
    const own = await ownResult(page).boundingBox();
    if (own === null) throw new Error("the vote's result is not shown");
    return own.y + own.height;
  };
  expect((await place.boundingBox())?.y).toBeGreaterThanOrEqual(await bottomOfOwn());
  await foreignersUpTo1998(page);
  await expect(selectionHeading(page)).toHaveText('Mit Ihrer Auswahl');
  await expect(place).toHaveCount(0);
  expect((await selectionResult(page).boundingBox())?.y).toBeGreaterThanOrEqual(
    await bottomOfOwn(),
  );
});

test("the selection's place says nothing when the characteristics cannot be loaded", async ({
  page,
}) => {
  // Spec verdicts, "The characteristics' file is missing".
  await page.route('**/data/characteristics.json', (route) => route.abort());
  await page.goto('de/votes/5960/');
  await expect(
    page.locator('.limits').getByText('Ohne die Merkmale lassen sich keine Gemeinden auswählen.'),
  ).toBeVisible();
  await expect(outcomeOf(ownResult(page))).toHaveText('Abgelehnt');
  await expect(selectionPlace(page)).toHaveCount(0);
  await expect(page.getByText('Mit Ihrer Auswahl')).toHaveCount(0);
});

test('the bars of a selection: no segment for a canton with nothing left, bar below bar', async ({
  page,
}) => {
  // Spec verdicts, "A canton with nothing left" and "Bar below bar": 18 of 22½ in 25 cantons
  // (investigations/limits.md, 5).
  await page.setViewportSize({ width: 1280, height: 800 });
  await openVote(page, 'de/votes/5960/');
  await foreignersUpTo1998(page);
  const selection = selectionResult(page);
  await expect(outcomeOf(selection)).toHaveText('Angenommen');
  const cantons = await barDrawn(cantonsBarOf(selection));
  expect(cantons.parts).toHaveLength(25);
  expect(cantons.parts.map((part) => part.canton)).not.toContain('BS');
  const inFavour = cantons.parts
    .filter((part) => part.side === 'yes')
    .reduce((sum, part) => sum + part.width, 0);
  expect(Math.abs(inFavour - (cantons.width * 18) / 22.5)).toBeLessThanOrEqual(1);
  const voters = await barDrawn(votersBarOf(selection));
  expect(Math.abs((voters.parts[0]?.width ?? 0) - voters.width * 0.5247)).toBeLessThanOrEqual(1);
  // Each bar of the selection below the vote's, with its left edge and its width.
  for (const barOf of [votersBarOf, cantonsBarOf]) {
    const real = await barDrawn(barOf(ownResult(page)));
    const selected = await barDrawn(barOf(selection));
    expect(Math.abs(selected.left - real.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(selected.width - real.width)).toBeLessThanOrEqual(1);
    expect(selected.top).toBeGreaterThan(real.top + real.height);
  }
});

test('the bars of a selection with nothing left are empty, with their marks at half', async ({
  page,
}) => {
  // Spec verdicts, "Nothing remains" of "The bars of a result".
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Deutsch');
  await addLimit(page, 'Französisch');
  await slider(page, 'Untere', 'Deutsch').fill('1000');
  await slider(page, 'Untere', 'Französisch').fill('1000');
  const selection = selectionResult(page);
  await expect(verdictFiguresOf(selection)).toHaveText(['–', '0 : 0']);
  for (const bar of [votersBarOf(selection), cantonsBarOf(selection)]) {
    const drawn = await barDrawn(bar);
    expect(drawn.parts).toEqual([]);
    expect(drawn.width).toBeGreaterThan(100);
    expect(Math.abs((drawn.mark ?? 0) - drawn.width / 2)).toBeLessThanOrEqual(1);
  }
});

test('the limits follow the definitions: their names in order, six logarithmic tracks', async ({
  page,
}) => {
  // Spec characteristics, "One definition per characteristic"; investigations/limits.md, 4.
  await openVote(page, 'de/votes/5960/');
  expect(await offered(page)).toEqual([
    'Einwohner',
    'Ausländeranteil',
    'Im Ausland geboren',
    '0–17 Jahre',
    '18–34 Jahre',
    '35–49 Jahre',
    '50–64 Jahre',
    '65 Jahre und älter',
    'Einwohner je km²',
    'FDP',
    'Die Mitte (bis 2020 CVP und BDP)',
    'SP',
    'SVP',
    'GLP',
    'Grüne',
    'Übrige Parteien',
    'Deutsch',
    'Französisch',
    'Italienisch',
    'Rätoromanisch',
    'Evangelisch-reformiert',
    'Römisch-katholisch',
    'Keine Religionszugehörigkeit',
    'Hochschule oder höhere Berufsbildung',
    'Obligatorische Schule oder keine Ausbildung',
    'Vom Eigentümer bewohnte Wohnungen',
    'Einfamilienhäuser',
    'Arbeitsplätze je 100 Einwohner',
    'Arbeitsplätze im Primärsektor',
    'Arbeitsplätze im Sekundärsektor',
    'Arbeitsplätze im Tertiärsektor',
    'Fläche',
    'Rinder je Einwohner',
    "Landwirtschaftsbetriebe je 1'000 Einwohner",
    'Bio-Anteil der landwirtschaftlichen Nutzfläche',
  ]);
  // At step 500 a logarithmic track is far below its linear middle: the six of them, and two
  // linear ones (investigations/more-characteristics.md, 12, for the two new).
  for (const [name, middle] of [
    ['Einwohner', "3'508"],
    ['Einwohner je km²', '104'],
    ['Arbeitsplätze je 100 Einwohner', '48.1'],
    ['Fläche', '11.85 km²'],
    ['Rinder je Einwohner', '0.090'],
    ["Landwirtschaftsbetriebe je 1'000 Einwohner", '4.6'],
    ['Ausländeranteil', '30.55%'],
    ['Im Ausland geboren', '33.07%'],
  ] as const) {
    await addLimit(page, name);
    await slider(page, 'Untere', name).fill('500');
    await expect(slider(page, 'Untere', name)).toHaveAttribute('aria-valuetext', middle);
  }
});

test('the keyboard only chooses: Enter opens the list, Tab moves through it, Enter adds', async ({
  page,
}) => {
  // Spec limits, "The keyboard only chooses".
  await openVote(page, 'de/votes/5960/');
  await addButton(page).focus();
  await page.keyboard.press('Enter');
  await expect(limitList(page)).toBeVisible();
  const entry = limitList(page).getByRole('button', { name: 'Ausländeranteil', exact: true });
  const focused = () => entry.evaluate((button) => button === document.activeElement);
  for (let presses = 0; presses < 40 && !(await focused()); presses += 1) {
    await page.keyboard.press('Tab');
  }
  await expect(entry).toBeFocused();
  // Moving through the list has added nothing.
  await expect(limitList(page)).toBeVisible();
  await expect(page.locator('.limit')).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect(limitList(page)).toBeHidden();
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 61.10%',
  ]);
  await expect(addButton(page)).toBeFocused();
});

test('closing the list without choosing: the Escape key and "Schliessen" add nothing', async ({
  page,
}) => {
  // Spec limits, "Closing the list without choosing".
  await openVote(page, 'de/votes/5960/');
  const ways = [() => page.keyboard.press('Escape'), () => closeButton(page).click()];
  for (const close of ways) {
    await addButton(page).click();
    await expect(limitList(page)).toBeVisible();
    await expect(
      limitList(page).getByRole('heading', { name: 'Merkmal hinzufügen' }),
    ).toBeVisible();
    await close();
    await expect(limitList(page)).toBeHidden();
    await expect(page.locator('.limit')).toHaveCount(0);
    await expect(addButton(page)).toBeFocused();
  }
});

// The budget of the limits (spec limits; design of add-limits, decision 8), measured as the map's
// budget, and once more when a frame exceeds it, as a busy machine can stretch a frame.
test.describe(() => {
  test.describe.configure({ retries: 1 });

  /** The frames while the lower bound of "Einwohner" is dragged across its track and back. */
  async function framesOfDragging(page: Page) {
    const lower = slider(page, 'Untere', 'Einwohner');
    await lower.scrollIntoViewIfNeeded();
    const box = await lower.boundingBox();
    if (box === null) throw new Error('the slider has no box');
    const y = box.y + box.height / 2;
    const [left, right] = [box.x + 10, box.x + box.width - 10];
    // The pointer rests on the thumb 50 ms before the press, as a person's does.
    await page.mouse.move(left, y);
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      (window as unknown as { __frames: unknown[] }).__frames = [];
    });
    await page.mouse.down();
    await page.mouse.move(right, y, { steps: 20 });
    await page.mouse.move(left, y, { steps: 20 });
    await page.mouse.up();
    return measuredFrames(page);
  }

  test('the budget of dragging: no frame while a bound is dragged takes more than 16 ms', async ({
    page,
  }) => {
    await page.addInitScript(MEASURE_FRAMES);
    await openVote(page, 'de/votes/5960/');
    await fontsLoaded(page);
    await addLimit(page, 'Einwohner');
    const frames = await framesOfDragging(page);
    expect(frames.filter((f) => f.type === 'input').length).toBeGreaterThanOrEqual(30);
    expect(frames.filter((f) => f.work > 16)).toEqual([]);
  });

  test('the budget of dragging with five limits and a municipality clicked: no frame over 16 ms', async ({
    page,
  }) => {
    // Spec limits, "Dragging with five limits and a municipality clicked": five tracks with
    // their bars and their marks of Köniz, in the window that shows the map beside them.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(MEASURE_FRAMES);
    await openVote(page, 'de/votes/5960/');
    await mapDrawn(page);
    await fontsLoaded(page);
    await clickOn(page, 355);
    for (const name of ['Ausländeranteil', 'Einwohner', 'Deutsch', 'Französisch', 'SVP']) {
      await addLimit(page, name);
    }
    await expect(page.locator('.limit .here')).toHaveCount(5);
    const frames = await framesOfDragging(page);
    expect(frames.filter((f) => f.type === 'input').length).toBeGreaterThanOrEqual(30);
    expect(frames.filter((f) => f.work > 16)).toEqual([]);
  });

  test('the budget of jumps: no frame after a jump of the selection takes more than 50 ms', async ({
    page,
  }) => {
    await page.addInitScript(MEASURE_FRAMES);
    await openVote(page, 'de/votes/5960/');
    await fontsLoaded(page);
    await page.evaluate(() => {
      (window as unknown as { __frames: unknown[] }).__frames = [];
    });
    // Each control at a person's pace: the pointer rests on it 50 ms before the click.
    const press = async (control: ReturnType<Page['getByRole']>) => {
      await control.hover();
      await page.waitForTimeout(50);
      await control.click();
    };
    // Opening the list and choosing in it are two jumps (spec limits, "Jumps").
    const add = async (name: string) => {
      await press(addButton(page));
      await press(limitList(page).getByRole('button', { name, exact: true }));
    };
    await add('Ausländeranteil');
    await page.waitForTimeout(50);
    await slider(page, 'Obere', 'Ausländeranteil').fill('327');
    await page.waitForTimeout(50);
    await add('Einwohner');
    await press(abroadSwitch(page));
    await press(abroadSwitch(page));
    await press(page.getByRole('button', { name: 'Entfernen: Einwohner' }));
    await press(page.getByRole('button', { name: 'Zurück zum echten Ergebnis' }));
    await expect(page.locator('.limit')).toHaveCount(0);
    const frames = await measuredFrames(page);
    expect(frames.filter((f) => f.type === 'click').length).toBeGreaterThanOrEqual(8);
    expect(frames.filter((f) => f.work > 50)).toEqual([]);
  });
});

test('a range closed at the end of its track reopens by pointer', async ({ page }) => {
  // Copilot's review of PR #12: both thumbs at step 1,000, the upper one on top.
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  const lower = slider(page, 'Untere', 'Ausländeranteil');
  await lower.fill('1000');
  await expect(limitLabel(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 61.10% bis 61.10%',
  );
  const box = await lower.boundingBox();
  if (box === null) throw new Error('the slider has no box');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width - 10, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, y, { steps: 5 });
  await page.mouse.up();
  expect(Number(await lower.inputValue())).toBeLessThan(600);
  await expect(slider(page, 'Obere', 'Ausländeranteil')).toHaveValue('1000');
});

test("a step that keeps the end's value narrows nothing: inhabitants at step 1", async ({
  page,
}) => {
  // investigations/limits.md, 5: step 1 of the inhabitants of 2016 is 31, the smallest value.
  await openVote(page, 'de/votes/5960/');
  await addLimit(page, 'Einwohner');
  await slider(page, 'Untere', 'Einwohner').fill('1');
  await expect(limitLabel(page, 'Einwohner')).toHaveText(
    "Einwohner (Ende 2015): von 31 bis 396'955",
  );
  await expect(page.getByText('Mit Ihrer Auswahl')).toHaveCount(0);
  await expect(page.locator('.municipalities [fill="#2c2c2c"]')).toHaveCount(0);
});
