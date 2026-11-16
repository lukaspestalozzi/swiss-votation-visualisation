# Tasks

All commands run from the repository root, on a branch started from an updated `main`.

**Before this change:**
- `pnpm run test`: 41 passed in the calculation and 80 in the app;
- the browser tests: 55;
- `uv run --directory pipeline --locked pytest`: 134 passed;
- `./scripts/verify-local.sh`: 11 of 11 steps.

**How tests are written:**
- Each test is written first and seen to fail before the code that makes it pass, one at a time.
- A test that passes when written is seen to fail against a mutant, and the task says so in a
  note "As built".
- The numbers of tests are the plan. Where a count differs while building, the note says so
  too.

**Temporary edits** made for a verification step are removed before the task is ticked.
`git status --short` then shows nothing of them.

**The figures** are those of `investigations/limits.md`; the scripts there are not changed while
applying, except to fix a bug, which the note names.

## 1. The selection in the calculation

In `calculation/`. Spec: `limits` ("Which municipalities remain", "The Swiss abroad"). Design:
decisions 2, 3, 16 and 19.

- [x] 1.1 New module `calculation/src/selection.ts` with `remainingMunicipalities(numbers,
  limits)`, exported from `src/index.ts`. Write five tests in `selection.test.ts`, with made-up
  numbers, one at a time:
  - a bound is included: values 1,000, 2,000 and 3,001 under a limit from 1,000 to 3,000 keep
    the first two;
  - a municipality without a figure is set aside by a narrowed limit;
  - and kept by a limit whose bounds lie at its values' smallest and largest;
  - two limits at once keep only what lies within both;
  - no limit keeps every number.

  Verify: `pnpm --filter calculation exec vitest run`: 46 passed; `pnpm run check` passes (no
  DOM, no framework).

  (As built: 47 passed, one more than planned. A limit with not one value per municipality now
  throws a RangeError naming both counts, with its test, where a missing value would otherwise
  have been set aside silently. The first and third tests failed first. The second, fourth and
  fifth passed when written, so each was checked against a mutant:
  - a municipality without a figure counted as within: the second fails;
  - only the first limit applied: the fourth fails;
  - nothing kept without a narrowed limit: the fifth and the third fail.

  Each mutant was undone. `pnpm run check` passes.)
- [x] 1.2 `entriesThatRemain(cantons, remaining, abroadCounted)` in the same module. Write four
  tests, one at a time:
  - with the switch on, a canton with a municipality left keeps its Swiss abroad;
  - a canton with none left loses them;
  - with the switch off, no Swiss abroad remain;
  - a selection with nothing left gives no entry, and `calculateResult` over it fails the vote.

  Verify: 50 passed.

  (As built: 51 passed, the one more of 1.1. The first two failed first. The third and fourth
  passed when written, so each was checked against a mutant:
  - the switch ignored: the third fails;
  - the Swiss abroad kept in a canton with nothing left: the fourth and the second fail.

  Each mutant was undone. The type of a canton's entries is `CantonEntries`: its municipalities
  as `[number, yes, no]`, its Swiss abroad as `[yes, no]` or `null`.)
- [x] 1.3 One test with a named vote: the entries of 2015-06-14, number 595
  (`reference-votes.json`), all municipalities remaining, with the switch off. They give 1,107,734
  yes and 1,113,998 no votes, and the majority of voters not reached
  (`investigations/limits.md`, 5). Verify: 51 passed; with the switch on, the same test reads the
  official 1,128,522 and 1,124,873.

  (As built: 52 passed, the one more of 1.1. The test reads both: the official result with the
  switch on, the figures without the Swiss abroad with it off. It tells the Swiss abroad apart by
  their BFS numbers from 9000 up, as the calculation cannot import the app's list. It passed when
  written; with the switch ignored it fails, and the mutant was undone. ESLint, Prettier and
  `tsc` pass on `calculation/src`.)

## 2. Values in units, and the tracks

In `app/src/lib/`. Specs: `limits` ("The track of a limit", "A logarithmic track", "The label of
a limit", "One definition for a limit"), `characteristics` (the modified "One definition per
characteristic"). Design: decisions 5, 16, 17 and 22.

- [x] 2.1 `format.ts`: a whole number of units written with its decimals, as `formatQuotient`
  writes them ("1998" with 2 decimals gives "19.98"). Write its test first, with the edges 0, 5,
  1,000 and 396,955. Verify: `pnpm --filter app exec vitest run src/lib/format.test.ts` passes,
  with 1 test more than before.

  (As built: `formatUnits(units, decimals)`; 9 tests of `format.ts` pass, 1 more, and the app's
  81. The test failed first. `formatQuotient` now writes its rounded units through it, so the
  two cannot differ, and its tests pass unchanged. Like the other functions it refuses a number
  of units that is not whole from zero.)
- [x] 2.2 `characteristics.ts`: each definition gains its scale ("linear" or "logarithmic"; four
  logarithmic) and the units of a value, by the rounding of `format.ts`. `written` writes those
  units. Write two tests, one at a time:
  - the scales of the 21 definitions;
  - for the votes 5960 and 6400, every municipality's every value written through the units
    equals what `written` gave before this task, kept in the test as the old function's output.

  Verify: the app's unit tests pass, 2 more than before; the panel's browser tests still pass
  (`pnpm run build && pnpm run test:e2e`, 55).

  (As built: 83 app tests, 2 more than after 2.1; 55 browser tests; lint and check pass.
  - The scales test failed first.
  - The second test passed before and after the change of `written`, and fails against two
    mutants: cattle with 2 decimals ("0.31" for "0.308") and a share with a factor of 10 for 100
    ("1.28%" for "12.77%"). Both were undone.
  - `format.ts` gains `quotientUnits`, the rounding `formatQuotient` already did, which
    `formatQuotient` now uses.
  - `characteristics.ts` gains `unitsOf` and `writeUnits`; `written` is the two together.
  - One difference, for a case the data never holds: a value with no whole, such as a share of 0
    inhabitants, was written "–" and is now "keine Angabe", a missing figure.)
- [x] 2.3 New module `limits.ts`: a limit's track from a definition, the file and the vote's
  years (decision 17). Write four tests against `characteristics.json`, one at a time:
  - "Ausländeranteil" of 5960: ends 0.00% and 61.10%, steps 327 and 328 at 19.98% and 20.04%,
    step 999 at 61.04%;
  - "Einwohner" of 5960: ends 31 and 396,955, step 500 at 3,508;
  - "Rinder je Einwohner" of 5960: step 0 at 0.000, step 1 at 0.001, step 500 at 0.090;
  - "65 Jahre und älter" of 5960 runs from 5.81% to 36.16%, and "0–17 Jahre" from 2.04% to
    35.96%.

  Verify: 4 tests more pass.

  (As built: 87 app tests, 4 more. The first three failed first: no module; the linear middle
  198'493 for 3'508; NaN on a track that starts at 0. The fourth passed when written, and fails,
  with the three others, against a mutant that reads every track's values from "0–17 Jahre"; the
  mutant was undone. A track keeps each municipality's units in the order of the file's list,
  its smallest and largest value and its smallest above zero. `characteristics.ts` gains
  `countsAt`, the counts by index, which `countsOf` now uses, so that a track does not look up
  each of the 2,110 municipalities by number.)
- [x] 2.4 The label of a limit, "<name> (<date>): von … bis …". Write one test with the labels of
  the spec's scenario "Labels of a vote" (6400: SVP, Italienisch, Fläche) and "Einwohner (Ende
  2015): von 3'508 bis 396'955". Verify: 1 test more passes.

  (As built: 88 app tests, 1 more; lint and check pass. The test failed first; it also checks the
  cattle's step 1, "von 0.000 bis 0.001". `labelOf(track, lower, upper)` takes the two steps; a
  track keeps the date of its figures as the label writes it. The texts are in `texts.ts`: the
  population's "Ende <year>", the census's "Volkszählung <year>", and the election's
  "Nationalratswahl <year>", the panel's heading.)

## 3. The page holds its entries

Specs: `verdicts` (the modified "The page holds its result"), `result-map` (unchanged behaviour
of the map). Design: decisions 20 and 21.

- [x] 3.1 In `result-map.ts`, `mapFiguresOf` becomes `voteEntriesOf`. Per canton it gives the
  municipalities' `[number, yes, no]` and the Swiss abroad's `[yes, no]` or none, with the numbers
  without a result and the kind's `Majorities`, and keeps every check. Adapt its tests first,
  then the code: the existing three checks, and one new test that 5960's entries hold 12 Swiss
  abroad and the 2,103 municipalities. Verify: the app's unit tests pass, 1 more than before.

  (As built: 89 app tests, 1 more. The adapted tests and the new one failed first, with no
  function. `voteEntriesOf` gives `{ cantons, withoutResult }`, each canton a `CantonEntries` of
  the calculation. The kind's `Majorities` belong to the vote, not to its file, so the page's
  load function returns them beside the entries (3.2) instead of `voteEntriesOf`. The number of
  Swiss abroad, which the map's sentence names, is that of the cantons with an entry of them.
  The two tests of `vote-data.test.ts` that used `mapFiguresOf` use `voteEntriesOf`. The new
  test also checks the 7 municipalities without a result and the 26 cantons.)
- [x] 3.2 `+page.server.ts` returns the entries. `ResultMap.svelte` takes them and flattens the
  municipalities once for its colours, counts and details. The two loaders move to a module of
  the route, `loaders.ts`. Verify:
  - `pnpm run build && pnpm run test:e2e`: 55 passed, unchanged, among them "loading once" and
    the two budget tests;
  - the HTML of `/votes/5960/` is under 60 KB (`wc -c`);
  - the note gives its size.

  (As built: 55 browser tests pass, "loading once" and the two budget tests among them; check
  and lint pass after `svelte-kit sync`, which writes the load function's new types and runs on
  every install. The HTML of `/votes/5960/` is 44,741 bytes, 16,188 gzipped; it was 43,533 and
  15,855. The page's data holds `entries` (in place of `map`) and `majorities`; `ResultMap`
  flattens the cantons' municipalities once, and counts the Swiss abroad for its sentence from
  the cantons that have them.)

## 4. The result of the selection

In `app/src/lib/`. Specs: `verdicts` ("The result of the selection", "The cantons under a
selection", the modified "The table of the cantons"). Design: decisions 9, 10 and 21.

- [x] 4.1 In `vote-page.ts`, the part that writes figures, verdicts and the table from a
  `Result` is shared by the build and the browser. A canton of the vote with nothing left gets
  "–", "keine Gemeinde übrig" and "–". Write the test of that row first. Verify: 1 test more
  passes, and the existing tests of `vote-page.ts` pass unchanged.

  (As built: 90 app tests, 1 more; lint and check pass. The test failed first. `judgedOf(result,
  majorities, cantonsOfVote)` gives a `ResultShown`: the figures, verdicts, outcome and table,
  the table with a row for each canton of the vote in the order of the constitution. `Judged`,
  the vote's own, is a `ResultShown` with its turnout, from `judgedOfRows`, the former
  `judgedOf`. The existing tests pass unchanged. The text is `NOTHING_LEFT` in `texts.ts`.)
- [x] 4.2 The six selections of `investigations/limits.md`, 5, from the data files: the limits,
  the units, `remainingMunicipalities`, `entriesThatRemain` and `calculateResult` give every
  figure of the table. That is the yes and no votes, the yes share to 0.0001 points, the
  cantonal votes, the verdict and the municipalities that remain. Write them as one test per
  row, one at a time, in `limits.test.ts`. Verify: 6 tests more pass.

  (As built: 96 app tests, 6 more. The first failed first, without `remainingUnder` in
  `limits.ts`, which turns each limit's track and steps into the calculation's `Limit`. The page
  uses it too. The other five passed when written; each fails against at least one mutant:
  - the upper bound one step higher: rows 3 and 6;
  - the lower bound one step higher: rows 3, 5 and 6;
  - the switch ignored: row 2;
  - Italian reading the Romansh column: row 4, which neither bound mutant changes, as no
    municipality lies between those steps.

  Each mutant was undone. Row 6 also checks that Rüti bei Lyssach is set aside, and rows 3 and 6
  that BS and NW have no cantonal vote.)

## 5. The limits on the page

`Limits.svelte`, `+page.svelte`, `ResultMap.svelte`, `texts.ts`. Specs: `limits` (all but "The
budget of the limits"), `verdicts` and `result-map` (their added and modified scenarios),
`reading-guide` ("The sentence at the limits", with the link to `/guide/` still leading nowhere
until group 7). Design: decisions 1 to 4, 6, 7, 9 to 14, 18 and 21.

- [x] 5.1 The section: heading, sentence, "Merkmal hinzufügen", adding and removing, the two
  sliders with their names, `aria-valuetext` and crossing rule, the label. Write the browser tests
  of "The limits on a vote's page" (2), "Adding and removing a limit" (2), "The track of a limit"
  (2), "A logarithmic track", "The two bounds" (2) and "The label of a limit", one at a time.
  Verify: `pnpm run build && pnpm run test:e2e`: 65 passed.

  (As built: 65 passed, in the new `app/e2e/limits.spec.ts`. The first and third failed first: no
  section, then no limit shown. The other eight passed when written, and each fails against at
  least one of five mutants, each built and undone:
  - "Entfernen" does nothing: 4;
  - the bounds may cross: 9;
  - the two sliders' names swapped: 5 to 9;
  - every vote takes the figures of 2016-02-28: 10;
  - every track linear: 6 and 7;
  - for 2, the heading put above the tie-break question's block.

  The sentence is there, without its link: SvelteKit's typed `resolve` refuses `/guide/` until
  the route exists, and 7.2 adds the link. `Limits.svelte` holds the list, the limits and the
  switch; the page holds their state and loads the characteristics through `loaders.ts`. A
  slider's `aria-valuetext` is its bound as written. "Entfernen" is named "Entfernen: <name>"
  for assistive technology, and the list's first option, "–", is no characteristic. The tests
  set a slider's step with `fill`, which sends `input` as a drag does; group 6 drags by pointer.)
- [x] 5.2 The selection and the switch: the page derives the remaining municipalities, the
  entries, the result and the set aside. "Mit Ihrer Auswahl" stands beside the vote's result, and
  the table follows. Write the browser tests one at a time:
  - of `limits`: "Which municipalities remain" (the two scenarios with a vote), "The Swiss abroad"
    (2), "Recalculated at once";
  - of `verdicts`: "The entries a selection needs are on the page", "The cantons of a selection",
    "Back to the real cantons", and the five of "The result of the selection".

  Verify: 78 passed.

  (As built: 76 browser tests, and 97 unit tests of the app.
  - **Counts:** 11 tests for the 12 scenarios left. "Back to the real cantons" needs "Zurück zum
    echten Ergebnis" and moves to 5.4. One test covers both "Switched off" of `limits` and
    "Without the Swiss abroad" of `verdicts`.
  - **Map:** the set-aside municipalities turn `#2c2c2c` here already, as these scenarios see
    them on the map; 5.3 adds the legend and the details.
  - **First failure:** the first test failed first, without "Mit Ihrer Auswahl"; the ten after it
    passed when written.
  - **Mutants**, each built and undone. Each of the ten fails against at least one:
    - the map ignoring the set-aside: the three that look at the map;
    - the switch ignored: the two without the Swiss abroad;
    - the limits ignored in the result: the six with figures of a selection;
    - a selection always applying: "a limit not moved";
    - the table always the vote's own: the two with the table.
  - **One test written wrong, then fixed:** "a limit not moved" failed because Playwright's
    `toHaveText` takes no matcher for an entry of a list. The page was right.
  - **`limits.ts`** gains `isNarrowed`, the calculation's rule from a limit's steps, with a unit
    test that failed first. The page shows "Mit Ihrer Auswahl" while a limit is narrowed by it
    or the switch is off.
  - **The drag test** finds the slider's step by pointer, correcting the pointer while it is
    pressed, as a pixel holds about two steps.)
- [x] 5.3 The map: set-aside municipalities in `#2c2c2c`, hatching kept, the legend's eleventh
  entry, the details' "Nicht in der Auswahl.". Write the browser tests of "The legend of a
  selection", "Set aside and kept", "Without a result and without a figure" and "Zürich set
  aside", one at a time. Verify: 82 passed.

  (As built: 80 browser tests, two fewer than planned, as 5.2 has two fewer.
  - **Moved to 5.4:** the end of "The legend of a selection", the ten entries again after
    "Zurück zum echten Ergebnis".
  - **Failed first:** the legend's eleventh entry and the details' line. The two of the fills
    passed when written: 5.2 colours the set-aside. Both fail against the map ignoring the
    set-aside and against the hatching turning dark grey under a selection. Each mutant was
    built and undone.
  - **A helper moved:** the browser tests' `pointIn` moved from `result-map.spec.ts` to
    `app/e2e/pointing.ts`, so that `limits.spec.ts` can point at Zürich too; the map's 41 tests
    pass with it.)
- [x] 5.4 The count, "Zurück zum echten Ergebnis", a fresh page per vote, and the characteristics
  loading or failing. Write the browser tests of "The number of municipalities that remain" (3),
  "Back from a selection", "To another vote" and "The characteristics' file is missing", one at a
  time. Verify: 88 passed.

  (As built: 87 browser tests, with the seven of this task: the six planned and "Back to the real
  cantons" from 5.2. "Back from a selection" also checks the legend's ten entries again, the end
  of 5.3's legend scenario.
  - **Failed first:** the first count and the return to the real result.
  - **Mutants** for the five that passed when written, each built and undone:
    - the count ignoring the limits: the other two counts;
    - the return clearing only the switch: "Back to the real cantons";
    - the switch off when a page opens: "To another vote";
    - the failure's message gone: the missing file.
  - **A limit of the page's state:** SvelteKit keeps a page's component when it moves from one
    vote straight to another under the same route, and its limits with it. No such link exists:
    every way goes through the start page, which the test takes. A change that links votes
    directly, such as #12, must reset them.
  - **Counting:** the page counts the municipalities with an entry and those of them that
    remain; `Limits.svelte` writes the sentence, and shows the button while there is a limit or
    the switch is off.)
- [x] 5.5 The scenario "A bound is included" with made-up values is covered by 1.1, and "The
  limits follow the definitions" of `characteristics` by one browser test: the list's 21 names in
  order, and the four logarithmic tracks, at step 500 not the linear middle. Verify: 89 passed.

  (As built: 88 browser tests, one fewer than planned, the one 5.2 has fewer. The test reads each
  track's step 500 from its slider's `aria-valuetext`: 3'508, 104, 11.85 km² and 0.090, and
  30.55% for the foreigners, a linear track. It passed when written; with the area's track made
  linear it reads "219.47 km²" and fails. The mutant was built and undone.)
- [x] 5.6 Look at `/votes/5960/` and `/votes/5950/` in the built site, in windows 1,280 and 800
  pixels wide: add two limits, drag, switch, reset; then the same with the keyboard alone.
  Verify: screenshots in the scratchpad show the section between the outcome and the map, "Mit
  Ihrer Auswahl" beside the result at 1,280 and below it at 800, and the dark grey. The note
  names what was looked at.

  (As built: looked at on 2026-11-16 with a script on the built site; screenshots in the
  scratchpad, `look/`. In both widths the section stands between the outcome and the map, the
  dark grey and the table "Mit Ihrer Auswahl" show, and `/votes/5950/` fails without the Swiss
  abroad and returns.
  - **The width:** "Mit Ihrer Auswahl" stands beside the result at 800 as at 1,280, two columns
    of 384 pixels, which fit. Decision 9 of the design sets the break at 640; this task's "below
    it at 800" was my error.
  - **The keyboard found a defect.** An arrow key on the closed list changed its choice at once
    in Chromium, and each change added a limit: two presses, two limits. Q chose, on 2026-11-16,
    a button "Hinzufügen" beside the list. The spec's "Adding and removing a limit" says so and
    gains the scenario "The keyboard only chooses"; decision 6 records it. Its browser test
    failed first (two limits) and passes now; the tests add a limit with the button. 89
    browser tests.
  - **With the button, the keyboard alone works:**
    1. the arrows choose and Tab reaches "Hinzufügen", where Enter adds;
    2. each slider moves step by step with the arrows;
    3. Tab reaches "Entfernen" and the switch, which Space changes;
    4. Enter on "Zurück zum echten Ergebnis" returns.)

## 6. The budget of the limits

`app/e2e/`. Spec: `limits` ("The budget of the limits"). Design: decision 8 and "Tests".

- [x] 6.1 The measuring script of the map's budget tests also measures the frames after `input`
  and `change` events. Write the test "Dragging a bound": add "Einwohner", rest 50 ms on the
  lower thumb, press, drag across the whole track and back in 40 moves, release; no frame over
  16 ms. Verify: it passes 10 times in a row after a build
  (`pnpm --filter app exec playwright test -g "Dragging a bound" --repeat-each 10`); the note
  gives the longest frame of each run.

  (As built: the test is "the budget of dragging" in `limits.spec.ts`, and the measuring script
  moved to `app/e2e/frames.ts`, which both test files use.
  - **The first series failed:** two workers, ten runs at a time. Longest frames 9.0 to 19.3
    ms; one run failed its second measurement too. Investigated: `investigations/limits.md`,
    answer 8, with `measure_drag.cjs` and `profile_drag.cjs`.
    - With one worker the drag passes (8.3 to 11.1 ms); a second test at the same time
      stretches the frames.
    - Most of the page's own cost was Svelte building all 2,110 fills again at every step and
      running the 2,110 paths' effects again.
  - **Fixed, Q's choice on 2026-11-16** (repaint the changes, keep 16 ms):
    - the map's fills hold the class colours only;
    - an effect paints only the municipalities whose state changed, through a map from number
      to path built once;
    - the page flattens the municipalities with an entry once.
  - **After it,** two series of ten runs with two workers, without a retry, all passed: longest
    frames 7.1 to 12.9 ms and 6.9 to 12.4 ms. The limits' and the map's browser tests pass.)
- [x] 6.2 Write the test "Jumps", with the inputs of its scenario, each after a pause of 50 ms;
  no frame over 50 ms. Verify: 10 passes in a row, as 6.1.

  (As built: "the budget of jumps" in `limits.spec.ts`, with the inputs of the scenario as
  amended in 5.1's place: a limit added with "Hinzufügen" twice, a bound moved to step 327, the
  switch off and on, a limit removed, "Zurück zum echten Ergebnis". The pointer rests on each
  control 50 ms before its click. Ten runs in a row with two workers, without a retry, all
  passed; the longest frame per run was 9.2 to 17.2 ms, far under the 50 ms.)
- [x] 6.3 Both in a `describe` with one retry, as the map's budget tests. Each is checked against
  its mutant, each mutant undone after its run:
  - a busy wait of 20 ms in the handler of a slider's `input`: "Dragging a bound" fails in both
    runs;
  - one of 60 ms in the switch's handler: "Jumps" fails in both runs.

  Verify: both fail as described; `git diff app/src` shows no mutant afterwards;
  `pnpm run test:e2e`: 91 passed.

  (As built: both fail in both runs, and Playwright reports each "1 failed":
  - a busy wait of 20 ms in `move`, the sliders' handler: the drag at 34.3 and 28.8 ms;
  - one of 60 ms on the switch's `change`: the jumps at 63.6 and 62.9 ms.

  `git diff app/src` shows nothing afterwards. `pnpm run test:e2e`: 92 passed, one more than
  planned: the test that reopens a range closed at the end of its track, from Copilot's review
  of PR #12.)

## 7. The reading guide

`app/src/routes/guide/`, `texts.ts`, the start page. Spec: `reading-guide`. Design: decision 11
and 23.

- [x] 7.1 The page `/guide/` with its seven sections, the sentences the spec fixes, and the sources
  from `map.json` at build time. Write the browser tests of "The page and its sections", "The
  official result first", "The rule in plain words", "Municipalities, not people", "The switch
  explained", "Without a figure", "The dates of the figures" and "The sources on 2026-11-16", one
  at a time. Verify: 99 passed; the page is in `app/build/swiss-votation-visualisation/guide/`.

  (As built: 100 browser tests, one more than planned, the one of the review; the page is in
  `app/build/swiss-votation-visualisation/guide/`. The tests are in `app/e2e/guide.spec.ts`.
  - **Failed first:** the first, without a page.
  - **The texts** are in `texts.ts`: the six sections as `GUIDE_SECTIONS`, and the sources.
    "The rule in plain words" first passed against a sentence that went on after "keine
    Standesstimme" with a semicolon. The text now ends there with a full stop, as the spec
    quotes it; the test that asks for it failed against the old text.
  - **Mutants** for the seven that passed when written, each built and undone:
    - the sections without their paragraphs: the six that check a sentence;
    - the lakes' year read one too high from the map's file: the sources.
  - **The sources:** the list's date and the lakes' set come from `map.json` at build time,
    through `+page.server.ts`. The test also requests `data/sources.json` through the page's
    link.)
- [ ] 7.2 The start page's link, and the vote page's link of 5.1 now leads to the guide. Write the
  browser tests of "From the start page" and "The sentence on a vote's page". Verify: 101 passed,
  and the existing test that no page requests another server covers `/guide/` (add it to its
  list of pages if it names them; the note says which).

## 8. Documentation and the whole

- [ ] 8.1 `openspec/config.yaml`:
  - hard constraint 3 gets the budget: 16 ms per frame while a limit is dragged, 50 ms per
    frame for a jump;
  - the glossary's "Set aside" says dark grey;
  - "Selection" adds the Swiss abroad of each canton in which a municipality remains, while the
    switch counts them.

  Verify: `openspec validate --all --strict` passes, and `openspec instructions proposal
  --change add-limits` shows the new text.
- [ ] 8.2 `README.md`: what the site shows (the limits, the guide). `docs/roadmap.md`: #8's row
  names the decisions and "proposed" until it is archived, and the investigations' list names
  `investigations/limits.md`. Verify: both name `add-limits` and `investigations/limits.md`.
- [ ] 8.3 Update `CLAUDE.md` for every file this change adds, moves or changes:
  - the status;
  - "Where things are": the investigations' row names `limits.md` and its scripts;
  - the code map: `selection.ts` and its test, `limits.ts` and its test, `Limits.svelte`,
    `loaders.ts`, the guide's route, the changed `result-map.ts`, `vote-page.ts`,
    `characteristics.ts`, `format.ts`, `ResultMap.svelte`, `+page.svelte` and
    `+page.server.ts`, and the browser tests' files.

  Verify: `grep -n "selection.ts\|limits.ts\|Limits.svelte\|loaders.ts\|guide" CLAUDE.md` shows
  each, and no line names `mapFiguresOf`.
- [ ] 8.4 Run `./scripts/verify-local.sh`. Verify: 11 of 11 steps pass, with 51 tests of the
  calculation, 96 of the app, 101 browser tests and 134 of the
  pipeline.

## Workflow follow-up

- `/openspec-verify-change`, then `/openspec-archive-change`. The archive:
  - merges the new specs `limits` and `reading-guide`, and the deltas of `verdicts`, `result-map`
    and `characteristics`, into `openspec/specs/`;
  - marks #8 done in `docs/roadmap.md`.
- After the merge, check on the published site, on a computer and a phone, as the design's
  "Migration Plan" says.
