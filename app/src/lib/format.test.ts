import { expect, test } from 'vitest';
import { formatCantonalVotes, formatCount, formatDate, formatShare } from './format.ts';

test('a count is grouped by three with an apostrophe', () => {
  expect(formatCount(1609152)).toBe("1'609'152");
  expect(formatCount(0)).toBe('0');
  expect(formatCount(999)).toBe('999');
  expect(formatCount(1000)).toBe("1'000");
});

test('a share is written as percent with two decimals', () => {
  expect(formatShare(1609152, 3273376)).toBe('49.16%');
  expect(formatShare(1098341, 2939549)).toBe('37.36%');
  expect(formatShare(253697, 583689)).toBe('43.46%');
});

test('a share is rounded half away from zero', () => {
  expect(formatShare(1, 8)).toBe('12.50%');
  expect(formatShare(1, 16000)).toBe('0.01%');
  expect(formatShare(0, 0)).toBe('–');
});

test('cantonal votes are written with a half as ½', () => {
  expect(formatCantonalVotes(16.5)).toBe('16½');
  expect(formatCantonalVotes(6.5)).toBe('6½');
  expect(formatCantonalVotes(10)).toBe('10');
  expect(formatCantonalVotes(0.5)).toBe('½');
  expect(formatCantonalVotes(0)).toBe('0');
});

test('a date is written with the German name of its month', () => {
  expect(formatDate('2016-02-28')).toBe('28. Februar 2016');
  expect(formatDate('2026-03-08')).toBe('8. März 2026');
  expect(formatDate('2013-12-01')).toBe('1. Dezember 2013');
});
