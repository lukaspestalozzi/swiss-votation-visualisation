# Tasks

The browser tests run against the built site: run `pnpm run build` before every
`pnpm run test:e2e` below. "10 runs" of a test means
`pnpm --filter app exec playwright test e2e/result-map.spec.ts -g "<title>" --repeat-each 10 --trace off`,
whose log prints each run's frames.

## 1. The budget of 16 ms for every input of the map

- [ ] 1.1 The test of clicking at a person's pace (spec `result-map`, scenario "Clicking
  municipalities"; design, decisions 3 and 4). In `app/e2e/result-map.spec.ts`, the test
  "the budget of clicking" waits 50 ms after the pointer arrives on each municipality before
  it clicks, allows 16 ms per frame, and its title and comment say so (the comment cites this
  change's design instead of decision 20 of `add-characteristics`). Verify, against the code as
  it is (deep state): 10 runs; write down how many pass and the longest frame of each, expected
  to be the first pointing (`investigations/performance.md`, M4: over 16 ms in about 1 run of
  20).
- [ ] 1.2 The first pointing measured (scenario "Zooming, moving and pointing"; decision 4).
  The test "the budget: no frame after zooming, moving or pointing takes more than 16 ms"
  clears its frames before the pointer first moves onto the map, so that moving it to the
  map's centre, the first pointing at a municipality, is measured. Verify, against the code as
  it is: 10 runs; write down how many pass and the frame of the first pointing in each.
- [ ] 1.3 The map's loaded files as raw state (decision 2). In
  `app/src/routes/votes/[id]/ResultMap.svelte`, `sources` and `characteristics` are declared
  with `$state.raw`, with a comment that a new value replaces the old one whole. Verify:
  - `pnpm run check` and `pnpm run lint` pass;
  - the two budget tests, 10 runs each, all pass; the first pointing's frame is printed under
    16 ms in every run;
  - `pnpm run test:e2e`: all 55 browser tests pass, those of the map's details and of the
    panel among them, unchanged.
- [ ] 1.4 Each budget test against its mutant (design, "Tests"), each mutant undone after its
  run:
  - the first pointing made 20 ms slower (a busy wait of 20 ms the first time the details of a
    municipality are worked out): the test of zooming, moving and pointing fails, and names a
    frame over 16 ms;
  - filling the panel made 20 ms slower (a busy wait of 20 ms when a municipality is clicked):
    the test of clicking fails, and names a frame over 16 ms.

  Verify: both fail as described, and `git diff app/src` shows only the change of 1.3
  afterwards.

## 2. Documentation and the whole

- [ ] 2.1 `investigations/performance.md` gains a section "What became of it": this change, the
  decisions it took from the findings (raw state; 50 ms before a click; the first pointing
  measured), and what the tests of 1.1 to 1.3 showed. Verify: the section names
  `tighten-map-budget` and the numbers of 1.1 to 1.3.
- [ ] 2.2 `docs/roadmap.md`: a row "7a", `tighten-map-budget`, between #7 and #8, with the
  capability `result-map`, what the change does, and "proposed" until it is archived; the
  investigations' list names `investigations/performance.md`. Verify: the row stands between
  #7 and #8, and #8 to #13 keep their numbers.
- [ ] 2.3 Update `CLAUDE.md` for every file this branch adds or changes:
  - the status (#7a, and what comes next);
  - "Where things are": the investigations' row names `performance.md` and its scripts in
    `performance/`, and the row of `eslint.config.js` says that ESLint leaves
    `investigations/` to Prettier;
  - the code map: `ResultMap.svelte` (the loaded files as raw state) and
    `app/e2e/result-map.spec.ts` (one budget of 16 ms per frame, the first pointing included,
    50 ms before each click).

  Verify: `grep -n "performance\|16 ms" CLAUDE.md` shows each of these, and no line still says
  50 ms for clicking.
- [ ] 2.4 Run `./scripts/verify-local.sh`. Verify: 11 of 11 steps pass, with 41 tests of the
  calculation, 80 of the app, 55 browser tests and 134 of the pipeline.

## Workflow follow-up

- `/openspec-verify-change`, then `/openspec-archive-change`, which merges the modified
  requirement into `openspec/specs/result-map/spec.md` and marks 7a done in `docs/roadmap.md`.
- After the merge, nothing a visitor sees changes; CI's browser tests on `main` print the frames
  of both budget tests.
