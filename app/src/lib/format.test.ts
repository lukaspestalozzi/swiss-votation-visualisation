import { expect, test } from 'vitest';
import {
  formatCantonalVotes,
  formatCount,
  formatDate,
  formatQuotient,
  formatShare,
  formatUnits,
} from './format.ts';
import { textsOf } from './texts/index.ts';

const de = textsOf('de');
const fr = textsOf('fr');
const it = textsOf('it');

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
  expect(formatDate('2016-02-28', de)).toBe('28. Februar 2016');
  expect(formatDate('2026-03-08', de)).toBe('8. März 2026');
  expect(formatDate('2013-12-01', de)).toBe('1. Dezember 2013');
});

test('a date in each language', () => {
  // Spec vote-list, "How dates and numbers are written".
  const dates = ['2016-02-28', '2026-03-08'];
  expect(dates.map((date) => formatDate(date, de))).toEqual(['28. Februar 2016', '8. März 2026']);
  expect(dates.map((date) => formatDate(date, fr))).toEqual(['28 février 2016', '8 mars 2026']);
  expect(dates.map((date) => formatDate(date, it))).toEqual(['28 febbraio 2016', '8 marzo 2026']);
});

test('the first day of a month: "1.", "1er" and "1°"', () => {
  // Spec vote-list, as the Constitution's footnotes write it (investigations/languages.md, 6).
  expect(formatDate('2008-06-01', de)).toBe('1. Juni 2008');
  expect(formatDate('2008-06-01', fr)).toBe('1er juin 2008');
  expect(formatDate('2008-06-01', it)).toBe('1° giugno 2008');
});

test('a quotient without decimals is grouped like a count', () => {
  // Zürich's inhabitants per km² at the end of 2015: 396,955 on 9,188 ha.
  expect(formatQuotient(100 * 396955, 9188, 0)).toBe("4'320");
});

test('a quotient with two decimals', () => {
  // Meienried's area: 65 ha.
  expect(formatQuotient(65, 100, 2)).toBe('0.65');
  expect(formatQuotient(9188, 100, 2)).toBe('91.88');
  expect(formatQuotient(905, 100, 2)).toBe('9.05');
});

test('a quotient with three decimals is rounded half away from zero', () => {
  // Cattle per inhabitant at the end of 2015: Meienried 131 on 52, Zürich 850 on 396,955.
  expect(formatQuotient(131, 52, 3)).toBe('2.519');
  expect(formatQuotient(850, 396955, 3)).toBe('0.002');
  expect(formatQuotient(1, 2000, 3)).toBe('0.001');
  expect(formatQuotient(1, 2001, 3)).toBe('0.000');
});

test('a whole number of units is written with its decimals, grouped like a count', () => {
  // A limit's bound (design of add-limits, decision 16): 19.98%, 0.05, 1.000 and 396'955.
  expect(formatUnits(1998, 2)).toBe('19.98');
  expect(formatUnits(0, 2)).toBe('0.00');
  expect(formatUnits(5, 2)).toBe('0.05');
  expect(formatUnits(1000, 3)).toBe('1.000');
  expect(formatUnits(396955, 0)).toBe("396'955");
  expect(formatUnits(1234567, 2)).toBe("12'345.67");
  expect(() => formatUnits(19.5, 2)).toThrow(RangeError);
});
