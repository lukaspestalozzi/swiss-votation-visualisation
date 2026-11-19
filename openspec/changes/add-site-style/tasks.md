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

- [ ] 1.1 The dependency. Add `@fontsource-variable/source-sans-3` 5.3.1 to the dev dependencies
  of `app` (`pnpm --filter app add -D @fontsource-variable/source-sans-3@5.3.1`).

  Verify: `pnpm install` succeeds; `git diff pnpm-workspace.yaml` shows no
  `minimumReleaseAgeExclude`; `pnpm-lock.yaml` names the package at 5.3.1 with no dependencies of
  its own.
- [ ] 1.2 The font of the pages. Create `app/e2e/site-style.spec.ts` with a test of the scenario
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
- [ ] 1.3 A font that cannot be loaded. Add a test of the scenario: the browser's requests for
  `woff2` files aborted (`page.route`), `/de/votes/5960/`;
  - the heading rendered in a font that is neither Source Sans 3 nor a serif;
  - a limit "Ausländeranteil" at step 327 gives "Mit Ihrer Auswahl" with "Angenommen";
  - the map has its 2,103 municipalities with a result.

  It passes when written, by 1.2: seen to fail against a mutant without `sans-serif`, which
  renders Liberation Serif.

  Verify: the test, run alone, passes, and fails with the mutant.
- [ ] 1.4 The budget tests wait for the font. `app/e2e/frames.ts` (or the budget tests' setup,
  whichever starts the measurement) awaits `document.fonts.ready` before the first input.

  Verify: `pnpm --filter app exec playwright test result-map.spec.ts limits.spec.ts -g "budget"`
  passes; a note "As built" records each budget test's longest frame.

## 2. The colours of the light scheme

Spec `site-style`, "The colours of the light scheme"; design, decisions 3, 4 and 9.

- [ ] 2.1 The contrast of every text. Create `app/e2e/contrast.ts` (design, decision 11): every
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
- [ ] 2.2 A majority that is not needed. Add a test of the scenario: `/de/votes/5950/`, the
  Ständemehr's "nicht nötig" in `#1c1c1c` and its cantonal votes in `#767676`.

  It passes when written, by 2.1: seen to fail against a mutant that gives `.greyed` the
  `--text-secondary` colour.

  Verify: the test, run alone, passes, and fails with the mutant.

## 3. The dark scheme

Spec `site-style`, "The dark scheme"; spec `result-map`, "A municipality without a result" and
"The map in the dark scheme"; design, decision 6.

- [ ] 3.1 A dark page. Add a test of the scenario "A dark page":
  - the pages of 2.1, in the dark scheme;
  - a paragraph `#e8e8e8` on `#121212` and a link `#8ab4f8`;
  - no text below its threshold.

  Seen to fail: a white ground. Then `app.css` sets `color-scheme: light dark` and the dark values
  of every name inside `@media (prefers-color-scheme: dark)`, and `SelectionBar.svelte` takes
  `--ground` instead of `#ffffff`.

  Verify: the test, run alone, passes.
- [ ] 3.2 The preference changes on an open page. Add a test of the scenario:
  - `/de/votes/5960/` with "Ausländeranteil" at step 327, then the dark scheme;
  - the ground `#121212`;
  - the bound still at step 327 and "Angenommen" under "Mit Ihrer Auswahl";
  - no navigation in between (the page's `performance.getEntriesByType('navigation')` unchanged).

  It passes when written, by 3.1: seen to fail against a mutant that wraps the dark values in a
  media query the page never matches.

  Verify: the test, run alone, passes, and fails with the mutant.
- [ ] 3.3 Nothing stored. Add a test of the scenario: the start page in both schemes, no element
  that switches the scheme, `document.cookie` empty, `localStorage` and `sessionStorage` empty.

  It passes when written: seen to fail against a mutant that writes the scheme to `localStorage`.

  Verify: the test, run alone, passes, and fails with the mutant.
- [ ] 3.4 The map in the dark scheme. In `result-map.spec.ts`, add tests of the scenarios:
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

## 4. The verdicts in the map's colours

Spec `site-style`, "The verdicts in the map's colours"; design, decision 5.

- [ ] 4.1 The sides of a vote's page. In `vote-page.test.ts`, two tests:
  - the vote of 2016-02-28: the Volksmehr's side `'no'`, the Ständemehr's `'yes'`, the outcome
    `'no'`, ZH's row `'no'`;
  - `/votes/5950/` without the Swiss abroad: the Ständemehr's side `null` ("nicht nötig"), the
    outcome `'no'`.

  Seen to fail: no side. Then `Verdict`, the outcome and `CantonRow` in `vote-page.ts` gain a side
  (`'yes'`, `'no'` or `null`, `null` for a canton with nothing left).

  Verify: `pnpm --filter app exec vitest run src/lib/vote-page.test.ts` passes; `pnpm run check`
  passes.
- [ ] 4.2 The side of an entry of the list. In `vote-list.test.ts`, two tests: the entry of 5960
  has the side `'no'`; the tie-break question 6823 has none (`null`).

  Seen to fail. Then the entries of `vote-list.ts` gain a side.

  Verify: `pnpm --filter app exec vitest run src/lib/vote-list.test.ts` passes.
- [ ] 4.3 The colours on the pages. Add tests of the scenarios:
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

## 5. The head

Spec `site-style`, "The head of every page"; spec `reading-guide`, "Every page links to the
guide"; design, decision 7.

- [ ] 5.1 The head. Add tests of the scenarios "On a vote's page", "On the start page and the
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

## 6. The width

Spec `site-style`, "The width of a page"; design, decision 8.

- [ ] 6.1 The width. Add tests of the scenarios:
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

## 7. The controls

Spec `site-style`, "The controls"; design, decision 10.

- [ ] 7.1 The controls in both schemes. Add a test of the scenario:
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
- [ ] 7.2 A control focused from the keyboard. Add a test of the scenario: Tab until "Ganze
  Schweiz" has the focus, in each scheme, its outline `2px solid` `#1a5fb4` or `#8ab4f8`.

  Seen to fail: Chromium's own ring. Then `app.css` sets `:focus-visible` (decision 10), and
  `Limits.svelte`'s rings of the thumbs take `--link`.

  Verify: the test, run alone, passes.

## 8. The look as a whole

Design, decision 11, and the performance budget.

- [ ] 8.1 Screenshots for Q at 360 and 1,280 pixels, in the light and the dark scheme:
  - the start page, the guide, and `/de/votes/5960/` with "Ausländeranteil" at step 327 and
    Zürich clicked;
  - twelve files in the session's scratchpad, sent to Q, not committed.

  Verify: twelve files are sent; what Q asks to change is listed in a note "As built", and each
  item is done or carried over with Q's word.
- [ ] 8.2 All browser tests. Run them.

  Verify: `pnpm run build && pnpm run test:e2e` gives "Running 187 tests using 1 worker" and "187
  passed": 166 before, 17 in `site-style.spec.ts`, 3 in `result-map.spec.ts` and 1 in
  `guide.spec.ts`. A note "As built" records the time.

## 9. Docs

- [ ] 9.1 `CLAUDE.md`:
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
- [ ] 9.2 The whole. `./scripts/verify-local.sh`.

  Verify: "All 11 steps passed", with 52 and 128 unit tests, "Running 187 tests using 1 worker",
  187 passed, and the pipeline's 134.

## Workflow follow-up

- Push, open the pull request, and watch its CI.
- Verify the change (`/openspec-verify-change`), then archive it:
  - the roadmap's row 10a done, its capabilities `site-style`, `reading-guide` and `result-map`;
  - `CLAUDE.md`'s status names it archived and v1 complete.
- After the merge, Q checks the published site on a phone, in its light and dark mode, with #10's
  list (design, Migration Plan).
