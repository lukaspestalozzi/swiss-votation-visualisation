// The limits on the characteristics (spec limits): a limit's track, made from its
// characteristic's one definition. The design of the change add-limits gives the reasons
// (decisions 5, 16 and 17).
import { remainingMunicipalities } from 'calculation';
import {
  countsAt,
  dateOf,
  nameOf,
  unitsOf,
  writeUnits,
  type Applying,
  type Definition,
} from './characteristics.ts';
import type { Texts } from './texts/index.ts';
import type { CharacteristicsFile } from './vote-data.ts';

/** The steps of a track, from 0 at its smallest value to STEPS at its largest. */
export const STEPS = 1000;

/** The track of a limit for a vote. */
export interface Track {
  readonly definition: Definition;
  // The year of its figures, whose date its label writes: "Ende 2015", "Nationalratswahl 2019".
  readonly year: number;
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
  return { definition, year: definition.year(applying), values, smallest, largest, aboveZero };
}

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
 * The lowest step of a track whose value is not below `value`: where a municipality with that
 * value lies on the track (spec limits, "Where the municipalities lie on a track"). `valueAt`
 * never falls from one step to the next, so the step is found by halving.
 */
export function stepOf(track: Track, value: number): number {
  return lowestStep((step) => valueAt(track, step), value);
}

/** The lowest step from 0 to STEPS whose value, given by `at`, is not below `value`. */
function lowestStep(at: (step: number) => number, value: number): number {
  let low = 0;
  let high = STEPS;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (at(middle) < value) low = middle + 1;
    else high = middle;
  }
  return low;
}

/** The bars of a track's histogram, each for the same number of steps. */
export const BINS = 50;

/**
 * How many municipalities lie in each bar of a track's histogram: 50 bars of 20 steps each, the
 * last with step 1,000 (spec limits, "Where the municipalities lie on a track"; design of
 * redesign-site, decision 21). A municipality counts at its step; one without a figure in no
 * bar. The values of the steps are worked out once, not for every municipality.
 */
export function histogramOf(track: Track): number[] {
  const values = Array.from({ length: STEPS + 1 }, (_, step) => valueAt(track, step));
  const at = (step: number) => values[step] ?? Infinity;
  const bars = new Array<number>(BINS).fill(0);
  for (const value of track.values) {
    if (value === null) continue;
    const bar = Math.min(BINS - 1, Math.floor((lowestStep(at, value) * BINS) / STEPS));
    bars[bar] = (bars[bar] ?? 0) + 1;
  }
  return bars;
}

/**
 * The label of a limit with its bounds at the steps `lower` and `upper`: "Ausländeranteil (Ende
 * 2015): von 0.00% bis 19.98%" (spec limits, "The label of a limit").
 */
export function labelOf(track: Track, lower: number, upper: number, t: Texts): string {
  const { definition } = track;
  return t.limitLabel(
    nameOf(definition, t),
    dateOf(definition, track.year, t),
    writeUnits(definition, valueAt(track, lower), t),
    writeUnits(definition, valueAt(track, upper), t),
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
