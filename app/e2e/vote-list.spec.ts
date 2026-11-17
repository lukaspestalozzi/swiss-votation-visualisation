// The start page's list of votes (spec vote-list), against the built site. The expected list is
// the site's own list of votes, so that an update of the data leaves these tests as they are;
// the unit tests of src/lib/vote-list.test.ts pin the figures of the data of 2026-11-14.
import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';

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

test('a heading per year, from the newest to 2013, and an entry per vote', async ({
  page,
  request,
}) => {
  const votes = await listedVotes(request);
  await page.goto('de/');
  // The German start page (spec interface-languages).
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Popular Vote Explorer');
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
});

// The entry whose link has this title.
function entry(page: Page, title: string): Locator {
  return page
    .getByRole('listitem')
    .filter({ has: page.getByRole('link', { name: title, exact: true }) });
}

test('the entry of a vote that failed', async ({ page }) => {
  await page.goto('de/');
  const failed = entry(page, 'Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»');
  await expect(failed.locator('span:not(.mark)')).toHaveText([
    '28. Februar 2016',
    'Volksinitiative',
    'abgelehnt, 49.16% Ja',
  ]);
});

test('the entry of the tie-break question shows its share for the initiative', async ({ page }) => {
  await page.goto('de/');
  const tieBreak = entry(page, 'Bargeldinitiative und Gegenvorschlag: Stichfrage');
  await expect(tieBreak.locator('span:not(.mark)')).toHaveText([
    '8. März 2026',
    'Stichfrage',
    '37.36% für die Initiative',
  ]);
  await expect(tieBreak).not.toContainText(/angenommen|abgelehnt/);
});

test('the marks of the entries', async ({ page, request }) => {
  const votes = await listedVotes(request);
  await page.goto('de/');
  const annulled = entry(page, 'Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»');
  await expect(annulled.locator('.mark')).toHaveText(['Hinweis']);
  await expect(
    entry(page, 'Bundesbeschluss über die Familienpolitik').locator('.mark'),
  ).toHaveCount(0);
  // The 8 votes of 2026-03-08 and 2026-06-14 in the data of 2026-11-14.
  const provisional = votes.filter((vote) => !vote.validated).map((vote) => vote.title.de);
  const marked = page
    .getByRole('listitem')
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Popular Vote Explorer');
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
