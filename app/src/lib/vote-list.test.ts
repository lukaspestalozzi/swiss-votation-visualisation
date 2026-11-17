// The start page's list of votes (spec vote-list), from the list of votes the pipeline writes.
// The figures are those of investigations/data-sources.md and of the data files of 2026-11-14.
import { expect, test } from 'vitest';
import votesFile from '../../static/data/votes.json';
import { textsOf } from './texts/index.ts';
import type { Votes } from './vote-data.ts';
import { voteList } from './vote-list.ts';

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
  expect(years.flatMap((year) => year.entries)).toHaveLength(125);
});

test('the newest vote day comes first, and the votes of a day keep the order of their ids', () => {
  // 6880 and 6890 are the votes of 2026-09-27, 6860 the first of 2026-06-14.
  expect(years[0]?.entries.slice(0, 3).map((entry) => entry.id)).toEqual([6880, 6890, 6860]);
  // The three votes of 2013-03-03.
  expect(
    years
      .at(-1)
      ?.entries.slice(-3)
      .map((entry) => entry.id),
  ).toEqual([5670, 5680, 5690]);
});

function entry(id: number) {
  const found = years.flatMap((year) => year.entries).find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no entry ${String(id)}`);
  return found;
}

test('the entry of a vote that failed', () => {
  expect(entry(5960)).toMatchObject({
    date: '28.\u00a0Februar 2016',
    title: 'Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»',
    kind: 'Volksinitiative',
    result: 'abgelehnt, 49.16% Ja',
  });
});

test('the entry of a vote that passed', () => {
  expect(entry(6790)).toMatchObject({
    date: '28.\u00a0September 2025',
    kind: 'Fakultatives Referendum',
    result: 'angenommen, 50.39% Ja',
  });
});

test('the entry of the tie-break question shows its share for the initiative', () => {
  const tieBreak = entry(6823);
  expect(tieBreak).toMatchObject({
    date: '8.\u00a0März 2026',
    kind: 'Stichfrage',
    result: '37.36% für die Initiative',
  });
  expect(tieBreak.result).not.toMatch(/angenommen|abgelehnt/);
});

test('the entry shows the official result where the municipal figures differ', () => {
  // 1,884,096 yes and 1,350,325 no votes validated; the entries give 200 no votes more.
  expect(entry(6650).result).toBe('angenommen, 58.25% Ja');
});

test('the marks of the entries', () => {
  expect(entry(5960).marks).toEqual(['Hinweis']);
  // The 8 votes of 2026-03-08 and 2026-06-14.
  const provisional = years
    .flatMap((year) => year.entries)
    .filter((entry) => entry.marks.includes('vorläufig'))
    .map((entry) => entry.id);
  expect(provisional.sort((a, b) => a - b)).toEqual([
    6821, 6822, 6823, 6830, 6840, 6850, 6860, 6870,
  ]);
  expect(entry(6850).marks).toEqual(['vorläufig']);
  expect(entry(5670).marks).toEqual([]);
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
  const entryIn = (language: 'fr' | 'it', id: number) =>
    voteList(listing, textsOf(language))
      .flatMap((year) => year.entries)
      .find((entry) => entry.id === id);
  expect(entryIn('fr', 5960)).toMatchObject({
    date: '28\u00a0février 2016',
    title: 'Initiative populaire «Pour le couple et la famille - Non à la pénalisation du mariage»',
    kind: 'Initiative populaire',
    result: 'rejeté, 49.16% de oui',
  });
  expect(entryIn('it', 5960)).toMatchObject({
    date: '28\u00a0febbraio 2016',
    title:
      'Iniziativa popolare «Per il matrimonio e la famiglia - No agli svantaggi per le coppie sposate»',
    kind: 'Iniziativa popolare',
    result: 'respinto, 49.16% di sì',
  });
  expect(entryIn('fr', 6790)?.result).toBe('accepté, 50.39% de oui');
  expect(entryIn('it', 6790)?.result).toBe('accettato, 50.39% di sì');
});
