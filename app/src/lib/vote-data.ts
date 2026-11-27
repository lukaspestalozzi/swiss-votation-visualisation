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

// Where a vote day's explanations of the Federal Council are for one language of the page, and
// the language the document is in (spec vote-summaries, "The link to the explanations").
export interface Explanation {
  readonly address: string;
  readonly language: Language;
}

export interface Vote {
  // The BFS's id, the key of the vote's file.
  readonly id: number;
  // The Federal Chancellery's number; the three questions of 2026-03-08 share one.
  readonly number: number;
  readonly date: string;
  readonly kind: Kind;
  readonly title: Texts;
  // The result is the Federal Chancellery's once validated, the BFS's until then; a validated
  // vote is the one with a reference to the official publication.
  readonly result: Result;
  readonly reference: Texts | null;
  readonly note: Texts | null;
  // The site's summary of what the vote is about, and its vote day's explanations.
  readonly summary: Texts;
  readonly explanations: Readonly<Record<Language, Explanation>>;
  readonly sums: Sums;
}

// votes.json
export interface Votes {
  readonly referenceDate: string;
  readonly votes: readonly Vote[];
}

// The languages by their names in English, for an error.
const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
  de: 'German',
  fr: 'French',
  it: 'Italian',
};

/**
 * A vote's title, reference, note or summary in a language (spec interface-languages, "The vote's
 * texts in the page's language"). A text missing or empty in that language is an error that names the
 * vote and the language, so that the build fails; the caller asks for a reference or a note only
 * where the vote has one.
 */
export function voteText(
  vote: Vote,
  field: 'title' | 'reference' | 'note' | 'summary',
  language: Language,
): string {
  const text = vote[field]?.[language];
  if (text === undefined || text === '') {
    throw new Error(`vote ${String(vote.id)} has no ${field} in ${LANGUAGE_NAMES[language]}`);
  }
  return text;
}

/**
 * The explanations of a vote's day for a language of the page (spec vote-summaries): an error
 * that names the vote and the language when they are missing, so that the build fails.
 */
export function explanationOf(vote: Vote, language: Language): Explanation {
  const explanation = vote.explanations[language] as Explanation | undefined;
  if (explanation === undefined || explanation.address === '') {
    throw new Error(`vote ${String(vote.id)} has no explanations in ${LANGUAGE_NAMES[language]}`);
  }
  return explanation;
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

// map.json: the map's shapes as SVG path data, in whole metres from the top left corner of the
// rectangle around Switzerland (spec municipalities; design of add-result-map, decision 14).
export interface MapFile {
  // The date of the list of municipalities the boundaries belong to.
  readonly referenceDate: string;
  // The year of the BFS ThemaKart set the lakes come from.
  readonly lakesSet: number;
  readonly width: number;
  readonly height: number;
  // Per municipality: [number, path], by number.
  readonly municipalities: readonly (readonly [number, string])[];
  // Per canton: [abbreviation, path], in the order of the constitution.
  readonly cantons: readonly (readonly [string, string])[];
  // The outer rings of Switzerland, drawn in the lakes' colour under the municipalities.
  readonly outline: string;
  readonly lakes: readonly string[];
}

// characteristics.json: the counts the characteristics are computed from, per municipality of
// the list (spec characteristics; design of add-characteristics, decisions 11 and 12). Every
// array of counts follows `municipalities`.
export interface CharacteristicsFile {
  // The date of the list of municipalities the counts are added up on.
  readonly referenceDate: string;
  readonly municipalities: readonly number[];
  // Per year, the permanent resident population at its end, per municipality: inhabitants,
  // foreigners, and those aged 0–17, 18–34, 35–49, 50–64, and 65 and over.
  readonly population: Yearly<readonly number[]>;
  // Per National Council election, per municipality the votes of FDP, Die Mitte (CVP and BDP
  // until 2020), SP, SVP, GLP, Grüne and the other parties, or null for a municipality without
  // an election result of its own.
  readonly elections: readonly Election[];
  // Per year, the permanent residents born abroad of each municipality, at its end.
  readonly bornAbroad: Yearly<number>;
  // Per year, the jobs at the workplaces of each municipality at its end: all of them, and those
  // of the primary, the secondary and the tertiary sector, each null where the source withholds
  // the count.
  readonly jobs: Yearly<readonly (number | null)[]>;
  // Per year, the cattle of each municipality.
  readonly cattle: Yearly<number>;
  // Per year, of each municipality: its farms, their farmland and the farmland of the organic
  // ones, in ha. The years are the cattle's.
  readonly farms: Yearly<readonly number[]>;
  // The census of 2000, per municipality: all inhabitants, and those with German, French,
  // Italian and Romansh as their main language.
  readonly languages2000: readonly (readonly number[])[];
  // All inhabitants, the Evangelical Reformed, the Roman Catholic, and those without a
  // religious affiliation.
  readonly religion2000: readonly (readonly number[])[];
  // The inhabitants by their highest completed education: none or compulsory school, upper
  // secondary, tertiary. Those of school age or below it and those without an answer are in none.
  readonly education2000: readonly (readonly number[])[];
  // The occupied dwellings, and those lived in by their owner.
  readonly dwellings2000: readonly (readonly number[])[];
  // The buildings with dwellings, and the single-family houses among them.
  readonly buildings2000: readonly (readonly number[])[];
  // swisstopo's area of each municipality in ha, its part in a lake included.
  readonly area: readonly number[];
}

export interface Yearly<Counts> {
  readonly years: readonly number[];
  // Per year, in the order of `years`: the counts of each municipality.
  readonly counts: readonly (readonly Counts[])[];
}

export interface Election {
  readonly year: number;
  readonly day: string;
  readonly votes: readonly (readonly number[] | null)[];
}
