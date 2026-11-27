# Tasks

Each task runs its tests one at a time, as it writes them, and reports "Ran <test>: PASS / FAIL".
The browser tests run against a build made after the task's change (`pnpm run build`).

## 1. No mark of validation, on the screen and in the data

- [x] 1.1 Pipeline: `write.py` writes no `validated` in the list of votes; the pipeline keeps
  choosing the Chancellery's result and every check that needs a validated vote. Test in
  `test_write.py`: no vote of the written list has the key `validated`; the existing tests of
  `test_update.py` on a vote that becomes validated assert its reference instead. Verify:
  `uv run --directory pipeline --locked pytest` passes.
- [x] 1.2 App: `vote-data.ts` loses `validated`; `vote-list.ts` loses the mark "vorläufig",
  `vote-page.ts` and `comparison.ts` the note; `texts/` loses `MARK_PROVISIONAL` and
  `PROVISIONAL` in three languages. Unit tests in `vote-list.test.ts` and `vote-page.test.ts`:
  no entry carries a mark other than "Hinweis", 6850 has no note and no source (the scenarios of
  `vote-list` and `verdicts`). Verify: `pnpm run check` and `pnpm run test` pass.
- [x] 1.3 Browser tests in `vote-list.spec.ts`, `vote-page.spec.ts` and `languages.spec.ts`: no
  "vorläufig", "Vorläufiges Ergebnis", "Résultat provisoire" or "Risultato provvisorio" on `/`,
  `/votes/6850/`, `/fr/votes/6850/` and `/it/votes/6850/`; `parts.ts` loses what reached the mark.
  Verify: those three files pass with `pnpm --filter app exec playwright test <file> --trace off`.
- [x] 1.4 `openspec/config.yaml`: hard constraint 1 and the glossary's "Validated" say that until
  a vote is validated the data holds the BFS's result without a reference, with no mark. Verify:
  `openspec validate --all --strict` passes.

## 2. The sentence at the limits

- [x] 2.1 `THOUGHT_EXPERIMENT` keeps its first sentence in three languages. The browser test of
  the guide's link from the limits (`guide.spec.ts`) asserts the sentence and that "Es zeigt
  nicht" is absent. Verify: `guide.spec.ts` and `limits.spec.ts` pass.

## 3. "Knappes Ergebnis"

- [x] 3.1 `vote-list.ts`: `kept` takes `close`, a share from 4700 to 5300 hundredths, both
  included, the tie-break question never. Unit tests: the edges 46.99, 47.00, 53.00, 53.01 with
  made-up rows, and 17 votes on the data files with 6360, 6150 and 6870 among them and 5840,
  6760 and 6823 not. Verify: `pnpm run test` passes.
- [x] 3.2 The start page's fourth button and its texts "Knappes Ergebnis", "Résultat serré",
  "Esito risicato"; on a touch screen at least 44 pixels high, as the others are. Browser tests in
  `vote-list.spec.ts`: the press shows 17 rows and leaves only that button pressed; the French
  and Italian labels; with a word typed. The budget test of a press runs with this button too
  (50 ms). Verify: `vote-list.spec.ts` and `small-screens.spec.ts` pass.

## 4. Claude's small findings

- [x] 4.1 "Ihre Stimmen" in `de.ts`, `result-map.test.ts` and `result-map.spec.ts`. Verify: both
  pass.
- [x] 4.2 The comparison's lists: block, the page's width, 1rem apart, the second disabled with
  no option; the sentence before a vote is chosen in three languages. Browser tests in
  `compare.spec.ts`: the scenarios "Before a vote is chosen", "The sentence in French and
  Italian" and "Once a first vote is chosen". Verify: `compare.spec.ts` passes.
- [x] 4.3 The row's line as a `::before` inset by 0.5rem. Browser test in `site-style.spec.ts` or
  `vote-list.spec.ts`: at 1,280 pixels the right end of a line between two rows equals that of
  the line above its vote day, within 1 pixel. Verify: the test fails before the change and passes
  after.
- [x] 4.4 The years wrap. Browser test in `small-screens.spec.ts`: on the phone of the tests
  (Pixel 7) every year's link lies within the window, and "2013" leads to its heading below the
  part that stays. Verify: the test fails before the change and passes after; `vote-list.spec.ts`
  "To a year" still passes.

## 5. The summaries: numbers, French spaces and 6730

- [ ] 5.1 `summaries.py`: the checks of decision 9 (numbers) and 10 (French spaces), each error
  naming the vote and the language. Tests in `test_summaries.py`: one per scenario of
  `vote-summaries` ("A decimal comma", "Digits parted by a space", "A colon without its space"),
  and the made-up summaries of `made_up.py` pass them. Verify: `uv run --directory pipeline
  --locked pytest` passes.
- [ ] 5.2 `pipeline/vote-summaries.json`: the numbers of the 18 summaries per language, the French
  spaces of every French summary, and 6730 without its cost in three languages; each summary still
  120 to 450 characters. Verify: a script run by hand on the file reports no summary that the new
  checks would refuse; Q reads the diff of 6730 and a sample of five French summaries.
- [ ] 5.3 `pipeline/README.md`, "The summaries": how numbers and French spaces are written, and
  that the update checks them. Verify: read.
- [ ] 5.4 Run the update: `uv run --directory pipeline --locked python -m pipeline update`. Verify:
  it ends without an error, `votes.json` has no `validated`, and `git diff --stat
  app/static/data/` shows `votes.json` and `sources.json`; the app's unit tests that read the
  summaries (`vote-page.test.ts`) pass with the new texts.

## 6. The site's French texts

- [ ] 6.1 `fr.ts`: U+00A0 before ":" and inside « », U+202F before ";", "?" and "!", in every
  text, the functions that write «…» among them. A unit test in `texts.test.ts` writes every
  French text with made-up figures and finds none of these signs without its space (except the
  cantonal votes' " : "). Verify: the test fails before the edit and passes after; `pnpm run
  test` passes.
- [ ] 6.2 The French assertions of the unit and browser tests take the spaces (`languages.spec.ts`,
  `guide.spec.ts`, `compare.spec.ts`, `limits.spec.ts`, `share-link.spec.ts`, `vote-page.spec.ts`,
  `small-screens.spec.ts` and the unit tests that compare French texts). Verify: `pnpm run
  test:e2e` passes in full; at 360 pixels no French page is wider than its window
  (`small-screens.spec.ts`).

## 7. Docs and the whole

- [ ] 7.1 `CLAUDE.md` (the start page's buttons, the comparison's lists, the code map's lines of
  the files changed), `README.md` where it names the mark, `docs/roadmap.md` (a row for this
  change, off-roadmap). Verify: `grep -rn "vorläufig\|validated" CLAUDE.md README.md` names no
  mark of the screen or field of the data.
- [ ] 7.2 `./scripts/verify-local.sh` passes in full, 11 steps. Then the preview (CLAUDE.md, "The
  preview") for Q to check on the phone: the start page's four buttons and its years, a vote's
  page without a note, the comparison before a vote is chosen. Verify: the script's last line, and
  Q's word on the preview.

## Workflow follow-up

- Verify the change, then archive it, and set its row in `docs/roadmap.md` to done.
