// The limits on the characteristics (spec limits): a limit's track, made from its
// characteristic's one definition. The design of the change add-limits gives the reasons
// (decisions 5, 16 and 17).
import { remainingMunicipalities } from 'calculation';
import {
  countsAt,
  unitsOf,
  writeUnits,
  type Applying,
  type Definition,
  type Source,
} from './characteristics.ts';
import { censusDate, electionHeading, limitLabel, populationDate } from './texts.ts';
import type { CharacteristicsFile } from './vote-data.ts';

/** The steps of a track, from 0 at its smallest value to STEPS at its largest. */
export const STEPS = 1000;

/** The track of a limit for a vote. */
export interface Track {
  readonly definition: Definition;
  // The date of its figures, as its label writes it: "Ende 2015", "Nationalratswahl 2019".
  readonly date: string;
  // Each municipality's value as the panel writes it, in units of its last digit, in the order of
  // the file's list; null without a figure.
  readonly values: readonly (number | null)[];
  // The smallest and the largest value, and the smallest above zero, where a logarithmic track
  // starts its steps from 1 when its smallest value is 0.
  readonly smallest: number;
  readonly largest: number;
  readonly aboveZero: number;
}

/** The track of `definition` for the figures that apply to a vote. */
export function trackOf(
  definition: Definition,
  file: CharacteristicsFile,
  applying: Applying,
): Track {
  const values = file.municipalities.map((_, i) =>
    unitsOf(definition, definition.value(countsAt(file, applying, i))),
  );
  let smallest = Infinity;
  let largest = -Infinity;
  let aboveZero = Infinity;
  for (const value of values) {
    if (value === null) continue;
    if (value < smallest) smallest = value;
    if (value > largest) largest = value;
    if (value > 0 && value < aboveZero) aboveZero = value;
  }
  const date = DATE_OF[definition.source](definition.year(applying));
  return { definition, date, values, smallest, largest, aboveZero };
}

// The date of a characteristic's figures, by its source, as a limit's label writes it.
const DATE_OF: Readonly<Record<Source, (year: number) => string>> = {
  population: populationDate,
  election: electionHeading,
  census: censusDate,
  area: (year) => String(year),
  cattle: (year) => String(year),
};

/**
 * The value of a step, in units, rounded half up. On a linear track the steps add equal
 * differences from the smallest value to the largest; on a logarithmic one they multiply by
 * equal factors. When the smallest value of a logarithmic track is 0, step 0 is 0, and the
 * steps from 1 run from the smallest value above zero to the largest.
 */
export function valueAt(track: Track, step: number): number {
  const { smallest, largest, aboveZero } = track;
  if (track.definition.scale === 'linear') {
    return Math.floor((2 * (smallest * STEPS + (largest - smallest) * step) + STEPS) / (2 * STEPS));
  }
  if (smallest > 0) {
    return Math.floor(smallest * (largest / smallest) ** (step / STEPS) + 0.5);
  }
  if (step === 0) return 0;
  return Math.floor(aboveZero * (largest / aboveZero) ** ((step - 1) / (STEPS - 1)) + 0.5);
}

/**
 * The label of a limit with its bounds at the steps `lower` and `upper`: "Ausländeranteil (Ende
 * 2015): von 0.00% bis 19.98%" (spec limits, "The label of a limit").
 */
export function labelOf(track: Track, lower: number, upper: number): string {
  const { definition } = track;
  return limitLabel(
    definition.name,
    track.date,
    writeUnits(definition, valueAt(track, lower)),
    writeUnits(definition, valueAt(track, upper)),
  );
}

/** A limit as the page holds it: its track, and the steps of its lower and upper bound. */
export interface LimitSetting {
  readonly track: Track;
  readonly lower: number;
  readonly upper: number;
}

/**
 * The numbers of the municipalities that remain under the limits (spec limits, "Which
 * municipalities remain"), from the file's list `numbers`, in whose order every track holds its
 * values. A limit with both bounds at the ends of its track sets nothing aside.
 */
export function remainingUnder(
  numbers: readonly number[],
  limits: readonly LimitSetting[],
): Set<number> {
  return remainingMunicipalities(
    numbers,
    limits.map(({ track, lower, upper }) => ({
      values: track.values,
      lower: valueAt(track, lower),
      upper: valueAt(track, upper),
    })),
  );
}

/**
 * Whether a limit sets anything aside: the value of a bound lies inside its track's values, the
 * rule of the calculation's selection. A step away from an end whose value is still the end's
 * sets nothing aside.
 */
export function isNarrowed({ track, lower, upper }: LimitSetting): boolean {
  return valueAt(track, lower) > track.smallest || valueAt(track, upper) < track.largest;
}

/**
 * The municipalities with an entry, `withEntry`, that the selection sets aside: those not among
 * the `remaining` (spec limits; dark grey on the map, spec result-map).
 */
export function setAsideOf(
  withEntry: readonly number[],
  remaining: ReadonlySet<number>,
): Set<number> {
  return new Set(withEntry.filter((number) => !remaining.has(number)));
}

/**
 * How many of the municipalities with an entry, `withEntry`, remain (spec limits, "The number of
 * municipalities that remain").
 */
export function remainingOf(withEntry: readonly number[], remaining: ReadonlySet<number>): number {
  let left = 0;
  for (const number of withEntry) if (remaining.has(number)) left += 1;
  return left;
}
