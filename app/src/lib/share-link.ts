// The selection in the address (spec share-link): a selection written as the part of a vote's
// address after `#`, and that part read back into a selection. The design of the change
// add-share-link gives the reasons (decisions 1 to 4).
import { DECIMALS, DEFINITIONS, type Definition } from './characteristics.ts';
import { formatUnits } from './format.ts';
import { STEPS, valueAt, type LimitSetting, type Track } from './limits.ts';

/**
 * A bound as the link writes it: as its label writes it, without the unit and the apostrophes,
 * and empty at its track's end, so that it stays at the end when the data change (decision 2).
 */
function boundOf(track: Track, step: number, end: number): string {
  const units = valueAt(track, step);
  if (units === end) return '';
  return formatUnits(units, DECIMALS[track.definition.unit]).replaceAll("'", '');
}

/**
 * The part of the address after `#`, without the `#`, that holds the limits and the switch for
 * the Swiss abroad: empty with no limit and the switch on.
 */
export function linkOf(limits: readonly LimitSetting[], abroadCounted: boolean): string {
  const parts = limits.map(
    ({ track, lower, upper }) =>
      `${track.definition.key}=${boundOf(track, lower, track.smallest)}-${boundOf(track, upper, track.largest)}`,
  );
  if (!abroadCounted) parts.push('abroad=no');
  return parts.join('&');
}

/** A selection read from a link, with the parts of the link it could not use. */
export interface Selection {
  readonly limits: readonly LimitSetting[];
  readonly abroadCounted: boolean;
  // Each as `<key>=<value>`, decoded, in the order of the link.
  readonly unusable: readonly string[];
}

/** The step whose value is nearest `units`; of two, the lower (decision 3). */
function nearestStep(track: Track, units: number): number {
  let nearest = 0;
  let distance = Infinity;
  for (let step = 0; step <= STEPS; step += 1) {
    const from = Math.abs(valueAt(track, step) - units);
    if (from < distance) {
      nearest = step;
      distance = from;
    }
  }
  return nearest;
}

/**
 * The step of a bound as the link writes it, or null when it is no number with at most the
 * decimals its label writes: an empty bound is at its track's end, `end`.
 */
function stepOf(track: Track, written: string, end: number): number | null {
  if (written === '') return end;
  const decimals = DECIMALS[track.definition.unit];
  const number = /^(\d+)(?:\.(\d+))?$/.exec(written);
  if (number === null) return null;
  const [, whole, fraction = ''] = number;
  if (fraction.length > decimals) return null;
  return nearestStep(
    track,
    Number(whole) * 10 ** decimals + Number(fraction.padEnd(decimals, '0')),
  );
}

/** The limit a part of the link gives, or null when it cannot be used (decision 4). */
function limitOf(
  key: string,
  value: string,
  trackFor: (definition: Definition) => Track,
): LimitSetting | null {
  const definition = DEFINITIONS.find((candidate) => candidate.key === key);
  if (definition === undefined) return null;
  const track = trackFor(definition);
  const bounds = /^([^-]*)-([^-]*)$/.exec(value);
  if (bounds === null) return null;
  const lowerStep = stepOf(track, bounds[1], 0);
  const upperStep = stepOf(track, bounds[2], STEPS);
  if (lowerStep === null || upperStep === null || lowerStep > upperStep) return null;
  return { track, lower: lowerStep, upper: upperStep };
}

/**
 * The selection the part of an address after `#`, without the `#`, holds: its limits in the
 * link's order, on the tracks `trackFor` makes for the vote, each bound at the step nearest the
 * link's value; the switch off for `abroad=no`; and the parts it cannot use (decision 4).
 */
export function selectionOf(link: string, trackFor: (definition: Definition) => Track): Selection {
  const limits: LimitSetting[] = [];
  let abroadCounted = true;
  const unusable: string[] = [];
  const seen = new Set<string>();
  for (const [key, value] of new URLSearchParams(link)) {
    const first = !seen.has(key);
    seen.add(key);
    if (key === 'abroad') {
      if (first && value === 'no') abroadCounted = false;
      else unusable.push(`${key}=${value}`);
      continue;
    }
    const limit = first ? limitOf(key, value, trackFor) : null;
    if (limit === null) unusable.push(`${key}=${value}`);
    else limits.push(limit);
  }
  return { limits, abroadCounted, unusable };
}
