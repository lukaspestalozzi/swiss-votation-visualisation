// The characteristics of the municipalities (spec characteristics), against the data file and
// the figures of investigations/characteristics.md.
import { expect, test } from 'vitest';
import characteristicsFile from '../../static/data/characteristics.json';
import {
  DEFINITIONS,
  GROUPS,
  applyingTo,
  countsOf,
  nameOf,
  panelOf,
  written,
  type Definition,
  type Quotient,
} from './characteristics.ts';
import { formatCount, formatQuotient, formatShare } from './format.ts';
import { textsOf, type CharacteristicKey } from './texts/index.ts';
import type { CharacteristicsFile } from './vote-data.ts';

const de = textsOf('de');

/** A definition by its key: the tests name a characteristic, not its place among the others. */
function definitionOf(key: CharacteristicKey): Definition {
  const found = DEFINITIONS.find((definition) => definition.key === key);
  if (found === undefined) throw new Error(`no characteristic ${key}`);
  return found;
}

test('the 35 characteristics have their names, in the order of the spec', () => {
  expect(DEFINITIONS.map((definition) => nameOf(definition, de))).toEqual([
    'Einwohner',
    'Ausländeranteil',
    'Im Ausland geboren',
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
    'Evangelisch-reformiert',
    'Römisch-katholisch',
    'Keine Religionszugehörigkeit',
    'Hochschule oder höhere Berufsbildung',
    'Obligatorische Schule oder keine Ausbildung',
    'Vom Eigentümer bewohnte Wohnungen',
    'Einfamilienhäuser',
    'Arbeitsplätze je 100 Einwohner',
    'Arbeitsplätze im Primärsektor',
    'Arbeitsplätze im Sekundärsektor',
    'Arbeitsplätze im Tertiärsektor',
    'Fläche',
    'Rinder je Einwohner',
    "Landwirtschaftsbetriebe je 1'000 Einwohner",
    'Bio-Anteil der landwirtschaftlichen Nutzfläche',
  ]);
});

test('each definition names its group: 9, 7, 4, 3, 2, 2, 4 and 4 in eight groups', () => {
  // Design of add-more-characteristics, decision 3: the group sorts the panel, not the source.
  expect(DEFINITIONS.map((definition) => definition.group)).toEqual([
    ...Array<string>(9).fill('population'),
    ...Array<string>(7).fill('election'),
    ...Array<string>(4).fill('languages'),
    ...Array<string>(3).fill('religion'),
    ...Array<string>(2).fill('education'),
    ...Array<string>(2).fill('housing'),
    ...Array<string>(4).fill('jobs'),
    ...Array<string>(4).fill('land'),
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
  bornAbroad: {
    years: [2024, 2025],
    counts: [
      [3, 4],
      [4, 5],
    ],
  },
  // The second municipality's primary and tertiary sector are withheld.
  jobs: {
    years: [2024, 2025],
    counts: [
      [
        [6, 1, 2, 3],
        [8, null, 3, null],
      ],
      [
        [7, 1, 3, 3],
        [9, null, 4, null],
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
  // The second municipality has no farm and no farmland.
  farms: {
    years: [2024, 2025],
    counts: [
      [
        [2, 40, 10],
        [0, 0, 0],
      ],
      [
        [2, 41, 11],
        [0, 0, 0],
      ],
    ],
  },
  languages2000: [
    [9, 8, 1, 0, 0],
    [18, 16, 2, 0, 0],
  ],
  religion2000: [
    [9, 3, 4, 1],
    [18, 6, 8, 2],
  ],
  education2000: [
    [2, 3, 1],
    [4, 6, 2],
  ],
  dwellings2000: [
    [4, 1],
    [8, 2],
  ],
  buildings2000: [
    [3, 2],
    [6, 4],
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
  // The cattle of 2026 are published before the population at the end of 2026, and the farms
  // with them.
  const file: CharacteristicsFile = {
    ...MADE_UP,
    cattle: { years: [2024, 2025, 2026], counts: [...MADE_UP.cattle.counts, [7, 0]] },
    farms: {
      years: [2024, 2025, 2026],
      counts: [
        ...MADE_UP.farms.counts,
        [
          [2, 42, 12],
          [0, 0, 0],
        ],
      ],
    },
  };
  const applying = applyingTo(file, '2027-03-07');
  expect([applying.populationYear, applying.cattleYear]).toEqual([2025, 2025]);
});

test('the cattle per inhabitant count the inhabitants of the cattle year', () => {
  // The population at the end of 2025 is published before the cattle and the farms of 2025.
  const file: CharacteristicsFile = {
    ...MADE_UP,
    cattle: { years: [2024], counts: [MADE_UP.cattle.counts[0]] },
    farms: { years: [2024], counts: [MADE_UP.farms.counts[0]] },
  };
  const applying = applyingTo(file, '2026-03-08');
  expect([applying.populationYear, applying.cattleYear]).toEqual([2025, 2024]);
  const cattle = definitionOf('cattle');
  expect(nameOf(cattle, de)).toBe('Rinder je Einwohner');
  const counts = countsOf(file, applying, 1);
  expect(cattle.value(counts)).toEqual({ part: 5, whole: 10 });
  // The farms of 2024 too, per 1,000 of the 10 inhabitants at the end of 2024.
  expect(definitionOf('farms').value(counts)).toEqual({ part: 2000, whole: 10 });
  expect(definitionOf('organic-farmland').value(counts)).toEqual({ part: 10, whole: 40 });
});

test('those born abroad published later take the newest year that has them', () => {
  // Spec characteristics, "Those born abroad published later": their own year, as the cattle.
  const file: CharacteristicsFile = {
    ...MADE_UP,
    bornAbroad: { years: [2024], counts: [MADE_UP.bornAbroad.counts[0]] },
  };
  const applying = applyingTo(file, '2026-03-08');
  expect([applying.populationYear, applying.bornAbroadYear]).toEqual([2025, 2024]);
  expect(applyingTo(MADE_UP, '2026-03-08').bornAbroadYear).toBe(2025);
});

test('the jobs published later take the newest year that has them', () => {
  // Spec characteristics, "The jobs published later".
  const file: CharacteristicsFile = {
    ...MADE_UP,
    jobs: { years: [2024], counts: [MADE_UP.jobs.counts[0]] },
  };
  const applying = applyingTo(file, '2026-03-08');
  expect([applying.populationYear, applying.jobsYear]).toEqual([2025, 2024]);
  expect(applyingTo(MADE_UP, '2026-03-08').jobsYear).toBe(2025);
  // The 6 jobs at the end of 2024 per 100 of the 10 inhabitants at the end of 2024.
  const jobs = definitionOf('jobs');
  expect(jobs.value(countsOf(file, applying, 1))).toEqual({ part: 600, whole: 10 });
  const all = applyingTo(MADE_UP, '2026-03-08');
  expect(jobs.value(countsOf(MADE_UP, all, 1))).toEqual({ part: 700, whole: 11 });
});

test('a file whose farms have other years than its cattle is refused', () => {
  // The farms take the cattle's year: both come from one table, for the same years (design of
  // add-more-characteristics, decision 12).
  const file: CharacteristicsFile = {
    ...MADE_UP,
    farms: { years: [2024], counts: [MADE_UP.farms.counts[0]] },
  };
  expect(() => applyingTo(file, '2026-03-08')).toThrow(
    new RangeError('the farms are of the years 2024, the cattle of 2024, 2025'),
  );
});

test('a line of another year than its group names its year', () => {
  // Spec result-map, "A line of another year than its group": those born abroad of 2024 under
  // the population at the end of 2025.
  const later: CharacteristicsFile = {
    ...MADE_UP,
    bornAbroad: { years: [2024], counts: [MADE_UP.bornAbroad.counts[0]] },
  };
  const panel = (file: CharacteristicsFile) => {
    const applying = applyingTo(file, '2026-03-08');
    return panelOf(countsOf(file, applying, 1), applying, de);
  };
  const [population] = panel(later);
  expect(population.heading).toBe('Bevölkerung Ende 2025');
  const texts = (lines: readonly { text: string }[]) => lines.map((line) => line.text);
  expect(texts(population.lines).slice(0, 4)).toEqual([
    'Einwohner: 11',
    'Ausländeranteil: 9.09%',
    'Im Ausland geboren (Ende 2024): 30.00%', // 3 of the 10 inhabitants at the end of 2024
    '0–17 Jahre: 27.27%',
  ]);
  // With every figure of the heading's year, no line of the group names one.
  expect(panel(MADE_UP)[0].lines[2].text).toBe('Im Ausland geboren: 36.36%');
  // The land's heading names no year: each of its lines does.
  const land = panel(MADE_UP).at(-1);
  expect(land?.heading).toBe('Fläche und Landwirtschaft');
  expect(texts(land?.lines ?? [])).toEqual([
    'Fläche (2026): 1.00 km²',
    'Rinder je Einwohner (2025): 0.545',
    "Landwirtschaftsbetriebe je 1'000 Einwohner (2025): 181.8",
    'Bio-Anteil der landwirtschaftlichen Nutzfläche (2025): 26.83%',
  ]);
});

test('a line of the panel: its name, its value, and its share where it is one, for its bar', () => {
  // Spec result-map, "The bars of the shares": Zürich (261) on 2016-02-28 has 29 shares; the six
  // other lines are no shares. Oberrieden (137) has lines without a figure.
  const applying = applyingTo(REAL, '2016-02-28');
  const linesOf = (number: number, t = de) =>
    panelOf(countsOf(REAL, applying, number), applying, t).flatMap((group) => group.lines);
  const zurich = linesOf(261);
  expect(zurich).toHaveLength(35);
  expect(zurich[1]).toEqual({
    name: 'Ausländeranteil',
    value: '32.03%',
    text: 'Ausländeranteil: 32.03%',
    share: 32.03,
  });
  expect(zurich.filter((line) => line.share !== null)).toHaveLength(29);
  expect(zurich.filter((line) => line.share === null).map((line) => line.name)).toEqual([
    'Einwohner',
    'Einwohner je km²',
    'Arbeitsplätze je 100 Einwohner',
    'Fläche (2026)',
    'Rinder je Einwohner (2015)',
    "Landwirtschaftsbetriebe je 1'000 Einwohner (2015)",
  ]);
  // A share without a figure has no bar.
  const without = linesOf(137).filter((line) => line.value === 'keine Angabe');
  expect(without.map((line) => line.name)).toContain('Arbeitsplätze im Primärsektor');
  expect(without.every((line) => line.share === null)).toBe(true);
  // A line's text is its name, a colon and its value, in each language: the panel writes the
  // colon itself, between the two.
  for (const language of ['de', 'fr', 'it'] as const) {
    for (const line of linesOf(261, textsOf(language))) {
      expect(line.text).toBe(`${line.name}: ${line.value}`);
    }
  }
});

test("each heading of the panel begins with the list's heading of its group, in three languages", () => {
  // Spec limits, "Adding and removing a limit": the list stands under the panel's headings
  // without their dates. The two are separate texts.
  const applying = applyingTo(MADE_UP, '2026-03-08');
  for (const language of ['de', 'fr', 'it'] as const) {
    const t = textsOf(language);
    const panel = panelOf(countsOf(MADE_UP, applying, 1), applying, t);
    expect(panel).toHaveLength(GROUPS.length);
    GROUPS.forEach((group, i) => {
      expect(panel[i].heading.startsWith(t.GROUP[group]), `${language}: ${panel[i].heading}`).toBe(
        true,
      );
    });
  }
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

test('the votes of 2016-02-28 and 2015-06-14 take those born abroad and the jobs of the year before', () => {
  const of2016 = applyingTo(REAL, '2016-02-28'); // 5960
  expect([of2016.bornAbroadYear, of2016.jobsYear]).toEqual([2015, 2015]);
  const of2015 = applyingTo(REAL, '2015-06-14'); // 5920
  expect([of2015.bornAbroadYear, of2015.jobsYear]).toEqual([2014, 2014]);
});

test('the newest vote day takes those born abroad of 2025 and the jobs of 2024', () => {
  // The data file of 2026-11-23: the newest jobs are those of 2024.
  const applying = applyingTo(REAL, '2026-03-08'); // 6850
  expect([applying.bornAbroadYear, applying.jobsYear]).toEqual([2025, 2024]);
});

/** The values of the characteristics `keys` of a municipality for a vote day, in their order. */
function valuesOf(
  number: number,
  voteDate: string,
  ...keys: CharacteristicKey[]
): (Quotient | null)[] {
  const counts = countsOf(REAL, applyingTo(REAL, voteDate), number);
  return keys.map((key) => definitionOf(key).value(counts));
}

const POPULATION: CharacteristicKey[] = [
  'inhabitants',
  'foreigners',
  'age-0-17',
  'age-18-34',
  'age-35-49',
  'age-50-64',
  'age-65',
  'density',
];
const PARTIES: CharacteristicKey[] = [
  'fdp',
  'centre',
  'sp',
  'svp',
  'glp',
  'greens',
  'other-parties',
];
const LANGUAGES: CharacteristicKey[] = ['german', 'french', 'italian', 'romansh'];
// The 21 characteristics of before the change add-more-characteristics.
const OF_BEFORE: CharacteristicKey[] = [...POPULATION, ...PARTIES, ...LANGUAGES, 'area', 'cattle'];

function percent(value: Quotient | null): number {
  if (value === null) throw new Error('no figure');
  return (100 * value.part) / value.whole;
}

test('Zürich for the vote of 2016-02-28: its 21 values of before', () => {
  const values = valuesOf(261, '2016-02-28', ...OF_BEFORE);
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

test('born abroad: Zürich for the vote of 2016-02-28', () => {
  // investigations/more-characteristics.md, 12: 163,047 of 396,955 at the end of 2015.
  const [born] = valuesOf(261, '2016-02-28', 'born-abroad');
  expect(born).toEqual({ part: 163047, whole: 396955 });
  expect(percent(born)).toBeCloseTo(41.0744, 4);
});

test('born abroad: third, with its key, its names and the date of its own year', () => {
  const born = DEFINITIONS[2];
  expect(born.key).toBe('born-abroad');
  expect(['de', 'fr', 'it'].map((language) => nameOf(born, textsOf(language as 'de')))).toEqual([
    'Im Ausland geboren',
    "Nés à l'étranger",
    "Nati all'estero",
  ]);
  expect([born.unit, born.group, born.scale]).toEqual(['percent', 'population', 'linear']);
  // Design of add-more-characteristics, decision 4: its own year, as the cattle.
  expect(born.year(applyingTo(REAL, '2016-02-28'))).toBe(2015);
});

test('those born abroad published later: Zürich at the end of 2024 for a vote of 2026', () => {
  // Spec characteristics, "Those born abroad published later": 194,608 of 436,551.
  const { years, counts } = REAL.bornAbroad;
  const file: CharacteristicsFile = {
    ...REAL,
    bornAbroad: { years: years.slice(0, -1), counts: counts.slice(0, -1) },
  };
  expect(years.at(-1)).toBe(2025);
  const applying = applyingTo(file, '2026-03-08');
  expect([applying.populationYear, applying.bornAbroadYear]).toEqual([2025, 2024]);
  const born = definitionOf('born-abroad').value(countsOf(file, applying, 261));
  expect(born).toEqual({ part: 194608, whole: 436551 });
  expect(percent(born)).toBeCloseTo(44.5785, 4);
});

const CENSUS_2000: CharacteristicKey[] = [
  'reformed',
  'catholic',
  'no-religion',
  'higher-education',
  'compulsory-education',
  'owner-occupied',
  'single-family-houses',
];

test('religion, education and housing of 2000: Zürich', () => {
  // investigations/more-characteristics.md, 12; each share within 0.00005 points.
  const values = valuesOf(261, '2016-02-28', ...CENSUS_2000);
  expect(values).toEqual([
    { part: 110008, whole: 363273 },
    { part: 120853, whole: 363273 },
    { part: 61153, whole: 363273 },
    { part: 72373, whole: 290377 }, // of those who named a level
    { part: 76077, whole: 290377 },
    { part: 12920, whole: 181801 }, // of the occupied dwellings
    { part: 8530, whole: 36121 }, // of the buildings with dwellings
  ]);
  const shares = [30.2825, 33.2678, 16.8339, 24.9238, 26.1994, 7.1067, 23.6151];
  shares.forEach((share, i) => {
    expect(percent(values[i])).toBeCloseTo(share, 4);
  });
});

test('few answers on education: Hérémence keeps its figures', () => {
  // Spec characteristics, "Few answers": 16 named a level, 1,077 past school age gave none.
  const values = valuesOf(6084, '2016-02-28', 'higher-education', 'compulsory-education');
  expect(values).toEqual([
    { part: 6, whole: 16 },
    { part: 4, whole: 16 },
  ]);
  expect(values.map((value) => written(definitionOf('higher-education'), value, de))).toEqual([
    '37.50%',
    '25.00%',
  ]);
});

test('land exchanged in 2004: Castel San Pietro and Breggia share the figures of 2000', () => {
  // As the languages: the two are one group in the census (investigations/characteristics.md, 2).
  const [castel, breggia] = [5249, 5269].map((n) => valuesOf(n, '2016-02-28', ...CENSUS_2000));
  expect(castel).toEqual(breggia);
  expect(castel.slice(0, 3).map((value) => value?.whole)).toEqual([3724, 3724, 3724]);
});

test('the seven of the census of 2000: their keys in order, their names in French and Italian', () => {
  const seven = DEFINITIONS.filter((definition) =>
    ['religion', 'education', 'housing'].includes(definition.group),
  );
  expect(seven.map((definition) => definition.key)).toEqual(CENSUS_2000);
  // Design of add-more-characteristics, decision 2.
  expect(seven.map((definition) => nameOf(definition, textsOf('fr')))).toEqual([
    'Évangéliques réformés',
    'Catholiques romains',
    'Sans appartenance religieuse',
    'Haute école ou formation professionnelle supérieure',
    'Scolarité obligatoire ou aucune formation',
    'Logements occupés par leur propriétaire',
    'Maisons individuelles',
  ]);
  expect(seven.map((definition) => nameOf(definition, textsOf('it')))).toEqual([
    'Evangelici riformati',
    'Cattolici romani',
    'Senza appartenenza religiosa',
    'Scuola universitaria o formazione professionale superiore',
    "Scuola dell'obbligo o nessuna formazione",
    'Abitazioni occupate dal proprietario',
    'Case unifamiliari',
  ]);
  expect(
    seven.every((definition) => definition.year(applyingTo(REAL, '2016-02-28')) === 2000),
  ).toBe(true);
});

const JOBS: CharacteristicKey[] = ['jobs', 'primary-sector', 'secondary-sector', 'tertiary-sector'];

test('the jobs at the end of 2015: Zürich', () => {
  // investigations/more-characteristics.md, 12: 468,852 jobs, 118.1121 per 100 inhabitants.
  const values = valuesOf(261, '2016-02-28', ...JOBS);
  expect(values).toEqual([
    { part: 46885200, whole: 396955 },
    { part: 231, whole: 468852 },
    { part: 30062, whole: 468852 },
    { part: 438559, whole: 468852 },
  ]);
  const [jobs, ...sectors] = values;
  expect((jobs?.part ?? 0) / (jobs?.whole ?? 1)).toBeCloseTo(118.1121, 4);
  [0.0493, 6.4118, 93.5389].forEach((share, i) => {
    expect(percent(sectors[i])).toBeCloseTo(share, 4);
  });
  expect(values.map((value, i) => written(definitionOf(JOBS[i]), value, de))).toEqual([
    '118.1',
    '0.05%',
    '6.41%',
    '93.54%',
  ]);
});

test('one sector only: Bister', () => {
  // Spec characteristics, "One sector only": 9 jobs, 31 inhabitants, all in the primary sector.
  const values = valuesOf(6172, '2016-02-28', ...JOBS);
  expect(values).toEqual([
    { part: 900, whole: 31 },
    { part: 9, whole: 9 },
    { part: 0, whole: 9 },
    { part: 0, whole: 9 },
  ]);
  expect(900 / 31).toBeCloseTo(29.0323, 4);
  expect(values.map((value, i) => written(definitionOf(JOBS[i]), value, de))).toEqual([
    '29.0',
    '100.00%',
    '0.00%',
    '0.00%',
  ]);
});

test('two sectors withheld: Oberrieden', () => {
  // Spec characteristics, "Two sectors withheld": 1,037 jobs, 927 of them in the tertiary sector.
  const values = valuesOf(137, '2016-02-28', ...JOBS);
  expect(values).toEqual([{ part: 103700, whole: 5037 }, null, null, { part: 927, whole: 1037 }]);
  expect(103700 / 5037).toBeCloseTo(20.5877, 4);
  expect(percent(values[3])).toBeCloseTo(89.3925, 4);
  expect(values.map((value, i) => written(definitionOf(JOBS[i]), value, de))).toEqual([
    '20.6',
    'keine Angabe',
    'keine Angabe',
    '89.39%',
  ]);
});

test('a part of a municipality without a count: Rue', () => {
  // Spec characteristics, "A part of a municipality": Chapelle (Glâne)'s two sectors are
  // withheld, so Rue has 434 jobs, 217 of them in the tertiary sector, and no other share.
  const values = valuesOf(2097, '2016-02-28', ...JOBS);
  expect(values.slice(1)).toEqual([null, null, { part: 217, whole: 434 }]);
  expect(values[0]?.part).toBe(43400);
  expect(written(definitionOf('tertiary-sector'), values[3], de)).toBe('50.00%');
});

test('all jobs withheld: Linescio at the end of 2024', () => {
  // Spec characteristics, "All jobs withheld": for the vote of 2026-03-08 (6850).
  expect(valuesOf(5315, '2026-03-08', ...JOBS)).toEqual([null, null, null, null]);
});

test('the four of the jobs: their names in French and Italian, the date of their own year', () => {
  const four = JOBS.map(definitionOf);
  expect(four.map((definition) => nameOf(definition, textsOf('fr')))).toEqual([
    'Emplois pour 100 habitants',
    'Emplois du secteur primaire',
    'Emplois du secteur secondaire',
    'Emplois du secteur tertiaire',
  ]);
  expect(four.map((definition) => nameOf(definition, textsOf('it')))).toEqual([
    'Impieghi ogni 100 abitanti',
    'Impieghi nel settore primario',
    'Impieghi nel settore secondario',
    'Impieghi nel settore terziario',
  ]);
  // The newest vote day takes the jobs of 2024, though the population of 2025.
  expect(four.map((definition) => definition.year(applyingTo(REAL, '2026-03-08')))).toEqual(
    Array(4).fill(2024),
  );
  expect(four.map((definition) => definition.unit)).toEqual([
    'rate',
    'percent',
    'percent',
    'percent',
  ]);
});

const FARMS: CharacteristicKey[] = ['farms', 'organic-farmland'];

test('the farms and the organic farmland of 2015: Zürich', () => {
  // investigations/more-characteristics.md, 12: 41 farms, 381 of 855 hectares organic.
  const values = valuesOf(261, '2016-02-28', ...FARMS);
  expect(values).toEqual([
    { part: 41000, whole: 396955 },
    { part: 381, whole: 855 },
  ]);
  expect(41000 / 396955).toBeCloseTo(0.1033, 4);
  expect(percent(values[1])).toBeCloseTo(44.5614, 4);
  expect(values.map((value, i) => written(definitionOf(FARMS[i]), value, de))).toEqual([
    '0.1',
    '44.56%',
  ]);
});

test('without farmland: Oberrieden has no organic share', () => {
  // Spec characteristics, "Without farmland": no farm and no farmland in 2015.
  const values = valuesOf(137, '2016-02-28', ...FARMS);
  expect(values).toEqual([
    { part: 0, whole: 5037 },
    { part: 0, whole: 0 },
  ]);
  expect(values.map((value, i) => written(definitionOf(FARMS[i]), value, de))).toEqual([
    '0.0',
    'keine Angabe',
  ]);
});

test('no organic farm: Meienried', () => {
  // Spec characteristics, "No organic farm": none of its 60 hectares is organic.
  const [farms, organic] = valuesOf(389, '2016-02-28', ...FARMS);
  expect(organic).toEqual({ part: 0, whole: 60 });
  expect(written(definitionOf('organic-farmland'), organic, de)).toBe('0.00%');
  expect(written(definitionOf('farms'), farms, de)).toBe('76.9'); // 4 farms, 52 inhabitants
});

test('the two of the farms: their names in French and Italian, the year of the cattle', () => {
  const two = FARMS.map(definitionOf);
  expect(two.map((definition) => nameOf(definition, textsOf('fr')))).toEqual([
    "Exploitations agricoles pour 1'000 habitants",
    'Part bio de la surface agricole utile',
  ]);
  expect(two.map((definition) => nameOf(definition, textsOf('it')))).toEqual([
    "Aziende agricole ogni 1'000 abitanti",
    'Quota bio della superficie agricola utile',
  ]);
  expect(two.map((definition) => [definition.unit, definition.group])).toEqual([
    ['rate', 'land'],
    ['percent', 'land'],
  ]);
  expect(two.map((definition) => definition.year(applyingTo(REAL, '2016-02-28')))).toEqual([
    2015, 2015,
  ]);
});

test('a merged municipality has the inhabitants of its parts: Fétigny-Ménières', () => {
  expect(valuesOf(2056, '2016-02-28', 'inhabitants')).toEqual([{ part: 1376, whole: 1 }]);
});

test('a municipality that changed canton keeps its figures: Moutier', () => {
  expect(valuesOf(6831, '2016-02-28', 'inhabitants')).toEqual([{ part: 7615, whole: 1 }]);
});

test('land exchanged in 2004: Castel San Pietro and Breggia share the languages of 2000', () => {
  for (const number of [5249, 5269]) {
    const [italian] = valuesOf(number, '2016-02-28', 'italian');
    expect(italian).toEqual({ part: 3359, whole: 3724 });
    expect(percent(italian)).toBeCloseTo(90.1987, 4);
  }
});

test('a municipality without an election result has no party values: Meienried', () => {
  expect(valuesOf(389, '2016-02-28', 'inhabitants')).toEqual([{ part: 52, whole: 1 }]);
  expect(valuesOf(389, '2016-02-28', ...PARTIES)).toEqual(Array(7).fill(null));
});

test('each definition gives the year of its figures', () => {
  const applying = applyingTo(REAL, '2016-02-28'); // 5960
  expect(OF_BEFORE.map((key) => definitionOf(key).year(applying))).toEqual([
    ...Array<number>(8).fill(2015), // the population at the end of 2015
    ...Array<number>(7).fill(2015), // the election of 2015
    ...Array<number>(4).fill(2000), // the census
    2026, // swisstopo's areas
    2015, // the cattle
  ]);
});

test('a party without a list counts no votes: Zürich in 2023, Die Mitte its own', () => {
  const [mitte] = valuesOf(261, '2024-03-03', 'centre'); // the election of 2023
  expect(mitte).toEqual({ part: 265215, whole: 4292333 });
});

test('six characteristics have a logarithmic track, the others a linear one', () => {
  // Design of add-limits, decision 5, and of add-more-characteristics, decision 9: those whose
  // values span several orders of magnitude.
  expect(
    DEFINITIONS.filter((definition) => definition.scale === 'logarithmic').map((d) =>
      nameOf(d, de),
    ),
  ).toEqual([
    'Einwohner',
    'Einwohner je km²',
    'Arbeitsplätze je 100 Einwohner',
    'Fläche',
    'Rinder je Einwohner',
    "Landwirtschaftsbetriebe je 1'000 Einwohner",
  ]);
  expect(DEFINITIONS.filter((definition) => definition.scale === 'linear')).toHaveLength(29);
});

test('a rate is written with one decimal, rounded half away from zero', () => {
  // Jobs per 100 inhabitants and farms per 1,000 (design of add-more-characteristics, 7).
  const rate: Definition = { ...DEFINITIONS[0], unit: 'rate' };
  expect(written(rate, { part: 100 * 468852, whole: 396955 }, de)).toBe('118.1'); // 118.1121
  expect(written(rate, { part: 5, whole: 100 }, de)).toBe('0.1'); // 0.05
  expect(written(rate, { part: 123456, whole: 100 }, de)).toBe("1'234.6"); // 1234.56
  expect(written(rate, null, de)).toBe('keine Angabe');
  expect(written(rate, { part: 3, whole: 0 }, de)).toBe('keine Angabe');
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
    case 'rate':
      return formatQuotient(value.part, value.whole, 1);
  }
}

test('every value of the 21 of before is written as before, for every municipality of two votes', () => {
  const file = characteristicsFile as unknown as CharacteristicsFile;
  let compared = 0;
  for (const voteDate of ['2016-02-28', '2021-03-07']) {
    const applying = applyingTo(file, voteDate);
    for (const number of file.municipalities) {
      const counts = countsOf(file, applying, number);
      for (const definition of OF_BEFORE.map(definitionOf)) {
        const value = definition.value(counts);
        expect(written(definition, value, de)).toBe(oldWritten(definition, value));
        compared += 1;
      }
    }
  }
  expect(compared).toBe(2 * 2110 * 21);
});

test('every value of the 35 is written for every municipality of two votes', () => {
  // The votes of 2016-02-28 and 2026-03-08, whose jobs are of 2015 and of 2024: no value is
  // refused, and each is a figure or "keine Angabe".
  let written35 = 0;
  let withoutFigure = 0;
  for (const voteDate of ['2016-02-28', '2026-03-08']) {
    const applying = applyingTo(REAL, voteDate);
    for (const number of REAL.municipalities) {
      const counts = countsOf(REAL, applying, number);
      for (const definition of DEFINITIONS) {
        const text = written(definition, definition.value(counts), de);
        expect(text).toMatch(/^([0-9']+(\.[0-9]+)?(%| km²)?|keine Angabe)$/);
        if (text === 'keine Angabe') withoutFigure += 1;
        written35 += 1;
      }
    }
  }
  expect(written35).toBe(2 * 2110 * 35);
  expect(DEFINITIONS).toHaveLength(35);
  expect(withoutFigure).toBeGreaterThan(0);
});

test('the parties in French and Italian, after STAT-TAB and the party register', () => {
  // Spec interface-languages, "The parties"; investigations/languages.md, 4.
  const parties = DEFINITIONS.filter((definition) => definition.source === 'election');
  expect(parties.map((definition) => nameOf(definition, textsOf('fr')))).toEqual([
    'PLR',
    "Le Centre (jusqu'en 2020 PDC et PBD)",
    'PS',
    'UDC',
    'PVL',
    'Verts',
    'Autres partis',
  ]);
  expect(parties.map((definition) => nameOf(definition, textsOf('it')))).toEqual([
    'PLR',
    'Il Centro (fino al 2020 PPD e PBD)',
    'PS',
    'UDC',
    'PVL',
    'I Verdi',
    'Altri partiti',
  ]);
});
