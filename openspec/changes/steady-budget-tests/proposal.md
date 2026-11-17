# Proposal

## Why

The four budget tests of the browser tests measure each frame's work against 16 ms (zooming,
moving and pointing at the map; clicking it; dragging a limit) or 50 ms (a jump of the
selection), and they fail now and then for the machine, not the page. While #9 was applied,
the budget of dragging failed one try with frames of 17.5 and 18.8 ms, and the map's budget of
zooming, moving and pointing one with 19.5 ms; each passed its second try. The cause is
measured: Playwright runs two workers on a machine of 4 processors, in CI as here, and a test
running beside a budget test lengthens its longest frames by 2 to 4 ms in the median. Beside
another test the longest frame of a drag had a median of 12.5 ms, alone 8.2 ms
(`investigations/performance.md`, M11); beside a second drag it went over 16 ms in 3 to 6 of
10 runs (`investigations/limits.md`). #10 adds touch inputs and their budgets, so the tests
should be steady before it.

This change is "9a" of `docs/roadmap.md`, `steady-budget-tests`, between #9 and #10.

## What Changes

- **The browser tests run one at a time** (Playwright's `workers: 1`), locally, in
  `scripts/verify-local.sh` and in CI alike, so no other test runs beside a budget test. The
  suite takes about 54 s instead of about 32 s (M11). Decided by Q (design, decision 1).
- **The second try stays.** A budget test that fails is still run once more: the busy moments
  right after a build that `tighten-map-budget` traced came with no second test running
  (M9, M10). Decided by Q (design, decision 2).
- **The spec says so:** the map's budget is measured one test at a time. The budget of the
  limits is measured "as they measure the map's budget", so it follows without a change of its
  own.
- **The investigation records why:** M11 in `investigations/performance.md`, with
  `investigations/performance/budget_tries.py`, which reads the budget tests' tries from
  Playwright's JSON reports. Written while proposing; the last measurement, after the change,
  is a task.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `result-map`: "The map's performance budget": the browser tests measure it one test at a
  time, with a scenario for it. The 16 ms, the 50 ms before a click, the inputs measured and the
  second try stay as they are.

## Non-goals

- **Faster frames.** The page meets its budgets alone (M11: the longest frame of a first try at
  most 14.0 ms in 40 runs alone). The cost of a drag that `investigations/limits.md` profiled,
  Svelte's 2,110 fill effects at each step, is not touched.
- **Another budget or another measure of a frame.** The 16 ms and the 50 ms of hard constraint
  3 stay, and so does the measurement of `add-result-map`'s design, decision 10.
- **A third try**, and **the budget tests apart in a project of their own**: considered and not
  chosen (design, decision 1).
- **The busy moments right after a build.** One worker does not remove them; the second try
  covers them, as before.
- **Phones and touch inputs:** #10.

## Impact

- **Browser tests:** `app/playwright.config.ts` gets `workers: 1`. No test changes; the four
  budget tests keep `retries: 1`.
- **CI and `scripts/verify-local.sh`:** unchanged; both run `pnpm run test:e2e`, which reads the
  configuration. Their browser tests take about 20 s longer.
- **Specs:** `result-map`, one modified requirement.
- **Docs:** `investigations/performance.md` (M11, written while proposing; the measurement after
  the change, and what became of it), `docs/roadmap.md` (the row "9a"), `CLAUDE.md` (status,
  code map, and the investigation's scripts).
- **App, calculation, pipeline and data files:** unchanged. No dependency is added.
