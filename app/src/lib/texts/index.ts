// Every text of the screen, one module per language behind one type (spec interface-languages;
// design of add-interface-languages, decisions 7 and 8). A text with figures in it is a function
// of the figures, already written as the screen shows them (format.ts). A text missing in one
// language is a type error.
import type { Kind, Majorities } from 'calculation';
import type { Language } from '../vote-data.ts';
import { de } from './de.ts';
import { fr } from './fr.ts';
import { it } from './it.ts';

/** The languages of the site: those of the data files. */
export type { Language };
export const LANGUAGES: readonly Language[] = ['de', 'fr', 'it'];

/** Whether a segment of an address names a language of the site. */
export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

/** A characteristic, by a key that is the same in every language (characteristics.ts). */
export type CharacteristicKey =
  | 'inhabitants'
  | 'foreigners'
  | 'age-0-17'
  | 'age-18-34'
  | 'age-35-49'
  | 'age-50-64'
  | 'age-65'
  | 'density'
  | 'fdp'
  | 'centre'
  | 'sp'
  | 'svp'
  | 'glp'
  | 'greens'
  | 'other-parties'
  | 'german'
  | 'french'
  | 'italian'
  | 'romansh'
  | 'area'
  | 'cattle';

/** A section of the reading guide. */
export interface GuideSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export interface Texts {
  // The language these texts are written in.
  readonly LANGUAGE: Language;
  readonly TITLE: string;
  readonly ALL_VOTES: string;
  // The months of a date, from January, and a date written from its day, month and year
  // (format.ts checks them and takes the month's name from MONTHS).
  readonly MONTHS: readonly string[];
  readonly date: (day: number, month: string, year: number) => string;
  readonly KINDS: Readonly<Record<Kind, string>>;
  readonly MAJORITIES_NEEDED: Readonly<Record<Majorities, string>>;

  // The list.
  readonly LIST_PASSED: string;
  readonly LIST_FAILED: string;
  readonly listResult: (verdict: string, yesShare: string) => string;
  readonly listTieBreak: (initiativeShare: string) => string;
  readonly MARK_NOTE: string;
  readonly MARK_PROVISIONAL: string;

  // A vote's page: the figures.
  readonly YES_VOTES: string;
  readonly NO_VOTES: string;
  readonly YES_SHARE: string;
  readonly TURNOUT: string;

  // A vote's page: the verdicts.
  readonly MAJORITY_OF_VOTERS: string;
  readonly MAJORITY_OF_CANTONS: string;
  readonly REACHED: string;
  readonly NOT_REACHED: string;
  readonly NOT_NEEDED: string;
  readonly NOTHING_LEFT: string;
  readonly PASSED: string;
  readonly FAILED: string;
  readonly cantonalVotes: (inFavour: string, against: string) => string;

  // A vote's page: the table of the cantons.
  readonly CANTON: string;
  readonly CANTONAL_VOTES: string;
  readonly SIDE: string;

  // A vote's page: the tie-break question.
  readonly forTheInitiative: (count: string, share: string) => string;
  readonly forTheCounterProposal: (count: string, share: string) => string;
  readonly tieBreakCantons: (initiative: string, counterProposal: string) => string;
  readonly TIE_BREAK_NOT_JUDGED: string;

  // A vote's page: what the sources say.
  readonly SOURCE: string;
  readonly PROVISIONAL: string;
  readonly NOTE_HEADING: string;
  readonly knownDifference: (
    official: string,
    count: 'yes' | 'no',
    reference: string,
    difference: string,
    more: boolean,
  ) => string;

  // A vote's page: the map (spec result-map).
  readonly legendClass: (yes: boolean, from: number) => string;
  readonly LEGEND_TIE: string;
  readonly LEGEND_WITHOUT_RESULT: string;
  readonly WITHOUT_RESULT: string;
  readonly MAP_HEADING: string;
  readonly mapSource: (date: string, lakesSet: number) => string;
  readonly swissAbroadNotOnTheMap: (cantons: number) => string;
  readonly ZOOM_IN: string;
  readonly ZOOM_OUT: string;
  readonly WHOLE_SWITZERLAND: string;
  readonly MAP_FAILED: string;
  readonly mapLabel: (title: string) => string;

  // A vote's page: the characteristics of a municipality (specs characteristics and result-map).
  readonly CHARACTERISTIC: Readonly<Record<CharacteristicKey, string>>;
  readonly PANEL_HEADING: string;
  readonly PANEL_PROMPT: string;
  readonly PANEL_LOADING: string;
  readonly PANEL_FAILED: string;
  readonly NO_FIGURE: string;
  readonly populationHeading: (year: number) => string;
  readonly electionHeading: (year: number) => string;
  readonly languagesHeading: (year: number) => string;
  readonly LAND_HEADING: string;
  readonly ofYear: (name: string, year: number) => string;
  readonly characteristic: (name: string, value: string) => string;
  readonly CHARACTERISTICS_SOURCES: string;

  // The limits (spec limits).
  readonly populationDate: (year: number) => string;
  readonly censusDate: (year: number) => string;
  readonly limitLabel: (name: string, date: string, lower: string, upper: string) => string;
  readonly LIMITS_HEADING: string;
  readonly THOUGHT_EXPERIMENT: string;
  readonly ADD_LIMIT: string;
  readonly CHOOSE: string;
  readonly REMOVE_LIMIT: string;
  readonly lowerBound: (name: string) => string;
  readonly upperBound: (name: string) => string;
  readonly ABROAD_SWITCH: string;
  readonly LIMITS_FAILED: string;
  readonly removeLimit: (name: string) => string;
  readonly WITH_SELECTION: string;
  readonly LEGEND_SET_ASIDE: string;
  readonly SET_ASIDE: string;
  readonly remainingCount: (remaining: string, all: string) => string;
  readonly NOTHING_REMAINS: string;
  readonly BACK_TO_REAL: string;
  readonly ADD: string;

  // The reading guide (spec reading-guide).
  readonly GUIDE_HEADING: string;
  readonly GUIDE_LINK: string;
  readonly GUIDE_SECTIONS: readonly GuideSection[];
  readonly SOURCES_HEADING: string;
  readonly SOURCE_VOTES: string;
  readonly sourceMap: (date: string, lakesSet: number) => string;
  readonly SOURCE_CHARACTERISTICS: string;
  readonly SOURCES_FILE: string;
}

const TEXTS: Readonly<Record<Language, Texts>> = { de, fr, it };

/** The texts of a language. */
export function textsOf(language: Language): Texts {
  return TEXTS[language];
}
