// The start page's list of votes (spec vote-list): what each entry shows, grouped by year.
import { formatDay, formatShare } from './format.ts';
import type { Texts } from './texts/index.ts';
import { voteText, type Vote, type Votes } from './vote-data.ts';
import type { Side } from './vote-page.ts';

export interface ListEntry {
  readonly id: number;
  readonly title: string;
  readonly kind: string;
  // The yes share of the official result as its row writes it, "49.16% Ja"; of a tie-break
  // question, its share for the initiative.
  readonly share: string;
  // That share in percent, for the row's bar; none for a tie-break question, which has no bar.
  readonly yesPercent: number | null;
  // The official result, "angenommen" or "abgelehnt"; none for a tie-break question.
  readonly verdict: string | null;
  // The side of its verdict, whose colour the verdict takes; none for a tie-break question
  // (spec site-style, "The verdicts in the map's colours").
  readonly side: Side;
  readonly marks: readonly string[];
}

// The votes of one vote day, headed by its day and month: "28. Februar".
export interface ListDay {
  readonly day: string;
  readonly entries: readonly ListEntry[];
}

export interface ListYear {
  readonly year: string;
  readonly days: readonly ListDay[];
}

export function voteList(listing: Votes, t: Texts): ListYear[] {
  if (listing.votes.length === 0) {
    throw new Error('the list of votes (app/static/data/votes.json) holds no vote');
  }
  const years: { year: string; days: { date: string; day: string; entries: ListEntry[] }[] }[] = [];
  const newestFirst = [...listing.votes].sort(
    (a, b) => b.date.localeCompare(a.date) || a.id - b.id,
  );
  for (const vote of newestFirst) {
    const year = vote.date.slice(0, 4);
    if (years.at(-1)?.year !== year) years.push({ year, days: [] });
    const days = years.at(-1)?.days;
    if (days?.at(-1)?.date !== vote.date) {
      days?.push({ date: vote.date, day: formatDay(vote.date, t), entries: [] });
    }
    days?.at(-1)?.entries.push(entryOf(vote, t));
  }
  return years.map(({ year, days }) => ({
    year,
    days: days.map(({ day, entries }) => ({ day, entries })),
  }));
}

function entryOf(vote: Vote, t: Texts): ListEntry {
  return {
    id: vote.id,
    title: voteText(vote, 'title', t.LANGUAGE),
    kind: t.KINDS[vote.kind],
    ...resultOf(vote, t),
    marks: [
      ...(vote.note === null ? [] : [t.MARK_NOTE]),
      ...(vote.validated ? [] : [t.MARK_PROVISIONAL]),
    ],
  };
}

function resultOf(
  vote: Vote,
  t: Texts,
): Pick<ListEntry, 'share' | 'yesPercent' | 'verdict' | 'side'> {
  const { yes, no, passed } = vote.result;
  const yesShare = formatShare(yes, yes + no);
  if (vote.kind === 'tie-break-question') {
    return { share: t.listTieBreak(yesShare), yesPercent: null, verdict: null, side: null };
  }
  if (passed === null) throw new Error(`vote ${String(vote.id)} has no verdict`);
  return {
    share: t.listShare(yesShare),
    yesPercent: (yes / (yes + no)) * 100,
    verdict: passed ? t.LIST_PASSED : t.LIST_FAILED,
    side: passed ? 'yes' : 'no',
  };
}

// The votes a button of the list keeps: every vote, the accepted or the rejected ones.
export type Kept = 'all' | 'yes' | 'no';

/**
 * The list a search and a button leave (spec vote-list, "Finding a vote by its title" and "The
 * votes by their result"): the votes whose title holds every word typed, whatever the case, and
 * whose result is the one kept. A vote day or a year with no vote left is not in it.
 */
export function listShown(years: readonly ListYear[], typed: string, kept: Kept): ListYear[] {
  const words = typed.toLowerCase().split(/\s+/).filter(Boolean);
  const shows = (entry: ListEntry): boolean => {
    if (kept !== 'all' && entry.side !== kept) return false;
    const title = entry.title.toLowerCase();
    return words.every((word) => title.includes(word));
  };
  return years
    .map((year) => ({
      year: year.year,
      days: year.days
        .map((day) => ({ day: day.day, entries: day.entries.filter(shows) }))
        .filter((day) => day.entries.length > 0),
    }))
    .filter((year) => year.days.length > 0);
}
