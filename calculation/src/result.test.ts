import { expect, test } from 'vitest';
import { calculateResult, type Entry } from './result.ts';

function entry(canton: string, yes: number, no: number): Entry {
  return { canton, yes, no };
}

test('the votes and the yes share', () => {
  const result = calculateResult([entry('ZH', 60, 40), entry('BE', 30, 70)], 'voters');
  expect(result.yes).toBe(90);
  expect(result.no).toBe(110);
  expect(result.valid).toBe(200);
  expect(result.yesShare).toBe(0.45);
});

test('a canton with as many yes as no votes counts against', () => {
  const result = calculateResult([entry('UR', 60, 40), entry('UR', 40, 60)], 'voters-and-cantons');
  expect(result.cantonalVotesInFavour).toBe(0);
  expect(result.cantonalVotesAgainst).toBe(1);
});

test('a canton with half a vote', () => {
  const result = calculateResult([entry('OW', 60, 40)], 'voters-and-cantons');
  expect(result.cantonalVotesInFavour).toBe(0.5);
  expect(result.cantonalVotesAgainst).toBe(0);
});

test('a canton whose entries have no vote counts against', () => {
  const result = calculateResult([entry('UR', 0, 0)], 'voters-and-cantons');
  expect(result.cantonalVotesInFavour).toBe(0);
  expect(result.cantonalVotesAgainst).toBe(1);
});

test('as many yes as no votes: no majority of voters', () => {
  const result = calculateResult([entry('ZH', 500, 500)], 'voters');
  expect(result.majorityOfVoters).toBe(false);
});

test('the cantonal votes split evenly: no majority of cantons', () => {
  const inFavour = ['ZH', 'BE', 'LU', 'UR', 'SZ', 'GL', 'ZG', 'FR', 'SO', 'SH', 'SG', 'AR'];
  const against = [
    'OW',
    'NW',
    'BS',
    'BL',
    'AI',
    'GR',
    'AG',
    'TG',
    'TI',
    'VD',
    'VS',
    'NE',
    'GE',
    'JU',
  ];
  const result = calculateResult(
    [
      ...inFavour.map((canton) => entry(canton, 60, 40)),
      ...against.map((canton) => entry(canton, 40, 60)),
    ],
    'voters-and-cantons',
  );
  expect(result.cantonalVotesInFavour).toBe(11.5);
  expect(result.cantonalVotesAgainst).toBe(11.5);
  expect(result.majorityOfCantons).toBe(false);
});

test('fewer cantons remain', () => {
  const result = calculateResult(
    [entry('ZH', 60, 40), entry('BE', 60, 40), entry('LU', 40, 60)],
    'voters-and-cantons',
  );
  expect(result.cantonalVotesInFavour).toBe(2);
  expect(result.cantonalVotesAgainst).toBe(1);
  expect(result.majorityOfCantons).toBe(true);
});

test('the verdict needs the cantons only where the kind does', () => {
  const entries = [entry('ZH', 100, 10), entry('BE', 10, 20), entry('LU', 10, 20)];
  expect(calculateResult(entries, 'voters-and-cantons').passed).toBe(false);
  expect(calculateResult(entries, 'voters').passed).toBe(true);
});

test('nothing remains', () => {
  for (const majorities of ['voters-and-cantons', 'voters'] as const) {
    expect(calculateResult([], majorities)).toEqual({
      yes: 0,
      no: 0,
      valid: 0,
      yesShare: undefined,
      cantonalVotesInFavour: 0,
      cantonalVotesAgainst: 0,
      majorityOfVoters: false,
      majorityOfCantons: false,
      passed: false,
    });
  }
});

test('a canton that does not exist', () => {
  const entries = [entry('ZH', 60, 40), entry('XX', 1, 1)];
  expect(() => calculateResult(entries, 'voters')).toThrow(RangeError);
  expect(() => calculateResult(entries, 'voters')).toThrow(/XX/);
});

test('votes below zero', () => {
  const entries = [entry('ZH', 60, 40), entry('UR', -1, 5)];
  expect(() => calculateResult(entries, 'voters')).toThrow(RangeError);
  expect(() => calculateResult(entries, 'voters')).toThrow(/UR/);
});

test('votes that are not whole', () => {
  const entries = [entry('ZH', 60, 40), entry('UR', 5, 1.5)];
  expect(() => calculateResult(entries, 'voters')).toThrow(RangeError);
  expect(() => calculateResult(entries, 'voters')).toThrow(/UR/);
});
