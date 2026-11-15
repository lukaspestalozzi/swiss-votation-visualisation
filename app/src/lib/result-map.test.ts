// The map's logic (spec result-map). The municipal figures are those of
// investigations/map-data.md, "Municipal figures".
import { expect, test } from 'vitest';
import { LEGEND, colourOf, colouringOf, detailsOf } from './result-map.ts';

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

test('the legend: the ten entries in order, each with its colour or the hatching', () => {
  expect(LEGEND).toEqual([
    { label: 'Nein: 80% und mehr', fill: '#934319' },
    { label: 'Nein: 70–80%', fill: '#c2673b' },
    { label: 'Nein: 60–70%', fill: '#e5946f' },
    { label: 'Nein: 50–60%', fill: '#fbbea3' },
    { label: 'Ja: 50–60%', fill: '#92dfd0' },
    { label: 'Ja: 60–70%', fill: '#4bc1ad' },
    { label: 'Ja: 70–80%', fill: '#009c86' },
    { label: 'Ja: 80% und mehr', fill: '#007260' },
    { label: 'Gleich viele Ja wie Nein', fill: '#f0efec' },
    { label: 'Kein eigenes Ergebnis', fill: 'hatch' },
  ]);
});

test('the details of a municipality: its name with its canton, its share and its votes', () => {
  expect(detailsOf('Zürich', 'ZH', [46565, 99614])).toEqual({
    name: 'Zürich (ZH)',
    lines: ['Ja-Anteil: 31.85%', "Ja-Stimmen: 46'565", "Nein-Stimmen: 99'614"],
  });
});

test('a name that already ends with its canton keeps it once', () => {
  expect(detailsOf('Benken (ZH)', 'ZH', [210, 201]).name).toBe('Benken (ZH)');
});

test('a municipality without a result says why it has no figures', () => {
  expect(detailsOf('Meienried', 'BE', null)).toEqual({
    name: 'Meienried (BE)',
    lines: ['Kein eigenes Ergebnis: seine Stimmen sind mit denen einer anderen Gemeinde gezählt.'],
  });
});
