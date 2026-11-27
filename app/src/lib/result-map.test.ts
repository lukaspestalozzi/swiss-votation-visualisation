// The map's logic (spec result-map). The municipal figures are those of
// investigations/map-data.md, "Municipal figures".
import { expect, test } from 'vitest';
import { colourOf, colouringOf, detailsOf, legendOf, voteEntriesOf } from './result-map.ts';
import { textsOf } from './texts/index.ts';
import type { VoteFile } from './vote-data.ts';

const de = textsOf('de');

test('named municipalities of 2016-02-28: the side and the class', () => {
  expect(colouringOf(432, 550)).toEqual({ side: 'no', step: 1 }); // Aeugst am Albis, 56.0% no
  expect(colouringOf(46565, 99614)).toEqual({ side: 'no', step: 2 }); // Zürich, 68.1% no
  expect(colouringOf(15928, 41756)).toEqual({ side: 'no', step: 3 }); // Bern, 72.4% no
  expect(colouringOf(95, 25)).toEqual({ side: 'yes', step: 3 }); // Wachseldorn, 79.2% yes
});

test('a share on the boundary of a class is in the higher class', () => {
  expect(colouringOf(272, 408)).toEqual({ side: 'no', step: 2 }); // Flurlingen, exactly 60% no
  expect(colouringOf(324, 216)).toEqual({ side: 'yes', step: 2 }); // Bettingen, exactly 60% yes
  expect(colouringOf(200, 50)).toEqual({ side: 'yes', step: 4 }); // Romainmôtier-Envy, 80% yes
});

test('the clearest classes, of 2024-03-03', () => {
  expect(colouringOf(61, 3)).toEqual({ side: 'yes', step: 4 }); // Les Enfers, 95.3% yes
  expect(colouringOf(39, 161)).toEqual({ side: 'no', step: 4 }); // Isenthal, 80.5% no
});

test('as many yes as no votes, also none of either, is a tie', () => {
  expect(colouringOf(2111, 2111)).toBe('tie'); // Hünenberg on 2016-02-28
  expect(colouringOf(0, 0)).toBe('tie');
});

test('the colours of the classes, from class 1 to class 4, and of a tie', () => {
  const steps = [1, 2, 3, 4] as const;
  expect(steps.map((step) => colourOf({ side: 'no', step }))).toEqual([
    '#fbbea3',
    '#e5946f',
    '#c2673b',
    '#934319',
  ]);
  expect(steps.map((step) => colourOf({ side: 'yes', step }))).toEqual([
    '#92dfd0',
    '#4bc1ad',
    '#009c86',
    '#007260',
  ]);
  expect(colourOf('tie')).toBe('#f0efec');
  // Zürich, Bern and Wachseldorn on 2016-02-28.
  expect(colourOf(colouringOf(46565, 99614))).toBe('#e5946f');
  expect(colourOf(colouringOf(15928, 41756))).toBe('#c2673b');
  expect(colourOf(colouringOf(95, 25))).toBe('#009c86');
});

test('the legend: a scale of the eight classes, the yes shares at their borders, two entries', () => {
  // Spec result-map, "The legend": from the clearest no to the clearest yes.
  expect(legendOf(de)).toEqual({
    classes: [
      { label: 'Nein: 80% und mehr', fill: '#934319' },
      { label: 'Nein: 70–80%', fill: '#c2673b' },
      { label: 'Nein: 60–70%', fill: '#e5946f' },
      { label: 'Nein: 50–60%', fill: '#fbbea3' },
      { label: 'Ja: 50–60%', fill: '#92dfd0' },
      { label: 'Ja: 60–70%', fill: '#4bc1ad' },
      { label: 'Ja: 70–80%', fill: '#009c86' },
      { label: 'Ja: 80% und mehr', fill: '#007260' },
    ],
    shares: [20, 30, 40, 50, 60, 70, 80],
    entries: [
      { label: 'Gleich viele Ja wie Nein', fill: '#f0efec' },
      { label: 'Kein eigenes Ergebnis', fill: 'hatch' },
    ],
  });
});

test('the details of a municipality: its name with its canton, its share and its votes', () => {
  const details = detailsOf('Zürich', 'ZH', [46565, 99614], de);
  expect(details).toMatchObject({
    name: 'Zürich (ZH)',
    lines: ['Ja-Anteil: 31.85%', "Ja-Stimmen: 46'565", "Nein-Stimmen: 99'614"],
  });
  // What its bar draws: 46,565 yes of 146,179 valid votes.
  expect(details.yesPercent).toBeCloseTo(31.8548, 4);
});

test('the details draw no bar without a result, or without a valid vote', () => {
  expect(detailsOf('Meienried', 'BE', null, de).yesPercent).toBeNull();
  expect(detailsOf('Niemandsdorf', 'ZH', [0, 0], de).yesPercent).toBeNull();
});

test('a name that already ends with its canton keeps it once', () => {
  expect(detailsOf('Benken (ZH)', 'ZH', [210, 201], de).name).toBe('Benken (ZH)');
});

test('a municipality without a result says why it has no figures', () => {
  expect(detailsOf('Meienried', 'BE', null, de)).toEqual({
    name: 'Meienried (BE)',
    lines: ['Kein eigenes Ergebnis: Ihre Stimmen sind mit denen einer anderen Gemeinde gezählt.'],
    yesPercent: null,
  });
});

// A made-up vote: two municipalities with entries, Meienried without a result, and the Swiss
// abroad of ZH.
const FILE: VoteFile = {
  id: 5960,
  entries: {
    ZH: [
      [1, 1398, 999, 982, 432, 550],
      [2, 8000, 5000, 4900, 2000, 2900],
      [9010, 24121, 8699, 8535, 3596, 4939],
    ],
    BE: [],
  },
  withoutResult: [389],
};
const SWISS_ABROAD = [9010];

test('the entries of a vote per canton, when they fit the map', () => {
  // Per canton its municipalities and its Swiss abroad apart, as the selection takes them
  // (design of add-limits, decision 20).
  expect(voteEntriesOf(FILE, [1, 2, 389], SWISS_ABROAD)).toEqual({
    cantons: [
      {
        canton: 'ZH',
        municipalities: [
          [1, 432, 550],
          [2, 2000, 2900],
        ],
        abroad: [3596, 4939],
      },
      { canton: 'BE', municipalities: [], abroad: null },
    ],
    withoutResult: [389],
  });
});

test('a municipality of the map without figures is an error that names the vote', () => {
  expect(() => voteEntriesOf(FILE, [1, 2, 261, 389], SWISS_ABROAD)).toThrow(
    /vote 5960: the municipality 261 of the map has no entry/,
  );
});

test('an entry that is no municipality of the map is an error that names the vote', () => {
  const file: VoteFile = { ...FILE, entries: { ...FILE.entries, BE: [[7999, 10, 8, 8, 4, 4]] } };
  expect(() => voteEntriesOf(file, [1, 2, 389], SWISS_ABROAD)).toThrow(
    /vote 5960: the entry 7999 is no municipality of the map/,
  );
});

test("Zürich's details in Italian: the same figures under Italian names", () => {
  // Spec interface-languages, "The details of a municipality in Italian";
  // investigations/map-data.md.
  expect(detailsOf('Zürich', 'ZH', [46565, 99614], textsOf('it'))).toMatchObject({
    name: 'Zürich (ZH)',
    lines: ['Percentuale di sì: 31.85%', "Sì: 46'565", "No: 99'614"],
  });
});
