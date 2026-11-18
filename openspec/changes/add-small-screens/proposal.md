# Proposal

## Why

`openspec/config.yaml` asks for an app that is usable on a phone, and v1 ends with it. Change
#10 of `docs/roadmap.md`, `add-small-screens`, is implemented here. It settles what the roadmap
leaves open for it:
- the layout;
- how a municipality's details are read without a pointer;
- the smallest screen supported;
- whether a library for zoom and move serves better than #6's own code.

`investigations/small-screens.md` shows what a phone gets today:
- **Pages too wide.** 139 of the 381 pages are wider than a window 360 pixels wide: every
  Italian vote page, by its two verdict boxes, and 15 German ones, by a long word of the title.
- **Out of view while dragging.** A visitor who drags a limit on a phone sees neither the
  selection's verdicts nor the map: they lie about 240 pixels above and below the slider.
- **The browser takes the gestures.** It takes a finger moved on the map as a scroll of the page
  and a pinch as a zoom of the page, and cancels them for the map.
- **Small controls.** The controls are 13 to 24 pixels tall.

A tap already shows a municipality's details and its characteristics.

## What Changes

- **Every page fits a window 360 pixels wide**, in the three languages, without scrolling
  sideways:
  - the two verdict boxes stay side by side;
  - a word too long for its line is broken.
- **The selection's result stays in view on a phone.** In a window narrower than 640 pixels,
  while a selection applies and its box "Mit Ihrer Auswahl" is not wholly on the screen, a bar at
  the bottom of the window shows the selection's outcome and both majorities. It follows every
  step of a slider, as the box does.
- **Fingers on the map:**
  - one finger moves the map;
  - two fingers zoom it around the point between them, within the same limits as the buttons;
  - neither scrolls nor zooms the page;
  - outside the map, the page scrolls as usual.
  - This is the map's own code, extended, with no library.
- **A tap shows a municipality** as a click does: its details and its characteristics. The
  municipality last clicked or tapped is outlined on the map, black on a white halo, so that a
  visitor sees which one the finger hit.
- **Controls for a finger.** On a touch screen, each of these is at least 44 × 44 pixels:
  - the map's buttons;
  - the limits' list and buttons;
  - the switch for the Swiss abroad;
  - each slider's thumb.
- **The zoom buttons stand above the map** in a window narrower than 640 pixels, so that they
  hide none of it.
- **Budgets for fingers.** Moving with a finger, pinching and tapping keep the map's budget of
  16 ms per frame, measured as now on the test machine.
- **The investigation:** `investigations/small-screens.md`, with its scripts.

## Non-goals

- **No support below 360 pixels.** A narrower window may scroll sideways or zoom out.
- **No library** for zoom and move: d3-zoom adds 17.6 KB gzipped and nine packages
  (investigation, 7).
- **No budget on a slow phone.** Slowed four times, a drag of a limit takes 28 to 41 ms per
  frame (investigation, 6). The budgets stay measured on the test machine, and making the
  recalculation faster is not this change's.
- **No search of a municipality by name, and no other way to read one without pointing or
  tapping.** The keyboard and screen readers still read the cantons' table only, as decision 20
  of `add-result-map` describes.
- **No double tap to zoom**, and no momentum after a finger is lifted.
- **Links keep their size.** The language links, "Alle Abstimmungen" and the vote list's titles
  stay text links.
- **No previews of pull requests.** The change is checked on a real phone after the merge, on the
  published site; what is wrong there becomes a small change of its own.
- **No change to the data, the pipeline or the calculation.**

## Capabilities

### New Capabilities

- `small-screens`: what the site does on a narrow window and a touch screen:
  - every page fits a window 360 pixels wide;
  - controls large enough for a finger on a touch screen;
  - the zoom buttons above the map in a narrow window;
  - the bar with the selection's result at the bottom of a narrow window.

### Modified Capabilities

- `result-map`:
  - tapping a municipality shows its details and fills the panel;
  - two fingers zoom the map;
  - one finger moves it, and fingers on the map do not scroll or zoom the page;
  - the municipality last clicked or tapped is outlined;
  - the performance budget covers fingers.

## Impact

- **App:**
  - `ResultMap.svelte`: fingers, the outline, the place of the zoom buttons and their size;
  - `src/lib/map-view.ts`: the view after a pinch, with unit tests;
  - `Limits.svelte`: sizes on a touch screen;
  - the vote's page: the verdict boxes and the title in a narrow window, and the bar;
  - a new component for the bar;
  - the texts of the bar in `src/lib/texts/`, in three languages.
- **Browser tests:**
  - a phone's emulation (Playwright's "Pixel 7");
  - fingers sent with Chrome's DevTools protocol;
  - a new file for `small-screens`;
  - tests added to the map's file;
  - a budget test for fingers.
- **No new dependency.**
- **Docs:**
  - `CLAUDE.md`'s code map and "Where things are";
  - `docs/roadmap.md`, and the stack's note on a library in `openspec/config.yaml`;
  - `investigations/small-screens.md` and `investigations/small-screens/`.
