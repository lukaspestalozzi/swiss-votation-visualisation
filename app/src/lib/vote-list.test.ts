// The start page's list of votes (spec vote-list), from the list of votes the pipeline writes.
// The figures are those of investigations/data-sources.md and of the data files of 2026-11-14.
import { expect, test } from 'vitest';
import votesFile from '../../static/data/votes.json';
import { textsOf } from './texts/index.ts';
import type { Votes } from './vote-data.ts';
import { listShown, voteList, type ListYear } from './vote-list.ts';

const listing = votesFile as Votes;
const de = textsOf('de');
// The data files of 2026-11-14 end with this vote day; a later update adds votes after it.
const FIRST_DATA_UNTIL = '2026-09-27';
const years = voteList(
  {
    ...listing,
    votes: listing.votes.filter((vote) => vote.date <= FIRST_DATA_UNTIL),
  },
  de,
);

// Every entry of a list, in its order.
const entriesOf = (list: readonly ListYear[]) =>
  list.flatMap((year) => year.days.flatMap((day) => day.entries));

test('the years run from 2026 to 2013 and hold 125 votes', () => {
  expect(years.map((year) => year.year)).toEqual([
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
  expect(entriesOf(years)).toHaveLength(125);
});

test('the vote days of a year, from the newest, each as day and month', () => {
  // Spec vote-list, "The vote days of a year".
  const daysOf = (list: readonly ListYear[]) =>
    list[0]?.days.map((day) => [day.day, day.entries.length]);
  expect(daysOf(years)).toEqual([
    ['27.\u00a0September', 2],
    ['14.\u00a0Juni', 2],
    ['8.\u00a0März', 6],
  ]);
});

test('the newest vote day comes first, and the votes of a day keep the order of their ids', () => {
  // 6880 and 6890 are the votes of 2026-09-27, 6860 the first of 2026-06-14.
  expect(
    entriesOf(years)
      .slice(0, 3)
      .map((entry) => entry.id),
  ).toEqual([6880, 6890, 6860]);
  // The three votes of 2013-03-03, the last vote day of 2013.
  expect(
    years
      .at(-1)
      ?.days.at(-1)
      ?.entries.map((entry) => entry.id),
  ).toEqual([5670, 5680, 5690]);
});

function entry(id: number) {
  const found = entriesOf(years).find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no entry ${String(id)}`);
  return found;
}

// The year and the vote day an entry stands under.
function dayOf(list: readonly ListYear[], id: number) {
  for (const year of list) {
    for (const day of year.days) {
      if (day.entries.some((entry) => entry.id === id)) return [year.year, day.day];
    }
  }
  throw new Error(`no entry ${String(id)}`);
}

test('the entry of a vote that failed', () => {
  expect(dayOf(years, 5960)).toEqual(['2016', '28.\u00a0Februar']);
  expect(entry(5960)).toMatchObject({
    title: 'Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»',
    kind: 'Volksinitiative',
    share: '49.16% Ja',
    verdict: 'abgelehnt',
  });
  // 1,609,152 yes and 1,664,224 no votes (investigations/data-sources.md, "Reference values").
  expect(entry(5960).yesPercent).toBeCloseTo((1609152 / (1609152 + 1664224)) * 100, 10);
});

test('the entry of a vote that passed', () => {
  expect(dayOf(years, 6790)).toEqual(['2025', '28.\u00a0September']);
  expect(entry(6790)).toMatchObject({
    kind: 'Fakultatives Referendum',
    share: '50.39% Ja',
    verdict: 'angenommen',
  });
});

test('the entry of the tie-break question shows its share for the initiative', () => {
  expect(dayOf(years, 6823)).toEqual(['2026', '8.\u00a0März']);
  // No verdict, and no share as a number: its row has no bar.
  expect(entry(6823)).toMatchObject({
    kind: 'Stichfrage',
    share: '37.36% für die Initiative',
    verdict: null,
    yesPercent: null,
  });
});

test('the side of an entry, for the colour of its result', () => {
  // Spec site-style, "The verdicts in the map's colours".
  expect(entry(5960).side).toBe('no');
  expect(entry(6790).side).toBe('yes');
});

test('the tie-break question has no side', () => {
  expect(entry(6823).side).toBeNull();
});

test('the entry shows the official result where the municipal figures differ', () => {
  // 1,884,096 yes and 1,350,325 no votes validated; the entries give 200 no votes more.
  expect(entry(6650)).toMatchObject({ share: '58.25% Ja', verdict: 'angenommen' });
  expect(entry(6650).yesPercent).toBeCloseTo((1884096 / (1884096 + 1350325)) * 100, 10);
});

test('the marks of the entries', () => {
  // Spec vote-list, "The marks of an entry": a note's mark only, none for a result not validated
  // yet (6850, of 2026-03-08).
  expect(entry(5960).marks).toEqual(['Hinweis']);
  expect(entry(6850).marks).toEqual([]);
  expect(entry(5670).marks).toEqual([]);
  const marks = new Set(entriesOf(years).flatMap((entry) => entry.marks));
  expect([...marks]).toEqual(['Hinweis']);
});

test('a list of votes that holds no vote is an error that names it', () => {
  expect(() => voteList({ ...listing, votes: [] }, de)).toThrow(/the list of votes/);
});

test('a title missing in one language is an error that names the vote and the language', () => {
  // Spec interface-languages, "A title missing in one language".
  const withoutItalian = {
    ...listing,
    votes: listing.votes.map((vote) =>
      vote.id === 5960 ? { ...vote, title: { ...vote.title, it: '' } } : vote,
    ),
  };
  expect(() => voteList(withoutItalian, textsOf('it'))).toThrow(
    'vote 5960 has no title in Italian',
  );
});

test("the list's entries in French and Italian", () => {
  // Spec interface-languages, "The list's verdicts"; spec vote-list, "The same vote in French and
  // Italian".
  const french = voteList(listing, textsOf('fr'));
  const italian = voteList(listing, textsOf('it'));
  const entryIn = (list: readonly ListYear[], id: number) =>
    entriesOf(list).find((entry) => entry.id === id);
  expect(dayOf(french, 5960)).toEqual(['2016', '28\u00a0février']);
  expect(entryIn(french, 5960)).toMatchObject({
    title: 'Initiative populaire «Pour le couple et la famille - Non à la pénalisation du mariage»',
    kind: 'Initiative populaire',
    share: '49.16% de oui',
    verdict: 'rejeté',
  });
  expect(dayOf(italian, 5960)).toEqual(['2016', '28\u00a0febbraio']);
  expect(entryIn(italian, 5960)).toMatchObject({
    title:
      'Iniziativa popolare «Per il matrimonio e la famiglia - No agli svantaggi per le coppie sposate»',
    kind: 'Iniziativa popolare',
    share: '49.16% di sì',
    verdict: 'respinto',
  });
  expect(entryIn(french, 6790)).toMatchObject({ share: '50.39% de oui', verdict: 'accepté' });
  expect(entryIn(italian, 6790)).toMatchObject({ share: '50.39% di sì', verdict: 'accettato' });
  // Spec vote-list, "The vote days of a year".
  expect(french[0]?.days.map((day) => day.day)).toEqual([
    '27\u00a0septembre',
    '14\u00a0juin',
    '8\u00a0mars',
  ]);
  expect(italian[0]?.days.map((day) => day.day)).toEqual([
    '27\u00a0settembre',
    '14\u00a0giugno',
    '8\u00a0marzo',
  ]);
});

// The ids of the votes a list shows, in its order.
const idsOf = (list: readonly ListYear[]) => entriesOf(list).map((entry) => entry.id);

test('a word typed keeps the votes whose title holds it, whatever the case', () => {
  // Spec vote-list, "A word": 7 votes under six years.
  const shown = listShown(years, 'ahv', 'all');
  expect(idsOf(shown)).toEqual([6650, 6590, 6600, 6270, 6140, 6060, 5940]);
  expect(shown.map((year) => year.year)).toEqual(['2024', '2022', '2019', '2017', '2016', '2015']);
  // A vote day without a vote left is not shown: 2022 keeps the day of its two votes only.
  expect(shown[1]?.days.map((day) => [day.day, day.entries.length])).toEqual([
    ['25.\u00a0September', 2],
  ]);
});

test('two words keep the votes whose title holds both', () => {
  // Spec vote-list, "Two words".
  expect(idsOf(listShown(years, 'AHV Rente', 'all'))).toEqual([6650]);
  expect(dayOf(listShown(years, ' AHV   Rente ', 'all'), 6650)).toEqual(['2024', '3. März']);
});

test('a word is looked for in the titles of the list’s language', () => {
  // Spec vote-list, "In French".
  const french = voteList(listing, textsOf('fr'));
  expect(idsOf(listShown(french, 'mariage', 'all'))).toEqual([6470, 5960]);
  expect(idsOf(listShown(years, 'mariage', 'all'))).toEqual([]);
});

test('a word no title holds leaves no year, and no word leaves the whole list', () => {
  // Spec vote-list, "No vote left" and "The field emptied".
  expect(listShown(years, 'xyz', 'all')).toEqual([]);
  expect(listShown(years, '', 'all')).toEqual(years);
  expect(listShown(years, '  ', 'all')).toEqual(years);
});

test('the accepted and the rejected votes, the tie-break question among neither', () => {
  // Spec vote-list, "Accepted and rejected".
  const accepted = idsOf(listShown(years, '', 'yes'));
  const rejected = idsOf(listShown(years, '', 'no'));
  expect(accepted).toHaveLength(52);
  expect(rejected).toHaveLength(72);
  expect([...accepted, ...rejected]).not.toContain(6823);
  expect(idsOf(listShown(years, '', 'all'))).toContain(6823);
});

test('a word and a result apply together', () => {
  // Spec vote-list, "With a word".
  expect(idsOf(listShown(years, 'energie', 'all'))).toHaveLength(6);
  expect(idsOf(listShown(years, 'energie', 'yes'))).toEqual([6700, 6630, 6120]);
});
