# Design

## Context

What the change builds on:
- **The vote's page** (`app/src/routes/[lang]/votes/[id]/+page.svelte`) is one column:
  - the head, the result, and "Mit Ihrer Auswahl", beside the result from 640 pixels and below
    it otherwise;
  - the limits, the map, the table of the cantons, the sources and notes.
  - The two verdict boxes are a grid of two equal columns, headed with second-level headings.
- **The map** (`ResultMap.svelte`) zooms and moves with its own code:
  - Pointer Events on the SVG: `down`, `drag` and `up` track one press, which becomes a drag
    after 4 pixels (design of `add-result-map`, decision 17);
  - `map-view.ts` gives the view box after a zoom around a point (`zoomAround`) and after a move
    by pixels (`moveBy`), both kept inside the rectangle around Switzerland and between 1 and 16
    times, with unit tests;
  - the buttons "+", "−" and "Ganze Schweiz" lie over the map's top right corner, the box of
    details over its top left;
  - a click sets `last`, the municipality the panel shows; pointing sets `selected`, whose
    details the box shows;
  - the SVG sets no `touch-action`.
- **The limits** (`Limits.svelte`): two of the browser's range inputs over one track; the inputs
  take no pointer and their thumbs do (design of `add-limits`, decision 7). The thumbs are 1.1rem.
- **The browser tests** run one at a time (`steady-budget-tests`). The budget tests measure each
  frame's work with `app/e2e/frames.ts` and get one retry.

`investigations/small-screens.md` gives the facts this design rests on:
- which pages are too wide at 360 pixels, and why (1);
- where the parts of the page lie on a phone (2);
- what the map receives from fingers, with and without `touch-action: none` (3);
- that this machine's browser carries out no gesture of a finger by itself (4);
- the controls' sizes, and that the phone's emulation matches `(pointer: coarse)` (5);
- the frames with the CPU slowed (6);
- d3-zoom's size (7).

## Goals / Non-Goals

**Goals:**
- **Steering on a phone.** A visitor on a phone can drag a limit and see its effect on the
  verdicts, and move, zoom and tap the map with fingers.
- **The page's own code.** The map's own code, extended, and plain CSS; no library.
- **Tests of what the app does with a finger,** in the browser tests, on a phone's emulation.

**Non-Goals:**
- **The browser's own gestures in a test.** What a phone's browser does with a finger by itself
  cannot be shown on this machine (investigation, 4); it is checked by hand.
- **A layout of its own for tablets.** Between 640 and 960 pixels the page stays as it is.

## Decisions

Q decided decisions 1 to 5, 7, 8, 10 to 12, 14 and 15 on 2026-11-18 while proposing, each from
the options and the facts of the investigation. Decisions 6, 9 and 13 follow from them, the code
and the investigation. All are open to Q's review of this change.

### 1. One column, and a bar with the selection's result (Q)

The page keeps its order on a phone. In a window narrower than 640 pixels, a bar at the bottom
of the window repeats the selection's outcome and both majorities while the box "Mit Ihrer
Auswahl" is not wholly on the screen. With the slider near the top of the screen, the map lies
between it and the bar (investigation, 2).

Alternatives considered:
- **The limits below the map on a phone, with the same bar.** Map and slider always together,
  but the page's order differs between a phone and a computer.
- **The map at the top of the screen** while the limits scroll beneath it, with a line of the
  result in its frame. Shows everything at once; a third of a small screen is always the map,
  and more code.
- **The page as it is**, fixing only what is too wide. The result does not follow the finger
  within view.

### 2. The bar below 640 pixels: the outcome and both majorities (Q)

The bar shows "Mit Ihrer Auswahl: <outcome>" and "Volksmehr: <word> · Ständemehr: <word>", the
words of the box ("Ja", "Nein", "nicht nötig"). 640 pixels is where the box already moves below
the vote's result (design of `add-limits`, decision 9).

How:
- **A component of its own**, `SelectionBar.svelte`, at the end of the page, given the
  selection's outcome and verdicts.
- **It sticks** (`position: sticky; bottom: 0`): it stays at the bottom of the window while the
  page scrolls, and at the end of the page it stands in its own place, below the last line, so it
  hides nothing.
- **It is shown** while a selection applies and an `IntersectionObserver` on the box says the
  box is not wholly within the window; a media query hides it from 640 pixels.
- **It is `aria-hidden`:** it repeats the box, which assistive technology reads in its place.
- **Its texts:** one function per language in `src/lib/texts/`, from the existing words. French
  and Italian write the colon as their other texts do: "Avec votre sélection: Accepté".

Alternatives considered:
- **With the yes share and the cantonal votes** ("49.16% · 16½ : 6½"). More to read in a slim
  bar, two lines at 360 pixels.
- **Below 960 pixels**, wherever the panel stands below the map: also on tablets and narrow
  windows of a computer.

### 3. A tap is a click, and the last one is outlined (Q)

A tap already sends the map `pointerdown`, `pointerup` and `click`, and shows the details and
the panel (investigation, 3). The change specifies it and adds an outline of the municipality
last clicked or tapped, so that a visitor sees which one a finger hit: a finger covers about 40
pixels, a small municipality at the whole of Switzerland 2 to 5.

How: after the cantons, two paths with the `d` of the municipality in `last`, without fill, with
`vector-effect: non-scaling-stroke` and `pointer-events: none`, so that pointing still finds the
municipality beneath.

Alternatives considered:
- **The box of details below the map on a phone**, where over the map it covers about a sixth
  of it. Not chosen: the box stays where it is.
- **A field to choose a municipality by its name.** It would also serve keyboards and screen
  readers. Not chosen for this change.

### 4. The outline: black on a white halo (Q)

A black line 3 pixels wide over a white one 7 pixels wide. It shows on light colours by the black
and on dark ones, the set-aside grey `#2c2c2c` and the darkest classes included, by the white.

Alternatives considered:
- **A blue line** (`#1a5fb4`, the focus colour of the thumbs): close to the blue-green yes classes
  for some viewers with a colour vision deficiency.
- **A white line:** almost invisible on the palest classes and on the tie's colour.

### 5. 360 pixels, the smallest screen supported (Q)

360 pixels is the most common width of Android phones. Narrower windows may scroll sideways.

Alternatives considered:
- **320 pixels**, WCAG 2.1's reflow width (1.4.10) and the width of phones with enlarged text:
  248 of the 381 pages are too wide there today (investigation, 1).
- **375 pixels**, most iPhones: needs the same fixes for Italian.

### 6. How the pages fit 360 pixels

Two causes, two fixes (investigation, 1):
- **Long words.** The page's headings and the verdict boxes break a word too long for the line:
  `hyphens: auto`, which hyphenates by the page's `lang` where the browser knows the language,
  and `overflow-wrap: break-word`, which breaks anywhere where it does not.
- **The verdict boxes.** In a window narrower than 640 pixels their padding narrows and their
  headings get a smaller size, so that "Maggioranza dei Cantoni" wraps between its words. The
  size is chosen while applying, by the width test.

The two boxes stay side by side.

Alternatives considered:
- **The boxes one above the other** on a narrow window: changes "The two verdicts side by side"
  of `verdicts`.
- **A smaller title only:** "Wirtschaftspartnerschaftsabkommens" is about 524 pixels wide at twice
  the text's size (the page's 532 less its margin), so about 390 at one and a half times: still
  wider than the column's 344.

### 7. Zoom and move: the map's own code (Q)

Pinching is added to the code of #6 (design of `add-result-map`, decision 4, which left this
check to #10). With no dependency, the tested `zoomAround` and `moveBy` stay, and so do the
budget tests.

Alternatives considered:
- **d3-zoom 3.0.0**: pinching, a double tap, the wheel and dragging in one behaviour. It brings
  eight packages and 17.6 KB gzipped, against 21.3 KB of the vote page's own script (investigation,
  7). It works with a transform rather than the view box, so `map-view.ts` and the handlers would
  be written anew around it.

### 8. Fingers on the map belong to the map (Q)

The map's SVG gets `touch-action: none`. One finger moves the map, two zoom and move it; the
page scrolls and zooms when touched elsewhere. Without it the browser takes the gesture and
cancels it for the map (investigation, 3). The map is about 250 of a phone's 840 pixels in
height, so the page remains easy to scroll.

Alternatives considered:
- **Two fingers for the map**, one finger scrolling the page, with a hint. Never traps the
  scroll, but moving the map always takes two fingers, and three more texts.
- **One finger once zoomed in**: the map's behaviour would change with the zoom.

### 9. The pinch, in the map's code

- **The fingers.** The map keeps the pointers pressed on it by `pointerId`, at most two; a
  third is ignored.
- **One pointer** is today's press and drag, with its 4 pixels.
- **A second pointer** makes the gesture a pinch at once. The map keeps the view and both points
  of that moment.
- **At each move**, the view is the kept view zoomed around the kept midpoint by the ratio of
  the fingers' distances, then moved by the midpoint's shift. A new pure function of
  `map-view.ts`, `pinchFrom`, gives it from `zoomAround` and `moveBy`, so the limits of the zoom
  and of the centre stay as they are; it is unit-tested.
- **Taken from the start of the pinch**, not step by step, so that rounding does not drift.
- **A pinch, like a drag, selects nothing.** When one of two fingers lifts, the other goes on as
  a drag from where it is.

### 10. Controls of 44 × 44 pixels on a touch screen (Q)

Under the media query `(pointer: coarse)`, which a phone's browser matches and the tests'
emulation too (investigation, 5):
- the map's three buttons, the list, "Hinzufügen", "Entfernen" and "Zurück zum echten Ergebnis"
  get a smallest width and height of 44 pixels;
- the switch's label is at least 44 pixels tall, its box 24 pixels;
- each thumb is a 44-pixel square whose border is transparent, so that the dot a visitor sees
  keeps its size, and the track is 44 pixels tall.

With a mouse, nothing changes. The links keep their size: the language links, "Alle
Abstimmungen" and the list's titles (Q).

Alternatives considered:
- **24 × 24 pixels everywhere**, WCAG 2.2's minimum (2.5.8): fingers hit beside small targets
  more often.
- **Leave the sizes.**
- **The links too, or every link:** the top of every page, or the start page, grows on a phone.

### 11. The zoom buttons above the map below 640 pixels (Q)

In a window narrower than 640 pixels the three buttons stand in a row above the map, aligned to
the right; wider, over its top right corner as now. At 44 pixels they would cover a strip of about
200 × 44 pixels of a map 344 × 217 at 360.

Alternatives considered:
- **Over the map, as now:** about a fifth of the map's height hidden at its right on a phone.
- **Below the map**, above the panel: further from where the eye is when zooming.

### 12. Budgets measured on the test machine (Q)

A step of one finger or two and a tap keep the map's 16 ms per frame, measured as its other
inputs are, on the test machine at full speed. The bar is part of the frame of a slider's step,
within the limits' budget.

Alternatives considered:
- **16 ms with the CPU slowed 4×:** a drag of a limit takes 28 to 41 ms there today
  (investigation, 6). The recalculation and the panel would have to become two to three times
  faster first, of unknown cost.
- **Print the frames slowed 4× without failing:** each budget test twice as long, for a figure no
  one acts on.

Found while applying (Q, 2026-11-19): the frame of a finger's touchdown before a move measures 36
to 37 ms with 4 to 5 ms of the page's work in it; the rest is the browser waiting to draw it
(investigation, 9). The budget test counts the frames of the fingers' moves and of the taps,
pointing and click, not of a finger's touchdown before a move.

Alternatives considered:
- **The main thread's work from a Chrome trace** in place of the tests' frame measurement: a
  second way of measuring beside the other budget tests, and more test code.
- **Tracing Chrome's frame scheduling first**, to find why that frame waits: possibly this
  browser's synthetic touches.

### 13. The tests on a phone's emulation, with fingers sent by the DevTools protocol

- **The phone:** Playwright's `devices['Pixel 7']` (412 × 839, touch, mobile viewport) in
  `test.use`, without its `defaultBrowserType`: the tests run Chromium only.
- **Fingers:** a helper, `app/e2e/fingers.ts`, sends touch points with Chrome's
  `Input.dispatchTouchEvent` through a CDP session. Each finger gets its own id and moves in steps,
  so a test knows where each one is.
- **What `touch-action` changes is tested by its effect.** Without it the map gets two moves and
  a `pointercancel` (investigation, 3), so "Moving with a finger" fails today: the map moves 20
  pixels, not 100.
- **What the browser does with a finger by itself** (scrolling, zooming the page, the native
  thumbs) is checked by hand on a phone (decision 15).

Alternatives considered:
- **`page.touchscreen`**: Playwright offers a tap only.
- **Chrome's synthetic gestures** (`Input.synthesizePinchGesture`): their steps are the
  browser's, not the test's, so a test cannot know where each finger is.

### 14. The widths tested on named pages (Q)

The browser tests open the pages the spec names, about twelve, in a window 360 pixels wide:
- the start page and the guide in each language;
- the tie-break question in each language;
- `/de/votes/6400/`, with the longest word;
- `/it/votes/5960/` with a selection and the panel filled, and `/fr/votes/5960/`.

`investigations/small-screens/widths.cjs` checks all 381 pages, in about 70 s, and is run by hand
when texts or titles change.

Alternatives considered:
- **Every page in the tests:** the suite from about 50 to about 120 s.
- **Every page in a CI step of its own:** more machinery for one check.

### 15. Checked on a phone after the merge (Q)

The pull request is merged once CI passes; Q checks on a phone, on the published site, what the
tests cannot show (Migration Plan). What is wrong becomes a small change of its own.

Alternatives considered:
- **Archive after the check**, in a second pull request: two pull requests.
- **Previews of pull requests:** a `gh-pages` branch and a third-party action with write access,
  or another host (rejected in `publish-site`, decision 3).
- **On Q's computer**, built and opened on the phone over the network: steps on Q's side for
  each check.

### Tests

- **App (Vitest):** `pinchFrom` in `map-view.test.ts`:
  - fingers apart to twice their distance around a point: half the width, the point in place;
  - fingers moved together: the shift, the width kept;
  - fingers together at the whole of Switzerland: the whole of Switzerland;
  - apart beyond 16 times: a sixteenth;
  - each seen to fail first.
- **Browser (Playwright):**
  - a new file, `app/e2e/small-screens.spec.ts`, one test per scenario of `small-screens`;
  - in `result-map.spec.ts`, one test per added or modified scenario, on the phone's emulation
    where the scenario names a touch screen, apart from "A finger beside the map", which is
    checked by hand;
  - the existing tests unchanged.
- **The budget of fingers:** in a `describe` with one retry, as the map's other budget tests.
  The fingers move in steps with a frame between them, and each tap is preceded by the whole of
  Switzerland. A delay of 20 ms put into the handler while the test is written makes it fail,
  then goes.

### Dependencies added

None. The fingers are the map's own code, and the sizes and the bar are CSS and a component.

### Performance budget

- **A step of one finger or two:** at most 16 ms of main-thread work per frame (decision 12).
  It sets one view box, as a step of a drag or a turn of the wheel does: 0.7 to 0.8 ms at full
  speed (investigation, 6).
- **A tap:** at most 16 ms, as a click; 3.6 to 5.3 ms at full speed. The outline adds two paths,
  set once per tap.
- **A step of a slider with the bar:** within the limits' 16 ms. The bar's two lines change with
  the box's text, from the same derived result. The `IntersectionObserver` reports only when the
  box crosses the window's edge.
- **Loading:** nothing new.

## Risks / Trade-offs

- **[This machine cannot show what a phone's browser does with a finger]** → Decision 15: a check
  by hand on a phone after the merge, and a small change for what is wrong.
- **[Safari on iOS is not tested]** → The tests run Chromium. The check by hand uses an iPhone if
  one is at hand, and `touch-action` and `(pointer: coarse)` are standard.
- **[A finger on the map cannot scroll the page]** → Decision 8: the map is about a third of the
  screen's height, and the page scrolls elsewhere.
- **[Hyphenation differs between browsers]** → `overflow-wrap` breaks where hyphenation does
  not. The spec asks only that a long word is broken, not where.
- **[The bar covers the bottom of the window]** → Only below 640 pixels, while a selection
  applies and the box is not wholly on the screen; two short lines; at the end of the page it
  stands below the last line.
- **[A slow phone draws fewer frames while a limit is dragged]** → Decision 12. 28 to 41 ms with
  the CPU slowed 4× (investigation, 6). A later change can make the recalculation faster.
- **[44-pixel thumbs at close steps overlap]** → The upper one lies on top, as now (design of
  `add-limits`, decision 7). The arrow keys move either.
- **[A touch pointer is captured by the path it was pressed on]** → The handlers are on the SVG,
  where the pointer's events arrive from the path. A finger's move after a pinch is a drag.

## Migration Plan

1. Apply; `./scripts/verify-local.sh` passes. No data file changes.
2. Merge by rebasing. CI publishes the site.
3. Q checks by hand on a phone, Chrome on Android or Safari on iOS, on
   `/de/votes/5960/` and `/it/votes/5960/`:
   - one finger on the map moves it, and the page does not scroll;
   - one finger over the limits scrolls the page;
   - two fingers zoom the map, not the page;
   - a tap shows the details, fills the panel and outlines the municipality, also a tap right
     after moving the map with a finger, which this browser loses within 50 ms (investigation, 8);
   - a finger's touchdown shows the details under it without a visible wait (investigation, 9);
   - a finger drags each thumb of a limit;
   - the bar follows the drag and goes when "Mit Ihrer Auswahl" is on the screen;
   - nothing scrolls sideways.
4. What fails there becomes a small change of its own.
5. Rollback: revert the commits on `main`; CI publishes the site as before.

## Open Questions

- **The size of the verdict boxes' headings below 640 pixels** (decision 6) is chosen while
  applying, by the width test. It changes no requirement.
