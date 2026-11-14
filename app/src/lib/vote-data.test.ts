// The data files the pipeline writes (app/static/data/), checked with the calculation the app
// runs: for every vote, the result calculated from its entries is the result in the list of
// votes. The figures named here are those of investigations/data-sources.md.
import { calculateResult, majoritiesNeeded, type Entry } from 'calculation';
import { expect, test } from 'vitest';
import municipalitiesFile from '../../static/data/municipalities.json';
import votesFile from '../../static/data/votes.json';
import type { Municipalities, Vote, VoteFile, Votes } from './vote-data.ts';

const listing = votesFile as Votes;
// A JSON import is typed from its content, with the [number, name] pairs as plain arrays.
const list = municipalitiesFile as unknown as Municipalities;
const files = import.meta.glob<VoteFile>('../../static/data/votes/*.json', {
  eager: true,
  import: 'default',
});
const fileOf = new Map(Object.values(files).map((file) => [file.id, file]));

function entriesOf(vote: Vote): Entry[] {
  const file = fileOf.get(vote.id);
  if (file === undefined) throw new Error(`vote ${String(vote.id)} has no file`);
  return Object.entries(file.entries).flatMap(([canton, rows]) =>
    rows.map(([, , , , yes, no]) => ({ canton, yes, no })),
  );
}

test('every vote of the list has its file, and no file is left over', () => {
  const ids = listing.votes.map((vote) => vote.id);
  expect(ids).toHaveLength(125);
  expect([...fileOf.keys()].sort((a, b) => a - b)).toEqual([...ids].sort((a, b) => a - b));
  for (const [path, file] of Object.entries(files)) {
    expect(path).toBe(`../../static/data/votes/${String(file.id)}.json`);
  }
});

test('the calculation gives the result of every vote it judges', () => {
  let judged = 0;
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
    judged += 1;
  }
  expect(judged).toBe(124);
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
  expect(tieBreaks.map((vote) => vote.id)).toEqual([6823]);
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
  expect(numbers).toHaveLength(2110);
  for (const file of fileOf.values()) {
    const entries = Object.values(file.entries).flatMap((rows) => rows.map(([n]) => n));
    const municipal = entries.filter((number) => numbers.includes(number));
    expect(
      [...municipal, ...file.withoutResult].sort((a, b) => a - b),
      `vote ${String(file.id)}`,
    ).toEqual([...numbers].sort((a, b) => a - b));
  }
  expect(fileOf.get(5960)?.withoutResult).toEqual([389, 408, 422, 535, 629, 868, 877]);
});
