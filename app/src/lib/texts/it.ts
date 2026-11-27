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
  day: (day, month) => `${day === 1 ? '1°' : String(day)}\u00a0${month}`,
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
  START_HEADING:
    'Come avrebbe votato la Svizzera se solo una parte dei Comuni si fosse recata alle urne?',
  startLead: (furtherCharacteristics) =>
    'Scelga una votazione e delimiti i Comuni: per numero di abitanti, età, forza dei partiti e ' +
    `altre ${String(furtherCharacteristics)} caratteristiche. La carta e il risultato vengono ` +
    'ricalcolati subito. Un esperimento mentale, non una previsione.',
  SEARCH_TITLES: 'Cercare un titolo',
  NO_MATCH: 'Nessuna votazione corrisponde a questa ricerca.',
  KEPT: 'Risultato',
  // The objects put to the vote, as the rows say "accettato" and "respinto".
  KEEP_ALL: 'Tutti',
  KEEP_ACCEPTED: 'Accettati',
  KEEP_REJECTED: 'Respinti',
  YEARS: 'Anni',
  LIST_PASSED: 'accettato',
  LIST_FAILED: 'respinto',
  listShare: (yesShare) => `${yesShare} di sì`,
  listTieBreak: (initiativeShare) => `${initiativeShare} per l'iniziativa`,
  MARK_NOTE: 'Nota',

  // A vote's page: the figures.
  YES: 'Sì',
  NO: 'No',
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
  CANTONS_HEADING: 'Cantoni',
  CANTON_BARS: 'Ogni barra va dal 50% alla percentuale di sì del Cantone.',
  CANTON_BARS_SELECTION:
    'Ogni barra va dal 50% alla percentuale di sì del Cantone; il trattino indica il suo ' +
    'risultato reale.',
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
  explanationsLink: (documentLanguage) =>
    documentLanguage === null
      ? 'Spiegazioni del Consiglio federale (PDF)'
      : `Spiegazioni del Consiglio federale (PDF, ${{ de: 'in tedesco', fr: 'in francese', it: 'in italiano' }[documentLanguage]})`,
  NOTE_HEADING: 'Nota della Cancelleria federale',
  knownDifference: (official, count, reference, difference, more) =>
    `Il risultato accertato conta ${official} ${count === 'yes' ? 'sì' : 'no'} (${reference}); ` +
    'le cifre dei Comuni su cui si basa il calcolo danno ' +
    `${difference} ${more ? 'in più' : 'in meno'}.`,

  // A vote's page: the map (spec result-map).
  legendClass: (yes, from) =>
    `${yes ? 'Sì' : 'No'}: ${from === 80 ? '80% e più' : `${String(from)}–${String(from + 10)}%`}`,
  LEGEND_SCALE: 'Percentuale di sì',
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
    'born-abroad': "Nati all'estero",
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
    reformed: 'Evangelici riformati',
    catholic: 'Cattolici romani',
    'no-religion': 'Senza appartenenza religiosa',
    'higher-education': 'Scuola universitaria o formazione professionale superiore',
    'compulsory-education': "Scuola dell'obbligo o nessuna formazione",
    'owner-occupied': 'Abitazioni occupate dal proprietario',
    'single-family-houses': 'Case unifamiliari',
    jobs: 'Impieghi ogni 100 abitanti',
    'primary-sector': 'Impieghi nel settore primario',
    'secondary-sector': 'Impieghi nel settore secondario',
    'tertiary-sector': 'Impieghi nel settore terziario',
    area: 'Superficie',
    cattle: 'Bovini per abitante',
    farms: "Aziende agricole ogni 1'000 abitanti",
    'organic-farmland': 'Quota bio della superficie agricola utile',
  },
  PANEL_HEADING: 'Caratteristiche del Comune',
  PANEL_PROMPT: 'Clicchi su un Comune per vederne le caratteristiche.',
  PANEL_LOADING: 'Caricamento delle caratteristiche …',
  PANEL_FAILED: 'Non è possibile caricare le caratteristiche.',
  NO_FIGURE: 'nessun dato',
  populationHeading: (year) => `Popolazione fine ${String(year)}`,
  electionHeading: (year) => `Elezione del Consiglio nazionale ${String(year)}`,
  languagesHeading: (year) => `Lingua principale, censimento ${String(year)}`,
  religionHeading: (year) => `Religione, censimento ${String(year)}`,
  educationHeading: (year) => `Formazione, censimento ${String(year)}`,
  housingHeading: (year) => `Abitazione, censimento ${String(year)}`,
  jobsHeading: (year) => `Lavoro fine ${String(year)}`,
  GROUP: {
    population: 'Popolazione',
    election: 'Elezione del Consiglio nazionale',
    languages: 'Lingua principale',
    religion: 'Religione',
    education: 'Formazione',
    housing: 'Abitazione',
    jobs: 'Lavoro',
    land: 'Superficie e agricoltura',
  },
  ofDate: (name, date) => `${name} (${date})`,
  characteristic: (name, value) => `${name}: ${value}`,
  CHARACTERISTICS_SOURCES:
    'Fonti: UST (STATPOP, STATENT, elezioni del Consiglio nazionale, censimento federale della ' +
    'popolazione 2000, rilevazione delle strutture agricole); swisstopo (swissBOUNDARIES3D 2026).',

  // The comparison of two votes (spec vote-comparison).
  COMPARE_HEADING: 'Confrontare due votazioni',
  COMPARE_ENTRY: 'Confrontare',
  FIRST_VOTE: 'Prima votazione',
  SECOND_VOTE: 'Seconda votazione',
  REAL_RESULT: 'Risultato reale',
  VOTE_LOADING: 'I risultati vengono caricati.',
  VOTE_FAILED: 'I risultati di questa votazione non possono essere caricati.',
  SAME_MUNICIPALITIES:
    'I Comuni sono scelti secondo le cifre della prima votazione; nelle due votazioni ' +
    'contano gli stessi Comuni.',
  COMPARE_LINK: "Confrontare con un'altra votazione",

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
  unusableParts: (parts) =>
    `Queste indicazioni dell'indirizzo non hanno potuto essere applicate: ${parts.map((part) => `«${part}»`).join(', ')}.`,
  removeLimit: (name) => `${REMOVE_LIMIT}: ${name}`,
  WITH_SELECTION,
  SELECTION_PLACE:
    'Appena fissa un limite per una caratteristica, qui appare il risultato dei Comuni rimasti.',
  LEGEND_SET_ASIDE: 'Non nella selezione',
  SET_ASIDE: 'Non nella selezione.',
  remainingCount: (remaining, all) =>
    `Nella selezione: ${remaining} dei ${all} Comuni con un risultato proprio.`,
  NOTHING_REMAINS: 'Non rimane nessun Comune con un risultato proprio.',
  BACK_TO_REAL: 'Tornare al risultato reale',
  CLOSE_LIST: 'Chiudere',

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
        'Solo quando sceglie dei Comuni compare sotto un secondo risultato, ricalcolato: «Con ' +
          'la Sua selezione». Il risultato reale rimane.',
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
        "L'indirizzo della pagina conserva la Sua selezione: chi lo apre vede la stessa selezione.",
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
          "all'estero, cioè dall'1.0% all'1.6% dei voti validi. Non abitano in alcun Comune, non " +
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
          'di un altro Comune. Sono tratteggiati sulla carta. Che la selezione li tenga o li ' +
          'escluda non cambia il risultato.',
        'Per alcuni piccoli Comuni del Cantone di Berna mancano le forze dei partiti. Per gli ' +
          "impieghi di un settore i dati mancano dove l'UST non pubblica la cifra, e per la " +
          "quota bio dove non c'è superficie agricola utile. Un Comune senza dati viene escluso " +
          'non appena il limite di questa caratteristica è ristretto.',
      ],
    },
    {
      heading: 'Le caratteristiche',
      paragraphs: [
        'Per una votazione valgono la popolazione, gli impieghi, i bovini e le aziende agricole ' +
          "dell'ultimo anno prima del giorno della votazione e le forze dei partiti dell'ultima " +
          'elezione del Consiglio nazionale precedente. Lingua principale, religione, formazione ' +
          'e abitazione provengono dal censimento del 2000, la superficie è quella del 2026. Se ' +
          "le cifre dell'ultimo anno non sono ancora pubblicate, valgono le più recenti.",
        'Gli impieghi sono quelli degli stabilimenti situati nel Comune, ovunque vivano le ' +
          'persone che li occupano. Per la lingua principale, la religione, la formazione e ' +
          "l'abitazione non esistono cifre più recenti per ogni Comune.",
        'Un limite confronta i valori come figurano per il Comune. I limiti di «Abitanti», ' +
          '«Abitanti per km²», «Impieghi ogni 100 abitanti», «Superficie», «Bovini per ' +
          "abitante» e «Aziende agricole ogni 1'000 abitanti» crescono da un passo all'altro " +
          'dello stesso fattore, perché i loro valori si estendono su più ordini di grandezza.',
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
    'Caratteristiche: UST, STATPOP; UST, STATENT; UST, elezioni del Consiglio nazionale; UST, ' +
    'censimento federale della popolazione 2000; UST, rilevazione delle strutture agricole; ' +
    'swisstopo, swissBOUNDARIES3D 2026.',
  SOURCE_SUMMARIES:
    'Descrizioni degli oggetti: redatte da questo sito sulla base delle «Spiegazioni del ' +
    'Consiglio federale»; non sono testi ufficiali. Un link sotto ogni descrizione porta alle ' +
    'spiegazioni, per le votazioni fino a marzo 2015 alle copie di Swissvotes (Università di ' +
    'Berna).',
  SOURCES_FILE: 'Tutti i file letti e le loro interrogazioni:',
};
