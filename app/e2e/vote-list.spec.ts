// The start page's list of votes (spec vote-list), against the built site. The expected list is
// the site's own list of votes, so that an update of the data leaves these tests as they are;
// the unit tests of src/lib/vote-list.test.ts pin the figures of the data of 2026-11-14.
import { expect, test, type APIRequestContext, type Locator } from '@playwright/test';
import { fontsLoaded, MEASURE_FRAMES, measuredFrames } from './frames.ts';
import {
  barDrawn,
  finder,
  keptButton,
  kindOf,
  marksOf,
  placeOf,
  searchField,
  shareOf,
  verdictOf,
  voteDays,
  voteRow,
  voteRows,
  votesShown,
  yearHeadings,
  yearLinks,
} from './parts.ts';

// The start page's heading: the question the site answers.
const QUESTION =
  'Wie hätte die Schweiz abgestimmt, wenn nur ein Teil der Gemeinden an die Urne gegangen wäre?';

interface ListedVote {
  readonly id: number;
  readonly date: string;
  readonly kind: string;
  readonly validated: boolean;
  readonly title: { readonly de: string };
  readonly result: { readonly passed: boolean | null };
}

async function listedVotes(request: APIRequestContext): Promise<ListedVote[]> {
  const response = await request.get('data/votes.json');
  return ((await response.json()) as { votes: ListedVote[] }).votes;
}

test('the heading is the question, with one sentence; the title is the working title', async ({
  page,
}) => {
  await page.goto('de/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(QUESTION);
  // 35 characteristics, three of them named (spec characteristics).
  await expect(page.locator('.lead')).toHaveText(
    'Wählen Sie eine Abstimmung und grenzen Sie die Gemeinden ein: nach Einwohnerzahl, Alter, ' +
      'Parteistärke und 32 weiteren Merkmalen. Karte und Ergebnis rechnen sofort neu. Ein ' +
      'Gedankenexperiment, keine Prognose.',
  );
  await expect(page).toHaveTitle('Popular Vote Explorer');
});

test('a heading per year, from the newest to 2013, and a row per vote', async ({
  page,
  request,
}) => {
  const votes = await listedVotes(request);
  await page.goto('de/');
  // The German start page (spec interface-languages).
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  const years = await page.getByRole('heading', { level: 2 }).allTextContents();
  // The years of the data of 2026-11-14; a later year comes before them.
  expect(years.slice(-14)).toEqual([
    '2026',
    '2025',
    '2024',
    '2023',
    '2022',
    '2021',
    '2020',
    '2019',
    '2018',
    '2017',
    '2016',
    '2015',
    '2014',
    '2013',
  ]);
  expect(years).toEqual([...new Set(votes.map((vote) => vote.date.slice(0, 4)))].reverse());
  await expect(page.getByRole('listitem')).toHaveCount(votes.length);
  await expect(voteRows(page)).toHaveCount(votes.length);
});

test('the newest vote day first, its votes by their ids; the last are those of 3 March 2013', async ({
  page,
  request,
}) => {
  const votes = await listedVotes(request);
  const newest = votes
    .map((vote) => vote.date)
    .sort()
    .at(-1);
  const ofNewest = votes.filter((vote) => vote.date === newest).map((vote) => vote.id);
  await page.goto('de/');
  const shown = await votesShown(page);
  // In the data of 2026-11-14, the two votes of 27 September 2026.
  expect(shown.slice(0, ofNewest.length)).toEqual(ofNewest.sort((a, b) => a - b));
  expect(shown.slice(-3)).toEqual([5670, 5680, 5690]);
  expect(await placeOf(voteRow(page, 5690))).toEqual(['2013', '3. März']);
});

test('the vote days of a year, from the newest, in three languages', async ({ page, request }) => {
  const votes = await listedVotes(request);
  // The vote days of 2026 in the list, from the newest, each with the number of its votes.
  const dates = [...new Set(votes.map((vote) => vote.date))]
    .filter((date) => date.startsWith('2026'))
    .sort()
    .reverse();
  const counts = dates.map((date) => votes.filter((vote) => vote.date === date).length);
  // The three vote days of the data of 2026-11-14; a later day comes before them.
  const named = {
    de: ['27. September', '14. Juni', '8. März'],
    fr: ['27 septembre', '14 juin', '8 mars'],
    it: ['27 settembre', '14 giugno', '8 marzo'],
  };
  for (const [language, names] of Object.entries(named)) {
    await page.goto(`${language}/`);
    const days = await voteDays(page, '2026');
    expect(
      days.map(([, rows]) => rows),
      language,
    ).toEqual(counts);
    expect(days.slice(-3), language).toEqual([
      [names[0], 2],
      [names[1], 2],
      [names[2], 6],
    ]);
  }
});

test('the row of a vote that failed, with the bar of its yes share', async ({ page }) => {
  await page.goto('de/');
  const failed = voteRow(page, 5960);
  expect(await placeOf(failed)).toEqual(['2016', '28. Februar']);
  await expect(failed.getByRole('link')).toHaveText(
    'Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»',
  );
  await expect(kindOf(failed)).toHaveText('Volksinitiative');
  await expect(shareOf(failed)).toHaveText('49.16% Ja');
  await expect(verdictOf(failed)).toHaveText('abgelehnt');
  // 1,609,152 yes and 1,664,224 no votes (investigations/data-sources.md, "Reference values").
  const bar = await barDrawn(failed.locator('.bar'));
  expect(bar.parts.map((part) => part.side)).toEqual(['yes', 'no']);
  const yes = (1609152 / (1609152 + 1664224)) * bar.width;
  expect(Math.abs((bar.parts[0]?.width ?? 0) - yes)).toBeLessThanOrEqual(1);
  expect(Math.abs((bar.mark ?? 0) - bar.width / 2)).toBeLessThanOrEqual(1);
});

test('the row of a vote that passed', async ({ page }) => {
  await page.goto('de/');
  const passed = voteRow(page, 6790);
  expect(await placeOf(passed)).toEqual(['2025', '28. September']);
  await expect(kindOf(passed)).toHaveText('Fakultatives Referendum');
  await expect(shareOf(passed)).toHaveText('50.39% Ja');
  await expect(verdictOf(passed)).toHaveText('angenommen');
});

test('the row of the tie-break question: its share for the initiative, no verdict, no bar', async ({
  page,
}) => {
  await page.goto('de/');
  const tieBreak = voteRow(page, 6823);
  expect(await placeOf(tieBreak)).toEqual(['2026', '8. März']);
  await expect(tieBreak.getByRole('link')).toHaveText(
    'Bargeldinitiative und Gegenvorschlag: Stichfrage',
  );
  await expect(kindOf(tieBreak)).toHaveText('Stichfrage');
  await expect(shareOf(tieBreak)).toHaveText('37.36% für die Initiative');
  await expect(tieBreak).not.toContainText(/angenommen|abgelehnt/);
  await expect(verdictOf(tieBreak)).toHaveCount(0);
  await expect(tieBreak.locator('.bar')).toHaveCount(0);
});

test('the row shows the official result where the municipal figures differ', async ({ page }) => {
  // 1,884,096 yes and 1,350,325 no votes validated; the entries give 200 no votes more.
  await page.goto('de/');
  await expect(shareOf(voteRow(page, 6650))).toHaveText('58.25% Ja');
  await expect(verdictOf(voteRow(page, 6650))).toHaveText('angenommen');
});

test('the marks of the rows', async ({ page, request }) => {
  const votes = await listedVotes(request);
  await page.goto('de/');
  await expect(marksOf(voteRow(page, 5960))).toHaveText(['Hinweis']);
  // The first vote of the list, of 2013-03-03: "Bundesbeschluss über die Familienpolitik".
  await expect(marksOf(voteRow(page, 5670))).toHaveCount(0);
  // The 8 votes of 2026-03-08 and 2026-06-14 in the data of 2026-11-14.
  const provisional = votes.filter((vote) => !vote.validated).map((vote) => vote.title.de);
  const marked = voteRows(page)
    .filter({ has: page.locator('.mark').getByText('vorläufig', { exact: true }) })
    .getByRole('link');
  expect((await marked.allTextContents()).sort()).toEqual(provisional.sort());
});

test('from the list to a vote and back', async ({ page }) => {
  const title = 'Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»';
  await page.goto('de/');
  await page.getByRole('link', { name: title, exact: true }).click();
  await expect(page).toHaveURL('de/votes/5960/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  await page.getByRole('link', { name: 'Alle Abstimmungen' }).click();
  await expect(page).toHaveURL('de/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(QUESTION);
});

test('the whole row leads to its vote', async ({ page }) => {
  await page.goto('de/');
  // Not on the title: on the share, at the row's other end, over which the title's link lies.
  const row = voteRow(page, 5960);
  const [box, share] = [await row.boundingBox(), await shareOf(row).boundingBox()];
  if (box === null || share === null) throw new Error('the row is not shown');
  await row.click({
    position: { x: share.x + share.width / 2 - box.x, y: share.y + share.height / 2 - box.y },
  });
  await expect(page).toHaveURL('de/votes/5960/');
});

// The ids of the listed votes a test keeps, in the list's order: from the newest vote day, the
// votes of a day by their ids.
const idsOf = (votes: ListedVote[], keeps: (vote: ListedVote) => boolean): number[] =>
  votes
    .filter(keeps)
    .sort((a, b) => b.date.localeCompare(a.date) || a.id - b.id)
    .map((vote) => vote.id);

// Whether a vote's German title holds a word, whatever the case.
const holds = (vote: ListedVote, word: string): boolean =>
  vote.title.de.toLowerCase().includes(word.toLowerCase());

test('a word typed keeps the votes whose title holds it, and their years only', async ({
  page,
  request,
}) => {
  const votes = await listedVotes(request);
  await page.goto('de/');
  await searchField(page).fill('ahv');
  const expected = idsOf(votes, (vote) => holds(vote, 'ahv'));
  await expect(voteRows(page)).toHaveCount(expected.length);
  expect(await votesShown(page)).toEqual(expected);
  // The 7 votes of the data of 2026-11-14, under six years; a later vote comes before them.
  expect(expected.slice(-7)).toEqual([6650, 6590, 6600, 6270, 6140, 6060, 5940]);
  expect((await yearHeadings(page).allTextContents()).slice(-6)).toEqual([
    '2024',
    '2022',
    '2019',
    '2017',
    '2016',
    '2015',
  ]);
  // A vote day without a vote left is not shown: of 2022, the day of its two votes only.
  expect(await voteDays(page, '2022')).toEqual([['25. September', 2]]);
});

test('two words keep the votes whose title holds both', async ({ page }) => {
  await page.goto('de/');
  await searchField(page).fill('AHV Rente');
  await expect(voteRows(page)).toHaveCount(1);
  expect(await votesShown(page)).toEqual([6650]);
  expect(await placeOf(voteRow(page, 6650))).toEqual(['2024', '3. März']);
});

test('in French, a word is looked for in the French titles', async ({ page }) => {
  await page.goto('fr/');
  await searchField(page, 'fr').fill('mariage');
  // The two votes of the data of 2026-11-14; a later vote comes before them.
  await expect(voteRow(page, 5960)).toBeVisible();
  await expect(voteRow(page, 6140)).toHaveCount(0);
  expect((await votesShown(page)).slice(-2)).toEqual([6470, 5960]);
});

test('a word no title holds: no year, no vote, and a sentence; the field emptied: the whole list', async ({
  page,
  request,
}) => {
  const votes = await listedVotes(request);
  await page.goto('de/');
  const address = page.url();
  const sentence = page.getByText('Keine Abstimmung passt zu dieser Suche.');
  await expect(sentence).toHaveCount(0);
  await searchField(page).fill('xyz');
  await expect(sentence).toBeVisible();
  await expect(voteRows(page)).toHaveCount(0);
  await expect(yearHeadings(page)).toHaveCount(0);
  await searchField(page).fill('');
  await expect(sentence).toHaveCount(0);
  await expect(voteRows(page)).toHaveCount(votes.length);
  await expect(yearHeadings(page)).toHaveCount(
    new Set(votes.map((vote) => vote.date.slice(0, 4))).size,
  );
  // Nothing typed is written to the address.
  expect(page.url()).toBe(address);
});

test.describe('without scripts', () => {
  test.use({ javaScriptEnabled: false });

  test('the list is whole, each row a link to its vote', async ({ page, request }) => {
    const votes = await listedVotes(request);
    await page.goto('de/');
    await expect(voteRows(page)).toHaveCount(votes.length);
    expect(await votesShown(page)).toEqual(idsOf(votes, () => true));
    await expect(yearHeadings(page)).toHaveCount(
      new Set(votes.map((vote) => vote.date.slice(0, 4))).size,
    );
    await expect(voteRow(page, 5960).getByRole('link')).toHaveAttribute(
      'href',
      /\/de\/votes\/5960$/,
    );
  });
});

test('"Angenommen", "Abgelehnt" and "Alle" keep the votes with that result', async ({
  page,
  request,
}) => {
  const votes = await listedVotes(request);
  const judged = (passed: boolean) => (vote: ListedVote) =>
    vote.kind !== 'tie-break-question' && vote.result.passed === passed;
  await page.goto('de/');
  const [all, accepted, rejected] = (['Alle', 'Angenommen', 'Abgelehnt'] as const).map((name) =>
    keptButton(page, name),
  );
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(accepted).toHaveAttribute('aria-pressed', 'false');

  await accepted.click();
  await expect(accepted).toHaveAttribute('aria-pressed', 'true');
  await expect(all).toHaveAttribute('aria-pressed', 'false');
  expect(await votesShown(page)).toEqual(idsOf(votes, judged(true)));
  await expect(voteRow(page, 6823)).toHaveCount(0);

  await rejected.click();
  await expect(accepted).toHaveAttribute('aria-pressed', 'false');
  expect(await votesShown(page)).toEqual(idsOf(votes, judged(false)));
  await expect(voteRow(page, 6823)).toHaveCount(0);

  await all.click();
  await expect(voteRows(page)).toHaveCount(votes.length);
  // The tie-break question shows under "Alle" only.
  await expect(voteRow(page, 6823)).toBeVisible();
  // In the data of 2026-11-14: 52 accepted and 72 rejected votes of 125.
  const until = (vote: ListedVote) => vote.date <= '2026-09-27';
  expect(idsOf(votes, (vote) => until(vote) && judged(true)(vote))).toHaveLength(52);
  expect(idsOf(votes, (vote) => until(vote) && judged(false)(vote))).toHaveLength(72);
});

test('a word and a button apply together', async ({ page, request }) => {
  const votes = await listedVotes(request);
  await page.goto('de/');
  await searchField(page).fill('energie');
  await keptButton(page, 'Angenommen').click();
  const expected = idsOf(votes, (vote) => holds(vote, 'energie') && vote.result.passed === true);
  await expect(voteRows(page)).toHaveCount(expected.length);
  expect(await votesShown(page)).toEqual(expected);
  // The 3 accepted of the 6 votes of the data of 2026-11-14 with that word.
  expect(expected.slice(-3)).toEqual([6700, 6630, 6120]);
});

test('a link per year leads to its heading; the field, the buttons and the years stay', async ({
  page,
  request,
}) => {
  const votes = await listedVotes(request);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('de/');
  const years = [...new Set(votes.map((vote) => vote.date.slice(0, 4)))].sort().reverse();
  await expect(yearLinks(page)).toHaveText(years);
  await yearLinks(page).getByText('2016', { exact: true }).click();
  const heading = page.getByRole('heading', { level: 2, name: '2016', exact: true });
  await expect(heading).toBeInViewport({ ratio: 1 });
  // The field, the buttons and the years are at the top of the window, the heading below them.
  const staying = await finder(page).boundingBox();
  const field = await searchField(page).boundingBox();
  const headed = await heading.boundingBox();
  if (staying === null || field === null || headed === null) throw new Error('a part is not shown');
  expect(staying.y).toBe(0);
  expect(headed.y).toBeGreaterThanOrEqual(staying.y + staying.height);
  expect(headed.y).toBeGreaterThanOrEqual(field.y + field.height);
  for (const control of [searchField(page), keptButton(page, 'Alle'), yearLinks(page).first()]) {
    await expect(control).toBeInViewport({ ratio: 1 });
  }
  // The votes of 2016 follow: the first of them is in the window too.
  await expect(voteRow(page, 6080)).toBeInViewport();
});

// The budget of the list (spec vote-list, "The budget of the list"), measured as the limits'
// jumps are, and once more when a frame exceeds it, as a busy machine can stretch a frame.
test.describe(() => {
  test.describe.configure({ retries: 1 });

  test('the budget of the list: no frame after a key or a press takes more than 50 ms', async ({
    page,
    request,
  }) => {
    const votes = await listedVotes(request);
    await page.addInitScript(MEASURE_FRAMES);
    await page.goto('de/');
    await fontsLoaded(page);
    await expect(voteRows(page)).toHaveCount(votes.length);
    await page.evaluate(() => {
      (window as unknown as { __frames: unknown[] }).__frames = [];
    });
    // Each control at a person's pace: the pointer rests on it 50 ms before the click.
    const press = async (control: Locator) => {
      await control.hover();
      await page.waitForTimeout(50);
      await control.click();
    };
    await press(searchField(page));
    // "energie", key by key.
    await searchField(page).pressSequentially('energie', { delay: 50 });
    await press(keptButton(page, 'Angenommen'));
    await expect(voteRow(page, 6120)).toBeVisible();
    await expect(voteRow(page, 6080)).toHaveCount(0);
    await press(keptButton(page, 'Alle'));
    await expect(voteRow(page, 6080)).toBeVisible();
    await page.waitForTimeout(50);
    await searchField(page).fill('');
    await expect(voteRows(page)).toHaveCount(votes.length);
    const frames = await measuredFrames(page);
    // Seven keys and the emptying; the field and the two buttons pressed.
    expect(frames.filter((f) => f.type === 'input').length).toBeGreaterThanOrEqual(8);
    expect(frames.filter((f) => f.type === 'click').length).toBeGreaterThanOrEqual(3);
    expect(frames.filter((f) => f.work > 50)).toEqual([]);
  });
});

test('all requests go to the site itself', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  // From the address without a language, whose page redirects to the start page (spec
  // interface-languages).
  await page.goto('./', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL('de/');
  expect([...origins]).toEqual([new URL(page.url()).origin]);
  // The reading guide too (spec reading-guide).
  await page.goto('de/guide/', { waitUntil: 'networkidle' });
  expect([...origins]).toEqual([new URL(page.url()).origin]);
});
