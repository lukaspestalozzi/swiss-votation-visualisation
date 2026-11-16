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
import {
  cantonalVotes,
  FAILED,
  forTheCounterProposal,
  forTheInitiative,
  KINDS,
  knownDifference,
  MAJORITIES_NEEDED,
  MAJORITY_OF_CANTONS,
  MAJORITY_OF_VOTERS,
  NOT_NEEDED,
  NOTHING_LEFT,
  NOT_REACHED,
  PASSED,
  PROVISIONAL,
  REACHED,
  SOURCE,
  TIE_BREAK_NOT_JUDGED,
  tieBreakCantons,
} from './texts.ts';
import type { Row, Vote, VoteFile } from './vote-data.ts';

// A majority: its heading, whether it is reached, and its yes share or cantonal votes.
export interface Verdict {
  readonly heading: string;
  readonly verdict: string;
  readonly figure: string;
  readonly greyed: boolean;
}

// A row of the table of the cantons.
export interface CantonRow {
  readonly canton: string;
  readonly yesShare: string;
  readonly cantonalVotes: string;
  readonly side: string;
}

// The figures and verdicts of a result, and its table of the cantons: those of a vote, written
// when the site is built, and those of a selection, written in the browser (spec verdicts).
export interface ResultShown {
  readonly yesVotes: string;
  readonly noVotes: string;
  readonly yesShare: string;
  readonly verdicts: readonly [Verdict, Verdict];
  readonly outcome: string;
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

export function votePage(vote: Vote, file: VoteFile | undefined): VotePage {
  const name = `vote ${String(vote.id)} of ${vote.date}`;
  if (file === undefined) {
    throw new Error(
      `${name} has no file of entries (app/static/data/votes/${String(vote.id)}.json)`,
    );
  }
  const rows = Object.entries(file.entries).flatMap(([canton, rows]) =>
    rows.map((row) => ({ canton, row })),
  );
  const majorities = majoritiesNeeded(vote.kind);
  return {
    title: vote.title.de,
    date: formatDate(vote.date),
    kind: KINDS[vote.kind],
    majoritiesNeeded: majorities === 'not-calculated' ? null : MAJORITIES_NEEDED[majorities],
    judged: majorities === 'not-calculated' ? null : judgedOfRows(name, rows, majorities),
    tieBreak: vote.kind === 'tie-break-question' ? tieBreakOf(vote) : null,
    source: vote.reference === null ? null : SOURCE + vote.reference.de,
    provisional: vote.validated ? null : PROVISIONAL,
    note: vote.note === null ? null : vote.note.de,
    differences: vote.validated ? differencesOf(vote, rows) : [],
  };
}

function differencesOf(vote: Vote, rows: Rows): string[] {
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
      return knownDifference(
        formatCount(official),
        count,
        vote.reference.de,
        formatCount(Math.abs(summed - official)),
        summed > official,
      );
    });
}

function tieBreakOf(vote: Vote): TieBreak {
  const { yes, no, cantonalVotesInFavour, cantonalVotesAgainst } = vote.result;
  if (cantonalVotesInFavour === null || cantonalVotesAgainst === null) {
    throw new Error(`the tie-break question ${String(vote.id)} has no cantons`);
  }
  return {
    initiative: forTheInitiative(formatCount(yes), formatShare(yes, yes + no)),
    counterProposal: forTheCounterProposal(formatCount(no), formatShare(no, yes + no)),
    cantons: tieBreakCantons(
      formatCantonalVotes(cantonalVotesInFavour),
      formatCantonalVotes(cantonalVotesAgainst),
    ),
    notJudged: TIE_BREAK_NOT_JUDGED,
  };
}

function judgedOfRows(name: string, rows: Rows, majorities: Majorities): Judged {
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
  return { ...judgedOf(result, majorities, cantons), turnout: formatShare(cast, registered) };
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
): ResultShown {
  const yesShare = formatShare(result.yes, result.yes + result.no);
  const cantonsNeeded = majorities === 'voters-and-cantons';
  const outcomes = new Map(result.cantons.map((outcome) => [outcome.canton, outcome]));
  const ofVote = new Set(cantonsOfVote);
  return {
    yesVotes: formatCount(result.yes),
    noVotes: formatCount(result.no),
    yesShare,
    verdicts: [
      {
        heading: MAJORITY_OF_VOTERS,
        verdict: result.majorityOfVoters ? REACHED : NOT_REACHED,
        figure: yesShare,
        greyed: false,
      },
      {
        heading: MAJORITY_OF_CANTONS,
        verdict: !cantonsNeeded ? NOT_NEEDED : result.majorityOfCantons ? REACHED : NOT_REACHED,
        figure: cantonalVotes(
          formatCantonalVotes(result.cantonalVotesInFavour),
          formatCantonalVotes(result.cantonalVotesAgainst),
        ),
        greyed: !cantonsNeeded,
      },
    ],
    outcome: result.passed ? PASSED : FAILED,
    cantons: CANTONS.filter(({ abbreviation }) => ofVote.has(abbreviation)).map(
      ({ abbreviation }): CantonRow => {
        const outcome = outcomes.get(abbreviation);
        if (outcome === undefined) {
          return { canton: abbreviation, yesShare: '–', cantonalVotes: NOTHING_LEFT, side: '–' };
        }
        return {
          canton: abbreviation,
          yesShare: formatShare(outcome.yes, outcome.yes + outcome.no),
          cantonalVotes: formatCantonalVotes(outcome.cantonalVotes),
          side: outcome.inFavour ? REACHED : NOT_REACHED,
        };
      },
    ),
  };
}
