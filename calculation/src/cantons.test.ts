import { expect, test } from 'vitest';
import { CANTONS, totalCantonalVotes } from './cantons.ts';

test('the 26 cantons in the order of the constitution', () => {
  expect(CANTONS.map((canton) => canton.abbreviation)).toEqual([
    'ZH',
    'BE',
    'LU',
    'UR',
    'SZ',
    'OW',
    'NW',
    'GL',
    'ZG',
    'FR',
    'SO',
    'BS',
    'BL',
    'SH',
    'AR',
    'AI',
    'SG',
    'GR',
    'AG',
    'TG',
    'TI',
    'VD',
    'VS',
    'NE',
    'GE',
    'JU',
  ]);
});

function cantonalVotesOf(abbreviation: string): number | undefined {
  return CANTONS.find((canton) => canton.abbreviation === abbreviation)?.cantonalVotes;
}

const HALF_VOTE_CANTONS = ['OW', 'NW', 'BS', 'BL', 'AR', 'AI'];

test('six cantons have half a vote', () => {
  expect(HALF_VOTE_CANTONS.map(cantonalVotesOf)).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
});

test('every other canton has one vote', () => {
  const others = CANTONS.filter((canton) => !HALF_VOTE_CANTONS.includes(canton.abbreviation));
  expect(others).toHaveLength(20);
  expect(others.map((canton) => canton.cantonalVotes)).toEqual(Array<number>(20).fill(1));
});

test('Schaffhausen and Appenzell Ausserrhoden are not swapped', () => {
  expect(cantonalVotesOf('SH')).toBe(1);
  expect(cantonalVotesOf('AR')).toBe(0.5);
});

test('all cantons together have 23 cantonal votes', () => {
  expect(totalCantonalVotes(CANTONS)).toBe(24);
});
