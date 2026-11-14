# Proposal

## Why

The calculation exists and is tested, but the app has no data: no list of votes, no result per
municipality, no official result to compare with. This change builds the pipeline's first data,
with the checks the predecessor lacked: its merged municipalities were counted more than once,
its sources disagreed on types and on mergers, and one missing value surfaced far down the
pipeline (failure modes 3, 6 and 7 in `docs/roadmap.md`).

It implements entry #3 of `docs/roadmap.md`, `add-vote-data`. The data-sources investigation
(`investigations/data-sources.md`) named the sources and left nine points open; the ones that
belong to this change are decided here (`design.md`).

## What Changes

- The pipeline gets its first code: one command that downloads the public sources, checks them
  and writes the data files of the app. It is written in Python with polars.
- The data files are committed with the app: the list of all national votes since 2013 (date,
  titles in German, French and Italian, kind, result), one file per vote with its entries (per
  municipality the registered voters, the ballots cast, the valid ballots, the yes and the no
  votes), the list of municipalities with its reference date, and a record of the source files
  the data was made from.
- The official result of a vote is the one the Federal Council validated, as the Federal
  Chancellery publishes it. A vote that is not validated yet is in the data with the result of
  the Federal Statistical Office (BFS), marked as provisional.
- The entries of every validated vote sum to the official yes and no votes. The one known
  exception, the vote of 2024-03-03 on a 13th AHV pension (200 no votes), is written down in a
  list of known differences; any other difference stops the pipeline, and so does a listed
  difference that no longer exists.
- All votes use one list of municipalities: the one the BFS files state, today that of
  2026-01-01. The roadmap asked for the list valid at each vote; no source offers it.
- The Swiss abroad of the cantons that count them apart are entries of their own, marked as
  such. A municipality that shares a ballot box with a neighbour is on the list, and each vote
  names the municipalities that have no result in it.
- The input is checked where it enters the pipeline: a count that is not a whole number from
  zero, a missing value, an unknown municipality, a municipality that appears twice and an
  unknown kind of vote each stop the run with a message that names the place.
- A test runs the calculation over the committed data files: for every vote, the votes, the
  cantonal votes and the verdict equal the result in the list of votes.
- The checks grow by the pipeline's own: formatting, lint, static analysis and unit tests, as
  four more steps of `scripts/verify-local.sh` and as a third, independent job in CI.
- The procedure that adds a new vote day is one documented command, run by hand; the change it
  makes goes through a pull request.
- The project context records what is decided here: the meaning of hard constraint 1, the one
  list of municipalities, and the language of the pipeline.

Nothing visible changes: the start page still shows the cantons. The data files are part of the
built site, but no page loads them yet.

## Non-goals

- No screen and no loading of the data in the app (#4). This change defines the files and
  proves them; it does not decide how the app reads them.
- No map data (#6) and no characteristics (#7).
- No results on the list of municipalities of the day of the vote, and no search for a source
  that has them (user decision; see `design.md`).
- No decision on what a limit does with the Swiss abroad or with a municipality without a
  result (#8), and no record of where the votes of such a municipality are counted.
- No schedule: nothing runs the pipeline unattended (user decision). A schedule can be a later
  change.
- No second implementation of the voting rules in the pipeline. Its checks add up and compare;
  cantonal votes and verdicts are calculated only by the calculation module.
- No comparison of the registered voters and the ballots cast with the Federal Chancellery.
  They are the BFS's figures, the only ones per municipality (user decision).
- No flag for the annulled vote of 2016-02-28: the data carries the Chancellery's note on it,
  and #4 decides what the app does with it.
- No titles in Romansh or English, and no use of the BFS table (STAT-TAB) or of Swissvotes as a
  source of the pipeline.
- No changes to the calculation module.

## Capabilities

### New Capabilities

- `vote-data`: the data files on the national votes that the pipeline produces for the app:
  which votes they cover, what they hold for each vote and each entry, where each figure comes
  from, the checks on the input, the agreement with the official result, and how a new vote
  day is added.
- `municipalities`: the list of municipalities that all data files use: its source and
  reference date, what belongs to it, and how entries that are no municipality and
  municipalities without a result are told apart.

### Modified Capabilities

- `build-checks`: the requirement "One set of checks, locally and in CI" also covers the
  pipeline's four checks and the third CI job; "CI checks every change to main" names three
  jobs; "The local checks use the versions CI uses" also covers the tool that runs the
  pipeline.

## Impact

- **New code:** `pipeline/` becomes a Python project (the command, the readers of the three
  sources, the checks, the writer of the data files, the list of known differences, their
  tests). In `app/`, the types of the data files and the test that runs the calculation over
  them.
- **New data:** `app/static/data/`, about 7.3 MB in about 128 files, committed.
- **Dependencies added:** for the pipeline, Python 3.13, uv, polars, and for its checks ruff,
  mypy and pytest. For the app, Vitest (already used by the calculation).
- **Changed files:** `.github/workflows/ci.yml` (the job `pipeline`),
  `scripts/verify-local.sh` (four steps, the version check),
  `.claude/hooks/session-start.sh` (the pipeline's dependencies), `.gitignore`,
  `.prettierignore`, `app/package.json`, `app/vite.config.ts`, `pnpm-lock.yaml`,
  `pipeline/README.md`, `openspec/config.yaml`, `docs/roadmap.md`, `CLAUDE.md`, `README.md`.
- **New in the investigation:** how the Chancellery's rows are matched to the BFS's votes, and
  that the two differ in the registered voters; with the script and its output.
- **App:** the built site grows by the data files. No page requests them yet.
- **Outside systems:** a run of the pipeline downloads about 125 MB from three public servers
  (BFS vote-day files, the Federal Chancellery's linked data, the BFS register of
  municipalities). CI and the build download nothing.
- **Later changes:** #4 loads the list of votes and the vote files; #6 draws one map for all
  votes, on the same list of municipalities; #7 brings the characteristics onto that list; #8
  decides what a limit does with the Swiss abroad and with municipalities without a result.
