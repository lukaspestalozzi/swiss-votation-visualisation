// The start page's list of votes (spec vote-list), against the built site. The expected list is
// the site's own list of votes, so that an update of the data leaves these tests as they are;
// the unit tests of src/lib/vote-list.test.ts pin the figures of the data of 2026-11-14.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  barDrawn,
  kindOf,
  marksOf,
  placeOf,
  shareOf,
  verdictOf,
  voteDays,
  voteRow,
  voteRows,
  votesShown,
} from './parts.ts';

// The start page's heading: the question the site answers.
const QUESTION =
  'Wie hätte die Schweiz abgestimmt, wenn nur ein Teil der Gemeinden an die Urne gegangen wäre?';

interface ListedVote {
  readonly id: number;
  readonly date: string;
  readonly validated: boolean;
  readonly title: { readonly de: string };
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
