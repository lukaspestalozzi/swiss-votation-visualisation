# Tasks

All commands run from the repository root, on a branch started from an updated `main`. Before
this change `pnpm run test` reports 34 passed in the calculation and 10 in the app,
`uv run --directory pipeline --locked pytest` 81, and `./scripts/verify-local.sh` 11 of 11 steps.

Each test is written first and seen to fail before the code that makes it pass, one at a time.
A test that passes when written is seen to fail against a mutant or a broken copy of the data,
and the task says so in a note "As built". The numbers of tests are the plan; where a test is
split or merged while building, the note says so too.

"Temporary" files and edits in a verification step are removed before the task is ticked;
`git status --short` then shows nothing of them.

## 1. The investigation: what the tie-break question's yes and no stand for

- [x] 1.1 Write `investigations/data-sources/check_tie_break.py` (design, Context). It asks the
  Federal Chancellery for every tie-break question with votes for the initiative and the
  counter-proposal (`vote:stimmenInitiative`, `vote:stimmenGegenentwurf`), asks the BFS table
  for the yes and no votes of the same ids, and prints both side by side. It downloads with
  `fetch` of `sources.py`. Verify: `python3 investigations/data-sources/check_tie_break.py
  <downloads>` exits 0 and prints 3 of 3 tie-break questions (4653, 4893, 5523) whose yes equal
  the votes for the initiative and whose no equal those for the counter-proposal;
  `git status --short` shows no `__pycache__`.
- [x] 1.2 Add to `investigations/data-sources.md` a section "Found while proposing add-vote-list"
  with that finding and what it means for id 6823 (1,098,341 votes for the initiative,
  1,841,208 for the counter-proposal, 37.3643% and 62.6357%, cantons 2 : 21), the script in the
  table of files, and its output under "Output". Verify: every figure of the section is in the
  script's output or in the output of `reference_votes.py` already in the file.

## 2. The calculation: the outcome of each canton

In `calculation/src/result.ts` and `calculation/src/result.test.ts` (spec `result-calculation`,
"The outcome of each canton"; design, decision 9).

- [x] 2.1 Write the test "a canton with half a vote" (OW, 60 : 40: one canton, yes share 0.6,
  0.5 in favour), then the type of a canton's outcome and the field `cantons` of the result.
  Verify: `pnpm run test` reports 35 passed in the calculation; `pnpm run check` passes. (As built:
  the test "nothing remains" compares the whole result, so its expected result gains
  `cantons: []`.)
- [x] 2.2 Write, one after the other, the tests "a canton with as many yes as no votes" (UR,
  50 : 50: 1 against), "a canton without valid votes" (UR, 0 : 0: no yes share, 1 against) and
  "the cantons in the order of the constitution, only those with an entry" (made-up entries of
  JU, ZH and OW in this order: ZH, OW, JU). Verify: 38 passed in the calculation.
- [x] 2.3 In `calculation/src/reference-votes.test.ts`, write the tests of vote 596: Zürich has
  253,697 yes, 329,992 no, a yes share of 0.434644 within 0.0000005 and 1 against; the 26
  cantons' cantonal votes add up to 16.5 in favour and 6.5 against; without Zürich there are 25
  cantons and none is ZH. Verify: 41 passed in the calculation; `pnpm run lint` passes. (As built:
  the tests of 2.2 and 2.3 passed when written, as the code of 2.1 covered them; each was seen to
  fail against a mutant: a tie counted in favour, a yes share of 0 without votes, the order of
  the entries, the no share as the yes share, every canton with one vote, every canton listed.)

## 3. Formatting and texts

- [x] 3.1 `app/src/lib/format.ts` and `format.test.ts` (spec `vote-list`, "How dates and numbers
  are written"; design, decision 12). Tests, one after the other: a count ("1'609'152", and
  "0", "999", "1'000"); a share from two counts (1,609,152 of 3,273,376: "49.16%"; 1,098,341 of
  2,939,549: "37.36%"; 253,697 of 583,689: "43.46%"); a half away from zero (1 of 8: "12.50%";
  1 of 16,000: "0.01%"); cantonal votes ("16½", "6½", "10", "½"); a date ("2016-02-28":
  "28. Februar 2016"; "2026-03-08": "8. März 2026"). Verify: `pnpm --filter app run test`
  reports 15 passed (10 before). (As built: the test of the rounding passed when written, as the share's
  formula of the test before covered it; it was seen to fail against a mutant that truncates.)
- [x] 3.2 `app/src/lib/texts.ts` (design, decision 13): every German text of the specs `vote-list`
  and `verdicts`, among them the six kinds, the two majorities needed, "Ja", "Nein", "nicht
  nötig", "Angenommen", "Abgelehnt", "angenommen", "abgelehnt", the marks, the sentences of the
  tie-break question, of a provisional result and of a known difference, "Quelle: ", "Hinweis
  der Bundeskanzlei" and "Alle Abstimmungen". Verify: `pnpm run check` and `pnpm run lint`
  pass; every text in quotes in the two specs is in the module (`grep` each). (As built: checked
  by evaluating the module against each quoted text, since a sentence spans two lines of the
  module; the quoted texts it does not hold are figures, which `format.ts` writes, the data of a
  vote, and the names of sections of the investigation.)

## 4. The list

`app/src/lib/vote-list.ts` and `vote-list.test.ts` (spec `vote-list`; design, decisions 6, 10,
11), against `app/static/data/votes.json`.

- [x] 4.1 Tests, one after the other: 14 years from 2026 to 2013 and 125 votes; the first votes of
  2026 are those of 2026-09-27, the last of 2013 are 5670, 5680, 5690 in this order; the entry of
  5960 (date, title, link `/votes/5960`, "Volksinitiative", "abgelehnt, 49.16% Ja"); the entry of
  6790 ("Fakultatives Referendum", "angenommen, 50.39% Ja"); the entry of 6823 ("Stichfrage",
  "37.36% für die Initiative"); the entry of 6650 ("angenommen, 58.25% Ja"); the marks of 5960
  ("Hinweis"), of the 8 votes of 2026-03-08 and 2026-06-14 ("vorläufig") and of 5670 (none); an
  empty list throws an error that names the list of votes. Verify: `pnpm --filter app run test`
  reports 23 passed. (As built: as in `vote-data.test.ts`, the tests take the votes up to 2026-09-27, so
  that an update with a later vote day leaves them as they are. The tests of 6790 and 6650 passed
  when written; the first was seen to fail against a mutant that writes every verdict
  "abgelehnt", the second against a copy of the data with 1,450,325 official no votes for 6650.
  No test can tell the official yes share of 6650 from its municipal one: both round to 58.25%,
  as decision 4 says.)

## 5. A vote's page

`app/src/lib/vote-page.ts` and `vote-page.test.ts` (spec `verdicts`; design, decisions 3 to 9,
11), against the data files and the calculation.

- [ ] 5.1 Tests, one after the other: the head of 5960 (title, "28. Februar 2016",
  "Volksinitiative", "Braucht das Volksmehr und das Ständemehr."); its figures ("1'609'152",
  "1'664'224", "49.16%", turnout "63.25%"); its verdicts (Volksmehr "Nein" "49.16%",
  Ständemehr "Ja" "16½ : 6½", "Abgelehnt"); the verdicts of 5670 ("Ja" "54.35%", "Nein"
  "10 : 13", "Abgelehnt"). Verify: `pnpm --filter app run test` reports 27 passed.
- [ ] 5.2 Tests, one after the other: 6790 ("Braucht nur das Volksmehr.", Volksmehr "Ja"
  "50.39%", Ständemehr "nicht nötig" with "7½ : 15½" marked as greyed, "Angenommen"); the table
  of 5960 (26 rows, ZH "43.46%" "1" "Nein", "½" for the six half cantons, the "Ja" rows adding up
  to 16½); a canton without valid votes shows "–" (made-up result). Verify: 30 passed.
- [ ] 5.3 Tests, one after the other: the tie-break question 6823 (the two lines with their
  shares, "Stände: 2 für die Initiative, 21 für den Gegenentwurf", the sentence, no verdicts, no
  table); the sources of 5670 ("Quelle: BBl 2013 3129", no note, not provisional); of 5960 (the
  reference and the note under "Hinweis der Bundeskanzlei"); of 6850 (the sentence of a
  provisional result, no "Quelle: "); the known difference of 6650 (no votes "1'350'525",
  "Angenommen", the note of the spec word for word); no such note for 5960; a vote without its
  file throws an error that names the vote. Verify: 37 passed; `pnpm run check` and
  `pnpm run lint` pass.

## 6. The pages

- [ ] 6.1 The route `app/src/routes/votes/[id]/`: `+page.server.ts` (`entries()` for every id,
  `load` with the vote's file through `import.meta.glob`, calling `vote-page.ts`) and
  `+page.svelte` (the heading, the head, the figures, the two verdicts side by side, the
  outcome, the table, the sources and notes, the link "Alle Abstimmungen"; greyed by a CSS
  class). Verify: `pnpm run build` writes 125 files `app/build/votes/<id>.html`;
  `app/build/votes/5960.html` contains "16½ : 6½" and "43.46%"; no file under `app/build/_app/`
  contains the row `[1,1398,999,982,432,550]`; the largest vote page with its `__data.json` is
  below 30 kB.
- [ ] 6.2 The start page: `app/src/routes/+page.server.ts` (the list from `vote-list.ts`) and
  `+page.svelte` (the heading "Popular Vote Explorer", a heading per year, the entries with their
  marks); the cantons table goes. Verify: `pnpm run build` passes; `app/build/index.html`
  contains 125 links to `/votes/`; the start page's HTML and `__data.json` together are below
  150 kB; `pnpm run check` and `pnpm run lint` pass.
- [ ] 6.3 Look at both pages in a browser at the width of a desktop and of a phone (screenshots
  of `/` and `/votes/5960`, `/votes/6790`, `/votes/6823`). Verify: the pages read from top to
  bottom without overlapping text, and the two verdicts stand next to each other on the desktop.

## 7. The browser tests

- [ ] 7.1 Replace `app/e2e/start-page.spec.ts` by `app/e2e/vote-list.spec.ts`: the years, the
  entries of 5960 and 6823, the marks, there and back, and "all requests go to the site itself"
  (moved). Write them one at a time. Verify: `pnpm run build && pnpm run test:e2e` reports the
  tests of the list as passed; the file `start-page.spec.ts` is gone.
- [ ] 7.2 `app/e2e/vote-page.spec.ts`: the page of 5960 (head, figures, verdicts, the row of ZH,
  the note), of 6790, of 6823, of 6650; the entries stay out of the browser (no request under
  `/data/votes/`); a vote's page requests nothing from other servers. Verify: `pnpm run
  test:e2e` reports all tests passed; with a temporary `<link rel="stylesheet"
  href="https://example.org/a.css">` in `app/src/app.html`, the requests test fails and names
  `https://example.org`.

## 8. The build fails where it must

- [ ] 8.1 With `app/static/data/votes/5960.json` temporarily moved aside, `pnpm run build` fails
  and names the vote 5960; with `votes.json` temporarily holding no vote, it fails and names the
  list of votes. Verify: both builds exit with a status other than zero and print the name;
  `git status --short` is clean afterwards.

## 9. The project context and the documents

- [ ] 9.1 `openspec/config.yaml`: the interface is German until #9 (stack, the paragraph "not
  decided"). `docs/roadmap.md`: entry #4 as built (capabilities, scope, "None left" under open
  decisions). Verify: `openspec validate --all --strict --no-interactive` passes.
- [ ] 9.2 `README.md`: what the site shows now. `CLAUDE.md`: the status; the code map of `app`
  (the routes, the four modules of `src/lib/` and their tests, the two browser test files) and
  of `calculation` (the outcome of each canton). Verify: every file this change adds or removes
  is named or no longer named in the code map (`git diff --name-status origin/main` against
  `CLAUDE.md`).

## 10. Integration

- [ ] 10.1 Run `./scripts/verify-local.sh`. Verify: `All 11 steps passed`.
- [ ] 10.2 Map each scenario of the four delta specs to the test or check that covers it, in the
  pull request's description. Verify: the list has no scenario without a test or check.
- [ ] 10.3 Push the branch and update the pull request. Verify: the CI run shows `specs`, `build`
  and `pipeline` passed.

## Workflow follow-up

- Verify the change with the verify workflow, then archive it and set the status of #4 in
  `docs/roadmap.md`.
