// The selection (spec limits, "Which municipalities remain" and "The Swiss abroad"), with
// made-up numbers. The figures of a named vote are those of investigations/limits.md.
import { expect, test } from 'vitest';
import reference from './reference-votes.json' with { type: 'json' };
import { calculateResult } from './result.ts';
import { entriesThatRemain, remainingMunicipalities, type CantonEntries } from './selection.ts';

test('a bound is included', () => {
  const remaining = remainingMunicipalities(
    [1, 2, 3],
    [{ values: [1000, 2000, 3001], lower: 1000, upper: 3000 }],
  );
  expect([...remaining]).toEqual([1, 2]);
});

test('a narrowed limit sets aside a municipality without a figure', () => {
  const remaining = remainingMunicipalities(
    [1, 2, 3],
    [{ values: [1000, null, 3000], lower: 1000, upper: 2999 }],
  );
  expect([...remaining]).toEqual([1]);
});

test('a limit at the ends of its values sets nothing aside, not even without a figure', () => {
  const remaining = remainingMunicipalities(
    [1, 2, 3],
    [{ values: [1000, null, 3000], lower: 1000, upper: 3000 }],
  );
  expect([...remaining]).toEqual([1, 2, 3]);
});

test('two limits keep only what lies within both', () => {
  const remaining = remainingMunicipalities(
    [1, 2, 3, 4],
    [
      { values: [10, 20, 30, 40], lower: 20, upper: 40 },
      { values: [5, 6, 7, 8], lower: 5, upper: 7 },
    ],
  );
  expect([...remaining]).toEqual([2, 3]);
});

test('no limit keeps every municipality', () => {
  expect([...remainingMunicipalities([1, 2, 3], [])]).toEqual([1, 2, 3]);
});

test('a limit whose values do not match the municipalities is refused', () => {
  expect(() =>
    remainingMunicipalities([1, 2, 3], [{ values: [1000, 2000], lower: 1000, upper: 1500 }]),
  ).toThrow(/2 values for 3 municipalities/);
});

// Two cantons: ZH with two municipalities and its Swiss abroad, BE with one municipality and its
// Swiss abroad.
const CANTONS: CantonEntries[] = [
  {
    canton: 'ZH',
    municipalities: [
      [1, 60, 40],
      [2, 30, 70],
    ],
    abroad: [5, 3],
  },
  { canton: 'BE', municipalities: [[351, 20, 80]], abroad: [4, 6] },
];

test('with the switch on, a canton with a municipality left keeps its Swiss abroad', () => {
  expect(entriesThatRemain(CANTONS, new Set([1, 351]), true)).toEqual([
    { canton: 'ZH', yes: 60, no: 40 },
    { canton: 'ZH', yes: 5, no: 3 },
    { canton: 'BE', yes: 20, no: 80 },
    { canton: 'BE', yes: 4, no: 6 },
  ]);
});

test('a canton with no municipality left loses its Swiss abroad', () => {
  expect(entriesThatRemain(CANTONS, new Set([2]), true)).toEqual([
    { canton: 'ZH', yes: 30, no: 70 },
    { canton: 'ZH', yes: 5, no: 3 },
  ]);
});

test('with the switch off, no Swiss abroad remain', () => {
  expect(entriesThatRemain(CANTONS, new Set([1, 2, 351]), false)).toEqual([
    { canton: 'ZH', yes: 60, no: 40 },
    { canton: 'ZH', yes: 30, no: 70 },
    { canton: 'BE', yes: 20, no: 80 },
  ]);
});

test('with nothing left there is no entry, and the vote has failed', () => {
  const entries = entriesThatRemain(CANTONS, new Set(), true);
  expect(entries).toEqual([]);
  const result = calculateResult(entries, 'voters-and-cantons');
  expect(result.passed).toBe(false);
  expect(result.cantonalVotesInFavour + result.cantonalVotesAgainst).toBe(0);
});

// The BFS numbers the Swiss abroad of a canton from 9000 up (9010 for ZH to 9250 for GE in the
// app's municipalities.json); the municipalities lie below.
const FIRST_SWISS_ABROAD = 9000;

test('2015-06-14, number 595: without the Swiss abroad the vote fails', () => {
  const vote = reference.votes.find((candidate) => candidate.number === 595);
  if (vote === undefined) throw new Error('there is no reference vote 595');
  const cantons: CantonEntries[] = Object.entries(vote.entries).map(([canton, rows]) => {
    const triples = rows.map((row): [number, number, number] => {
      const [number, yes, no] = row;
      if (number === undefined || yes === undefined || no === undefined) {
        throw new Error(`an entry of ${canton} is not [number, yes, no]`);
      }
      return [number, yes, no];
    });
    const abroad = triples.find(([number]) => number >= FIRST_SWISS_ABROAD);
    return {
      canton,
      municipalities: triples.filter(([number]) => number < FIRST_SWISS_ABROAD),
      abroad: abroad === undefined ? null : [abroad[1], abroad[2]],
    };
  });
  const all = new Set(cantons.flatMap((c) => c.municipalities.map(([number]) => number)));

  const counted = calculateResult(entriesThatRemain(cantons, all, true), 'voters');
  expect([counted.yes, counted.no, counted.passed]).toEqual([1128522, 1124873, true]);

  const without = calculateResult(entriesThatRemain(cantons, all, false), 'voters');
  expect([without.yes, without.no]).toEqual([1107734, 1113998]);
  expect(without.majorityOfVoters).toBe(false);
  expect(without.passed).toBe(false);
});
