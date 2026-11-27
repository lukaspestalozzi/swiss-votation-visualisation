# Design

## Context

`update.py` asks STAT-TAB through `_Downloads.get(request, name)`, which writes each answer to
the gitignored `pipeline/downloads/<name>` and, with `--reuse-downloads`, reads it from there
instead. `cube(request, name, table)` wraps it for the json-stat2 tables. The queries, measured
on 2026-11-27 (`pipeline/downloads/`):

| Answers | Queries | Size | Final? |
|---|---|---|---|
| population by age, `population_ages_<year>_<first>.json` | 42 (14 years × 3) | 12.9 MB | all years but the newest |
| elections, `election_<year>.json` | 4 | 3.3 MB | all but the newest |
| census of 2000: languages, religion, education, dwellings (3), buildings | 7 | 1.8 MB | all |
| population totals, place of birth, jobs (2), cattle, farms, farmland, organic farmland | 9 | 2.8 MB | no: one query holds every year, the newest among them |

The first three rows are 53 of 61 queries and 18 MB, about 5.5 MB gzipped. On a slow day
(20 to 45 s an answer) they are 20 to 35 minutes of a run. Cloud sessions start with an empty
`pipeline/downloads/`, so a cache that is not in the repository would rarely be there.

## Goals / Non-Goals

**Goals:**

- A normal update asks STAT-TAB about 8 to 12 queries instead of 61, with the same data files.
- The cache is correct by construction: a changed query is never served from it, and a refresh
  rebuilds it from the sources.

**Non-Goals:**

- Those of the proposal.

## Decisions

### 1. The cache is committed, gzipped (Q)

`pipeline/stat-tab-cache/<name>.gz`, one file per answer under the name `pipeline/downloads/`
uses, written with `gzip.compress(content, compresslevel=9, mtime=0)`: without a time in its
header, the same answer gives the same bytes, so a run that changes nothing leaves the cache
unchanged in git.

Alternatives: local only, in `pipeline/downloads/` (empty in a fresh cloud session, so it rarely
helps here); taking past years' counts from `characteristics.json` (breaks whenever the list's
reference date moves, every year, and mixes processed data with sources).

### 2. Final figures only (Q)

An answer is final when it is of the census of 2000, of an election older than the newest the
table describes, or of a population year older than the newest in the population's totals. The
pipeline already knows both newest years before it asks for the per-year answers (the totals and
the elections' description come first), so the rule needs no new query. The newest year is
always asked: the BFS may still revise it.

Alternative: every answer once fetched (a revised newest year would be missed until a refresh).

### 3. The same query, or none

`pipeline/stat-tab-cache/index.json` maps each name to the query that asked it and the checksum
of the answer, written with sorted keys. An answer is taken from the cache only when its query
equals the one the pipeline sends now and its checksum matches; otherwise it is asked anew and
replaces the entry. A cache file without an entry, or an entry without its file, is an error
that names it, so a hand edit cannot slip through.

### 4. The refresh is a flag (Q)

`update --refresh` asks for every answer and rewrites the cache's files and index. Everything
else of the run is unchanged, its checks included, so a revised past year passes the same
checks as a new one. `pipeline/README.md` says when to run it: once a year with the new list of
municipalities, and when the BFS announces a revision. With `--reuse-downloads`, the downloads
directory still comes first, as today; `--refresh` and `--reuse-downloads` together are refused,
since they ask opposite things.

Alternative: a spot check of one cached year per run (a few queries more per run; Q chose the
flag alone).

### 5. The record marks cached answers

Each entry of `sources.json` that is a STAT-TAB answer gains `"cached": true` or `false`. Its
address, size, checksum and query are those of the answer as the BFS gave it, from the cache or
not, so the record keeps naming the source. Two normal runs give the same record; a refresh
changes only these flags.

### 6. Budget

No interaction of the app is touched. The pipeline's own cost: reading and decompressing 18 MB,
well under a second.

## Risks / Trade-offs

- **A revision the cache hides.** The BFS revises a past year and nobody refreshes. → The
  README's yearly refresh and the record's flag, which shows how old the cached answers are by
  their checksums staying put. How often the BFS revises a final year is not known here; the
  first refresh after this change shows whether any cached answer differs.
- **Repository size.** About 5.5 MB now and 1 MB a year. → Gzipped; the vote-day files, the
  largest source (125 MB), stay out.
- **The first run after the change** asks everything once, to fill the cache, like today.
