# Tasks

The mockups are the reference for the look: `node investigations/redesign/mockups/build.mjs`
writes them (`investigations/redesign.md`, "How to reproduce"), and
`investigations/redesign/mockups/mock.css` holds their sizes and colours. Each test is written
with the code it covers and seen to fail first, one at a time. The browser tests run against the
built site: `pnpm run build` before `pnpm run test:e2e`.

## 1. The tests' helpers, the colours, the width and the head

- [x] 1.1 Move what the browser tests share into `app/e2e/parts.ts`: opening a vote's page, adding
  a limit, the switch for the Swiss abroad, reading a result (the vote's and the selection's) and
  reading the head; use them in every spec file that has its own copy, with no assertion changed.
  Verify: `pnpm run build && pnpm run test:e2e` passes with 255 tests, as before the task.
- [x] 1.2 In `app/src/app.css`, give links, controls and the ring of focus the text's colour, a
  link its underline, and name the added colours once, light and dark (design, decisions 1 and
  2); change the tests of `app/e2e/site-style.spec.ts` that name `#1a5fb4` and `#8ab4f8`. Verify:
  the tests "every text has its contrast" in both schemes and "a ring of 2 pixels" pass, and
  `python3 investigations/redesign/colours.py` prints the contrasts of decision 2.
- [x] 1.3 Make a page at most 1,600 pixels wide, the start page and the guide 1,216, with 32
  pixels at each side and 16 below 640 (spec site-style, "The width of a page"). Verify: browser
  tests of its three scenarios pass (192 pixels at 1,920; the start page 1,216 wide; 16 at 360).
- [x] 1.4 The head: the mark drawn with CSS, the entry "Vergleichen" in three languages, the entry
  of the page shown as text, and the switch's "DE", "FR", "IT" below 640 pixels with the names
  "DE – Deutsch", "FR – Français", "IT – Italiano" (specs site-style, "The head of every page";
  interface-languages, "The switch between the languages"). Verify: browser tests of the head's
  four scenarios and of "The switch in a narrow window" pass; `app/e2e/languages.spec.ts` and the
  head test of `app/e2e/compare.spec.ts` pass.

## 2. A result as a row with its bars

- [x] 2.1 In `app/src/lib/vote-page.ts`, give each result what its bars show: the yes share as a
  number, and the cantons' segments in order, each with its canton, its weight and its side.
  Verify: unit tests pass for the vote 5960 (18 segments in favour, then 8 against; 16½ of 23), for
  its selection up to 19.98% foreigners (25 segments, none for BS; 18 of 22½), and for nothing left
  (no segment): `pnpm --filter app exec vitest run src/lib/vote-page.test.ts`.
- [x] 2.2 Add `app/src/routes/[lang]/votes/[id]/ResultRow.svelte`: the outcome, the Volksmehr with
  its bar and votes, the Ständemehr with its bar, no bar for a majority that is not needed; use it
  in the vote's page for the vote's result and, below it, the selection's; add the sentence in
  the selection's place in three languages. Verify: browser tests of the specs' scenarios pass:
  verdicts "The two verdicts side by side" (three), "A majority that is not needed", "The result
  of the selection" (six), "The bars of a result" (three), "The place of the selection's result"
  (three); site-style "The colours of a bar" (the first two).
- [x] 2.3 Let a result follow the room it has: the outcome above the two majorities below 640
  pixels of room, all three one below the other below 448. Verify: the browser test "The verdicts
  in Italian" passes with the bars 328 pixels wide, and the page at 360, 640 and 800 pixels is no
  wider than its window.
- [x] 2.4 The tie-break question's bar, in the text's colour and `#8c8c8c`. Verify: the browser
  tests of verdicts "The tie-break question of 2026-03-08" and of site-style "A bar that judges
  nothing" pass.
- [x] 2.5 Point the bar of a narrow window (`SelectionBar.svelte`) at the selection's row.
  Verify: the bar's tests of `app/e2e/small-screens.spec.ts` pass.
- [x] 2.6 Verify the budget with the bars: the tests "the budget of dragging" and "the budget of
  jumps" of `app/e2e/limits.spec.ts` pass, in the first measurement or the second.

## 3. The workbench

- [x] 3.1 Lay a vote's page out in two columns from 1,024 pixels: the result and the map on the
  left, staying in a window at least 700 pixels high, the map at most the window's height less
  272 pixels; the limits on the right, `clamp(19rem, 30vw, 24rem)` wide. Below 1,024 pixels:
  result, map, limits. Move the panel out of `ResultMap.svelte` to below both columns; hide the
  map's heading from the eye; let the map reach both sides of a window narrower than 640. Verify:
  browser tests of limits "The limits on a vote's page" (three), result-map "A map on the page of
  a vote" (two), "Where the panel stands" (two) and "The result and the map stay in the window"
  (three), and of site-style "A wide window" (the map 1,104 wide) pass.
- [x] 3.2 Let the wheel zoom the map only while Ctrl or ⌘ is held. Verify: browser tests of
  result-map "Zooming with the wheel" and "The wheel alone scrolls the page" pass, and the
  budget test of zooming, which now holds Ctrl, passes.
- [x] 3.3 Run every test of `app/e2e/result-map.spec.ts` in the new layout, the three budget tests
  and the tests that point at a municipality among them, and change only what names the old
  place of the panel. Verify: all its tests pass.

## 4. The limits

- [x] 4.1 In `app/src/lib/limits.ts`, add a track's histogram, 50 counts, and the step of a value.
  Verify: unit tests pass for "Ausländeranteil" of the vote day 2016-02-28 (the first bar 10, the
  ninth 140, Zürich at step 525), "Einwohner" (the 21st bar 146) and "SVP" of the vote 6400
  (2,104 municipalities): `pnpm --filter app exec vitest run src/lib/limits.test.ts`.
- [x] 4.2 Replace the list and "Hinzufügen" by the button "Merkmal hinzufügen" and a dialog,
  `CharacteristicList.svelte`: the characteristics without a limit under the eight headings,
  "Schliessen" in three languages, the button not usable when none is left; change the tests'
  helper that adds a limit. Verify: browser tests of limits "Adding and removing a limit" (eight
  scenarios, the headings in three languages) and of small-screens "The list of characteristics
  on a phone" pass, and `limits.spec.ts`, `share-link.spec.ts`, `compare.spec.ts` and
  `languages.spec.ts` pass with the new helper.
- [x] 4.3 Draw a limit as the mockups do: its label in three parts with the same text, "Entfernen"
  as a quiet button, the histogram in grey and, clipped to the part between the thumbs, in the
  text's colour, the switch drawn as a switch, the count with its bar. Verify: browser tests of
  limits "Where the municipalities lie on a track" (the first three scenarios) and "The number of
  municipalities that remain" (three) pass; site-style "The controls in both schemes" and
  small-screens "The controls on a phone" and "A thumb beside the finger" pass.
- [x] 4.4 Mark the municipality last clicked under each track. Verify: browser tests of limits
  "The municipality last clicked on a track" (four scenarios) pass.
- [x] 4.5 Verify the budgets of the limits: "Dragging a bound", "Jumps" with the list, and the new
  "Dragging with five limits and a municipality clicked" pass; so do the two tests of the frame
  after a link, 100 ms with 21 limits and 170 ms with all 35 (`app/e2e/share-link.spec.ts`). If
  the frame with 35 limits exceeds 170 ms, draw the histograms in the frames after it, keeping
  their room, and say so in `investigations/redesign.md`.

## 5. The map's parts, the panel and the cantons

- [x] 5.1 The legend as a scale: in `app/src/lib/result-map.ts` the eight classes with their names
  for assistive technology and the seven yes shares, then the entries; in `ResultMap.svelte` the
  scale and "Ja-Anteil in %" in three languages. Verify: the unit test of the legend and the
  browser tests of result-map "The legend of a vote" and "The legend of a selection" pass.
- [x] 5.2 A bar in a municipality's details. Verify: the browser test of result-map "The details
  of a municipality" passes with the bar at 31.85%, and the budget test of pointing passes.
- [x] 5.3 The panel in columns of groups, each share with its bar: `app/src/lib/characteristics.ts`
  gives a line its share or none. Verify: a unit test of the lines' shares passes; the browser
  test "The bars of the shares" passes (29 bars for Zürich, none for a line without a figure);
  the panel's tests still read each line as "name: value".
- [x] 5.4 The table of the cantons: its heading "Kantone" in three languages, a bar in each yes
  share's cell, a mark for the real share under a selection, the sentence below it in three
  languages, and its place to the right of the panel from 960 pixels. Verify: browser tests of
  verdicts "The table of the cantons" (two) and "The bar of a canton" (three) pass; the tests that
  read a row's four cells pass unchanged.
- [x] 5.5 Verify the budget of clicking, which now fills the panel's bars and the limits' marks:
  the test "the budget of clicking" passes.

## 6. The start page

- [ ] 6.1 In `app/src/lib/vote-list.ts`, group a year's votes by vote day, give each entry its yes
  share as a number, its side and its day as day and month, and add the test of a search: the
  words typed against a title. Verify: unit tests pass for the days of 2026 (2, 2 and 6 votes),
  "ahv" (7 votes), "AHV Rente" (the vote 6650), "mariage" in French (2), and 52 accepted and 72
  rejected votes: `pnpm --filter app exec vitest run src/lib/vote-list.test.ts`.
- [ ] 6.2 The start page's heading and sentence in three languages, the sentence with the number
  of characteristics from their definitions; the votes by year and day; a row as the mockup's,
  the whole row a link. Verify: browser tests of vote-list "The list of votes" (five scenarios)
  and "What an entry of the list shows" (five), and of site-style "The colours of rows" pass;
  `app/e2e/vote-list.spec.ts` and the start page's tests of `app/e2e/languages.spec.ts` pass.
- [ ] 6.3 The search field, the three buttons and the years, in three languages, staying at the
  top of the window. Verify: browser tests of vote-list "Finding a vote by its title" (six, one
  of them without scripts), "The votes by their result" (two) and "The years of the list" pass;
  the test "nothing stored" passes, reworded to the scheme's switch, the cookie and the local
  storage.
- [ ] 6.4 Verify the start page's budget and its controls: the new test "Typing and filtering"
  passes within 50 ms; small-screens "The start page's controls on a phone" and site-style "The
  start page's controls" pass; the start page is no wider than 360 pixels in three languages.

## 7. The comparison and the guide

- [ ] 7.1 The comparison: each vote's results by `ResultRow.svelte`, the second vote below the
  first, the limits beside them from 1,024 pixels; `app/src/lib/comparison.ts` gives a vote's
  results as the vote's page takes them. Verify: `comparison.test.ts` passes; browser tests of
  vote-comparison "The results of a vote" (four scenarios) and "The comparison on a phone"
  (three) pass, and `app/e2e/compare.spec.ts` passes, its two budget tests among them.
- [ ] 7.2 The guide in one column of 42rem, and its sentence on the selection's result in three
  languages. Verify: the browser test of reading-guide "Where the selection's result stands"
  passes, and `app/e2e/guide.spec.ts` passes.

## 8. The whole site

- [ ] 8.1 Run the checks that cross every page: no page wider than 360 pixels in three languages
  (small-screens "The other pages", with the comparison), every text's contrast in both schemes,
  the font. Verify: `app/e2e/small-screens.spec.ts` and `app/e2e/site-style.spec.ts` pass.
- [ ] 8.2 Take screenshots of every page, in windows 1,280 and 360 pixels wide and both schemes,
  with `node investigations/redesign/look.cjs <dir>`, and compare each with its mockup. Verify:
  the pull request lists what differs from the mockups and why, and the French and Italian texts
  added, for Q's look.
- [ ] 8.3 Add "Found while applying" to `investigations/redesign.md`: the budget tests' frames in
  the new layout, and whatever the mockups did not show. Verify: each figure in it comes from a
  command the file names.
- [ ] 8.4 Update `CLAUDE.md` (the status, "Where things are", the code map with every file added,
  moved or removed), `README.md` and the row #14 of `docs/roadmap.md`. Verify: every file the
  change added or removed under `app/` is in the code map: `git diff --stat main -- app` against
  the map.
- [ ] 8.5 Verify: `./scripts/verify-local.sh` passes all 11 steps.

## Workflow follow-up

- After the merge, Q checks the new look on a phone, and a pinch on a Mac's trackpad in Safari.
- `/openspec-verify-change`, then `/openspec-archive-change`, which sets #14 to done in
  `docs/roadmap.md`.
