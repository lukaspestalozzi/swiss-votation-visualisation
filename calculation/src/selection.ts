import type { Entry } from './result.ts';

/**
 * A limit on one characteristic: its value for each municipality, in the order of the numbers it
 * is applied to (`null` where a municipality has no figure), and its lower and upper bound, each
 * included.
 */
export interface Limit {
  readonly values: readonly (number | null)[];
  readonly lower: number;
  readonly upper: number;
}

/**
 * Whether a limit sets anything aside: a bound lies above the smallest or below the largest of
 * its values. A limit at both ends sets nothing aside, not even a municipality without a figure.
 */
function isNarrowed(limit: Limit): boolean {
  let smallest = Infinity;
  let largest = -Infinity;
  for (const value of limit.values) {
    if (value === null) continue;
    if (value < smallest) smallest = value;
    if (value > largest) largest = value;
  }
  return limit.lower > smallest || limit.upper < largest;
}

/**
 * The numbers of the municipalities that remain: for every narrowed limit, a municipality has a
 * figure that lies within both bounds. It throws a RangeError when a limit has not one value per
 * municipality: a value is never assumed.
 */
export function remainingMunicipalities(
  numbers: readonly number[],
  limits: readonly Limit[],
): Set<number> {
  for (const limit of limits) {
    if (limit.values.length !== numbers.length) {
      throw new RangeError(
        `a limit has ${String(limit.values.length)} values for ${String(numbers.length)} municipalities`,
      );
    }
  }
  const narrowed = limits.filter(isNarrowed);
  const remaining = new Set<number>();
  numbers.forEach((number, i) => {
    const within = narrowed.every((limit) => {
      const value = limit.values[i];
      return value !== null && value !== undefined && limit.lower <= value && value <= limit.upper;
    });
    if (within) remaining.add(number);
  });
  return remaining;
}

/**
 * The entries of one canton of a vote: each municipality's number, yes and no votes, and the yes
 * and no votes of its Swiss abroad where the canton counts them apart, or `null`.
 */
export interface CantonEntries {
  readonly canton: string;
  readonly municipalities: readonly (readonly [number, number, number])[];
  readonly abroad: readonly [number, number] | null;
}

/**
 * The entries that remain: those of the municipalities that remain, and, while the Swiss abroad
 * are counted, the Swiss abroad of each canton in which at least one municipality remains, so
 * that a canton with nothing else left has no cantonal vote (hard constraint 2).
 */
export function entriesThatRemain(
  cantons: readonly CantonEntries[],
  remaining: ReadonlySet<number>,
  abroadCounted: boolean,
): Entry[] {
  const entries: Entry[] = [];
  for (const { canton, municipalities, abroad } of cantons) {
    let left = false;
    for (const [number, yes, no] of municipalities) {
      if (!remaining.has(number)) continue;
      entries.push({ canton, yes, no });
      left = true;
    }
    if (abroadCounted && left && abroad !== null) {
      entries.push({ canton, yes: abroad[0], no: abroad[1] });
    }
  }
  return entries;
}
