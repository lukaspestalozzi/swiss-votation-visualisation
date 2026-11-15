// The map's logic (spec result-map). The municipal figures are those of
// investigations/map-data.md, "Municipal figures".
import { expect, test } from 'vitest';
import { colouringOf } from './result-map.ts';

test('named municipalities of 2016-02-28: the side and the class', () => {
  expect(colouringOf(432, 550)).toEqual({ side: 'no', step: 1 }); // Aeugst am Albis, 56.0% no
  expect(colouringOf(46565, 99614)).toEqual({ side: 'no', step: 2 }); // Zürich, 68.1% no
  expect(colouringOf(15928, 41756)).toEqual({ side: 'no', step: 3 }); // Bern, 72.4% no
  expect(colouringOf(95, 25)).toEqual({ side: 'yes', step: 3 }); // Wachseldorn, 79.2% yes
});

test('a share on the boundary of a class is in the higher class', () => {
  expect(colouringOf(272, 408)).toEqual({ side: 'no', step: 2 }); // Flurlingen, exactly 60% no
  expect(colouringOf(324, 216)).toEqual({ side: 'yes', step: 2 }); // Bettingen, exactly 60% yes
  expect(colouringOf(200, 50)).toEqual({ side: 'yes', step: 4 }); // Romainmôtier-Envy, 80% yes
});

test('the clearest classes, of 2024-03-03', () => {
  expect(colouringOf(61, 3)).toEqual({ side: 'yes', step: 4 }); // Les Enfers, 95.3% yes
  expect(colouringOf(39, 161)).toEqual({ side: 'no', step: 4 }); // Isenthal, 80.5% no
});

test('as many yes as no votes, also none of either, is a tie', () => {
  expect(colouringOf(2111, 2111)).toBe('tie'); // Hünenberg on 2016-02-28
  expect(colouringOf(0, 0)).toBe('tie');
});
