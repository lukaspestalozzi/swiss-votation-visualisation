# Proposal

## Why

Change #7, `add-characteristics`, relaxed the budget of clicking a municipality to 50 ms per
frame. Its browser test saw frames of 17 to 21 ms after a click, of unknown cause (its design,
decision 20), and the roadmap scheduled a look at performance after it. That look,
`investigations/performance.md`, found two things:
- **The long frames were an artifact of the measurement.** The test clicks 2 ms after the
  pointer arrives. The measurement of the arrival's frame then lasts until the click's frame is
  drawn, and counts the click's work, the test runner's script and idle time as the arrival's.
  At a person's pace, 50 ms between the arrival and the click, clicking meets 16 ms.
- **One cost is real and unmeasured: the first pointing.** The first municipality pointed at
  after the page has loaded costs 7 to 20 ms, over 16 ms in 1 to 3 runs of 20. The map's names
  are built on first use through Svelte's deep proxy of the loaded file. A spike with the two
  loaded files as raw state brought it to 3.7 to 6.1 ms on first visits.

So the relaxed budget no longer has a reason, and the one cost above 16 ms can be removed.
This change is "7a" of `docs/roadmap.md`, the look at performance between #7 and #8.

## What Changes

- **One budget again: 16 ms per frame** for zooming, moving, pointing and clicking a
  municipality, which fills the panel. The relaxed 50 ms of #7 goes.
- **The first pointing is measured.** The budget test of zooming, moving and pointing begins to
  measure before the pointer first enters the map, so the first pointing after the page has
  loaded is within the 16 ms too.
- **The test of clicking clicks at a person's pace:** 50 ms after the pointer arrives on the
  municipality, as the test of zooming already waits 50 ms between the steps of the wheel. The
  design records why: a frame's measurement absorbs a click that follows within the same frame.
- **A second run when a budget test fails** (Playwright's `retries: 1`, for the two budget
  tests only). A busy machine can stretch a frame of a page that meets the budget; a slow page
  fails both runs. Decided while applying (design, decision 7).
- **The map's loaded files are not made deeply reactive.** The shapes and names, and the
  characteristics, are only ever replaced whole. Holding them as raw state removes the proxies
  that made the first pointing slow, and halves the script of every pointing.
- **Roadmap:** a row "7a", `tighten-map-budget`, between #7 and #8. The numbers of #8 to #13
  stay as they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `result-map`: "The map's performance budget": one budget of 16 ms per frame for zooming,
  moving, pointing and clicking, the first pointing after the page has loaded included, the
  pace of the inputs the browser tests measure, and a second measurement when a frame exceeds
  the budget.

## Non-goals

- **The budget of recalculating while a limit is dragged** (hard constraint 3): #8 sets it.
- **A new way of measuring a frame.** The investigation found no task the page can post that
  ends at the end of a frame closely followed by a click (M3); the tests keep the measurement of
  `add-result-map`'s design, decision 10, and leave 50 ms between inputs.
- **Loading:** the size of the data files and the time until the map shows. Neither is
  budgeted, and the investigation did not measure them.
- **Phones and slower machines:** #10. The budget is measured on the machine that runs the
  tests.
- **A library for zooming and moving:** #10 checks it, as `openspec/config.yaml` says.

## Impact

- **App** (`app/`): `ResultMap.svelte` holds the map's two loaded files as raw state. No other
  module changes, and no dependency is added.
- **Browser tests** (`app/e2e/result-map.spec.ts`): the budget test of zooming, moving and
  pointing measures from before the first pointing; the test of clicking waits 50 ms before
  each click and allows 16 ms; both run once more when they fail.
- **Specs:** `result-map`, one modified requirement.
- **Docs:** `docs/roadmap.md` (the row "7a"), `CLAUDE.md` (status and code map),
  `investigations/performance.md` (what the change did with its findings).
- **Data files and pipeline:** unchanged.
