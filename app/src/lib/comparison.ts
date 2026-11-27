// The comparison of two votes (spec vote-comparison): the votes it offers, as the page holds them
// from the build; its address; the selection read anew on another first vote's tracks; and each
// vote's table. The design of the change add-vote-comparison gives the reasons (decisions 2 to 6,
// 8 and 9).
import { calculateResult, entriesThatRemain, majoritiesNeeded, type Majorities } from 'calculation';
import type { Definition } from './characteristics.ts';
import { formatCount } from './format.ts';
import { remainingOf, type LimitSetting, type Track } from './limits.ts';
import type { VoteEntries } from './result-map.ts';
import { linkOf, selectionOf, type Selection } from './share-link.ts';
import type { Texts } from './texts/index.ts';
import type { VoteFile, Votes } from './vote-data.ts';
import { judgedOf, votePage, type Judged, type ResultShown, type Summary } from './vote-page.ts';

/** A vote the comparison offers: one the calculation judges, in the language of its texts. */
export interface Comparable {
  readonly id: number;
  // Its day, as the list of votes writes it: "2016-02-28".
  readonly date: string;
  // How the lists write it: "28. Februar 2016 · Volksinitiative «Für Ehe und Familie - …»".
  readonly choice: string;
  // How its table's head writes it, as its page does.
  readonly title: string;
  readonly dateAndKind: string;
  // Its summary and the link to its day's explanations, as its page shows them.
  readonly summary: Summary;
  readonly majorities: Majorities;
  // The notes its page has below its result: a known difference, a provisional result.
  readonly notes: readonly string[];
}

/**
 * The votes the comparison offers, as the start page orders them: newest first, by id within a
 * day, every vote of `listing` the calculation judges, each with what its page writes from its
 * file (`fileOf`).
 */
export function comparableVotes(
  listing: Votes,
  fileOf: (id: number) => VoteFile | undefined,
  t: Texts,
): Comparable[] {
  return [...listing.votes]
    .sort((a, b) => b.date.localeCompare(a.date) || a.id - b.id)
    .flatMap((vote) => {
      const majorities = majoritiesNeeded(vote.kind);
      if (majorities === 'not-calculated') return [];
      const page = votePage(vote, fileOf(vote.id), t);
      return [
        {
          id: vote.id,
          date: vote.date,
          choice: `${page.date} · ${page.title}`,
          title: page.title,
          dateAndKind: `${page.date} · ${page.kind}`,
          summary: page.summary,
          majorities,
          notes: [...page.differences, ...(page.provisional === null ? [] : [page.provisional])],
        },
      ];
    });
}

/**
 * The votes the second list offers, from `votes` in the start page's order: all but the first
 * vote, `first`, those of its day first (design, decision 5).
 */
export function secondChoices(votes: readonly Comparable[], first: number): Comparable[] {
  const day = votes.find((vote) => vote.id === first)?.date;
  const others = votes.filter((vote) => vote.id !== first);
  return [
    ...others.filter((vote) => vote.date === day),
    ...others.filter((vote) => vote.date !== day),
  ];
}

/**
 * The part of the comparison's address after `#`, without the `#`: `votes=` and the chosen
 * votes' ids, the first then the second, then `&` and the selection's link as a vote's page
 * writes it (`linkOf`); empty while no vote is chosen (design, decision 8).
 */
export function comparisonLinkOf(chosen: readonly number[], selection: string): string {
  if (chosen.length === 0) return '';
  const votes = `votes=${chosen.join(',')}`;
  return selection === '' ? votes : `${votes}&${selection}`;
}

/** A comparison's address read: the votes chosen, the selection's link, and the unusable parts. */
export interface ComparisonRead {
  readonly votes: readonly number[];
  // The rest of the address, the selection, which the page reads with `selectionOf` on the first
  // vote's tracks once it has them.
  readonly rest: string;
  // The parts of `votes` it cannot use, each as `votes=<value>`, decoded.
  readonly unusable: readonly string[];
}

/**
 * The comparison the part of an address after `#`, without the `#`, holds, for the votes the
 * comparison offers, `judged` (design, decision 8).
 */
export function comparisonOf(link: string, judged: ReadonlySet<number>): ComparisonRead {
  const rest = new URLSearchParams();
  const votes: number[] = [];
  const unusable: string[] = [];
  let seen = false;
  for (const [key, value] of new URLSearchParams(link)) {
    if (key !== 'votes') {
      rest.append(key, value);
      continue;
    }
    if (seen) {
      unusable.push(`${key}=${value}`);
      continue;
    }
    seen = true;
    // One or two ids of votes the comparison offers, the second not the first: the ids before
    // the first that is not apply, and the part is named.
    const ids = value.split(',');
    let usable = ids.length <= 2;
    for (const id of ids.slice(0, 2)) {
      const vote = /^\d+$/.test(id) ? Number(id) : NaN;
      if (!judged.has(vote) || votes.includes(vote)) {
        usable = false;
        break;
      }
      votes.push(vote);
    }
    if (!usable) unusable.push(`${key}=${value}`);
  }
  return { votes, rest: rest.toString(), unusable };
}

/**
 * The selection of `limits` and the switch read anew on the tracks `trackFor` makes for another
 * first vote: each bound keeps its value, at the step nearest it (design, decision 9).
 */
export function readAnew(
  limits: readonly LimitSetting[],
  abroadCounted: boolean,
  trackFor: (definition: Definition) => Track,
): Selection {
  return selectionOf(linkOf(limits, abroadCounted), trackFor);
}

/** A vote's result with the selection, and how many of its municipalities remain. */
export interface Selected {
  readonly result: ResultShown;
  // "In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis."
  readonly count: string;
}

/**
 * A vote's result with the selection, from its `entries`: the entries of the municipalities that
 * remain, `remaining`, and the Swiss abroad of each canton in which one of them has an entry, while
 * `abroadCounted`; with the count of its municipalities that remain, as a vote's page writes them
 * (design, decision 2).
 */
export function withSelection(
  entries: VoteEntries,
  majorities: Majorities,
  remaining: ReadonlySet<number>,
  abroadCounted: boolean,
  t: Texts,
): Selected {
  const kept = entriesThatRemain(entries.cantons, remaining, abroadCounted);
  const cantons = entries.cantons
    .filter((canton) => canton.municipalities.length > 0 || canton.abroad !== null)
    .map((canton) => canton.canton);
  const withEntry = entries.cantons.flatMap((canton) =>
    canton.municipalities.map(([number]) => number),
  );
  const left = remainingOf(withEntry, remaining);
  return {
    result: judgedOf(calculateResult(kept, majorities), majorities, cantons, t),
    count:
      left === 0
        ? t.NOTHING_REMAINS
        : t.remainingCount(formatCount(left), formatCount(withEntry.length)),
  };
}

/**
 * A chosen vote's results as its page draws them, each in a row of its own (spec vote-comparison,
 * "The results of a vote"): the heading of each, what `ResultRow.svelte` takes, and the vote's
 * count while a selection applies.
 */
export interface VoteResults {
  readonly rows: readonly {
    readonly heading: string;
    readonly result: ResultShown;
    // The vote's turnout; the result of a selection has none.
    readonly turnout: string | null;
    readonly selection: boolean;
  }[];
  readonly count: string | null;
}

/**
 * The results of a vote: its real one and, while a selection applies, below it the result with
 * the selection, `selected` (design of redesign-site, decision 26).
 */
export function resultsOf(real: Judged, selected: Selected | null, t: Texts): VoteResults {
  const own = { heading: t.REAL_RESULT, result: real, turnout: real.turnout, selection: false };
  if (selected === null) return { rows: [own], count: null };
  return {
    rows: [
      own,
      { heading: t.WITH_SELECTION, result: selected.result, turnout: null, selection: true },
    ],
    count: selected.count,
  };
}
