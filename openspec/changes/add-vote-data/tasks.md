# Tasks

All commands run from the repository root, on a branch started from an updated `main`. Before
this change `pnpm run test` reports 34 passed, all in the calculation, and
`./scripts/verify-local.sh` reports 7 of 7 steps.

`$UV` stands for `uv run --directory pipeline --locked`. `<downloads>` is a directory outside
the repository for the investigation's scripts; the pipeline's own downloads go to
`pipeline/downloads/`, which git ignores.

Each test is written first and seen to fail before the code that makes it pass, one at a time.
The numbers of tests are the plan; where a test is split or merged while building, the task
says so in a note "As built".

"Temporary" files and edits in a verification step are removed before the task is ticked;
`git status --short` then shows nothing of them.

## 1. The investigation: three facts found while proposing

- [x] 1.1 Write `investigations/data-sources/check_ids_and_cantons.py` (design, Context). It
  downloads what it needs with `fetch` of `sources.py` (the 45 BFS vote-day files, the register
  of 2026-01-01, and the Chancellery's national rows with `vote:id`, the registered voters and
  the ballots cast) and prints: how many BFS votes with a result have exactly one row with the
  same id; for the validated votes, in how many the registered voters and the ballots cast
  differ; for which cantons and vote days the entries do not sum to the canton's figures, and
  the entry that explains it. Verify: `python3
  investigations/data-sources/check_ids_and_cantons.py <downloads>` exits 0 and prints 125 of
  125 votes matched by id, 117 validated, 39 with other registered voters, 5 with other ballots
  cast, and the cantons BE and JU on 41 vote days, 2013-03-03 to 2025-11-30, explained by entry
  6831 Moutier; `git status --short` shows no `__pycache__`.
- [x] 1.2 Update `investigations/data-sources.md`: add the script to the table of files and its
  output to "Output"; add a section "Found while proposing add-vote-data" with the three facts,
  with Clavaleyres (merged into Murten, FR, on 2022-01-01; its votes are inside Murten's entry)
  and with one sentence that `calculation/src/reference-votes.json` has Moutier under JU for
  every vote (design, decision 17); in answer 5, say that the rows are matched by id; in "What
  the changes have to decide", note for points 1 to 4 and 6 to 9 what this change decided.
  Verify: every figure in the new section equals the script's output of 1.1, and
  `grep -c "add-vote-data" investigations/data-sources.md` prints at least 2.

## 2. The pipeline as a Python project, and its checks

- [x] 2.1 Create the project (design, decisions 9 and 16): `pipeline/pyproject.toml` (name
  `pipeline`, `requires-python = ">=3.13"`, the dependency polars, the development dependencies
  ruff, mypy and pytest, ruff with line length 100, mypy strict over `src` and `tests`, pytest
  over `tests`), `pipeline/.python-version` (`3.13`), `pipeline/uv.lock` (written by `uv lock`),
  `pipeline/src/pipeline/__init__.py`, and one first test in `pipeline/tests/test_counts.py`
  (3.1 replaces its body). Add to `.gitignore`: `pipeline/.venv`, `pipeline/downloads`,
  `__pycache__`, `.mypy_cache`, `.pytest_cache`, `.ruff_cache`. Verify: `$UV ruff format --check
  .`, `$UV ruff check .`, `$UV mypy` and `$UV pytest` each exit 0; `git status --short` lists
  no file under `pipeline/.venv`; `pnpm run format:check` and `pnpm run lint` still pass.
- [x] 2.2 Add the four steps to `scripts/verify-local.sh` after the existing seven, the pytest
  step to `--quick`, the refusal to run without `uv`, and the header comment (design, decision
  14). Verify: `./scripts/verify-local.sh` reports `All 11 steps passed`;
  `./scripts/verify-local.sh --quick` runs exactly `pnpm run test` and the pytest step; with
  `PATH` temporarily set so that `uv` is not found, the script runs no check, names `uv` and
  exits with status 1; with a temporary failing assertion in the pipeline's test, the script
  reports 1 of 11 steps failed and names the pytest step.
- [x] 2.3 Add the job `pipeline` to `.github/workflows/ci.yml`: checkout, `astral-sh/setup-uv`
  in its newest major version (read from the action's releases page), then the four commands
  of decision 14 as four steps. It has no `needs`. Verify: `grep -c "uv run --directory
  pipeline --locked" .github/workflows/ci.yml` prints 4, the four commands are character for
  character those of `scripts/verify-local.sh`, and the job is checked on the pull request in
  9.3.
- [x] 2.4 Extend `.claude/hooks/session-start.sh`: fail with a message when `uv` is not found,
  and run `uv sync --directory pipeline --locked` without passing its output on. Verify:
  `rm -rf pipeline/.venv && CLAUDE_CODE_REMOTE=true ./.claude/hooks/session-start.sh` exits 0,
  prints nothing, and `$UV pytest` passes afterwards; a second run exits 0.

## 3. Reading the sources, with the checks on the input

Fixtures are small made-up files in the shape of the real ones, in `pipeline/tests/fixtures/`:
two cantons, a handful of municipalities, three votes.

- [x] 3.1 `pipeline/src/pipeline/counts.py` and `tests/test_counts.py` (spec `vote-data`,
  "Every count is a whole number from zero"; design, decision 9): the one function every count
  passes, with an error that carries the file, the vote, the entry and the figure. Tests, one
  after the other: a whole number from zero is returned as it is (0 and 1398); a missing value
  is refused; 550.0 is refused; the text "1398" is refused; -1 is refused; `True` is refused.
  Verify: `$UV pytest -q tests/test_counts.py` reports 6 passed, and the error of the missing
  value contains the file name, the vote id, the entry number and "yes votes". (As built: one
  condition covers all five refusals, so their tests passed when written; each was seen to fail
  against a mutant of the function that accepts its value.)
- [x] 3.2 `pipeline/src/pipeline/feed.py` and `tests/test_feed.py`, the votes of a BFS file
  (spec `vote-data`: "The votes covered", "The list of votes", "The kind of a vote"; spec
  `municipalities`: "One list of municipalities for all votes"). Tests, one after the other: a
  vote is read with its id, date, kind and three titles; the code 7 stops with the vote and the
  code; code 2 with the double majority stops; a missing Italian title stops with the vote and
  the language; a vote that is not closed is left out and named; the reference date of the file
  is read; a file without one stops. Verify: `$UV pytest -q tests/test_feed.py` reports 7
  passed. (As built: 8; the title test is two, a missing and an empty title. The tests of the
  left-out vote and of the reference date passed when written, since the first test needed that
  code; each was seen to fail against a mutant. The fixtures are built by
  `pipeline/tests/made_up.py`, not kept as files: every test breaks its own copy, and the sums
  always add up.)
- [x] 3.3 The entries of a vote in `feed.py` (spec `vote-data`: "The entries of a vote", "Every
  count is a whole number from zero", "The valid ballots and the votes"). Tests, one after the
  other: the entries are read with canton, number and five counts; missing yes votes in an
  entry of a complete vote stop with file, vote, entry and "yes votes"; more valid ballots than
  ballots cast stop; more ballots cast than registered voters stop; in a popular initiative,
  valid ballots other than yes plus no stop; in an initiative with a counter-proposal, more
  valid ballots than yes plus no are accepted; fewer stop. Verify: `$UV pytest -q
  tests/test_feed.py` reports 14 passed, and `$UV mypy` passes. (As built: 22. Added
  while building, each failing first: a canton numbered outside 1 to 26 stops (canton 0 was read
  as JU), a verdict that is not true or false stops, cantonal votes that are not whole numbers
  stop, and the cantonal votes and the verdict are read. The first two tests passed when
  written and were seen to fail against mutants.)
- [x] 3.4 `pipeline/src/pipeline/chancellery.py` and `tests/test_chancellery.py` (spec
  `vote-data`: "The result of a vote", "The Chancellery's reference and note"; design, decision
  15). Tests, one after the other: a validated row is read with number, yes, no, cantonal
  votes, verdict, reference and note in three languages; a row without figures is not
  validated; an optional referendum has no cantonal votes; two rows with one id stop; a
  validated row with neither "accepted" nor "rejected" stops, except for a tie-break question;
  a validated row without a reference stops; the vote days are listed. Verify: `$UV pytest -q
  tests/test_chancellery.py` reports 7 passed. (As built: the reader keeps a missing verdict as none,
  since only the BFS file knows whether the vote is a tie-break question; the check that stops
  on it is a test of 4.3. Four tests passed when written, as the first test needed their code;
  each was seen to fail against a mutant.)
- [x] 3.5 `pipeline/src/pipeline/register.py` and `tests/test_register.py` (spec
  `municipalities`, "The list of municipalities"; design, decision 15). Tests, one after the
  other: the municipalities are read with number, name and canton, the canton found through the
  district; a number given twice stops with the number; a municipality without a name, or under
  a canton that is not one of the 26, stops. Verify: `$UV pytest -q tests/test_register.py`
  reports 3 passed. (As built: 3 tests, one of them with three cases, so pytest reports 5. The
  refusals were written with the first test; each was seen to fail against a mutant.)

## 4. The checks between the sources

In `pipeline/src/pipeline/checks.py` and `tests/test_checks.py`, with
`pipeline/known-differences.json` and `pipeline/canton-changes.json` (design, decisions 1 and
5). In the tests the two lists are given as arguments; the files hold the real lines.

- [x] 4.1 The entries and the list (spec `municipalities`: "Every entry is known and counted
  once", "The Swiss abroad are entries of their own", "Municipalities without a result", "One
  list of municipalities for all votes"). Tests, one after the other: an entry with the number
  7999 stops with the vote and the number; a number twice in a vote stops; the entry 9010 under
  ZH is accepted and marked as Swiss abroad; the entry 9010 under BE stops; the municipalities
  of the list without an entry are named for the vote; vote-day files with two reference dates
  stop with the file and both dates. Verify: `$UV pytest -q tests/test_checks.py` reports 6
  passed. (As built: three tests passed when written, as the first one's code covered
  them; each was seen to fail against a mutant.)
- [x] 4.2 The canton an entry counts for (spec `vote-data`, "An entry counts for the canton it
  voted in"). Write `pipeline/canton-changes.json` with the line for Moutier. Tests, one after
  the other: an entry on the list of changes is grouped under its earlier canton up to the last
  day and under its own canton after it; entries that do not sum to the canton's figures stop
  with the vote, the canton, the count and both figures. Verify: `$UV pytest -q
  tests/test_checks.py` reports 8 passed.
- [x] 4.3 The sums and the official result (spec `vote-data`: "The entries add up to the figures
  of the BFS", "The entries agree with the official result", "The two sources agree on the
  verdict and the cantonal votes", "The votes covered"). Write
  `pipeline/known-differences.json` with the line for id 6650. Tests, one after the other:
  entries that sum to one yes vote more than the national figure stop with the vote, "yes
  votes" and both figures; a validated vote whose sums equal the Chancellery's passes; a
  difference that is not listed stops with the vote, the count and both figures; a listed
  difference passes; a listed line that does not occur stops with the vote and the line; two
  verdicts that differ stop; cantonal votes that differ stop; a validated vote without a
  complete result stops; a BFS vote without a row of the Chancellery stops. Verify: `$UV pytest
  -q tests/test_checks.py` reports 17 passed, and `$UV mypy` and `$UV ruff check .` pass.
  (As built: 18, with the test moved from 3.4: a validated vote without a verdict stops, except
  a tie-break question. Two tests passed when written and were seen to fail against mutants.
  Run over the downloads of the investigation, all checks pass for the 125 votes; without
  Moutier's line they stop at vote 5670 for BE, without the known difference at vote 6650.)

## 5. Writing the data files

- [ ] 5.1 `pipeline/src/pipeline/write.py` and `tests/test_write.py` (design, decisions 11 and
  12; spec `vote-data`, "The record of the sources"). Tests, one after the other: `votes.json`
  of the fixture has every key of decision 12, `null` where the spec says none, and the votes
  ordered by date and id; a vote file has the 26 cantons in the order of the constitution, the
  rows ordered by number, and `withoutResult`; `municipalities.json` has the reference date,
  the municipalities per canton and the Swiss abroad per canton; `sources.json` has address,
  bytes, SHA-256 and the stated time of each source file; writing twice gives the same bytes.
  Verify: `$UV pytest -q tests/test_write.py` reports 5 passed.
- [ ] 5.2 `pipeline/src/pipeline/download.py`, `update.py` and `__main__.py`, with
  `tests/test_update.py` (design, decision 13; spec `vote-data`, "Adding a vote day"). The
  tests run the update on fixture downloads with a download function that is passed in. Tests,
  one after the other: a run writes the four kinds of data files; a failing check leaves the
  data directory as it was and exits with a status other than zero; a source that cannot be
  reached is named, and the data directory is as it was; a second vote day in the sources is
  added and named in the output; a vote that the Chancellery now validates becomes validated;
  a vote without a complete result is named as left out. Verify: `$UV pytest -q
  tests/test_update.py` reports 6 passed; `$UV pytest -q` reports 58 passed; `$UV python -m
  pipeline --help` names `update` and `--reuse-downloads`.
- [ ] 5.3 Rewrite `pipeline/README.md`: what the pipeline is, its three sources with their
  addresses, the files of decision 16, the procedure that adds a vote day (the command, what it
  prints, reviewing the diff, the pull request), what to do when it stops (the two hand-kept
  lists, a new reference date), and the boundary to the other modules. Verify: the command in
  the README is character for character the one of decision 13, and every file of
  `pipeline/src/pipeline/` is named.

## 6. The first data

- [ ] 6.1 List `app/static/data/` in `.prettierignore`, with the reason. Run `$UV python -m
  pipeline update`. Verify against the scenarios "on 2026-11-14" of both specs, as far as the
  sources have not moved since: the command exits 0 and names the four votes of 2026-11-29 as
  left out; `ls app/static/data/votes | wc -l` equals the number of votes in `votes.json`
  (125); 117 validated and 8 not; `municipalities.json` has 2,110 municipalities, the reference
  date 2026-01-01 and 12 entries of Swiss abroad; `sources.json` names 47 source files;
  `du -sh app/static/data` is about 7.5 MB and no vote file is above 61 kB. Where the sources
  have moved (a new vote day, a validation), the task notes the figures found and why.
- [ ] 6.2 Verify the named votes in the written files with `python3 -c` one-liners or `jq`: id
  5960 (result 1,609,152 : 1,664,224, 16.5 : 6.5, not passed, reference BBl 2019 4599, a note in
  three languages, sums 5,302,873 / 3,354,019 / 3,273,376, 2,115 entries, `withoutResult` 389,
  408, 422, 535, 629, 868, 877, entry 1 `[1, 1398, 999, 982, 432, 550]` under ZH, entry 9010
  with 3,596 yes and 4,939 no); id 6650 (result no 1,350,325, sums no 1,350,525); id 6790 (no
  cantonal votes, passed, `withoutResult` 389, 408, 535, 629, 877); id 5670 (Moutier 6831
  under BE, 11 entries of Swiss abroad, none 9010); id 6850 (Moutier under JU); ids 6821 to
  6823 (kinds, number 682, `passed` null for 6823). Verify: every figure equals the scenario
  that names it.
- [ ] 6.3 The run is repeatable and the lists bite, on the real data. Verify, each with
  `--reuse-downloads`: a second run leaves `git status --short app/static/data` unchanged;
  with `pipeline/canton-changes.json` temporarily emptied, the run stops, names id 5670, BE and
  both figures, and `git status --short app/static/data` is unchanged; with
  `pipeline/known-differences.json` temporarily emptied, it stops and names id 6650, "no votes",
  1,350,525 and 1,350,325; with a temporary extra line for id 5960, it stops and names that
  line.
- [ ] 6.4 Check that the site carries the data and nothing else changed. Verify: `pnpm run
  format:check` and `pnpm run lint` pass; `pnpm run build` writes `app/build/data/votes.json`;
  `pnpm run test:e2e` reports 4 passed.

## 7. The calculation over the data files

- [ ] 7.1 Add Vitest to the app: `vitest` as a development dependency of `app/package.json` in
  the version the calculation uses, the script `test`, and in `app/vite.config.ts`
  `test.include` `src/**/*.test.ts` (design, decision 10). Write `app/src/lib/vote-data.ts` with
  the types of the four data files (design, decision 12) and
  `app/src/lib/vote-data.test.ts` with the first test, "every vote of the list has its file,
  and no file is left over". Verify: `pnpm install` adds no `minimumReleaseAgeExclude` entry;
  `pnpm run test` reports 34 passed for the calculation and 1 passed for the app; `pnpm run
  check` and `pnpm run lint` pass; `pnpm run test:e2e` still reports 4 passed.
- [ ] 7.2 The rules over every vote (spec `vote-data`, "The calculation gives the result of
  every vote"). Tests, one after the other: for every vote whose kind is calculated, the
  calculated yes and no votes equal the sums, the cantonal votes equal the result's where it
  has them, and the verdict equals the result's; a validated vote has cantonal votes in its
  result exactly when its kind needs both majorities; a tie-break question is not calculated,
  and its entries sum to the yes and no votes of the list. Verify: `pnpm run test` reports 4
  passed for the app. Then the control: with one yes vote temporarily added to an entry of the
  canton of Jura in `app/static/data/votes/5990.json`, the test fails and names id 5990;
  restore the file with `git checkout`.
- [ ] 7.3 The named votes (the same requirement, and spec `municipalities`). Tests, one after
  the other: id 5960 gives 1,609,152 : 1,664,224, 16.5 : 6.5, failed; id 5670 gives 1,283,951 :
  1,078,531, 10 : 13, failed; id 6790 gives 1,384,586 : 1,363,362, passed; id 6650 gives
  1,884,096 : 1,350,525, 15 : 8, passed, and its result has 1,350,325 no votes; Moutier is
  under BE in id 5670 and under JU in id 6850; in every vote file, every municipality of the
  list is exactly one entry or named as without a result, and for id 5960 these are the seven
  of the scenario. Verify: `pnpm run test` reports 34 passed for the calculation and 10 passed
  for the app; `./scripts/verify-local.sh --quick` passes both of its steps.

## 8. The project context and the documents

- [ ] 8.1 Update `openspec/config.yaml` as design decision 18 says: hard constraint 1, the
  stack, the modules, the quality bar and the glossary. Verify: `openspec validate --all
  --strict --no-interactive` passes; `openspec instructions specs --change add-vote-data`
  shows the new wording of hard constraint 1; `grep -n "Not verified\|language of the pipeline"
  openspec/config.yaml` finds no line that still calls them open.
- [ ] 8.2 Update `docs/roadmap.md`: entry #3 as built (scope, and "None left" under open
  decisions, pointing to this design), the wording of #6 and #12 (design, decision 18), and in
  "Investigations" what the first investigation's points became. The status of #3 changes when
  the change is archived. Verify: `grep -n "at the time of the vote\|different lists of
  municipalities" docs/roadmap.md` finds nothing.
- [ ] 8.3 Update `README.md`: what the repository holds today, and `uv` among the requirements
  of "Run it" with the command that updates the data. Verify: every command in "Run it" runs
  as written.
- [ ] 8.4 Update `CLAUDE.md`: the status; in "Where things are", `app/static/data/` and the
  pipeline; the code map of `pipeline` (every file of decision 16, the two hand-kept lists) and
  of `app` (`src/lib/vote-data.ts`, its test, `static/data/`, Vitest); "Build and verify" (the
  11 steps, the three CI jobs, the four `uv` commands, the update command, the pinned versions:
  Python in `pipeline/.python-version`, the packages in `pipeline/uv.lock`); the conventions
  that changed. Verify: every file this change adds is named in the code map (`git status
  --short` and `git diff --stat main` list no added file outside `app/static/data/votes/` and
  `pipeline/tests/` that the map does not name).

## 9. Integration

- [ ] 9.1 Run `./scripts/verify-local.sh`. Verify: `All 11 steps passed`.
- [ ] 9.2 Check the change against its specs once more by hand: each "THEN" of the scenarios
  that stop the update is the message of a pipeline test, and each scenario with figures of a
  named vote is a check of 6.2 or a test of 7.3. Verify: a list of scenario to test or check,
  written into the pull request's description, has no empty line.
- [ ] 9.3 Push the branch and open the pull request as a draft. Verify: the CI run shows the
  three jobs `specs`, `build` and `pipeline`, each passed.

## Workflow follow-up

- Verify the change with the verify workflow, then archive it and set the status of #3 in
  `docs/roadmap.md`.
