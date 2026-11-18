# Tasks

The browser tests run against the built site: run `pnpm run build` before every
`pnpm run test:e2e` below. A "report" is Playwright's JSON report of a run,
`PLAYWRIGHT_JSON_OUTPUT_NAME=<a file outside the repository> pnpm --filter app exec playwright test --reporter=json`,
read with `python3 -I investigations/performance/budget_tries.py <report> ...`, which prints each
budget test's first tries, failures, retries and longest frames.

## 1. The browser tests one at a time

- [x] 1.1 One worker (spec `result-map`, scenario "No other test beside a budget test"; design,
  decision 1). `app/playwright.config.ts` sets `workers: 1`, with a comment that says why and
  cites this change's design. The four budget tests keep `retries: 1` (decision 2); no test
  changes. Verify: `pnpm run build`, then `pnpm run test:e2e` prints "Running 138 tests using 1
  worker" and "138 passed"; write down its time, expected about 54 s
  (`investigations/performance.md`, M11).

  (As built: "Running 138 tests using 1 worker", "138 passed (48.3s)".)
- [x] 1.2 The measurement after the change, right after a build, the condition of CI and of
  `scripts/verify-local.sh` (M9, M10). Three times: `pnpm run build`, then the whole suite with
  a report and no `--workers` on the command line. Verify: each run prints "using 1 worker"
  and "138 passed"; `budget_tries.py` over the three reports prints the four budget tests with
  3 first tries each; write down what it prints, every first try that failed with its frames
  included. Expected: the drag's longest frame near M11's runs alone (median 8.2 ms), not near
  its runs beside another test (12.5 ms).

  (As built: each run printed "Running 138 tests using 1 worker"; 138 passed, none flaky or
  failed, in 49, 49 and 50 s. `budget_tries.py` prints each report apart, so one first try of
  each budget test per report, three in all; none failed, none was retried. The longest frame
  of each first try, in the three runs: dragging 6.7, 8.6 and 8.8 ms; zooming, moving and
  pointing 6.7, 9.3 and 8.3 ms; clicking 5.0, 4.8 and 4.9 ms; jumps 10.4, 8.4 and 9.6 ms. The
  drag's median, 8.6 ms, is near M11's runs alone.)
- [x] 1.3 The investigation records it. `investigations/performance.md` gets M12, "the browser
  tests with one worker, right after a build", with what task 1.2 found and its commands in
  "How to reproduce", and its "What became of it" a paragraph on `steady-budget-tests` (row
  "9a" of `docs/roadmap.md`): one worker from M11 and M12, the second try kept from M9 and M10.
  Verify: M12's commands in "How to reproduce" are the ones task 1.2 ran, and every figure M12
  cites is in what `budget_tries.py` printed there.

  (As built: also a finding 8. Every number of M12 from its own runs is in what
  `budget_tries.py` printed; the others are the date, the one worker, and M11's 12.5 and
  8.2 ms, cited as M11's.)

## 2. Docs and the whole

- [x] 2.1 `CLAUDE.md`: in the code map, the row of `app/playwright.config.ts` says the browser
  tests run one at a time; in "Build and verify", the row of `pnpm run test:e2e` says so too;
  in "Where things are", the row of `investigations/` names `budget_tries.py` among the scripts
  of `performance/`, which reads Playwright's JSON reports. Verify:
  `grep -n "one at a time\|budget_tries" CLAUDE.md` shows the three rows;
  `git diff --stat main` lists only `app/playwright.config.ts`, `investigations/performance.md`,
  `investigations/performance/budget_tries.py`, `CLAUDE.md` and this change's files;
  `./scripts/verify-local.sh` passes its 11 steps.

  (As built: the grep shows lines 43, 134 and 214. The local `main` of the cloud machine still
  pointed at the merge of PR #1, so `git diff --stat main` listed 371 files; against
  `origin/main` (a50ac21) it lists the nine files named. `./scripts/verify-local.sh`: "All 11
  steps passed", the browser tests "Running 138 tests using 1 worker", 138 passed in 51.2 s.)

## Verification

**`/openspec-verify-change`** on 2026-11-18 found:
- no critical issue and no warning;
- the one modified requirement implemented, and its three scenarios handled;
- one suggestion: no test kept the one worker, so a later change could remove it unnoticed.

Q asked to fix it. A browser test in `app/e2e/result-map.spec.ts`, "the browser tests run one at
a time: the configuration asks for one worker", checks `workers` in `app/playwright.config.ts`.
It checks the configuration, not the run, so that a measurement may still ask for two workers on
the command line, as M11's commands do. The verification had checked that such a flag still
overrides the configuration: "Running 4 tests using 2 workers". The test passed when written;
with `workers: 2` in the configuration it failed ("Expected: 1", "Received: 2").

`./scripts/verify-local.sh` after the fix: 11 of 11 steps, with 52 and 117 unit tests, 139
browser tests on 1 worker, none flaky, in 48.0 s, and 134 of the pipeline.

Not changed: the scenarios of "The map's performance budget" name `/votes/5960/`, where the
tests open `/de/votes/5960/` since #9. The modified requirement keeps its text whole; the
addresses of the specs are a matter for another change.

## Workflow follow-up

- After the push, the pull request's CI: its build job prints "Running 138 tests using 1
  worker", and the step "Browser tests" takes longer than the 29 s of run 88 on `main` with two
  workers. Write its time into M12 of `investigations/performance.md`. (Done: on fc9639a,
  "Running 138 tests using 1 worker", 138 passed in 51.7 s; the step took 52 s.)
- Verify the change (`/openspec-verify-change`), then archive it: the roadmap's row "9a" done,
  its capabilities `result-map` (the budget of the limits follows the map's measurement), and
  `CLAUDE.md`'s status naming the change archived.
