// What a vote's page shows (spec verdicts), from the data files and the calculation. The figures
// are those of investigations/data-sources.md and of the data files of 2026-11-14.
import { expect, test } from 'vitest';
import votesFile from '../../static/data/votes.json';
import type { Vote, VoteFile, Votes } from './vote-data.ts';
import { calculateResult } from 'calculation';
import { textsOf } from './texts/index.ts';
import { judgedOf, votePage } from './vote-page.ts';

const listing = votesFile as Votes;
const de = textsOf('de');
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
    date: '28. Februar 2016',
    kind: 'Volksinitiative',
    majoritiesNeeded: 'Braucht das Volksmehr und das Ständemehr.',
  });
});

test('the figures of a vote', () => {
  // The turnout: 3,354,019 ballots cast of 5,302,873 registered voters.
  expect(page(5960).judged).toMatchObject({
    yesVotes: "1'609'152",
    noVotes: "1'664'224",
    yesShare: '49.16%',
    turnout: '63.25%',
  });
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

test('the table of the cantons', () => {
  const rows = page(5960).judged?.cantons ?? [];
  expect(rows).toHaveLength(26);
  expect(rows[0]).toEqual({ canton: 'ZH', yesShare: '43.46%', cantonalVotes: '1', side: 'Nein' });
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
    { canton: 'ZH', yesShare: '66.67%', cantonalVotes: '1', side: 'Ja' },
    { canton: 'UR', yesShare: '–', cantonalVotes: '1', side: 'Nein' },
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

test('a validated vote shows its reference', () => {
  expect(page(5670)).toMatchObject({
    source: 'Quelle: BBl 2013 3129',
    provisional: null,
    note: null,
  });
});

test('the annulled vote shows its reference and the note of the Federal Chancellery', () => {
  const annulled = page(5960);
  expect(annulled.source).toBe('Quelle: BBl 2019 4599');
  expect(annulled.note).toMatch(/^Das Bundesgericht hat mit Urteilen vom 10\. April 2019 /);
  expect(annulled.note).toBe(voteOf(5960).note?.de);
});

test('a result not validated yet says so and has no reference', () => {
  expect(page(6850)).toMatchObject({
    source: null,
    provisional: 'Vorläufiges Ergebnis: vom Bundesrat noch nicht erwahrt.',
  });
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
    { canton: 'ZH', yesShare: '60.00%', cantonalVotes: '1', side: 'Ja' },
    { canton: 'BE', yesShare: '–', cantonalVotes: 'keine Gemeinde übrig', side: '–' },
    { canton: 'OW', yesShare: '–', cantonalVotes: 'keine Gemeinde übrig', side: '–' },
  ]);
});
