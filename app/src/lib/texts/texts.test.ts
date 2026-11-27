// The texts of the three languages (spec interface-languages; design of add-interface-languages,
// decision 7). A text missing in a language is a type error; a text copied but not translated is
// caught here.
import { expect, test } from 'vitest';
import { textsOf, type Language } from './index.ts';

// The texts that are the same in every language: the working title, and the dash of an empty
// choice. And the one word that German and French share: the heading "Religion".
const SAME_IN_EVERY_LANGUAGE = ['TITLE', 'CHOOSE'];
const SAME_IN_GERMAN_AND_FRENCH = ['GROUP.religion'];

/** Every string of a language's texts, by its path: "KINDS.popular-initiative", "MONTHS.2". */
function strings(value: unknown, path = ''): Map<string, string> {
  const found = new Map<string, string>();
  if (typeof value === 'string') {
    found.set(path, value);
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, inner] of Object.entries(value)) {
      for (const [innerPath, text] of strings(inner, path === '' ? key : `${path}.${key}`)) {
        found.set(innerPath, text);
      }
    }
  }
  return found;
}

test('no French or Italian text is the German one, apart from the working title and the dash', () => {
  const german = strings(textsOf('de'));
  for (const language of ['fr', 'it'] satisfies Language[]) {
    const same = [
      ...SAME_IN_EVERY_LANGUAGE,
      ...(language === 'fr' ? SAME_IN_GERMAN_AND_FRENCH : []),
    ];
    const copied = [...strings(textsOf(language))].filter(
      ([path, text]) => path !== 'LANGUAGE' && !same.includes(path) && german.get(path) === text,
    );
    expect(copied, language).toEqual([]);
  }
});

test("the six kinds of vote in French and Italian, the Chancellery's terms", () => {
  // Spec interface-languages, "The kinds of vote"; investigations/languages.md, 1.
  const order = [
    'mandatory-referendum',
    'optional-referendum',
    'popular-initiative',
    'initiative-with-counter-proposal',
    'counter-proposal',
    'tie-break-question',
  ] as const;
  expect(order.map((kind) => textsOf('fr').KINDS[kind])).toEqual([
    'Référendum obligatoire',
    'Référendum facultatif',
    'Initiative populaire',
    'Initiative populaire avec contre-projet',
    'Contre-projet',
    'Question subsidiaire',
  ]);
  expect(order.map((kind) => textsOf('it').KINDS[kind])).toEqual([
    'Referendum obbligatorio',
    'Referendum facoltativo',
    'Iniziativa popolare',
    'Iniziativa popolare con controprogetto',
    'Controprogetto',
    'Domanda risolutiva',
  ]);
});

// Spec interface-languages, "The spaces of the French texts": a no-break space before ":" and
// "»" and after "«", a narrow one before ";", "?" and "!". The cantonal votes' "16½ : 6½" is a
// figure, not a sign of the text.
const FRENCH_SIGN = /(?<!\u00a0)[:»]|(?<!\u202f)[;?!]|«(?!\u00a0)/u;

test('no French text has one of these signs without its space', () => {
  const fr = textsOf('fr');
  const written = new Map(strings(fr));
  const calls: Record<string, string> = {
    date: fr.date(28, 'février', 2016),
    day: fr.day(28, 'février'),
    startLead: fr.startLead(32),
    listShare: fr.listShare('49.16%'),
    listTieBreak: fr.listTieBreak('37.36%'),
    forTheInitiative: fr.forTheInitiative("1'098'341", '37.36%'),
    forTheCounterProposal: fr.forTheCounterProposal("1'841'208", '62.64%'),
    tieBreakCantons: fr.tieBreakCantons('2', '21'),
    explanationsLink: fr.explanationsLink('de'),
    explanationsLinkOwn: fr.explanationsLink(null),
    knownDifference: fr.knownDifference("1'350'325", 'no', 'FF 2024 996', '200', true),
    legendClass: fr.legendClass(true, 50),
    legendClassTop: fr.legendClass(false, 80),
    mapSource: fr.mapSource('1er janvier 2026', 2026),
    swissAbroadNotOnTheMap: fr.swissAbroadNotOnTheMap(12),
    // A vote's title is the source's, shown as it is.
    mapLabel: fr.mapLabel('Loi sur le CO2'),
    populationHeading: fr.populationHeading(2025),
    electionHeading: fr.electionHeading(2023),
    languagesHeading: fr.languagesHeading(2000),
    religionHeading: fr.religionHeading(2000),
    educationHeading: fr.educationHeading(2000),
    housingHeading: fr.housingHeading(2000),
    jobsHeading: fr.jobsHeading(2024),
    ofDate: fr.ofDate('Bovins par habitant', '2025'),
    characteristic: fr.characteristic('Habitants', "1'234"),
    populationDate: fr.populationDate(2025),
    censusDate: fr.censusDate(2000),
    limitLabel: fr.limitLabel('Habitants', 'fin 2025', '29', "2'007"),
    lowerBound: fr.lowerBound('Habitants'),
    upperBound: fr.upperBound('Habitants'),
    unusableParts: fr.unusableParts(['xyz=1', 'abroad=maybe']),
    removeLimit: fr.removeLimit('Habitants'),
    remainingCount: fr.remainingCount("1'134", "2'105"),
    sourceMap: fr.sourceMap('1er janvier 2026', 2026),
  };
  for (const [name, text] of Object.entries(calls)) written.set(name, text);
  const without = [...written].filter(([, text]) => FRENCH_SIGN.test(text));
  expect(without).toEqual([]);
  expect(fr.cantonalVotes('16½', '6½')).toBe('16½ : 6½');
});
