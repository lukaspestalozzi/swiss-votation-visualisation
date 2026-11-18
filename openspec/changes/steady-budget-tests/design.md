# Design

## Context

See `proposal.md` for why. The current state:

- **The four budget tests:** in `app/e2e/result-map.spec.ts`, zooming, moving and pointing, and
  clicking (16 ms); in `app/e2e/limits.spec.ts`, dragging a bound (16 ms) and the jumps
  (50 ms). Each sits in a `test.describe` with `retries: 1`. They measure each frame with the
  script of `app/e2e/frames.ts` (design of `add-result-map`, decision 10), which measures wall
  time on the page's main thread.
- **The specs:** `result-map`, "The map's performance budget", says how the browser tests
  measure it, and "once more when a frame exceeds it". `limits`, "The budget of the limits",
  says they measure it "as they measure the map's budget, and once more when a frame exceeds
  it".
- **The workers:** `app/playwright.config.ts` sets none, so Playwright runs half as many
  workers as the machine has processors: 2 on the cloud machine of 4, and 2 in CI (the build job
  of run 88 on `main`, 2026-11-17: "Running 138 tests using 2 workers", 138 passed in 28.3 s).
  Tests in one file run one after the other in one worker; files run in parallel.
- **The measurements** this design cites are M9 to M11 of `investigations/performance.md`, and
  the drag's of `investigations/limits.md`.

## Goals / Non-Goals

**Goals:**
- No other browser test runs while a budget test measures, wherever the tests run.
- A page that is really slower than its budget still fails.

**Non-Goals:**
- Faster frames, another budget, or another measure of a frame: see the proposal's
  non-goals.

## Decisions

### 1. The browser tests run one at a time (Q)

`app/playwright.config.ts` sets `workers: 1`. Every way the tests run reads it:
`pnpm run test:e2e`, `scripts/verify-local.sh` and CI, which call it, and a direct
`pnpm --filter app exec playwright test`. A run that names `--workers` on the command line, as
M11 does to measure two, overrides it. No test and no script changes. One browser test, added
after the verification, checks that the configuration asks for one worker, so that the setting
cannot go unnoticed.

Why: the cause the measurements show is a second test at the same time, not the page.
- With two workers, the longest frame of a drag had a median of 12.5 ms and reached 14.8 ms in
  5 first tries; alone 8.2 ms, 14.0 ms at most in 10 (M11).
- `investigations/limits.md`: with one worker, 10 drags gave 8.3 to 11.1 ms, all passing; beside
  a second drag, the longest frame was 9.5 to 17.8 ms, over 16 ms in 3 to 6 of 10 runs.
- Of the options, this one removes the cause for every test that measures time, keeps the
  budget tests running whatever else fails, and is one line.

The cost is time: the suite took about 32 s a pass with two workers and 54 s with one (M11).
CI's browser tests will take longer by about as much; the pull request's CI shows how much
(`tasks.md`, "Workflow follow-up").

Alternatives considered:
- **The budget tests apart, one at a time, after the others:** a Playwright project of their own
  with `workers: 1` and `dependencies` on a project of the other tests, the four tests tagged.
  About 5 s slower instead of about 20 s. But Playwright skips a project whose dependency
  failed: verified while proposing, one failing test in the first project left the second
  "did not run". So one broken test of the list or the guide would hide the budgets until it is
  fixed. A variant, two runs of Playwright in `test:e2e`, keeps them running but needs a script
  that runs both and joins their exit codes. `tighten-map-budget` (its design, decision 7)
  turned down running them apart as more moving parts.
- **A third try** (`retries: 2`): the smallest change, but the cause stays. Beside another
  test, a drag's longest frame came within 1 to 3.5 ms of its budget, so a third busy moment
  fails it.
- **Loosening the measure:** allowing one frame over 16 ms per run would weaken what hard
  constraint 3 promises. Counting each frame's CPU time from a Chrome trace is the measure
  `tighten-map-budget` rejected (its design, decision 7): more test code, bound to Chromium,
  about a second slower per test.

### 2. The second try stays (Q)

The four budget tests keep `retries: 1`, and the spec keeps "once more when a frame exceeds it".

Why: the frames over 16 ms that `tighten-map-budget` traced came right after a build with no
second test running (M9, M10). In the one traced, the main thread had a processor for 15.1 ms
of a 30.8 ms frame. One worker does not remove those moments, and the browser tests run right
after the build in CI and in `scripts/verify-local.sh`. A page that is really slower fails both
tries, as the mutants of `tighten-map-budget` did, and Playwright marks a test that passed only
on its second try as flaky in its report.

Alternative considered:
- **Dropping the second try:** the specs would get stricter, but that is only safe if one
  worker also removed the busy moments after a build, which has not been shown.

## Performance budget

No computation triggered by user interaction changes. The budgets stay as the specs set them:
16 ms per frame for the map's inputs and a slider's steps, 50 ms after a jump of the selection
(specs `result-map` and `limits`; hard constraint 3).

## Dependencies

None added.

## Risks / Trade-offs

- [Each test added makes the suite longer, and #10 adds touch inputs and their tests] → The
  first alternative of decision 1 stays possible if the suite's time becomes a burden. It
  changes the configuration and four tags, not the tests.
- [A busy moment right after a build still stretches a frame] → The second try (decision 2).
- [After a failed test Playwright starts a new worker, and the retry runs there] → `workers` is
  the most worker processes Playwright runs at once, so the retry too runs alone.
- [CI's machine could get more or fewer processors] → `workers: 1` does not depend on them.

## Migration Plan

Nothing to migrate. To undo, remove `workers: 1`.
