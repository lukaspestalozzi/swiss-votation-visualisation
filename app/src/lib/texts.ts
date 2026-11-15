// Every text of the screen, in German until #9 adds French and Italian (specs vote-list and
// verdicts). A text with figures in it is a function of the figures, already written as the
// screen shows them (format.ts).
import type { Kind, Majorities } from 'calculation';

export const TITLE = 'Popular Vote Explorer';
export const ALL_VOTES = 'Alle Abstimmungen';

// The months of a date, from January; format.ts writes the date with them.
export const MONTHS: readonly string[] = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

export const KINDS: Readonly<Record<Kind, string>> = {
  'mandatory-referendum': 'Obligatorisches Referendum',
  'optional-referendum': 'Fakultatives Referendum',
  'popular-initiative': 'Volksinitiative',
  'initiative-with-counter-proposal': 'Volksinitiative mit Gegenentwurf',
  'counter-proposal': 'Gegenentwurf',
  'tie-break-question': 'Stichfrage',
};

export const MAJORITIES_NEEDED: Readonly<Record<Majorities, string>> = {
  'voters-and-cantons': 'Braucht das Volksmehr und das Ständemehr.',
  voters: 'Braucht nur das Volksmehr.',
};

// The list.
export const LIST_PASSED = 'angenommen';
export const LIST_FAILED = 'abgelehnt';
export const listResult = (verdict: string, yesShare: string): string =>
  `${verdict}, ${yesShare} Ja`;
export const listTieBreak = (initiativeShare: string): string =>
  `${initiativeShare} für die Initiative`;
export const MARK_NOTE = 'Hinweis';
export const MARK_PROVISIONAL = 'vorläufig';

// A vote's page: the figures.
export const YES_VOTES = 'Ja-Stimmen';
export const NO_VOTES = 'Nein-Stimmen';
export const YES_SHARE = 'Ja-Anteil';
export const TURNOUT = 'Stimmbeteiligung';

// A vote's page: the verdicts.
export const MAJORITY_OF_VOTERS = 'Volksmehr';
export const MAJORITY_OF_CANTONS = 'Ständemehr';
export const REACHED = 'Ja';
export const NOT_REACHED = 'Nein';
export const NOT_NEEDED = 'nicht nötig';
export const PASSED = 'Angenommen';
export const FAILED = 'Abgelehnt';
export const cantonalVotes = (inFavour: string, against: string): string =>
  `${inFavour} : ${against}`;

// A vote's page: the table of the cantons.
export const CANTON = 'Kanton';
export const CANTONAL_VOTES = 'Standesstimmen';
export const SIDE = 'Seite';

// A vote's page: the tie-break question.
export const forTheInitiative = (count: string, share: string): string =>
  `Für die Initiative: ${count} (${share})`;
export const forTheCounterProposal = (count: string, share: string): string =>
  `Für den Gegenentwurf: ${count} (${share})`;
export const tieBreakCantons = (initiative: string, counterProposal: string): string =>
  `Stände: ${initiative} für die Initiative, ${counterProposal} für den Gegenentwurf`;
export const TIE_BREAK_NOT_JUDGED =
  'Die Stichfrage zählt nur, wenn die Initiative und der Gegenentwurf beide angenommen sind; ' +
  'sie wird hier nicht beurteilt.';

// A vote's page: what the sources say.
export const SOURCE = 'Quelle: ';
export const PROVISIONAL = 'Vorläufiges Ergebnis: vom Bundesrat noch nicht erwahrt.';
export const NOTE_HEADING = 'Hinweis der Bundeskanzlei';
export const knownDifference = (
  official: string,
  count: 'yes' | 'no',
  reference: string,
  difference: string,
  more: boolean,
): string =>
  `Das erwahrte Ergebnis zählt ${official} ${count === 'yes' ? 'Ja' : 'Nein'}-Stimmen ` +
  `(${reference}); die Zahlen der Gemeinden, aus denen hier gerechnet wird, ergeben ` +
  `${difference} ${more ? 'mehr' : 'weniger'}.`;

// A vote's page: the map (spec result-map).
export const legendClass = (yes: boolean, from: number): string =>
  `${yes ? 'Ja' : 'Nein'}: ${from === 80 ? '80% und mehr' : `${String(from)}–${String(from + 10)}%`}`;
export const LEGEND_TIE = 'Gleich viele Ja wie Nein';
export const LEGEND_WITHOUT_RESULT = 'Kein eigenes Ergebnis';
export const WITHOUT_RESULT =
  'Kein eigenes Ergebnis: seine Stimmen sind mit denen einer anderen Gemeinde gezählt.';
export const MAP_HEADING = 'Karte der Gemeinden';
export const mapSource = (date: string, lakesSet: number): string =>
  `Kartengrundlage: © BFS, Gemeinden und Kantone am ${date}, Seen: ThemaKart ${String(lakesSet)}`;
export const swissAbroadNotOnTheMap = (cantons: number): string =>
  'Nicht auf der Karte: die Stimmen der Auslandschweizerinnen und Auslandschweizer, ' +
  `die ${String(cantons)} Kantone getrennt zählen.`;
