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

- [x] 1.1 Check the four election days (2011-10-23, 2015-10-18, 2019-10-20, 2023-10-22) against
  an official publication of the Federal Chancellery or the BFS. Write its address into
  `investigations/characteristics.md`, under "Sources", and take the days out of "Not verified".
  Verify: the file names the publication, and `ELECTION_DAYS` in
  `investigations/characteristics/figures.py` equals the days it gives. If a day differs, stop
  and report to Q before going on.

  (As built: all four days match the Federal Council's circulars to the cantons, found through
  Fedlex's SPARQL endpoint. The investigation names them under "Sources", and the design no
  longer calls the days unconfirmed.)
- [x] 1.2 In `pipeline/tests/made_up.py`, write made-up sources in the shape of the real ones:
  - json-stat2 answers of STAT-TAB: the population (totals, and the single years of age),
    the party votes of two elections, the cattle, the census of 2000;
  - the register's lists of their dates, and its correspondences, with one merger and one split;
  - a ZIP with swisstopo's attribute table of the municipalities, written with pyshp.

  Verify: `uv run --directory pipeline --locked pytest` still gives 97 passed, and
  `uv run --directory pipeline --locked mypy` passes.

  (As built: 97 passed and mypy clean. The tables use the earlier list of Aeugst am Albis (1),
  Affoltern am Albis (2), Bonstetten (3, now part of 2), Bern, Meienried (no election result),
  Moutier (700, now 6831) and Delémont; the census also has Wettswil (4), split between 1 and 2.
  The made-up elections table also has its description, the GET the pipeline reads for the
  years of the elections.)
- [x] 1.3 New module `pipeline/src/pipeline/characteristics.py` reads a json-stat2 answer into
  counts per municipality and year, each through `counts.py`'s function. Write four tests in
  `pipeline/tests/test_characteristics.py`, one at a time:
  - the made-up population is read, its single years added up into the five age groups;
  - a missing count stops the run, naming the table, the municipality, the year and the figure;
  - a fraction (850.5 cattle) stops;
  - a count below zero stops.

  Verify: pytest gives 101 passed.

  (As built: 101 passed. The first test failed because the module did not exist, the third
  and the fourth because `read_cattle` and `read_languages` did not. The second passed when
  written, because every value already passes `count`; it failed against a mutant that read a
  missing value as 0. The fourth test breaks the census rather than the population, so that it
  brings in the reader of the languages.)
- [x] 1.4 Each source's list. Write three tests, one at a time:
  - a population table with a municipality 9999 stops, naming the table, 2025-04-06 and 9999;
  - a population table without one municipality of its list stops;
  - areas without the municipality 261 stop, naming swissBOUNDARIES3D, 2026-01-01 and 261.

  Verify: pytest gives 104 passed.

  (As built: 104 passed. The made-up areas have no Zürich, so the third test leaves out Bern
  (351). The first and the third failed first, because `check_list` and `read_areas` did not
  exist. The second passed when written; it failed against a mutant that looked only for
  municipalities not on the list.)
- [x] 1.5 The sums. Write five tests, one at a time; each stops the run naming the table and the
  year:
  - municipalities that do not add up to the table's figure for Switzerland (cattle);
  - a municipality's ages that do not add up to its inhabitants;
  - more foreigners than inhabitants;
  - a district whose municipalities do not add up to its party votes;
  - an area of zero.

  Verify: pytest gives 109 passed.

  (As built: 111 passed, two more than planned. The spec asks for the sum of Switzerland of the
  population, the foreigners and each language too, not only of the cattle, so two more tests
  cover the foreigners and Romansh. Each of the seven failed first: no error was raised, or, for
  the foreigners, the sum of Switzerland stopped the run before the municipality's own check.
  The elections reader came with the district test: it keeps the table's signs, so that only
  "..." counts as no list. From here on every count of the plan is two higher.)
- [x] 1.6 The elections (decisions 5 and 9). Write three tests, one at a time:
  - a municipality without any party's votes has none for that election;
  - a party without a list ("...") where others have votes counts zero;
  - the seven groups: Die Mitte adds CVP and BDP, the others add every party not named.

  Verify: pytest gives 112 passed.

  (As built: 114 passed, the plan's 112 and the two of 1.5. The first test passed when written,
  because the reader of 1.5 already gives none for such a municipality; it failed against a
  mutant that kept an empty result. The second failed first, because `group_parties` did not
  exist. The third passed when written; it failed against a mutant that left BDP out of Die
  Mitte.)
- [x] 1.7 Onto the votes' list (decision 8). Write three tests, one at a time:
  - a merger adds the counts of its parts;
  - a municipality that changed its number (Moutier, 700 to 6831) keeps its counts;
  - a split makes a group whose members have the group's counts.

  Verify: pytest gives 115 passed.

  (As built: 117 passed. The first test failed first, because `onto_list` and
  `read_correspondences` did not exist. The second passed when written; it failed against a
  mutant that ignored Moutier's correspondence. The third passed when written, and at first
  also against a mutant that did not join overlapping groups: the made-up census lists the
  split municipality last. The test now gives it first, as the real census gives the villages
  split in 2004 before one that later joined Breggia alone, and the mutant fails.)
- [x] 1.8 In `pipeline/src/pipeline/download.py`:
  - the 49 STAT-TAB queries in json-stat2, with a pause of 0.4 s between them;
  - the register's lists and correspondences;
  - swissBOUNDARIES3D;
  - the election days.

  Write two tests, one at a time:
  - no query asks for more than 100,000 cells;
  - an election since 2011 without a day stops the run.

  Verify: pytest gives 117 passed.

  (As built: 119 passed. Both tests failed first: the queries and `election_years` did not
  exist. The cells are computed with the real tables' sizes on 2026-11-15; the population's
  totals, asked for every year at once, reach 100,000 cells at 22 years, about 2031, and STAT-TAB
  then refuses the query with the address named. The pause sits in `fetch_url`, after an answer
  of STAT-TAB, so the tests' fake sources do not wait. The pipeline also GETs the elections
  table's description for its years: the record gains 57 sources, not 56, and the spec, the
  design and 1.11 say so.)
- [x] 1.9 In `pipeline/src/pipeline/write.py`, write `characteristics.json` in the shape of
  decision 12, and the record's `query` (decision 16). Write three tests, one at a time:
  - the made-up file's lines and bytes;
  - the same sources give the same bytes;
  - a record of a request with a body names its query, and the records are sorted by address
    and query.

  Verify: pytest gives 120 passed.

  (As built: 122 passed, the plan's 120 and the two of 1.5. The first and third tests failed
  first: `CharacteristicsData` did not exist, and `Source` took no query. The second passed when
  written, because the writer sorts; it failed against a mutant that kept the given order. Two
  existing tests changed with the spec: the record now has `"query"`, and a run writes eight
  files. The data files need the characteristics, so the update's wiring of 1.10 came with this
  task for the suite to pass.)
- [x] 1.10 In `pipeline/src/pipeline/update.py`, run the characteristics with the votes and the
  map. Write one test: when STAT-TAB does not answer, the run names its address and every data
  file is as it was. Verify:
  - pytest gives 121 passed;
  - `uv run --directory pipeline --locked ruff format --check .`,
    `uv run --directory pipeline --locked ruff check .` and
    `uv run --directory pipeline --locked mypy` pass.

  (As built: 124 passed, the plan's 121, the two of 1.5, and one more: a whole run's
  `characteristics.json`, its years from the first vote day, a merger, Moutier's new number,
  Meienried without an election and the areas. No unit test catches a mistake in the wiring.
  The planned test passed when written, the wiring having come with 1.9; it failed against a
  mutant that read a missing answer as empty. The update's fake sources answer a query by its
  address and its body, and the Chancellery's record names its query too.)
- [x] 1.11 Run `uv run --directory pipeline --locked python -m pipeline update` for real.
  Verify:
  - `app/static/data/characteristics.json` is about 1.34 MB, with 2,110 municipalities, the
    population and the cattle of 2012 to 2025, and the elections of 2011, 2015, 2019 and 2023;
  - Zürich's counts of 2015 in it are those of `investigations/characteristics.md`;
  - `sources.json` names 57 more sources than before;
  - the other data files are unchanged but for `sources.json`'s Chancellery query;
  - a second run leaves `git status --short app/static/data` empty.

  (As built: the run took 14 minutes, almost all of it STAT-TAB's limit, 15.7 s of CPU.
  `characteristics.json` is 1,355,172 bytes, 568,535 gzipped, with 2,110 municipalities, the
  population and the cattle of 2012 to 2025, and the elections of 2011, 2015, 2019 and 2023.
  Zürich's counts of 2015 are those of the investigation, and so are those of Fétigny-Ménières,
  Moutier, Meienried, Castel San Pietro and Breggia. `sources.json` names 108 sources, 57 more,
  50 of them with their query; every one of its lines changed, as each record now has
  `"query"`. No other data file changed. A second run on the same downloads
  (`--reuse-downloads`) left every data file byte for byte as it was.)
- [x] 1.12 In `pipeline/README.md`: the new sources in the table of sources, and the step when
  STAT-TAB moves a table to a newer list (decision 8). Verify: the README names the four tables,
  the register's correspondences and swissBOUNDARIES3D, and the step names the date to change.

  (As built: the table of sources names the four tables, the register's lists and
  correspondences, swissBOUNDARIES3D and the Federal Council's circulars for the election days.
  Three new cases under "When the update stops" give the steps: a table on a newer list, which
  names `LIST_DATES` to change; an election without a day; characteristics that do not add up.
  A run now downloads about 185 MB in about a quarter of an hour.)

## 2. The definitions of the characteristics in the app

In `app/src/lib/`. Spec `characteristics`: the characteristics, one definition each, the
definitions, the figures that apply to a vote, figures of an earlier list, a municipality
without an election result. Design: decisions 1, 11 and 15.

- [x] 2.1 In `app/src/lib/vote-data.ts`, add the type of `characteristics.json`. In
  `app/src/lib/vote-data.test.ts`, write one test: the file's municipalities are those of
  `municipalities.json`. Verify: `pnpm run check` passes, and `pnpm run test` gives 60 passed in
  the app.

  (As built: written after the real file existed, so it passed when written; it failed when
  its list lacked one municipality. It also checks that every array of counts has one entry per
  municipality. The tasks 2.2, 2.3 and 3.1 and the fourth test of 2.4 were done before it, while
  the update of 1.11 ran: the app then had 67 passed.)
- [x] 2.2 In `app/src/lib/format.ts`, a quotient of two whole numbers with a number of decimals,
  rounded half away from zero in whole numbers. Write three tests, one at a time:
  - no decimal: 100 × 396,955 / 9,188 is "4'320";
  - two decimals: 65 / 100 is "0.65";
  - three decimals: 131 / 52 is "2.519", and a half rounds up.

  Verify: the app has 63 passed.

  (As built: done before 2.1, while the update ran. The first test failed first, because
  `formatQuotient` did not exist. The second and third passed when written; with 9.05 added,
  the second failed against a mutant without padding, and the third against one that
  truncated.)
- [x] 2.3 New module `app/src/lib/characteristics.ts`: the 21 definitions, their names in
  `texts.ts`. Write one test: their names, in the order of the spec. Verify: the app has 64
  passed.

  (As built: the test failed first, because the module did not exist. Each definition gives
  its value as a quotient of two counts, so that a share is written from them as a vote's is,
  and #8 can take part / whole.)
- [x] 2.4 The figures that apply to a vote, from the years and elections the file holds. Write
  four tests, one at a time:
  - 5960 takes 2015 and the election of 2015;
  - 5920 takes 2014 and the election of 2011;
  - 6850 takes 2025 and the election of 2023;
  - a made-up vote of 2027-03-07 takes 2025.

  Verify: the app has 68 passed.

  (As built: 70 passed, the plan's 68 and the two of 3.1, done ahead. The made-up vote of 2027
  was written first, while the update ran, with a made-up file whose newest year is 2025, so
  that it holds after a later update; it failed first, because `applyingTo` did not exist. The
  three votes against the real file passed when written; two of them failed against a mutant
  that also took the vote's own year.)
- [x] 2.5 The values, against `characteristics.json` and `investigations/characteristics.md`.
  Write five tests, one at a time:
  - Zürich for 5960: every one of its 21 values, the shares within 0.00005 points;
  - Fétigny-Ménières for 5960: 1,376 inhabitants;
  - Moutier for 5960: 7,615 inhabitants;
  - Castel San Pietro and Breggia: Italian 90.1987%;
  - Meienried for 5960: no party value, and 52 inhabitants.

  Verify: the app has 73 passed.

  (As built: 75 passed, the plan's 73 and the two of 3.1. The five tests passed when written:
  the definitions and the file were there. Zürich's failed against a mutant without the factor
  100 of the density; Zürich's, Fétigny-Ménières's and Moutier's against one that read the next
  municipality's counts; Meienried's against one that gave no votes a value of 0 of 0. Zürich's
  checks each count of its 21 values exactly, and the shares within 0.00005 points.)

## 3. The panel beside the map

In `app/src/routes/votes/[id]/` and `app/src/lib/map-data.ts`. Spec `result-map`: every added
and modified requirement. Design: decisions 13, 14 and 19.

- [x] 3.1 In `app/src/lib/map-data.ts`, a second loader for `characteristics.json`, requested
  once. Write two tests with a fake fetch, one at a time: it requests the file once, and a
  failed request rejects. Verify: the app has 75 passed.

  (As built: done before group 2 was finished, while the update ran. The first test failed
  first, because the loader did not exist; the second passed when written and failed against a
  mutant that swallowed the failure.)
- [x] 3.2 New component `CharacteristicsPanel.svelte`, with its texts in `texts.ts`, beside the
  map in `ResultMap.svelte`. Write five browser tests in `app/e2e/result-map.spec.ts`, one at a
  time:
  - Zürich in 2016, every line of the spec's scenario;
  - the headings for 6850;
  - Meienried's density, area and cattle;
  - Meienried's "keine Angabe";
  - the sources.

  Verify: `pnpm run build` and `pnpm run test:e2e` give 46 passed.

  (As built: 46 passed. The component and the function `panelOf` in `characteristics.ts`, which
  works out the groups and their lines, were written while the update ran, so the five tests
  passed when written. Each failed against a mutant: the cattle's line without its year; every
  page given the date of 2016; cattle with two decimals; "–" for a missing figure; the sources
  cut short. The page also passes the vote's day to the map, which needs it for the years.)
- [x] 3.3 The panel keeps the municipality last clicked or tapped (Q, 2026-11-15: the first of
  these tests showed that a panel following the pointer cannot be read, see decision 14). Change
  the five tests of 3.2 from pointing to clicking, and write four browser tests, one at a time:
  - before clicking;
  - moving across the map to the panel;
  - pointing at another municipality does not change the panel;
  - clicking another municipality.

  Verify: 50 passed.

  (As built: 50 passed. The first test written for this task, as planned, pointed at Zürich and
  moved to the panel: it failed with "Gommiswald (SG)" in the panel, the last municipality
  crossed. Q chose clicking, and the spec, the design and this task changed. The tests of 3.2
  click now and still pass. Of the four new tests, the first two failed first: the prompt still
  asked to point, and the panel showed "Grabs (SG)". Then only a click or a tap sets the panel's
  municipality, and `texts.ts` asks for a click. The last two passed when written and failed
  against their mutants: a panel following the pointer, and one that kept the first click.)
- [x] 3.4 Where the panel stands. Write two browser tests, one at a time: a window 1,280 pixels
  wide, and one 800 pixels wide. Verify: 52 passed.

  (As built: 52 passed. Both passed when written, the layout having come with 3.2. Each failed
  against its own mutant of the breakpoint and only against it: 1,400 pixels put the panel
  below the map in the wide window, 700 pixels beside it in the narrow one. The wide test also
  checks that the panel's top is the map's.)
- [x] 3.5 Loading. Write two browser tests, one at a time:
  - every request for `data/characteristics.json` fails;
  - its answer is held back.

  Verify: 54 passed.

  (As built: 54 passed. Both passed when written, the loader having come with 3.1 and the map's
  wiring with 3.2. Each failed against its mutant: a failure that left the panel loading, and a
  map that waited for both files.)
- [x] 3.6 Change two existing browser tests to the modified requirements, and add one:
  - "From one vote to another" counts `data/characteristics.json` once;
  - the budget test points at three municipalities once the characteristics have loaded;
  - a new budget test clicks three municipalities, each after "Ganze Schweiz" and pointing at
    it, with 50 ms per frame (Q, 2026-11-15, decision 20: with 16 ms, frames after a click
    reached 17 to 21 ms in about one run of three).

  Verify:
  - each test fails against a mutant (the file loaded twice; pointing slowed by 20 ms; the
    panel's update slowed by 60 ms);
  - 55 passed, and the budget tests print their frames.

  (As built: 55 passed. With the plan's single budget test of 16 ms that also clicked, the
  frames after a click reached 16.7 to 21.1 ms in 7 of 16 runs, never the click's own frame;
  without clicks they stayed under 6 ms, and a window 2,000 pixels tall did not help, so
  scrolling is not the cause. Q chose a relaxed budget for clicking (decision 20). The test of
  16 ms points once the characteristics have loaded; the new test clicks, with 50 ms, and its
  longest frame was 10.6 to 17.3 ms in three runs. Each test passed when written and failed
  against its mutant: the file loaded on every page; pointing slowed by 20 ms; the panel's
  update slowed by 60 ms. The two share a helper that reads and prints the frames.)
- [x] 3.7 Look at `/votes/5960/` in the built site, in windows 1,280 and 800 pixels wide, with
  Zürich and Meienried selected. Verify: screenshots show the panel beside and below the map,
  and nothing overlaps.

  (As built: screenshots of the built site, Zürich and Meienried clicked, at 1,280 and 800
  pixels wide. At 1,280 the panel stands to the right of the map, its top at the map's; at 800
  below it. Nothing overlaps: the script checked the boxes of the map and the panel in all
  four. The long line of Die Mitte wraps with "keine Angabe" at 1,280 and fits at 800.
  Meienried, 65 ha, is about one pixel at 800 pixels wide: a click on the whole of Switzerland
  hit Safnern, its neighbour; zoomed in, it is clicked as it should be.)

## 4. Documentation and the whole

- [x] 4.1 Update `README.md` (what the site shows, the data files), `openspec/config.yaml` (the
  sources of area and language are found; religion per municipality exists in the census of
  2000, for #13) and `docs/roadmap.md` (the third investigation under "Investigations"). Verify:
  `openspec validate --all --strict` passes, and each file names the characteristics.

  (As built: `README.md` describes the panel and its file; `openspec/config.yaml` records how
  the characteristics are made, and the census's religion as a candidate for #13; the roadmap
  lists the investigation. The validation passes.)
- [x] 4.2 Update `CLAUDE.md`: the status, the code map and "Where things are" for every file this
  change adds:
  - `characteristics.py`, `test_characteristics.py`, `characteristics.ts`,
    `CharacteristicsPanel.svelte`;
  - `characteristics.json`;
  - `investigations/characteristics.md` and `investigations/characteristics/`.

  Verify: every file of `git diff --name-status main` with status A outside `openspec/` is named
  in `CLAUDE.md`, or lies in a directory its tables describe.

  (As built: each of the 10 added files is named, or in a directory the tables describe: the
  investigation's three scripts under `characteristics/`, `test_characteristics.py` under
  `pipeline/tests/test_*.py`. The status says that #7 is applied and not yet archived, and that
  a look at performance follows it (Q); the archive updates it. The sizes of a run are 185 MB
  and a quarter of an hour.)
- [x] 4.3 Run `./scripts/verify-local.sh`. Verify: 11 of 11 steps pass, with 41 tests of the
  calculation, 75 of the app, 55 browser tests and 124 of the pipeline.

  (As built: 11 of 11 steps passed, with 41, 75, 55 and 124 tests.)

## Verification

`/openspec-verify-change` on 2026-11-15 found no critical issue, two warnings and four
suggestions. Q asked to fix them; the warnings and the first three suggestions are fixed, each
test seen to fail against a mutant:

- **A characteristic's date was not part of its definition** (spec `characteristics`, "One
  definition per characteristic"; design, decision 11): `panelOf` worked the years out from the
  source. Each definition now gives the year of its figures, and the panel takes its headings
  and its lines' years from the definitions; the heading of the languages names the census's
  year from them too. App test: the 21 years for 5960; it failed first, and against a mutant
  that gave the census the population's year.
- **The record of the characteristics' sources was checked by hand only** (spec `vote-data`,
  "The record names every source file"). Pipeline test: the record names the STAT-TAB answers
  with their queries, the elections table's description without one, the register's lists and
  correspondences, and swissBOUNDARIES3D; it failed against a mutant that recorded no query.
- **`SWISSBOUNDARIES_DATE` in `download.py` was never used**: removed. The areas are checked
  against the votes' list, which its comment now says.
- **Two scenarios were checked by hand or on made-up data only**: the years in the file
  (population and cattle every year from 2012, the elections from 2011) and Zürich's Die Mitte of
  2023, its own 265,215 votes. Two app tests; the second failed against a mutant that took the
  first election instead of the last.
- **`CLAUDE.md`'s row of the investigations** now says "the first's scripts".

Left to Q: a check that the elections table still names the parties under their codes.

With them: 78 tests of the app, 55 browser tests, 125 of the pipeline.

## Workflow follow-up

- `/openspec-verify-change`, then `/openspec-archive-change`, which updates #7 in
  `docs/roadmap.md`.
- After the merge, Q checks the published panel by hand, on a computer and on a phone:
  `/votes/5960/` and `/votes/6850/` show the panel with their years, and Meienried shows "keine
  Angabe".
