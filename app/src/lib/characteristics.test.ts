// The characteristics of the municipalities (spec characteristics), against the data file and
// the figures of investigations/characteristics.md.
import { expect, test } from 'vitest';
import { DEFINITIONS, applyingTo } from './characteristics.ts';
import type { CharacteristicsFile } from './vote-data.ts';

test('the 21 characteristics have their names, in the order of the spec', () => {
  expect(DEFINITIONS.map((definition) => definition.name)).toEqual([
    'Einwohner',
    'Ausländeranteil',
    '0–17 Jahre',
    '18–34 Jahre',
    '35–49 Jahre',
    '50–64 Jahre',
    '65 Jahre und älter',
    'Einwohner je km²',
    'FDP',
    'Die Mitte (bis 2020 CVP und BDP)',
    'SP',
    'SVP',
    'GLP',
    'Grüne',
    'Übrige Parteien',
    'Deutsch',
    'Französisch',
    'Italienisch',
    'Rätoromanisch',
    'Fläche',
    'Rinder je Einwohner',
  ]);
});

// A data file whose newest population and cattle are of 2025, as when the BFS has not yet
// published 2026's; two municipalities.
const MADE_UP: CharacteristicsFile = {
  referenceDate: '2026-01-01',
  municipalities: [1, 2],
  population: {
    years: [2024, 2025],
    counts: [
      [
        [10, 1, 2, 2, 2, 2, 2],
        [20, 2, 4, 4, 4, 4, 4],
      ],
      [
        [11, 1, 3, 2, 2, 2, 2],
        [21, 2, 5, 4, 4, 4, 4],
      ],
    ],
  },
  elections: [{ year: 2023, day: '2023-10-22', votes: [[1, 1, 1, 1, 1, 1, 1], null] }],
  cattle: {
    years: [2024, 2025],
    counts: [
      [5, 0],
      [6, 0],
    ],
  },
  languages2000: [
    [9, 8, 1, 0, 0],
    [18, 16, 2, 0, 0],
  ],
  area: [100, 200],
};

test('a vote before the year before is published takes the newest year', () => {
  const applying = applyingTo(MADE_UP, '2027-03-07');
  expect(applying.populationYear).toBe(2025);
  expect(applying.cattleYear).toBe(2025);
  expect(applying.election.year).toBe(2023);
});
