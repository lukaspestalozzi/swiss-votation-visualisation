// The comparison of two votes (spec vote-comparison), against votes.json, the files of entries and
// characteristics.json, and the figures of investigations/vote-comparison.md.
import { expect, test } from 'vitest';
import characteristicsFile from '../../static/data/characteristics.json';
import votesFile from '../../static/data/votes.json';
import municipalitiesFile from '../../static/data/municipalities.json';
import {
  comparableVotes,
  comparisonLinkOf,
  comparisonOf,
  readAnew,
  resultsOf,
  secondChoices,
  withSelection,
} from './comparison.ts';
import { applyingTo, type Definition } from './characteristics.ts';
import { labelOf, remainingUnder, trackOf } from './limits.ts';
import { voteEntriesOf } from './result-map.ts';
import { judgedOfFile } from './vote-page.ts';
import { selectionOf } from './share-link.ts';
import { textsOf } from './texts/index.ts';
import type { CharacteristicsFile, Municipalities, VoteFile, Votes } from './vote-data.ts';

const listing = votesFile as Votes;
const de = textsOf('de');
const files = import.meta.glob<VoteFile>('../../static/data/votes/*.json', {
  eager: true,
  import: 'default',
});
const fileOf = new Map(Object.values(files).map((file) => [file.id, file]));
const votes = comparableVotes(listing, (id) => fileOf.get(id), de);
const judged = new Set(votes.map((vote) => vote.id));
const characteristics = characteristicsFile as unknown as CharacteristicsFile;

/** The tracks of the characteristics for the vote of a day. */
const tracksOf = (day: string) => (definition: Definition) =>
  trackOf(definition, characteristics, applyingTo(characteristics, day));

test('the judged votes, newest first, by id within a day, without the tie-break question', () => {
  expect(votes).toHaveLength(124);
  expect(votes.map((vote) => vote.id)).not.toContain(6823);
  const order = [...votes].sort((a, b) => b.date.localeCompare(a.date) || a.id - b.id);
  expect(votes.map((vote) => vote.id)).toEqual(order.map((vote) => vote.id));
});

test('a vote as the lists and its table write it', () => {
  const vote = votes.find((candidate) => candidate.id === 5960);
  expect(vote).toMatchObject({
    choice: '28. Februar 2016 · Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»',
    title: 'Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»',
    dateAndKind: '28. Februar 2016 · Volksinitiative',
    majorities: 'voters-and-cantons',
  });
});

test("the second list: the first vote's day first, then the start page's order", () => {
  const second = secondChoices(votes, 5960).map((vote) => vote.id);
  expect(second).toHaveLength(123);
  expect(second.slice(0, 3)).toEqual([5970, 5980, 5990]);
  const sameDay = new Set([5960, 5970, 5980, 5990]);
  expect(second.slice(3)).toEqual(votes.map((vote) => vote.id).filter((id) => !sameDay.has(id)));
});

test("a vote's notes, as its page writes them", () => {
  const notesOf = (id: number) => votes.find((vote) => vote.id === id)?.notes;
  expect(notesOf(6650)).toEqual([
    "Das erwahrte Ergebnis zählt 1'350'325 Nein-Stimmen (BBl 2024 996); die Zahlen der " +
      'Gemeinden, aus denen hier gerechnet wird, ergeben 200 mehr.',
  ]);
  // A result not validated yet has no note (spec verdicts).
  expect(notesOf(6860)).toEqual([]);
  expect(notesOf(5960)).toEqual([]);
});

test("the comparison's address: the votes chosen, then the selection", () => {
  expect(comparisonLinkOf([], '')).toBe('');
  expect(comparisonLinkOf([5960], '')).toBe('votes=5960');
  expect(comparisonLinkOf([5960, 5970], 'foreigners=-19.98')).toBe(
    'votes=5960,5970&foreigners=-19.98',
  );
});

test("reading a comparison's address: the votes, then the selection on the first's tracks", () => {
  const read = comparisonOf('votes=5960,6310&foreigners=-19.98', judged);
  expect(read).toEqual({ votes: [5960, 6310], rest: 'foreigners=-19.98', unusable: [] });
  const [limit] = selectionOf(read.rest, tracksOf('2016-02-28')).limits;
  expect([limit.track.definition.key, limit.lower, limit.upper]).toEqual(['foreigners', 0, 327]);
});

test('the votes a comparison cannot use are named, and those before them apply', () => {
  const read = (link: string) => {
    const { votes, unusable } = comparisonOf(link, judged);
    return { votes, unusable };
  };
  expect(read('votes=5960,6823')).toEqual({ votes: [5960], unusable: ['votes=5960,6823'] });
  expect(read('votes=5960,9999')).toEqual({ votes: [5960], unusable: ['votes=5960,9999'] });
  expect(read('votes=5960,5960')).toEqual({ votes: [5960], unusable: ['votes=5960,5960'] });
  expect(read('votes=6823')).toEqual({ votes: [], unusable: ['votes=6823'] });
  expect(read('votes=5960,5970,5980')).toEqual({
    votes: [5960, 5970],
    unusable: ['votes=5960,5970,5980'],
  });
  expect(read('votes=abc')).toEqual({ votes: [], unusable: ['votes=abc'] });
  expect(read('votes=5960&votes=5970')).toEqual({ votes: [5960], unusable: ['votes=5970'] });
});

test('a link without votes chooses none and keeps its selection for the first vote', () => {
  expect(comparisonOf('foreigners=-19.98&abroad=no', judged)).toEqual({
    votes: [],
    rest: 'foreigners=-19.98&abroad=no',
    unusable: [],
  });
});

test('another first vote: the selection read anew on its tracks', () => {
  // investigations/vote-comparison.md, 1: 19.98% on the track of 2020-09-27 is step 346, 19.99%.
  const first = selectionOf('foreigners=-19.98', tracksOf('2016-02-28'));
  const anew = readAnew(first.limits, first.abroadCounted, tracksOf('2020-09-27'));
  expect(anew.abroadCounted).toBe(true);
  const [limit] = anew.limits;
  expect([limit.lower, limit.upper]).toEqual([0, 346]);
  expect(labelOf(limit.track, limit.lower, limit.upper, de)).toBe(
    'Ausländeranteil (Ende 2019): von 0.00% bis 19.99%',
  );
});

// The selection of investigations/vote-comparison.md, 2: "Ausländeranteil" up to step 327 of the
// vote of 2016-02-28, the Swiss abroad counted.
const kept = remainingUnder(
  characteristics.municipalities,
  selectionOf('foreigners=-19.98', tracksOf('2016-02-28')).limits,
);
const swissAbroad = Object.values((municipalitiesFile as unknown as Municipalities).swissAbroad);

/** The results of a vote as its page's rows take them, with the selection or without. */
function resultsFor(id: number, selection: boolean) {
  const vote = votes.find((candidate) => candidate.id === id);
  const file = fileOf.get(id);
  if (vote === undefined || file === undefined) throw new Error(`no vote ${String(id)}`);
  const real = judgedOfFile(`vote ${String(id)}`, file, vote.majorities, de);
  const entries = voteEntriesOf(file, characteristics.municipalities, swissAbroad);
  const selected = selection ? withSelection(entries, vote.majorities, kept, true, de) : null;
  return resultsOf(real, selected, de);
}

/**
 * The same results as a table of text: a column for each result, under its heading, and a row
 * for each of its figures and words.
 */
function tableFor(
  id: number,
  selection: boolean,
): { table: string[][]; columns: readonly string[]; count: string | null } {
  const { rows, count } = resultsFor(id, selection);
  const row = (heading: string, of: (result: (typeof rows)[number]['result']) => string) => [
    heading,
    ...rows.map(({ result }) => of(result)),
  ];
  const verdict = (index: 0 | 1) => (result: (typeof rows)[number]['result']) =>
    `${result.verdicts[index].verdict} ${result.verdicts[index].figure}`;
  return {
    columns: rows.map(({ heading }) => heading),
    table: [
      row('Ja-Stimmen', (result) => result.yesVotes),
      row('Nein-Stimmen', (result) => result.noVotes),
      row('Ja-Anteil', (result) => result.verdicts[0].figure),
      row('Volksmehr', verdict(0)),
      row('Ständemehr', verdict(1)),
      row('Vorlage', (result) => result.outcome),
    ],
    count,
  };
}

test("a vote's results as its page takes them: the real one with the turnout, then the selection's", () => {
  // Spec vote-comparison, "The results of a vote"; the turnout is that of the vote's page.
  const { rows } = resultsFor(5960, true);
  expect(rows.map(({ heading, turnout, selection }) => [heading, turnout, selection])).toEqual([
    ['Echtes Ergebnis', '63.25%', false],
    ['Mit Ihrer Auswahl', null, true],
  ]);
  // What a row's bars draw: the yes share, and a segment for each canton with a vote left. With
  // the selection a half canton has none: 18 : 4½ cantonal votes, of 23.
  expect(rows[0]?.result.yesPercent).toBeCloseTo((1609152 / (1609152 + 1664224)) * 100, 10);
  expect(rows[1]?.result.yesPercent).toBeCloseTo((733402 / (733402 + 664373)) * 100, 10);
  expect(rows.map(({ result }) => result.segments.length)).toEqual([26, 25]);
});

test('the table of the first vote, real and with the selection', () => {
  expect(tableFor(5960, true)).toEqual({
    columns: ['Echtes Ergebnis', 'Mit Ihrer Auswahl'],
    table: [
      ['Ja-Stimmen', "1'609'152", "733'402"],
      ['Nein-Stimmen', "1'664'224", "664'373"],
      ['Ja-Anteil', '49.16%', '52.47%'],
      ['Volksmehr', 'Nein 49.16%', 'Ja 52.47%'],
      ['Ständemehr', 'Ja 16½ : 6½', 'Ja 18 : 4½'],
      ['Vorlage', 'Abgelehnt', 'Angenommen'],
    ],
    count: "In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis.",
  });
});

test('the second vote of the same day, with the same municipalities', () => {
  const { table, count } = tableFor(5970, true);
  expect(table.map((row) => row[2])).toEqual([
    "654'548",
    "769'763",
    '45.96%',
    'Nein 45.96%',
    'Nein 8½ : 14',
    'Abgelehnt',
  ]);
  expect(count).toBe("In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis.");
});

test('a second vote years apart, with the municipalities the first vote keeps', () => {
  const { table, count } = tableFor(6310, true);
  expect(table.map((row) => row[2])).toEqual([
    "603'173",
    "796'237",
    '43.10%',
    'Nein 43.10%',
    'Nein 4½ : 18',
    'Abgelehnt',
  ]);
  expect(count).toBe("In der Auswahl: 1'456 von 2'104 Gemeinden mit eigenem Ergebnis.");
});

test('without a selection, one column and no count', () => {
  const { columns, table, count } = tableFor(5970, false);
  expect(columns).toEqual(['Echtes Ergebnis']);
  expect(table.map((row) => row.length)).toEqual([2, 2, 2, 2, 2, 2]);
  expect(table.map((row) => row[1])).toEqual([
    "1'375'098",
    "1'966'965",
    '41.15%',
    'Nein 41.15%',
    'Nein 4½ : 18½',
    'Abgelehnt',
  ]);
  expect(count).toBeNull();
});
