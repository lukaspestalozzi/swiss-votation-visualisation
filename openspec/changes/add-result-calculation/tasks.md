# Tasks

All commands run from the repository root, on a branch started from an updated `main`.
`pnpm run test` runs the unit tests of the calculation; it reports 5 passed before this change.
Each test is written first and seen to fail before the code that makes it pass, one at a time.

"Temporary" files and edits in a verification step are removed before the task is ticked;
`git status --short` then shows nothing of them.

## 1. Reference data

- [x] 1.1 Write `investigations/data-sources/write_reference_votes.py` (design, decision 3): it
  downloads the BFS files of the six vote days into a data directory with `fetch` of
  `sources.py`, writes the seven votes to the file given as second argument, one canton per
  line, and prints one line per vote with its entries, yes, no and cantonal votes. Verify:
  `python3 investigations/data-sources/write_reference_votes.py <data directory>
  calculation/src/reference-votes.json` exits 0; its seven lines show the yes and no votes and
  the cantonal votes of the "Reference votes" scenarios of the spec (for number 595 cantonal
  votes of 6.5 : 16.5); `python3 -c "import json;
  d=json.load(open('calculation/src/reference-votes.json')); print(len(d['votes']),
  {len(v['entries']) for v in d['votes']})"` prints `7 {26}`.
- [x] 1.2 List `calculation/src/reference-votes.json` in `.prettierignore`, with the reason.
  Verify: `pnpm run format` leaves the file unchanged (`git status --short` shows it as new,
  `wc -l` prints 243), and `pnpm run format:check` prints `All matched files use Prettier code
  style!`.
- [x] 1.3 Update `investigations/data-sources.md`: add number 568 to the reference values (BBl
  2013 3129), add the script to the table of files, and add the section "Reference data for the
  calculation": the file, its source and list of municipalities, what changes when the script
  runs again, the counts of entries, and the figures the spec's scenarios use that are not in
  the reference values (the canton of Zürich in number 596: 253,697 yes, 329,992 no, 161
  entries; number 596 without it: 1,355,455 yes, 1,334,232 no, 16.5 : 5.5; the calculated
  cantonal votes of number 595). Verify: the seven lines the script printed in 1.1 are quoted
  in the section, and every figure named in this task equals the one in the spec.

## 2. The kinds of vote

- [x] 2.1 Create `calculation/src/kinds.ts` with the types of design decision 5 and
  `calculation/src/kinds.test.ts`. Write the test "a popular initiative needs both majorities",
  then `majoritiesNeeded`. Verify: `pnpm run test` reports 6 passed.
- [x] 2.2 Write the tests for the mandatory referendum, the popular initiative with a
  counter-proposal and the counter-proposal, one after the other. Verify: `pnpm run test`
  reports 9 passed.
- [x] 2.3 Write the test "an optional referendum needs the majority of voters only", see it fail,
  then make it pass. Verify: `pnpm run test` reports 10 passed.
- [x] 2.4 Write the test "a tie-break question is not calculated", see it fail, then make it pass.
  Verify: `pnpm run test` reports 11 passed.

## 3. The result

In `calculation/src/result.ts` and `calculation/src/result.test.ts`, with made-up figures.

- [x] 3.1 Write the test "the votes and the yes share" (two entries, 60 yes and 40 no, 30 yes and
  70 no: yes 90, no 110, valid 200, yes share 0.45), then the types of design decision 5 and
  `calculateResult` as far as the test needs. Verify: `pnpm run test` reports 12 passed.
- [x] 3.2 Write, one after the other, the tests "a canton with as many yes as no votes counts
  against" (Uri, 60 : 40 and 40 : 60), "a canton whose entries have no vote counts against"
  (Uri, 0 : 0) and "a canton with half a vote" (Obwalden, 60 : 40: 0.5 in favour, 0 against),
  each failing first, then the cantonal votes. Verify: `pnpm run test` reports 15 passed.
  (As built: the test of the canton without votes passed at once, since the rule for a tied
  canton covers it; it was seen to fail with a tie counted in favour.)
- [x] 3.3 Write, one after the other, the tests "as many yes as no votes: no majority of voters"
  (500 : 500), "the cantonal votes split evenly: no majority of cantons" (the twelve and
  fourteen cantons of the spec's scenario: 11.5 : 11.5) and "fewer cantons remain" (ZH and BE in
  favour, LU against: 2 : 1, reached), then both majorities. Verify: `pnpm run test` reports 18
  passed. (As built: "fewer cantons remain" passed at once; it was seen to fail with the
  majority of cantons fixed at more than 11.5.)
- [x] 3.4 Write the test "the verdict needs the cantons only where the kind does" (ZH 100 : 10,
  BE 10 : 20, LU 10 : 20: with both majorities failed, with the voters only passed), see it
  fail, then the verdict. Verify: `pnpm run test` reports 19 passed.
- [x] 3.5 Write the test "nothing remains" (no entries, for both kinds of majorities: 0 yes, 0 no,
  0 valid, no yes share, cantonal votes 0 : 0, neither majority reached, failed). Verify:
  `pnpm run test` reports 20 passed.
- [x] 3.6 Write, one after the other, the tests "a canton that does not exist" (`XX`), "votes
  below zero" (Uri, -1 yes) and "votes that are not whole" (Uri, 1.5 no), each expecting an
  error that names the canton, each failing first, then the check. Verify: `pnpm run test`
  reports 23 passed.
- [x] 3.7 Check that a tie-break question cannot reach the calculation. Verify: with a temporary
  `calculation/src/violation.ts` that calls `calculateResult([],
  majoritiesNeeded('tie-break-question'))`, `pnpm run check` fails with `error TS2345` for
  `violation.ts`; without it, `pnpm run check` exits 0.

## 4. The reference votes

In `calculation/src/reference-votes.test.ts`. The expected figures are written in the tests,
taken from `investigations/data-sources.md`.

- [ ] 4.1 Write the helper that turns a vote of `reference-votes.json` into entries, and the test
  for number 596 with all its entries: yes 1,609,152, no 1,664,224, valid 3,273,376, yes share
  49.1588% within 0.00005 percentage points, cantonal votes 16.5 : 6.5, majority of cantons
  reached, majority of voters not reached, failed. Verify: `pnpm run test` reports 24 passed.
- [ ] 4.2 Write the tests for numbers 567, 568, 595, 614, 636 and 679, one after the other, with
  the figures and the verdicts of the spec's "Reference votes" scenarios; for 595 and 614 also
  whether the majority of voters is reached, for 636 that the majority of cantons is not, for
  679 that it passes with the majority of cantons not reached. Verify: `pnpm run test` reports
  30 passed.
- [ ] 4.3 Write, one after the other, the tests "only the canton of Zürich" (number 596: 253,697
  yes, 329,992 no), "without the canton of Zürich" (1,355,455 yes, 1,334,232 no, yes share
  50.3945% within 0.00005 percentage points, cantonal votes 16.5 : 5.5, passed) and "the order
  of the entries does not matter" (number 596 reversed). Verify: `pnpm run test` reports 33
  passed.
- [ ] 4.4 Check that the tests catch the predecessor's failure mode 1. Verify: with
  `calculateResult` temporarily changed to keep only the last entry of each canton for the
  cantonal votes, `pnpm run test` reports failed tests among the reference votes; restored, 33
  passed.

## 5. Integration

- [ ] 5.1 Export the two functions and their types from `calculation/src/index.ts`. Verify:
  `pnpm run format:check`, `pnpm run lint` and `pnpm run check` each exit 0; after `pnpm run
  build`, `grep -rl "Abzockerei" app/build | wc -l` prints `0`; `pnpm run test:e2e` reports 4
  passed.
- [ ] 5.2 Run all checks. Verify: `./scripts/verify-local.sh` ends with `All 7 steps passed`.

## 6. Documentation

- [ ] 6.1 Update `openspec/config.yaml` (design, decision 8): in hard constraint 2 the two further
  kinds that need both majorities, the tie-break question that is not calculated, and that a
  vote has failed when nothing remains; in the glossary all six kinds. Hard constraint 1 stays
  as it is. Verify: `openspec validate --all --strict --no-interactive` exits 0, and `openspec
  instructions proposal --change add-result-calculation` shows the new wording.
- [ ] 6.2 Update `docs/roadmap.md`: in entry #2 the scope as built and the decisions taken (no
  open decision left); in entry #3 that it maps the sources' codes to the kinds and decides
  what "matches the official result" means. Verify: `openspec validate --all --strict
  --no-interactive` exits 0, and entry #2 names no decision that `design.md` does not record.
- [ ] 6.3 Update `CLAUDE.md`: the status, the code map of `calculation/` (the files of design
  decision 7), the row of `investigations/` (the script that writes the reference data), and
  under "Conventions" that pull requests are merged by rebasing and a branch is started from an
  updated `main`. Verify: every path named in the "Where things are" table and in the code map
  exists (`ls` each), and `./scripts/verify-local.sh` ends with `All 7 steps passed`.

## Workflow follow-up

- Verify the change with `/openspec-verify-change` before archiving.
- Archive it with `/openspec-archive-change`, and set the status of entry #2 in
  `docs/roadmap.md`.
