// What the map of a vote shows (spec result-map): the colour of each municipality from its
// yes and no votes, the legend, and the details of a municipality. The design of the change
// add-result-map gives the reasons (decisions 5, 6, 8 and 12).
import type { CantonEntries } from 'calculation';
import { formatCount, formatShare } from './format.ts';
import {
  LEGEND_SET_ASIDE,
  LEGEND_TIE,
  LEGEND_WITHOUT_RESULT,
  NO_VOTES,
  WITHOUT_RESULT,
  YES_SHARE,
  YES_VOTES,
  legendClass,
} from './texts.ts';
import type { VoteFile } from './vote-data.ts';

export type Side = 'yes' | 'no';
// The class of the share of the side with more votes: 1 from 50% to below 60%, 2 from 60%, 3
// from 70%, 4 from 80%.
export type Step = 1 | 2 | 3 | 4;
export type Colouring = { readonly side: Side; readonly step: Step } | 'tie';

/** The side with more votes and the class of its share, compared in whole numbers. */
export function colouringOf(yes: number, no: number): Colouring {
  if (yes === no) return 'tie';
  const won = Math.max(yes, no);
  const total = yes + no;
  const step: Step =
    10 * won >= 8 * total ? 4 : 10 * won >= 7 * total ? 3 : 10 * won >= 6 * total ? 2 : 1;
  return { side: yes > no ? 'yes' : 'no', step };
}

// The colours of the classes, from class 1 to class 4: blue-green for yes, orange-red for no.
// investigations/map-data.md measures how far apart they are.
const COLOURS: Readonly<Record<Side, readonly [string, string, string, string]>> = {
  no: ['#fbbea3', '#e5946f', '#c2673b', '#934319'],
  yes: ['#92dfd0', '#4bc1ad', '#009c86', '#007260'],
};
export const TIE_COLOUR = '#f0efec';
export const LAKE_COLOUR = '#9fb8e8';
// A municipality without a result: grey diagonal lines on white.
export const HATCH_LINE = '#999999';
export const HATCH_BACKGROUND = '#ffffff';
// A municipality the selection sets aside (spec result-map, "A set-aside municipality"): the
// only grey apart from the yes colours for a red-green colour vision deficiency
// (investigations/limits.md, 6).
export const SET_ASIDE_COLOUR = '#2c2c2c';

/** The fill of a municipality with an entry. */
export function colourOf(colouring: Colouring): string {
  return colouring === 'tie' ? TIE_COLOUR : COLOURS[colouring.side][colouring.step - 1];
}

// An entry of the legend: its text, and its colour or the hatching.
export interface LegendEntry {
  readonly label: string;
  readonly fill: string;
}

const STEPS = [1, 2, 3, 4] as const;
const from = (step: Step): number => 40 + 10 * step;

/** From the clearest no to the clearest yes, then a tie and the hatching. */
export const LEGEND: readonly LegendEntry[] = [
  ...[...STEPS].reverse().map((step) => ({
    label: legendClass(false, from(step)),
    fill: colourOf({ side: 'no', step }),
  })),
  ...STEPS.map((step) => ({
    label: legendClass(true, from(step)),
    fill: colourOf({ side: 'yes', step }),
  })),
  { label: LEGEND_TIE, fill: TIE_COLOUR },
  { label: LEGEND_WITHOUT_RESULT, fill: 'hatch' },
];

// The legend's last entry while the selection sets a municipality aside (spec result-map, "The
// legend").
export const LEGEND_SET_ASIDE_ENTRY: LegendEntry = {
  label: LEGEND_SET_ASIDE,
  fill: SET_ASIDE_COLOUR,
};

// What pointing at a municipality shows: its name, then one line per figure.
export interface Details {
  readonly name: string;
  readonly lines: readonly string[];
}

/**
 * The details of a municipality from its name, its canton and its yes and no votes; `null` for
 * a municipality without a result of its own.
 */
export function detailsOf(
  name: string,
  canton: string,
  figures: readonly [number, number] | null,
): Details {
  const title = name.endsWith(`(${canton})`) ? name : `${name} (${canton})`;
  if (figures === null) return { name: title, lines: [WITHOUT_RESULT] };
  const [yes, no] = figures;
  return {
    name: title,
    lines: [
      `${YES_SHARE}: ${formatShare(yes, yes + no)}`,
      `${YES_VOTES}: ${formatCount(yes)}`,
      `${NO_VOTES}: ${formatCount(no)}`,
    ],
  };
}

// What a vote's page holds for its map and its selection, written when the site is built
// (design of add-limits, decision 20).
export interface VoteEntries {
  // Per canton in the order of the vote's file, the entries that count for it: its municipalities
  // as [number, yes votes, no votes], and its Swiss abroad as [yes votes, no votes] where it counts
  // them apart.
  readonly cantons: readonly CantonEntries[];
  // The municipalities the vote's file names as without a result.
  readonly withoutResult: readonly number[];
}

/**
 * The entries of a vote, checked against the map with the municipalities `onTheMap`;
 * `swissAbroad` are the numbers of the entries of Swiss abroad.
 */
export function voteEntriesOf(
  file: VoteFile,
  onTheMap: readonly number[],
  swissAbroad: readonly number[],
): VoteEntries {
  const map = new Set(onTheMap);
  const abroadNumbers = new Set(swissAbroad);
  const counted = new Set<number>(file.withoutResult);
  const cantons = Object.entries(file.entries).map(([canton, rows]): CantonEntries => {
    const municipalities: [number, number, number][] = [];
    let abroad: [number, number] | null = null;
    for (const [number, , , , yes, no] of rows) {
      if (abroadNumbers.has(number)) {
        abroad = [yes, no];
      } else if (map.has(number)) {
        municipalities.push([number, yes, no]);
        counted.add(number);
      } else {
        throw new Error(
          `vote ${String(file.id)}: the entry ${String(number)} is no municipality of the map`,
        );
      }
    }
    return { canton, municipalities, abroad };
  });
  for (const number of onTheMap) {
    if (!counted.has(number)) {
      throw new Error(
        `vote ${String(file.id)}: the municipality ${String(number)} of the map has no entry ` +
          'and is not named as without a result',
      );
    }
  }
  return { cantons, withoutResult: [...file.withoutResult] };
}
