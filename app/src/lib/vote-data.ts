// The types of the data files the pipeline writes to app/static/data/ (the specs vote-data and
// municipalities; their shape is decision 12 of the design of the change add-vote-data).
// A figure that a source does not give is null; no key is ever left out.
import type { Kind } from 'calculation';

export type Language = 'de' | 'fr' | 'it';
export type Texts = Readonly<Record<Language, string>>;

export interface Result {
  readonly yes: number;
  readonly no: number;
  readonly cantonalVotesInFavour: number | null;
  readonly cantonalVotesAgainst: number | null;
  // Null for a tie-break question, which has no verdict.
  readonly passed: boolean | null;
}

// The sums of the entries of a vote.
export interface Sums {
  readonly registered: number;
  readonly cast: number;
  readonly validBallots: number;
  readonly yes: number;
  readonly no: number;
}

export interface Vote {
  // The BFS's id, the key of the vote's file.
  readonly id: number;
  // The Federal Chancellery's number; the three questions of 2026-03-08 share one.
  readonly number: number;
  readonly date: string;
  readonly kind: Kind;
  readonly title: Texts;
  // The result is the Federal Chancellery's once validated, the BFS's until then.
  readonly validated: boolean;
  readonly result: Result;
  readonly reference: Texts | null;
  readonly note: Texts | null;
  readonly sums: Sums;
}

// votes.json
export interface Votes {
  readonly referenceDate: string;
  readonly votes: readonly Vote[];
}

// One entry: [number, registered voters, ballots cast, valid ballots, yes votes, no votes].
export type Row = readonly [number, number, number, number, number, number];

// votes/<id>.json: the entries under the canton they voted in, all 26 cantons.
export interface VoteFile {
  readonly id: number;
  readonly entries: Readonly<Record<string, readonly Row[]>>;
  // The municipalities of the list that have no entry of their own in this vote.
  readonly withoutResult: readonly number[];
}

// municipalities.json
export interface Municipalities {
  readonly referenceDate: string;
  // Per canton: [number, name].
  readonly municipalities: Readonly<Record<string, readonly (readonly [number, string])[]>>;
  // The number of the entry of each canton's Swiss abroad, for the cantons that count them apart.
  readonly swissAbroad: Readonly<Record<string, number>>;
}
