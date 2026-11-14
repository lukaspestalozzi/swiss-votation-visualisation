import { expect, test } from 'vitest';
import { majoritiesNeeded } from './kinds.ts';

test('a popular initiative needs both majorities', () => {
  expect(majoritiesNeeded('popular-initiative')).toBe('voters-and-cantons');
});

test('a mandatory referendum needs both majorities', () => {
  expect(majoritiesNeeded('mandatory-referendum')).toBe('voters-and-cantons');
});

test('a popular initiative with a counter-proposal needs both majorities', () => {
  expect(majoritiesNeeded('initiative-with-counter-proposal')).toBe('voters-and-cantons');
});

test('a counter-proposal needs both majorities', () => {
  expect(majoritiesNeeded('counter-proposal')).toBe('voters-and-cantons');
});

test('an optional referendum needs the majority of voters only', () => {
  expect(majoritiesNeeded('optional-referendum')).toBe('voters');
});

test('a tie-break question is not calculated', () => {
  expect(majoritiesNeeded('tie-break-question')).toBe('not-calculated');
});
