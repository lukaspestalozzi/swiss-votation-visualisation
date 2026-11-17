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
- [ ] 1.2 The measurement after the change, right after a build, the condition of CI and of
  `scripts/verify-local.sh` (M9, M10). Three times: `pnpm run build`, then the whole suite with
  a report and no `--workers` on the command line. Verify: each run prints "using 1 worker"
  and "138 passed"; `budget_tries.py` over the three reports prints the four budget tests with
  3 first tries each; write down what it prints, every first try that failed with its frames
  included. Expected: the drag's longest frame near M11's runs alone (median 8.2 ms), not near
  its runs beside another test (12.5 ms).
- [ ] 1.3 The investigation records it. `investigations/performance.md` gets M12, "the browser
  tests with one worker, right after a build", with what task 1.2 found and its commands in
  "How to reproduce", and its "What became of it" a paragraph on `steady-budget-tests` (row
  "9a" of `docs/roadmap.md`): one worker from M11 and M12, the second try kept from M9 and M10.
  Verify: M12's commands in "How to reproduce" are the ones task 1.2 ran, and every figure M12
  cites is in what `budget_tries.py` printed there.

## 2. Docs and the whole

- [ ] 2.1 `CLAUDE.md`: in the code map, the row of `app/playwright.config.ts` says the browser
  tests run one at a time; in "Build and verify", the row of `pnpm run test:e2e` says so too;
  in "Where things are", the row of `investigations/` names `budget_tries.py` among the scripts
  of `performance/`, which reads Playwright's JSON reports. Verify:
  `grep -n "one at a time\|budget_tries" CLAUDE.md` shows the three rows;
  `git diff --stat main` lists only `app/playwright.config.ts`, `investigations/performance.md`,
  `investigations/performance/budget_tries.py`, `CLAUDE.md` and this change's files;
  `./scripts/verify-local.sh` passes its 11 steps.

## Workflow follow-up

- After the push, the pull request's CI: its build job prints "Running 138 tests using 1
  worker", and the step "Browser tests" takes longer than the 29 s of run 88 on `main` with two
  workers. Write its time into M12 of `investigations/performance.md`.
- Verify the change (`/openspec-verify-change`), then archive it: the roadmap's row "9a" done,
  its capabilities `result-map` (the budget of the limits follows the map's measurement), and
  `CLAUDE.md`'s status naming the change archived.
