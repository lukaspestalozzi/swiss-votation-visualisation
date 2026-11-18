# Tasks

All commands run from the repository root, on a branch started from an updated `main`.

**Before this change:**
- `pnpm run test`: 52 passed in the calculation and 117 in the app;
- the browser tests: 139, one at a time, in about 50 s;
- `uv run --directory pipeline --locked pytest`: 134 passed;
- `./scripts/verify-local.sh`: 11 of 11 steps.

**How tests are written:**
- Each test is written first and seen to fail before the code that makes it pass, one at a time.
- A test that passes when written is seen to fail against a mutant, and the task says so in a
  note "As built".
- The numbers of tests are the plan. Where a count differs while building, the note says so
  too.
- A browser test is run alone with
  `pnpm run build && pnpm --filter app exec playwright test <file> -g "<its name>"`; "run
  alone" below means this.

**A phone** in the tests is Playwright's `devices['Pixel 7']` without `defaultBrowserType`
(design, decision 13), with its viewport set where a scenario names another width; **fingers**
are sent by `app/e2e/fingers.ts`.

**Temporary edits** made for a verification step are removed before the task is ticked.
`git status --short` then shows nothing of them.

## 1. Every page fits 360 pixels

Spec `small-screens`, "Every page fits a window 360 pixels wide"; design, decisions 5, 6 and 14.

- [x] 1.1 The longest word. Create `app/e2e/small-screens.spec.ts` with a test of the scenario
  "The longest word of a title": `/de/votes/6400/` in a window 360 pixels wide, the page's
  `scrollWidth` at most 360, and its heading holding the whole title. Seen to fail: 532. Then the
  page's headings and the verdict boxes break a long word (`hyphens: auto`,
  `overflow-wrap: break-word`).

  Verify: the test, run alone, passes; `investigations/small-screens/widths.cjs 360` against the
  new build lists no German page.

  (As built: the test failed with 532 and passed with the rule on `h1` and `.verdict` of the
  vote's page. `widths.cjs 360` then printed "0 of 381 pages wider than 360 px": no Italian page
  either. The tests' Chromium has an Italian hyphenation dictionary, and broke "Maggio-ranza" in
  the verdict boxes; see 1.2.)
- [x] 1.2 The verdicts in Italian. A test of the scenario, on a phone 360 pixels wide: the limit
  "Quota di stranieri" added, its upper bound at step 327, a tap on Zürich; the page at most 360
  pixels wide, and the two boxes side by side (the top of "Maggioranza dei Cantoni" level with
  that of "Maggioranza del popolo"), for the vote and under "Con la Sua selezione". Seen to fail:
  364. Then, below 640 pixels, the verdict boxes' padding and heading size, chosen so that the
  test passes (design, Open Questions).

  Verify: the test, run alone, passes; `widths.cjs 360` prints "0 of 381 pages wider than 360
  px". Write the chosen size into a note "As built".

  (As built: after 1.1 the test passed when written, by the hyphenation of "Maggio-ranza". With
  a mutant without hyphenation (`hyphens: manual`), as in a browser without the dictionary, it
  failed with 364; the width is checked before the tap, as on a page wider than the window the
  tap missed Zürich. Below 640 pixels the boxes then got a padding of 0 0.5rem, and the vote's
  headings 1.25rem: with the mutant the test passed, and the headings wrapped between their
  words, two lines each. Without the mutant: the two tests pass, and `widths.cjs 360`, against
  a server started after the build, prints "0 of 381 pages wider than 360 px".)
- [x] 1.3 The other pages. A test of the scenario "The other pages": the start page, the guide
  and `votes/6823/` in each language, and `/fr/votes/5960/`, each at most 360 pixels wide. It
  passes when written (investigation, 1).

  Verify: the test, run alone, passes; with a temporary rule `ul { width: 400px; }` in the start
  page's styles it fails naming `/de/`, and without it passes again.

  (As built: it passed when written; with the rule it failed with "de/", 408; without it the
  file's three tests pass.)

## 2. Fingers move and zoom the map

Spec `result-map`, "Zoom" and "Moving the map"; design, decisions 7, 8, 9 and 13.

- [x] 2.1 `pinchFrom` in `app/src/lib/map-view.ts`: the view from the view and both fingers'
  points when the second touched, and both points now, in pixels on a map shown so many pixels
  wide; built on `zoomAround` and `moveBy`. Four unit tests in `map-view.test.ts`, written and
  run one at a time (design, Tests):
  - apart to twice their distance around a point: half the width, the point in place;
  - moved together by 60 pixels: the shift, the width kept;
  - together at the whole of Switzerland: the whole of Switzerland;
  - apart beyond 16 times: a sixteenth of the width.

  Verify: `pnpm --filter app exec vitest run src/lib/map-view.test.ts` passes with the four new
  tests; `pnpm run test`: 52 and 121.

  (As built: the first failed with "pinchFrom is not a function", and passed with the zoom; the
  second failed with x 375 for 405, and passed with the move. The third and fourth passed when
  written, as `zoomAround` keeps the limits; with a mutant that zooms without them both failed,
  and passed again without it. `pnpm run test`: 52 and 121.)
- [x] 2.2 One finger. Create `app/e2e/fingers.ts`: `fingersOn(page)` opens a CDP session and
  sends touch points by `Input.dispatchTouchEvent`, each finger with its id, moved in steps of 10
  pixels with an animation frame between steps. In `result-map.spec.ts`, a test of "Moving with a
  finger" on a phone: zoomed in four times, one finger 100 pixels to the left; the view box 100
  pixels further east within one pixel, `scrollY` unchanged, no details. Seen to fail: 20 pixels
  (investigation, 3). Then the map's SVG gets `touch-action: none`.

  Verify: the test, run alone, passes.

  (As built: `fingers.ts` also holds the phone, Playwright's Pixel 7 without its choice of
  browser, which `small-screens.spec.ts` now imports. The test failed 4,404 units, 80 pixels,
  short: the map moved 20 pixels. With `touch-action: none` it passes.)
- [x] 2.3 Two fingers zoom. A test of "Zooming with two fingers" on a phone: two fingers 100
  pixels apart, Zürich midway, moved apart to 200 pixels; the view box half as wide and half as
  high, Zürich midway within one pixel. Seen to fail: today the map moves and does not zoom
  (investigation, 3). Then the map keeps the pointers pressed on it, and two make a pinch with
  `pinchFrom` (design, decision 9).

  Verify: the test, run alone, passes; the existing tests of zooming and dragging in
  `result-map.spec.ts` still pass.

  (As built: it failed with the width of the whole of Switzerland, 348,832 for 174,416. With the
  pinch the width was 174,415.98: the Pixel 7 places a finger at fractions of its screen's
  pixels, so the test takes half the width and height within one pixel, as Zürich's place. A
  release after a pinch selects nothing, and a cancelled pointer ends the pinch. The whole of
  `result-map.spec.ts`: 44 passed.)
- [x] 2.4 The limits and the move of two fingers. Tests of "Two fingers at the limits" and "Two
  fingers moving together", on a phone, written and run one at a time. Both pass when written, as
  `pinchFrom`'s limits and shift are unit-tested.

  Verify: each, run alone, passes; with `pinchFrom` temporarily skipping its `moveBy`, "Two
  fingers moving together" fails, and passes again without the mutant.

  (As built: both passed when written; the move is checked within one pixel, the width too. With
  the mutant, "Two fingers moving together" failed on its shift; without it the four tests on a
  phone pass.)

## 3. A tap, and the outline

Spec `result-map`, "The municipality last clicked or tapped is outlined" and "A tap does what a
click does"; design, decisions 3 and 4.

- [x] 3.1 The outline. Tests of "Before clicking", "Clicking, pointing, clicking again" and "A
  set-aside municipality", written and run one at a time: an outline is two paths with the `d` of
  the municipality in `last`, black 3 pixels on white 7, after the cantons. The first passes when
  written; the second and third fail first. Then the two paths in `ResultMap.svelte`, with
  `vector-effect: non-scaling-stroke` and `pointer-events: none`.

  Verify: each, run alone, passes; "Before clicking" fails against a mutant that outlines 261
  from the start, and passes again without it.

  (As built: the second failed with no outline, 0 paths; the paths came after it, so the third
  passed when written, and failed against a mutant that outlines no set-aside municipality. The
  group is `outlined`, as the outline of Switzerland is already the path `outline`. With both
  mutants the first and the third failed and the second passed; without them the three pass.)
- [x] 3.2 The tap. Tests of "Tapping Zürich" and "Tapping a lake" on a phone, written and run one
  at a time. Both pass when written: a tap is a click (investigation, 3), and 3.1 outlines it.

  Verify: each, run alone, passes; "Tapping Zürich" fails against a mutant in which only a click
  with `pointerType` "mouse" sets `last`, and passes again without it.

  (As built: both passed when written, and in five runs each, the Zürichsee being a few pixels
  wide on a phone; the search for it is now a helper shared with "pointing at a lake". Against
  the mutant both failed and the click of a mouse passed; without it both pass.)

## 4. Controls for a finger, and the zoom buttons

Spec `small-screens`, "Controls for a finger" and "The zoom buttons in a narrow window"; design,
decisions 10 and 11.

- [x] 4.1 The zoom buttons. Tests of "A phone" and "A computer" in `small-screens.spec.ts`,
  written and run one at a time. "A phone" fails first: the buttons lie over the map. Then, below
  640 pixels, the buttons stand in a row above the map.

  Verify: each, run alone, passes; the tests of zooming in `result-map.spec.ts` still pass.

  (As built: "A phone" failed with the buttons' bottom 21 pixels below the map's top. The box of
  details and the map now stand in a box of their own, `.picture`, so that the box of details
  stays at the map's top left when the buttons move above it, before it in the column. "A
  computer" passed when written, and failed against a mutant with the narrow rule at every width.
  The ten tests of zooming, the wheel and dragging pass.)
- [x] 4.2 The controls. A test of "The controls on a phone": with one limit, the eight controls
  named other than the thumbs, each at least 44 × 44 pixels on the screen (the switch by its
  label). Seen to fail: 24 × 21 and smaller (investigation, 5). Then the rules under
  `(pointer: coarse)` in `ResultMap.svelte` and `Limits.svelte` (design, decision 10). The
  thumbs, which the page cannot measure, are 4.3's.

  Verify: the test, run alone, passes; `investigations/small-screens/targets.cjs` against the new
  build prints, for the Pixel 7, every control at least 44 pixels tall and, for the computer, the
  sizes of before.

  (As built: the test failed with each control too small in one or both directions, and passes
  with the rules. `targets.cjs`, against a server started after the build, prints for the Pixel 7
  the list and the six buttons 44 pixels tall, "+" and "−" 44 × 44; it measures the switch by its
  box, now 24 × 24 in a label at least 44 pixels tall, which the test measures, and the track,
  still 24 pixels tall until 4.3. For the computer it prints the sizes of before.)
- [x] 4.3 The thumbs. A test of "A thumb beside the finger" on a phone: a press 20 pixels to the
  left of the upper thumb's centre and a move 100 pixels to the left; the upper bound below 327,
  the lower at 0. Seen to fail: a press beside a 17.6-pixel thumb takes nothing. Then, under
  `(pointer: coarse)`, each thumb a 44-pixel square with a transparent border and the track 44
  pixels tall. The test of 4.2 adds the track's height, at least 44.

  Verify: the test and 4.2's, run alone, pass; `pnpm --filter app exec playwright test
  e2e/limits.spec.ts` passes whole.

  (As built: the track's height is checked in this test, before the press, not in 4.2's; it
  failed there first, 24. The press is the mouse's on the phone's emulation, as this browser
  moves no native slider for a finger; the thumb's centre is placed as a 44-pixel thumb's. The
  rules under `(pointer: coarse)` stand at the end of the styles, after those they change; the
  dot keeps 18 pixels with its white ring drawn inside. With a mutant thumb of 1.1rem on the
  44-pixel track the test failed, the bound left at 327; without it the test and 4.2's pass, and
  `limits.spec.ts` passes whole, 39.)

## 5. The bar with the selection's result

Spec `small-screens`, "The selection's result at the bottom of a narrow window"; design,
decisions 1 and 2.

- [x] 5.1 The texts. `selectionBar` in `src/lib/texts/`: from the outcome and the two verdict
  words, the bar's two lines, in German, French and Italian, typed in `Texts`. A unit test in
  `texts.test.ts` with the scenarios' lines: "Mit Ihrer Auswahl: Angenommen", "Volksmehr: Ja ·
  Ständemehr: Ja", "Avec votre sélection: Accepté", "Majorité du peuple: Oui · Majorité des
  cantons: Oui". Seen to fail first.

  Verify: `pnpm --filter app exec vitest run src/lib/texts/texts.test.ts` passes; `pnpm run
  check` passes; `pnpm run test`: 52 and 122.

  (As built: it failed with "selectionBar is not a function". The headings it repeats, "Mit Ihrer
  Auswahl", "Volksmehr" and "Ständemehr" and theirs in French and Italian, are now constants of
  each language's file, as `REMOVE_LIMIT` was, so that the function and the boxes write the same
  words. The test also holds the scenario "A majority that is not needed". `pnpm run test`: 52 and
  122.)
- [x] 5.2 The bar. Tests of "While dragging on a phone", "The box in view" and "No selection, or a
  wide window" in `small-screens.spec.ts`, written and run one at a time; each fails first while
  there is no bar, apart from the third, which passes. Then `SelectionBar.svelte` at the end of
  the vote's page: sticky at the bottom, shown while a selection applies and the box is not
  wholly within the window, hidden from 640 pixels, `aria-hidden`.

  Verify: each, run alone, passes; "No selection, or a wide window" fails against a mutant
  without the media query, and passes again without it.

  (As built: "While dragging on a phone" failed with no bar. The bar came after it, so "The box
  in view" passed when written; it fails against a mutant whose observer never reports the box
  wholly in view. With that mutant and the one without the media query, the first passed and the
  second and third failed; without them the three pass. The bar stands last on the vote's page,
  after the notes; the box is bound by `bind:this`.)
- [x] 5.3 The bar's other scenarios. Tests of "A majority that is not needed", "In French" and
  "The end of the page", written and run one at a time. They pass when written, with 5.1's texts
  and 5.2's bar.

  Verify: each, run alone, passes; "The end of the page" fails against a mutant with
  `position: fixed` in place of `sticky`, and passes again without it.

  (As built: the three passed when written. "The end of the page" failed at first with the bar
  sticky: the test scrolled to the end before the bar had come, and a bar that comes then makes
  the page longer, its end one scroll further. The test now waits for the bar, as the scenario's
  visitor sees it, and then passes in five runs of five; with `position: fixed` it fails, the last
  line 29 pixels below the bar's top, and passes again without it. The file's 13 tests pass.)

## 6. The budget of fingers

Spec `result-map`, "The budget of fingers"; design, decision 12.

- [ ] 6.1 A test of "Pinching, moving and tapping" in the budget tests of `result-map.spec.ts`,
  in a `describe` with one retry, on a phone: the frames measured by `app/e2e/frames.ts`, whose
  script already listens for `pointermove`, `pointerover` and `click`. Seen to fail with a
  temporary delay of 20 ms in the map's `pointermove` handler, then passing without it.

  Verify: the test, run alone, passes and prints its frames; `pnpm run test:e2e` prints
  "Running 162 tests using 1 worker" and "162 passed"; write its time into a note "As built".

## 7. Docs and the whole

- [ ] 7.1 The plans. `openspec/config.yaml`, the map's line of the stack: the check of a library
  is done, and the app's own code zooms and moves with fingers too (design of
  `add-small-screens`, decision 7). `docs/roadmap.md`, "Investigations": "Small screens", found
  while proposing #10, with what it found.

  Verify: `openspec validate --all --strict` passes; `grep -n "small-screens" docs/roadmap.md
  openspec/config.yaml` shows both.
- [ ] 7.2 `CLAUDE.md`. In the code map:
  - `map-view.ts`: `pinchFrom`;
  - `ResultMap.svelte`: fingers, the outline, the place and size of the buttons;
  - `Limits.svelte`: sizes for a finger;
  - the vote's page: the verdict boxes in a narrow window, and the bar;
  - new rows for `SelectionBar.svelte`, `app/e2e/small-screens.spec.ts` and
    `app/e2e/fingers.ts`;
  - `result-map.spec.ts`: fingers, the tap, the outline and their budget.

  In "Where things are": the seventh investigation, `investigations/small-screens.md`, and its
  scripts in `small-screens/`. The status names the phone.

  Verify: `grep -n "SelectionBar\|fingers.ts\|small-screens" CLAUDE.md` shows the rows;
  `git diff --stat origin/main` lists only the files this change names; `./scripts/verify-local.sh`
  passes its 11 steps.

## Workflow follow-up

- Push, open the pull request, and watch its CI: the browser tests "Running 162 tests using 1
  worker".
- Verify the change (`/openspec-verify-change`), then archive it: the roadmap's row 10 done, its
  capabilities `small-screens` and `result-map`; `CLAUDE.md`'s status names it archived and 10a,
  `add-site-style`, as the next.
- After the merge, Q checks the published site by hand on a phone (design, Migration Plan, 3);
  what fails there becomes a small change of its own.
