// The start page's list of votes (spec vote-list): what each entry shows, grouped by year.
import { formatDate, formatShare } from './format.ts';
import type { Texts } from './texts/index.ts';
import { voteText, type Vote, type Votes } from './vote-data.ts';
import type { Side } from './vote-page.ts';

export interface ListEntry {
  readonly id: number;
  readonly date: string;
  readonly title: string;
  readonly kind: string;
  // The official result: its verdict and yes share.
  readonly result: string;
  // The side of its verdict, whose colour the whole result takes; none for a tie-break question
  // (spec site-style, "The verdicts in the map's colours").
  readonly side: Side;
  readonly marks: readonly string[];
}

export interface ListYear {
  readonly year: string;
  readonly entries: readonly ListEntry[];
}

export function voteList(listing: Votes, t: Texts): ListYear[] {
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
    years.at(-1)?.entries.push(entryOf(vote, t));
  }
  return years;
}

function entryOf(vote: Vote, t: Texts): ListEntry {
  return {
    id: vote.id,
    date: formatDate(vote.date, t),
    title: voteText(vote, 'title', t.LANGUAGE),
    kind: t.KINDS[vote.kind],
    result: resultOf(vote, t),
    side: vote.kind === 'tie-break-question' ? null : vote.result.passed ? 'yes' : 'no',
    marks: [
      ...(vote.note === null ? [] : [t.MARK_NOTE]),
      ...(vote.validated ? [] : [t.MARK_PROVISIONAL]),
    ],
  };
}

function resultOf(vote: Vote, t: Texts): string {
  const { yes, no, passed } = vote.result;
  const yesShare = formatShare(yes, yes + no);
  if (vote.kind === 'tie-break-question') return t.listTieBreak(yesShare);
  if (passed === null) throw new Error(`vote ${String(vote.id)} has no verdict`);
  return t.listResult(passed ? t.LIST_PASSED : t.LIST_FAILED, yesShare);
}
