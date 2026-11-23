// The data files the pipeline writes (app/static/data/), checked with the calculation the app
// runs: for every vote, the result calculated from its entries is the result in the list of
// votes. The figures named here are those of investigations/data-sources.md.
import { calculateResult, majoritiesNeeded, type Entry } from 'calculation';
import { expect, test } from 'vitest';
import characteristicsFile from '../../static/data/characteristics.json';
import mapData from '../../static/data/map.json';
import municipalitiesFile from '../../static/data/municipalities.json';
import votesFile from '../../static/data/votes.json';
import { voteEntriesOf } from './result-map.ts';
import type {
  CharacteristicsFile,
  MapFile,
  Municipalities,
  Vote,
  VoteFile,
  Votes,
} from './vote-data.ts';

const listing = votesFile as Votes;
// A JSON import is typed from its content, with the [number, name] pairs as plain arrays.
const list = municipalitiesFile as unknown as Municipalities;
const map = mapData as unknown as MapFile;
const files = import.meta.glob<VoteFile>('../../static/data/votes/*.json', {
  eager: true,
  import: 'default',
});
const fileOf = new Map(Object.values(files).map((file) => [file.id, file]));
// The first data, written on 2026-11-14: its votes end with this vote day, and its list of
// municipalities is the one of this date. A later update adds votes and moves to a later list.
const FIRST_DATA_UNTIL = '2026-09-27';
const FIRST_LIST = '2026-01-01';

function entriesOf(vote: Vote): Entry[] {
  const file = fileOf.get(vote.id);
  if (file === undefined) throw new Error(`vote ${String(vote.id)} has no file`);
  return Object.entries(file.entries).flatMap(([canton, rows]) =>
    rows.map(([, , , , yes, no]) => ({ canton, yes, no })),
  );
}

test('every vote of the list has its file, and no file is left over', () => {
  const ids = listing.votes.map((vote) => vote.id);
  expect(listing.votes.filter((vote) => vote.date <= FIRST_DATA_UNTIL)).toHaveLength(125);
  expect([...fileOf.keys()].sort((a, b) => a - b)).toEqual([...ids].sort((a, b) => a - b));
  for (const [path, file] of Object.entries(files)) {
    expect(path).toBe(`../../static/data/votes/${String(file.id)}.json`);
  }
});

test('the calculation gives the result of every vote it judges', () => {
  let judgedOfTheFirstData = 0;
  for (const vote of listing.votes) {
    const majorities = majoritiesNeeded(vote.kind);
    if (majorities === 'not-calculated') continue;
    const result = calculateResult(entriesOf(vote), majorities);
    const name = `vote ${String(vote.id)} of ${vote.date}`;
    expect(result.yes, name).toBe(vote.sums.yes);
    expect(result.no, name).toBe(vote.sums.no);
    if (vote.result.cantonalVotesInFavour !== null) {
      expect(result.cantonalVotesInFavour, name).toBe(vote.result.cantonalVotesInFavour);
      expect(result.cantonalVotesAgainst, name).toBe(vote.result.cantonalVotesAgainst);
    }
    expect(result.passed, name).toBe(vote.result.passed);
    if (vote.date <= FIRST_DATA_UNTIL) judgedOfTheFirstData += 1;
  }
  expect(judgedOfTheFirstData).toBe(124);
});

test('a validated vote has cantonal votes exactly when its kind needs both majorities', () => {
  for (const vote of listing.votes.filter((vote) => vote.validated)) {
    const majorities = majoritiesNeeded(vote.kind);
    if (majorities === 'not-calculated') continue;
    const name = `vote ${String(vote.id)}, ${vote.kind}`;
    expect(vote.result.cantonalVotesInFavour !== null, name).toBe(
      majorities === 'voters-and-cantons',
    );
    expect(vote.result.cantonalVotesAgainst !== null, name).toBe(
      majorities === 'voters-and-cantons',
    );
  }
});

test('a tie-break question is not calculated, and its entries give its yes and no votes', () => {
  const tieBreaks = listing.votes.filter((vote) => vote.kind === 'tie-break-question');
  expect(tieBreaks.map((vote) => vote.id)).toContain(6823);
  for (const vote of tieBreaks) {
    expect(majoritiesNeeded(vote.kind)).toBe('not-calculated');
    const entries = entriesOf(vote);
    expect(entries.reduce((sum, entry) => sum + entry.yes, 0)).toBe(vote.sums.yes);
    expect(entries.reduce((sum, entry) => sum + entry.no, 0)).toBe(vote.sums.no);
    expect(vote.result.passed).toBeNull();
  }
});

function voteWithId(id: number): Vote {
  const vote = listing.votes.find((candidate) => candidate.id === id);
  if (vote === undefined) throw new Error(`no vote ${String(id)} in the list`);
  return vote;
}

function calculated(id: number) {
  const vote = voteWithId(id);
  const majorities = majoritiesNeeded(vote.kind);
  if (majorities === 'not-calculated') throw new Error(`vote ${String(id)} is not calculated`);
  return calculateResult(entriesOf(vote), majorities);
}

test('2016-02-28, number 596: the cantons in favour, the voters against', () => {
  const result = calculated(5960);
  expect([result.yes, result.no]).toEqual([1_609_152, 1_664_224]);
  expect([result.cantonalVotesInFavour, result.cantonalVotesAgainst]).toEqual([16.5, 6.5]);
  expect(result.passed).toBe(false);
});

test('2013-03-03, number 567: the voters in favour, the cantons against', () => {
  const result = calculated(5670);
  expect([result.yes, result.no]).toEqual([1_283_951, 1_078_531]);
  expect([result.cantonalVotesInFavour, result.cantonalVotesAgainst]).toEqual([10, 13]);
  expect(result.passed).toBe(false);
});

test('2025-09-28, number 679: an optional referendum, only the voters count', () => {
  const result = calculated(6790);
  expect([result.yes, result.no]).toEqual([1_384_586, 1_363_362]);
  expect(result.passed).toBe(true);
});

test('2024-03-03, number 665: the entries give 200 no votes more than the official result', () => {
  const result = calculated(6650);
  expect([result.yes, result.no]).toEqual([1_884_096, 1_350_525]);
  expect([result.cantonalVotesInFavour, result.cantonalVotesAgainst]).toEqual([15, 8]);
  expect(result.passed).toBe(true);
  expect(voteWithId(6650).result.no).toBe(1_350_325);
});

test('Moutier counts for Bern until 2025 and for Jura since 2026', () => {
  const cantonsOf = (id: number) =>
    Object.entries(fileOf.get(id)?.entries ?? {})
      .filter(([, rows]) => rows.some(([number]) => number === 6831))
      .map(([canton]) => canton);
  expect(cantonsOf(5670)).toEqual(['BE']);
  expect(cantonsOf(6850)).toEqual(['JU']);
});

test('every municipality of the list is one entry or without a result, in every vote', () => {
  const numbers = Object.values(list.municipalities).flatMap((rows) => rows.map(([n]) => n));
  for (const file of fileOf.values()) {
    const entries = Object.values(file.entries).flatMap((rows) => rows.map(([n]) => n));
    const municipal = entries.filter((number) => numbers.includes(number));
    expect(
      [...municipal, ...file.withoutResult].sort((a, b) => a - b),
      `vote ${String(file.id)}`,
    ).toEqual([...numbers].sort((a, b) => a - b));
  }
  if (list.referenceDate === FIRST_LIST) {
    expect(numbers).toHaveLength(2110);
    expect(fileOf.get(5960)?.withoutResult).toEqual([389, 408, 422, 535, 629, 868, 877]);
  }
});

test("the map's municipalities are those of the list", () => {
  const listed = Object.values(list.municipalities).flatMap((rows) => rows.map(([n]) => n));
  expect(map.referenceDate).toBe(list.referenceDate);
  expect(map.municipalities.map(([number]) => number)).toEqual([...listed].sort((a, b) => a - b));
});

const onTheMap = map.municipalities.map(([number]) => number);
const swissAbroad = Object.values(list.swissAbroad);

test("every judged vote's figures fit the map", () => {
  const judged = listing.votes.filter((vote) => vote.kind !== 'tie-break-question');
  expect(judged.length).toBeGreaterThanOrEqual(124);
  for (const vote of judged) {
    const file = fileOf.get(vote.id);
    if (file === undefined) throw new Error(`vote ${String(vote.id)} has no file`);
    expect(() => voteEntriesOf(file, onTheMap, swissAbroad)).not.toThrow();
  }
});

test('the entries of Swiss abroad: 12 in 2016, 11 in 2013', () => {
  const abroadIn = (id: number): number => {
    const file = fileOf.get(id);
    if (file === undefined) throw new Error(`vote ${String(id)} has no file`);
    return voteEntriesOf(file, onTheMap, swissAbroad).cantons.filter((c) => c.abroad !== null)
      .length;
  };
  expect(abroadIn(5960)).toBe(12);
  expect(abroadIn(5670)).toBe(11);
});

test('the page of 2016-02-28 holds 12 Swiss abroad and 2,103 municipalities with a result', () => {
  const file = fileOf.get(5960);
  if (file === undefined) throw new Error('vote 5960 has no file');
  const { cantons, withoutResult } = voteEntriesOf(file, onTheMap, swissAbroad);
  expect(cantons.filter((canton) => canton.abroad !== null)).toHaveLength(12);
  expect(cantons.flatMap((canton) => canton.municipalities)).toHaveLength(2103);
  expect(withoutResult).toHaveLength(7);
  expect(cantons.map((canton) => canton.canton)).toHaveLength(26);
});

test('the characteristics are those of the municipalities of the list', () => {
  const characteristics = characteristicsFile as unknown as CharacteristicsFile;
  const listed = Object.values(list.municipalities).flatMap((rows) => rows.map(([n]) => n));
  expect(characteristics.referenceDate).toBe(list.referenceDate);
  expect(characteristics.municipalities).toEqual([...listed].sort((a, b) => a - b));
  const sized = [
    ...characteristics.population.counts,
    ...characteristics.cattle.counts,
    ...characteristics.elections.map((election) => election.votes),
    characteristics.languages2000,
    characteristics.area,
  ];
  for (const counts of sized) expect(counts).toHaveLength(listed.length);
});

test('the characteristics hold every year from the one before the first vote day', () => {
  const characteristics = characteristicsFile as unknown as CharacteristicsFile;
  // The first vote day is 2013-03-03: the population and the cattle from the end of 2012, the
  // elections from the last before it, 2011-10-23; a later update only adds years.
  for (const years of [characteristics.population.years, characteristics.cattle.years]) {
    expect(years[0]).toBe(2012);
    expect(years).toEqual(years.map((_, i) => 2012 + i));
  }
  const elections = characteristics.elections.map((election) => election.year);
  expect(elections.slice(0, 4)).toEqual([2011, 2015, 2019, 2023]);
  expect(characteristics.elections[0]?.day).toBe('2011-10-23');
});

test('the counts of the new tables: a row per municipality, and each yearly set its years', () => {
  // Spec characteristics, "The data file of the characteristics"; design of
  // add-more-characteristics, decision 10.
  const characteristics = characteristicsFile as unknown as CharacteristicsFile;
  const listed = characteristics.municipalities.length;
  const sized = [
    ...characteristics.bornAbroad.counts,
    ...characteristics.jobs.counts,
    ...characteristics.farms.counts,
    characteristics.religion2000,
    characteristics.education2000,
    characteristics.dwellings2000,
    characteristics.buildings2000,
  ];
  for (const counts of sized) expect(counts).toHaveLength(listed);
  // From the year before the first vote day, 2013-03-03, without a gap: those born abroad to
  // the population's newest year, the farms as the cattle, the jobs to 2024 or later.
  const { bornAbroad, jobs, farms, population, cattle } = characteristics;
  expect(bornAbroad.years).toEqual(population.years);
  expect(farms.years).toEqual(cattle.years);
  expect(jobs.years.slice(0, 13)).toEqual(Array.from({ length: 13 }, (_, i) => 2012 + i));
  expect(jobs.years).toEqual(jobs.years.map((_, i) => 2012 + i));
  // Each row has its counts: four of the jobs, each a number or none; three of the farms.
  for (const row of jobs.counts.flat()) {
    expect(row).toHaveLength(4);
  }
  for (const row of farms.counts.flat()) expect(row).toHaveLength(3);
  expect(characteristics.religion2000[0]).toHaveLength(4);
  expect(characteristics.education2000[0]).toHaveLength(3);
  expect(characteristics.dwellings2000[0]).toHaveLength(2);
  expect(characteristics.buildings2000[0]).toHaveLength(2);
});
