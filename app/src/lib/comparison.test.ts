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
  secondChoices,
  tableOf,
  withSelection,
  type VoteTable,
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
  expect(notesOf(6860)).toEqual(['Vorläufiges Ergebnis: vom Bundesrat noch nicht erwahrt.']);
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

/** The table of a vote, with the selection or without, as rows of text. */
function tableFor(
  id: number,
  selection: boolean,
): { table: string[][]; columns: readonly string[]; count: string | null } {
  const vote = votes.find((candidate) => candidate.id === id);
  const file = fileOf.get(id);
  if (vote === undefined || file === undefined) throw new Error(`no vote ${String(id)}`);
  const real = judgedOfFile(`vote ${String(id)}`, file, vote.majorities, de);
  const entries = voteEntriesOf(file, characteristics.municipalities, swissAbroad);
  const selected = selection ? withSelection(entries, vote.majorities, kept, true, de) : null;
  const table: VoteTable = tableOf(real, selected, de);
  return {
    columns: table.columns,
    table: table.rows.map((row) => [
      row.heading,
      ...row.cells.map((cell) =>
        cell.figure === null ? cell.word : `${cell.word} ${cell.figure}`,
      ),
    ]),
    count: table.count,
  };
}

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
