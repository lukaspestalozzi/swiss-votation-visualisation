// What a vote's page shows (spec verdicts): the texts and figures, written as the screen shows
// them, from the vote of the list of votes and the result the calculation gives over its file.
import {
  CANTONS,
  calculateResult,
  majoritiesNeeded,
  type Majorities,
  type Result,
} from 'calculation';
import { formatCantonalVotes, formatCount, formatDate, formatShare } from './format.ts';
import type { Texts } from './texts/index.ts';
import { voteText, type Row, type Vote, type VoteFile } from './vote-data.ts';

// The side a verdict's word stands for, which the page writes in the map's colour of that side
// (spec site-style, "The verdicts in the map's colours"); none for "nicht nötig" or "–".
export type Side = 'yes' | 'no' | null;

// A majority: its heading, whether it is reached, and its yes share or cantonal votes.
export interface Verdict {
  readonly heading: string;
  readonly verdict: string;
  readonly side: Side;
  readonly figure: string;
  readonly greyed: boolean;
}

// A row of the table of the cantons: `side` is the word, `forSide` the side it stands for.
// `yesPercent` is what its bar draws, the yes share in percent: none without a valid vote, and
// for a canton with nothing left (spec verdicts, "The bar of a canton").
export interface CantonRow {
  readonly canton: string;
  readonly yesShare: string;
  readonly yesPercent: number | null;
  readonly cantonalVotes: string;
  readonly side: string;
  readonly forSide: Side;
}

// A canton's part of the Ständemehr's bar (spec verdicts, "The bars of a result"): its cantonal
// votes, 1 or ½, are the part's weight, and it takes the colour of the side they count for.
export interface Segment {
  readonly canton: string;
  readonly weight: number;
  readonly side: 'yes' | 'no';
}

// The figures and verdicts of a result, and its table of the cantons: those of a vote, written
// when the site is built, and those of a selection, written in the browser (spec verdicts).
export interface ResultShown {
  readonly yesVotes: string;
  readonly noVotes: string;
  // What the bars draw: the yes share in percent, none without a valid vote, and the cantons with
  // a cantonal vote, those in favour before those against, each in the constitution's order.
  readonly yesPercent: number | null;
  readonly segments: readonly Segment[];
  readonly verdicts: readonly [Verdict, Verdict];
  readonly outcome: string;
  readonly outcomeSide: Side;
  readonly cantons: readonly CantonRow[];
}

// The figures and verdicts of a vote the calculation judges, with its turnout.
export interface Judged extends ResultShown {
  readonly turnout: string;
}

// A tie-break question: the votes and the cantons for each side, from the vote's result.
export interface TieBreak {
  readonly initiative: string;
  readonly counterProposal: string;
  // What the bar draws: the initiative's share of the two in percent, none without a vote.
  readonly initiativePercent: number | null;
  readonly cantons: string;
  readonly notJudged: string;
}

export interface VotePage {
  readonly title: string;
  readonly date: string;
  readonly kind: string;
  // Null for a tie-break question, which the calculation does not judge.
  readonly majoritiesNeeded: string | null;
  readonly judged: Judged | null;
  readonly tieBreak: TieBreak | null;
  // "Quelle: " and the reference to the official publication, for a validated vote.
  readonly source: string | null;
  // The sentence of a result that is not validated yet.
  readonly provisional: string | null;
  // The Federal Chancellery's note on the vote.
  readonly note: string | null;
  // For a validated vote, a note for each count that differs from the sum of its entries.
  readonly differences: readonly string[];
}

// The entries of a vote's file, each with the canton it counts for.
type Rows = readonly { readonly canton: string; readonly row: Row }[];

function rowsOf(file: VoteFile): Rows {
  return Object.entries(file.entries).flatMap(([canton, rows]) =>
    rows.map((row) => ({ canton, row })),
  );
}

/**
 * The result of a vote the calculation judges, from its file, as its page shows it: the vote that
 * `name` names, by the `majorities` it needs. The comparison of two votes calculates it in the
 * browser (spec vote-comparison, "The table of a vote").
 */
export function judgedOfFile(
  name: string,
  file: VoteFile,
  majorities: Majorities,
  t: Texts,
): Judged {
  return judgedOfRows(name, rowsOf(file), majorities, t);
}

export function votePage(vote: Vote, file: VoteFile | undefined, t: Texts): VotePage {
  const name = `vote ${String(vote.id)} of ${vote.date}`;
  if (file === undefined) {
    throw new Error(
      `${name} has no file of entries (app/static/data/votes/${String(vote.id)}.json)`,
    );
  }
  const rows = rowsOf(file);
  const majorities = majoritiesNeeded(vote.kind);
  return {
    title: voteText(vote, 'title', t.LANGUAGE),
    date: formatDate(vote.date, t),
    kind: t.KINDS[vote.kind],
    majoritiesNeeded: majorities === 'not-calculated' ? null : t.MAJORITIES_NEEDED[majorities],
    judged: majorities === 'not-calculated' ? null : judgedOfRows(name, rows, majorities, t),
    tieBreak: vote.kind === 'tie-break-question' ? tieBreakOf(vote, t) : null,
    source: vote.reference === null ? null : t.SOURCE + voteText(vote, 'reference', t.LANGUAGE),
    provisional: vote.validated ? null : t.PROVISIONAL,
    note: vote.note === null ? null : voteText(vote, 'note', t.LANGUAGE),
    differences: vote.validated ? differencesOf(vote, rows, t) : [],
  };
}

function differencesOf(vote: Vote, rows: Rows, t: Texts): string[] {
  let yes = 0;
  let no = 0;
  for (const { row } of rows) {
    yes += row[4];
    no += row[5];
  }
  const counts = [
    ['yes', vote.result.yes, yes],
    ['no', vote.result.no, no],
  ] as const;
  return counts
    .filter(([, official, summed]) => official !== summed)
    .map(([count, official, summed]) => {
      if (vote.reference === null) throw new Error(`vote ${String(vote.id)} has no reference`);
      return t.knownDifference(
        formatCount(official),
        count,
        voteText(vote, 'reference', t.LANGUAGE),
        formatCount(Math.abs(summed - official)),
        summed > official,
      );
    });
}

function tieBreakOf(vote: Vote, t: Texts): TieBreak {
  const { yes, no, cantonalVotesInFavour, cantonalVotesAgainst } = vote.result;
  if (cantonalVotesInFavour === null || cantonalVotesAgainst === null) {
    throw new Error(`the tie-break question ${String(vote.id)} has no cantons`);
  }
  return {
    initiative: t.forTheInitiative(formatCount(yes), formatShare(yes, yes + no)),
    counterProposal: t.forTheCounterProposal(formatCount(no), formatShare(no, yes + no)),
    initiativePercent: yes + no === 0 ? null : (yes / (yes + no)) * 100,
    cantons: t.tieBreakCantons(
      formatCantonalVotes(cantonalVotesInFavour),
      formatCantonalVotes(cantonalVotesAgainst),
    ),
    notJudged: t.TIE_BREAK_NOT_JUDGED,
  };
}

function judgedOfRows(name: string, rows: Rows, majorities: Majorities, t: Texts): Judged {
  let result: Result;
  try {
    result = calculateResult(
      rows.map(({ canton, row: [, , , , yes, no] }) => ({ canton, yes, no })),
      majorities,
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${name} cannot be calculated: ${reason}`, { cause: error });
  }
  let registered = 0;
  let cast = 0;
  for (const { row } of rows) {
    registered += row[1];
    cast += row[2];
  }
  const cantons = [...new Set(rows.map(({ canton }) => canton))];
  return { ...judgedOf(result, majorities, cantons, t), turnout: formatShare(cast, registered) };
}

/**
 * The figures, verdicts and table of a result, for a vote whose entries count for `cantonsOfVote`.
 * The table has a row for each of them, in the order of the Federal Constitution; a canton with
 * no entry left in the result says so (spec verdicts, "The cantons under a selection").
 */
export function judgedOf(
  result: Result,
  majorities: Majorities,
  cantonsOfVote: readonly string[],
  t: Texts,
): ResultShown {
  const yesShare = formatShare(result.yes, result.yes + result.no);
  const cantonsNeeded = majorities === 'voters-and-cantons';
  const outcomes = new Map(result.cantons.map((outcome) => [outcome.canton, outcome]));
  const ofVote = new Set(cantonsOfVote);
  const valid = result.yes + result.no;
  const segmentsOf = (inFavour: boolean): Segment[] =>
    result.cantons
      .filter((outcome) => outcome.inFavour === inFavour)
      .map((outcome) => ({
        canton: outcome.canton,
        weight: outcome.cantonalVotes,
        side: inFavour ? 'yes' : 'no',
      }));
  return {
    yesVotes: formatCount(result.yes),
    noVotes: formatCount(result.no),
    yesPercent: valid === 0 ? null : (result.yes / valid) * 100,
    segments: [...segmentsOf(true), ...segmentsOf(false)],
    verdicts: [
      {
        heading: t.MAJORITY_OF_VOTERS,
        verdict: result.majorityOfVoters ? t.REACHED : t.NOT_REACHED,
        side: result.majorityOfVoters ? 'yes' : 'no',
        figure: yesShare,
        greyed: false,
      },
      {
        heading: t.MAJORITY_OF_CANTONS,
        verdict: !cantonsNeeded
          ? t.NOT_NEEDED
          : result.majorityOfCantons
            ? t.REACHED
            : t.NOT_REACHED,
        side: !cantonsNeeded ? null : result.majorityOfCantons ? 'yes' : 'no',
        figure: t.cantonalVotes(
          formatCantonalVotes(result.cantonalVotesInFavour),
          formatCantonalVotes(result.cantonalVotesAgainst),
        ),
        greyed: !cantonsNeeded,
      },
    ],
    outcome: result.passed ? t.PASSED : t.FAILED,
    outcomeSide: result.passed ? 'yes' : 'no',
    cantons: CANTONS.filter(({ abbreviation }) => ofVote.has(abbreviation)).map(
      ({ abbreviation }): CantonRow => {
        const outcome = outcomes.get(abbreviation);
        if (outcome === undefined) {
          return {
            canton: abbreviation,
            yesShare: '–',
            yesPercent: null,
            cantonalVotes: t.NOTHING_LEFT,
            side: '–',
            forSide: null,
          };
        }
        const votes = outcome.yes + outcome.no;
        return {
          canton: abbreviation,
          yesShare: formatShare(outcome.yes, votes),
          yesPercent: votes === 0 ? null : (outcome.yes / votes) * 100,
          cantonalVotes: formatCantonalVotes(outcome.cantonalVotes),
          side: outcome.inFavour ? t.REACHED : t.NOT_REACHED,
          forSide: outcome.inFavour ? 'yes' : 'no',
        };
      },
    ),
  };
}
