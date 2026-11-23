# Tasks

All commands run from the repository root, on a branch started from an updated `main`.

**Before this change** (counted on `2e64fe2`):
- `pnpm run test`: 52 passed in the calculation and 158 in the app;
- the browser tests: 243, one at a time;
- `uv run --directory pipeline --locked pytest`: 134 collected;
- `./scripts/verify-local.sh`: 11 of 11 steps.

**How tests are written:**
- Each test is written first and seen to fail before the code that makes it pass, one at a time.
- A test that passes when written is seen to fail against a mutant, and the task says so in a
  note "As built"; after a mutant, the restored code is built again before the next browser test.
- The numbers of tests are the plan; where a count differs while building, the note says so.
- A pipeline test is run alone with
  `uv run --directory pipeline --locked pytest tests/<file> -k "<its name>"`.
- A browser test is run alone with
  `pnpm run build && pnpm --filter app exec playwright test <file> -g "<its name>"`; "run alone"
  below means one of the two.

**Temporary edits** made for a verification step are removed before the task is ticked.
`git status --short` then shows nothing of them.

**The figures** of every test are those of `investigations/more-characteristics.md`, answer 12
unless a task names another.

## 1. The pipeline reads the new tables

Spec `characteristics`, "Each source gives the list it is expected to give", "Every count of a
characteristic is a whole number from zero", "A count the source withholds", "The counts of the
new tables add up" and "The data file of the characteristics"; spec `vote-data`, "The record of
the sources"; design, decisions 4 to 8, 10 and 11.

- [x] 1.1 The tables and their queries. In `download.py`: the six new tables, the date of each
  table's list (the jobs' 2024-01-01 among them), and the twelve queries of decision 11, those of
  the farms table among them, each naming every dimension of its table. Tests in
  `test_download.py`, one per table, the farms table included: the query's dimensions and codes.

  Verify: `uv run --directory pipeline --locked pytest tests/test_download.py` passes, 11 tests.

  As built: 11 tests, 7 of them new, each failing before its query. The jobs are asked by sectors,
  not by years (Q, while applying; design, decision 11). The test of the cells of before now covers
  all 61 queries; it passed when written and failed against a mutant with five numbers of rooms in
  one query of the dwellings (115,880 cells).
- [x] 1.2 Municipalities named without dots. `made_up.py` gains a table whose dimension
  "Gemeinde" has labels like "0261 Zürich" and one code for Switzerland. A test in
  `test_characteristics.py`: its municipalities are read with their numbers, and Switzerland is
  not one. Seen to fail: no municipality found. Then the reader of decision 11.

  Verify: run alone, the test passes; the tests of the four tables of before pass unchanged.

  As built: the made-up table is the buildings table of task 1.5, with "0001 Aeugst am Albis" and
  "0000" for Switzerland. The test failed before the reader: no municipality found. In a dimension
  "Gemeinde" every label but "Schweiz" must start with a number; one without stops the update. 27
  tests in the file, the 26 of before unchanged.
- [x] 1.3 Those born abroad. `made_up.py` gains the place-of-birth table. Tests, one at a time:
  the count of a municipality and year; a missing count stops; the municipalities do not add up
  to Switzerland; the inhabitants differ from the population table's in a year both give; a year
  only one table gives is not compared. Then the reader and its checks.

  Verify: each run alone passes; `pytest tests/test_characteristics.py` passes.

  As built: 5 tests, 32 in the file. Three failed before their code: the count, the sum over
  Switzerland, the inhabitants against the population table's. Two passed when written and failed
  against a mutant each: a missing count read as 0, and every year compared. The reader takes the
  population as `read_population` gives it and compares the inhabitants on the tables' own list,
  which is the same for both.
- [x] 1.4 Religion and education. `made_up.py` gains the two tables. Tests, one at a time: the
  four counts of religion; the three levels of education from the table's 13; a religion without
  a count stops, naming the table, the municipality, 2000 and the religion; religions that do not
  add up to the inhabitants; levels that do not; the sums over Switzerland. Then the readers.

  Verify: each run alone passes.

  As built: 7 tests, one more than planned, as the sums over Switzerland have one per table; 39 in
  the file. One function reads both tables: every code of the dimension, the sum within a
  municipality and the sums over Switzerland. Four tests failed before their code (the counts of
  each table, the religions' two sums). Three passed when written and failed against a mutant each:
  a religion without a count read as 0; for education, which shares the checks, the sum within a
  municipality left out and the sum over Switzerland left out. A religion or a level the
  characteristics do not name is named in a message by the table's own label.
- [x] 1.5 Dwellings and buildings. `made_up.py` gains the two tables with their year. Tests, one
  at a time: the occupied dwellings added up over the rooms, and those of the three kinds of
  owner; the buildings with dwellings, and the single-family houses; the query's year is 2000;
  the sums over Switzerland. Then the readers.

  Verify: each run alone passes.

  As built: 5 tests, 44 in the file. One function reads both tables: every cell of an answer, added
  up per municipality, with the sum of each cell over Switzerland. "The query's year is 2000" is
  tested on the answer: one whose years are not 2000 alone stops the update, as the table also gives
  1990. Four tests failed before their code; the buildings' sum over Switzerland, which shares the
  check, passed when written and failed against a mutant that leaves the check out. The buildings
  table was made up in task 1.2.
- [x] 1.6 The jobs and their withheld counts. `made_up.py` gains the jobs table with an "X".
  Tests, one at a time: the four counts of a municipality and year; "X" is none; another sign
  stops, naming the table, the municipality, the year and "jobs"; sectors that do not add up to
  all jobs stop; with a sector withheld the sum is not compared; the municipalities are not
  summed over Switzerland. Then the reader.

  Verify: each run alone passes.

  As built: 6 tests, 50 in the file. The table is asked by sectors, so the reader takes two answers:
  `jobs_999.json` (all jobs and the primary sector) and `jobs_2.json`. Two tests failed before their
  code: the four counts, and the sectors that do not add up. Four passed when written and failed
  against a mutant each: "X" read as 0; every sign read as none; the sum compared with a withheld
  sector as 0; a sum over Switzerland added. Another sign stops through the count check, so its
  message says the count is None.
- [x] 1.7 A part without a count. A test of `onto_list`: of two municipalities that are one
  today, one has none for a count, and the sum is none; a second test that the elections' rule
  stays, a part without a result adding nothing. Seen to fail: the first gives the other part's
  count. Then the parameter of decision 7.

  Verify: both run alone pass; `pytest tests/test_characteristics.py` passes.

  As built: 2 tests, 52 in the file. The parameter is `all_parts`: with it, a part without a figure
  leaves its group without one. A row is one count, so the update brings each of the four counts of
  the jobs onto the list by itself, a withheld count being a row of none. The first test failed
  before the parameter (without it Affoltern am Albis has the other part's count, [10]); the second
  passed when written and failed against a mutant that applies the rule to every table.
- [x] 1.8 The farms. `made_up.py`'s farms table gains the farms and the farmland, all and
  organic. Tests, one at a time: the three counts of a municipality and year; farms that do not
  add up to Switzerland stop; farmland that does not is accepted; more organic farmland than
  farmland stops. Then the reader.

  Verify: each run alone passes.

  As built: 4 tests, 56 in the file. The reader takes three answers, `farms.json`, `farmland.json`
  and `organic_farmland.json`, and shares the reading of one count with the cattle. The organic
  farms are not read, so only the organic farmland is compared with the farmland (Q, while applying;
  design, decision 11). Three tests failed before their code: the three counts, the farmland
  accepted (it stopped with "add up to 7800 farmland, not 7803"), and more organic farmland than
  farmland. The farms' sum over Switzerland, which the cattle's check gives, passed when written and
  failed against a mutant that leaves the check out.
- [x] 1.9 The update and the data file. Tests in `test_update.py` and `test_write.py`, one at a
  time: `characteristics.json` holds the seven new sets of decision 10, each yearly one from the
  year before the first vote day to its table's newest; a withheld count is `null`; the jobs
  table on another list stops, naming it, 2024-01-01 and the number; `sources.json` names the
  new answers and the list of 2024-01-01; the same sources give the same bytes. Then `update.py`
  and `write.py`.

  Verify: `uv run --directory pipeline --locked pytest` passes, about 170 tests;
  `uv run --directory pipeline --locked ruff check . && uv run --directory pipeline --locked mypy`
  report nothing.

  As built: 176 tests in all, 9 in `test_write.py` as before and 31 in `test_update.py`, 5 of them
  new. Between tasks 1.1 and 1.9 the update's tests failed, as the update asked for the list of
  2024-01-01 before its made-up sources had it. `test_the_characteristics` and the test of the same
  bytes in another order now hold the seven sets; the first failed before the data class and the
  writer had them, the second passed and failed against a mutant that writes the religions in the
  order given. In `test_update.py` the yearly sets failed before the update read them; the test of
  the record failed once the farms table had four answers and now counts the answers of each table.
  Three passed when written and failed against a mutant each: the sets of 2000 (two of them
  swapped), a withheld count (a part without a count adding nothing), the jobs on another list (the
  jobs table's list not checked). One test more than planned: the farms' years must be the cattle's,
  as the app takes the farms of the cattle's year; it failed against a mutant without the check. A
  number from 9000 on is no municipality for the check of a list, so the made-up extra one is 8999.
- [x] 1.10 `pipeline/README.md`: the six new tables among the sources, the list of 2024-01-01, and
  what to do when the update stops for a sign in the jobs table or for a table on a newer list.

  Verify: every table of `download.py` is named in the README.

  As built: the ten tables of `download.py` are named, with the four dates of `LIST_DATES`. "When
  the update stops" gains the sign in the jobs table and, for a table on a newer list, the script
  that finds its date; the entries on a missing year and on sums name the new tables' checks. The
  size and the time of a run are corrected in task 1.11, once measured.
- [x] 1.11 The data. Run `uv run --directory pipeline --locked python -m pipeline update`.

  Verify: `git status --short app/static/data` names `characteristics.json` and `sources.json`
  only; `characteristics.json` is 2.5 to 2.8 MB; `sources.json` names 61 answers of STAT-TAB; a
  second run with `--reuse-downloads` changes nothing; `pnpm run test` passes, 52 and 158, as the
  app does not read the new counts yet.

  As built: the first run downloaded everything in 24 minutes, STAT-TAB answering slowly, and then
  stopped: "organic_farmland.json, municipality 1, 1985: organic farmland is None". The farms table
  goes back to 1975 and writes "..." for the organic farmland of 1975, 1980 and 1985, 6,855 cells;
  the investigation had asked for 2012 to 2025 only. The farms' reader now reads the cattle's years
  alone and stops when an answer lacks one of them, which replaces the check of the farms' years of
  task 1.9. The made-up table lacks the organic farmland of its first year, so that the farms' tests
  failed as the run had; one test more, 177 in the pipeline. The second run, with
  `--reuse-downloads` on the files of the first, wrote the two data files; a third gave the same
  bytes. `characteristics.json` is 2.40 MB, not 2.5 to 2.8, and 976 KB with gzip (981 estimated);
  `sources.json` names 61 answers of STAT-TAB and the list of 2024-01-01. The counts of Zürich,
  Oberrieden, Meienried, Rue, Bister, Hérémence and Linescio are the investigation's. `pnpm run
  test`: 52 and 164, as tasks 2.1 to 2.4 were under way. The downloads are 190 MB;
  `pipeline/README.md` says so.

## 2. The definitions

Spec `characteristics`, "The characteristics", "One definition per characteristic", "The
characteristics of the population", "The religion of 2000", "The education of 2000", "The housing
of 2000", "The jobs", "A count the source withholds", "The farms and the organic farmland" and
"The figures that apply to a vote"; design, decisions 1 to 5, 7 to 9 and 12.

- [x] 2.1 The types of the new counts in `vote-data.ts`. A test in `vote-data.test.ts`: each new
  set has a row per municipality of the list, and each yearly one its years.

  Verify: `pnpm --filter app exec vitest run src/lib/vote-data.test.ts` passes, one test more;
  `pnpm run check` reports nothing.

  As built: the test was written while the update of task 1.11 ran and failed against the data file
  of before (no `bornAbroad`); it passes on the new file. 17 tests in the file, 16 before. It also
  checks that the jobs' years run from 2012 without a gap and that each row has its counts.
- [x] 2.2 The groups, for the 21 of before. Each definition names its group; `panelOf` makes the
  panel's groups from them. A test: the 21 definitions' groups, in the order population,
  election, languages, land.

  Verify: `pnpm --filter app exec vitest run src/lib/characteristics.test.ts` passes, 18 tests,
  the panel's lines as before.

  As built: done before task 2.1, while the update of task 1.11 ran, as it does not read the new
  counts. The group's type has the eight groups and stands with the keys in `texts/index.ts`;
  `panelOf` takes the four groups of before by their names. The test failed before the code (no
  group); 18 tests, the 17 of before unchanged, the test of every value written as before among
  them.
- [x] 2.3 The years that apply. Tests in `characteristics.test.ts`, one at a time: the vote of
  2016-02-28 takes those born abroad and the jobs of 2015; the newest vote day takes the jobs of
  2024; made-up files for "Those born abroad published later" and "The jobs published later"; a
  file whose farms have other years than its cattle is refused. Then `applyingTo`.

  Verify: each run alone passes.

  As built: 5 tests, 24 in the file. The three with made-up files were written while the update ran,
  and each failed before its code: those born abroad published later, the jobs published later, the
  farms of other years than the cattle (refused with a RangeError that names both). The made-up file
  has the seven new sets; two tests of before give their farms the years of their cattle. The two on
  the real file passed when written and failed against a mutant each: a year of the vote's own year
  taken, and the jobs taking the population's year. `Applying` has `bornAbroadYear` and `jobsYear`;
  the farms take `cattleYear`.
- [x] 2.4 A number with one decimal. A test of the new unit: 118.1121 is written "118.1", 0.05 as
  "0.1", none as "keine Angabe". Then the unit of decision 7.

  Verify: run alone, the test passes.

  As built: the unit is `rate`, one decimal. The test failed before the unit; it also writes 1234.56
  as "1'234.6" and a rate without a whole as "keine Angabe". 19 tests in the file. Done before tasks
  2.1 and 2.3, while the update of task 1.11 ran.
- [x] 2.5 Born abroad. Its name in three languages, its key, its definition, third in the order.
  Tests, one at a time: Zürich's 41.0744% for the vote of 2016-02-28; the name and the key.

  Verify: each run alone passes.

  As built: 3 tests, 27 in the file. Before it, the tests of the file were changed to name a
  characteristic by its key, not by its place among the others; their assertions stayed, and the 24
  passed before and after. Zürich's test failed before the definition (no characteristic
  `born-abroad`). The three tests of whole lists (names, groups, tracks) failed with one entry more
  and now hold it; the test of the name, the key and the date holds the three names. A third test
  has the spec's scenario of the later year: Zürich's 194,608 of 436,551. Two passed when written
  and failed against a mutant each: the inhabitants of the population's year (440,935), and the date
  of another year. The source `born-abroad` gives the year and the date "Ende 2015" of a limit's
  label.
- [x] 2.6 Religion, education and housing: seven definitions in three groups, with their names
  and keys. Tests, one at a time: Zürich's seven values; Hérémence's 37.50% and 25.00%; Castel San
  Pietro and Breggia share them, as the languages.

  Verify: each run alone passes.

  As built: 4 tests, 31 in the file. Zürich's seven values failed before the definitions; the three
  tests of whole lists hold seven entries more. Hérémence's test and the test of the seven keys and
  names in French and Italian passed when written and failed against a mutant each: the share of
  education out of all inhabitants (6 of 1,294), and a name swapped. The test of Castel San Pietro
  and Breggia passed when written; it checks the data file, whose groups the pipeline's test of a
  split covers, so no mutant of the app applies. The education's whole is the sum of the three
  levels the file holds.
- [x] 2.7 The jobs: four definitions, with their names and keys. Tests, one at a time: Zürich's
  four values for the vote of 2016-02-28; Bister's; Oberrieden without the two sectors; Rue
  without them, with its 50.00%; Linescio's four without a figure for the vote of 2026-03-08.

  Verify: each run alone passes.

  As built: 6 tests, 37 in the file. Zürich's four values failed before the definitions; the three
  tests of whole lists hold four entries more, and five tracks are logarithmic. Five passed when
  written and failed against a mutant: Bister (the jobs per 1,000), Oberrieden and Rue (a withheld
  sector as 0), Linescio (all jobs withheld as 0), and the test of the names in French and Italian
  with the jobs' own year (the population's year). The source `jobs` gives the year and the date
  "Ende 2015".
- [x] 2.8 The farms: two definitions, with their names and keys. Tests, one at a time: Zürich's
  0.1033 and 44.5614%; Oberrieden's 0.0 and no organic share; Meienried's 0.00%.

  Verify: each run alone passes.

  As built: 4 tests, 41 in the file. Zürich's two values failed before the definitions; the three
  tests of whole lists hold two entries more, and six tracks are logarithmic. Three passed when
  written and failed against a mutant each: Oberrieden (a whole of 1 where there is no farmland),
  Meienried (the farmland as the organic farmland), and the names in French and Italian (a name not
  translated). Both take the source `cattle`, whose year is the cattle's.
- [x] 2.9 The 35 together. Tests: their names in the spec's order; their groups, 9, 7, 4, 3, 2,
  2, 4 and 4; exactly six logarithmic tracks; every value written for every municipality of two
  votes without an error; in `texts.test.ts`, no French or Italian name is the German one; in
  `limits.test.ts` and `share-link.test.ts`, a track and every step written and read back for
  each of the 35.

  Verify: `pnpm run test` passes, 52 and about 185; `pnpm run lint && pnpm run check` report
  nothing.

  As built: `pnpm run test`: 52 and 185. The tests of the names, the groups and the tracks grew with
  each of the tasks 2.5 to 2.8 and now hold the 35, the eight groups and the six logarithmic tracks.
  New here: every value of the 35 written for every municipality of the votes of 2016-02-28 and
  2026-03-08, a figure or "keine Angabe" (147,700 values); in `limits.test.ts`, a track for each of
  the 35 and the labels of five new ones, "Im Ausland geboren (Ende 2015): von 0.00% bis 66.13%" and
  "Arbeitsplätze je 100 Einwohner (Ende 2015): von 5.2 bis 445.5" among them; in
  `share-link.test.ts`, the test of the keys, which failed from task 2.5 on, holds the 35 of the
  spec (the unit test of task 5.1). Each new test passed when written and failed against a mutant:
  the organic share turned round (refused), the jobs' date without "Ende", a French name left in
  German (`texts.test.ts`), and a rate written without its decimal in a link (the test of every
  step, which runs over the 35).

## 3. The panel

Spec `result-map`, "The characteristics of a municipality beside the map", "How the
characteristics are written" and "The sources of the characteristics"; design, decisions 3, 4
and 16.

- [x] 3.1 Eight groups. The test of "Zürich in 2016" in `result-map.spec.ts` gains the four new
  groups and the new lines. Seen to fail: the groups of before. Then the group headings in three
  languages and the panel.

  Verify: run alone, the test passes.

  As built: the test failed with the four groups of before (four headings missing) and passes with
  the eight and their 35 lines, as the spec's scenario has them. `panelOf` makes a group for each of
  `GROUPS`; a heading names its figures' year, the land's none, so its lines name theirs. The
  headings in French and Italian: "Religion, recensement 2000", "Formation, …", "Logement, …",
  "Travail fin 2015"; "Religione, censimento 2000", "Formazione, …", "Abitazione, …", "Lavoro fine
  2015".
- [x] 3.2 A line of another year. A unit test of `panelOf` with a made-up file, and a browser
  test of "A line of another year than its group" that serves the page a copy of
  `characteristics.json` without the year 2025 of those born abroad. Seen to fail: the line
  without a year.

  Verify: each run alone passes.

  As built: 2 tests. The unit test, with the made-up file, failed with the line without a year and
  passes with "Im Ausland geboren (Ende 2024): 30.00%"; the browser test serves the site's own file
  without the year 2025 of those born abroad and failed against the build of before with "Im Ausland
  geboren: 44.58%". A line names its date when its year is not its heading's; the date's wording by
  source, `dateOf`, now stands in `characteristics.ts` and serves a limit's label too. The text
  `ofYear` became `ofDate`.
- [x] 3.3 Without a figure, and with one decimal. Browser tests of "Without a figure"
  (Oberrieden) and of the extended "Meienried's cattle"; "The figures follow the vote" with
  "Arbeit Ende 2024".

  Verify: each run alone passes; against a mutant that writes a withheld count as 0, "Without a
  figure" fails.

  As built: one new test, "Without a figure" (Oberrieden: two sectors and the organic share), and
  three of before extended: the decimals at Meienried ("Arbeitsplätze je 100 Einwohner: 44.2",
  "Landwirtschaftsbetriebe je 1'000 Einwohner (2015): 76.9"), the figures that follow the vote
  (eight headings with "Arbeit Ende 2024", "Arbeitsplätze je 100 Einwohner: 124.9"), and Meienried's
  lines without a figure, now nine with its two withheld sectors. The three of before failed with
  their old expectations; the new one passed when written and failed against the built mutant that
  writes a withheld count as 0. The line of the area is found by its start, as "Nutzfläche" also
  holds "fläche".
- [x] 3.4 The sources. The panel's sentence gains "STATENT" in three languages; its test.

  Verify: run alone, the test passes;
  `pnpm --filter app exec playwright test result-map.spec.ts` passes, the budget tests of a
  click among them.

  As built: the test of the sources failed with the sentence of before and passes with "STATENT"
  after "STATPOP", in three languages. `result-map.spec.ts`: 59 passed, 2 more than before, the
  budget tests of a click among them, with 35 lines in the panel.

## 4. The limits

Spec `limits`, "Adding and removing a limit"; design, decisions 9 and 13.

- [x] 4.1 The list under headings. Tests of "The headings of the list" and "A heading without an
  entry left" in `limits.spec.ts`, one at a time. Seen to fail: no heading. Then the grouped list
  with its headings in three languages. The tests of before that count 21 and 20 entries count
  35 and 34.

  Verify: each run alone passes; `pnpm --filter app exec playwright test limits.spec.ts` passes.

  As built: 2 new tests, `limits.spec.ts`: 42 passed, 40 before. "The headings of the list" failed
  with a flat list (no heading) and passes with the eight headings and their 9, 7, 4, 3, 2, 2, 4 and
  4 entries; it also reads the headings in French and Italian. "A heading without an entry left"
  passed when written and failed against the built mutant that keeps a group without entries. The
  tests of before that count the entries count 35 and 34; the test of the names holds the 35 and
  reads step 500 of the six logarithmic tracks ("48.1" jobs per 100 inhabitants, "4.6" farms per
  1,000). The texts have one record `GROUP` of the eight headings; the panel takes its land heading
  from it, and `LAND_HEADING` is gone. "Religion" is the same word in German and French, which the
  test of untranslated texts now allows for that one text; without the allowance it fails.
- [x] 4.2 The new tracks. A test of "New characteristics with their tracks".

  Verify: run alone, the test passes.

  As built: the test passed when written, as `limits.test.ts` holds the same labels, and failed
  against the built mutant that writes a rate without its decimal ("von 5 bis 446").
- [x] 4.3 The list no wider than the page. A test in `small-screens.spec.ts`: in a window 360
  pixels wide, a vote's page in German, French and Italian with the limit of the longest name is
  no wider than the window. Seen to fail: the list wider than the page. Then the list's width.

  Verify: run alone, the test passes; `small-screens.spec.ts` and `compare.spec.ts` pass.

  As built: the test failed with the list wider than the page (382 pixels in German, 426 in French),
  and three tests of before on that width failed with it. The list takes at most the page's width.
  `small-screens.spec.ts` and `compare.spec.ts`: 45 passed, the comparison's budgets among them.

## 5. The link

Spec `share-link`, "The keys of the characteristics" and "The budget of a link"; design,
decision 14.

- [ ] 5.1 The keys. A unit test of "The keys"; browser tests of "A new characteristic in a link"
  and "A link of before", one at a time.

  Verify: each run alone passes; `share-link.test.ts` passes.
- [ ] 5.2 The budgets. The test "All 21 limits in the same tab" adds the 21 limits of before by
  their names, not the first 21 of the list; a test "All 35 limits in the same tab" with 170 ms.

  Verify: `pnpm --filter app exec playwright test share-link.spec.ts -g "limits in the same tab"`
  passes; the frames' longest times are in the note "As built". When the frame of 35 limits
  exceeds 170 ms in both measurements, stop and ask Q (design, decision 14).

## 6. The guide

Spec `reading-guide`, "Municipalities without a result or a figure explained", "The
characteristics explained" and "The sources"; design, decision 16.

- [x] 6.1 The sentences. Tests of "Jobs and farmland without a figure", "What the jobs count",
  the six tracks in "The dates of the figures" and "The six sources of the characteristics" in
  `guide.spec.ts`, one at a time. Seen to fail: the sentences of before. Then the guide's texts
  in three languages.

  Verify: each run alone passes; `pnpm --filter app exec playwright test guide.spec.ts` passes.

  As built: done while the update of task 1.11 ran, as the guide does not read the new counts. 15
  tests in the file, 3 of them new; the test of the tracks of before now names six. Each failed
  before its texts. "Die Merkmale" has three paragraphs: which figures a vote takes and the newest
  published before; what the jobs count, and that language, religion, education and housing have no
  newer figures per municipality; how a limit compares and the six tracks. In French the jobs are
  "emplois" of the "établissements", in Italian "impieghi" of the "stabilimenti"; Q reviews the two
  translations with the names. Two other tests of the file failed against the data file of before,
  as a vote's page already read the new counts; with the new file all 15 pass.

## 7. Docs and checks

- [ ] 7.1 `README.md`: the list of what the site shows names the new characteristics and their
  sources.

  Verify: `git diff README.md` shows that only.
- [ ] 7.2 All checks. `./scripts/verify-local.sh`.

  Verify: 11 of 11 steps pass; the counts are those planned (unit tests 52 and about 185, browser
  tests about 257, the pipeline's about 170), or the note says why not.
- [ ] 7.3 `CLAUDE.md`: the status names `add-more-characteristics` applied and 35
  characteristics; the code map changes the lines of the pipeline's `download.py`,
  `characteristics.py`, `update.py`, `write.py` and `made_up.py`, and of the app's
  `characteristics.ts`, `vote-data.ts`, the texts, `Limits.svelte`, `CharacteristicsPanel.svelte`
  and the tests; "Where things are" names `investigations/more-characteristics.md` and its
  scripts, and the data file's new counts.

  Verify: every file `git diff --stat main` names under `app/`, `pipeline/` and
  `investigations/` is in `CLAUDE.md`.

## Workflow follow-up

- Push, open the pull request, and watch its CI.
- Verify the change (`/openspec-verify-change`), then archive it: the roadmap's row 13 done, with
  income and the categories named as left open; `CLAUDE.md`'s status names it archived.
- After the merge, Q checks the published site on a phone: a vote's page loading, the list under
  its headings, and a limit on a new characteristic.
