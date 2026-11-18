// The texts of the three languages (spec interface-languages; design of add-interface-languages,
// decision 7). A text missing in a language is a type error; a text copied but not translated is
// caught here.
import { expect, test } from 'vitest';
import { textsOf, type Language } from './index.ts';

// The texts that are the same in every language: the working title, and the dash of an empty
// choice.
const SAME_IN_EVERY_LANGUAGE = ['TITLE', 'CHOOSE'];

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
    const copied = [...strings(textsOf(language))].filter(
      ([path, text]) =>
        path !== 'LANGUAGE' && !SAME_IN_EVERY_LANGUAGE.includes(path) && german.get(path) === text,
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

test("the bar's two lines, in German and French", () => {
  // Spec small-screens, "The selection's result at the bottom of a narrow window".
  expect(textsOf('de').selectionBar('Angenommen', 'Ja', 'Ja')).toEqual([
    'Mit Ihrer Auswahl: Angenommen',
    'Volksmehr: Ja · Ständemehr: Ja',
  ]);
  expect(textsOf('de').selectionBar('Abgelehnt', 'Nein', 'nicht nötig')).toEqual([
    'Mit Ihrer Auswahl: Abgelehnt',
    'Volksmehr: Nein · Ständemehr: nicht nötig',
  ]);
  expect(textsOf('fr').selectionBar('Accepté', 'Oui', 'Oui')).toEqual([
    'Avec votre sélection: Accepté',
    'Majorité du peuple: Oui · Majorité des cantons: Oui',
  ]);
});
