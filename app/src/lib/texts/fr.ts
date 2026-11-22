// The French texts of the screen (texts/index.ts), with the Confederation's terms
// (investigations/languages.md; design of add-interface-languages, decision 11): "vous", no space
// before a colon, « » without inner spaces.
import type { Texts } from './index.ts';

const REMOVE_LIMIT = 'Retirer';
const WITH_SELECTION = 'Avec votre sélection';
const MAJORITY_OF_VOTERS = 'Majorité du peuple';
const MAJORITY_OF_CANTONS = 'Majorité des cantons';

export const fr: Texts = {
  LANGUAGE: 'fr',
  TITLE: 'Popular Vote Explorer',
  ALL_VOTES: 'Toutes les votations',
  MONTHS: [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ],
  // The first day of a month as the Constitution's footnotes write it: "1er".
  // The day and the month joined by a non-breaking space, so that a line never parts them.
  date: (day, month, year) => `${day === 1 ? '1er' : String(day)}\u00a0${month} ${String(year)}`,
  KINDS: {
    'mandatory-referendum': 'Référendum obligatoire',
    'optional-referendum': 'Référendum facultatif',
    'popular-initiative': 'Initiative populaire',
    'initiative-with-counter-proposal': 'Initiative populaire avec contre-projet',
    'counter-proposal': 'Contre-projet',
    'tie-break-question': 'Question subsidiaire',
  },
  MAJORITIES_NEEDED: {
    'voters-and-cantons': 'Requiert la majorité du peuple et la majorité des cantons.',
    voters: 'Requiert seulement la majorité du peuple.',
  },

  // The list.
  LIST_PASSED: 'accepté',
  LIST_FAILED: 'rejeté',
  listResult: (verdict, yesShare) => `${verdict}, ${yesShare} de oui`,
  listTieBreak: (initiativeShare) => `${initiativeShare} pour l'initiative`,
  MARK_NOTE: 'Note',
  MARK_PROVISIONAL: 'provisoire',

  // A vote's page: the figures.
  YES_VOTES: 'Oui',
  NO_VOTES: 'Non',
  YES_SHARE: 'Pourcentage de oui',
  TURNOUT: 'Participation',

  // A vote's page: the verdicts.
  MAJORITY_OF_VOTERS,
  MAJORITY_OF_CANTONS,
  REACHED: 'Oui',
  NOT_REACHED: 'Non',
  NOT_NEEDED: 'pas nécessaire',
  NOTHING_LEFT: 'aucune commune restante',
  PASSED: 'Accepté',
  FAILED: 'Rejeté',
  cantonalVotes: (inFavour, against) => `${inFavour} : ${against}`,

  // A vote's page: the table of the cantons.
  CANTON: 'Canton',
  CANTONAL_VOTES: 'Voix des cantons',
  SIDE: 'Résultat',

  // A vote's page: the tie-break question.
  forTheInitiative: (count, share) => `Pour l'initiative: ${count} (${share})`,
  forTheCounterProposal: (count, share) => `Pour le contre-projet: ${count} (${share})`,
  tieBreakCantons: (initiative, counterProposal) =>
    `Cantons: ${initiative} pour l'initiative, ${counterProposal} pour le contre-projet`,
  TIE_BREAK_NOT_JUDGED:
    "La question subsidiaire ne compte que si l'initiative et le contre-projet sont tous deux " +
    "acceptés; elle n'est pas évaluée ici.",

  // A vote's page: what the sources say.
  SOURCE: 'Source: ',
  PROVISIONAL: 'Résultat provisoire: pas encore validé par le Conseil fédéral.',
  NOTE_HEADING: 'Note de la Chancellerie fédérale',
  knownDifference: (official, count, reference, difference, more) =>
    `Le résultat validé compte ${official} ${count === 'yes' ? 'oui' : 'non'} (${reference}); ` +
    'les chiffres des communes sur lesquels se fonde le calcul donnent ' +
    `${difference} de ${more ? 'plus' : 'moins'}.`,

  // A vote's page: the map (spec result-map).
  legendClass: (yes, from) =>
    `${yes ? 'Oui' : 'Non'}: ${from === 80 ? '80% et plus' : `${String(from)}–${String(from + 10)}%`}`,
  LEGEND_TIE: 'Autant de oui que de non',
  LEGEND_WITHOUT_RESULT: 'Pas de résultat propre',
  WITHOUT_RESULT: "Pas de résultat propre: ses voix sont comptées avec celles d'une autre commune.",
  MAP_HEADING: 'Carte des communes',
  mapSource: (date, lakesSet) =>
    `Fond de carte: © OFS, communes et cantons au ${date}, lacs: ThemaKart ${String(lakesSet)}`,
  swissAbroadNotOnTheMap: (cantons) =>
    "Pas sur la carte: les voix des Suissesses et Suisses de l'étranger, " +
    `que ${String(cantons)} cantons comptent séparément.`,
  ZOOM_IN: 'Agrandir',
  ZOOM_OUT: 'Réduire',
  WHOLE_SWITZERLAND: 'Toute la Suisse',
  MAP_FAILED: 'La carte ne peut pas être chargée.',
  mapLabel: (title) =>
    `Carte des communes: ${title}. Les chiffres des cantons figurent dans le tableau sous la carte.`,

  // A vote's page: the characteristics of a municipality (specs characteristics and result-map).
  CHARACTERISTIC: {
    inhabitants: 'Habitants',
    foreigners: 'Part des étrangers',
    'age-0-17': '0–17 ans',
    'age-18-34': '18–34 ans',
    'age-35-49': '35–49 ans',
    'age-50-64': '50–64 ans',
    'age-65': '65 ans et plus',
    density: 'Habitants par km²',
    fdp: 'PLR',
    centre: "Le Centre (jusqu'en 2020 PDC et PBD)",
    sp: 'PS',
    svp: 'UDC',
    glp: 'PVL',
    greens: 'Verts',
    'other-parties': 'Autres partis',
    german: 'Allemand',
    french: 'Français',
    italian: 'Italien',
    romansh: 'Romanche',
    area: 'Surface',
    cattle: 'Bovins par habitant',
  },
  PANEL_HEADING: 'Caractéristiques de la commune',
  PANEL_PROMPT: 'Cliquez sur une commune pour voir ses caractéristiques.',
  PANEL_LOADING: 'Les caractéristiques sont en cours de chargement …',
  PANEL_FAILED: 'Les caractéristiques ne peuvent pas être chargées.',
  NO_FIGURE: 'pas de données',
  populationHeading: (year) => `Population fin ${String(year)}`,
  electionHeading: (year) => `Élection du Conseil national ${String(year)}`,
  languagesHeading: (year) => `Langue principale, recensement ${String(year)}`,
  LAND_HEADING: 'Surface et agriculture',
  ofYear: (name, year) => `${name} (${String(year)})`,
  characteristic: (name, value) => `${name}: ${value}`,
  CHARACTERISTICS_SOURCES:
    'Sources: OFS (STATPOP, élections au Conseil national, recensement fédéral de la population ' +
    '2000, relevé des structures agricoles); swisstopo (swissBOUNDARIES3D 2026).',

  // The comparison of two votes (spec vote-comparison).
  COMPARE_HEADING: 'Comparer deux votations',
  FIRST_VOTE: 'Première votation',
  SECOND_VOTE: 'Deuxième votation',
  REAL_RESULT: 'Vrai résultat',
  PROPOSAL: 'Objet',
  VOTE_LOADING: 'Les résultats sont en cours de chargement.',
  VOTE_FAILED: 'Les résultats de cette votation ne peuvent pas être chargés.',
  SAME_MUNICIPALITIES:
    'Les communes sont choisies selon les chiffres de la première votation; les mêmes ' +
    'communes comptent dans les deux votations.',

  // The limits (spec limits).
  populationDate: (year) => `fin ${String(year)}`,
  censusDate: (year) => `recensement ${String(year)}`,
  limitLabel: (name, date, lower, upper) => `${name} (${date}): de ${lower} à ${upper}`,
  LIMITS_HEADING: 'Choisir des communes',
  THOUGHT_EXPERIMENT:
    "Une expérience de pensée: voici l'issue qu'aurait eue la votation si seules les communes " +
    "choisies avaient voté. Elle ne montre pas comment chaque personne a voté et n'est pas une " +
    'prévision.',
  ADD_LIMIT: 'Ajouter une caractéristique',
  CHOOSE: '–',
  REMOVE_LIMIT,
  lowerBound: (name) => `Limite inférieure: ${name}`,
  upperBound: (name) => `Limite supérieure: ${name}`,
  ABROAD_SWITCH:
    "Compter les Suissesses et Suisses de l'étranger (dans chaque canton où il reste une " +
    'commune)',
  LIMITS_FAILED: 'Sans les caractéristiques, aucune commune ne peut être choisie.',
  unusableParts: (parts) =>
    `Ces indications de l'adresse n'ont pas pu être appliquées: ${parts.map((part) => `«${part}»`).join(', ')}.`,
  removeLimit: (name) => `${REMOVE_LIMIT}: ${name}`,
  WITH_SELECTION,
  LEGEND_SET_ASIDE: 'Pas dans la sélection',
  SET_ASIDE: 'Pas dans la sélection.',
  remainingCount: (remaining, all) =>
    `Dans la sélection: ${remaining} des ${all} communes avec un résultat propre.`,
  NOTHING_REMAINS: 'Il ne reste aucune commune avec un résultat propre.',
  BACK_TO_REAL: 'Retour au vrai résultat',
  ADD: 'Ajouter',

  // The reading guide (spec reading-guide).
  GUIDE_HEADING: 'Guide de lecture',
  GUIDE_LINK: 'Guide de lecture et sources',
  GUIDE_SECTIONS: [
    {
      heading: 'Le vrai résultat',
      paragraphs: [
        "En haut de la page d'une votation figure son résultat officiel. Il est calculé à " +
          'partir des chiffres des communes selon les règles de la Constitution fédérale: la ' +
          "majorité du peuple et, là où l'objet le requiert, la majorité des cantons.",
        "Ce n'est que lorsque vous choisissez des communes qu'un second résultat, recalculé, " +
          'apparaît à côté sous «Avec votre sélection». Le vrai résultat reste affiché.',
      ],
    },
    {
      heading: 'Choisir des communes',
      paragraphs: [
        'Une limite fixe pour une caractéristique une valeur inférieure et une valeur ' +
          "supérieure. Une commune ne reste que si elle se trouve à l'intérieur de toutes les " +
          'limites. Les autres sont en gris foncé sur la carte et ne comptent pas.',
        'Le résultat est calculé comme si seules les communes restantes avaient voté, selon ' +
          "les mêmes règles que le vrai. Un canton dans lequel il ne reste aucune commune n'a " +
          'pas de voix. La majorité des cantons requiert alors moins de voix des cantons. ' +
          "S'il ne reste aucune commune, l'objet est rejeté.",
        "L'adresse de la page retient votre sélection: qui l'ouvre voit la même sélection.",
      ],
    },
    {
      heading: 'Ce que la sélection ne montre pas',
      paragraphs: [
        'La sélection garde ou écarte des communes entières avec toutes leurs voix. Une ' +
          'commune comptant beaucoup de personnes de plus de 65 ans compte avec toutes ses ' +
          'voix, y compris celles des plus jeunes.',
        'Elle ne montre donc pas comment les personnes ayant une caractéristique ont voté, ni ' +
          "comment une autre votation se terminerait. La sélection n'est pas une prévision.",
      ],
    },
    {
      heading: "Suissesses et Suisses de l'étranger",
      paragraphs: [
        '11 ou 12 cantons comptent séparément les voix de leurs Suissesses et Suisses de ' +
          "l'étranger, 1.0% à 1.6% des voix valables. Ils n'habitent dans aucune commune, ne " +
          "figurent pas sur la carte et n'ont pas de caractéristiques.",
        "Le commutateur «Compter les Suissesses et Suisses de l'étranger» détermine si leurs " +
          'voix entrent dans la sélection. Elles ne comptent que dans un canton où il reste ' +
          'encore une commune.',
      ],
    },
    {
      heading: 'Communes sans résultat propre ou sans données',
      paragraphs: [
        "Quelques rares communes n'ont pas de résultat propre: leurs voix sont comptées avec " +
          "celles d'une autre commune. Elles sont hachurées sur la carte, et une limite ne " +
          "change aucun chiffre à cause d'elles.",
        'Pour quelques petites communes du canton de Berne, la force des partis manque. Une ' +
          'commune sans données est écartée dès que la limite de cette caractéristique est ' +
          'resserrée.',
      ],
    },
    {
      heading: 'Les caractéristiques',
      paragraphs: [
        'Une votation prend la population et les bovins à la fin de la dernière année avant ' +
          'son jour, la force des partis de la dernière élection du Conseil national avant son ' +
          'jour, les langues principales du recensement de 2000 et la surface de 2026.',
        "Une limite compare les valeurs telles qu'elles figurent pour la commune. Les limites " +
          'de «Habitants», «Habitants par km²», «Surface» et «Bovins par habitant» croissent ' +
          "d'un pas à l'autre du même facteur, parce que leurs valeurs s'étendent sur plusieurs " +
          'ordres de grandeur.',
      ],
    },
  ],
  SOURCES_HEADING: 'Sources',
  SOURCE_VOTES:
    'Résultats des votations: Office fédéral de la statistique (OFS), votations populaires ' +
    'fédérales, résultats par commune; Chancellerie fédérale, résultats validés dans la Feuille ' +
    'fédérale.',
  sourceMap: (date, lakesSet) =>
    'Communes et carte: OFS, Répertoire officiel des communes de Suisse et limites communales ' +
    `généralisées, état au ${date}; OFS, ThemaKart ${String(lakesSet)} (lacs).`,
  SOURCE_CHARACTERISTICS:
    'Caractéristiques: OFS, STATPOP; OFS, élections au Conseil national; OFS, recensement ' +
    'fédéral de la population 2000; OFS, relevé des structures agricoles; swisstopo, ' +
    'swissBOUNDARIES3D 2026.',
  SOURCES_FILE: 'Tous les fichiers lus et leurs requêtes:',
};
