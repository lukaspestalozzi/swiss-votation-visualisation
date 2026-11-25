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
  // Those born abroad, and the inhabitants at the end of their year.
  readonly bornAbroad: number;
  readonly bornAbroadInhabitants: number;
  // The census of 2000: all inhabitants, the Evangelical Reformed, the Roman Catholic and those
  // without a religious affiliation.
  readonly religion: readonly number[];
  // Those with none or compulsory school, upper secondary and tertiary education.
  readonly education: readonly number[];
  // The occupied dwellings and those lived in by their owner; the buildings with dwellings and
  // the single-family houses.
  readonly dwellings: readonly number[];
  readonly buildings: readonly number[];
  // The jobs at the end of their year: all of them and those of the primary, the secondary and
  // the tertiary sector, each null where the source withholds it; and the inhabitants at the
  // end of that year.
  readonly jobs: readonly (number | null)[];
  readonly jobsInhabitants: number;
  // The farms of the cattle's year, their farmland and the farmland of the organic ones, in ha.
  readonly farms: readonly number[];
}

// Where a characteristic's figures come from, which gives the date of its figures.
export type Source =
  'population' | 'born-abroad' | 'jobs' | 'election' | 'census' | 'area' | 'cattle';

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
  'born-abroad': (applying) => applying.bornAbroadYear,
  jobs: (applying) => applying.jobsYear,
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
const RELIGIONS = ['reformed', 'catholic', 'no-religion'] as const;
const SECTORS = ['primary-sector', 'secondary-sector', 'tertiary-sector'] as const;

// A sector's share of all jobs: none where the source withholds one of the two counts (design
// of add-more-characteristics, decision 7).
function sectorShare(i: number): (c: Counts) => Quotient | null {
  return (c) => {
    const [all, sector] = [c.jobs[0], c.jobs[1 + i]];
    return all === null || sector === null ? null : { part: sector, whole: all };
  };
}

// A share of those who named a level of education: of the three levels the file has, not of
// those of school age, below it or without an answer (design of add-more-characteristics, 5).
const ofLevels = (i: number) => (c: Counts) => ({
  part: c.education[i],
  whole: c.education[0] + c.education[1] + c.education[2],
});

export const DEFINITIONS: readonly Definition[] = [
  define('inhabitants', 'count', 'population', 'population', 'logarithmic', (c) => ({
    part: c.population[0],
    whole: 1,
  })),
  define('foreigners', 'percent', 'population', 'population', 'linear', ofInhabitants(1)),
  define('born-abroad', 'percent', 'born-abroad', 'population', 'linear', (c) => ({
    part: c.bornAbroad,
    whole: c.bornAbroadInhabitants,
  })),
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
  ...RELIGIONS.map((key, i) =>
    define(key, 'percent', 'census', 'religion', 'linear', (c) => ({
      part: c.religion[1 + i],
      whole: c.religion[0],
    })),
  ),
  define('higher-education', 'percent', 'census', 'education', 'linear', ofLevels(2)),
  define('compulsory-education', 'percent', 'census', 'education', 'linear', ofLevels(0)),
  define('owner-occupied', 'percent', 'census', 'housing', 'linear', (c) => ({
    part: c.dwellings[1],
    whole: c.dwellings[0],
  })),
  define('single-family-houses', 'percent', 'census', 'housing', 'linear', (c) => ({
    part: c.buildings[1],
    whole: c.buildings[0],
  })),
  define('jobs', 'rate', 'jobs', 'jobs', 'logarithmic', (c) =>
    c.jobs[0] === null ? null : { part: 100 * c.jobs[0], whole: c.jobsInhabitants },
  ),
  ...SECTORS.map((key, i) => define(key, 'percent', 'jobs', 'jobs', 'linear', sectorShare(i))),
  define('area', 'km2', 'area', 'land', 'logarithmic', (c) => ({ part: c.hectares, whole: 100 })),
  define('cattle', 'per-inhabitant', 'cattle', 'land', 'logarithmic', (c) => ({
    part: c.cattle,
    whole: c.cattleInhabitants,
  })),
  // The farms come from the cattle's table, for its years.
  define('farms', 'rate', 'cattle', 'land', 'logarithmic', (c) => ({
    part: 1000 * c.farms[0],
    whole: c.cattleInhabitants,
  })),
  define('organic-farmland', 'percent', 'cattle', 'land', 'linear', (c) => ({
    part: c.farms[2],
    whole: c.farms[1],
  })),
];

// The date of a characteristic's figures of a year, by its source, as a limit's label and a
// line of the panel write it: "Ende 2015", "Nationalratswahl 2019", "Volkszählung 2000", "2026".
const DATE_OF: Readonly<Record<Source, (t: Texts, year: number) => string>> = {
  population: (t, year) => t.populationDate(year),
  'born-abroad': (t, year) => t.populationDate(year),
  jobs: (t, year) => t.populationDate(year),
  election: (t, year) => t.electionHeading(year),
  census: (t, year) => t.censusDate(year),
  area: (_, year) => String(year),
  cattle: (_, year) => String(year),
};

/** The date of a characteristic's figures of `year`, in the language of `t`. */
export function dateOf(definition: Definition, year: number, t: Texts): string {
  return DATE_OF[definition.source](t, year);
}

/** The name of a characteristic in the language of `t`. */
export function nameOf(definition: Definition, t: Texts): string {
  return t.CHARACTERISTIC[definition.key];
}

// The figures that apply to a vote (spec characteristics, "The figures that apply to a vote").
export interface Applying {
  // The population at the end of this year.
  readonly populationYear: number;
  // Those born abroad and the jobs, each at the end of its own year.
  readonly bornAbroadYear: number;
  readonly jobsYear: number;
  // The cattle and the farms of this year.
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
  const born = file.bornAbroad.counts[file.bornAbroad.years.indexOf(applying.bornAbroadYear)];
  const ofBornYear = file.population.counts[file.population.years.indexOf(applying.bornAbroadYear)];
  const employed = file.jobs.counts[file.jobs.years.indexOf(applying.jobsYear)];
  const surveyed = file.farms.counts[file.farms.years.indexOf(applying.cattleYear)];
  const ofJobsYear = file.population.counts[file.population.years.indexOf(applying.jobsYear)];
  return {
    population: people[i],
    votes: applying.election.votes[i],
    languages: file.languages2000[i],
    hectares: file.area[i],
    cattle: head[i],
    cattleInhabitants: ofCattleYear[i][0],
    bornAbroad: born[i],
    bornAbroadInhabitants: ofBornYear[i][0],
    religion: file.religion2000[i],
    education: file.education2000[i],
    dwellings: file.dwellings2000[i],
    buildings: file.buildings2000[i],
    jobs: employed[i],
    jobsInhabitants: ofJobsYear[i][0],
    farms: surveyed[i],
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

// A line of the panel: its characteristic's name, with the date of its figures where that is not
// its group's; its value as the panel writes it; the two as one text, "Einwohner: 396'955"; and,
// where the value is a share with a figure, that share in percent, which a bar draws (spec
// result-map, "The characteristics of a municipality").
export interface PanelLine {
  readonly name: string;
  readonly value: string;
  readonly text: string;
  readonly share: number | null;
}

// A group of the panel: its heading, and one line per characteristic.
export interface PanelGroup {
  readonly heading: string;
  readonly lines: readonly PanelLine[];
}

// The groups in the order of the panel and of the list of the limits.
export const GROUPS: readonly Group[] = [
  'population',
  'election',
  'languages',
  'religion',
  'education',
  'housing',
  'jobs',
  'land',
];

// A group's heading in the panel, and the year it names; none for the land, whose figures are
// of several years.
function headingOf(
  group: Group,
  applying: Applying,
  t: Texts,
): { readonly heading: string; readonly year: number | null } {
  const dated = (heading: (year: number) => string, year: number) => ({
    heading: heading(year),
    year,
  });
  switch (group) {
    case 'population':
      return dated(t.populationHeading, applying.populationYear);
    case 'election':
      return dated(t.electionHeading, applying.election.year);
    case 'languages':
      return dated(t.languagesHeading, CENSUS_YEAR);
    case 'religion':
      return dated(t.religionHeading, CENSUS_YEAR);
    case 'education':
      return dated(t.educationHeading, CENSUS_YEAR);
    case 'housing':
      return dated(t.housingHeading, CENSUS_YEAR);
    case 'jobs':
      return dated(t.jobsHeading, applying.jobsYear);
    case 'land':
      return { heading: t.GROUP.land, year: null };
  }
}

/**
 * The panel's eight groups for a municipality's counts (spec result-map, "The characteristics of
 * a municipality"): each characteristic in the order of its definition, in its
 * group, under the heading of its figures' date. A line whose figures are of another year than
 * the heading's names its date; so does every line of the land, whose heading names no year.
 */
export function panelOf(counts: Counts, applying: Applying, t: Texts): readonly PanelGroup[] {
  return GROUPS.map((group) => {
    const { heading, year } = headingOf(group, applying, t);
    const lines = DEFINITIONS.filter((definition) => definition.group === group).map(
      (definition): PanelLine => {
        const own = definition.year(applying);
        const name =
          own === year
            ? nameOf(definition, t)
            : t.ofDate(nameOf(definition, t), dateOf(definition, own, t));
        // The share is the value as the line writes it, so that the bar draws what the line says.
        const units = unitsOf(definition, definition.value(counts));
        const value = writeUnits(definition, units, t);
        return {
          name,
          value,
          text: t.characteristic(name, value),
          share:
            definition.unit === 'percent' && units !== null
              ? units / 10 ** DECIMALS[definition.unit]
              : null,
        };
      },
    );
    return { heading, lines };
  });
}
