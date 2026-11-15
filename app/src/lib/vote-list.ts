// The start page's list of votes (spec vote-list): what each entry shows, grouped by year.
import { formatDate, formatShare } from './format.ts';
import {
  KINDS,
  LIST_FAILED,
  LIST_PASSED,
  listResult,
  listTieBreak,
  MARK_NOTE,
  MARK_PROVISIONAL,
} from './texts.ts';
import type { Vote, Votes } from './vote-data.ts';

export interface ListEntry {
  readonly id: number;
  readonly date: string;
  readonly title: string;
  readonly href: string;
  readonly kind: string;
  // The official result: its verdict and yes share.
  readonly result: string;
  readonly marks: readonly string[];
}

export interface ListYear {
  readonly year: string;
  readonly entries: readonly ListEntry[];
}

export function voteList(listing: Votes): ListYear[] {
  if (listing.votes.length === 0) {
    throw new Error('the list of votes (app/static/data/votes.json) holds no vote');
  }
  const years: { year: string; entries: ListEntry[] }[] = [];
  const newestFirst = [...listing.votes].sort(
    (a, b) => b.date.localeCompare(a.date) || a.id - b.id,
  );
  for (const vote of newestFirst) {
    const year = vote.date.slice(0, 4);
    if (years.at(-1)?.year !== year) years.push({ year, entries: [] });
    years.at(-1)?.entries.push(entryOf(vote));
  }
  return years;
}

function entryOf(vote: Vote): ListEntry {
  return {
    id: vote.id,
    date: formatDate(vote.date),
    title: vote.title.de,
    href: `/votes/${String(vote.id)}`,
    kind: KINDS[vote.kind],
    result: resultOf(vote),
    marks: [
      ...(vote.note === null ? [] : [MARK_NOTE]),
      ...(vote.validated ? [] : [MARK_PROVISIONAL]),
    ],
  };
}

function resultOf(vote: Vote): string {
  const { yes, no, passed } = vote.result;
  const yesShare = formatShare(yes, yes + no);
  if (vote.kind === 'tie-break-question') return listTieBreak(yesShare);
  if (passed === null) throw new Error(`vote ${String(vote.id)} has no verdict`);
  return listResult(passed ? LIST_PASSED : LIST_FAILED, yesShare);
}
