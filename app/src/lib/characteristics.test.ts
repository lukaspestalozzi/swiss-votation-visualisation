// The characteristics of the municipalities (spec characteristics), against the data file and
// the figures of investigations/characteristics.md.
import { expect, test } from 'vitest';
import characteristicsFile from '../../static/data/characteristics.json';
import {
  DEFINITIONS,
  applyingTo,
  countsOf,
  nameOf,
  written,
  type Definition,
  type Quotient,
} from './characteristics.ts';
import { formatCount, formatQuotient, formatShare } from './format.ts';
import { textsOf } from './texts/index.ts';
import type { CharacteristicsFile } from './vote-data.ts';

const de = textsOf('de');

test('the 21 characteristics have their names, in the order of the spec', () => {
  expect(DEFINITIONS.map((definition) => nameOf(definition, de))).toEqual([
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

test('the cattle take the newest year before the vote that also has the population', () => {
  // The cattle of 2026 are published before the population at the end of 2026.
  const file: CharacteristicsFile = {
    ...MADE_UP,
    cattle: { years: [2024, 2025, 2026], counts: [...MADE_UP.cattle.counts, [7, 0]] },
  };
  const applying = applyingTo(file, '2027-03-07');
  expect([applying.populationYear, applying.cattleYear]).toEqual([2025, 2025]);
});

test('the cattle per inhabitant count the inhabitants of the cattle year', () => {
  // The population at the end of 2025 is published before the cattle of 2025.
  const file: CharacteristicsFile = {
    ...MADE_UP,
    cattle: { years: [2024], counts: [MADE_UP.cattle.counts[0]] },
  };
  const applying = applyingTo(file, '2026-03-08');
  expect([applying.populationYear, applying.cattleYear]).toEqual([2025, 2024]);
  const cattle = DEFINITIONS[20];
  expect(nameOf(cattle, de)).toBe('Rinder je Einwohner');
  expect(cattle.value(countsOf(file, applying, 1))).toEqual({ part: 5, whole: 10 });
});

// The real data file, as the page reads it.
const REAL = characteristicsFile as unknown as CharacteristicsFile;

test('the vote of 2016-02-28 takes 2015 and the election of 2015', () => {
  const applying = applyingTo(REAL, '2016-02-28'); // 5960
  expect([applying.populationYear, applying.cattleYear]).toEqual([2015, 2015]);
  expect(applying.election.day).toBe('2015-10-18');
});

test("a vote before the year's election takes the one before", () => {
  const applying = applyingTo(REAL, '2015-06-14'); // 5920
  expect([applying.populationYear, applying.cattleYear]).toEqual([2014, 2014]);
  expect(applying.election.day).toBe('2011-10-23');
});

test('the newest vote day takes 2025 and the election of 2023', () => {
  const applying = applyingTo(REAL, '2026-03-08'); // 6850
  expect([applying.populationYear, applying.cattleYear]).toEqual([2025, 2025]);
  expect(applying.election.day).toBe('2023-10-22');
});

function valuesOf(number: number, voteDate: string): (Quotient | null)[] {
  const applying = applyingTo(REAL, voteDate);
  return DEFINITIONS.map((definition) => definition.value(countsOf(REAL, applying, number)));
}

function percent(value: Quotient | null): number {
  if (value === null) throw new Error('no figure');
  return (100 * value.part) / value.whole;
}

test('Zürich for the vote of 2016-02-28: its 21 values', () => {
  const values = valuesOf(261, '2016-02-28');
  expect(values.slice(0, 8)).toEqual([
    { part: 396955, whole: 1 },
    { part: 127151, whole: 396955 },
    { part: 61020, whole: 396955 },
    { part: 107696, whole: 396955 },
    { part: 100857, whole: 396955 },
    { part: 65204, whole: 396955 },
    { part: 62178, whole: 396955 },
    { part: 39695500, whole: 9188 },
  ]);
  expect(values.slice(8, 15).map((value) => value?.part)).toEqual([
    534433, 219313, 1200367, 680944, 350053, 404927, 408072,
  ]);
  expect(values.slice(8, 15).map((value) => value?.whole)).toEqual(Array(7).fill(3798109));
  expect(values.slice(15, 19)).toEqual([
    { part: 282277, whole: 363273 },
    { part: 7746, whole: 363273 },
    { part: 17063, whole: 363273 },
    { part: 990, whole: 363273 },
  ]);
  expect(values.slice(19)).toEqual([
    { part: 9188, whole: 100 },
    { part: 850, whole: 396955 },
  ]);
  // The shares of investigations/characteristics.md, within 0.00005 points.
  const shares = [32.0316, 15.372, 27.1305, 25.4077, 16.426, 15.6637];
  shares.forEach((share, i) => {
    expect(percent(values[1 + i] ?? null)).toBeCloseTo(share, 4);
  });
  expect(percent(values[9] ?? null)).toBeCloseTo(5.7743, 4);
  expect(percent(values[15] ?? null)).toBeCloseTo(77.7038, 4);
});

test('a merged municipality has the inhabitants of its parts: Fétigny-Ménières', () => {
  expect(valuesOf(2056, '2016-02-28')[0]).toEqual({ part: 1376, whole: 1 });
});

test('a municipality that changed canton keeps its figures: Moutier', () => {
  expect(valuesOf(6831, '2016-02-28')[0]).toEqual({ part: 7615, whole: 1 });
});

test('land exchanged in 2004: Castel San Pietro and Breggia share the languages of 2000', () => {
  for (const number of [5249, 5269]) {
    const italian = valuesOf(number, '2016-02-28')[17] ?? null;
    expect(italian).toEqual({ part: 3359, whole: 3724 });
    expect(percent(italian)).toBeCloseTo(90.1987, 4);
  }
});

test('a municipality without an election result has no party values: Meienried', () => {
  const values = valuesOf(389, '2016-02-28');
  expect(values[0]).toEqual({ part: 52, whole: 1 });
  expect(values.slice(8, 15)).toEqual(Array(7).fill(null));
});

test('each definition gives the year of its figures', () => {
  const applying = applyingTo(REAL, '2016-02-28'); // 5960
  expect(DEFINITIONS.map((definition) => definition.year(applying))).toEqual([
    ...Array<number>(8).fill(2015), // the population at the end of 2015
    ...Array<number>(7).fill(2015), // the election of 2015
    ...Array<number>(4).fill(2000), // the census
    2026, // swisstopo's areas
    2015, // the cattle
  ]);
});

test('a party without a list counts no votes: Zürich in 2023, Die Mitte its own', () => {
  const mitte = valuesOf(261, '2024-03-03')[9]; // the election of 2023
  expect(mitte).toEqual({ part: 265215, whole: 4292333 });
});

test('four characteristics have a logarithmic track, the others a linear one', () => {
  // Design of add-limits, decision 5: the four whose values span several orders of magnitude.
  expect(
    DEFINITIONS.filter((definition) => definition.scale === 'logarithmic').map((d) =>
      nameOf(d, de),
    ),
  ).toEqual(['Einwohner', 'Einwohner je km²', 'Fläche', 'Rinder je Einwohner']);
  expect(DEFINITIONS.filter((definition) => definition.scale === 'linear')).toHaveLength(17);
});

// How the panel wrote a value before the change add-limits, which writes it through its units
// (design of add-limits, decision 16); the two must give the same text.
function oldWritten(definition: Definition, value: Quotient | null): string {
  if (value === null) return 'keine Angabe';
  switch (definition.unit) {
    case 'count':
      return formatCount(value.part);
    case 'percent':
      return formatShare(value.part, value.whole);
    case 'per-km2':
      return formatQuotient(value.part, value.whole, 0);
    case 'km2':
      return `${formatQuotient(value.part, value.whole, 2)} km²`;
    case 'per-inhabitant':
      return formatQuotient(value.part, value.whole, 3);
  }
}

test('every value is written as before, for every municipality of two votes', () => {
  const file = characteristicsFile as unknown as CharacteristicsFile;
  let compared = 0;
  for (const voteDate of ['2016-02-28', '2021-03-07']) {
    const applying = applyingTo(file, voteDate);
    for (const number of file.municipalities) {
      const counts = countsOf(file, applying, number);
      for (const definition of DEFINITIONS) {
        const value = definition.value(counts);
        expect(written(definition, value, de)).toBe(oldWritten(definition, value));
        compared += 1;
      }
    }
  }
  expect(compared).toBe(2 * 2110 * 21);
});
