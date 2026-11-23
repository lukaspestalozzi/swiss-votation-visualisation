// The characteristics of the municipalities (spec characteristics): one definition each, which
// everything that shows or uses a characteristic takes its name, value and date from. Their
// counts are those of characteristics.json; the design of the change add-characteristics gives
// the reasons (decisions 1, 11 and 15), and the design of add-more-characteristics those of the
// groups (decision 3).
import { formatUnits, quotientUnits } from './format.ts';
import type { CharacteristicGroup, CharacteristicKey, Texts } from './texts/index.ts';
import type { CharacteristicsFile, Election } from './vote-data.ts';

// The counts of one municipality that apply to a vote.
export interface Counts {
  // Inhabitants, foreigners, and those aged 0–17, 18–34, 35–49, 50–64, and 65 and over.
  readonly population: readonly number[];
  // The votes of FDP, Die Mitte, SP, SVP, GLP, Grüne and the other parties; null without an
  // election result of its own.
  readonly votes: readonly number[] | null;
  // The census of 2000: all inhabitants, and those with German, French, Italian and Romansh.
  readonly languages: readonly number[];
  readonly hectares: number;
  readonly cattle: number;
  // The inhabitants at the end of the cattle's year.
  readonly cattleInhabitants: number;
}

// Where a characteristic's figures come from, which gives the date of its figures.
export type Source = 'population' | 'election' | 'census' | 'area' | 'cattle';

// The group a characteristic stands in, in the panel and in the list of the limits.
export type Group = CharacteristicGroup;

// How a value is written: a count, a share in percent, inhabitants per km², km², a number per
// inhabitant, or a number per 100 or per 1,000 inhabitants, with one decimal (a rate).
export type Unit = 'count' | 'percent' | 'per-km2' | 'km2' | 'per-inhabitant' | 'rate';

// A value as the quotient of two counts, so that it is written exactly from them, as a vote's
// share is. Its number is part / whole.
export interface Quotient {
  readonly part: number;
  readonly whole: number;
}

// The scale of a limit's track (design of add-limits, decision 5): equal differences from one
// step to the next, or equal factors for values that span several orders of magnitude.
export type Scale = 'linear' | 'logarithmic';

export interface Definition {
  // The same in every language; its name is the texts' (nameOf).
  readonly key: CharacteristicKey;
  readonly unit: Unit;
  readonly source: Source;
  readonly group: Group;
  readonly scale: Scale;
  // The year of its figures, among those that apply to a vote.
  readonly year: (applying: Applying) => number;
  // Null where the municipality has no figure.
  readonly value: (counts: Counts) => Quotient | null;
}

// The year of the census, and of swisstopo's areas (swissBOUNDARIES3D of 2026-01, the pipeline's
// download.py).
export const CENSUS_YEAR = 2000;
export const AREA_YEAR = 2026;

// The year of each source's figures.
const YEAR_OF: Readonly<Record<Source, (applying: Applying) => number>> = {
  population: (applying) => applying.populationYear,
  election: (applying) => applying.election.year,
  census: () => CENSUS_YEAR,
  area: () => AREA_YEAR,
  cattle: (applying) => applying.cattleYear,
};

function define(
  key: CharacteristicKey,
  unit: Unit,
  source: Source,
  group: Group,
  scale: Scale,
  value: (counts: Counts) => Quotient | null,
): Definition {
  return { key, unit, source, group, scale, year: YEAR_OF[source], value };
}

const ofInhabitants = (i: number) => (c: Counts) => ({
  part: c.population[i],
  whole: c.population[0],
});

function partyShare(i: number): (c: Counts) => Quotient | null {
  return (c) =>
    c.votes === null
      ? null
      : { part: c.votes[i], whole: c.votes.reduce((sum, votes) => sum + votes, 0) };
}

// The age groups, the parties and the main languages, in the order of their counts.
const AGE_GROUPS = ['age-0-17', 'age-18-34', 'age-35-49', 'age-50-64', 'age-65'] as const;
const PARTIES = ['fdp', 'centre', 'sp', 'svp', 'glp', 'greens', 'other-parties'] as const;
const LANGUAGES = ['german', 'french', 'italian', 'romansh'] as const;

export const DEFINITIONS: readonly Definition[] = [
  define('inhabitants', 'count', 'population', 'population', 'logarithmic', (c) => ({
    part: c.population[0],
    whole: 1,
  })),
  define('foreigners', 'percent', 'population', 'population', 'linear', ofInhabitants(1)),
  ...AGE_GROUPS.map((key, i) =>
    define(key, 'percent', 'population', 'population', 'linear', ofInhabitants(2 + i)),
  ),
  define('density', 'per-km2', 'population', 'population', 'logarithmic', (c) => ({
    part: 100 * c.population[0],
    whole: c.hectares,
  })),
  ...PARTIES.map((key, i) =>
    define(key, 'percent', 'election', 'election', 'linear', partyShare(i)),
  ),
  ...LANGUAGES.map((key, i) =>
    define(key, 'percent', 'census', 'languages', 'linear', (c) => ({
      part: c.languages[1 + i],
      whole: c.languages[0],
    })),
  ),
  define('area', 'km2', 'area', 'land', 'logarithmic', (c) => ({ part: c.hectares, whole: 100 })),
  define('cattle', 'per-inhabitant', 'cattle', 'land', 'logarithmic', (c) => ({
    part: c.cattle,
    whole: c.cattleInhabitants,
  })),
];

/** The name of a characteristic in the language of `t`. */
export function nameOf(definition: Definition, t: Texts): string {
  return t.CHARACTERISTIC[definition.key];
}

// The figures that apply to a vote (spec characteristics, "The figures that apply to a vote").
export interface Applying {
  // The population at the end of this year, and the cattle of this year.
  readonly populationYear: number;
  // Those born abroad and the jobs, each at the end of its own year.
  readonly bornAbroadYear: number;
  readonly jobsYear: number;
  readonly cattleYear: number;
  readonly election: Election;
}

/** The last year before the vote day of which the file has figures. */
function lastYearBefore(years: readonly number[], voteDate: string): number {
  const before = years.filter((year) => year < Number(voteDate.slice(0, 4)));
  if (before.length === 0) throw new RangeError(`no figures of a year before ${voteDate}`);
  return Math.max(...before);
}

/** The figures that apply to the vote of `voteDate`, from those the file has. */
export function applyingTo(file: CharacteristicsFile, voteDate: string): Applying {
  const election = file.elections
    .filter((candidate) => candidate.day < voteDate)
    .reduce<Election | undefined>((last, e) => (last && last.day > e.day ? last : e), undefined);
  if (election === undefined) throw new RangeError(`no election before ${voteDate}`);
  // The farms take the cattle's year: one table gives both, for the same years.
  if (file.farms.years.join() !== file.cattle.years.join()) {
    throw new RangeError(
      `the farms are of the years ${file.farms.years.join(', ')}, the cattle of ` +
        file.cattle.years.join(', '),
    );
  }
  // The last year before the vote day of which the file has these figures and the population,
  // whose inhabitants they are counted per.
  const lastWithPopulation = (years: readonly number[]): number =>
    lastYearBefore(
      years.filter((year) => file.population.years.includes(year)),
      voteDate,
    );
  return {
    populationYear: lastYearBefore(file.population.years, voteDate),
    bornAbroadYear: lastWithPopulation(file.bornAbroad.years),
    jobsYear: lastWithPopulation(file.jobs.years),
    cattleYear: lastWithPopulation(file.cattle.years),
    election,
  };
}

/** The counts of the municipality `number` that apply; the years are those `applyingTo` gave. */
export function countsOf(file: CharacteristicsFile, applying: Applying, number: number): Counts {
  const i = file.municipalities.indexOf(number);
  if (i < 0) {
    throw new RangeError(`the characteristics have no municipality ${String(number)}`);
  }
  return countsAt(file, applying, i);
}

/** The counts of the municipality at index `i` of the file's list, as `countsOf` gives them. */
export function countsAt(file: CharacteristicsFile, applying: Applying, i: number): Counts {
  const people = file.population.counts[file.population.years.indexOf(applying.populationYear)];
  const head = file.cattle.counts[file.cattle.years.indexOf(applying.cattleYear)];
  const ofCattleYear = file.population.counts[file.population.years.indexOf(applying.cattleYear)];
  return {
    population: people[i],
    votes: applying.election.votes[i],
    languages: file.languages2000[i],
    hectares: file.area[i],
    cattle: head[i],
    cattleInhabitants: ofCattleYear[i][0],
  };
}

// The decimals each unit is written with.
export const DECIMALS: Readonly<Record<Unit, number>> = {
  count: 0,
  percent: 2,
  'per-km2': 0,
  km2: 2,
  'per-inhabitant': 3,
  rate: 1,
};

/**
 * A value as the panel writes it, as a whole number of units of its last digit (design of
 * add-limits, decision 16): 32.03% is 3203, 91.88 km² is 9188. A limit compares these numbers.
 * None where the municipality has no figure, or where a value has no whole.
 */
export function unitsOf(definition: Definition, value: Quotient | null): number | null {
  if (value === null || value.whole === 0) return null;
  if (definition.unit === 'percent') {
    if (value.part > value.whole) {
      throw new RangeError(`${String(value.part)} is more than ${String(value.whole)}`);
    }
    return quotientUnits(100 * value.part, value.whole, DECIMALS.percent);
  }
  return quotientUnits(value.part, value.whole, DECIMALS[definition.unit]);
}

/** A number of units as the panel writes it: "keine Angabe" where there is no figure. */
export function writeUnits(definition: Definition, units: number | null, t: Texts): string {
  if (units === null) return t.NO_FIGURE;
  const number = formatUnits(units, DECIMALS[definition.unit]);
  switch (definition.unit) {
    case 'percent':
      return `${number}%`;
    case 'km2':
      return `${number} km²`;
    default:
      return number;
  }
}

/** A value as the panel writes it: "keine Angabe" where there is no figure. */
export function written(definition: Definition, value: Quotient | null, t: Texts): string {
  return writeUnits(definition, unitsOf(definition, value), t);
}

// A group of the panel: its heading, and one line per characteristic.
export interface PanelGroup {
  readonly heading: string;
  readonly lines: readonly string[];
}

/**
 * The panel's four groups for a municipality's counts (spec result-map, "The characteristics of
 * a municipality beside the map"): each characteristic in the order of its definition, in its
 * group, under the heading of its figures' date; the area and the cattle name their years on
 * their own lines.
 */
export function panelOf(counts: Counts, applying: Applying, t: Texts): readonly PanelGroup[] {
  const of = (group: Group): readonly Definition[] =>
    DEFINITIONS.filter((definition) => definition.group === group);
  const lines = (definitions: readonly Definition[], withYear: boolean): readonly string[] =>
    definitions.map((definition) => {
      const name = nameOf(definition, t);
      const named = withYear ? t.ofYear(name, definition.year(applying)) : name;
      return t.characteristic(named, written(definition, definition.value(counts), t));
    });
  const yearOf = (definitions: readonly Definition[]): number =>
    definitions[0]?.year(applying) ?? Number.NaN;
  const [population, election, census, land] = [
    of('population'),
    of('election'),
    of('languages'),
    of('land'),
  ];
  return [
    { heading: t.populationHeading(yearOf(population)), lines: lines(population, false) },
    { heading: t.electionHeading(yearOf(election)), lines: lines(election, false) },
    { heading: t.languagesHeading(yearOf(census)), lines: lines(census, false) },
    { heading: t.LAND_HEADING, lines: lines(land, true) },
  ];
}
