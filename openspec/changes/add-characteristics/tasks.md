# Tasks

All commands run from the repository root, on a branch started from an updated `main`.

**Before this change:**
- `pnpm run test`: 41 passed in the calculation and 59 in the app;
- `uv run --directory pipeline --locked pytest`: 97 passed;
- the browser tests: 41;
- `./scripts/verify-local.sh`: 11 of 11 steps.

**How tests are written:**
- Each test is written first and seen to fail before the code that makes it pass, one at a time.
- A test that passes when written is seen to fail against a mutant, and the task says so in a
  note "As built".
- The numbers of tests are the plan. Where a count differs while building, the note says so
  too.

**Temporary edits** made for a verification step are removed before the task is ticked.
`git status --short` then shows nothing of them.

## 1. The pipeline writes the characteristics

In `pipeline/`. Specs: `characteristics` (all but "One definition per characteristic" and "The
figures that apply to a vote") and `vote-data` (the record of the sources, adding a vote day).
Design: decisions 2, 5, 8 to 10, 12, 16 and 17. The figures are those of
`investigations/characteristics.md`.

- [ ] 1.1 Check the four election days (2011-10-23, 2015-10-18, 2019-10-20, 2023-10-22) against
  an official publication of the Federal Chancellery or the BFS. Write its address into
  `investigations/characteristics.md`, under "Sources", and take the days out of "Not verified".
  Verify: the file names the publication, and `ELECTION_DAYS` in
  `investigations/characteristics/figures.py` equals the days it gives. If a day differs, stop
  and report to Q before going on.
- [ ] 1.2 In `pipeline/tests/made_up.py`, write made-up sources in the shape of the real ones:
  - json-stat2 answers of STAT-TAB: the population (totals, and the single years of age),
    the party votes of two elections, the cattle, the census of 2000;
  - the register's lists of their dates, and its correspondences, with one merger and one split;
  - a ZIP with swisstopo's attribute table of the municipalities, written with pyshp.

  Verify: `uv run --directory pipeline --locked pytest` still gives 97 passed, and
  `uv run --directory pipeline --locked mypy` passes.
- [ ] 1.3 New module `pipeline/src/pipeline/characteristics.py` reads a json-stat2 answer into
  counts per municipality and year, each through `counts.py`'s function. Write four tests in
  `pipeline/tests/test_characteristics.py`, one at a time:
  - the made-up population is read, its single years added up into the five age groups;
  - a missing count stops the run, naming the table, the municipality, the year and the figure;
  - a fraction (850.5 cattle) stops;
  - a count below zero stops.

  Verify: pytest gives 101 passed.
- [ ] 1.4 Each source's list. Write three tests, one at a time:
  - a population table with a municipality 9999 stops, naming the table, 2025-04-06 and 9999;
  - a population table without one municipality of its list stops;
  - areas without the municipality 261 stop, naming swissBOUNDARIES3D, 2026-01-01 and 261.

  Verify: pytest gives 104 passed.
- [ ] 1.5 The sums. Write five tests, one at a time; each stops the run naming the table and the
  year:
  - municipalities that do not add up to the table's figure for Switzerland (cattle);
  - a municipality's ages that do not add up to its inhabitants;
  - more foreigners than inhabitants;
  - a district whose municipalities do not add up to its party votes;
  - an area of zero.

  Verify: pytest gives 109 passed.
- [ ] 1.6 The elections (decisions 5 and 9). Write three tests, one at a time:
  - a municipality without any party's votes has none for that election;
  - a party without a list ("...") where others have votes counts zero;
  - the seven groups: Die Mitte adds CVP and BDP, the others add every party not named.

  Verify: pytest gives 112 passed.
- [ ] 1.7 Onto the votes' list (decision 8). Write three tests, one at a time:
  - a merger adds the counts of its parts;
  - a municipality that changed its number (Moutier, 700 to 6831) keeps its counts;
  - a split makes a group whose members have the group's counts.

  Verify: pytest gives 115 passed.
- [ ] 1.8 In `pipeline/src/pipeline/download.py`:
  - the 49 STAT-TAB queries in json-stat2, with a pause of 0.4 s between them;
  - the register's lists and correspondences;
  - swissBOUNDARIES3D;
  - the election days.

  Write two tests, one at a time:
  - no query asks for more than 100,000 cells;
  - an election since 2011 without a day stops the run.

  Verify: pytest gives 117 passed.
- [ ] 1.9 In `pipeline/src/pipeline/write.py`, write `characteristics.json` in the shape of
  decision 12, and the record's `query` (decision 16). Write three tests, one at a time:
  - the made-up file's lines and bytes;
  - the same sources give the same bytes;
  - a record of a request with a body names its query, and the records are sorted by address
    and query.

  Verify: pytest gives 120 passed.
- [ ] 1.10 In `pipeline/src/pipeline/update.py`, run the characteristics with the votes and the
  map. Write one test: when STAT-TAB does not answer, the run names its address and every data
  file is as it was. Verify:
  - pytest gives 121 passed;
  - `uv run --directory pipeline --locked ruff format --check .`,
    `uv run --directory pipeline --locked ruff check .` and
    `uv run --directory pipeline --locked mypy` pass.
- [ ] 1.11 Run `uv run --directory pipeline --locked python -m pipeline update` for real.
  Verify:
  - `app/static/data/characteristics.json` is about 1.34 MB, with 2,110 municipalities, the
    population and the cattle of 2012 to 2025, and the elections of 2011, 2015, 2019 and 2023;
  - Zürich's counts of 2015 in it are those of `investigations/characteristics.md`;
  - `sources.json` names 56 more sources than before;
  - the other data files are unchanged but for `sources.json`'s Chancellery query;
  - a second run leaves `git status --short app/static/data` empty.
- [ ] 1.12 In `pipeline/README.md`: the new sources in the table of sources, and the step when
  STAT-TAB moves a table to a newer list (decision 8). Verify: the README names the four tables,
  the register's correspondences and swissBOUNDARIES3D, and the step names the date to change.

## 2. The definitions of the characteristics in the app

In `app/src/lib/`. Spec `characteristics`: the characteristics, one definition each, the
definitions, the figures that apply to a vote, figures of an earlier list, a municipality
without an election result. Design: decisions 1, 11 and 15.

- [ ] 2.1 In `app/src/lib/vote-data.ts`, add the type of `characteristics.json`. In
  `app/src/lib/vote-data.test.ts`, write one test: the file's municipalities are those of
  `municipalities.json`. Verify: `pnpm run check` passes, and `pnpm run test` gives 60 passed in
  the app.
- [ ] 2.2 In `app/src/lib/format.ts`, a quotient of two whole numbers with a number of decimals,
  rounded half away from zero in whole numbers. Write three tests, one at a time:
  - no decimal: 100 × 396,955 / 9,188 is "4'320";
  - two decimals: 65 / 100 is "0.65";
  - three decimals: 131 / 52 is "2.519", and a half rounds up.

  Verify: the app has 63 passed.
- [ ] 2.3 New module `app/src/lib/characteristics.ts`: the 21 definitions, their names in
  `texts.ts`. Write one test: their names, in the order of the spec. Verify: the app has 64
  passed.
- [ ] 2.4 The figures that apply to a vote, from the years and elections the file holds. Write
  four tests, one at a time:
  - 5960 takes 2015 and the election of 2015;
  - 5920 takes 2014 and the election of 2011;
  - 6850 takes 2025 and the election of 2023;
  - a made-up vote of 2027-03-07 takes 2025.

  Verify: the app has 68 passed.
- [ ] 2.5 The values, against `characteristics.json` and `investigations/characteristics.md`.
  Write five tests, one at a time:
  - Zürich for 5960: every one of its 21 values, the shares within 0.00005 points;
  - Fétigny-Ménières for 5960: 1,376 inhabitants;
  - Moutier for 5960: 7,615 inhabitants;
  - Castel San Pietro and Breggia: Italian 90.1987%;
  - Meienried for 5960: no party value, and 52 inhabitants.

  Verify: the app has 73 passed.

## 3. The panel beside the map

In `app/src/routes/votes/[id]/` and `app/src/lib/map-data.ts`. Spec `result-map`: every added
and modified requirement. Design: decisions 13, 14 and 19.

- [ ] 3.1 In `app/src/lib/map-data.ts`, a second loader for `characteristics.json`, requested
  once. Write two tests with a fake fetch, one at a time: it requests the file once, and a
  failed request rejects. Verify: the app has 75 passed.
- [ ] 3.2 New component `CharacteristicsPanel.svelte`, with its texts in `texts.ts`, beside the
  map in `ResultMap.svelte`. Write five browser tests in `app/e2e/result-map.spec.ts`, one at a
  time:
  - Zürich in 2016, every line of the spec's scenario;
  - the headings for 6850;
  - Meienried's density, area and cattle;
  - Meienried's "keine Angabe";
  - the sources.

  Verify: `pnpm run build` and `pnpm run test:e2e` give 46 passed.
- [ ] 3.3 The panel keeps the last municipality. Write three browser tests, one at a time:
  - before pointing;
  - moving to the panel;
  - another municipality.

  Verify: 49 passed.
- [ ] 3.4 Where the panel stands. Write two browser tests, one at a time: a window 1,280 pixels
  wide, and one 800 pixels wide. Verify: 51 passed.
- [ ] 3.5 Loading. Write two browser tests, one at a time:
  - every request for `data/characteristics.json` fails;
  - its answer is held back.

  Verify: 53 passed.
- [ ] 3.6 Change two existing browser tests to the modified requirements:
  - "From one vote to another" counts `data/characteristics.json` once;
  - the budget test points once the characteristics have loaded.

  Verify:
  - each changed test fails against a mutant (the file loaded twice; the panel updated in a
    loop of 20 ms);
  - 53 passed, and the budget test prints its frames.
- [ ] 3.7 Look at `/votes/5960/` in the built site, in windows 1,280 and 800 pixels wide, with
  Zürich and Meienried selected. Verify: screenshots show the panel beside and below the map,
  and nothing overlaps.

## 4. Documentation and the whole

- [ ] 4.1 Update `README.md` (what the site shows, the data files), `openspec/config.yaml` (the
  sources of area and language are found; religion per municipality exists in the census of
  2000, for #13) and `docs/roadmap.md` (the third investigation under "Investigations"). Verify:
  `openspec validate --all --strict` passes, and each file names the characteristics.
- [ ] 4.2 Update `CLAUDE.md`: the status, the code map and "Where things are" for every file this
  change adds:
  - `characteristics.py`, `test_characteristics.py`, `characteristics.ts`,
    `CharacteristicsPanel.svelte`;
  - `characteristics.json`;
  - `investigations/characteristics.md` and `investigations/characteristics/`.

  Verify: every file of `git diff --name-status main` with status A outside `openspec/` is named
  in `CLAUDE.md`, or lies in a directory its tables describe.
- [ ] 4.3 Run `./scripts/verify-local.sh`. Verify: 11 of 11 steps pass, with 41 tests of the
  calculation, 73 of the app, 53 browser tests and 121 of the pipeline.

## Workflow follow-up

- `/openspec-verify-change`, then `/openspec-archive-change`, which updates #7 in
  `docs/roadmap.md`.
- After the merge, Q checks the published panel by hand, on a computer and on a phone:
  `/votes/5960/` and `/votes/6850/` show the panel with their years, and Meienried shows "keine
  Angabe".
