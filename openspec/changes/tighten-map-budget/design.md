# Design

## Context

See `proposal.md` for why. The current state:

- **The budget** (spec `result-map`, "The map's performance budget"): 16 ms per frame for
  zooming, moving and pointing; 50 ms for clicking and the inputs that follow it, relaxed by
  `add-characteristics` (its design, decision 20) "until a later change revisits this budget".
- **The measurement** (design of `add-result-map`, decision 10): a script added before the page
  loads measures, for each input, the app's handlers plus the time from an animation frame
  asked for before the app's own to a task that runs once the frame is drawn.
- **Two budget tests** in `app/e2e/result-map.spec.ts`:
  - "the budget: no frame after zooming, moving or pointing takes more than 16 ms" moves the
    pointer to the centre of the map, then clears the frames, then zooms, drags and points. Its
    first pointing at a municipality falls before the measurement.
  - "the budget of clicking" clears the frames once the panel invites a click, then three
    times: "Ganze Schweiz", the pointer to the municipality in five steps, a click at once.
- **The map's loaded files** in `ResultMap.svelte`: `sources` (`map.json` and
  `municipalities.json`) and `characteristics` (`characteristics.json`) are `$state`. Each is
  assigned once, when its file has loaded, and nothing changes them inside. Svelte 5 wraps a
  `$state` object in a proxy, and each nested object or array in a proxy of its own when it is
  first read.
- **The investigation** (`investigations/performance.md`) gives the numbers this design cites:
  M1 to M8.

## Goals / Non-Goals

**Goals:**
- The budget of 16 ms holds for every input the map takes, measured in a way that counts a
  frame's own work.
- The first pointing after the page has loaded meets it with a margin, on a first visit too.

**Non-Goals:**
- Changing the measurement of decision 10 of `add-result-map`; see decision 3.
- Making anything else of the page cheaper: what the investigation measured is within budget
  once the two files are raw state.

## Decisions

Q decided decisions 1, 4 and 5 on 2026-11-16, after the investigation, and the choices that
decisions 2 and 3 follow from. Each is open to Q's review of this change.

### 1. Both fixes in one change: the app and the tests (Q)

The change makes the first pointing cheaper, measures it, and restores 16 ms for clicking with
a test at a person's pace.

Alternatives considered:
- **The tests only:** the pause and 16 ms for clicking. The first pointing, up to 20 ms and
  over 16 ms in 1 to 3 runs of 20 (M4, M7, M8), would stay unmeasured and named as a known
  cost.
- **The app only:** raw state, with the budget of clicking left at 50 ms, for a reason the
  investigation removed.

### 2. The two loaded files as `$state.raw`

`sources` and `characteristics` are declared with `$state.raw`. A raw state is reactive when it
is assigned, which is all the map needs: each is assigned once, when its file has loaded, and
the page then draws the map or fills the panel. Nothing reads them deeply as reactive state, and
nothing changes them inside. A comment at the declarations says that a new value must replace
the old one whole.

Measured with a spike (M7, M8): the first pointing 3.7 to 6.1 ms on first visits instead of 7.6
to 17.2 ms; the first click 3.0 to 5.0 ms instead of 3.1 to 9.6 ms; the script of a later
pointing halved. The map's names, built on first use, take 2.2 ms instead of 7.0 ms (M6, M7).

Alternatives considered:
- **Building the map's names when the file loads** instead of on the first pointing. It moves
  7 ms of proxies to the loading, where they delay the first drawing of the map, and leaves
  every later pointing and click reading through proxies.
- **Plain variables, not state.** The page must draw again when a file arrives, so they must be
  state.
- **Taking a snapshot** of each file (`$state.snapshot`) where it is read: a copy of 1.4 MB of
  counts at each read.

### 3. The measurement stays; the tests leave 50 ms before a click

The measurement of decision 10 of `add-result-map` stays. The investigation found why it
misled: Chrome runs no task posted from the page between a frame and the click that follows
within it, until the click's frame is drawn, whatever the task's kind or priority (M2, M3). A
frame's measurement then counts the click's work, the test runner's script on the page, idle
time and the click's frame. The test of clicking waits 50 ms after the pointer arrives on the
municipality, as a person leaves between moving and clicking, and as the test of zooming already
waits 50 ms between the steps of the wheel. The spec states the pace with the budget.

Alternatives considered:
- **The Event Timing API** (`PerformanceEventTiming`): standard, but its durations are rounded
  to 8 ms and include the delay before the handlers run.
- **A trace of the browser in every budget test**, as the investigation used: exact, but slower,
  bound to Chromium's trace format, and adding the trace's own work to the frames.
- **Another task to end a frame's measurement:** a message or `scheduler.postTask` with the
  priority `user-blocking`. M3 measured both: neither ends sooner.
- **Clicking at once, with a budget larger than 16 ms:** keeps the artifact in the measure.

### 4. Two budget tests, both of 16 ms (Q)

The two tests stay, and the diff stays small:
- The test of zooming, moving and pointing clears its frames before the pointer first moves onto
  the map. Its first input, moving the pointer to the map's centre, is then the first pointing
  at a municipality, and is measured.
- The test of clicking waits 50 ms before each click and allows 16 ms.

A failure names which inputs were slow.

Alternatives considered:
- **One test**, as `add-characteristics` planned before decision 20: zoom, drag, point and
  click, with 50 ms between inputs. One test less, but a longer sequence, and a failure names
  less precisely what was slow.

### 5. The name, and "7a" in the roadmap (Q)

The change is `tighten-map-budget`, a row "7a" in `docs/roadmap.md` between #7 and #8. The
numbers of #8 to #13 stay: they are cited in 12 places, code comments among them.

Alternatives considered:
- **`restore-click-budget`:** it names the undoing of decision 20 but not the first pointing.
- **Renumbering**, the change as #8: the 12 citations of #8 to #13 change with it.

### 6. Decision 20 of `add-characteristics` is superseded

Its relaxed budget goes. The archive keeps the decision as it was taken; this design and the
investigation say why it no longer holds.

### Tests

- **Browser (Playwright):** the two budget tests as decision 4 says, each seen to fail against a
  mutant before it is trusted:
  - the test of zooming, moving and pointing against a mutant that makes the first pointing
    20 ms slower;
  - the test of clicking against a mutant that makes filling the panel 20 ms slower.
- The two tests run before the fix of decision 2 too, to see what they make of the deep state
  (M4 and M7: the first pointing over 16 ms in 1 to 3 runs of 20); and after it, repeated, to
  see them hold.
- **Unit tests:** none change. Raw state changes no value the page shows; the existing browser
  tests of the map and the panel check that.

### Dependencies added

None.

### Performance budget

16 ms of main-thread work per frame for every input the map takes: a zoom step, a move,
pointing (the first after the page has loaded included) and clicking, which fills the panel
(spec `result-map`). Measured by the browser tests, with 50 ms between a pointer's arrival and a
click.

## Risks / Trade-offs

- **[A future change mutates a loaded file inside]** and the page does not follow, since raw
  state reacts to assignment only → The comment at the declarations; the files are written by
  the pipeline and never changed by the app.
- **[The machine that runs CI is slower or busier than the cloud machine of the investigation]**
  → The tests print every frame. With raw state the frames measured were at most 8.7 ms on first
  visits (M8). `investigations/performance/` holds the scripts that show where a long frame's
  time goes.
- **[A test with a pause measures less than a hurried user]** → A click within 2 ms of the
  pointer's arrival is not a person's pace, and its measurement is not the frame's (M2).
- **[The one first pointing of 16.8 ms with raw state in M7]**, the first run of its browser,
  right after a build and the server's start, not seen in 29 more runs → The repeated runs of
  the tests in the tasks would show it again.

## Migration Plan

1. Merge by rebasing. CI publishes the site; nothing a visitor sees changes.
2. Rollback: revert the commit on `main`. The deep state and the relaxed budget come back.

## Open Questions

None.
