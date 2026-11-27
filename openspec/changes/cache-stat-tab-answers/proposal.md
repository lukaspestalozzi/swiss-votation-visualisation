# Proposal

## Why

An update takes a quarter of an hour to 40 minutes, almost all of it waiting for STAT-TAB, the
BFS statistics API, which on slow days answers one query in 20 to 45 seconds (two runs on
2026-11-27 took about 40 minutes each). Most of those queries ask for figures that can no longer
change: the census of 2000, past National Council elections, and the population of past years.
Q asked on 2026-11-27 for those answers to be kept, so that a normal update asks STAT-TAB only
for what can still change.

## What Changes

- The pipeline keeps the STAT-TAB answers of final figures in the repository, gzipped, in
  `pipeline/stat-tab-cache/`: the census of 2000, every National Council election but the
  newest, and the population by age of every year but the newest the BFS gives. A normal update
  takes these answers from there and asks STAT-TAB only for the others.
- An answer is taken from the cache only for the same query; a changed query is asked anew and
  the cache takes its answer.
- `update --refresh` asks STAT-TAB for every answer again and writes the cache anew. The README
  says to run it once a year, with the new list of municipalities, or when the BFS revises past
  figures.
- The record of the sources (`sources.json`) says of each STAT-TAB answer whether it came from
  the cache. Two normal runs with unchanged sources still leave every data file unchanged.
- The data the app loads does not change: the same answers give the same data files.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `characteristics`: two new requirements: the STAT-TAB answers of final figures kept in the
  repository, which the record of the sources marks, and the refresh. `vote-data`'s record of
  the sources and its procedure hold as they are.

## Impact

- **Pipeline**: `download.py` or `update.py` (which answers are final, the cache's reading and
  writing), `__main__.py` (`--refresh`), `write.py` (the record's new field), their tests, and
  `pipeline/README.md`.
- **Repository**: `pipeline/stat-tab-cache/`, about 5.5 MB gzipped today and about 1 MB more per
  year; written by the pipeline only, reviewed like the data files.
- **Data**: `app/static/data/sources.json` gains the field; no other data file changes.
- **App**: none. `sources.json` is linked from the guide, not read by the app.
- **Project context**: hard constraint 4 of `openspec/config.yaml` (every data file can be
  regenerated from the public sources) holds through `--refresh`.
- No new dependency: Python's `gzip` module.

This change is off-roadmap: it makes the pipeline faster, which Q asked for after the slow runs
of `tidy-after-review`. It gets its own row in `docs/roadmap.md`.

## Non-goals

- No cache of the BFS vote-day files, the Chancellery's answer, the register or the map's
  sources: they are not the slow part, or they change.
- No cache of the STAT-TAB tables asked in one query for all years (the population's totals,
  place of birth, jobs, cattle and farms): one query each, and they hold the newest year.
- No automatic expiry or spot check of the cache; the refresh is run by hand.
- No change to what the app shows.
