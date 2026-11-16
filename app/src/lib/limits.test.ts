// The limits (spec limits), against characteristics.json and the figures of
// investigations/limits.md.
import { calculateResult, entriesThatRemain, majoritiesNeeded, type Result } from 'calculation';
import { expect, test } from 'vitest';
import characteristicsFile from '../../static/data/characteristics.json';
import mapData from '../../static/data/map.json';
import municipalitiesFile from '../../static/data/municipalities.json';
import votesFile from '../../static/data/votes.json';
import { DEFINITIONS, applyingTo, writeUnits, type Definition } from './characteristics.ts';
import { STEPS, labelOf, remainingUnder, trackOf, valueAt, type Track } from './limits.ts';
import { voteEntriesOf } from './result-map.ts';
import type { CharacteristicsFile, MapFile, Municipalities, VoteFile, Votes } from './vote-data.ts';

const file = characteristicsFile as unknown as CharacteristicsFile;

function definitionNamed(name: string): Definition {
  const definition = DEFINITIONS.find((candidate) => candidate.name === name);
  if (definition === undefined) throw new Error(`there is no characteristic ${name}`);
  return definition;
}

/** The track of a characteristic for the vote of a day. */
function trackFor(name: string, voteDate: string): Track {
  return trackOf(definitionNamed(name), file, applyingTo(file, voteDate));
}

/** The value of a step, as the panel writes it. */
function at(track: Track, step: number): string {
  return writeUnits(track.definition, valueAt(track, step));
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
    labelOf(trackFor(name, voteDate), lower, upper);
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
