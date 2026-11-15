# Tasks

All commands run from the repository root, on a branch started from an updated `main`.

**Before this change:**
- `pnpm run test`: 41 passed in the calculation and 37 in the app;
- `uv run --directory pipeline --locked pytest`: 81 passed;
- the browser tests: 14;
- `./scripts/verify-local.sh`: 11 of 11 steps.

**How tests are written:**
- Each test is written first and seen to fail before the code that makes it pass, one at a time.
- A test that passes when written is seen to fail against a mutant, and the task says so in a
  note "As built".
- The numbers of tests are the plan. Where a count differs while building, the note says so
  too.

**Temporary edits** made for a verification step are removed before the task is ticked.
`git status --short` then shows nothing of them.

## 1. The pipeline writes the map's data

In `pipeline/`. Specs: `municipalities` (the boundaries, the cantons and the outline, the lakes)
and `vote-data` (the record of the sources). Design: decisions 1 to 3, 11, 13 and 14.

- [x] 1.1 Add `pyshp[stubs]==3.1.6` to the pipeline's dependencies and run
  `uv lock --directory pipeline`. Verify:
  - `uv run --directory pipeline --locked python -c "import shapefile; print(shapefile.__version__)"`
    prints `3.1.6`;
  - `uv run --directory pipeline --locked python -c "import importlib.metadata as m; print(m.metadata('pyshp')['License-Expression'])"`
    prints `MIT`;
  - `uv run --directory pipeline --locked mypy` passes.
- [x] 1.2 In `pipeline/tests/made_up.py`, write the made-up map sources in memory with pyshp's
  writer, as ZIPs in the shape of the real ones (`investigations/map-data.md`):
  - the register's municipalities: one square per made-up municipality, Meienried (389)
    included;
  - the 26 cantons as squares;
  - the country: one outer ring around them and one hole;
  - a ThemaKart set with the two lake layers, one lake each, the first reaching past the
    country.

  Verify: `uv run --directory pipeline --locked pytest` still passes 81, and
  `uv run --directory pipeline --locked mypy` passes.
- [x] 1.3 New module `pipeline/src/pipeline/boundaries.py` reads the register's municipalities
  against the list:
  - every number of the list once;
  - coordinates rounded to the metre, from the top left of the rectangle around the outline;
  - SVG path data: a first point, then relative steps.

  Write four tests, one at a time:
  - the made-up boundaries are read and rounded;
  - a municipality without a boundary stops the run, named;
  - a boundary of a number not on the list (2391) stops, named;
  - a number given twice stops, named.

  Verify: pytest 85 passed.

  (As built: 85 passed.
  - The test of a number given twice first failed for the right reason ("did not raise"). After
    the code, its regex still failed: it expected "twice" before the number, and the message
    reads "the number 1 twice". The regex was corrected.
  - pyshp's types allow a record or a shape to be missing, and a field to be no whole number.
    The reader stops on both, naming the source. These two guards have no test of their own.
  - The made-up corners use only fractions of .4 and .6, so the test does not depend on Python
    rounding .5 to the even neighbour.)
- [x] 1.4 The same module reads the cantons and the outline. Each of the 26 cantons is taken once,
  in the order of the constitution, and the outline keeps its outer rings only (design,
  decision 13). Write three tests, one at a time:
  - the cantons and the outer rings are read;
  - a missing canton (JU) stops the run, named;
  - a canton given twice stops, named.

  Verify: pytest 88 passed.

  (As built: 89 passed. A fourth test was added for the spec's "gives no outline": a country
  without a shape stops the run, naming the source; before, it failed with Python's own
  `ValueError`. Every later count of the pipeline's tests is one higher than planned. The path
  of a shape is built from its rings, so the outline's outer rings need no shape of their own.)
- [x] 1.5 The same module reads the lakes of a ThemaKart set: both layers, found by their file
  names (`k4seenyyyymmdd11_ch2007Poly`, `k4seenyyyymmdd22_ch2007Poly`), whole and rounded.
  Write two tests, one at a time:
  - the two made-up lakes are read, the first also outside the country;
  - a set without the lake layers stops the run, naming the set.

  Verify: pytest 90 passed.

  (As built: 91 passed, one more for 1.4.
  - The test of a set without the lake layers passed when written: the reader already stops on
    a layer it cannot find. Against a mutant that skips a missing layer, it failed with "did not
    raise".
  - It also checks a set whose two layers hold no lake. That case first failed with "did not
    raise", and the reader now stops on it too.)
- [x] 1.6 In `pipeline/src/pipeline/download.py`:
  - the address of the register's boundaries, by division (`Commune`, `Canton`, `Country`) and
    date, at K4, as a shapefile;
  - the address of the ThemaKart set 2026 (asset 36390072) and its year.

  Write one test: the addresses of 2026-01-01 are those of `investigations/map-data.md`.
  Verify: pytest 91 passed.

  (As built: 92 passed, one more for 1.4.)
- [ ] 1.7 In `pipeline/src/pipeline/write.py`, write `map.json` in the shape of design decision
  14: municipalities by number, cantons in the constitution's order, lakes as the set lists
  them. Write one test: the made-up map is written in that shape. The existing test of the same
  bytes on a second run covers the new file. Verify: pytest 92 passed.
- [ ] 1.8 In `pipeline/src/pipeline/update.py`, for the list's reference date:
  - download and record the register's three answers and the ThemaKart set;
  - read and check them;
  - write `map.json` with the other data files.

  First give the `Sources` fake of `tests/test_update.py` the made-up map sources, so that the
  existing tests keep passing. Then write, one at a time:
  - the existing test of the kinds of data files expects `map.json` too;
  - a run on vote-day files of 2027-01-01 asks the register for the boundaries of 2027-01-01;
  - a failing check of the map writes no data file;
  - the record of the sources names the four new source files.

  Verify: pytest 95 passed; mypy, `ruff check` and `ruff format --check` pass.
- [ ] 1.9 Run `uv run --directory pipeline --locked python -m pipeline update` for real. Review
  the diff of `app/static/data/`:
  - `map.json` is new: reference date 2026-01-01, lakes set 2026, 2,110 municipalities, 26
    cantons, 37 lakes, about 370 KB;
  - `sources.json` has four more sources;
  - no other data file changes.

  Run it again: `git status --short` shows no further change. Verify:
  `python3 -c "import json; d=json.load(open('app/static/data/map.json')); print(d['referenceDate'], d['lakesSet'], len(d['municipalities']), len(d['cantons']), len(d['lakes']))"`
  prints `2026-01-01 2026 2110 26 37`.
- [ ] 1.10 In `pipeline/README.md`, add the two map sources to the table of sources, with what
  the pipeline takes from them, and update the size of a run's downloads. Verify: the table
  names the addresses of `download.py`, and the size matches `du -sh pipeline/downloads`.

## 2. The colours, the details and the figures of a municipality

In `app/src/lib/`. Spec `result-map`: the colour classes, the colours, as many yes as no, without
a result, the legend, pointing, the details without a result, the Swiss abroad, the figures fit
the map. Design: decisions 5 to 8, 12, 15 and 18. The figures are those of
`investigations/map-data.md`.

- [ ] 2.1 In `app/src/lib/vote-data.ts`, add the type of `map.json`. Verify: `pnpm run check`
  passes.
- [ ] 2.2 New module `app/src/lib/result-map.ts`: the side and class of a municipality from its
  yes and no votes, compared in whole numbers. Write, one at a time:
  - Aeugst am Albis is no, class 1; Zürich no, 2; Bern no, 3; Wachseldorn yes, 3;
  - the class boundaries: Flurlingen no, 2; Bettingen yes, 2; Romainmôtier-Envy yes, 4;
  - the clearest classes: Les Enfers yes, 4; Isenthal no, 4;
  - as many yes as no: Hünenberg 2,111 : 2,111, and 0 : 0.

  Verify: `pnpm run test` gives 41 passed in the calculation and 41 in the app.
- [ ] 2.3 The colour of each class and side, of a tie and of the hatching, and the legend's ten
  entries in order. Write two tests, one at a time: the colours of the spec, and the legend.
  Verify: the app has 43 passed.
- [ ] 2.4 The details of a municipality, with the texts in `app/src/lib/texts.ts`. Write three
  tests, one at a time:
  - Zürich: "Zürich (ZH)", "Ja-Anteil: 31.85%", "Ja-Stimmen: 46'565", "Nein-Stimmen: 99'614";
  - Benken (22) stays "Benken (ZH)";
  - Meienried without a result gives its sentence.

  Verify: the app has 46 passed.
- [ ] 2.5 The figures of a vote for the map: from the vote's file, the map's numbers and
  `municipalities.json`, each municipality's yes and no votes, the municipalities without a
  result, and the number of entries of Swiss abroad. Write three tests with made-up data, one at
  a time:
  - figures that fit;
  - a municipality of the map without an entry and not named without a result: the error names
    the vote and 261;
  - an entry that is no Swiss abroad and not on the map: the error names the vote and the
    number.

  Verify: the app has 49 passed.
- [ ] 2.6 In `app/src/lib/vote-data.test.ts`, against the real data files:
  - the map's municipalities are those of `municipalities.json`;
  - every judged vote's figures fit the map;
  - the number of entries of Swiss abroad is 12 for vote 5960 and 11 for 5670.

  Write three tests, one at a time; each passes when written, so each is seen to fail against a
  mutant of the function it calls. Verify: the app has 52 passed.

## 3. The view: zoom and move

In `app/src/lib/map-view.ts`. Spec `result-map`: zoom, moving the map. Design: decisions 4 and
15.

- [ ] 3.1 The view box of the whole of Switzerland. A zoom by a factor around a point keeps that
  point in place, within 1× and 16×. Write three tests, one at a time:
  - a zoom in by 2 around the centre halves the width and the height;
  - a zoom around a point keeps that point;
  - five zooms in end at 16×, and a zoom out at 1× stays at 1×.

  Verify: the app has 55 passed.
- [ ] 3.2 A move by a distance on the screen, with the view's centre clamped to the rectangle
  around Switzerland. Write two tests, one at a time:
  - a move at 4× shifts the view by the distance;
  - a move past the western edge stops at it.

  Verify: the app has 57 passed.

## 4. The map on the vote's page

In `app/src/lib/map-data.ts`, `app/src/routes/votes/[id]/` and a new
`app/e2e/result-map.spec.ts`. Spec `result-map`: every requirement. Design: decisions 4, 7, 10,
12, 13, 15 to 17, 19 and 20.

- [ ] 4.1 New module `app/src/lib/map-data.ts`: loads `data/map.json` and
  `data/municipalities.json` under the site's path, once per visit, and fails as one. Write two
  tests with a fake `fetch`, one at a time:
  - two calls make one request per file;
  - a failed request rejects.

  Verify: the app has 59 passed.
- [ ] 4.2 The vote's page holds the figures of 2.5. `+page.server.ts` reads `map.json` at build
  time to check them, so a mismatch fails the build naming the vote and the municipality. The
  tie-break question gets none. Verify:
  - `pnpm run build` passes;
  - `grep -c '46565' app/build/swiss-votation-visualisation/votes/5960/index.html` is at least 1;
  - the existing browser tests still pass, 14.
- [ ] 4.3 `ResultMap.svelte` on the vote's page, below the outcome and above the table of the
  cantons, under "Karte der Gemeinden". It draws:
  - the lake-coloured outline;
  - the municipalities, with their colours and the hatching;
  - the lakes;
  - the cantons, with non-scaling strokes;
  - the legend, the source line and the sentence on the Swiss abroad.

  Write browser tests, one at a time:
  - the map of 5960 with 2,110 municipalities between "Abgelehnt" and the table;
  - no map on 6823;
  - Zürich `#e5946f`, Bern `#c2673b`, Wachseldorn `#009c86`;
  - Hünenberg `#f0efec`;
  - 7 hatched on 5960, Meienried among them;
  - the legend's ten entries in order;
  - 26 cantons and 37 lakes;
  - the source line of the spec;
  - the Swiss abroad: 12 on 5960, 11 on 5670.

  Verify: `pnpm run build && pnpm run test:e2e` gives 24 passed.
- [ ] 4.4 Pointing (design, decisions 12 and 17): the box of details, a polite live region at the
  top left of the map. It shows on hover and on click or tap, and clears on a lake. Write
  browser tests, one at a time:
  - pointing at Zürich;
  - Benken (ZH);
  - clicking Bern without hover;
  - Zürich, then the middle of the Zürichsee: no details;
  - Meienried.

  Verify: the browser tests give 29 passed.
- [ ] 4.5 Zoom and move: the buttons "+" ("Vergrössern"), "−" ("Verkleinern") and "Ganze
  Schweiz"; the wheel over the map; dragging with Pointer Events; a drag of more than 4 px is
  not a click. Write browser tests, one at a time:
  - "+" halves the view around its centre;
  - the limits of the spec's scenario;
  - the wheel over Zürich keeps it under the pointer within one pixel;
  - dragging at 4× by 100 px;
  - dragging past the western edge;
  - a drag that ends on a municipality shows no details.

  Verify: the browser tests give 35 passed.
- [ ] 4.6 Loading once, and failure: "Die Karte kann nicht geladen werden." in place of the map.
  Write browser tests, one at a time:
  - from 5960 to the start page to 5670, `data/map.json` and `data/municipalities.json` are
    each requested once, and nothing under `/data/votes/`;
  - with `data/map.json` blocked through Playwright's routing, the message, the figures, the
    verdicts and the table of the cantons show.

  Verify: the browser tests give 37 passed.
- [ ] 4.7 The budget (design, decision 10). A browser test adds the measuring script before the
  page loads, zooms in four times, drags, points at three municipalities, prints each frame's
  work, and fails above 16 ms. Verify:
  - the browser tests give 38 passed, and the printed frames are below 16 ms;
  - against a temporary mutant that spins 20 ms in the wheel handler, the test fails and names
    the frame.
- [ ] 4.8 The map's label for assistive technology: `role="img"` and a label that names the vote
  and points to the table of the cantons. Verify:
  - a browser test of 4.3 is extended to find the map by its role and label;
  - the browser tests give 38 passed;
  - `pnpm run lint` and `pnpm run check` pass.

## 5. Documents and the whole

- [ ] 5.1 Add the map and its source to `README.md`. Verify: it names the map, "Kartengrundlage:
  © BFS", and `data/map.json` among the data files.
- [ ] 5.2 In `openspec/config.yaml`, move "how the map is drawn" from "Not decided" to the
  decided stack: SVG, own zoom code, the BFS's K4 boundaries, citing this change's design.
  Verify: `openspec validate --all --strict --no-interactive` passes.
- [ ] 5.3 In `docs/roadmap.md`:
  - add `investigations/map-data.md` to the investigations;
  - add to #10's open decisions whether a library for zoom and move (d3-zoom or another) serves
    better than #6's own code, as Q asked on 2026-11-15.

  Verify: `grep -n "map-data.md\|d3-zoom" docs/roadmap.md` shows both.
- [ ] 5.4 Run `./scripts/verify-local.sh`. Verify: 11 of 11 steps pass, with 41 tests of the
  calculation, 59 of the app, 38 browser tests and 95 of the pipeline.
- [ ] 5.5 Update `CLAUDE.md`: the status, the code map (`result-map.ts`, `map-view.ts`,
  `map-data.ts`, `ResultMap.svelte`, `result-map.spec.ts`, `boundaries.py`), "Where things are"
  (`app/static/data/map.json`, `investigations/map-data.md`), and the size of a run of the
  update. Verify: each file that `git diff --name-status --diff-filter=A main` lists outside
  `openspec/` is named in `CLAUDE.md`, or is in a directory its tables describe.

## Workflow follow-up

- `/openspec-verify-change`, then `/openspec-archive-change`, which updates #6 in
  `docs/roadmap.md`.
- After the merge, Q checks the published map by hand, on a computer and on a phone:
  `/votes/5960/` and `/votes/6650/` show the map, and pointing, zoom and move work.
