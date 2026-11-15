# Design

## Context

`pipeline/` holds a README and no code. `calculation/` gives the result of a vote from its
entries and is tested against seven official votes (`calculation/src/reference-votes.json`,
test data only). `app/` shows the cantons and loads no data. See `proposal.md` for the
motivation.

`investigations/data-sources.md` names the sources and their facts. While drafting this change,
three more facts were found by running the planned checks over the downloads of the
investigation (2026-11-14); task group 1 adds them to the investigation with a script:

- **The Federal Chancellery's rows carry the BFS's id.** Each national row has `vote:id`
  (5960 for number 596; 6821, 6822 and 6823 for the three questions of number 682). All 125
  votes with a result in the BFS files have exactly one row. The investigation had matched by
  the number times ten, which does not tell the three questions apart.
- **The two sources differ in the registered voters.** Of the 117 validated votes, the
  Chancellery's national number of registered voters differs from the BFS's in 39 (by tens to a
  few thousand), and the ballots cast in 5. The yes and no votes agree in 116 (the known
  exception is number 665).
- **Moutier.** It moved from the canton of Bern to the canton of Jura on 2026-01-01 (BFS number
  700 until then, 6831 since). The BFS files list it under Jura for every vote, and their
  canton figures for the 115 votes before 2026 still count it for Bern: there the entries of
  Bern and of Jura do not sum to the canton's figures (4,764 registered voters on 2013-03-03).
  Counting it for either canton changes no cantonal vote and no verdict in any of the 115
  votes; counted for the other canton, the closest case is Bern on 2017-09-24, id 6150, then
  decided by 47 votes.

Three spikes were run, outside the repository:

- **Python tools.** `uv init`, polars 2.1.0, mypy 2.4.1, pytest 9.2.0, ruff 0.17.5 on Python
  3.13.18 install and run; `uv run --directory <project> --locked <tool>` works from another
  directory. uv, ruff, mypy and pytest are in the cloud image.
- **polars and wrong types.** Built from rows with a declared schema, a polars frame turns
  `1.5` into `1` and `"12"` into `12` without an error, also with `strict=True`. Built from
  columns with a declared schema it refuses both, but accepts a missing value as null and
  `True` as 1. So the declared schema alone does not check the input (decision 9).
- **The test in the app.** A Vitest test in `app/` that reads the data files with
  `import.meta.glob` and calls the calculation runs and passes `pnpm run check`; the build
  copies `app/static/data/` into the site. Vitest also picked up the Playwright file in
  `app/e2e/` and failed on it until its `include` was set to `src/**/*.test.ts`.

## Goals / Non-Goals

**Goals:**

- Every figure in the data files comes from a named public source through code that is in the
  repository, and a run can be repeated.
- A wrong input stops the run where it enters, with a message that names the place.
- The agreement with the official result is checked for every vote, on every run and in CI.
- The voting rules exist once, in `calculation/`.

**Non-Goals:**

- A general framework for sources. There are three sources; each gets one reader.
- Incremental updates. A run rebuilds all data files (125 MB of downloads, a few minutes).
- A format that is hidden from the app. The data files are the interface between the pipeline
  and the app; the spec names their content, and this design their exact shape.

## Decisions

Decisions 1 to 14 were asked while drafting (2026-11-14); each records the answer and the
alternatives. Decisions 15 to 18 follow from them and were not asked one by one.

### 1. The official result is the Federal Chancellery's; differences are named

The official result of a vote is the one the Federal Council validated, as the Federal
Chancellery publishes it. The pipeline compares the yes and the no votes of the entries with
it and stops on every difference that is not in `pipeline/known-differences.json`. It also
stops when a listed line does not occur exactly as listed, so the list cannot go stale. Today
the list has one line: id 6650 (number 665, 2024-03-03), no votes, 1,350,525 in the entries
and 1,350,325 officially (BBl 2024 996). The list of votes holds both the result and the sums
of the entries, so the app can say where they differ.

Hard constraint 1 gets this named exception (decision 18).

Alternatives considered:
- **The BFS's national figures are the official result.** The constraint would hold for every
  vote with no exception. Rejected: the validated figure is the Chancellery's, and the app
  would show 200 votes more than the Federal Gazette.
- **Leave the vote out** until the sources agree. Rejected: a prominent vote would be missing.
- **Correct the data.** Not possible: nothing says which municipality the 200 votes belong to.

### 2. "Matches" reaches as far as hard constraint 1 names

Compared with the Chancellery: the yes votes and the no votes (and with them the valid votes
and the yes share), the cantonal votes, the verdict. Not compared: the registered voters and
the ballots cast. They are the BFS's, the only figures per municipality, and turnout is their
quotient. The investigation records that they differ from the Chancellery's in 39 and 5 of 117
votes.

Alternatives considered:
- **Hold the Chancellery's national registered voters and ballots cast too**, for an official
  national turnout. Rejected: two turnout figures per vote that differ slightly.
- **List every such difference as a known difference.** Rejected: about 40 lines that nobody
  can resolve, growing with new votes.

### 3. Votes that are not validated are included, marked

A vote is validated when the Chancellery gives its yes and its no votes. Any other vote with a
complete result in the BFS file is in the data with the BFS's result and `validated: false`;
a later run replaces it. On 2026-11-14 that is 8 votes (2026-03-08 and 2026-06-14). The BFS's
own flag `provisorisch` is not used: it is still set for 2026-09-27, which the Chancellery has
validated (BBl 2026 2971).

A vote without a complete result (scheduled, or still being counted) is left out and named in
the output. Complete means: the BFS marks the vote as closed, and Switzerland and every entry
as counted.

Alternative considered: **only validated votes.** Rejected: the newest votes would be missing
for months.

### 4. One list of municipalities: the one the BFS files state

Every BFS vote-day file states the reference date of its municipalities (`spatial_reference`,
unit `voge`): 2026-01-01 in all 45 files. The pipeline reads the date from the files, stops
when they do not all state the same one, and downloads the register's snapshot of that date as
the list. A municipality that merged since a vote shows the sum of its parts, as the BFS gives
it. The roadmap's "list valid at each vote" is dropped; #6 draws one map, #7 brings the
characteristics onto this list (decision 18 changes the roadmap's wording).

Alternative considered: **search for the results on the lists of the time first** (cantonal
sources, archived BFS files). Rejected: uncertain outcome, and every vote would then need its
own list, map and characteristics.

### 5. An entry counts for the canton it voted in

For the votes until 2025-11-30, Moutier's entry is grouped under BE; from 2026 on under JU.
`pipeline/canton-changes.json` holds one line: municipality 6831, canton BE, until 2025-12-31.
After applying the list, the pipeline checks for every vote and every canton that the entries
sum to the canton's five counts in the BFS file. This check is what found Moutier, and it
stops the run on any change of canton that is not listed. The list of municipalities shows
Moutier in JU, its canton on the reference date.

One case cannot be told apart: Clavaleyres (BE) merged into Murten (FR) on 2022-01-01. Its
votes are inside Murten's entry for every vote, and the BFS's canton figures agree with that,
so the check passes. Its voters, a few dozen, count for Fribourg in the votes before 2022;
how many exactly cannot be read from the sources.

Alternative considered: **today's canton for every vote**, the same reading as decision 4.
Rejected: Bern's and Jura's results would differ from the official ones in 115 votes, and
under a limit a cantonal vote could change that would not change otherwise.

### 6. Swiss abroad and municipalities without a result

- The Swiss abroad of a canton that counts them apart are an entry of that canton with the
  BFS's number (9010 to 9260). `municipalities.json` names the number per canton; an entry
  with such a number is no municipality. What a limit does with them is decided in #8.
- A municipality that shares a ballot box has no entry in the BFS file. Each vote file lists
  the municipalities of the list that have no entry (`withoutResult`). Where their votes are
  counted is not recorded.

Alternative considered: **also record the neighbour that counts the votes.** Rejected: the BFS
states it for today's five only; two pointers (Jaberg until 2017, Rüti bei Lyssach until 2020)
would be researched by hand.

### 7. The kind is the BFS's code, one to one; the tie-break question is in the data

| Code | Kind | Double majority in the BFS file |
|------|------|---------------------------------|
| 1 | `mandatory-referendum` | yes |
| 2 | `optional-referendum` | no |
| 3 | `popular-initiative` | yes |
| 4 | `initiative-with-counter-proposal` | yes |
| 5 | `counter-proposal` | yes |
| 6 | `tie-break-question` | yes |

Any other code stops the run. Two cross-checks: the BFS file's `doppeltesMehr` must agree with
the table (in the pipeline; the table states what the BFS's code says, it judges no vote), and
a validated vote has cantonal votes from the Chancellery exactly when the calculation says its
kind needs both majorities (in the TypeScript test, decision 10). The tie-break question is in
the data with its figures and no verdict; the calculation does not judge it, and #4 decides how
it is shown.

Alternatives considered:
- **Also require the Chancellery's kind to agree.** Rejected: a second mapping to maintain,
  and its values for the rarer kinds are not all seen yet.
- **Leave the tie-break question out.** Rejected: the ballot of 2026-03-08 would be incomplete.

### 8. Texts: the BFS's titles, the Chancellery's reference and note

Titles in German, French and Italian from the BFS file (the short titles people know). For a
validated vote, the Chancellery's reference to the official publication (BBl / FF) and, where
it gives one, its note, each in the three languages. The annulment of the vote of 2016-02-28
is in the data as that note. #4 and #9 decide what is shown.

Alternatives considered:
- **German title only.** Rejected: #9 would have to regenerate everything.
- **An `annulled` flag kept by hand.** Rejected: one more hand-kept list, for one vote.

### 9. The pipeline is Python with polars; the input is checked value by value

The user chose Python with a data library over TypeScript on Node 24 (recommended, because it
needs no second toolchain and could call the calculation) and over Python with the standard
library only. Then polars over pandas (a column of counts with one missing value silently
becomes floats) and DuckDB (the checks would be SQL, out of the type checker's sight).

- **Python 3.13**, pinned in `pipeline/.python-version`.
- **uv** runs everything and pins every dependency in `pipeline/uv.lock`; all commands use
  `--locked`, so a lockfile that does not match `pyproject.toml` fails.
- **ruff** formats and lints (line length 100, as Prettier), **mypy** in strict mode checks
  the types of `src` and `tests`, **pytest** runs the tests.

Because of the spike result (Context), the checks on the input do not rely on polars. A reader
takes every count through one function that accepts a value only if it is an `int`, not a
`bool`, and not below zero, and otherwise raises an error with the file, the vote, the entry
and the figure. Frames are then built column by column with the declared schema, never from
rows, and polars does the sums, the grouping and the comparisons.

### 10. The rules exist once: a TypeScript test runs the calculation over the data files

The pipeline's checks add and compare; they need no voting rule. Cantonal votes and verdicts
are calculated only by `calculation/`. `app/src/lib/vote-data.test.ts` reads the committed
data files and, for every vote whose kind is calculated, calls `calculateResult` with the
entries of its file and `majoritiesNeeded(kind)`.

| Check | Where |
|-------|-------|
| Types, missing values, unknown and repeated entries, kinds | pipeline, at the reader |
| Entries sum to the BFS's figures for each canton and for Switzerland | pipeline |
| Yes and no votes equal the Chancellery's, except the known differences | pipeline |
| The two sources agree on verdict and cantonal votes | pipeline |
| Calculated yes and no votes equal the sums in the list of votes | TypeScript test |
| Calculated cantonal votes and verdict equal the result | TypeScript test |
| Cantonal votes in the result exactly when the kind needs both majorities | TypeScript test |
| Every vote of the list has its file, and no file is left over | TypeScript test |

The test lives in the app because the app is what will read these files together with the
calculation; it needs no Node types (`import.meta.glob` is Vite's). The app gets Vitest, with
`include: ['src/**/*.test.ts']`.

Alternatives considered:
- **The pipeline implements the rules too.** Rejected: the rules would exist twice, and the
  calculation the app runs would never run over the real data.
- **Both.** Rejected: twice the rules to maintain.
- **The test in `calculation/`.** Rejected: its `rootDir` forbids imports from outside `src`,
  and it must not depend on the data.
- **A fourth package for the test.** Rejected: a module for one file.

### 11. The data files are committed, with a record of the sources

`app/static/data/` is committed; the downloads are not (`pipeline/downloads/`, ignored by git).
`sources.json` names every source file with its address, size, SHA-256 and, for a BFS file,
the time the file states. No time of the run is stored, so a run with unchanged sources
changes nothing.

Alternative considered: **generate at every build.** Rejected: a build would depend on three
outside servers, and the BFS rewrites its files, so the data could change without a commit.

### 12. Layout and format of the data files

In `app/static/data/`, JSON, UTF-8, written by the pipeline only and not formatted by
Prettier.

`votes.json`, one vote per line in the file:

```json
{
  "referenceDate": "2026-01-01",
  "votes": [
    {
      "id": 5960,
      "number": 596,
      "date": "2016-02-28",
      "kind": "popular-initiative",
      "title": { "de": "…", "fr": "…", "it": "…" },
      "validated": true,
      "result": {
        "yes": 1609152,
        "no": 1664224,
        "cantonalVotesInFavour": 16.5,
        "cantonalVotesAgainst": 6.5,
        "passed": false
      },
      "reference": { "de": "BBl 2019 4599", "fr": "FF 2019 4421", "it": "FF 2019 3843" },
      "note": { "de": "…", "fr": "…", "it": "…" },
      "sums": {
        "registered": 5302873,
        "cast": 3354019,
        "validBallots": 3273376,
        "yes": 1609152,
        "no": 1664224
      }
    }
  ]
}
```

`cantonalVotesInFavour`, `cantonalVotesAgainst`, `passed`, `reference` and `note` are `null`
where the spec says "none"; no key is ever left out.

`votes/<id>.json`, one canton per line, all 26 cantons in the order of the constitution, the
entries of a canton ordered by number:

```json
{
  "id": 5960,
  "entries": {
    "ZH": [[1, 1398, 999, 982, 432, 550], [2, …]],
    "BE": […]
  },
  "withoutResult": [389, 408, 422, 535, 629, 868, 877]
}
```

A row is `[number, registered, cast, validBallots, yes, no]`.

`municipalities.json`, one canton per line:

```json
{
  "referenceDate": "2026-01-01",
  "municipalities": { "ZH": [[1, "Aeugst am Albis"], …], … },
  "swissAbroad": { "ZH": 9010, "LU": 9030, … }
}
```

`sources.json`: `{ "sources": [{ "address": "…", "bytes": 3954589, "sha256": "…", "stated":
"2026-08-12T16:22:29" }, …] }`, ordered by address; `stated` is `null` for a source that states
no time.

Measured on the downloads: a vote file is 57 to 60 kB (24 to 26 kB compressed), all 125
together 7.3 MB (3.1 MB compressed).

The types of these files are in `app/src/lib/vote-data.ts`; the test of decision 10 uses them.

Alternatives considered:
- **One file per vote day.** Rejected: choosing one vote would load up to five (290 kB).
- **One file for everything.** Rejected: 7.3 MB before anything is shown on a phone.
- **Entries as objects with named fields.** Rejected: the names would be repeated in each of
  the 2,115 entries of a vote.
- **`data/` at the root**, copied into the site by the build. Rejected: a copy step for
  nothing; `app/static/` is served as it is.

### 13. A new vote day: one command, by hand

`uv run --directory pipeline --locked python -m pipeline update`:

1. Download into `pipeline/downloads/`: the Chancellery's answer, then the BFS file of every
   vote day the Chancellery lists since 2013-01-01, then the register's snapshot of the
   reference date. Each file appears under its name only when complete. A vote day in the past
   without a BFS file stops the run; a day in the future may have none yet.
2. Read and check the three sources (decisions 9 and 10, the specs).
3. Build all data files in a temporary directory next to `app/static/data/`.
4. Only when every check has passed: replace `app/static/data/` with it. On any failure the
   temporary directory is removed and the data files are untouched.
5. Print what was added, what changed its validation, and what was left out.

Before step 4, a vote that the data files hold and the sources no longer give stops the run: no
update removes a vote (added after the review of PR #6; user decision, 2026-11-15).

`--reuse-downloads` skips step 1 for files that are there (for development). The change the
run makes is reviewed and merged as a pull request; `pipeline/README.md` gives the procedure.

Alternatives considered:
- **A scheduled run that opens a pull request.** Rejected for now: write permissions for the
  workflow, and a pull request opened with the workflow's token does not start CI.
- **A scheduled check that only reports.** Rejected for now: nothing is published before #5.

### 14. The pipeline's checks: four steps and a CI job of their own

`scripts/verify-local.sh` gets steps 8 to 11, and CI a third job `pipeline` (uv, no Node),
independent like `specs` and `build`:

```
uv run --directory pipeline --locked ruff format --check .
uv run --directory pipeline --locked ruff check .
uv run --directory pipeline --locked mypy
uv run --directory pipeline --locked pytest
```

`--quick` runs `pnpm run test` and the pytest step. The script refuses to run without `uv`.
The cloud hook runs `uv sync --directory pipeline --locked`. CI installs uv with
`astral-sh/setup-uv`; uv itself installs the Python version of `pipeline/.python-version`.

Alternative considered: **inside the four existing steps** (`pnpm run lint` also runs ruff).
Rejected: a failure of the first half hides the second, and the Node job would need Python.

### 15. Sources of the pipeline and how they are joined

| Source | Used for |
|--------|----------|
| BFS vote-day files | the votes, kinds, titles, entries, the BFS's national and canton figures, the reference date |
| Federal Chancellery (SPARQL, one query) | the vote days, the number, the validated result, verdict, reference, note |
| BFS register (snapshot of the reference date) | the list of municipalities |

The Chancellery's national row is matched to a BFS vote by `vote:id`; a vote without exactly
one row stops the run. The cantonal votes are read from the Chancellery's numeric properties
(`standesstimmenJa`, `standesstimmenNein`), the verdict from `ergebnis` (accepted, rejected).
In the register, a municipality's `Parent` is the district's `HistoricalCode`, and the
district's `Parent` the canton's.

Not used: the BFS table (STAT-TAB) has the same figures as the vote-day files, lacks the kind
and the newest vote day, and needs one rate-limited call per vote. Swissvotes ends in 2024.

### 16. Files

```
pipeline/
  pyproject.toml, uv.lock, .python-version, README.md
  known-differences.json      decision 1
  canton-changes.json         decision 5
  src/pipeline/
    __main__.py               the command line: `update`
    download.py               the addresses, the query, the downloads
    counts.py                 the one function every count passes (decision 9)
    feed.py                   reader of the BFS vote-day files, with its checks
    chancellery.py            reader of the Chancellery's answer
    register.py               reader of the register
    checks.py                 the sums and the comparisons between the sources
    write.py                  the data files
    update.py                 the steps of decision 13
  tests/                      pytest, with small made-up source files as fixtures
app/src/lib/vote-data.ts      the types of the data files
app/src/lib/vote-data.test.ts the test of decision 10
app/static/data/              the data files
```

The tests of the pipeline use made-up source files of two cantons and a handful of
municipalities, in the shape of the real ones; the real data is checked by every run and by
the TypeScript test.

### 17. The reference data of the calculation stays as it is

`calculation/src/reference-votes.json` (change #2) groups the entries as the BFS file nests
them, so Moutier is under JU there for votes before 2026. No figure of a test depends on it.
It is test data and is not regenerated; the investigation gets a sentence on it.

### 18. The project context and the roadmap

`openspec/config.yaml`: hard constraint 1 names the official result (the Federal Chancellery's
once validated, the BFS's until then, marked) and the list of known differences; the stack
names the pipeline's language and tools; the modules say that the pipeline does not use the
calculation and that a test runs the calculation over the data files; the paragraphs "not
decided" and "not verified" lose what is settled; the quality bar names the pipeline's checks;
the glossary gains "entry", "Swiss abroad" and "validated", and says that all data uses one
list of municipalities.

`docs/roadmap.md`: entry #3 as built; #6 loses "matching the municipalities at the time of the
vote", #12 loses the question about different lists.

### Dependencies added

| Dependency | For | Why |
|------------|-----|-----|
| Python 3.13 | pipeline | user decision 9 |
| uv | pipeline, CI, hook | pins Python and all packages; one command to run and check |
| polars | pipeline | sums, grouping and comparisons over frames with declared types |
| ruff, mypy, pytest | pipeline's checks | formatting and lint, static analysis, unit tests |
| `astral-sh/setup-uv` | CI | installs uv |
| vitest | app (development) | the test of decision 10; the calculation already uses it |

The app gets no run-time dependency. The data files are served with the site; the app requests
nothing from another server.

### Performance budget

No computation in this change is triggered by user interaction. Sizes that later changes
inherit: `votes.json` is expected below 150 kB, a vote file is at most 60 kB. The update
command is run by hand and has no budget; the downloads took about 15 minutes in the
investigation, most of it the BFS table, which the pipeline does not use.

## Risks / Trade-offs

- **The BFS moves to a new list of municipalities, one file at a time** → the run stops
  because the reference dates differ (decision 4) and says so; the data stays as it was until
  all files are on the new list. If that takes long after a vote day, a later change decides
  how to bridge it.
- **The BFS changes the address or the shape of its files** (they were rewritten in August
  2026) → the readers stop at the first value they do not understand; nothing is written.
- **The Chancellery's query returns fewer rows than expected** → a BFS vote without a row
  stops the run.
- **A second toolchain** (Python next to Node) → pinned by `uv.lock` and
  `pipeline/.python-version`, checked in its own CI job; the cloud hook installs it.
- **Two hand-kept lists** (known differences, changes of canton) → each is checked against
  the sources on every run and fails when it does not fit; each has one line.
- **Clavaleyres** counts for Fribourg before 2022 (decision 5) → a few dozen voters; named
  in the investigation.
- **The data files grow the repository**: 7.3 MB now, about 60 kB per vote, and every file
  changes when the BFS moves to a new list (once a year) → accepted; git stores the files
  compressed.
- **A municipality could drop out of a BFS file unnoticed** and be listed as without a result
  → the entries must still sum to the BFS's canton and national figures, and for validated
  votes to the Chancellery's; the scenarios name the municipalities without a result for two
  votes, and the TypeScript test asserts them.

## Migration Plan

Nothing is deployed and nothing is replaced. The change is merged as one pull request; the
first run of the update command produces the data files of that pull request.

## Open Questions

- What the yes and the no votes of the tie-break question stand for in the BFS file (the
  initiative and the counter-proposal, in which order). It matters when #4 shows it; the
  Chancellery's validated figures for number 682 will tell.
- Which of the two figures of number 665 is the error. The list of known differences holds
  both until a source changes.
- The terms of use of the three sources have not been read. #5 publishes the data and #8 names
  the sources in the app; one of them reads the terms first.
