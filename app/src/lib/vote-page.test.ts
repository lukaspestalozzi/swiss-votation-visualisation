// What a vote's page shows (spec verdicts), from the data files and the calculation. The figures
// are those of investigations/data-sources.md and of the data files of 2026-11-14.
import { expect, test } from 'vitest';
import characteristicsFile from '../../static/data/characteristics.json';
import mapData from '../../static/data/map.json';
import municipalitiesFile from '../../static/data/municipalities.json';
import votesFile from '../../static/data/votes.json';
import type {
  CharacteristicsFile,
  MapFile,
  Municipalities,
  Vote,
  VoteFile,
  Votes,
} from './vote-data.ts';
import { calculateResult, entriesThatRemain, majoritiesNeeded } from 'calculation';
import { DEFINITIONS, applyingTo } from './characteristics.ts';
import { remainingUnder, trackOf } from './limits.ts';
import { voteEntriesOf } from './result-map.ts';
import { textsOf } from './texts/index.ts';
import { judgedOf, judgedOfFile, votePage } from './vote-page.ts';

const listing = votesFile as Votes;
const de = textsOf('de');
const fr = textsOf('fr');
const it = textsOf('it');
const files = import.meta.glob<VoteFile>('../../static/data/votes/*.json', {
  eager: true,
  import: 'default',
});
const fileOf = new Map(Object.values(files).map((file) => [file.id, file]));

function voteOf(id: number): Vote {
  const vote = listing.votes.find((vote) => vote.id === id);
  if (vote === undefined) throw new Error(`no vote ${String(id)}`);
  return vote;
}

function page(id: number) {
  return votePage(voteOf(id), fileOf.get(id), de);
}

test('the head of a vote', () => {
  expect(page(5960)).toMatchObject({
    title: 'Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»',
    date: '28.\u00a0Februar 2016',
    kind: 'Volksinitiative',
    majoritiesNeeded: 'Braucht das Volksmehr und das Ständemehr.',
  });
});

test('the figures of a vote', () => {
  // The turnout: 3,354,019 ballots cast of 5,302,873 registered voters.
  expect(page(5960).judged).toMatchObject({
    yesVotes: "1'609'152",
    noVotes: "1'664'224",
    turnout: '63.25%',
  });
  // The yes share is written once, with the majority of voters.
  expect(page(5960).judged?.verdicts[0].figure).toBe('49.16%');
});

test('the cantons in favour, the voters against', () => {
  expect(page(5960).judged).toMatchObject({
    verdicts: [
      { heading: 'Volksmehr', verdict: 'Nein', figure: '49.16%', greyed: false },
      { heading: 'Ständemehr', verdict: 'Ja', figure: '16½ : 6½', greyed: false },
    ],
    outcome: 'Abgelehnt',
  });
});

test('the voters in favour, the cantons against', () => {
  expect(page(5670).judged).toMatchObject({
    verdicts: [
      { heading: 'Volksmehr', verdict: 'Ja', figure: '54.35%' },
      { heading: 'Ständemehr', verdict: 'Nein', figure: '10 : 13' },
    ],
    outcome: 'Abgelehnt',
  });
});

test('a majority that is not needed reads so, with its cantonal votes greyed out', () => {
  const optional = page(6790);
  expect(optional.majoritiesNeeded).toBe('Braucht nur das Volksmehr.');
  expect(optional.judged).toMatchObject({
    verdicts: [
      { heading: 'Volksmehr', verdict: 'Ja', figure: '50.39%', greyed: false },
      { heading: 'Ständemehr', verdict: 'nicht nötig', figure: '7½ : 15½', greyed: true },
    ],
    outcome: 'Angenommen',
  });
});

test('the sides of the verdicts of 2016-02-28, for their colours', () => {
  // Spec site-style, "The verdicts in the map's colours".
  const judged = page(5960).judged;
  expect(judged?.verdicts.map((verdict) => verdict.side)).toEqual(['no', 'yes']);
  expect(judged?.outcomeSide).toBe('no');
  expect(judged?.cantons[0]).toMatchObject({ canton: 'ZH', side: 'Nein', forSide: 'no' });
});

test('a majority that is not needed has no side', () => {
  const judged = page(6790).judged;
  expect(judged?.verdicts.map((verdict) => verdict.side)).toEqual(['yes', null]);
  expect(judged?.outcomeSide).toBe('yes');
});

test('the table of the cantons', () => {
  const rows = page(5960).judged?.cantons ?? [];
  expect(rows).toHaveLength(26);
  expect(rows[0]).toMatchObject({
    canton: 'ZH',
    yesShare: '43.46%',
    cantonalVotes: '1',
    side: 'Nein',
    forSide: 'no',
  });
  // What a row's bar draws: its yes share in percent, as the row writes it to two decimals.
  expect(rows[0]?.yesPercent).toBeCloseTo(43.46, 2);
  expect(rows.at(-1)?.yesPercent).toBeCloseTo(60.07, 2);
  expect(rows.at(-1)?.canton).toBe('JU');
  expect(rows.filter((row) => row.cantonalVotes === '½').map((row) => row.canton)).toEqual([
    'OW',
    'NW',
    'BS',
    'BL',
    'AR',
    'AI',
  ]);
  const inFavour = rows
    .filter((row) => row.side === 'Ja')
    .reduce((sum, row) => sum + (row.cantonalVotes === '½' ? 0.5 : Number(row.cantonalVotes)), 0);
  expect(inFavour).toBe(16.5);
});

test('a canton without valid votes shows no yes share', () => {
  // Made up: Uri's one entry has no valid votes.
  const file: VoteFile = {
    id: 5960,
    entries: { ZH: [[261, 100, 60, 60, 40, 20]], UR: [[1201, 10, 0, 0, 0, 0]] },
    withoutResult: [],
  };
  expect(votePage(voteOf(5960), file, de).judged?.cantons).toEqual([
    {
      canton: 'ZH',
      yesShare: '66.67%',
      yesPercent: (40 / 60) * 100,
      cantonalVotes: '1',
      side: 'Ja',
      forSide: 'yes',
    },
    // Without a valid vote a row has no share to draw.
    {
      canton: 'UR',
      yesShare: '–',
      yesPercent: null,
      cantonalVotes: '1',
      side: 'Nein',
      forSide: 'no',
    },
  ]);
});

test('the tie-break question shows its figures and no verdict', () => {
  expect(page(6823)).toMatchObject({
    kind: 'Stichfrage',
    majoritiesNeeded: null,
    judged: null,
    tieBreak: {
      initiative: "Für die Initiative: 1'098'341 (37.36%)",
      counterProposal: "Für den Gegenentwurf: 1'841'208 (62.64%)",
      cantons: 'Stände: 2 für die Initiative, 21 für den Gegenentwurf',
      notJudged:
        'Die Stichfrage zählt nur, wenn die Initiative und der Gegenentwurf beide angenommen ' +
        'sind; sie wird hier nicht beurteilt.',
    },
  });
});

test("the tie-break question's bar: the initiative's share of the two", () => {
  // Spec verdicts, "The tie-break question of 2026-03-08": 1,098,341 of 2,939,549 votes.
  expect(page(6823).tieBreak?.initiativePercent).toBeCloseTo(37.3643, 3);
});

test('a validated vote shows its reference', () => {
  expect(page(5670)).toMatchObject({
    source: 'Quelle: BBl 2013 3129',
    note: null,
  });
});

test('the annulled vote shows its reference and the note of the Federal Chancellery', () => {
  const annulled = page(5960);
  expect(annulled.source).toBe('Quelle: BBl 2019 4599');
  expect(annulled.note).toMatch(/^Das Bundesgericht hat mit Urteilen vom 10\. April 2019 /);
  expect(annulled.note).toBe(voteOf(5960).note?.de);
});

test('a result not validated yet has no reference and nothing in its place', () => {
  // Spec verdicts, "What the sources say about the result".
  expect(page(6850)).toMatchObject({ source: null, note: null, differences: [] });
});

test('the calculated figures, with a note where they differ from the validated result', () => {
  const differing = page(6650);
  expect(differing.judged).toMatchObject({ noVotes: "1'350'525", outcome: 'Angenommen' });
  expect(differing.differences).toEqual([
    "Das erwahrte Ergebnis zählt 1'350'325 Nein-Stimmen (BBl 2024 996); die Zahlen der " +
      'Gemeinden, aus denen hier gerechnet wird, ergeben 200 mehr.',
  ]);
});

test('a vote whose entries add up to the validated result has no note on it', () => {
  expect(page(5960).differences).toEqual([]);
});

test('a vote without its file, or with an entry the calculation refuses, is an error that names it', () => {
  expect(() => votePage(voteOf(5960), undefined, de)).toThrow(/vote 5960 of 2016-02-28/);
  // Made up: an entry of a canton that does not exist.
  const refused: VoteFile = { id: 5960, entries: { XX: [[1, 10, 5, 5, 3, 2]] }, withoutResult: [] };
  expect(() => votePage(voteOf(5960), refused, de)).toThrow(/vote 5960 of 2016-02-28/);
});

test('a canton of the vote with nothing left keeps its row, which says so', () => {
  // Spec verdicts, "The cantons under a selection": only ZH remains of a vote of ZH, BE and OW.
  const result = calculateResult([{ canton: 'ZH', yes: 60, no: 40 }], 'voters-and-cantons');
  expect(judgedOf(result, 'voters-and-cantons', ['ZH', 'BE', 'OW'], de).cantons).toEqual([
    {
      canton: 'ZH',
      yesShare: '60.00%',
      yesPercent: 60,
      cantonalVotes: '1',
      side: 'Ja',
      forSide: 'yes',
    },
    {
      canton: 'BE',
      yesShare: '–',
      yesPercent: null,
      cantonalVotes: 'keine Gemeinde übrig',
      side: '–',
      forSide: null,
    },
    {
      canton: 'OW',
      yesShare: '–',
      yesPercent: null,
      cantonalVotes: 'keine Gemeinde übrig',
      side: '–',
      forSide: null,
    },
  ]);
});

test('the annulled vote in French and Italian: its title, reference and note in each', () => {
  // Spec interface-languages, "The vote's texts in the page's language".
  const inFrench = votePage(voteOf(5960), fileOf.get(5960), fr);
  expect(inFrench.title).toBe(
    'Initiative populaire «Pour le couple et la famille - Non à la pénalisation du mariage»',
  );
  expect(inFrench.source).toBe('Source: FF 2019 4421');
  expect(inFrench.note).toMatch(/^Par arrêts du 10 avril 2019/);
  const inItalian = votePage(voteOf(5960), fileOf.get(5960), it);
  expect(inItalian.title).toBe(
    'Iniziativa popolare «Per il matrimonio e la famiglia - No agli svantaggi per le coppie sposate»',
  );
  expect(inItalian.source).toBe('Fonte: FF 2019 3843');
  expect(inItalian.note).toMatch(/^Con sentenze del 10 aprile 2019/);
});

test('the verdicts of 5960 in French and Italian, with the terms of the Confederation', () => {
  // Spec interface-languages, "The verdicts in French" and "The verdicts in Italian".
  const shown = (language: 'fr' | 'it') => {
    const t = textsOf(language);
    const { kind, judged } = votePage(voteOf(5960), fileOf.get(5960), t);
    return {
      kind,
      figures: [t.YES_SHARE, t.TURNOUT],
      verdicts: judged?.verdicts.map((verdict) => verdict.heading),
      outcome: judged?.outcome,
      column: t.CANTONAL_VOTES,
    };
  };
  expect(shown('fr')).toEqual({
    kind: 'Initiative populaire',
    figures: ['Pourcentage de oui', 'Participation'],
    verdicts: ['Majorité du peuple', 'Majorité des cantons'],
    outcome: 'Rejeté',
    column: 'Voix des cantons',
  });
  expect(shown('it')).toEqual({
    kind: 'Iniziativa popolare',
    figures: ['Percentuale di sì', 'Partecipazione'],
    verdicts: ['Maggioranza del popolo', 'Maggioranza dei Cantoni'],
    outcome: 'Respinto',
    column: 'Voti dei Cantoni',
  });
});

test('a result not validated yet, in French and Italian: no source and no note', () => {
  // Spec interface-languages, "A result not validated yet".
  for (const t of [fr, it]) {
    expect(votePage(voteOf(6850), fileOf.get(6850), t)).toMatchObject({ source: null, note: null });
  }
});

test("a vote's result from its file, as its page gives it, for every judged vote", () => {
  // The comparison of two votes calculates each from its file in the browser (spec
  // vote-comparison, "The table of a vote").
  const judged = listing.votes.filter((vote) => vote.kind !== 'tie-break-question');
  expect(judged).toHaveLength(124);
  for (const vote of judged) {
    const file = fileOf.get(vote.id);
    if (file === undefined) throw new Error(`no file of vote ${String(vote.id)}`);
    const majorities = majoritiesNeeded(vote.kind);
    if (majorities === 'not-calculated') throw new Error(`vote ${String(vote.id)} is not judged`);
    expect(judgedOfFile(`vote ${String(vote.id)}`, file, majorities, de)).toEqual(
      votePage(vote, file, de).judged,
    );
  }
});

/** The cantons of a result's segments in favour and against, and the weights of each group. */
function segmentsShown(segments: NonNullable<ReturnType<typeof page>['judged']>['segments']) {
  const of = (side: 'yes' | 'no') => segments.filter((segment) => segment.side === side);
  const weight = (side: 'yes' | 'no') => of(side).reduce((sum, segment) => sum + segment.weight, 0);
  return {
    order: segments.map((segment) => segment.side),
    yes: of('yes').map((segment) => segment.canton),
    no: of('no').map((segment) => segment.canton),
    weights: [weight('yes'), weight('no')],
    halves: segments.filter((segment) => segment.weight === 0.5).map((segment) => segment.canton),
  };
}

test('the bars of 2016-02-28: the yes share, and the cantons in favour before those against', () => {
  // Spec verdicts, "The bars of a result": 1,609,152 yes of 3,273,376 valid votes; 16½ of 23.
  const judged = page(5960).judged;
  if (judged === null) throw new Error('the vote 5960 is judged');
  expect(judged.yesPercent).toBeCloseTo(49.1588, 4);
  const shown = segmentsShown(judged.segments);
  expect(shown.order).toEqual([...Array<string>(18).fill('yes'), ...Array<string>(8).fill('no')]);
  expect(shown.yes.join(' ')).toBe('LU UR SZ OW NW GL ZG FR SO SH AI SG AG TG TI VS NE JU');
  expect(shown.no.join(' ')).toBe('ZH BE BS BL AR GR VD GE');
  expect(shown.weights).toEqual([16.5, 6.5]);
  expect(shown.halves.join(' ')).toBe('OW NW AI BS BL AR');
});

/**
 * The result of the vote 5960 as its page writes it under limits, each a characteristic's key with
 * its lower and upper step.
 */
function selectionOf5960(limits: readonly (readonly [string, number, number])[]) {
  const characteristics = characteristicsFile as unknown as CharacteristicsFile;
  const voteFile = fileOf.get(5960);
  if (voteFile === undefined) throw new Error('no file of the vote 5960');
  const { cantons } = voteEntriesOf(
    voteFile,
    (mapData as unknown as MapFile).municipalities.map(([number]) => number),
    Object.values((municipalitiesFile as unknown as Municipalities).swissAbroad),
  );
  const applying = applyingTo(characteristics, '2016-02-28');
  const remaining = remainingUnder(
    characteristics.municipalities,
    limits.map(([key, lower, upper]) => {
      const definition = DEFINITIONS.find((candidate) => candidate.key === key);
      if (definition === undefined) throw new Error(`there is no characteristic ${key}`);
      return { track: trackOf(definition, characteristics, applying), lower, upper };
    }),
  );
  return judgedOf(
    calculateResult(entriesThatRemain(cantons, remaining, true), 'voters-and-cantons'),
    'voters-and-cantons',
    cantons.map((canton) => canton.canton),
    de,
  );
}

test('the bars of a selection: a canton with nothing left has no segment', () => {
  // Spec verdicts, "A canton with nothing left": foreigners up to 19.98%, 733,402 yes of
  // 1,397,775 valid votes, 18 of 22½ (investigations/limits.md, 5).
  const selection = selectionOf5960([['foreigners', 0, 327]]);
  expect(selection.yesPercent).toBeCloseTo(52.4692, 4);
  const shown = segmentsShown(selection.segments);
  expect(selection.segments).toHaveLength(25);
  expect([...shown.yes, ...shown.no]).not.toContain('BS');
  expect(shown.weights).toEqual([18, 4.5]);
  expect(shown.order.indexOf('no')).toBe(shown.yes.length);
});

test('the bars of a result with nothing left: no yes share and no segment', () => {
  // Spec verdicts, "Nothing remains": both bars are empty.
  const nothing = judgedOf(
    calculateResult([], 'voters-and-cantons'),
    'voters-and-cantons',
    ['ZH', 'BE'],
    de,
  );
  expect(nothing.yesPercent).toBeNull();
  expect(nothing.segments).toEqual([]);
});

// The summaries (spec vote-summaries): the texts of pipeline/vote-summaries.json, as the update
// writes them into votes.json, and the addresses of investigations/vote-summaries.md.
test("a vote's summary and the link to its day's explanations", () => {
  const summary = page(5960).summary;
  expect(summary.text).toMatch(/^Die Initiative will in der Verfassung festhalten, dass Ehepaare/);
  expect(summary.href).toBe(
    'https://www.admin.ch/dam/de/sd-web/kOH6nJzClyOD/Erlaeuterungen_DE_bf.pdf',
  );
  expect(summary.label).toBe('Erläuterungen des Bundesrates (PDF)');
});

test('a French page that links a German booklet, an Italian one that links a French copy', () => {
  const french = votePage(voteOf(5960), fileOf.get(5960), fr).summary;
  expect(french.text).toMatch(/^L'initiative veut inscrire dans la Constitution/);
  expect(french.href).toBe(
    'https://www.admin.ch/dam/fr/sd-web/kOH6nJzClyOD/Erlaeuterungen_DE_bf.pdf',
  );
  expect(french.label).toBe('Explications du Conseil fédéral (PDF, en allemand)');
  const italian = votePage(voteOf(5800), fileOf.get(5800), it).summary;
  expect(italian.href).toBe('https://swissvotes.ch/vote/578.00/brochure-fr.pdf');
  expect(italian.label).toBe('Spiegazioni del Consiglio federale (PDF, in francese)');
  expect(votePage(voteOf(5960), fileOf.get(5960), it).summary.label).toBe(
    'Spiegazioni del Consiglio federale (PDF)',
  );
});

test('every vote has a summary of 120 to 450 characters in each language', () => {
  for (const vote of listing.votes) {
    for (const t of [de, fr, it]) {
      const { text } = votePage(vote, fileOf.get(vote.id), t).summary;
      expect(text.length, `${String(vote.id)} ${t.LANGUAGE}`).toBeGreaterThanOrEqual(120);
      expect(text.length, `${String(vote.id)} ${t.LANGUAGE}`).toBeLessThanOrEqual(450);
    }
  }
});

test('a summary missing in one language is an error that names the vote and the language', () => {
  const vote = voteOf(5960);
  const without = { ...vote, summary: { ...vote.summary, fr: '' } };
  expect(() => votePage(without, fileOf.get(5960), fr)).toThrow(
    'vote 5960 has no summary in French',
  );
  const noLink = {
    ...vote,
    explanations: { ...vote.explanations, it: { address: '', language: 'it' as const } },
  };
  expect(() => votePage(noLink, fileOf.get(5960), it)).toThrow(
    'vote 5960 has no explanations in Italian',
  );
});

test('the three votes of 2026-03-08 share their explanations, each with its own summary', () => {
  const [initiative, counterProposal, tieBreak] = [6821, 6822, 6823].map(voteOf);
  expect(counterProposal.explanations).toEqual(initiative.explanations);
  expect(tieBreak.explanations).toEqual(initiative.explanations);
  expect(initiative.explanations.de.address).toMatch(/^https:\/\/www\.admin\.ch\//);
  const summaries = new Set([initiative, counterProposal, tieBreak].map((vote) => vote.summary.de));
  expect(summaries.size).toBe(3);
});
