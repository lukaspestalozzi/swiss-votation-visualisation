# Tasks

The browser tests run against the built site: run `pnpm run build` before every
`pnpm run test:e2e` below. "10 runs" of a test means
`pnpm --filter app exec playwright test e2e/result-map.spec.ts -g "<title>" --repeat-each 10 --trace off`,
whose log prints each run's frames.

## 1. The budget of 16 ms for every input of the map

- [x] 1.1 The test of clicking at a person's pace (spec `result-map`, scenario "Clicking
  municipalities"; design, decisions 3 and 4). In `app/e2e/result-map.spec.ts`, the test
  "the budget of clicking" waits 50 ms after the pointer arrives on each municipality before
  it clicks, allows 16 ms per frame, and its title and comment say so (the comment cites this
  change's design instead of decision 20 of `add-characteristics`). Verify, against the code as
  it is (deep state): 10 runs; write down how many pass and the longest frame of each, expected
  to be the first pointing (`investigations/performance.md`, M4: over 16 ms in about 1 run of
  20).

  (As built: 9 of 10 runs passed. The longest frame of every run was the first pointing, the
  7th frame: 12.6, 14.7, 10.9, 7.9, 11.7, 12.9, 14.9, 16.3, 10.5 and 7.3 ms; the one failure
  was its 16.3 ms. The clicks, on "Ganze Schweiz" and on the municipalities, took 1.0 to
  8.8 ms.)
- [x] 1.2 The first pointing measured (scenario "Zooming, moving and pointing"; decision 4).
  The test "the budget: no frame after zooming, moving or pointing takes more than 16 ms"
  clears its frames before the pointer first moves onto the map, so that moving it to the
  map's centre, the first pointing at a municipality, is measured. Verify, against the code as
  it is: 10 runs; write down how many pass and the frame of the first pointing in each.

  (As built: the centre of the map lies on Sachseln (OW, 1406), whose details the move shows.
  The test also checks that its first measured frame is that `pointerover`. 4 of 10 runs
  passed. The first pointing took 16.1, 17.6, 17.3, 8.4, 6.4, 12.0, 21.8, 16.5, 13.4 and
  7.6 ms, and was the longest frame in 9 runs; 5 runs failed on it. The 6th failure was another
  frame: in the 10th run, the first pointing after the third "Ganze Schweiz" took 37.4 ms, once
  in 10 runs. Its cause is not known: a garbage collection of the deep state, the first hit
  test after the view changed, or two browsers sharing the machine, as Playwright runs two
  workers. 1.3's runs show whether it recurs.)
- [x] 1.3 The map's loaded files as raw state (decision 2). In
  `app/src/routes/votes/[id]/ResultMap.svelte`, `sources` and `characteristics` are declared
  with `$state.raw`, with a comment that a new value replaces the old one whole. Verify:
  - `pnpm run check` and `pnpm run lint` pass;
  - the two budget tests, 10 runs each: the first pointing's frame is printed under 16 ms in
    every run.

  (As built: `check` and `lint` passed. The first pointing took 3.5 to 9.8 ms in all 20 runs.
  But each test failed once in its 10 runs, which the plan had as a condition of this task:
  a step of the wheel of 21.0 ms, and a pointing after "Ganze Schweiz" of 23.7 ms.
  `investigations/performance.md`, M9 and M10, traced it: about 3 runs in 100 fail, mostly
  right after a build, and in the long frame traced the main thread had a processor for half
  the time. Q chose one more run on failure (design, decision 7), which 1.4 adds; the test of
  all 55 moves there.)
- [x] 1.4 One more run when a budget test fails (design, decision 7; spec `result-map`, "The
  map's performance budget"). In `app/e2e/result-map.spec.ts`, each of the two budget tests is
  wrapped where it stands in a group with `test.describe.configure({ retries: 1 })`, with a
  comment that cites decision 7; no other test is retried. Verify:
  - three times, `pnpm run build` and right after it both budget tests 10 runs each
    (`-g "the budget" --repeat-each 10`): every run passes, at most on its second run; write
    down how many passed only on their second run (Playwright's "flaky") and why;
  - `pnpm run test:e2e`: all 55 browser tests pass.

  (As built: all 60 runs passed; 3 only on their second run, one after each build, all three
  the test of zooming, moving and pointing, in 3 of its 30 runs. Their first runs had a step
  of the wheel over 16 ms (16.1, 17.5 and 21.2 ms; normally 5 to 9 ms, the heaviest frames of
  the test), and once also three frames of about 21 ms around a click on "Ganze Schweiz",
  which takes 1 to 2 ms otherwise: the busy machine of M10. The test of clicking passed all 30
  runs at once. `pnpm run test:e2e`: 55 passed, none on a second run.)
- [x] 1.5 Each budget test against its mutant (design, "Tests"), each mutant undone after its
  run:
  - the first pointing made 20 ms slower (a busy wait of 20 ms the first time the details of a
    municipality are worked out): the test of zooming, moving and pointing fails in both of its
    runs, and names a frame over 16 ms;
  - filling the panel made 20 ms slower (a busy wait of 20 ms when a municipality is clicked):
    the test of clicking fails in both of its runs, and names a frame over 16 ms.

  Verify: both fail as described (Playwright reports them failed, not flaky), and
  `git diff app/src` shows only the change of 1.3 afterwards.

  (As built: the first mutant failed the test of zooming, moving and pointing in both runs,
  the first pointing at 24.9 and 23.8 ms; the second failed the test of clicking in both runs,
  the clicks on municipalities at 22.1 to 25.8 ms, those on "Ganze Schweiz" at 1.3 to 2.0 ms.
  Playwright reported each "1 failed". The file was restored from a copy, as it held 1.3's
  change, and `git diff app/src` shows only that change; the site was built again.)

## 2. Documentation and the whole

- [x] 2.1 `investigations/performance.md` gains a section "What became of it": this change, the
  decisions it took from the findings (raw state; 50 ms before a click; the first pointing
  measured; one more run on failure, from M9 and M10), and what the tests of 1.1 to 1.4
  showed. Verify: the section names `tighten-map-budget` and the numbers of 1.1 to 1.4.
- [x] 2.2 `docs/roadmap.md`: a row "7a", `tighten-map-budget`, between #7 and #8, with the
  capability `result-map`, what the change does, and "proposed" until it is archived; the
  investigations' list names `investigations/performance.md`. Verify: the row stands between
  #7 and #8, and #8 to #13 keep their numbers.
- [x] 2.3 Update `CLAUDE.md` for every file this branch adds or changes:
  - the status (#7a, and what comes next);
  - "Where things are": the investigations' row names `performance.md` and its scripts in
    `performance/`, and the row of `eslint.config.js` says that ESLint leaves
    `investigations/` to Prettier;
  - the code map: `ResultMap.svelte` (the loaded files as raw state) and
    `app/e2e/result-map.spec.ts` (one budget of 16 ms per frame, the first pointing included,
    50 ms before each click, a second run when a budget test fails).

  Verify: `grep -n "performance\|16 ms" CLAUDE.md` shows each of these, and no line still says
  50 ms for clicking.
- [x] 2.4 Run `./scripts/verify-local.sh`. Verify: 11 of 11 steps pass, with 41 tests of the
  calculation, 80 of the app, 55 browser tests and 134 of the pipeline.

  (As built: 11 of 11 steps passed: 41, 80, 55 browser tests, none on a second run, and 134.)

## Workflow follow-up

- `/openspec-verify-change`, then `/openspec-archive-change`, which merges the modified
  requirement into `openspec/specs/result-map/spec.md` and marks 7a done in `docs/roadmap.md`.
- After the merge, nothing a visitor sees changes; CI's browser tests on `main` print the frames
  of both budget tests.
