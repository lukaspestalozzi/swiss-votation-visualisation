// The selection in the address (spec share-link), against characteristics.json and the figures of
// investigations/limits.md and investigations/share-link.md, on the vote day of 2016-02-28.
import { expect, test } from 'vitest';
import characteristicsFile from '../../static/data/characteristics.json';
import { DEFINITIONS, applyingTo, type Definition } from './characteristics.ts';
import { STEPS, trackOf, valueAt, type LimitSetting } from './limits.ts';
import { linkOf, selectionOf } from './share-link.ts';
import type { CharacteristicKey } from './texts/index.ts';
import type { CharacteristicsFile } from './vote-data.ts';

const file = characteristicsFile as unknown as CharacteristicsFile;
const DAY = '2016-02-28';

/** The track of a characteristic on the vote day. */
const trackFor = (definition: Definition) => trackOf(definition, file, applyingTo(file, DAY));

/** A limit of the characteristic `key` on the vote day, with its bounds at two steps. */
function limit(key: CharacteristicKey, lower = 0, upper = STEPS): LimitSetting {
  const definition = DEFINITIONS.find((candidate) => candidate.key === key);
  if (definition === undefined) throw new Error(`there is no characteristic ${key}`);
  return { track: trackFor(definition), lower, upper };
}

test('no limit and the switch on: no link', () => {
  expect(linkOf([], true)).toBe('');
});

test('an upper bound: "Ausländeranteil" up to step 327, 19.98%', () => {
  expect(linkOf([limit('foreigners', 0, 327)], true)).toBe('foreigners=-19.98');
});

test('two limits and the switch off: "Einwohner" from step 500, 3\'508', () => {
  expect(linkOf([limit('foreigners', 0, 327), limit('inhabitants', 500)], false)).toBe(
    'foreigners=-19.98&inhabitants=3508-&abroad=no',
  );
});

test("a bound whose value is its track's end is written empty", () => {
  // Step 1 of "Einwohner" is 31, as step 0 is (investigations/limits.md, 4).
  expect(linkOf([limit('inhabitants')], true)).toBe('inhabitants=-');
  expect(linkOf([limit('inhabitants', 1)], true)).toBe('inhabitants=-');
});

test('the switch off alone', () => {
  expect(linkOf([], false)).toBe('abroad=no');
});

test('the 21 keys, the same in every language, in the order of the panel', () => {
  expect(
    linkOf(
      DEFINITIONS.map((definition) => limit(definition.key)),
      true,
    ),
  ).toBe(
    [
      'inhabitants',
      'foreigners',
      'age-0-17',
      'age-18-34',
      'age-35-49',
      'age-50-64',
      'age-65',
      'density',
      'fdp',
      'centre',
      'sp',
      'svp',
      'glp',
      'greens',
      'other-parties',
      'german',
      'french',
      'italian',
      'romansh',
      'area',
      'cattle',
    ]
      .map((key) => `${key}=-`)
      .join('&'),
  );
});

/** A link read on the vote day, as the steps of its limits, its switch and its unusable parts. */
function read(link: string) {
  const { limits, abroadCounted, unusable } = selectionOf(link, trackFor);
  return {
    limits: limits.map(({ track, lower, upper }) => [track.definition.key, lower, upper]),
    abroadCounted,
    unusable,
  };
}

test('reading a link: "Ausländeranteil" up to 19.98%, step 327', () => {
  expect(read('foreigners=-19.98')).toEqual({
    limits: [['foreigners', 0, 327]],
    abroadCounted: true,
    unusable: [],
  });
});

test('a value no step has takes the nearest step', () => {
  // 20.00% lies 0.02 from step 327's 19.98% and 0.04 from step 328's 20.04%; 3,000 inhabitants
  // lie nearest step 483's 2,987 (investigations/share-link.md, 5).
  expect(read('foreigners=-20&inhabitants=3000-').limits).toEqual([
    ['foreigners', 0, 327],
    ['inhabitants', 483, STEPS],
  ]);
});

test('a value halfway between two steps takes the lower', () => {
  // 20.01% lies 0.03 from step 327's 19.98% and from step 328's 20.04%.
  expect(read('foreigners=-20.01').limits).toEqual([['foreigners', 0, 327]]);
});

test('an empty link: no limit and the switch on', () => {
  expect(read('')).toEqual({ limits: [], abroadCounted: true, unusable: [] });
});

test('reading the switch off alone', () => {
  expect(read('abroad=no')).toEqual({ limits: [], abroadCounted: false, unusable: [] });
});

test("the unusable parts of the spec's scenarios", () => {
  expect(read('rainfall=1-2&foreigners=-19.98')).toEqual({
    limits: [['foreigners', 0, 327]],
    abroadCounted: true,
    unusable: ['rainfall=1-2'],
  });
  expect(read("foreigners=30-20&inhabitants=1'000-&abroad=yes")).toEqual({
    limits: [],
    abroadCounted: true,
    unusable: ['foreigners=30-20', "inhabitants=1'000-", 'abroad=yes'],
  });
  expect(read('foreigners=-19.98&foreigners=10-')).toEqual({
    limits: [['foreigners', 0, 327]],
    abroadCounted: true,
    unusable: ['foreigners=10-'],
  });
});

test('a part without a single "-" between two bounds, or with more decimals than its label', () => {
  for (const part of ['foreigners=1-2-3', 'foreigners=19.987-', 'foreigners=']) {
    expect(read(part)).toEqual({ limits: [], abroadCounted: true, unusable: [part] });
  }
  // A key alone is a key with an empty value.
  expect(read('foreigners').unusable).toEqual(['foreigners=']);
});

test('a link a messenger encoded reads as the link', () => {
  expect(read('foreigners=%2D19.98')).toEqual(read('foreigners=-19.98'));
  expect(read('rainfall=%2D1').unusable).toEqual(['rainfall=-1']);
});

test('every step of every characteristic comes back to a step of the same value', () => {
  // investigations/share-link.md, 5.
  for (const definition of DEFINITIONS) {
    const { track } = limit(definition.key);
    const misses: number[] = [];
    for (let step = 0; step <= STEPS; step += 1) {
      const link = linkOf([{ track, lower: 0, upper: step }], true);
      const [back] = selectionOf(link, () => track).limits;
      if (valueAt(track, back.upper) !== valueAt(track, step)) misses.push(step);
    }
    expect({ key: definition.key, misses }).toEqual({ key: definition.key, misses: [] });
  }
});
