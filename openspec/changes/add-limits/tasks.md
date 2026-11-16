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

- [ ] 1.1 New module `calculation/src/selection.ts` with `remainingMunicipalities(numbers,
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
- [ ] 1.2 `entriesThatRemain(cantons, remaining, abroadCounted)` in the same module. Write four
  tests, one at a time:
  - with the switch on, a canton with a municipality left keeps its Swiss abroad;
  - a canton with none left loses them;
  - with the switch off, no Swiss abroad remain;
  - a selection with nothing left gives no entry, and `calculateResult` over it fails the vote.

  Verify: 50 passed.
- [ ] 1.3 One test with a named vote: the entries of 2015-06-14, number 595
  (`reference-votes.json`), all municipalities remaining, with the switch off. They give 1,107,734
  yes and 1,113,998 no votes, and the majority of voters not reached
  (`investigations/limits.md`, 5). Verify: 51 passed; with the switch on, the same test reads the
  official 1,128,522 and 1,124,873.

## 2. Values in units, and the tracks

In `app/src/lib/`. Specs: `limits` ("The track of a limit", "A logarithmic track", "The label of
a limit", "One definition for a limit"), `characteristics` (the modified "One definition per
characteristic"). Design: decisions 5, 16, 17 and 22.

- [ ] 2.1 `format.ts`: a whole number of units written with its decimals, as `formatQuotient`
  writes them ("1998" with 2 decimals gives "19.98"). Write its test first, with the edges 0, 5,
  1,000 and 396,955. Verify: `pnpm --filter app exec vitest run src/lib/format.test.ts` passes,
  with 1 test more than before.
- [ ] 2.2 `characteristics.ts`: each definition gains its scale ("linear" or "logarithmic"; four
  logarithmic) and the units of a value, by the rounding of `format.ts`. `written` writes those
  units. Write two tests, one at a time:
  - the scales of the 21 definitions;
  - for the votes 5960 and 6400, every municipality's every value written through the units
    equals what `written` gave before this task, kept in the test as the old function's output.

  Verify: the app's unit tests pass, 2 more than before; the panel's browser tests still pass
  (`pnpm run build && pnpm run test:e2e`, 55).
- [ ] 2.3 New module `limits.ts`: a limit's track from a definition, the file and the vote's
  years (decision 17). Write four tests against `characteristics.json`, one at a time:
  - "Ausländeranteil" of 5960: ends 0.00% and 61.10%, steps 327 and 328 at 19.98% and 20.04%,
    step 999 at 61.04%;
  - "Einwohner" of 5960: ends 31 and 396,955, step 500 at 3,508;
  - "Rinder je Einwohner" of 5960: step 0 at 0.000, step 1 at 0.001, step 500 at 0.090;
  - "65 Jahre und älter" of 5960 runs from 5.81% to 36.16%, and "0–17 Jahre" from 2.04% to
    35.96%.

  Verify: 4 tests more pass.
- [ ] 2.4 The label of a limit, "<name> (<date>): von … bis …". Write one test with the labels of
  the spec's scenario "Labels of a vote" (6400: SVP, Italienisch, Fläche) and "Einwohner (Ende
  2015): von 3'508 bis 396'955". Verify: 1 test more passes.

## 3. The page holds its entries

Specs: `verdicts` (the modified "The page holds its result"), `result-map` (unchanged behaviour
of the map). Design: decisions 20 and 21.

- [ ] 3.1 In `result-map.ts`, `mapFiguresOf` becomes `voteEntriesOf`. Per canton it gives the
  municipalities' `[number, yes, no]` and the Swiss abroad's `[yes, no]` or none, with the numbers
  without a result and the kind's `Majorities`, and keeps every check. Adapt its tests first,
  then the code: the existing three checks, and one new test that 5960's entries hold 12 Swiss
  abroad and the 2,103 municipalities. Verify: the app's unit tests pass, 1 more than before.
- [ ] 3.2 `+page.server.ts` returns the entries. `ResultMap.svelte` takes them and flattens the
  municipalities once for its colours, counts and details. The two loaders move to a module of
  the route, `loaders.ts`. Verify:
  - `pnpm run build && pnpm run test:e2e`: 55 passed, unchanged, among them "loading once" and
    the two budget tests;
  - the HTML of `/votes/5960/` is under 60 KB (`wc -c`);
  - the note gives its size.

## 4. The result of the selection

In `app/src/lib/`. Specs: `verdicts` ("The result of the selection", "The cantons under a
selection", the modified "The table of the cantons"). Design: decisions 9, 10 and 21.

- [ ] 4.1 In `vote-page.ts`, the part that writes figures, verdicts and the table from a
  `Result` is shared by the build and the browser. A canton of the vote with nothing left gets
  "–", "keine Gemeinde übrig" and "–". Write the test of that row first. Verify: 1 test more
  passes, and the existing tests of `vote-page.ts` pass unchanged.
- [ ] 4.2 The six selections of `investigations/limits.md`, 5, from the data files: the limits,
  the units, `remainingMunicipalities`, `entriesThatRemain` and `calculateResult` give every
  figure of the table. That is the yes and no votes, the yes share to 0.0001 points, the
  cantonal votes, the verdict and the municipalities that remain. Write them as one test per
  row, one at a time, in `limits.test.ts`. Verify: 6 tests more pass.

## 5. The limits on the page

`Limits.svelte`, `+page.svelte`, `ResultMap.svelte`, `texts.ts`. Specs: `limits` (all but "The
budget of the limits"), `verdicts` and `result-map` (their added and modified scenarios),
`reading-guide` ("The sentence at the limits", with the link to `/guide/` still leading nowhere
until group 7). Design: decisions 1 to 4, 6, 7, 9 to 14, 18 and 21.

- [ ] 5.1 The section: heading, sentence, "Merkmal hinzufügen", adding and removing, the two
  sliders with their names, `aria-valuetext` and crossing rule, the label. Write the browser tests
  of "The limits on a vote's page" (2), "Adding and removing a limit" (2), "The track of a limit"
  (2), "A logarithmic track", "The two bounds" (2) and "The label of a limit", one at a time.
  Verify: `pnpm run build && pnpm run test:e2e`: 65 passed.
- [ ] 5.2 The selection and the switch: the page derives the remaining municipalities, the
  entries, the result and the set aside. "Mit Ihrer Auswahl" stands beside the vote's result, and
  the table follows. Write the browser tests one at a time:
  - of `limits`: "Which municipalities remain" (the two scenarios with a vote), "The Swiss abroad"
    (2), "Recalculated at once";
  - of `verdicts`: "The entries a selection needs are on the page", "The cantons of a selection",
    "Back to the real cantons", and the five of "The result of the selection".

  Verify: 78 passed.
- [ ] 5.3 The map: set-aside municipalities in `#2c2c2c`, hatching kept, the legend's eleventh
  entry, the details' "Nicht in der Auswahl.". Write the browser tests of "The legend of a
  selection", "Set aside and kept", "Without a result and without a figure" and "Zürich set
  aside", one at a time. Verify: 82 passed.
- [ ] 5.4 The count, "Zurück zum echten Ergebnis", a fresh page per vote, and the characteristics
  loading or failing. Write the browser tests of "The number of municipalities that remain" (3),
  "Back from a selection", "To another vote" and "The characteristics' file is missing", one at a
  time. Verify: 88 passed.
- [ ] 5.5 The scenario "A bound is included" with made-up values is covered by 1.1, and "The
  limits follow the definitions" of `characteristics` by one browser test: the list's 21 names in
  order, and the four logarithmic tracks, at step 500 not the linear middle. Verify: 89 passed.
- [ ] 5.6 Look at `/votes/5960/` and `/votes/5950/` in the built site, in windows 1,280 and 800
  pixels wide: add two limits, drag, switch, reset; then the same with the keyboard alone.
  Verify: screenshots in the scratchpad show the section between the outcome and the map, "Mit
  Ihrer Auswahl" beside the result at 1,280 and below it at 800, and the dark grey. The note
  names what was looked at.

## 6. The budget of the limits

`app/e2e/`. Spec: `limits` ("The budget of the limits"). Design: decision 8 and "Tests".

- [ ] 6.1 The measuring script of the map's budget tests also measures the frames after `input`
  and `change` events. Write the test "Dragging a bound": add "Einwohner", rest 50 ms on the
  lower thumb, press, drag across the whole track and back in 40 moves, release; no frame over
  16 ms. Verify: it passes 10 times in a row after a build
  (`pnpm --filter app exec playwright test -g "Dragging a bound" --repeat-each 10`); the note
  gives the longest frame of each run.
- [ ] 6.2 Write the test "Jumps", with the inputs of its scenario, each after a pause of 50 ms;
  no frame over 50 ms. Verify: 10 passes in a row, as 6.1.
- [ ] 6.3 Both in a `describe` with one retry, as the map's budget tests. Each is checked against
  its mutant, each mutant undone after its run:
  - a busy wait of 20 ms in the handler of a slider's `input`: "Dragging a bound" fails in both
    runs;
  - one of 60 ms in the switch's handler: "Jumps" fails in both runs.

  Verify: both fail as described; `git diff app/src` shows no mutant afterwards;
  `pnpm run test:e2e`: 91 passed.

## 7. The reading guide

`app/src/routes/guide/`, `texts.ts`, the start page. Spec: `reading-guide`. Design: decision 11
and 23.

- [ ] 7.1 The page `/guide/` with its seven sections, the sentences the spec fixes, and the sources
  from `map.json` at build time. Write the browser tests of "The page and its sections", "The
  official result first", "The rule in plain words", "Municipalities, not people", "The switch
  explained", "Without a figure", "The dates of the figures" and "The sources on 2026-11-16", one
  at a time. Verify: 99 passed; the page is in `app/build/swiss-votation-visualisation/guide/`.
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
