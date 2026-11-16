// The limits (spec limits) and what follows them: the selection's result (spec verdicts) and the
// map (spec result-map), against the built site. The figures are those of
// investigations/limits.md.
import { expect, test, type Page } from '@playwright/test';
import { pointIn } from './pointing.ts';

/** Open a vote's page and wait until the limits can be used. */
async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByLabel('Merkmal hinzufügen')).toBeVisible();
}

test('the section of a vote: between the outcome and the map, without a limit', async ({
  page,
}) => {
  await open(page, 'votes/5960/');
  await expect(page.getByRole('heading', { name: 'Gemeinden auswählen' })).toBeVisible();
  const order = await page.evaluate(() => {
    const at = (element: Element | null) =>
      element ? [...document.querySelectorAll('*')].indexOf(element) : -1;
    return [
      at(document.querySelector('.outcome')),
      at(document.querySelector('.limits')),
      at(document.querySelector('.map')),
    ];
  });
  expect(order[0]).toBeLessThan(order[1] ?? -1);
  expect(order[1]).toBeLessThan(order[2] ?? -1);
  await expect(page.getByRole('slider')).toHaveCount(0);
  await expect(
    page.getByRole('checkbox', { name: /Auslandschweizerinnen und Auslandschweizer mitzählen/ }),
  ).toBeChecked();
});

test('no limits for a tie-break question', async ({ page }) => {
  await page.goto('votes/6823/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Gemeinden auswählen')).toHaveCount(0);
});

/** The names the list "Merkmal hinzufügen" offers. */
async function offered(page: Page): Promise<string[]> {
  return page.getByLabel('Merkmal hinzufügen').locator('option:not([value=""])').allTextContents();
}

/** Add the limit of a characteristic from the list. */
async function addLimit(page: Page, name: string): Promise<void> {
  await page.getByLabel('Merkmal hinzufügen').selectOption({ label: name });
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
}

test('adding a limit: its label, and the list offers the others', async ({ page }) => {
  await open(page, 'votes/5960/');
  expect(await offered(page)).toHaveLength(21);
  await addLimit(page, 'Ausländeranteil');
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 61.10%',
  ]);
  const others = await offered(page);
  expect(others).toHaveLength(20);
  expect(others).not.toContain('Ausländeranteil');
});

test('removing a limit: the list offers all 21 again', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await page.getByRole('button', { name: 'Entfernen: Ausländeranteil' }).click();
  await expect(page.locator('.limit')).toHaveCount(0);
  expect(await offered(page)).toHaveLength(21);
});

/** A slider of a limit, by its bound and its characteristic's name. */
const slider = (page: Page, bound: 'Untere' | 'Obere', name: string) =>
  page.getByRole('slider', { name: `${bound} Grenze: ${name}`, exact: true });

/** The label of the limit of a characteristic. */
const label = (page: Page, name: string) =>
  page.locator('.limit .label').filter({ hasText: new RegExp(`^${name} \\(`) });

test('a linear track: steps 327 and 328 of the foreigners', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await expect(label(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 19.98%',
  );
  await slider(page, 'Obere', 'Ausländeranteil').fill('328');
  await expect(label(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 20.04%',
  );
});

test('a logarithmic track: the inhabitants from step 500', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Einwohner');
  await slider(page, 'Untere', 'Einwohner').fill('500');
  await expect(label(page, 'Einwohner')).toHaveText("Einwohner (Ende 2015): von 3'508 bis 396'955");
});

test('a logarithmic track from zero: the cattle at steps 1 and 500', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Rinder je Einwohner');
  await slider(page, 'Obere', 'Rinder je Einwohner').fill('1');
  await expect(label(page, 'Rinder je Einwohner')).toHaveText(
    'Rinder je Einwohner (2015): von 0.000 bis 0.001',
  );
  await slider(page, 'Obere', 'Rinder je Einwohner').fill('500');
  await expect(label(page, 'Rinder je Einwohner')).toHaveText(
    'Rinder je Einwohner (2015): von 0.000 bis 0.090',
  );
});

test('a step by key: the left arrow moves the upper bound one step', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(label(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 0.00% bis 61.04%',
  );
  await expect(slider(page, 'Obere', 'Ausländeranteil')).toHaveAttribute(
    'aria-valuetext',
    '61.04%',
  );
});

test('the bounds do not cross: the lower one stops at the upper one', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  await slider(page, 'Obere', 'Ausländeranteil').fill('327');
  await slider(page, 'Untere', 'Ausländeranteil').fill('1000');
  await expect(slider(page, 'Untere', 'Ausländeranteil')).toHaveValue('327');
  await expect(label(page, 'Ausländeranteil')).toHaveText(
    'Ausländeranteil (Ende 2015): von 19.98% bis 19.98%',
  );
});

test('the labels of a vote: the date of each characteristic, its bounds as the panel writes them', async ({
  page,
}) => {
  await open(page, 'votes/6400/');
  for (const name of ['SVP', 'Italienisch', 'Fläche']) await addLimit(page, name);
  await expect(page.locator('.limit .label')).toHaveText([
    'SVP (Nationalratswahl 2019): von 0.00% bis 84.11%',
    'Italienisch (Volkszählung 2000): von 0.00% bis 96.84%',
    'Fläche (2026): von 0.32 km² bis 438.61 km²',
  ]);
});

/** The switch for the Swiss abroad. */
const abroadSwitch = (page: Page) =>
  page.getByRole('checkbox', { name: /Auslandschweizerinnen und Auslandschweizer mitzählen/ });

test('without the Swiss abroad: the selection fails beside the real result', async ({ page }) => {
  // investigations/limits.md, 1 and 5; BBl 2015 6313.
  await open(page, 'votes/5950/');
  await abroadSwitch(page).uncheck();
  const selection = page.locator('.selection');
  await expect(selection.getByRole('heading', { name: 'Mit Ihrer Auswahl' })).toBeVisible();
  await expect(selection.locator('.figures dd')).toHaveText(["1'107'734", "1'113'998", '49.86%']);
  await expect(selection.locator('.verdict .word')).toHaveText(['Nein', 'nicht nötig']);
  await expect(selection.locator('.verdict p:not(.word)')).toHaveText(['49.86%', '6½ : 16½']);
  await expect(selection.locator('.verdict p.greyed')).toHaveText('6½ : 16½');
  await expect(selection.locator('.outcome')).toHaveText('Abgelehnt');
  const real = page.locator('.result:not(.selection)');
  await expect(real.locator('.figures dd').nth(2)).toHaveText('50.08%');
  await expect(real.locator('.outcome')).toHaveText('Angenommen');
});

const municipality = (page: Page, number: number) =>
  page.locator(`.municipalities [data-number="${String(number)}"]`);

test('a narrowed limit sets aside a municipality without a figure: Rüti bei Lyssach', async ({
  page,
}) => {
  // investigations/limits.md, 2 and 5: 422 has a result and no party figure in 2019.
  await open(page, 'votes/6400/');
  await addLimit(page, 'SVP');
  await expect(municipality(page, 422)).not.toHaveAttribute('fill', '#2c2c2c');
  await slider(page, 'Obere', 'SVP').fill('999');
  await expect(label(page, 'SVP')).toHaveText('SVP (Nationalratswahl 2019): von 0.00% bis 84.03%');
  await expect(municipality(page, 422)).toHaveAttribute('fill', '#2c2c2c');
  await expect(municipality(page, 932)).toHaveAttribute('fill', '#2c2c2c'); // Horrenbach-Buchen
  await expect(page.locator('.municipalities [fill="#2c2c2c"]')).toHaveCount(2);
  await slider(page, 'Obere', 'SVP').fill('1000');
  await expect(municipality(page, 422)).not.toHaveAttribute('fill', '#2c2c2c');
});

test('several limits at once: German and French each from their last step leave nothing', async ({
  page,
}) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Deutsch');
  await addLimit(page, 'Französisch');
  await slider(page, 'Untere', 'Deutsch').fill('1000');
  await expect(page.locator('.municipalities [fill="#2c2c2c"]')).not.toHaveCount(0);
  await slider(page, 'Untere', 'Französisch').fill('1000');
  await expect(label(page, 'Französisch')).toHaveText(
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
  await open(page, 'votes/5960/');
  await foreignersUpTo1998(page);
  const selection = page.locator('.selection');
  await expect(selection.locator('.verdict p:not(.word)').nth(1)).toHaveText('18 : 4½');
  await expect(page.getByRole('row', { name: /^BS / })).toContainText('keine Gemeinde übrig');
});

/**
 * Press the thumb of a slider at a step, and drag it, without letting go, until the slider shows
 * the step `to`: a pixel of the track holds about two steps, so the pointer is moved by the
 * difference until it lands there.
 */
async function dragTo(page: Page, input: ReturnType<typeof slider>, from: number, to: number) {
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
  await open(page, 'votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  const upper = slider(page, 'Obere', 'Ausländeranteil');
  await dragTo(page, upper, 1000, 327);
  // The pointer is still pressed.
  await expect(page.locator('.selection .figures dd').nth(2)).toHaveText('52.47%');
  await expect(municipality(page, 261)).toHaveAttribute('fill', '#2c2c2c'); // Zürich, 32.03%
  await page.mouse.up();
});

test('the entries a selection needs are on the page: no file of entries is loaded', async ({
  page,
}) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await open(page, 'votes/5950/');
  await abroadSwitch(page).uncheck();
  await expect(page.locator('.selection .outcome')).toHaveText('Abgelehnt');
  await page.waitForLoadState('networkidle');
  expect(requested.filter((url) => url.includes('/data/votes/'))).toEqual([]);
});

test('the cantons of a selection: the table follows it, BS has nothing left', async ({ page }) => {
  // investigations/limits.md, 5.
  await open(page, 'votes/5960/');
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
  await open(page, 'votes/5950/');
  await addLimit(page, 'Einwohner');
  await expect(page.locator('.limit')).toHaveCount(1);
  await expect(page.getByText('Mit Ihrer Auswahl')).toHaveCount(0);
  const figures = await page.locator('.figures dd').allTextContents();
  expect(figures.slice(0, 3)).toEqual(["1'128'522", "1'124'873", '50.08%']);
  await expect(page.locator('.outcome')).toHaveText('Angenommen');
  await expect(page.locator('.municipalities [fill="#2c2c2c"]')).toHaveCount(0);
});

test('a selection that turns the verdict: foreigners up to 19.98% in 2016', async ({ page }) => {
  // investigations/limits.md, 5.
  await open(page, 'votes/5960/');
  await foreignersUpTo1998(page);
  const selection = page.locator('.selection');
  await expect(selection.locator('.figures dd')).toHaveText(["733'402", "664'373", '52.47%']);
  await expect(selection.locator('.verdict .word')).toHaveText(['Ja', 'Ja']);
  await expect(selection.locator('.verdict p:not(.word)')).toHaveText(['52.47%', '18 : 4½']);
  await expect(selection.locator('.outcome')).toHaveText('Angenommen');
  const real = page.locator('.result:not(.selection)');
  await expect(real.locator('.figures dd').nth(2)).toHaveText('49.16%');
  await expect(real.locator('.outcome')).toHaveText('Abgelehnt');
});

test('a selection on a logarithmic track: inhabitants from 3,508 in 2016', async ({ page }) => {
  // investigations/limits.md, 5.
  await open(page, 'votes/5960/');
  await addLimit(page, 'Einwohner');
  await slider(page, 'Untere', 'Einwohner').fill('500');
  const selection = page.locator('.selection');
  await expect(selection.locator('.figures dd')).toHaveText(["1'137'986", "1'266'006", '47.34%']);
  await expect(selection.locator('.verdict .word')).toHaveText(['Nein', 'Ja']);
  await expect(selection.locator('.verdict p:not(.word)')).toHaveText(['47.34%', '12½ : 10½']);
  await expect(selection.locator('.outcome')).toHaveText('Abgelehnt');
});

test('nothing remains: no votes, no yes share, no cantonal vote, the vote fails', async ({
  page,
}) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Deutsch');
  await addLimit(page, 'Französisch');
  await slider(page, 'Untere', 'Deutsch').fill('1000');
  await slider(page, 'Untere', 'Französisch').fill('1000');
  const selection = page.locator('.selection');
  await expect(selection.locator('.figures dd')).toHaveText(['0', '0', '–']);
  await expect(selection.locator('.verdict .word')).toHaveText(['Nein', 'Nein']);
  await expect(selection.locator('.verdict p:not(.word)')).toHaveText(['–', '0 : 0']);
  await expect(selection.locator('.outcome')).toHaveText('Abgelehnt');
});

test('the legend of a selection ends with the dark grey of the set-aside', async ({ page }) => {
  await open(page, 'votes/5960/');
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
  await open(page, 'votes/5960/');
  await foreignersUpTo1998(page);
  await expect(municipality(page, 261)).toHaveAttribute('fill', '#2c2c2c');
  await expect(municipality(page, 1)).toHaveAttribute('fill', '#fbbea3'); // no, class 1
  await expect(page.locator('.municipalities [fill="url(#hatch)"]')).toHaveCount(7);
});

test('without a result and without a figure: Meienried stays hatched', async ({ page }) => {
  // investigations/limits.md, 2: Meienried has neither a result nor a party figure in 2021.
  await open(page, 'votes/6400/');
  await addLimit(page, 'SVP');
  await slider(page, 'Obere', 'SVP').fill('999');
  await expect(municipality(page, 389)).toHaveAttribute('fill', 'url(#hatch)');
  await expect(municipality(page, 422)).toHaveAttribute('fill', '#2c2c2c');
});

test('the details of a set-aside municipality: its own figures, and that it is not selected', async ({
  page,
}) => {
  // investigations/map-data.md: Zürich in 2016.
  await open(page, 'votes/5960/');
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
  await open(page, 'votes/5960/');
  await expect(count(page)).toHaveText(
    "In der Auswahl: 2'103 von 2'103 Gemeinden mit eigenem Ergebnis.",
  );
});

test('the number of municipalities that remain under a limit', async ({ page }) => {
  // investigations/limits.md, 5.
  await open(page, 'votes/5960/');
  await foreignersUpTo1998(page);
  await expect(count(page)).toHaveText(
    "In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis.",
  );
});

test('the number of municipalities that remain: none', async ({ page }) => {
  await open(page, 'votes/5960/');
  await addLimit(page, 'Deutsch');
  await addLimit(page, 'Französisch');
  await slider(page, 'Untere', 'Deutsch').fill('1000');
  await slider(page, 'Untere', 'Französisch').fill('1000');
  await expect(count(page)).toHaveText('Keine Gemeinde mit eigenem Ergebnis ist übrig.');
});

test('back to the real result: no limit, the switch on, no selection, the legend of ten', async ({
  page,
}) => {
  await open(page, 'votes/5960/');
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

test('back to the real cantons: the table of the vote again', async ({ page }) => {
  await open(page, 'votes/5960/');
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
  await open(page, 'votes/5960/');
  await foreignersUpTo1998(page);
  await abroadSwitch(page).uncheck();
  await page.getByRole('link', { name: 'Alle Abstimmungen' }).click();
  await page.locator('a[href$="/votes/5670"], a[href$="/votes/5670/"]').first().click();
  await expect(page.getByLabel('Merkmal hinzufügen')).toBeVisible();
  await expect(page).toHaveURL(/\/votes\/5670\/?$/);
  await expect(page.locator('.limit')).toHaveCount(0);
  await expect(abroadSwitch(page)).toBeChecked();
  await expect(page.getByText('Mit Ihrer Auswahl')).toHaveCount(0);
});

test('characteristics that cannot be loaded: no limits, and the rest of the page', async ({
  page,
}) => {
  await page.route('**/data/characteristics.json', (route) => route.abort());
  await page.goto('votes/5960/');
  await expect(
    page.locator('.limits').getByText('Ohne die Merkmale lassen sich keine Gemeinden auswählen.'),
  ).toBeVisible();
  await expect(page.getByLabel('Merkmal hinzufügen')).toHaveCount(0);
  await expect(page.locator('.figures dd').first()).toHaveText("1'609'152");
  await expect(page.locator('.verdict .word')).toHaveText(['Nein', 'Ja']);
  await expect(page.locator('.municipalities path')).toHaveCount(2110);
  await expect(page.locator('table tbody tr')).toHaveCount(26);
});

test('the limits follow the definitions: their names in order, four logarithmic tracks', async ({
  page,
}) => {
  // Spec characteristics, "One definition per characteristic"; investigations/limits.md, 4.
  await open(page, 'votes/5960/');
  expect(await offered(page)).toEqual([
    'Einwohner',
    'Ausländeranteil',
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
    'Fläche',
    'Rinder je Einwohner',
  ]);
  // At step 500 a logarithmic track is far below its linear middle.
  for (const [name, middle] of [
    ['Einwohner', "3'508"],
    ['Einwohner je km²', '104'],
    ['Fläche', '11.85 km²'],
    ['Rinder je Einwohner', '0.090'],
    ['Ausländeranteil', '30.55%'],
  ] as const) {
    await addLimit(page, name);
    await slider(page, 'Untere', name).fill('500');
    await expect(slider(page, 'Untere', name)).toHaveAttribute('aria-valuetext', middle);
  }
});

test('the keyboard on the list only moves the choice; "Hinzufügen" adds it', async ({ page }) => {
  // Q, 2026-11-16: in Chromium an arrow key on a closed list changes its choice at once.
  await open(page, 'votes/5960/');
  const list = page.getByLabel('Merkmal hinzufügen');
  await list.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.limit')).toHaveCount(0);
  await expect(list).toHaveValue('Ausländeranteil');
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  await expect(page.locator('.limit .label')).toHaveText([
    'Ausländeranteil (Ende 2015): von 0.00% bis 61.10%',
  ]);
  await expect(list).toHaveValue('');
});

test('a range closed at the end of its track reopens by pointer', async ({ page }) => {
  // Copilot's review of PR #12: both thumbs at step 1,000, the upper one on top.
  await open(page, 'votes/5960/');
  await addLimit(page, 'Ausländeranteil');
  const lower = slider(page, 'Untere', 'Ausländeranteil');
  await lower.fill('1000');
  await expect(label(page, 'Ausländeranteil')).toHaveText(
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
