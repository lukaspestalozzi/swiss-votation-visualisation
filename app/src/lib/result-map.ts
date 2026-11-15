// What the map of a vote shows (spec result-map): the colour of each municipality from its
// yes and no votes, the legend, and the details of a municipality. The design of the change
// add-result-map gives the reasons (decisions 5, 6, 8 and 12).
import { formatCount, formatShare } from './format.ts';
import {
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

// What a vote's page holds for its map, written when the site is built.
export interface MapFigures {
  // Per municipality of the map with an entry: [number, yes votes, no votes], by number.
  readonly figures: readonly (readonly [number, number, number])[];
  // The municipalities the vote's file names as without a result.
  readonly withoutResult: readonly number[];
  // The number of the vote's entries of Swiss abroad, which are not on the map.
  readonly swissAbroad: number;
}

/**
 * The figures of a vote for the map with the municipalities `onTheMap`; `swissAbroad` are the
 * numbers of the entries of Swiss abroad.
 */
export function mapFiguresOf(
  file: VoteFile,
  onTheMap: readonly number[],
  swissAbroad: readonly number[],
): MapFigures {
  const map = new Set(onTheMap);
  const abroadNumbers = new Set(swissAbroad);
  const figures: [number, number, number][] = [];
  let abroad = 0;
  for (const rows of Object.values(file.entries)) {
    for (const [number, , , , yes, no] of rows) {
      if (abroadNumbers.has(number)) {
        abroad += 1;
      } else if (map.has(number)) {
        figures.push([number, yes, no]);
      } else {
        throw new Error(
          `vote ${String(file.id)}: the entry ${String(number)} is no municipality of the map`,
        );
      }
    }
  }
  figures.sort((a, b) => a[0] - b[0]);
  const counted = new Set([...figures.map(([number]) => number), ...file.withoutResult]);
  for (const number of onTheMap) {
    if (!counted.has(number)) {
      throw new Error(
        `vote ${String(file.id)}: the municipality ${String(number)} of the map has no entry ` +
          'and is not named as without a result',
      );
    }
  }
  return { figures, withoutResult: [...file.withoutResult], swissAbroad: abroad };
}
