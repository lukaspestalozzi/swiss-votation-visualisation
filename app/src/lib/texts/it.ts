// The Italian texts of the screen (texts/index.ts), with the Confederation's terms
// (investigations/languages.md; design of add-interface-languages, decision 11): the formal "Lei";
// "Comune" and "Cantone" capitalised, as the Confederation's Italian writes them.
import type { Texts } from './index.ts';

const REMOVE_LIMIT = 'Rimuovere';
const WITH_SELECTION = 'Con la Sua selezione';
const MAJORITY_OF_VOTERS = 'Maggioranza del popolo';
const MAJORITY_OF_CANTONS = 'Maggioranza dei Cantoni';

export const it: Texts = {
  LANGUAGE: 'it',
  TITLE: 'Popular Vote Explorer',
  ALL_VOTES: 'Tutte le votazioni',
  MONTHS: [
    'gennaio',
    'febbraio',
    'marzo',
    'aprile',
    'maggio',
    'giugno',
    'luglio',
    'agosto',
    'settembre',
    'ottobre',
    'novembre',
    'dicembre',
  ],
  // The first day of a month as the Constitution's footnotes write it: "1°".
  // The day and the month joined by a non-breaking space, so that a line never parts them.
  date: (day, month, year) => `${day === 1 ? '1°' : String(day)}\u00a0${month} ${String(year)}`,
  KINDS: {
    'mandatory-referendum': 'Referendum obbligatorio',
    'optional-referendum': 'Referendum facoltativo',
    'popular-initiative': 'Iniziativa popolare',
    'initiative-with-counter-proposal': 'Iniziativa popolare con controprogetto',
    'counter-proposal': 'Controprogetto',
    'tie-break-question': 'Domanda risolutiva',
  },
  MAJORITIES_NEEDED: {
    'voters-and-cantons': 'Richiede la maggioranza del popolo e la maggioranza dei Cantoni.',
    voters: 'Richiede solo la maggioranza del popolo.',
  },

  // The list.
  LIST_PASSED: 'accettato',
  LIST_FAILED: 'respinto',
  listResult: (verdict, yesShare) => `${verdict}, ${yesShare} di sì`,
  listTieBreak: (initiativeShare) => `${initiativeShare} per l'iniziativa`,
  MARK_NOTE: 'Nota',
  MARK_PROVISIONAL: 'provvisorio',

  // A vote's page: the figures.
  YES_VOTES: 'Sì',
  NO_VOTES: 'No',
  YES_SHARE: 'Percentuale di sì',
  TURNOUT: 'Partecipazione',

  // A vote's page: the verdicts.
  MAJORITY_OF_VOTERS,
  MAJORITY_OF_CANTONS,
  REACHED: 'Sì',
  NOT_REACHED: 'No',
  NOT_NEEDED: 'non necessaria',
  NOTHING_LEFT: 'nessun Comune rimasto',
  PASSED: 'Accettato',
  FAILED: 'Respinto',
  cantonalVotes: (inFavour, against) => `${inFavour} : ${against}`,

  // A vote's page: the table of the cantons.
  CANTON: 'Cantone',
  CANTONAL_VOTES: 'Voti dei Cantoni',
  SIDE: 'Esito',

  // A vote's page: the tie-break question.
  forTheInitiative: (count, share) => `Per l'iniziativa: ${count} (${share})`,
  forTheCounterProposal: (count, share) => `Per il controprogetto: ${count} (${share})`,
  tieBreakCantons: (initiative, counterProposal) =>
    `Cantoni: ${initiative} per l'iniziativa, ${counterProposal} per il controprogetto`,
  TIE_BREAK_NOT_JUDGED:
    "La domanda risolutiva conta solo se l'iniziativa e il controprogetto sono entrambi " +
    'accettati; qui non viene valutata.',

  // A vote's page: what the sources say.
  SOURCE: 'Fonte: ',
  PROVISIONAL: 'Risultato provvisorio: non ancora accertato dal Consiglio federale.',
  NOTE_HEADING: 'Nota della Cancelleria federale',
  knownDifference: (official, count, reference, difference, more) =>
    `Il risultato accertato conta ${official} ${count === 'yes' ? 'sì' : 'no'} (${reference}); ` +
    'le cifre dei Comuni su cui si basa il calcolo danno ' +
    `${difference} ${more ? 'in più' : 'in meno'}.`,

  // A vote's page: the map (spec result-map).
  legendClass: (yes, from) =>
    `${yes ? 'Sì' : 'No'}: ${from === 80 ? '80% e più' : `${String(from)}–${String(from + 10)}%`}`,
  LEGEND_TIE: 'Tanti sì quanti no',
  LEGEND_WITHOUT_RESULT: 'Nessun risultato proprio',
  WITHOUT_RESULT:
    'Nessun risultato proprio: i suoi voti sono contati con quelli di un altro Comune.',
  MAP_HEADING: 'Carta dei Comuni',
  mapSource: (date, lakesSet) =>
    `Base cartografica: © UST, Comuni e Cantoni al ${date}, laghi: ThemaKart ${String(lakesSet)}`,
  swissAbroadNotOnTheMap: (cantons) =>
    "Non sulla carta: i voti delle Svizzere e degli Svizzeri all'estero, " +
    `che ${String(cantons)} Cantoni contano separatamente.`,
  ZOOM_IN: 'Ingrandire',
  ZOOM_OUT: 'Ridurre',
  WHOLE_SWITZERLAND: 'Tutta la Svizzera',
  MAP_FAILED: 'Non è possibile caricare la carta.',
  mapLabel: (title) =>
    `Carta dei Comuni: ${title}. Le cifre dei Cantoni figurano nella tabella sotto la carta.`,

  // A vote's page: the characteristics of a municipality (specs characteristics and result-map).
  CHARACTERISTIC: {
    inhabitants: 'Abitanti',
    foreigners: 'Quota di stranieri',
    'age-0-17': '0–17 anni',
    'age-18-34': '18–34 anni',
    'age-35-49': '35–49 anni',
    'age-50-64': '50–64 anni',
    'age-65': '65 anni e più',
    density: 'Abitanti per km²',
    fdp: 'PLR',
    centre: 'Il Centro (fino al 2020 PPD e PBD)',
    sp: 'PS',
    svp: 'UDC',
    glp: 'PVL',
    greens: 'I Verdi',
    'other-parties': 'Altri partiti',
    german: 'Tedesco',
    french: 'Francese',
    italian: 'Italiano',
    romansh: 'Romancio',
    area: 'Superficie',
    cattle: 'Bovini per abitante',
  },
  PANEL_HEADING: 'Caratteristiche del Comune',
  PANEL_PROMPT: 'Clicchi su un Comune per vederne le caratteristiche.',
  PANEL_LOADING: 'Caricamento delle caratteristiche …',
  PANEL_FAILED: 'Non è possibile caricare le caratteristiche.',
  NO_FIGURE: 'nessun dato',
  populationHeading: (year) => `Popolazione fine ${String(year)}`,
  electionHeading: (year) => `Elezione del Consiglio nazionale ${String(year)}`,
  languagesHeading: (year) => `Lingua principale, censimento ${String(year)}`,
  LAND_HEADING: 'Superficie e agricoltura',
  ofYear: (name, year) => `${name} (${String(year)})`,
  characteristic: (name, value) => `${name}: ${value}`,
  CHARACTERISTICS_SOURCES:
    'Fonti: UST (STATPOP, elezioni del Consiglio nazionale, censimento federale della ' +
    'popolazione 2000, rilevazione delle strutture agricole); swisstopo (swissBOUNDARIES3D 2026).',

  // The limits (spec limits).
  populationDate: (year) => `fine ${String(year)}`,
  censusDate: (year) => `censimento ${String(year)}`,
  limitLabel: (name, date, lower, upper) => `${name} (${date}): da ${lower} a ${upper}`,
  LIMITS_HEADING: 'Scegliere i Comuni',
  THOUGHT_EXPERIMENT:
    'Un esperimento mentale: ecco come sarebbe andata la votazione se avessero votato soltanto ' +
    'i Comuni scelti. Non mostra come hanno votato le singole persone e non è una previsione.',
  ADD_LIMIT: 'Aggiungere una caratteristica',
  CHOOSE: '–',
  REMOVE_LIMIT,
  lowerBound: (name) => `Limite inferiore: ${name}`,
  upperBound: (name) => `Limite superiore: ${name}`,
  ABROAD_SWITCH:
    "Contare le Svizzere e gli Svizzeri all'estero (in ogni Cantone in cui rimane un Comune)",
  LIMITS_FAILED: 'Senza le caratteristiche non è possibile scegliere Comuni.',
  removeLimit: (name) => `${REMOVE_LIMIT}: ${name}`,
  WITH_SELECTION,
  LEGEND_SET_ASIDE: 'Non nella selezione',
  SET_ASIDE: 'Non nella selezione.',
  remainingCount: (remaining, all) =>
    `Nella selezione: ${remaining} dei ${all} Comuni con un risultato proprio.`,
  NOTHING_REMAINS: 'Non rimane nessun Comune con un risultato proprio.',
  BACK_TO_REAL: 'Tornare al risultato reale',
  ADD: 'Aggiungere',

  // The reading guide (spec reading-guide).
  GUIDE_HEADING: 'Guida alla lettura',
  GUIDE_LINK: 'Guida alla lettura e fonti',
  GUIDE_SECTIONS: [
    {
      heading: 'Il risultato reale',
      paragraphs: [
        'In cima alla pagina di una votazione figura il suo risultato ufficiale. È calcolato a ' +
          'partire dalle cifre dei Comuni secondo le regole della Costituzione federale: la ' +
          "maggioranza del popolo e, dove l'oggetto lo richiede, la maggioranza dei Cantoni.",
        'Solo quando sceglie dei Comuni compare accanto, sotto «Con la Sua selezione», un ' +
          'secondo risultato, ricalcolato. Il risultato reale rimane.',
      ],
    },
    {
      heading: 'Scegliere i Comuni',
      paragraphs: [
        'Un limite fissa per una caratteristica un valore inferiore e uno superiore. Un Comune ' +
          'rimane solo se si trova entro tutti i limiti. Gli altri sono grigio scuro sulla ' +
          'carta e non contano.',
        'Il risultato è calcolato come se avessero votato soltanto i Comuni rimasti, secondo ' +
          'le stesse regole di quello reale. Un Cantone in cui non rimane nessun Comune non ha ' +
          'alcun voto. Per la maggioranza dei Cantoni servono allora meno voti dei Cantoni. Se ' +
          "non rimane nessun Comune, l'oggetto è respinto.",
      ],
    },
    {
      heading: 'Che cosa la selezione non mostra',
      paragraphs: [
        'La selezione mantiene o esclude interi Comuni con tutti i loro voti. Un Comune con ' +
          'molte persone oltre i 65 anni conta con tutti i suoi voti, anche con quelli dei più ' +
          'giovani.',
        'Non mostra quindi come hanno votato le persone con una caratteristica, né come ' +
          "andrebbe un'altra votazione. La selezione non è una previsione.",
      ],
    },
    {
      heading: "Svizzere e Svizzeri all'estero",
      paragraphs: [
        '11 o 12 Cantoni contano separatamente i voti delle loro Svizzere e dei loro Svizzeri ' +
          "all'estero, dall'1.0% all'1.6% dei voti validi. Non abitano in alcun Comune, non " +
          'figurano sulla carta e non hanno caratteristiche.',
        "L'interruttore «Contare le Svizzere e gli Svizzeri all'estero» determina se i loro " +
          'voti entrano nella selezione. Contano solo in un Cantone in cui rimane ancora un ' +
          'Comune.',
      ],
    },
    {
      heading: 'Comuni senza risultato proprio o senza dati',
      paragraphs: [
        'Pochissimi Comuni non hanno un risultato proprio: i loro voti sono contati con quelli ' +
          'di un altro Comune. Sono tratteggiati sulla carta, e un limite non cambia alcuna ' +
          'cifra a causa loro.',
        'Per alcuni piccoli Comuni del Cantone di Berna mancano le forze dei partiti. Un ' +
          'Comune senza dati viene escluso non appena il limite di questa caratteristica è ' +
          'ristretto.',
      ],
    },
    {
      heading: 'Le caratteristiche',
      paragraphs: [
        "Una votazione prende la popolazione e i bovini alla fine dell'ultimo anno prima del " +
          "suo giorno, le forze dei partiti dell'ultima elezione del Consiglio nazionale prima " +
          'del suo giorno, le lingue principali del censimento del 2000 e la superficie del 2026.',
        'Un limite confronta i valori come figurano per il Comune. I limiti di «Abitanti», ' +
          '«Abitanti per km²», «Superficie» e «Bovini per abitante» crescono da un passo ' +
          "all'altro dello stesso fattore, perché i loro valori si estendono su più ordini di " +
          'grandezza.',
      ],
    },
  ],
  SOURCES_HEADING: 'Fonti',
  SOURCE_VOTES:
    'Risultati delle votazioni: Ufficio federale di statistica (UST), votazioni popolari ' +
    'federali, risultati per Comune; Cancelleria federale, risultati accertati nel Foglio ' +
    'federale.',
  sourceMap: (date, lakesSet) =>
    'Comuni e carta: UST, Elenco ufficiale dei Comuni della Svizzera e confini comunali ' +
    `generalizzati, stato al ${date}; UST, ThemaKart ${String(lakesSet)} (laghi).`,
  SOURCE_CHARACTERISTICS:
    'Caratteristiche: UST, STATPOP; UST, elezioni del Consiglio nazionale; UST, censimento ' +
    'federale della popolazione 2000; UST, rilevazione delle strutture agricole; swisstopo, ' +
    'swissBOUNDARIES3D 2026.',
  SOURCES_FILE: 'Tutti i file letti e le loro interrogazioni:',
};
