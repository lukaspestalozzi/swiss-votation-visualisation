# Tasks

All commands run from the repository root, on a branch started from an updated `main`.

**Before this change** (counted on `2b33f14`):
- `pnpm run test`: 52 passed in the calculation and 142 in the app;
- the browser tests: 214, one at a time;
- `uv run --directory pipeline --locked pytest`: 134 collected;
- `./scripts/verify-local.sh`: 11 of 11 steps.

**How tests are written:**
- Each test is written first and seen to fail before the code that makes it pass, one at a time.
- A test that passes when written is seen to fail against a mutant, and the task says so in a
  note "As built"; after a mutant, the restored code is built again before the next browser test.
- The numbers of tests are the plan; where a count differs while building, the note says so.
- A browser test is run alone with
  `pnpm run build && pnpm --filter app exec playwright test <file> -g "<its name>"`; "run alone"
  below means this.
- "Waits a second" in a browser test is `page.waitForTimeout(1000)` after the input, twice the
  half second of the writer (spec share-link).

**Temporary edits** made for a verification step are removed before the task is ticked.
`git status --short` then shows nothing of them.

## 1. The comparison in plain TypeScript

Spec `vote-comparison`, "Choosing the votes", "The same municipalities in both votes", "The table
of a vote" and "The comparison in the address"; design, decisions 2 to 6, 8 and 9.

- [x] 1.1 A vote's real result from its file. `vote-page.ts` exports the function that calculates a
  judged vote's result from its file, the one `votePage` uses. A test in `vote-page.test.ts`: for
  every judged vote it gives the figures `votePage` gives.

  Verify: `pnpm --filter app exec vitest run src/lib/vote-page.test.ts` passes, its count one more
  than before.
- [x] 1.2 The votes the comparison offers. Create `app/src/lib/comparison.ts` with the list of the
  judged votes in a language, as the page holds it from the build (design, decision 4), and the
  order of the second list (decision 5), and `app/src/lib/comparison.test.ts`, against
  `votes.json` and the files of entries. The tests, one at a time:
  - 124 votes, newest first, by id within a day, without 6823;
  - the text of 5960 in the lists, "28. Februar 2016 · Volksinitiative «Für Ehe und Familie -
    gegen die Heiratsstrafe»";
  - the second list for 5960: 123 votes, 5970, 5980 and 5990 first, then the start page's order
    without them;
  - the notes: that of 6650, the known difference its page writes, and that of 6860, "Vorläufiges
    Ergebnis: vom Bundesrat noch nicht erwahrt.".

  Verify: `pnpm --filter app exec vitest run src/lib/comparison.test.ts` passes, 4 tests.
- [x] 1.3 The comparison in the address. Add the writing (`votes=<first>,<second>` and the
  selection) and the reading (the votes, the selection on the first vote's tracks, and the
  unusable parts) to `comparison.ts` (design, decision 8). The tests, one at a time:
  - written: no vote; one vote; two votes and a selection, `votes=5960,5970&foreigners=-19.98`;
  - read: `votes=5960,6310&foreigners=-19.98`, with the limit at step 327;
  - each unusable `votes` part, with the votes before it applied: `votes=5960,6823`,
    `votes=5960,9999`, `votes=5960,5960`, `votes=6823`, `votes=5960,5970,5980`, `votes=abc`, and a
    second `votes` part;
  - a link without `votes`, which chooses no vote and keeps its selection's parts.

  Verify: `comparison.test.ts` passes, 8 tests.

  As built: the reading has two steps. `comparisonOf` gives the votes, the parts of `votes` it
  cannot use and the rest of the address, which the page reads with `selectionOf` on the first
  vote's tracks once it has them; a link without votes keeps its selection's parts until a first
  vote is chosen. The unusable parts of `votes` come before those of the selection in the sentence,
  as in every link the site writes. The first three tests failed before their code; the fourth
  passed when written and failed against a mutant that drops the rest without a vote.
- [x] 1.4 Another first vote. Add the selection read anew on another first vote's tracks (design,
  decision 9). A test: "up to 19.98%" of 5960, read on 6310's track, step 346, the label
  "Ausländeranteil (Ende 2019): von 0.00% bis 19.99%" (investigation, 1).

  Verify: `comparison.test.ts` passes, 9 tests.
- [x] 1.5 The table of a vote. Add a vote's table, from its real result and, while a selection
  applies, its result with the selection, and its count (design, decision 6). The tests, one at a
  time, with the selection of "Ausländeranteil" up to step 327 of 5960:
  - 5960, real and with the selection, and its count, 1'455 of 2'103;
  - 5970: 654'548, 769'763, 45.96%, "Nein", "Nein" 8½ : 14, "Abgelehnt", 1'455 of 2'103;
  - 6310: 603'173, 796'237, 43.10%, "Nein" 4½ : 18, "Abgelehnt", 1'456 of 2'104;
  - no selection: one column.

  Verify: `comparison.test.ts` passes, 13 tests; the figures are those of
  `investigations/vote-comparison.md`, 2.

  As built: `withSelection` gives a vote's result with the selection and its count from its
  entries per canton, as the vote's page works them out; `tableOf` lays out the table. The texts
  "Echtes Ergebnis" and "Vorlage" are added in three languages ("Vrai résultat", "Objet";
  "Risultato reale", "Oggetto"). The first test failed before the code; the other three passed
  when written and failed against a mutant each: the Swiss abroad's switch inverted (the first
  three), and two columns without a selection (the fourth).
- [x] 1.6 The loader of a vote's file. Add `createEntriesLoader` to `map-data.ts`, which loads a
  vote's file once per id and rejects when the request fails, with tests in `map-data.test.ts`:
  one request per id, and a failed request rejects.

  Verify: `pnpm --filter app exec vitest run src/lib/map-data.test.ts` passes, 2 tests more than
  before.

  As built: 6 tests, 4 before. The first failed before the code; the second passed when written
  and failed against a mutant that reads the answer whatever its status.

## 2. The page and its votes

Spec `vote-comparison`, "The comparison page", "Choosing the votes", "The table of a vote" and
"Loading the votes"; design, decisions 1, 3 to 7.

- [x] 2.1 The page. Create `app/e2e/compare.spec.ts` with a test of "A page in each language".
  Seen to fail: 404. Then the route `app/src/routes/[lang]/compare/` (`+page.server.ts` with its
  `entries` and the list of decision 4, `+page.svelte` with the heading and the two lists), the
  texts in three languages, and the route in the language switch of `[lang]/+layout.svelte`. Then
  a test of "The head of the comparison".

  Verify: each run alone passes; `pnpm run build` writes `compare/index.html` under each language.

  As built: after adding the route, `svelte-kit sync` writes its types anew before `pnpm run check`
  knows it. "A page in each language" failed with 404 before the route. "The head of the
  comparison" passed when written; without the route in the switch the build itself fails (the
  head throws on a route it does not know), and against a switch that links to the start page the
  test fails (`/swiss-votation-visualisation/fr`).
- [x] 2.2 The lists. A test of "The lists of a vote of 2016-02-28". Seen to fail: no vote chosen.
  Then the page reads `votes` from its address and chooses them.

  Verify: run alone, the test passes.
- [x] 2.3 The tables. Tests of "The real results" and "A known difference", one at a time. Seen to
  fail: no table. Then the tables (a component of their own), the loading of each chosen vote's
  file with the loader of 1.6, and their notes.

  Verify: each run alone passes.
  As built: the table is `ComparedVote.svelte`, the loader of the page `compare/loaders.ts`; the
  page keeps the files as they arrive in a `SvelteMap`. "The real results" failed before the code;
  "A known difference" passed when written and failed against a table without its notes.
- [x] 2.4 Loading. Tests of "A file that cannot be loaded" and "Each file once", one at a time.

  Verify: each run alone passes; against a mutant that makes a new loader per choice, "Each file
  once" fails.

  As built: both passed when written. "A file that cannot be loaded" failed against a page that
  ignores a failed request ("Die Ergebnisse werden geladen." stayed). A new loader per choice
  alone does not fail "Each file once", as the page keeps the files that arrived and asks only for
  those it has not; against a mutant with a new loader per call and a page that asks at every
  change, it failed, 5960 requested four times.

## 3. The selection on both votes

Spec `vote-comparison`, "The same municipalities in both votes", "Choosing the votes" and "The
comparison in the address"; design, decisions 2, 8 and 9.

- [x] 3.1 The limits. A test of "Two votes of one day". Seen to fail: no limit. Then the page loads
  the characteristics, holds the limits and the switch, shows the sentence of decision 2 and
  `Limits.svelte` without its count, and recalculates both votes over the same municipalities.

  Verify: run alone, the test passes.

  As built: it failed at the limit's label before the page had limits. `Limits.svelte` takes a
  count of `null`, which it does not show. Each vote's real result and entries per canton are made
  when its file arrives, so that a step of a slider recalculates only the selection's results.
- [x] 3.2 Years apart. A test of "Two votes years apart".

  Verify: run alone, the test passes; against a mutant that keeps the second vote's municipalities
  by its own figures, it fails (1,419 for 1,456).

  As built: it passed when written, and failed against that mutant with 1'419 for 1'456 and
  576'424 yes votes for 603'173.
- [x] 3.3 The address. Tests of "A link to a comparison", "The address follows the choice" and "A
  vote the comparison cannot use", one at a time. The writer and the reading of the vote's page,
  in the comparison page (design, decision 8).

  Verify: each run alone passes; `pnpm --filter app exec playwright test share-link.spec.ts`
  passes unchanged.

  As built: "A link to a comparison" passed when written, as 3.1 had built the reading, and failed
  against a page that drops the second id. "The address follows the choice" failed before the
  writer (the address stayed `#votes=5960`), "A vote the comparison cannot use" before the
  sentence. The page reads its address anew on `hashchange`, as decision 8 says, which a fourth
  test, "A link to a comparison in the same tab", checks; it failed against a page without the
  listener. The parts of `votes` the page could not use are named with the selection's, once it
  reads the selection on the first vote's tracks, as a vote's page names nothing before its
  characteristics have loaded. `share-link.spec.ts` passes unchanged.
- [x] 3.4 Another first vote. A test of "Another first vote".

  Verify: run alone, the test passes; against a mutant that clears the limits on another first
  vote, it fails.

  As built: it failed before the page read the selection anew (the label stayed "Ende 2015 …
  19.98%"), and against that mutant (no limit). A second test, "A link without votes", checks the
  other path of choosing a first vote: the address's selection, which no first vote had read, is
  read on the chosen one's tracks and written with it; it failed against a page that only reads
  the selection anew. `compare.spec.ts` and `limits.spec.ts` pass, 55 tests.

## 4. From a vote's page

Spec `vote-comparison`, "From a vote's page"; design, decision 10.

- [x] 4.1 The link. Tests of "From a vote with a selection" and "No comparison of the tie-break
  question", one at a time. Seen to fail: no link. Then the link below `Limits.svelte` on a judged
  vote's page, with the page's current selection, and its text in three languages.

  Verify: each run alone passes; `pnpm --filter app exec playwright test limits.spec.ts` passes.

  As built: "From a vote with a selection" failed before the link; the comparison opens in the
  same tab, by SvelteKit's navigation, and reads the selection the link carries. A vote's page has
  its id in its data. The page written at build time links `/de/compare#votes=5960`. "No
  comparison of the tie-break question" passed when written and failed against a page that shows
  the link outside the part only a judged vote has. `compare.spec.ts`, `limits.spec.ts` and
  `vote-page.spec.ts` pass, 65 tests.

## 5. The phone and the look

Spec `vote-comparison`, "The comparison on a phone" and "The table of a vote"; design, decision 7.

- [x] 5.1 The width. A test of "Two tables in a narrow window", and a test that the tables stand
  side by side in a window 1,280 pixels wide.

  Verify: each run alone passes.

  As built: the narrow test failed at 2,001 pixels: a list is as wide as its longest option, a
  vote's title. The lists take at most the page's width, each on its own line; the tables stand in
  a grid of one column, and of two from 640 pixels. The wide test failed before the grid (the
  second table at x 16). Measured: at 640 pixels two tables of 296 pixels side by side and nothing
  past the window, at 639 one below the other.
- [x] 5.2 The lists for a finger. A test that on a touch screen the two lists are at least 44 × 44
  pixels, as the small screens' test of the controls measures them.

  Verify: run alone, the test passes; seen to fail before the lists take the style of "Merkmal
  hinzufügen".

  As built: it failed before (both lists lower than 44 pixels) and passed once the lists take, on
  a touch screen, the least width and height of "Merkmal hinzufügen".
- [x] 5.3 The bar. A test of "The bar". Seen to fail: no bar. Then the bar of decision 7.

  Verify: run alone, the test passes.

  As built: it failed before the bar. `ComparisonBar.svelte` observes each table, keeps what the
  observer last said of each, and shows while a selection applies and one is not wholly in the
  window; each `ComparedVote` gives its table up by a bindable prop. Found while applying: that
  prop has no fallback, as Svelte refuses to bind `undefined` to a prop that has one
  (`props_invalid_value`) and the page then shows no table. The test also checks that the bar goes
  with the selection ("Zurück zum echten Ergebnis"), which failed against a bar without that
  condition.
- [x] 5.4 The colours. A test of "The colours of the tables", with `contrast.ts`, in both schemes.

  Verify: run alone, the test passes; against a mutant without the class of a side on the
  outcome, it fails.

  As built: it passed when written in both schemes, as the tables have taken the classes of their
  sides since 2.3, and every text has its contrast. Against that mutant it failed: "Abgelehnt" and
  "Angenommen" in the text's colour, `#1c1c1c`.

## 6. The budgets

Spec `vote-comparison`, "The budget of the comparison"; design, decision 11.

- [x] 6.1 The budget tests. Tests of "Dragging a bound with two votes" and "Jumps with two votes",
  with `frames.ts`, as the limits' budget tests measure, once more when a frame exceeds its budget.

  Verify: `pnpm --filter app exec playwright test compare.spec.ts -g "budget"` passes; the longest
  frames are in the note "As built".

  As built: four runs passed, each at the first measurement. The longest frames: of the drag,
  14.7, 8.1, 6.8 and 5.6 ms (83 frames each); of the jumps, 34.4, 22.5, 8.4 and 5.7 ms (28 frames
  each), the longest after the choice of 5980, whose file arrives as its frame is drawn.

## 7. Docs and checks

- [ ] 7.1 `README.md`: the list of what the site shows adds the comparison page and the link to
  it from a vote's page.

  Verify: `git diff README.md` shows that addition only.
- [ ] 7.2 All checks. `./scripts/verify-local.sh`.

  Verify: 11 of 11 steps pass; the counts are those planned (unit tests 52, and 142 and the new
  ones, about 158; browser tests about 235), or the note says why not.
- [ ] 7.3 `CLAUDE.md`: the status names `add-vote-comparison` applied; the code map adds
  `app/src/lib/comparison.ts`, its tests, the route `app/src/routes/[lang]/compare/` and its files,
  and `app/e2e/compare.spec.ts`, and changes the lines of `vote-page.ts`, `map-data.ts`,
  `[lang]/+layout.svelte`, the vote's `+page.svelte` and the texts; "Where things are" adds
  `investigations/vote-comparison.md` and its scripts among the investigations.

  Verify: every file `git diff --stat main` names under `app/` and `investigations/` is in
  `CLAUDE.md`.

## Workflow follow-up

- Push, open the pull request, and watch its CI.
- Verify the change (`/openspec-verify-change`), then archive it: the roadmap's row 12 done, its
  capability `vote-comparison`; `CLAUDE.md`'s status names it archived, and "Where things are"
  the spec `vote-comparison`.
- After the merge, Q checks the published site on a phone: a comparison from a vote's page, the
  bar, and the language switch.
