// The German texts of the screen (texts/index.ts).
import type { Texts } from './index.ts';

const REMOVE_LIMIT = 'Entfernen';
const WITH_SELECTION = 'Mit Ihrer Auswahl';
const MAJORITY_OF_VOTERS = 'Volksmehr';
const MAJORITY_OF_CANTONS = 'Ständemehr';

export const de: Texts = {
  LANGUAGE: 'de',
  TITLE: 'Popular Vote Explorer',
  ALL_VOTES: 'Alle Abstimmungen',
  MONTHS: [
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
  ],
  // The day and the month joined by a non-breaking space, so that a line never parts them.
  date: (day, month, year) => `${String(day)}.\u00a0${month} ${String(year)}`,
  day: (day, month) => `${String(day)}.\u00a0${month}`,
  KINDS: {
    'mandatory-referendum': 'Obligatorisches Referendum',
    'optional-referendum': 'Fakultatives Referendum',
    'popular-initiative': 'Volksinitiative',
    'initiative-with-counter-proposal': 'Volksinitiative mit Gegenentwurf',
    'counter-proposal': 'Gegenentwurf',
    'tie-break-question': 'Stichfrage',
  },
  MAJORITIES_NEEDED: {
    'voters-and-cantons': 'Braucht das Volksmehr und das Ständemehr.',
    voters: 'Braucht nur das Volksmehr.',
  },

  // The list.
  START_HEADING:
    'Wie hätte die Schweiz abgestimmt, wenn nur ein Teil der Gemeinden an die Urne gegangen wäre?',
  startLead: (furtherCharacteristics) =>
    'Wählen Sie eine Abstimmung und grenzen Sie die Gemeinden ein: nach Einwohnerzahl, Alter, ' +
    `Parteistärke und ${String(furtherCharacteristics)} weiteren Merkmalen. Karte und Ergebnis ` +
    'rechnen sofort neu. Ein Gedankenexperiment, keine Prognose.',
  SEARCH_TITLES: 'Titel suchen',
  NO_MATCH: 'Keine Abstimmung passt zu dieser Suche.',
  KEPT: 'Ergebnis',
  KEEP_ALL: 'Alle',
  KEEP_ACCEPTED: 'Angenommen',
  KEEP_REJECTED: 'Abgelehnt',
  YEARS: 'Jahre',
  LIST_PASSED: 'angenommen',
  LIST_FAILED: 'abgelehnt',
  listShare: (yesShare) => `${yesShare} Ja`,
  listTieBreak: (initiativeShare) => `${initiativeShare} für die Initiative`,
  MARK_NOTE: 'Hinweis',
  MARK_PROVISIONAL: 'vorläufig',

  // A vote's page: the figures.
  YES: 'Ja',
  NO: 'Nein',
  YES_VOTES: 'Ja-Stimmen',
  NO_VOTES: 'Nein-Stimmen',
  YES_SHARE: 'Ja-Anteil',
  TURNOUT: 'Stimmbeteiligung',

  // A vote's page: the verdicts.
  MAJORITY_OF_VOTERS,
  MAJORITY_OF_CANTONS,
  REACHED: 'Ja',
  NOT_REACHED: 'Nein',
  NOT_NEEDED: 'nicht nötig',
  NOTHING_LEFT: 'keine Gemeinde übrig',
  PASSED: 'Angenommen',
  FAILED: 'Abgelehnt',
  cantonalVotes: (inFavour, against) => `${inFavour} : ${against}`,

  // A vote's page: the table of the cantons.
  CANTONS_HEADING: 'Kantone',
  CANTON_BARS: 'Jeder Balken reicht von 50% bis zum Ja-Anteil des Kantons.',
  CANTON_BARS_SELECTION:
    'Jeder Balken reicht von 50% bis zum Ja-Anteil des Kantons; der Strich zeigt sein echtes ' +
    'Ergebnis.',
  CANTON: 'Kanton',
  CANTONAL_VOTES: 'Standesstimmen',
  SIDE: 'Seite',

  // A vote's page: the tie-break question.
  forTheInitiative: (count, share) => `Für die Initiative: ${count} (${share})`,
  forTheCounterProposal: (count, share) => `Für den Gegenentwurf: ${count} (${share})`,
  tieBreakCantons: (initiative, counterProposal) =>
    `Stände: ${initiative} für die Initiative, ${counterProposal} für den Gegenentwurf`,
  TIE_BREAK_NOT_JUDGED:
    'Die Stichfrage zählt nur, wenn die Initiative und der Gegenentwurf beide angenommen sind; ' +
    'sie wird hier nicht beurteilt.',

  // A vote's page: what the sources say.
  SOURCE: 'Quelle: ',
  PROVISIONAL: 'Vorläufiges Ergebnis: vom Bundesrat noch nicht erwahrt.',
  NOTE_HEADING: 'Hinweis der Bundeskanzlei',
  knownDifference: (official, count, reference, difference, more) =>
    `Das erwahrte Ergebnis zählt ${official} ${count === 'yes' ? 'Ja' : 'Nein'}-Stimmen ` +
    `(${reference}); die Zahlen der Gemeinden, aus denen hier gerechnet wird, ergeben ` +
    `${difference} ${more ? 'mehr' : 'weniger'}.`,

  // A vote's page: the map (spec result-map).
  legendClass: (yes, from) =>
    `${yes ? 'Ja' : 'Nein'}: ${from === 80 ? '80% und mehr' : `${String(from)}–${String(from + 10)}%`}`,
  LEGEND_SCALE: 'Ja-Anteil in %',
  LEGEND_TIE: 'Gleich viele Ja wie Nein',
  LEGEND_WITHOUT_RESULT: 'Kein eigenes Ergebnis',
  WITHOUT_RESULT:
    'Kein eigenes Ergebnis: seine Stimmen sind mit denen einer anderen Gemeinde gezählt.',
  MAP_HEADING: 'Karte der Gemeinden',
  mapSource: (date, lakesSet) =>
    `Kartengrundlage: © BFS, Gemeinden und Kantone am ${date}, Seen: ThemaKart ${String(lakesSet)}`,
  swissAbroadNotOnTheMap: (cantons) =>
    'Nicht auf der Karte: die Stimmen der Auslandschweizerinnen und Auslandschweizer, ' +
    `die ${String(cantons)} Kantone getrennt zählen.`,
  ZOOM_IN: 'Vergrössern',
  ZOOM_OUT: 'Verkleinern',
  WHOLE_SWITZERLAND: 'Ganze Schweiz',
  MAP_FAILED: 'Die Karte kann nicht geladen werden.',
  mapLabel: (title) =>
    `Karte der Gemeinden: ${title}. Die Zahlen der Kantone stehen in der Tabelle unter der Karte.`,

  // A vote's page: the characteristics of a municipality (specs characteristics and result-map).
  CHARACTERISTIC: {
    inhabitants: 'Einwohner',
    foreigners: 'Ausländeranteil',
    'born-abroad': 'Im Ausland geboren',
    'age-0-17': '0–17 Jahre',
    'age-18-34': '18–34 Jahre',
    'age-35-49': '35–49 Jahre',
    'age-50-64': '50–64 Jahre',
    'age-65': '65 Jahre und älter',
    density: 'Einwohner je km²',
    fdp: 'FDP',
    centre: 'Die Mitte (bis 2020 CVP und BDP)',
    sp: 'SP',
    svp: 'SVP',
    glp: 'GLP',
    greens: 'Grüne',
    'other-parties': 'Übrige Parteien',
    german: 'Deutsch',
    french: 'Französisch',
    italian: 'Italienisch',
    romansh: 'Rätoromanisch',
    reformed: 'Evangelisch-reformiert',
    catholic: 'Römisch-katholisch',
    'no-religion': 'Keine Religionszugehörigkeit',
    'higher-education': 'Hochschule oder höhere Berufsbildung',
    'compulsory-education': 'Obligatorische Schule oder keine Ausbildung',
    'owner-occupied': 'Vom Eigentümer bewohnte Wohnungen',
    'single-family-houses': 'Einfamilienhäuser',
    jobs: 'Arbeitsplätze je 100 Einwohner',
    'primary-sector': 'Arbeitsplätze im Primärsektor',
    'secondary-sector': 'Arbeitsplätze im Sekundärsektor',
    'tertiary-sector': 'Arbeitsplätze im Tertiärsektor',
    area: 'Fläche',
    cattle: 'Rinder je Einwohner',
    farms: "Landwirtschaftsbetriebe je 1'000 Einwohner",
    'organic-farmland': 'Bio-Anteil der landwirtschaftlichen Nutzfläche',
  },
  PANEL_HEADING: 'Merkmale der Gemeinde',
  PANEL_PROMPT: 'Klicken Sie auf eine Gemeinde, um ihre Merkmale zu sehen.',
  PANEL_LOADING: 'Die Merkmale werden geladen …',
  PANEL_FAILED: 'Die Merkmale können nicht geladen werden.',
  NO_FIGURE: 'keine Angabe',
  populationHeading: (year) => `Bevölkerung Ende ${String(year)}`,
  electionHeading: (year) => `Nationalratswahl ${String(year)}`,
  languagesHeading: (year) => `Hauptsprache, Volkszählung ${String(year)}`,
  religionHeading: (year) => `Religion, Volkszählung ${String(year)}`,
  educationHeading: (year) => `Ausbildung, Volkszählung ${String(year)}`,
  housingHeading: (year) => `Wohnen, Volkszählung ${String(year)}`,
  jobsHeading: (year) => `Arbeit Ende ${String(year)}`,
  GROUP: {
    population: 'Bevölkerung',
    election: 'Nationalratswahl',
    languages: 'Hauptsprache',
    religion: 'Religion',
    education: 'Ausbildung',
    housing: 'Wohnen',
    jobs: 'Arbeit',
    land: 'Fläche und Landwirtschaft',
  },
  ofDate: (name, date) => `${name} (${date})`,
  characteristic: (name, value) => `${name}: ${value}`,
  CHARACTERISTICS_SOURCES:
    'Quellen: BFS (STATPOP, STATENT, Nationalratswahlen, Volkszählung 2000, ' +
    'Landwirtschaftliche Strukturerhebung); swisstopo (swissBOUNDARIES3D 2026).',

  // The comparison of two votes (spec vote-comparison).
  COMPARE_HEADING: 'Zwei Abstimmungen vergleichen',
  COMPARE_ENTRY: 'Vergleichen',
  FIRST_VOTE: 'Erste Abstimmung',
  SECOND_VOTE: 'Zweite Abstimmung',
  REAL_RESULT: 'Echtes Ergebnis',
  VOTE_LOADING: 'Die Ergebnisse werden geladen.',
  VOTE_FAILED: 'Die Ergebnisse dieser Abstimmung lassen sich nicht laden.',
  SAME_MUNICIPALITIES:
    'Die Gemeinden werden nach den Zahlen der ersten Abstimmung ausgewählt; in beiden ' +
    'Abstimmungen zählen dieselben Gemeinden.',
  COMPARE_LINK: 'Mit einer anderen Abstimmung vergleichen',

  // The limits (spec limits).
  populationDate: (year) => `Ende ${String(year)}`,
  censusDate: (year) => `Volkszählung ${String(year)}`,
  limitLabel: (name, date, lower, upper) => `${name} (${date}): von ${lower} bis ${upper}`,
  LIMITS_HEADING: 'Gemeinden auswählen',
  THOUGHT_EXPERIMENT:
    'Ein Gedankenexperiment: So wäre die Abstimmung ausgegangen, wenn nur die ausgewählten ' +
    'Gemeinden abgestimmt hätten. Es zeigt nicht, wie einzelne Menschen gestimmt haben, und ist ' +
    'keine Prognose.',
  ADD_LIMIT: 'Merkmal hinzufügen',
  CHOOSE: '–',
  REMOVE_LIMIT,
  lowerBound: (name) => `Untere Grenze: ${name}`,
  upperBound: (name) => `Obere Grenze: ${name}`,
  ABROAD_SWITCH:
    'Auslandschweizerinnen und Auslandschweizer mitzählen (in jedem Kanton, in dem eine Gemeinde ' +
    'übrig ist)',
  LIMITS_FAILED: 'Ohne die Merkmale lassen sich keine Gemeinden auswählen.',
  unusableParts: (parts) =>
    `Diese Angaben der Adresse liessen sich nicht anwenden: ${parts.map((part) => `«${part}»`).join(', ')}.`,
  removeLimit: (name) => `${REMOVE_LIMIT}: ${name}`,
  WITH_SELECTION,
  SELECTION_PLACE:
    'Setzen Sie eine Grenze auf ein Merkmal: Hier steht dann das Ergebnis der Gemeinden, die ' +
    'übrig bleiben.',
  LEGEND_SET_ASIDE: 'Nicht in der Auswahl',
  SET_ASIDE: 'Nicht in der Auswahl.',
  remainingCount: (remaining, all) =>
    `In der Auswahl: ${remaining} von ${all} Gemeinden mit eigenem Ergebnis.`,
  NOTHING_REMAINS: 'Keine Gemeinde mit eigenem Ergebnis ist übrig.',
  BACK_TO_REAL: 'Zurück zum echten Ergebnis',
  CLOSE_LIST: 'Schliessen',

  // The reading guide (spec reading-guide).
  GUIDE_HEADING: 'Lesehilfe',
  GUIDE_LINK: 'Lesehilfe und Quellen',
  GUIDE_SECTIONS: [
    {
      heading: 'Das echte Ergebnis',
      paragraphs: [
        'Oben auf der Seite einer Abstimmung steht ihr amtliches Ergebnis. Es ist aus den ' +
          'Zahlen der Gemeinden nach den Regeln der Bundesverfassung berechnet: dem Volksmehr ' +
          'und, wo die Vorlage es braucht, dem Ständemehr.',
        'Erst wenn Sie Gemeinden auswählen, steht darunter ein zweites, neu berechnetes ' +
          'Ergebnis: «Mit Ihrer Auswahl». Das echte bleibt stehen.',
      ],
    },
    {
      heading: 'Gemeinden auswählen',
      paragraphs: [
        'Eine Grenze legt für ein Merkmal einen unteren und einen oberen Wert fest. Eine ' +
          'Gemeinde bleibt nur, wenn sie innerhalb aller Grenzen liegt. Die anderen sind auf ' +
          'der Karte dunkelgrau und zählen nicht.',
        'Das Ergebnis wird berechnet, als hätten nur die übrigen Gemeinden abgestimmt, nach ' +
          'denselben Regeln wie das echte. Ein Kanton, in dem keine Gemeinde übrig ist, hat ' +
          'keine Standesstimme. Für das Ständemehr braucht es dann weniger Standesstimmen. ' +
          'Bleibt keine Gemeinde übrig, ist die Vorlage abgelehnt.',
        'Die Adresse der Seite hält Ihre Auswahl fest: Wer sie öffnet, sieht dieselbe Auswahl.',
      ],
    },
    {
      heading: 'Was die Auswahl nicht zeigt',
      paragraphs: [
        'Die Auswahl behält oder streicht ganze Gemeinden mit allen ihren Stimmen. Eine ' +
          'Gemeinde mit vielen über 65-Jährigen zählt mit allen ihren Stimmen, auch mit denen ' +
          'der Jüngeren.',
        'Sie zeigt deshalb nicht, wie die Menschen mit einem Merkmal gestimmt haben, und ' +
          'nicht, wie eine andere Abstimmung ausgehen würde. Die Auswahl ist keine Prognose.',
      ],
    },
    {
      heading: 'Auslandschweizerinnen und Auslandschweizer',
      paragraphs: [
        '11 oder 12 Kantone zählen die Stimmen ihrer Auslandschweizerinnen und ' +
          'Auslandschweizer getrennt, 1.0% bis 1.6% der gültigen Stimmen. Sie wohnen in keiner ' +
          'Gemeinde, stehen nicht auf der Karte und haben keine Merkmale.',
        'Der Schalter «Auslandschweizerinnen und Auslandschweizer mitzählen» bestimmt, ob ihre ' +
          'Stimmen in die Auswahl eingehen. Sie zählen nur in einem Kanton, in dem noch eine ' +
          'Gemeinde übrig ist.',
      ],
    },
    {
      heading: 'Gemeinden ohne eigenes Ergebnis oder ohne Angabe',
      paragraphs: [
        'Einige wenige Gemeinden haben kein eigenes Ergebnis: Ihre Stimmen sind mit denen ' +
          'einer anderen Gemeinde gezählt. Sie sind auf der Karte schraffiert, und eine Grenze ' +
          'ändert durch sie keine Zahl.',
        'Bei einigen kleinen Gemeinden des Kantons Bern fehlen die Parteistärken. Bei den ' +
          'Arbeitsplätzen eines Sektors fehlt die Angabe, wo das BFS die Zahl nicht ' +
          'veröffentlicht, und beim Bio-Anteil, wo es keine landwirtschaftliche Nutzfläche ' +
          'gibt. Eine Gemeinde ohne Angabe fällt weg, sobald die Grenze dieses Merkmals enger ' +
          'gestellt ist.',
      ],
    },
    {
      heading: 'Die Merkmale',
      paragraphs: [
        'Eine Abstimmung nimmt die Bevölkerung, die Arbeitsplätze, die Rinder und die ' +
          'Landwirtschaftsbetriebe des letzten Jahres vor ihrem Tag, die Parteistärken der ' +
          'letzten Nationalratswahl vor ihrem Tag, Hauptsprache, Religion, Ausbildung und ' +
          'Wohnen der Volkszählung 2000 und die Fläche von 2026. Wo die Zahlen des letzten ' +
          'Jahres noch nicht veröffentlicht sind, nimmt sie die neuesten davor.',
        'Arbeitsplätze sind die Beschäftigten der Betriebe in der Gemeinde, wo immer diese ' +
          'wohnen. Zu Hauptsprache, Religion, Ausbildung und Wohnen gibt es keine neueren ' +
          'Zahlen für jede Gemeinde.',
        'Eine Grenze vergleicht die Werte so, wie sie bei der Gemeinde stehen. Die Grenzen von ' +
          '«Einwohner», «Einwohner je km²», «Arbeitsplätze je 100 Einwohner», «Fläche», ' +
          "«Rinder je Einwohner» und «Landwirtschaftsbetriebe je 1'000 Einwohner» wachsen von " +
          'Schritt zu Schritt um den gleichen Faktor, weil ihre Werte über mehrere ' +
          'Grössenordnungen reichen.',
      ],
    },
  ],
  SOURCES_HEADING: 'Quellen',
  SOURCE_VOTES:
    'Abstimmungsergebnisse: Bundesamt für Statistik (BFS), eidgenössische Volksabstimmungen, ' +
    'Ergebnisse nach Gemeinden; Bundeskanzlei, erwahrte Ergebnisse im Bundesblatt.',
  sourceMap: (date, lakesSet) =>
    'Gemeinden und Karte: BFS, Amtliches Gemeindeverzeichnis der Schweiz und generalisierte ' +
    `Gemeindegrenzen, Stand ${date}; BFS, ThemaKart ${String(lakesSet)} (Seen).`,
  SOURCE_CHARACTERISTICS:
    'Merkmale: BFS, STATPOP; BFS, STATENT; BFS, Nationalratswahlen; BFS, Volkszählung 2000; ' +
    'BFS, Landwirtschaftliche Strukturerhebung; swisstopo, swissBOUNDARIES3D 2026.',
  SOURCES_FILE: 'Alle gelesenen Dateien und ihre Abfragen:',
};
