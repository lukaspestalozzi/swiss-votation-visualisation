// The limits (spec limits), against characteristics.json and the figures of
// investigations/limits.md.
import { calculateResult, entriesThatRemain, majoritiesNeeded, type Result } from 'calculation';
import { expect, test } from 'vitest';
import characteristicsFile from '../../static/data/characteristics.json';
import mapData from '../../static/data/map.json';
import municipalitiesFile from '../../static/data/municipalities.json';
import votesFile from '../../static/data/votes.json';
import { DEFINITIONS, applyingTo, nameOf, writeUnits, type Definition } from './characteristics.ts';
import {
  BINS,
  STEPS,
  histogramOf,
  isNarrowed,
  labelOf,
  labelPartsOf,
  remainingOf,
  remainingUnder,
  setAsideOf,
  stepOf,
  trackOf,
  valueAt,
  type Track,
} from './limits.ts';
import { voteEntriesOf } from './result-map.ts';
import { textsOf } from './texts/index.ts';
import type { CharacteristicsFile, MapFile, Municipalities, VoteFile, Votes } from './vote-data.ts';

const file = characteristicsFile as unknown as CharacteristicsFile;
const de = textsOf('de');

function definitionNamed(name: string): Definition {
  const definition = DEFINITIONS.find((candidate) => nameOf(candidate, de) === name);
  if (definition === undefined) throw new Error(`there is no characteristic ${name}`);
  return definition;
}

/** The track of a characteristic for the vote of a day. */
function trackFor(name: string, voteDate: string): Track {
  return trackOf(definitionNamed(name), file, applyingTo(file, voteDate));
}

/** The value of a step, as the panel writes it. */
function at(track: Track, step: number): string {
  return writeUnits(track.definition, valueAt(track, step), de);
}

test('a linear track: the foreigners of 2016-02-28', () => {
  // investigations/limits.md, 4: from 0.00% to 61.10%; 20.00% is no step.
  const track = trackFor('Ausländeranteil', '2016-02-28');
  expect([at(track, 0), at(track, 1000)]).toEqual(['0.00%', '61.10%']);
  expect([at(track, 327), at(track, 328), at(track, 999)]).toEqual(['19.98%', '20.04%', '61.04%']);
});

test('a logarithmic track: the inhabitants of 2016-02-28', () => {
  // investigations/limits.md, 4: from 31 to 396,955, the middle step at 3,508.
  const track = trackFor('Einwohner', '2016-02-28');
  expect([at(track, 0), at(track, 500), at(track, 1000)]).toEqual(['31', "3'508", "396'955"]);
});

test('a logarithmic track from zero: the cattle of 2016-02-28', () => {
  // investigations/limits.md, 4: step 0 is 0, the steps from 1 run from 0.001 to 8.158.
  const track = trackFor('Rinder je Einwohner', '2016-02-28');
  expect([at(track, 0), at(track, 1), at(track, 500), at(track, 1000)]).toEqual([
    '0.000',
    '0.001',
    '0.090',
    '8.158',
  ]);
});

test('a track has the range of its own characteristic: the elderly are the elderly', () => {
  // investigations/limits.md, 5 (Output, 5); failure mode 5 of the predecessor.
  const elderly = trackFor('65 Jahre und älter', '2016-02-28');
  expect([at(elderly, 0), at(elderly, 1000)]).toEqual(['5.81%', '36.16%']);
  const young = trackFor('0–17 Jahre', '2016-02-28');
  expect([at(young, 0), at(young, 1000)]).toEqual(['2.04%', '35.96%']);
});

test('the label of a limit names its characteristic, the date of its figures and its bounds', () => {
  // Spec limits, "The label of a limit", and investigations/limits.md, 4 and 5.
  const label = (name: string, voteDate: string, lower: number, upper: number): string =>
    labelOf(trackFor(name, voteDate), lower, upper, de);
  expect(label('SVP', '2021-03-07', 0, STEPS)).toBe(
    'SVP (Nationalratswahl 2019): von 0.00% bis 84.11%',
  );
  expect(label('Italienisch', '2021-03-07', 0, STEPS)).toBe(
    'Italienisch (Volkszählung 2000): von 0.00% bis 96.84%',
  );
  expect(label('Fläche', '2021-03-07', 0, STEPS)).toBe(
    'Fläche (2026): von 0.32 km² bis 438.61 km²',
  );
  expect(label('Einwohner', '2016-02-28', 500, STEPS)).toBe(
    "Einwohner (Ende 2015): von 3'508 bis 396'955",
  );
  expect(label('Rinder je Einwohner', '2016-02-28', 0, 1)).toBe(
    'Rinder je Einwohner (2015): von 0.000 bis 0.001',
  );
});

test('each of the 35 characteristics has a track with its label', () => {
  // investigations/more-characteristics.md, 3, 7 and 12, for the vote of 2016-02-28.
  const applying = applyingTo(file, '2016-02-28');
  for (const definition of DEFINITIONS) {
    const track = trackOf(definition, file, applying);
    expect(track.values).toHaveLength(file.municipalities.length);
    expect(track.smallest).toBeLessThan(track.largest);
    expect(valueAt(track, 0)).toBe(track.smallest);
    expect(valueAt(track, STEPS)).toBe(track.largest);
  }
  expect(DEFINITIONS).toHaveLength(35);
  const label = (name: string): string => labelOf(trackFor(name, '2016-02-28'), 0, STEPS, de);
  expect(label('Im Ausland geboren')).toBe('Im Ausland geboren (Ende 2015): von 0.00% bis 66.13%');
  expect(label('Arbeitsplätze je 100 Einwohner')).toBe(
    'Arbeitsplätze je 100 Einwohner (Ende 2015): von 5.2 bis 445.5',
  );
  expect(label("Landwirtschaftsbetriebe je 1'000 Einwohner")).toBe(
    "Landwirtschaftsbetriebe je 1'000 Einwohner (2015): von 0.0 bis 210.5",
  );
  expect(label('Hochschule oder höhere Berufsbildung')).toBe(
    'Hochschule oder höhere Berufsbildung (Volkszählung 2000): von 0.00% bis 49.69%',
  );
  expect(label('Bio-Anteil der landwirtschaftlichen Nutzfläche')).toBe(
    'Bio-Anteil der landwirtschaftlichen Nutzfläche (2015): von 0.00% bis 100.00%',
  );
});

test('the two new logarithmic tracks: step 500 is far below the middle of their values', () => {
  // Spec limits, "The two new logarithmic tracks".
  const from500 = (name: string): string => labelOf(trackFor(name, '2016-02-28'), 500, STEPS, de);
  expect(from500('Arbeitsplätze je 100 Einwohner')).toBe(
    'Arbeitsplätze je 100 Einwohner (Ende 2015): von 48.1 bis 445.5',
  );
  expect(from500("Landwirtschaftsbetriebe je 1'000 Einwohner")).toBe(
    "Landwirtschaftsbetriebe je 1'000 Einwohner (2015): von 4.6 bis 210.5",
  );
});

// The selections of investigations/limits.md, 5, from the data files: each limit by its
// characteristic and the steps of its bounds.
const listing = votesFile as Votes;
const onTheMap = (mapData as unknown as MapFile).municipalities.map(([number]) => number);
const swissAbroad = Object.values((municipalitiesFile as unknown as Municipalities).swissAbroad);
const voteFiles = new Map(
  Object.values(
    import.meta.glob<VoteFile>('../../static/data/votes/*.json', {
      eager: true,
      import: 'default',
    }),
  ).map((voteFile) => [voteFile.id, voteFile]),
);

function select(
  id: number,
  limits: readonly (readonly [string, number, number])[],
  abroadCounted: boolean,
): { result: Result; municipalities: number; withResult: number } {
  const vote = listing.votes.find((candidate) => candidate.id === id);
  const voteFile = voteFiles.get(id);
  if (vote === undefined || voteFile === undefined) throw new Error(`no vote ${String(id)}`);
  const majorities = majoritiesNeeded(vote.kind);
  if (majorities === 'not-calculated') throw new Error(`vote ${String(id)} is not judged`);
  const { cantons } = voteEntriesOf(voteFile, onTheMap, swissAbroad);
  const remaining = remainingUnder(
    file.municipalities,
    limits.map(([name, lower, upper]) => ({ track: trackFor(name, vote.date), lower, upper })),
  );
  const result = calculateResult(entriesThatRemain(cantons, remaining, abroadCounted), majorities);
  const all = cantons.flatMap((canton) => canton.municipalities);
  return {
    result,
    municipalities: all.filter(([number]) => remaining.has(number)).length,
    withResult: all.length,
  };
}

/** The figures of a result as the investigation's table gives them. */
function row(selected: ReturnType<typeof select>) {
  const { result, municipalities, withResult } = selected;
  return {
    municipalities: `${String(municipalities)} of ${String(withResult)}`,
    yes: result.yes,
    no: result.no,
    cantonalVotes: [result.cantonalVotesInFavour, result.cantonalVotesAgainst],
    cantons: result.cantons.length,
    passed: result.passed,
  };
}

/** The yes share in percent, to four decimals as the investigation writes it. */
const percent = (result: Result): number => Math.round((result.yesShare ?? NaN) * 1e6) / 1e4;

test('2015-06-14 with nothing narrowed and the Swiss abroad counted: the official result', () => {
  const selected = select(5950, [['Einwohner', 0, STEPS]], true);
  expect(row(selected)).toEqual({
    municipalities: '2103 of 2103',
    yes: 1128522,
    no: 1124873,
    cantonalVotes: [6.5, 16.5],
    cantons: 26,
    passed: true,
  });
  expect(percent(selected.result)).toBe(50.081);
});

test('2015-06-14 without the Swiss abroad: the vote fails', () => {
  const selected = select(5950, [], false);
  expect(row(selected)).toEqual({
    municipalities: '2103 of 2103',
    yes: 1107734,
    no: 1113998,
    cantonalVotes: [6.5, 16.5],
    cantons: 26,
    passed: false,
  });
  expect(percent(selected.result)).toBe(49.859);
});

test('2016-02-28, foreigners up to 19.98%: BS has nothing left, the vote passes', () => {
  const selected = select(5960, [['Ausländeranteil', 0, 327]], true);
  expect(row(selected)).toEqual({
    municipalities: '1455 of 2103',
    yes: 733402,
    no: 664373,
    cantonalVotes: [18, 4.5],
    cantons: 25,
    passed: true,
  });
  expect(percent(selected.result)).toBe(52.4692);
  expect(selected.result.cantons.map((canton) => canton.canton)).not.toContain('BS');
});

test('2016-02-28, Italian from 50.07%: only GR and TI remain', () => {
  const selected = select(5960, [['Italienisch', 517, STEPS]], true);
  expect(row(selected)).toEqual({
    municipalities: '115 of 2103',
    yes: 81350,
    no: 67260,
    cantonalVotes: [2, 0],
    cantons: 2,
    passed: true,
  });
  expect(percent(selected.result)).toBe(54.7406);
  expect(selected.result.cantons.map((canton) => canton.canton)).toEqual(['GR', 'TI']);
});

test('2016-02-28, inhabitants from 3,508: the voters against, the cantons in favour', () => {
  const selected = select(5960, [['Einwohner', 500, STEPS]], true);
  expect(row(selected)).toEqual({
    municipalities: '576 of 2103',
    yes: 1137986,
    no: 1266006,
    cantonalVotes: [12.5, 10.5],
    cantons: 26,
    passed: false,
  });
  expect(percent(selected.result)).toBe(47.3373);
});

test('2021-03-07, SVP up to 49.96%: NW has nothing left, Rüti bei Lyssach is set aside', () => {
  const selected = select(6400, [['SVP', 0, 594]], true);
  expect(row(selected)).toEqual({
    municipalities: '1922 of 2105',
    yes: 1364382,
    no: 1280078,
    cantonalVotes: [17, 5.5],
    cantons: 25,
    passed: true,
  });
  expect(percent(selected.result)).toBe(51.594);
  expect(selected.result.cantons.map((canton) => canton.canton)).not.toContain('NW');
  const remaining = remainingUnder(file.municipalities, [
    { track: trackFor('SVP', '2021-03-07'), lower: 0, upper: 594 },
  ]);
  expect(remaining.has(422)).toBe(false);
});

test('a limit is narrowed when a bound lies inside its values', () => {
  const foreigners = trackFor('Ausländeranteil', '2016-02-28');
  expect(isNarrowed({ track: foreigners, lower: 0, upper: STEPS })).toBe(false);
  expect(isNarrowed({ track: foreigners, lower: 0, upper: 999 })).toBe(true);
  expect(isNarrowed({ track: foreigners, lower: 1, upper: STEPS })).toBe(true);
  // Step 1 of the inhabitants is still 31, the smallest value: nothing is set aside.
  const inhabitants = trackFor('Einwohner', '2016-02-28');
  expect(isNarrowed({ track: inhabitants, lower: 1, upper: STEPS })).toBe(false);
});

test('the set-aside municipalities are those with an entry that do not remain', () => {
  const aside = setAsideOf([12, 7, 30, 4], new Set([7, 4, 99]));
  expect([...aside]).toEqual([12, 30]);
});

test('the count: how many of the municipalities with an entry remain', () => {
  expect(remainingOf([12, 7, 30, 4], new Set([7, 4, 99]))).toBe(2);
  expect(remainingOf([12, 30], new Set([7]))).toBe(0);
});

/** The value of a municipality on a track, by its number. */
function valueOf(track: Track, number: number): number {
  const value = track.values[file.municipalities.indexOf(number)];
  if (typeof value !== 'number') throw new Error(`no figure of ${String(number)}`);
  return value;
}

test('the histogram of a linear track: the foreigners of 2016-02-28', () => {
  // Spec limits, "The foreigners of 2015" (investigations/redesign.md, "Output" of hist.mjs).
  const track = trackFor('Ausländeranteil', '2016-02-28');
  const bars = histogramOf(track);
  expect(bars).toHaveLength(BINS);
  expect(bars[0]).toBe(10);
  expect(bars[8]).toBe(140);
  expect(Math.max(...bars)).toBe(140);
  expect(bars.reduce((sum, bar) => sum + bar, 0)).toBe(
    track.values.filter((value) => value !== null).length,
  );
});

test('the step of a value: the lowest step whose value is not below it', () => {
  // Zürich, 32.03%: step 524 is below it, step 525, 32.08%, is not (spec limits, "The foreigners
  // of 2015"). Köniz, 18.02% and 40,214 inhabitants: steps 295 and 758 ("Köniz on two tracks").
  const foreigners = trackFor('Ausländeranteil', '2016-02-28');
  const zurich = valueOf(foreigners, 261);
  expect(at(foreigners, 525)).toBe('32.08%');
  expect(valueAt(foreigners, 524)).toBeLessThan(zurich);
  expect(stepOf(foreigners, zurich)).toBe(525);
  expect(stepOf(foreigners, valueOf(foreigners, 355))).toBe(295);
  const inhabitants = trackFor('Einwohner', '2016-02-28');
  expect(stepOf(inhabitants, valueOf(inhabitants, 355))).toBe(758);
  // The ends of a track: its smallest value at step 0, its largest at the last step.
  expect(stepOf(foreigners, foreigners.smallest)).toBe(0);
  expect(stepOf(inhabitants, inhabitants.largest)).toBe(STEPS);
});

test('the histogram of a logarithmic track: the inhabitants of 2016-02-28', () => {
  // Spec limits, "A logarithmic track": the 21st bar, of steps 400 to 419, with 146.
  const bars = histogramOf(trackFor('Einwohner', '2016-02-28'));
  expect(bars[20]).toBe(146);
  expect(Math.max(...bars)).toBe(146);
  // The last bar holds step 1,000 too: Zürich, the largest.
  expect(bars[BINS - 1]).toBeGreaterThanOrEqual(1);
});

test('the histogram counts no municipality without a figure: the SVP of 2021-03-07', () => {
  // Spec limits, "Municipalities without a figure": six have no party figure in the election
  // of 2019 (investigations/limits.md, 5).
  const bars = histogramOf(trackFor('SVP', '2021-03-07'));
  expect(bars.reduce((sum, bar) => sum + bar, 0)).toBe(2104);
});

test("a label's three parts: its name, its date in brackets and its bounds, in each language", () => {
  // Design of redesign-site, decision 20: the section writes the parts apart, and together, with
  // a colon after the date, they are the label.
  const definition = definitionNamed('Ausländeranteil');
  const track = trackOf(definition, file, applyingTo(file, '2016-02-28'));
  expect(labelPartsOf(track, 0, 327, de)).toEqual({
    name: 'Ausländeranteil',
    date: '(Ende 2015)',
    bounds: 'von 0.00% bis 19.98%',
  });
  for (const t of [de, textsOf('fr'), textsOf('it')]) {
    const { name, date, bounds } = labelPartsOf(track, 0, 327, t);
    expect(`${name} ${date}: ${bounds}`).toBe(labelOf(track, 0, 327, t));
  }
  expect(labelPartsOf(track, 0, 327, textsOf('fr')).bounds).toBe('de 0.00% à 19.98%');
  expect(labelPartsOf(track, 0, 327, textsOf('it')).bounds).toBe('da 0.00% a 19.98%');
});
