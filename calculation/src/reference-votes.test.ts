// The official figures are those of investigations/data-sources.md, "Reference values" and
// "Reference data for the calculation". The entries are in reference-votes.json.
import { expect, test } from 'vitest';
import reference from './reference-votes.json' with { type: 'json' };
import { calculateResult, type Entry, type Result } from './result.ts';

/** All entries of a reference vote, by the Federal Chancellery's number. */
function entriesOf(number: number): Entry[] {
  const vote = reference.votes.find((candidate) => candidate.number === number);
  if (!vote) {
    throw new Error(`there is no reference vote with the number ${String(number)}`);
  }
  return Object.entries(vote.entries).flatMap(([canton, rows]) =>
    rows.map((row) => {
      const [, yes, no] = row;
      if (yes === undefined || no === undefined) {
        throw new Error(`an entry of ${canton} in vote ${String(number)} is not [number, yes, no]`);
      }
      return { canton, yes, no };
    }),
  );
}

/** How far the yes share is from the expected percentage, in percentage points. */
function distanceFromPercent(result: Result, expected: number): number {
  if (result.yesShare === undefined) {
    throw new Error('the result has no yes share');
  }
  return Math.abs(result.yesShare * 100 - expected);
}

const TOLERANCE = 0.00005;

test('2016-02-28, number 596, popular initiative: failed, the cantons in favour', () => {
  const entries = entriesOf(596);
  expect(entries).toHaveLength(2115);
  const result = calculateResult(entries, 'voters-and-cantons');
  expect(result.yes).toBe(1609152);
  expect(result.no).toBe(1664224);
  expect(result.valid).toBe(3273376);
  expect(distanceFromPercent(result, 49.1588)).toBeLessThan(TOLERANCE);
  expect(result.cantonalVotesInFavour).toBe(16.5);
  expect(result.cantonalVotesAgainst).toBe(6.5);
  expect(result.majorityOfCantons).toBe(true);
  expect(result.majorityOfVoters).toBe(false);
  expect(result.passed).toBe(false);
});

test('2013-03-03, number 567, mandatory referendum: failed, the cantons against', () => {
  const entries = entriesOf(567);
  expect(entries).toHaveLength(2114);
  const result = calculateResult(entries, 'voters-and-cantons');
  expect(result.yes).toBe(1283951);
  expect(result.no).toBe(1078531);
  expect(result.cantonalVotesInFavour).toBe(10);
  expect(result.cantonalVotesAgainst).toBe(13);
  expect(result.majorityOfVoters).toBe(true);
  expect(result.majorityOfCantons).toBe(false);
  expect(result.passed).toBe(false);
});

test('2013-03-03, number 568, popular initiative: passed with both majorities', () => {
  const entries = entriesOf(568);
  expect(entries).toHaveLength(2114);
  const result = calculateResult(entries, 'voters-and-cantons');
  expect(result.yes).toBe(1616184);
  expect(result.no).toBe(761975);
  expect(result.cantonalVotesInFavour).toBe(23);
  expect(result.cantonalVotesAgainst).toBe(0);
  expect(result.passed).toBe(true);
});

test('2015-06-14, number 595, optional referendum: passed by a few thousand votes', () => {
  const entries = entriesOf(595);
  expect(entries).toHaveLength(2115);
  const result = calculateResult(entries, 'voters');
  expect(result.yes).toBe(1128522);
  expect(result.no).toBe(1124873);
  expect(result.majorityOfVoters).toBe(true);
  expect(result.passed).toBe(true);
  // No source publishes cantonal votes for this vote: these are calculated from the entries.
  expect(result.cantonalVotesInFavour).toBe(6.5);
  expect(result.cantonalVotesAgainst).toBe(16.5);
});

test('2017-09-24, number 614, mandatory referendum: failed by a few thousand votes', () => {
  const entries = entriesOf(614);
  expect(entries).toHaveLength(2115);
  const result = calculateResult(entries, 'voters-and-cantons');
  expect(result.yes).toBe(1254795);
  expect(result.no).toBe(1257156);
  expect(result.cantonalVotesInFavour).toBe(9.5);
  expect(result.cantonalVotesAgainst).toBe(13.5);
  expect(result.majorityOfVoters).toBe(false);
  expect(result.passed).toBe(false);
});

test('2020-11-29, number 636, popular initiative: failed, the cantons against', () => {
  const entries = entriesOf(636);
  expect(entries).toHaveLength(2116);
  const result = calculateResult(entries, 'voters-and-cantons');
  expect(result.yes).toBe(1299129);
  expect(result.no).toBe(1261680);
  expect(result.cantonalVotesInFavour).toBe(8.5);
  expect(result.cantonalVotesAgainst).toBe(14.5);
  expect(result.majorityOfVoters).toBe(true);
  expect(result.majorityOfCantons).toBe(false);
  expect(result.passed).toBe(false);
});

test('2025-09-28, number 679, optional referendum: passed although the cantons are against', () => {
  const entries = entriesOf(679);
  expect(entries).toHaveLength(2117);
  const result = calculateResult(entries, 'voters');
  expect(result.yes).toBe(1384586);
  expect(result.no).toBe(1363362);
  expect(result.cantonalVotesInFavour).toBe(7.5);
  expect(result.cantonalVotesAgainst).toBe(15.5);
  expect(result.majorityOfCantons).toBe(false);
  expect(result.passed).toBe(true);
});

test('number 596, only the canton of Zürich: its Swiss abroad count for the canton', () => {
  const entries = entriesOf(596).filter((entry) => entry.canton === 'ZH');
  expect(entries).toHaveLength(161);
  const result = calculateResult(entries, 'voters-and-cantons');
  expect(result.yes).toBe(253697);
  expect(result.no).toBe(329992);
  expect(result.cantonalVotesInFavour).toBe(0);
  expect(result.cantonalVotesAgainst).toBe(1);
});

test('number 596, without the canton of Zürich: passed', () => {
  const entries = entriesOf(596).filter((entry) => entry.canton !== 'ZH');
  const result = calculateResult(entries, 'voters-and-cantons');
  expect(result.yes).toBe(1355455);
  expect(result.no).toBe(1334232);
  expect(result.valid).toBe(2689687);
  expect(distanceFromPercent(result, 50.3945)).toBeLessThan(TOLERANCE);
  expect(result.cantonalVotesInFavour).toBe(16.5);
  expect(result.cantonalVotesAgainst).toBe(5.5);
  expect(result.passed).toBe(true);
});

test('number 596: the order of the entries does not matter', () => {
  const entries = entriesOf(596);
  expect(calculateResult(entries.toReversed(), 'voters-and-cantons')).toEqual(
    calculateResult(entries, 'voters-and-cantons'),
  );
});
