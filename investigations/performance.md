# Performance

Begun on 2026-11-16, after `add-characteristics` (#7 of `docs/roadmap.md`) was merged, as Q asked
on 2026-11-15. It looks for the cause of the frames of more than 16 ms that follow a click on
the map, which made #7 relax the budget of clicking to 50 ms per frame (design of
`add-characteristics`, decision 20). It decides nothing: a change that fixes the cause, or that
keeps the relaxed budget, is proposed apart.

Words used here: a **frame's work** is what the browser tests measure (design of
`add-result-map`, decision 10): the time of the app's handlers of an input, plus the time from
an animation frame asked for before the app's own to a task that runs once the frame is drawn.
A **trace** is a Chrome performance trace, which splits the main thread's time into script,
style, layout, paint and garbage collection.

## How to reproduce

The scripts are in `investigations/performance/`. The two in JavaScript run the global
Playwright of the cloud image (1.63.0, the version `app/package.json` pins) against the built
site; the two in Python read the traces with the standard library. The traces are some 10 MB each and stay outside
the repository.

```sh
pnpm run build
(cd app && pnpm exec sirv build --port 4174) &
node investigations/performance/measure_clicks.cjs --runs 20 --dump
node investigations/performance/measure_clicks.cjs --runs 5 --trace /path/outside/the/repository
python3 investigations/performance/windows.py /path/outside/the/repository
python3 investigations/performance/timeline.py /path/outside/the/repository/run-1.json
node investigations/performance/measure_clicks.cjs --runs 20 --end posttask
node investigations/performance/measure_clicks.cjs --runs 20 --pause 50 --dump
node investigations/performance/measure_clicks.cjs --runs 4 --pause 50 --threshold 6 --trace /path/outside/the/repository
node investigations/performance/measure_clicks.cjs --runs 10 --pause 50 --threshold 0 --fresh
# M6 and M7: a build without minification, served anew after each build (sirv reads the files
# once); for the spike, `$state` replaced by `$state.raw` for `sources` and `characteristics` in
# app/src/routes/votes/[id]/ResultMap.svelte, and the file restored with git afterwards.
(cd app && pnpm exec vite build --minify false && pnpm exec sirv build --port 4174) &
node investigations/performance/profile_first_point.cjs --runs 5
```

| File | What |
|------|------|
| `measure_clicks.cjs` | The sequence of the browser test "the budget of clicking", repeated in fresh pages at 1,280 by 720 pixels, with the tests' measurement of a frame; each frame labelled with its input and target. Options: a trace that splits each long frame into the self time of each kind of event, another task to end a frame's measurement, a pause before each click, a new browser for each run. |
| `budget_tests_traced.spec.ts` | The two budget tests of `tighten-map-budget` with a Chrome trace; for each frame over 16 ms its window, its busy time, and the main thread's CPU time against the wall time. Copied into `app/e2e/` to run, and deleted afterwards. |
| `profile_first_point.cjs` | A profile of V8's sampler of the first pointing at a municipality, a later one, the first click and a later one: self time per function and inclusive time of the page's functions. |
| `windows.py` | Each measurement window over 16 ms in the traces: whether a click and the click's frame lie inside it, and how long the window's own frame took. |
| `timeline.py` | The main thread's events and the measurement's marks inside the longest window of one trace. |

The numbers below are what these printed on 2026-11-16, on the cloud machine with 4
processors. A trace adds work of its own: traced frames are a few ms longer or shorter than
untraced ones, and only their composition is used.

## Facts, before this investigation

From the apply phase of #7 (its `tasks.md`, task 3.6, and design decision 20):

1. With one budget test of 16 ms that also clicked, the frames after a click reached 16.7 to
   21.1 ms in 7 of 16 runs, never the frame of the click itself.
2. Without clicks, the frames of zooming, moving and pointing stayed under 6 ms; that test also
   presses "Ganze Schweiz" three times.
3. A window 2,000 pixels tall did not help: scrolling is not the cause.
4. The test of clicking, with 50 ms, had its longest frame at 10.6 to 17.3 ms in three runs.
5. Its sequence, three times: press "Ganze Schweiz" (a `click` on a button), move the pointer to
   the municipality in five steps, click it. The measuring script records the button's clicks as
   `click` frames too.
6. The machine has 4 processors; the browser, the static server and the test runner share them.

## Theories

Each is to be confirmed or ruled out by a measurement below.

- **T1, the reset of the view.** The long frames follow "Ganze Schweiz", which redraws the whole
  map at another scale; they cost more once the panel is filled.
- **T2, style.** Filling the panel invalidates the style of the whole page, the 2,110 paths of
  the map included.
- **T3, layout.** The filled panel is taller than the map: the row of the grid grows, the map's
  box changes, and the map is laid out and painted again.
- **T4, garbage collection.** Parsing `characteristics.json` (1.36 MB) leaves much to collect;
  a collection falls into a later frame, in some runs only.
- **T5, the measurement.** The task that ends a frame's measurement waits behind other inputs'
  tasks (the five steps of a pointer move come quickly), so their work is counted too; or the
  four processors are busy with the browser's other processes, the server and the test runner.
- **T6, the first use.** The panel's first filling builds its elements and shapes new glyphs
  ("²", "–") once; only the first click's frames are long.
- **T7, the details box.** After a click the details box stays; the next input removes or moves
  it, and the page is laid out again.

## Measurements

### M1: which frames are long

- **What:** the test's sequence, 20 runs, each frame labelled (`--dump`).
- **Why:** to see which input each long frame follows (T1, T6, T7).
- **Found:** a frame over 16 ms in all 20 runs; the longest of each run 17.2 to 18.2 ms. Each
  long frame is the pointer's arrival on the municipality about to be clicked
  (`pointerover`/`pointermove` on 261, 351 and 6621: 16.2 to 18.5 ms). The arrivals on the
  municipalities passed on the way take 0.8 to 1.9 ms; the clicks themselves, which fill the
  panel, 3.1 to 4.0 ms; "Ganze Schweiz" 1.1 to 2.2 ms. Run 1, Zürich: arrival 17.5 ms, its
  click 3.6 ms.
- **Means:** filling the panel is cheap; T1, T2, T3 and T6 (for the panel) do not explain the
  long frames. The long frames are those followed, within 2 ms, by a click.

### M2: what the long frames are made of

- **What:** 5 runs with a trace; for each window over 16 ms, the main thread's self time by
  event (`--trace`), the timeline of the longest (`timeline.py`), and all 34 windows over 16 ms
  (`windows.py`).
- **Why:** to tell work from waiting (T4, T5).
- **Found:** in the window of the arrival on Zürich (run 1, 19.6 ms): the arrival's own frame
  is drawn by 2.1 ms (its handlers, style, layout, paint and commit); the click's inputs and
  handler follow at 2.5 to 7.7 ms (the click handler 2.0 ms); Playwright's own script on the
  page, preparing its next step, at 9.7 to 14.2 ms (4.5 ms); the click's frame at 16.2 to
  19.4 ms; only then, at 19.5 ms, the timer that ends the arrival's measurement, though the
  main thread was idle at 8.2 to 9.7 and 14.2 to 16.2 ms. All 34 windows over 16 ms in the five
  traces hold a click and the click's frame. Where a window has a frame of its own, that frame
  is drawn 1.3 to 2.5 ms after its input; the others belong to the `pointermove` the click
  sends first, which changes nothing and whose next frame is the click's. In the 25 frames the
  measurement puts over 16 ms (a window counts from the input, the measurement from its
  handlers and its animation frame, so the two sets differ), no garbage collection over 0.3 ms.
- **Means:** T5 holds. Once a click is under way, Chrome runs the task that ends a measurement
  only after the click's frame; the measurement then counts the click's work, the test
  runner's script, idle time and the click's frame as the arrival's. The arrival's frame
  itself takes about 2 ms. T4 is not seen.

### M3: another task to end the measurement

- **What:** 20 runs each, the measurement ended by a message on a `MessageChannel`, and by
  `scheduler.postTask` with the priority `user-blocking` (`--end`).
- **Why:** if only timers wait, the measurement could end otherwise.
- **Found:** a frame over 16 ms in all 20 runs of each; the longest 16.7 to 28.7 ms with a
  message, 17.0 to 19.7 ms with `postTask`.
- **Means:** every task waits for the click's frame, whatever its kind or priority. The
  measurement cannot be repaired by the task that ends it.

### M4: a pause before each click

- **What:** 20 runs with 50 ms between the pointer's arrival and the click (`--pause 50`),
  the measurement as in the tests.
- **Why:** no person clicks 2 ms after the pointer arrives; the test of zooming already waits
  50 ms between the steps of the wheel.
- **Found:** a frame over 16 ms in 1 run of 20; the arrivals 0.7 to 1.6 ms, the clicks 2.0 to
  3.3 ms, "Ganze Schweiz" 1.3 to 2.1 ms. The longest frame of every run, 6.7 to 18.7 ms, is
  the first municipality the pointer touches after the page has loaded (4506, on the way from
  the button to Zürich); the one frame over 16 ms is that one.
- **Means:** with a person's pace, clicking meets 16 ms. One cost remains, the first pointing.

### M5: the first pointing at a municipality

- **What:** 4 runs with a trace, the pause of M4, every frame over 6 ms split.
- **Why:** to tell whether the first pointing is work or the measurement.
- **Found:** 7.1 to 12.0 ms traced, the main thread busy the whole time: script 5.4 to 7.0 ms,
  in one run a minor garbage collection of 2.1 ms, the rest drawing. The budget test of
  zooming, moving and pointing does not see it: it moves the pointer onto the map before it
  begins to measure.
- **Means:** a real cost, once per visit, at most 18.7 ms in these 20 runs; the trace does not
  say which script. T6 holds for the details box, not for the panel.

### M6: which script the first pointing runs

- **What:** a profile of V8's sampler, every 50 µs, on a build without minification
  (`profile_first_point.cjs`, 5 runs): the pointer moving onto Zürich after the page has
  loaded, then onto Bern, then a click on Bern and one on Zürich. Self time per function, and
  inclusive time for the page's own functions.
- **Why:** M5 says script, not which.
- **Found:** the first pointing runs 13.1 ms of script per run, a later one 5.4 ms. Of the
  first, 7.0 ms are in the derived value `names` of `ResultMap.svelte` (line 430 of the built
  chunk), read for the first time by the details of the first municipality pointed at: it
  builds a map of the 2,110 municipalities' names from `sources`. Most of that time is
  Svelte's deep proxy (`get`, `has`, `proxy`): `sources` is a `$state`, so each of the 2,110
  rows of names is wrapped in a proxy when first read. The first click runs 5.1 ms, a later
  one 2.5 ms. (A first version of the script took the points of both municipalities before
  pointing, and the second scrolled the page by 400 pixels; it pointed at a stale point. The
  numbers here are from the corrected script, which finds each point just before it uses it.)
- **Means:** the first pointing pays for wrapping the map's names in proxies, once per visit.
  The two files the map loads, `sources` and `characteristics`, are only ever replaced whole,
  never changed inside, so they need no deep proxy.

### M7: a spike, the two files as `$state.raw`

- **What:** `sources` and `characteristics` in `ResultMap.svelte` declared with `$state.raw`
  instead of `$state`, built, measured, and the file restored from git (nothing committed):
  the profile of M6 (5 runs, without minification), and the frames of M4 (20 runs, the normal
  build, 50 ms before each click), both against the unchanged code measured the same way.
- **Why:** to measure the fix M6 suggests before proposing it.
- **Found:**

  | Script per run (M6's profile) | `$state` | `$state.raw` |
  |---|---|---|
  | first pointing | 13.1 ms | 6.5 ms |
  | a later pointing | 5.4 ms | 2.3 ms |
  | first click | 5.1 ms | 3.3 ms |
  | a later click | 2.5 ms | 2.4 ms |

  `names` takes 2.2 ms instead of 7.0 ms. With the normal build, the frame of the first
  pointing was 7.1 to 19.9 ms with `$state`, over 16 ms in 3 runs of 20 (in M4, 1 of 20);
  with `$state.raw` it was under 6 ms in 18 runs, 6.6 ms in one, and 16.8 ms in the first run
  of the browser. The longest frame of a run, of any input, was 7.1 to 19.9 ms with `$state`,
  3.6 to 6.6 ms with `$state.raw` but for 16.8 and 10.7 ms.
- **Means:** `$state.raw` for the two files halves the script of pointing and of the first
  click, and brings the first pointing under 16 ms but for the first run of a browser, which
  is still to be explained.

### M8: first visits

- **What:** 10 runs, each in a new browser, as a first visit (`--fresh`), 50 ms before each
  click; with `$state` and with the spike of M7.
- **Why:** M7's one long first pointing with `$state.raw` was the first run of its browser:
  a cold start would hit every first visit.
- **Found:** the first pointing 7.6 to 17.2 ms with `$state`, over 16 ms in 2 runs of 10;
  3.7 to 6.1 ms with `$state.raw`. The first click, which fills the panel, 3.1 to 9.6 ms with
  `$state`, 3.0 to 5.0 ms with `$state.raw`. The longest frame of a run 7.6 to 17.2 ms with
  `$state`, 3.7 to 8.7 ms with `$state.raw`.
- **Means:** a first visit is not slower with `$state.raw`. M7's 16.8 ms did not recur; that
  run began right after a build and the server's start, and stays unexplained.

### M9: the budget tests themselves, with raw state

Measured while applying `tighten-map-budget`, with its two budget tests (the first pointing
measured, 50 ms before each click, 16 ms) and the two files as `$state.raw`, run by Playwright
with its two workers.

- **What:** each test 10 runs (`--repeat-each 10`), then both together in batches of 20: with
  one worker and with two (4 batches, no build just before), and right after `pnpm run build`
  (3 batches); and the measuring script of M4 in two processes at once, traced (20 runs).
- **Why:** each test failed once in its first 10 runs; to find the condition.
- **Found:**
  - Failures: right after a build 3 of 60 runs, in its first 10 runs 2 of 20 (the first right
    after a build); without a build just before, 0 of 80, with one worker or two; the two
    measuring processes at once, 0 of 20.
  - The frames over 16 ms: a step of the wheel, 21.0 ms; the pointing after "Ganze Schweiz",
    23.7 ms; four frames in a row of 20 to 30 ms; and two frames followed at once by an input
    Playwright sends without a pause, the arrival on "Ganze Schweiz" before its click (19.5 ms)
    and the move before the drag's press (17.3 ms).
  - Otherwise the longest frame of a run: a median of 8.5 ms in the test of zooming and 5.6 ms
    in the test of clicking; 12 frames of about 4,000 over 10 ms.
- **Means:** the frames over 16 ms are rare and come when the machine has just been busy;
  two browsers alone do not bring them.

### M10: a trace of the budget tests right after a build

- **What:** the two budget tests with a Chrome trace and marks around each frame
  (`budget_tests_traced.spec.ts`), 4 batches of 20 runs, each right after `pnpm run build`.
- **Why:** to tell for a long frame whether the page worked or waited for a processor (T-a of
  the theories below M9: contention; or drawing, or garbage collection).
- **Found:** 1 frame over 16 ms in 80 runs, the first pointing, 29.1 ms (the next frame, 22.3
  ms, shares its window). In its window of 30.8 ms the main thread had a processor for
  15.1 ms; `Commit`, where the main thread waits for the compositor's thread, took 8.7 ms
  (0.1 to 0.4 ms otherwise).
- **Means:** the main thread waited for a processor half of that frame: the machine was busy,
  not the page. A measurement of wall time on a shared machine meets such frames now and then.

## Findings

1. **The frames of 17 to 21 ms after a click are an artifact of the measurement**, not slow
   frames (M1 to M3). The browser test clicks within 2 ms of the pointer's arrival; the
   arrival's measurement then lasts until the click's frame is drawn, and counts everything up
   to it. No task posted from the page ends sooner. The arrival's own frame takes about 2 ms,
   the click with the panel 2 to 4 ms.
2. **Clicking meets the budget of 16 ms** when the click follows the arrival by 50 ms (M4).
   The relaxed budget of 50 ms of decision 20 was needed for the test as written, not for the
   app.
3. **The first pointing at a municipality after the page loads costs 7 to 20 ms**, over 16 ms
   in 1 to 3 runs of 20 (M4, M7, M8), and no test measures it. Most of it is the map's names,
   built on first use through Svelte's deep proxy of the loaded file (M6).
4. **Declaring the two loaded files `$state.raw`** brings the first pointing to 3.7 to 6.1 ms
   and the first click to 3.0 to 5.0 ms on a first visit (M8), and halves the script of every
   pointing (M7). Both files are only ever replaced whole.
5. Not seen: a cost of the panel's style or layout (T2, T3), of "Ganze Schweiz" (T1), of the
   details box after the first (T7), or of garbage collection beyond the allocations of the
   proxies (T4).
6. **With raw state, the budget tests fail now and then for the machine, not the page** (M9,
   M10): about 3 runs in 100, mostly right after a build, the condition of CI and of
   `scripts/verify-local.sh`. In the one traced, the main thread had a processor for half the
   frame.

## Open

- M7's one first pointing of 16.8 ms with `$state.raw`; the other 29 runs with it stayed at
  6.6 ms or less.
- How a test should measure a frame closely followed by another input. M3 shows that no task
  posted from the page ends at the frame's end then; leaving 50 ms between inputs, as the test
  of zooming does, avoids the case.
