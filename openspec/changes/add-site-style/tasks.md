# Tasks

All commands run from the repository root, on a branch started from an updated `main`.

**Before this change** (counted on `b730551`):
- `pnpm run test`: 52 passed in the calculation and 124 in the app;
- the browser tests: 166, one at a time (`playwright test --list`);
- `uv run --directory pipeline --locked pytest`: 134 collected;
- `./scripts/verify-local.sh`: 11 of 11 steps.

**How tests are written:**
- Each test is written first and seen to fail before the code that makes it pass, one at a time.
- A test that passes when written is seen to fail against a mutant, and the task says so in a
  note "As built".
- The numbers of tests are the plan; where a count differs while building, the note says so.
- A browser test is run alone with
  `pnpm run build && pnpm --filter app exec playwright test <file> -g "<its name>"`; "run alone"
  below means this.

**The dark scheme** in a test is `page.emulateMedia({ colorScheme: 'dark' })`; **a phone** is
Playwright's `devices['Pixel 7']`, as in `small-screens.spec.ts`.

**Temporary edits** made for a verification step are removed before the task is ticked.
`git status --short` then shows nothing of them.

## 1. The font

Spec `site-style`, "The font"; design, decisions 1 and 2.

- [x] 1.1 The dependency. Add `@fontsource-variable/source-sans-3` 5.3.1 to the dev dependencies
  of `app` (`pnpm --filter app add -D @fontsource-variable/source-sans-3@5.3.1`).

  Verify: `pnpm install` succeeds; `git diff pnpm-workspace.yaml` shows no
  `minimumReleaseAgeExclude`; `pnpm-lock.yaml` names the package at 5.3.1 with no dependencies of
  its own.
- [x] 1.2 The font of the pages. Create `app/e2e/site-style.spec.ts` with a test of the scenario
  "The font of the pages":
  - `/de/`, `/fr/guide/` and `/it/votes/5960/`;
  - the fonts Chrome renders (`CSS.getPlatformFontsForNode`) for the heading, a paragraph, and
    the table and a button of the vote's page;
  - the requests for font files: one per page, to the site itself.

  Seen to fail: Liberation Serif. Then:
  - create `app/src/app.css`, which imports the package's `wght.css` and sets `font-family`
    "Source Sans 3 Variable", then `sans-serif`, on `html`, and `font: inherit` on buttons and
    lists;
  - create `app/src/routes/+layout.svelte`, which imports it, preloads the Latin file (its
    address by `?url`) and renders its children.

  Verify: the test, run alone, passes; `pnpm run build` writes
  `source-sans-3-latin-wght-normal-*.woff2` into `app/build/swiss-votation-visualisation/_app/`;
  `pnpm --filter app exec playwright test vote-list.spec.ts -g "all requests go to the site
  itself"` passes.

  (As built: Chrome names the rendered font "Source Sans 3 ExtraLight", the variable file's
  default instance, whatever weight it draws. The loaded face is "Source Sans 3 Variable",
  weights 200 to 900, with the heading at 700 and the text at 400. So the test asks for a name
  that begins with "Source Sans 3". The build writes the seven faces with a hash in their names,
  the Latin one `source-sans-3-latin-wght-normal.Bo_j9asI.woff2`, and the preload names the same
  file as the stylesheet. The page requests one font file.)
- [x] 1.3 A font that cannot be loaded. Add a test of the scenario: the browser's requests for
  `woff2` files aborted (`page.route`), `/de/votes/5960/`;
  - the heading rendered in a font that is neither Source Sans 3 nor a serif;
  - a limit "Ausländeranteil" at step 327 gives "Mit Ihrer Auswahl" with "Angenommen";
  - the map has its 2,103 municipalities with a result.

  It passes when written, by 1.2: seen to fail against a mutant without `sans-serif`, which
  renders Liberation Serif.

  Verify: the test, run alone, passes, and fails with the mutant.

  (As built: without the file this machine renders Liberation Sans. With the mutant the test
  failed with "Liberation Serif", and with `sans-serif` back it passes.)
- [x] 1.4 The budget tests wait for the font. `app/e2e/frames.ts` (or the budget tests' setup,
  whichever starts the measurement) awaits `document.fonts.ready` before the first input.

  Verify: `pnpm --filter app exec playwright test result-map.spec.ts limits.spec.ts -g "budget"`
  passes; a note "As built" records each budget test's longest frame.

  (As built: `frames.ts` exports `fontsLoaded`, which the five budget tests await once the page
  has opened, before their first input. The longest frames, 4 passed and 1 flaky:
  - a drag of a limit: 7.7 ms;
  - jumps: 8.6 ms, of the 50 ms budget;
  - zooming, moving and pointing: 8.1 ms;
  - clicking: 4.2 ms;
  - fingers: the first try failed on a tap's `pointerover` of 17.5 ms, and the retry passed, its
    taps at most 5.5 ms and its moves at most 5.6 ms.

  The fingers' test was as unsteady on `main`'s code before this change: its first try failed in
  each of three full runs while #18 was proposed. So waiting for the font does not change it.)

## 2. The colours of the light scheme

Spec `site-style`, "The colours of the light scheme"; design, decisions 3, 4 and 9.

- [x] 2.1 The contrast of every text. Create `app/e2e/contrast.ts` (design, decision 11): every
  element with text of its own, its colour and the first opaque ground behind it, a translucent
  ground laid over the one behind; WCAG's ratio; large text from 24 pixels, or 18.66 in bold.
  Add a test of the scenario "The contrast of every text":
  - the start page, the guide, and `/votes/5960/` with "Ausländeranteil" at step 327, in each
    language;
  - a paragraph `#1c1c1c` on `#ffffff` and a link `#1a5fb4`;
  - no text below its threshold.

  Seen to fail: a paragraph `#000000`, a link `#0000ee`. Then:
  - `app.css` names the light colours on `:root` (decision 3) and sets the text's size and line
    heights (decision 9);
  - the components use the names instead of the colours they write: the vote's page (`.greyed`,
    the verdict boxes' border, the date and kind, the sources and notes), the start page (date
    and kind), the panel's and the map's sources (`--text-secondary`).

  Verify: the test, run alone, passes; it fails against a mutant that sets `--text-secondary` to
  `#999999` (2.85:1), naming the date of the vote.

  (As built: it failed first on the ground, `rgba(0, 0, 0, 0)`, as the page set none. Today's
  black text and the browser's links already passed every threshold. `contrast.ts` reads colours
  through a pixel of a canvas, so that it also reads `color(srgb …)`. The texts that take
  `--text-secondary` carry a global class `secondary`, set in `app.css`:
  - on the start page, each entry's date and kind;
  - on a vote's page, the date and kind, the differences, the source, the mark of a provisional
    result and the note;
  - the map's and the panel's sources.
  With the mutant the test failed on `de/` first, naming the start page's dates and kinds at
  2.85:1.)
- [x] 2.2 A majority that is not needed. Add a test of the scenario: `/de/votes/5950/`, the
  Ständemehr's "nicht nötig" in `#1c1c1c` and its cantonal votes in `#767676`.

  It passes when written, by 2.1: seen to fail against a mutant that gives `.greyed` the
  `--text-secondary` colour.

  Verify: the test, run alone, passes, and fails with the mutant.

  (As built: passed when written; with the mutant it failed, `rgb(89, 89, 89)` for
  `rgb(118, 118, 118)`.)

## 3. The dark scheme

Spec `site-style`, "The dark scheme"; spec `result-map`, "A municipality without a result" and
"The map in the dark scheme"; design, decision 6.

- [x] 3.1 A dark page. Add a test of the scenario "A dark page":
  - the pages of 2.1, in the dark scheme;
  - a paragraph `#e8e8e8` on `#121212` and a link `#8ab4f8`;
  - no text below its threshold.

  Seen to fail: a white ground. Then `app.css` sets `color-scheme: light dark` and the dark values
  of every name inside `@media (prefers-color-scheme: dark)`, and `SelectionBar.svelte` takes
  `--ground` instead of `#ffffff`.

  Verify: the test, run alone, passes.

  (As built: it failed first on a white ground. With the dark values it failed again, on the box
  of details: the pointer rests over the map once the limit is set, so the box shows Küttigen. Its
  white ground at 90 % put light text on light, 1.00:1. The design had assumed that box empty in
  these tests. So the box's ground moved here from 3.4, as
  `color-mix(in srgb, var(--ground) 90%, transparent)`, and the test passes, with the other four
  of the file.)
- [x] 3.2 The preference changes on an open page. Add a test of the scenario:
  - `/de/votes/5960/` with "Ausländeranteil" at step 327, then the dark scheme;
  - the ground `#121212`;
  - the bound still at step 327 and "Angenommen" under "Mit Ihrer Auswahl";
  - no navigation in between (the page's `performance.getEntriesByType('navigation')` unchanged).

  It passes when written, by 3.1: seen to fail against a mutant that wraps the dark values in a
  media query the page never matches.

  Verify: the test, run alone, passes, and fails with the mutant.

  (As built: that the page is not loaded anew is shown by a mark set on `window` before the
  switch and still there after it. That is more direct than the navigation entries, which a page
  loaded anew would also show as one. Passed when written. With the mutant
  `@media (prefers-color-scheme: dark) and (max-width: 0px)` it failed, the ground still
  `rgb(255, 255, 255)`.)
- [x] 3.3 Nothing stored. Add a test of the scenario: the start page in both schemes, no element
  that switches the scheme, `document.cookie` empty, `localStorage` empty (Q, while applying:
  `sessionStorage` is SvelteKit's; design, decision 6).

  It passes when written: seen to fail against a mutant that writes the scheme to `localStorage`.

  Verify: the test, run alone, passes, and fails with the mutant.

  (As built: as first written, with `sessionStorage` empty too, it failed. After the second visit
  `sessionStorage` held SvelteKit's `sveltekit:history-info` (the scroll position),
  `sveltekit:snapshot` and `sveltekit:navigation-snapshot`, which its router writes whenever a page
  is left. Q chose to name only what outlives the tab, cookies and local storage. So the spec's
  requirement "The dark scheme" and its scenario "Nothing stored", the design's decision 6 and the
  proposal now say so. The test then passed. With the mutant, an `$effect` in the root layout that
  writes the scheme to `localStorage`, it failed: `localStorage.length` 1, in the dark scheme.)
- [x] 3.4 The map in the dark scheme. In `result-map.spec.ts`, add tests of the scenarios:
  - "Hatched in the dark scheme": the ground of 389 Meienried's pattern `#121212`;
  - "A selection on a dark map": Zürich `#2c2c2c` and outlined black on white, Aeugst am Albis
    `#fbbea3`, the stroke of the municipalities `#121212`;
  - "The colours of the classes stay": Zürich `#e5946f`, Bern `#c2673b`, Wachseldorn `#009c86`.

  Seen to fail: white strokes and a white pattern. Then:
  - in `ResultMap.svelte`, the borders between municipalities, the pattern's ground and the
    legend's hatched swatch take `--ground` through CSS, and the swatches' border takes
    `--border`;
  - the box of details takes `color-mix(in srgb, var(--ground) 90%, transparent)`;
  - `HATCH_BACKGROUND` goes from `result-map.ts`.

  Verify: the three tests, each run alone, pass; `pnpm --filter app exec playwright test
  result-map.spec.ts` passes, "The municipalities without a result in 2016" among them;
  `pnpm run check` and `pnpm run lint` pass.

  (As built:
  - Seen to fail: the pattern's ground and the borders `rgb(255, 255, 255)`. "The colours of the
    classes stay" passed when written, as it guards what does not change.
  - The pattern's `rect` takes the class `hatch-ground`, filled with `--ground`.
  - The box of details had moved to 3.1. The outline's halo stays white, as the spec has it.
  - All 57 tests of `result-map.spec.ts` pass, the budget tests on their first try.
  - `pnpm run lint` first failed with 6 errors in `contrast.ts`: five `?? 0` that its types make
    needless, and a check that can be an optional chain. They were removed with no change to
    what it reads, and the 7 tests of `site-style.spec.ts` still pass.)

## 4. The verdicts in the map's colours

Spec `site-style`, "The verdicts in the map's colours"; design, decision 5.

- [x] 4.1 The sides of a vote's page. In `vote-page.test.ts`, two tests:
  - the vote of 2016-02-28: the Volksmehr's side `'no'`, the Ständemehr's `'yes'`, the outcome
    `'no'`, ZH's row `'no'`;
  - `/votes/5950/` without the Swiss abroad: the Ständemehr's side `null` ("nicht nötig"), the
    outcome `'no'`.

  Seen to fail: no side. Then `Verdict`, the outcome and `CantonRow` in `vote-page.ts` gain a side
  (`'yes'`, `'no'` or `null`, `null` for a canton with nothing left).

  Verify: `pnpm --filter app exec vitest run src/lib/vote-page.test.ts` passes; `pnpm run check`
  passes.

  (As built:
  - A type `Side`, `'yes'`, `'no'` or `null`. A verdict gains `side`, the result `outcomeSide`,
    and a canton's row `forSide`, as its `side` already holds the word.
  - The second test takes the vote 6790, an optional referendum whose own Ständemehr is "nicht
    nötig": the same case as 5950 without the Swiss abroad, with no selection to build. Its
    sides are `'yes'` and `null`, its outcome's `'yes'`.
  - Both failed first with `undefined`. The three tests that compare whole rows took the new
    field, `null` for a canton with nothing left.
  - 20 passed.)
- [x] 4.2 The side of an entry of the list. In `vote-list.test.ts`, two tests: the entry of 5960
  has the side `'no'`; the tie-break question 6823 has none (`null`).

  Seen to fail. Then the entries of `vote-list.ts` gain a side.

  Verify: `pnpm --filter app exec vitest run src/lib/vote-list.test.ts` passes.

  (As built: the first test also checks 6790, `'yes'`. Both failed first with `undefined`. The
  entry takes `Side` from `vote-page.ts`. 12 passed.)
- [x] 4.3 The colours on the pages. Add tests of the scenarios:
  - "The vote of 2016-02-28": the colours of "Nein", "Abgelehnt", "Ja" and ZH's "Nein", and the
    start page's "abgelehnt";
  - "A selection on a phone": "Angenommen" in the box and in the bar, and the bar's "Ja", on a
    phone 412 pixels wide;
  - "In the dark scheme": `/fr/votes/5960/`, "Non" and "Rejeté" `#e5946f`, "Oui" `#4bc1ad`.

  Seen to fail: `#1c1c1c`. Then:
  - `app.css` names `--yes` and `--no` in both schemes;
  - the vote's page, the table, `SelectionBar.svelte` and the start page set a class from the
    side.

  Verify: the three tests, each run alone, pass; `pnpm --filter app exec playwright test
  vote-page.spec.ts vote-list.spec.ts small-screens.spec.ts` passes.

  (As built:
  - **The bar.** A line holds both sides ("Volksmehr: Ja · Ständemehr: Nein"), so the bar writes
    its words apart, each in a `span` of its side, from `WITH_SELECTION`, `MAJORITY_OF_VOTERS`
    and `MAJORITY_OF_CANTONS`. The texts' `selectionBar` thus went unused and was removed, with
    its unit test. The bar's lines stay tested in German and French by `small-screens.spec.ts`.
    The app's unit tests are now 127.
  - **The classes.** `app.css` holds `--yes`, `--no` and the global classes `side-yes` and
    `side-no`.
  - **Two failures, fixed with Q's go-ahead.**
    - The start page's entry was not found: a vote's link ends in `/votes/5960`, without the
      final slash, and the selector had one.
    - `limits.spec.ts` "recalculated while dragging" failed with "the slider did not reach step
      327", measured with the test's steps in a window 1,280 × 720. The taller lines put the
      upper slider at y 752, below the window, where the press missed it; on `main`'s build it
      lies at y 659. `dragTo` now scrolls the slider into view first, as the budget test of
      dragging does. All 39 tests of the file pass.
  - **Found and not changed.** When "Mit Ihrer Auswahl" appears, the results grow and the
    slider moves down under the pressed pointer: 44 pixels on `main` (301 → 346), 46 with this
    change (340 → 386). The drag goes on, as the slider keeps the pointer pressed on it. This is
    #8's layout, not this change's.
  - The three tests failed first with the text's colour. `vote-page`, `vote-list`,
    `small-screens`, `site-style` and `languages` pass: 73 tests.)

## 5. The head

Spec `site-style`, "The head of every page"; spec `reading-guide`, "Every page links to the
guide"; design, decision 7.

- [x] 5.1 The head. Add tests of the scenarios "On a vote's page", "On the start page and the
  guide" and "The head in a narrow window":
  - the head's three parts in order, before the `h1`, with their links;
  - on its own page the title or the guide's name is not a link;
  - at 360 pixels, the head no wider than the window, and each part's words on one line.

  In `guide.spec.ts`:
  - the test of the start page's link becomes "From the start page": "Lesehilfe" in the head,
    and no link "Lesehilfe und Quellen" on the start page;
  - add "From a vote's page".

  Seen to fail: no head. Then:
  - `[lang]/+layout.svelte` renders a `<header>` with the title, the guide's heading
    (`GUIDE_HEADING`) and the switch, each a link but on its own page, where it is text with
    `aria-current="page"`;
  - the start page drops its paragraph with `GUIDE_LINK`.

  Verify: the five tests, each run alone, pass; `pnpm --filter app exec playwright test
  guide.spec.ts languages.spec.ts vote-list.spec.ts` passes.

  (As built:
  - All five failed first: there was no `header`.
  - The head is a flex row that wraps between its parts. Each part keeps its words on one line
    (`white-space: nowrap`), and the switch keeps its own `nav` and stands to the right.
  - The narrow-window test asks each part's text to take one line, which is stricter than "no
    word broken", as the design wants the head to wrap only between its parts. At 360 pixels in
    Italian the switch takes the second line.
  - `site-style`, `guide`, `languages` and `vote-list` pass, 64 tests, and `small-screens` and
    `vote-page`, 23.)

## 6. The width

Spec `site-style`, "The width of a page"; design, decision 8.

- [x] 6.1 The width. Add tests of the scenarios:
  - "A wide window": at 1,920 pixels, the head and the `h1` at 16 pixels from the left, the map
    1,552 pixels wide, give or take 1, the panel beside it, the sentence at the limits at most
    640 wide;
  - "A narrow window": `/de/` at 360, the head and the list from 16 to at most 344 pixels.

  Seen to fail: 8 pixels. Then:
  - the body takes no margin and 16 pixels of padding at each side;
  - `p` takes `max-width: 40rem`;
  - the guide's `section` rule of 45rem goes.

  Verify: the two tests, each run alone, pass; `pnpm --filter app exec playwright test
  small-screens.spec.ts` passes; `node investigations/small-screens/widths.cjs 360`, against the
  build served on port 4174, ends "0 of 381 pages wider than 360 px". Should a page be wider, the
  verdict boxes' padding below 640 pixels shrinks (design, Risks), and a note "As built" says so.

  (As built: both failed first, at 8 pixels. With the body at 16 pixels of padding and `p` at
  `max-width: 40rem` in `app.css`, both pass, and the guide's rule of 45rem went. `site-style` and
  `small-screens` pass, 30 tests, and `widths.cjs` gives "0 of 381 pages wider than 360 px", so
  the verdict boxes needed no change.)

## 7. The controls

Spec `site-style`, "The controls"; design, decision 10.

- [x] 7.1 The controls in both schemes. Add a test of the scenario:
  - `/de/votes/5960/` with "Ausländeranteil" at step 327, in each scheme;
  - for "+", "−", "Ganze Schweiz", the list, "Entfernen", "Zurück zum echten Ergebnis", the
    switch's box, the track and both thumbs: the border or fill at least 3:1 against the colour
    behind, the text at least 4.5:1.

  Seen to fail: the track `#999999`, 2.85:1. Then `app.css` draws buttons and the list, and
  `Limits.svelte` and `ResultMap.svelte` take the names:
  - the track `--border`;
  - the thumbs filled with `--text` and ringed with `--ground`, #10's 44-pixel squares kept;
  - the switch with `accent-color: var(--link)`;
  - the map's buttons opaque.

  Verify: the test, run alone, passes; `pnpm --filter app exec playwright test
  small-screens.spec.ts -g "controls|thumb"` passes.

  (As built:
  - **The test.** One per scheme. `contrast.ts` now also measures controls: the larger of
    border and fill against the colour behind, and their text. The switch's box and the thumbs,
    which the browser draws, are read from their pixels on the screen (`pixelAt`).
  - **Seen to fail:** in the light scheme the track, 2.85:1; in the dark scheme both thumbs,
    still `#333333`. `app.css` now draws buttons and lists, with `accent-color` for the switch,
    and `Limits.svelte` takes the names for the track and the thumbs. Both pass.
  - **A failure found in `result-map.spec.ts`**, "on a phone › tapping a lake shows no details":
    - **The cause.** Since 6.1 the map on the phone is 380 pixels wide, not 396, and the tap
      landed on Fällanden. The test's `zurichsee()` took the lake whose centre lies nearest
      Zürich's: the Greifensee, 4.6 × 6.3 pixels, beside which Chrome moves the tap. With the
      sides at 8 pixels, the same tap stayed on the lake.
    - **The fix (Q).** `zurichsee()` takes the lake whose box overlaps Zürich's, the Zürichsee,
      as the spec names it. The phone test zooms in once and taps it at least 4 pixels from its
      shore: at 2 pixels the first such point lay beside Zürich, and the tap reached Zürich.
    - The three lake tests passed three times of three without retries.
  - `small-screens`, `limits`, `result-map` and `site-style` pass, 128 tests, none needing its
    retry.)
- [x] 7.2 A control focused from the keyboard. Add a test of the scenario: Tab until "Ganze
  Schweiz" has the focus, in each scheme, its outline `2px solid` `#1a5fb4` or `#8ab4f8`.

  Seen to fail: Chromium's own ring. Then `app.css` sets `:focus-visible` (decision 10), and
  `Limits.svelte`'s rings of the thumbs take `--link`.

  Verify: the test, run alone, passes.

  (As built: one test per scheme. Both failed first with `outline-style: auto`, then passed. The
  file's 19 tests pass, two more than the 17 planned, as the controls and the ring each have a
  test per scheme. Prettier also wrapped two lines of 7.1's test. `small-screens` and `limits`
  pass, 54 tests.)

## 8. The look as a whole

Design, decision 11, and the performance budget.

- [x] 8.1 Screenshots for Q at 360 and 1,280 pixels, in the light and the dark scheme:
  - the start page, the guide, and `/de/votes/5960/` with "Ausländeranteil" at step 327 and
    Zürich clicked;
  - twelve files in the session's scratchpad, sent to Q, not committed.

  Verify: twelve files are sent; what Q asks to change is listed in a note "As built", and each
  item is done or carried over with Q's word.

  (As built:
  - **The shots.** Twelve, at a scale of 2. The start page and the guide are cut to their first
    1,600 and 1,400 pixels, and the vote's page is whole. The two vote's pages at 360 pixels
    reached Q scaled down to 8,000 pixels tall.
  - **What a whole-page shot shows.** At 360 pixels the bar with the selection's result shows
    below "Abgelehnt": that is where such a shot draws a bar that sticks to the window's
    bottom.
  - **Q's answer:** "Looks right". Nothing to change.)
- [x] 8.2 All browser tests. Run them.

  Verify: `pnpm run build && pnpm run test:e2e` gives "Running 187 tests using 1 worker" and "187
  passed": 166 before, 17 in `site-style.spec.ts`, 3 in `result-map.spec.ts` and 1 in
  `guide.spec.ts`. A note "As built" records the time.

  (As built: "Running 189 tests using 1 worker", "189 passed (1.5m)", none needing its retry.
  That is two more than planned, as `site-style.spec.ts` has 19, a test per scheme for the
  controls and for the ring of focus.)

## 9. Docs

- [x] 9.1 `CLAUDE.md`:
  - the code map gains `app/src/app.css`, `app/src/routes/+layout.svelte`,
    `app/e2e/site-style.spec.ts` and `app/e2e/contrast.ts`;
  - the rows of `[lang]/+layout.svelte`, `[lang]/+page.svelte`, the guide, `ResultMap.svelte`,
    `Limits.svelte`, `SelectionBar.svelte`, `vote-page.ts`, `vote-list.ts`, `result-map.ts`,
    `frames.ts`, `guide.spec.ts` and `result-map.spec.ts` say what changed;
  - "Where things are" names `site-style` among the specs and `investigations/site-style.md` with
    its scripts;
  - the status names the look;
  - `app/package.json`'s row names the font's package.

  Verify: `grep -n "site-style\|app.css\|contrast.ts" CLAUDE.md` shows each; every file
  `git status --short` lists as added is in the code map.

  (As built:
  - **Added:** the code map's rows for `app.css`, the root layout, `site-style.spec.ts` and
    `contrast.ts`, and the eighth investigation in "Where things are".
  - **Updated:** the status, and the rows of the head, the start page, the vote's page, the
    limits, the map, the bar, `vote-list.ts`, `vote-page.ts`, `result-map.ts`, `frames.ts`, the
    guide's tests, the map's tests and `app/package.json`.
  - **Left for the archive:** `site-style` in the list of `openspec/specs/`, as that list names
    the main specs and `site-style` is one only once the change is archived. `small-screens` was
    added there at its archive too. The "Next" line and the list of archived changes also change
    then.
  - The guide's row did not change, as its rule of 45rem was never named there.)
- [x] 9.2 The whole. `./scripts/verify-local.sh`.

  Verify: "All 11 steps passed", with 52 and 128 unit tests, "Running 187 tests using 1 worker",
  187 passed, and the pipeline's 134.

  (As built:
  - **The first run failed 3 of 11 steps**, all on `app/e2e/contrast.ts`. After its rework in
    7.1 only the test files had been linted:
    - the formatting;
    - the lint: needless `??` and `undefined` checks, and the untyped `Buffer` of
      `page.screenshot`;
    - the type check: `{ kind: 'texts' }` widened to a `string`.
  - **The fix.** The requests are typed, the needless checks go, and `pixelAt` reads its pixel
    through Chrome's `Page.captureScreenshot`, a base64 string, adding the scroll, as it takes
    the page's coordinates. The controls' test passes; with the mutant of thumbs filled with the
    ground it failed in both schemes, naming both thumbs, so the pixel is still the thumb's.
  - **The second run:** "All 11 steps passed", with 52 and 127 unit tests, "Running 189 tests
    using 1 worker", 189 passed (1.3m), and the pipeline's 134 passed.
  - **Against the plan:** 127, not 128, as the bar's unit test went with `selectionBar` (4.3);
    189, not 187 (8.2).)

## Verification

`/openspec-verify-change` on 2026-11-19, after #18 was merged (`f30e07c`):
- 21 of 21 tasks;
- 10 requirements added or modified, and 1 renamed, each implemented;
- 31 scenarios, each with a browser test;
- no critical issue, 1 warning and 4 suggestions.

Q asked to fix them all; each fix was seen to fail first, or against a mutant:
- **Warning: the bar's top border** took the text's colour, where decision 10 gives it
  `--border`. A test on a phone asks `rgb(118, 118, 118)`; it failed with `rgb(28, 28, 28)`, and
  passes with `border-top: 1px solid var(--border)`.
- **Specified colours no test asserted.** The light and dark contrast tests now ask the date and
  kind of `/de/votes/5950/` in `#595959` or `#b0b0b0`, and its cantonal votes not needed in
  `#767676` or `#9a9a9a`. With `--greyed` at `#777777` and the dark `--text-secondary` at
  `#b1b1b1` they failed.
- **A tie-break question's figures keep the text's colour.** A test on `/de/votes/6823/` asks its
  four figures in `#1c1c1c`; with the class `side-yes` on the first it failed with
  `rgb(0, 114, 96)`.
- **The design's text** now says what was built: the bar writes its words apart (decision 5),
  the box of details is checked over the map (decision 11, Risks), and the unit test of 4.1 uses
  the vote 6790 (Tests).
- **The investigation's "Not verified"** keeps the real phone only. Its section 7, "Found while
  applying", holds:
  - the 360 pixels;
  - the font and the budget tests;
  - the lake tap and the Greifensee;
  - the slider's 44 to 46 pixels.

  Its two scripts are `drag.cjs` and `lake_tap.mjs`.

`site-style.spec.ts` now has 21 tests, all passing.

## Workflow follow-up

- Push, open the pull request, and watch its CI. (Done: #18, merged on 2026-11-19 as
  `f30e07c`, CI "Running 189 tests using 1 worker", 189 passed.)
- Verify the change (`/openspec-verify-change`), then archive it:
  - the roadmap's row 10a done, its capabilities `site-style`, `reading-guide` and `result-map`;
  - `CLAUDE.md`'s status names it archived and v1 complete.
- After the merge, Q checks the published site on a phone, in its light and dark mode, with #10's
  list (design, Migration Plan).
