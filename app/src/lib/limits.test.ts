// The limits (spec limits), against characteristics.json and the figures of
// investigations/limits.md.
import { expect, test } from 'vitest';
import characteristicsFile from '../../static/data/characteristics.json';
import { DEFINITIONS, applyingTo, writeUnits, type Definition } from './characteristics.ts';
import { STEPS, labelOf, trackOf, valueAt, type Track } from './limits.ts';
import type { CharacteristicsFile } from './vote-data.ts';

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
