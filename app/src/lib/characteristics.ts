// The characteristics of the municipalities (spec characteristics): one definition each, which
// everything that shows or uses a characteristic takes its name, value and date from. Their
// counts are those of characteristics.json; the design of the change add-characteristics gives
// the reasons (decisions 1, 11 and 15).
import { formatCount, formatQuotient, formatShare } from './format.ts';
import {
  AGE_GROUPS,
  AREA,
  CATTLE,
  DENSITY,
  FOREIGNERS,
  INHABITANTS,
  LAND_HEADING,
  LANGUAGES,
  NO_FIGURE,
  PARTIES,
  characteristic,
  electionHeading,
  languagesHeading,
  ofYear,
  populationHeading,
} from './texts.ts';
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
}

// Where a characteristic's figures come from, which gives the date of its figures.
export type Source = 'population' | 'election' | 'census' | 'area' | 'cattle';

// How a value is written: a count, a share in percent, inhabitants per km², km², or a number
// per inhabitant.
export type Unit = 'count' | 'percent' | 'per-km2' | 'km2' | 'per-inhabitant';

// A value as the quotient of two counts, so that it is written exactly from them, as a vote's
// share is. Its number is part / whole.
export interface Quotient {
  readonly part: number;
  readonly whole: number;
}

export interface Definition {
  readonly name: string;
  readonly unit: Unit;
  readonly source: Source;
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
  name: string,
  unit: Unit,
  source: Source,
  value: (counts: Counts) => Quotient | null,
): Definition {
  return { name, unit, source, year: YEAR_OF[source], value };
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

export const DEFINITIONS: readonly Definition[] = [
  define(INHABITANTS, 'count', 'population', (c) => ({ part: c.population[0], whole: 1 })),
  define(FOREIGNERS, 'percent', 'population', ofInhabitants(1)),
  ...AGE_GROUPS.map((name, i) => define(name, 'percent', 'population', ofInhabitants(2 + i))),
  define(DENSITY, 'per-km2', 'population', (c) => ({
    part: 100 * c.population[0],
    whole: c.hectares,
  })),
  ...PARTIES.map((name, i) => define(name, 'percent', 'election', partyShare(i))),
  ...LANGUAGES.map((name, i) =>
    define(name, 'percent', 'census', (c) => ({ part: c.languages[1 + i], whole: c.languages[0] })),
  ),
  define(AREA, 'km2', 'area', (c) => ({ part: c.hectares, whole: 100 })),
  define(CATTLE, 'per-inhabitant', 'cattle', (c) => ({ part: c.cattle, whole: c.population[0] })),
];

// The figures that apply to a vote (spec characteristics, "The figures that apply to a vote").
export interface Applying {
  // The population at the end of this year, and the cattle of this year.
  readonly populationYear: number;
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
  return {
    populationYear: lastYearBefore(file.population.years, voteDate),
    cattleYear: lastYearBefore(file.cattle.years, voteDate),
    election,
  };
}

/** The counts of the municipality `number` that apply; the years are those `applyingTo` gave. */
export function countsOf(file: CharacteristicsFile, applying: Applying, number: number): Counts {
  const i = file.municipalities.indexOf(number);
  if (i < 0) {
    throw new RangeError(`the characteristics have no municipality ${String(number)}`);
  }
  const people = file.population.counts[file.population.years.indexOf(applying.populationYear)];
  const head = file.cattle.counts[file.cattle.years.indexOf(applying.cattleYear)];
  return {
    population: people[i],
    votes: applying.election.votes[i],
    languages: file.languages2000[i],
    hectares: file.area[i],
    cattle: head[i],
  };
}

/** A value as the panel writes it: "keine Angabe" where there is no figure. */
export function written(definition: Definition, value: Quotient | null): string {
  if (value === null) return NO_FIGURE;
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

// A group of the panel: its heading, and one line per characteristic.
export interface PanelGroup {
  readonly heading: string;
  readonly lines: readonly string[];
}

/**
 * The panel's four groups for a municipality's counts (spec result-map, "The characteristics of
 * a municipality beside the map"): each characteristic in the order of its definition, under the
 * heading of its figures' date; the area and the cattle name their years on their own lines.
 */
export function panelOf(counts: Counts, applying: Applying): readonly PanelGroup[] {
  const of = (...sources: Source[]): readonly Definition[] =>
    DEFINITIONS.filter((definition) => sources.includes(definition.source));
  const lines = (definitions: readonly Definition[], withYear: boolean): readonly string[] =>
    definitions.map((definition) => {
      const name = withYear ? ofYear(definition.name, definition.year(applying)) : definition.name;
      return characteristic(name, written(definition, definition.value(counts)));
    });
  const yearOf = (definitions: readonly Definition[]): number =>
    definitions[0]?.year(applying) ?? Number.NaN;
  const [population, election, census, land] = [
    of('population'),
    of('election'),
    of('census'),
    of('area', 'cattle'),
  ];
  return [
    { heading: populationHeading(yearOf(population)), lines: lines(population, false) },
    { heading: electionHeading(yearOf(election)), lines: lines(election, false) },
    { heading: languagesHeading(yearOf(census)), lines: lines(census, false) },
    { heading: LAND_HEADING, lines: lines(land, true) },
  ];
}
