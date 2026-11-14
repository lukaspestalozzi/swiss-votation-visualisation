import { CANTONS } from './cantons.ts';
import type { Majorities } from './kinds.ts';

const CANTONAL_VOTES: ReadonlyMap<string, number> = new Map(
  CANTONS.map((canton) => [canton.abbreviation, canton.cantonalVotes]),
);

/** One line of the results of a vote: a municipality, or the Swiss abroad of a canton. */
export interface Entry {
  /** The abbreviation of the entry's canton, for example `ZH`. */
  readonly canton: string;
  readonly yes: number;
  readonly no: number;
}

/** The result of a vote, calculated from the entries that remain. */
export interface Result {
  readonly yes: number;
  readonly no: number;
  /** The yes votes plus the no votes. */
  readonly valid: number;
  /** The yes votes divided by the valid votes, from 0 to 1. With no valid vote there is none. */
  readonly yesShare: number | undefined;
  /** The cantonal votes of the cantons with more yes than no votes. */
  readonly cantonalVotesInFavour: number;
  /** The cantonal votes of the other cantons that have an entry; a tie counts against. */
  readonly cantonalVotesAgainst: number;
  /** More yes than no votes, that is, more than half of the valid votes. */
  readonly majorityOfVoters: boolean;
  /** More cantonal votes in favour than against. Given for every vote, needed or not. */
  readonly majorityOfCantons: boolean;
  /** The verdict: the majority of voters and, where it is needed, the majority of cantons. */
  readonly passed: boolean;
}

/** A number of votes is a whole number from zero. */
function isCount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * The result of a vote from the entries that remain, each counted once, in one pass.
 *
 * It throws a RangeError that names the canton when an entry has a canton that does not exist
 * or votes that are not whole numbers from zero: such an entry is never skipped.
 */
export function calculateResult(entries: readonly Entry[], majorities: Majorities): Result {
  const cantons = new Map<string, { cantonalVotes: number; yes: number; no: number }>();
  let yes = 0;
  let no = 0;
  for (const entry of entries) {
    const cantonalVotes = CANTONAL_VOTES.get(entry.canton);
    if (cantonalVotes === undefined) {
      throw new RangeError(`an entry names the canton "${entry.canton}", which does not exist`);
    }
    if (!isCount(entry.yes) || !isCount(entry.no)) {
      throw new RangeError(
        `an entry of ${entry.canton} has ${String(entry.yes)} yes and ${String(entry.no)} no votes; ` +
          'both must be whole numbers from zero',
      );
    }
    yes += entry.yes;
    no += entry.no;
    const canton = cantons.get(entry.canton);
    if (canton) {
      canton.yes += entry.yes;
      canton.no += entry.no;
    } else {
      cantons.set(entry.canton, { cantonalVotes, yes: entry.yes, no: entry.no });
    }
  }

  // Only a canton with an entry is in this map, so only such a canton has a cantonal vote.
  let cantonalVotesInFavour = 0;
  let cantonalVotesAgainst = 0;
  for (const canton of cantons.values()) {
    if (canton.yes > canton.no) {
      cantonalVotesInFavour += canton.cantonalVotes;
    } else {
      cantonalVotesAgainst += canton.cantonalVotes;
    }
  }

  const valid = yes + no;
  const majorityOfVoters = yes > no;
  const majorityOfCantons = cantonalVotesInFavour > cantonalVotesAgainst;
  return {
    yes,
    no,
    valid,
    yesShare: valid > 0 ? yes / valid : undefined,
    cantonalVotesInFavour,
    cantonalVotesAgainst,
    majorityOfVoters,
    majorityOfCantons,
    passed: majorityOfVoters && (majorityOfCantons || majorities === 'voters'),
  };
}
