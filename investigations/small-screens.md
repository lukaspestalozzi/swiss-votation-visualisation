# Small screens

Found while proposing `add-small-screens` (#10 of `docs/roadmap.md`), on 2026-11-18, against the
site built from `16c0774` (the archive of `steady-budget-tests`). It answers what #10 needs to
decide how the site works on a phone:
- which pages are wider than a phone's window, and why;
- where the result of a selection, a limit's slider and the map lie on a phone's screen;
- what the map receives from fingers, and what the CSS property `touch-action` changes;
- what this machine's browser does not do with a finger, so that a test cannot show it;
- how large the controls are on a touch screen;
- what a frame costs with the CPU slowed as Chrome imitates a phone;
- what d3-zoom, the library named in the design of `add-result-map` (decision 4), would add.

It decides nothing: the design of `add-small-screens` records the decisions.

Words used here: a **phone** is the browser's emulation of one by Playwright 1.63 (`devices`:
"Pixel 7", 412 × 839 pixels; "iPhone 13 Mini", 375 × 629), with touch and a mobile viewport; a
**finger** is a touch point sent with Chrome's DevTools protocol (`Input.dispatchTouchEvent`); a
**pixel** is a CSS pixel.

## How to reproduce

The scripts are in `investigations/small-screens/`. The six in JavaScript use the global
Playwright against the built site, served as the browser tests serve it; the shell script
installs d3-zoom into a directory outside the repository.

```sh
pnpm run build
(cd app && pnpm exec sirv build --port 4174) &
node investigations/small-screens/widths.cjs 360
node investigations/small-screens/layout.cjs [/path/outside/the/repository]
node investigations/small-screens/touch.cjs
node investigations/small-screens/touch.cjs --touch-action none
node investigations/small-screens/gestures.cjs
node investigations/small-screens/targets.cjs
node investigations/small-screens/slowed_frames.cjs 3
investigations/small-screens/d3_zoom_size.sh /new/path/outside/the/repository
```

| File | What |
|------|------|
| `widths.cjs` | Every page in the three languages, 381 in all, in a window of a given width: the pages wider than it and the innermost elements past its right edge. About 70 s at 360 pixels. |
| `layout.cjs` | Where the result, the selection's result, a limit's slider, the map and the table lie on two phones while a selection applies; screenshots of the whole page into a directory if one is given. |
| `touch.cjs` | A tap on Zürich, then one finger and two fingers moved over the map, on a phone: the pointer events the map receives and its view box; with `--touch-action`, the map first gets that value. |
| `gestures.cjs` | A control: Chrome's synthetic gestures with a finger, on the guide and on a plain slider, and the same scroll with the mouse. |
| `targets.cjs` | The size of each control of a vote's page with a limit, on a phone and on a computer, and the media queries of the pointer. |
| `slowed_frames.cjs` | The longest frame of zooming and moving the map, of a click on Zürich and of dragging a limit, with the CPU at full speed and slowed 4× and 6×, as the browser tests measure frames. |
| `d3_zoom_size.sh` | The size of a page that attaches d3-zoom 3.0.0 to an SVG, minified and gzipped, and the sizes of the built site's larger scripts. |

"Output" at the end of this file is what the scripts printed on 2026-11-18.

## Answers

### 1. Pages wider than 360 pixels

`widths.cjs 360`: 139 of the 381 pages are wider than a window 360 pixels wide, so a phone of
that width zooms out or scrolls sideways.
- **The Italian page of every judged vote, 124 pages, is 364 pixels wide.** The two verdicts
  stand side by side in two equal columns, and a column is no narrower than its longest word with
  the box's padding: "Maggioranza", in the second-level heading "Maggioranza dei Cantoni".
- **15 German vote pages, 363 to 532 pixels wide,** for one long word of their title, which the
  page's first heading writes at twice the size of the text: the widest is vote 6400 (532
  pixels), whose title holds "Wirtschaftspartnerschaftsabkommens", 34 letters; then 6770 (490,
  "Umweltverantwortungsinitiative"), 6580 (435, "Massentierhaltungsinitiative") and 6240 (429,
  "Selbstbestimmungsinitiative"), each the longest word of its title. Which word of the other
  eleven titles is too long was not measured word by word.
- **No French page, no start page and no guide** is wider than 360 pixels; nor is the Italian
  page of the tie-break question, which has no verdicts.

`widths.cjs 320`: 248 pages, the German and the Italian page of every judged vote. The German
ones are 328 pixels wide or more, the verdict boxes ("Ständemehr") or a long word of the title;
the Italian ones 364. `widths.cjs 412` (Pixel 7): 6 pages, all German, by a long word of the
title (6030, 6240, 6330, 6400, 6580, 6770).

On a phone the vote page is one column: the result, "Mit Ihrer Auswahl" below it in a window
narrower than 640 pixels, the limits, the map (396 × 250 pixels at 412), the panel below the map,
the legend, the table.

### 2. Where the parts lie while a selection applies

`layout.cjs`, on `/de/votes/5960/` with the upper bound of "Ausländeranteil" at step 327, in
pixels from the top of the page:

| | Pixel 7 (screen 839 high) | iPhone 13 Mini (629) |
|---|---|---|
| The vote's result | 266 to 611 | 266 to 611 |
| "Mit Ihrer Auswahl" | 627 to 972 | 627 to 972 |
| The limit's slider | 1,211 | 1,210 |
| The map | 1,459 to 1,709 | 1,476 to 1,703 |
| The table of the cantons | 2,044 | 2,073 |

With the slider in the middle of the screen, "Mit Ihrer Auswahl" ends 239 pixels above it and
the map begins 248 pixels below it: a visitor dragging a limit on a phone sees neither the
selection's verdicts nor more than the top of the map. Each further limit lies between the
slider and the map, and moves the map further down.

### 3. What the map receives from fingers

`touch.cjs`, on a phone, the map showing the whole of Switzerland:
- **A tap on Zürich** gives the map `pointerdown`, `pointerup` and `click`, all of the same touch
  pointer; the details read "Zürich (ZH)", "Ja-Anteil: 31.85%", and the panel shows "Einwohner:
  396'955". Tapping does today what clicking does.
- **One finger moved 50 pixels right** in five steps: the map receives two moves, then
  `pointercancel`; the browser has taken the rest of the gesture as its own (on a phone: scrolling
  the page). The map moved 20 pixels.
- **Two fingers moved apart**, each 50 pixels: the map receives two moves of each, then
  `pointercancel` for both; the browser has taken the pinch (on a phone: zooming the whole page).
  The map's code treats the moves as a drag, and the map moved; it does not zoom.

With `--touch-action none`, the map receives every move of both fingers and their `pointerup`,
and no `pointercancel`: the map moves 50 pixels with one finger, and with two it still moves
(about 150 pixels), as today's code knows no pinch. So `touch-action: none` on the map hands every
finger on it to the app's code, and a pinch is the app's to implement.

### 4. What this machine's browser does not do

`gestures.cjs`, a control for answers 3 and 5: Chrome's synthetic gestures with a finger
(`Input.synthesizeScrollGesture`, `Input.synthesizePinchGesture`, `gestureSourceType: touch`)
scroll no page, zoom no page and move no plain slider here, also on the guide, which has no
handler of its own, and also without the phone's emulation; the same scroll with the mouse
scrolls 300 pixels. The browser on this machine (Playwright's Chromium, headless, and also the
full Chromium with `channel: 'chromium'` and headed under Xvfb, tried by hand) delivers the
pointer events of a finger and cancels them where a phone would take the gesture (answer 3), but
does not carry out the gesture itself. What a phone's browser does with a finger outside the
app's code (scrolling, zooming the page, moving a native slider's thumb) is therefore checked by
hand on a phone; the browser tests can check the app's own handling of fingers, and the CSS that
decides who gets them.

### 5. The controls on a touch screen

`targets.cjs`: the phone's emulation matches the media queries `(pointer: coarse)` and
`(hover: none)`, the computer matches neither, so the browser tests can check what a page does on
a touch screen. The controls of `/de/votes/5960/` with one limit, in pixels, the same on both:

| Control | Size |
|---|---|
| "Vergrössern" (+), "Verkleinern" (−) | 24 × 21 |
| "Ganze Schweiz" | 109 × 21 |
| The list "Merkmal hinzufügen" | 226 × 19 |
| "Hinzufügen" | 83 × 21 |
| "Entfernen" | 74 × 21 |
| "Zurück zum echten Ergebnis" | 186 × 21 |
| The box of the switch for the Swiss abroad | 13 × 13 (its text, in the same label, toggles it too) |
| A limit's track (its two sliders) | the column's width × 24 |
| A slider's thumb | 17.6 × 17.6 (1.1rem in `Limits.svelte`) |
| A link of the language switch | 54 × 18 |

WCAG 2.2 asks for at least 24 × 24 pixels (2.5.8, level AA) and 44 × 44 (2.5.5, level AAA);
Apple's guidelines name 44 points.

### 6. Frames with the CPU slowed

`slowed_frames.cjs 3`, the longest frame of each run, measured as the browser tests measure
frames (`app/e2e/frames.ts`), with the mouse on a page 1,280 pixels wide:

| CPU | Zoom and move | Click on Zürich (fills the panel) | Drag of a limit, 20 steps |
|---|---|---|---|
| Full speed | 0.7 to 0.8 ms | 3.6 to 5.3 ms | 6.5 to 9.7 ms |
| 4× slower ("mid-tier mobile") | 3.1 to 4.5 ms | 14.8 to 17.2 ms | 27.9 to 40.6 ms |
| 6× slower ("low-end mobile") | 4.7 to 6.7 ms | 24.1 to 27.3 ms | 36.6 to 42.4 ms |

A first run of the same measurement, as a spike, gave 25.7 to 27.9 ms for the drag at 4× and
38.9 to 43.2 ms at 6×. Slowed 4×, a drag of a limit takes about three to four times its budget of
16 ms; zooming and moving stay well within theirs. How Chrome's slowing compares with a given
phone is not measured here.

### 7. d3-zoom

`d3_zoom_size.sh`: d3-zoom 3.0.0 brings eight packages with it (d3-color, d3-dispatch, d3-drag,
d3-ease, d3-interpolate, d3-selection, d3-timer, d3-transition). A page that attaches its zoom
behaviour to an SVG has a script of 52,955 bytes minified, 17,611 gzipped. The vote page's own
script is 88,625 bytes minified, 21,271 gzipped; the site's two largest shared scripts 15,814 and
16,898 gzipped. The design of `add-result-map` estimated "about 10 KB gzipped". d3-zoom works with
a transform (a scale and a shift) rather than a view box. Its version 3.0.1 was published on
2026-11-03; pnpm holds back versions that recent.

## Not verified

- What a real phone's browser does with a finger outside the app's code, Chrome on Android and
  Safari on iOS: scrolling the page, zooming it, moving the thumbs of the limits' sliders, which
  lie over one another and take the pointer on their thumbs only (answer 4). The change's tasks
  check it by hand on a phone.
- How Chrome's slowed CPU compares with a given phone (answer 6).

## Output

`node widths.cjs 360` (the 124 lines of Italian vote pages, each "364" with the outcome as the
element past the edge, shortened to the first):

```
de/votes/5790/ 381
de/votes/5940/ 372
de/votes/5970/ 368
de/votes/6030/ 427
de/votes/6240/ 429
de/votes/6250/ 363
de/votes/6330/ 420
de/votes/6370/ 402
de/votes/6400/ 532
de/votes/6500/ 364
de/votes/6580/ 435
de/votes/6600/ 390
de/votes/6700/ 379
de/votes/6770/ 490
de/votes/6860/ 380
it/votes/5670/ 364 p "Respinto"
...
139 of 381 pages wider than 360 px
```

`node widths.cjs 320` (the last line) and `node widths.cjs 412`:

```
248 of 381 pages wider than 320 px
```

```
de/votes/6030/ 427
de/votes/6240/ 429
de/votes/6330/ 420
de/votes/6400/ 532
de/votes/6580/ 435
de/votes/6770/ 490
6 of 381 pages wider than 412 px
```

`node layout.cjs`:

```
Pixel 7 {"screen":839,"result":[266,611],"selection":[627,972],"slider":1211,"map":[1459,1709],"table":2044,"page":3135}
iPhone 13 Mini {"screen":629,"result":[266,611],"selection":[627,972],"slider":1210,"map":[1476,1703],"table":2073,"page":3200}
```

`node touch.cjs` and `node touch.cjs --touch-action none`:

```
tap on Zürich: pointerdown#2@232 pointerup#2@232 click#2@232 {"details":"Zürich (ZH) Ja-Anteil: 31.85%J","panel":true}
1 finger(s): pointerdown#3@250 pointermove#3@260 pointermove#3@270 pointercancel#3@0 | view box 0 0 348832 220581 -> -17617.777777777777 0 348832 220581
2 finger(s): pointerdown#4@150 pointerdown#5@250 pointermove#5@260 pointermove#4@140 pointermove#5@270 pointermove#4@130 pointercancel#4@0 pointercancel#5@0 | view box 0 0 348832 220581 -> 105706.66666666667 0 348832 220581
---
tap on Zürich: pointerdown#2@232 pointerup#2@232 click#2@232 {"details":"Zürich (ZH) Ja-Anteil: 31.85%J","panel":true}
1 finger(s): pointerdown#3@250 pointermove#3@260 pointermove#3@270 pointermove#3@280 pointermove#3@290 pointermove#3@300 pointerup#3@300 | view box 0 0 348832 220581 -> -44044.444444444445 0 348832 220581
2 finger(s): pointerdown#4@150 pointerdown#5@250 pointermove#5@260 pointermove#4@140 pointermove#5@270 pointermove#4@130 pointermove#5@280 pointermove#4@120 pointermove#5@290 pointermove#4@110 pointermove#5@300 pointermove#4@100 pointerup#4@100 pointerup#5@300 | view box 0 0 348832 220581 -> 132133.33333333334 0 348832 220581
```

`node gestures.cjs`:

```
guide, a finger moved up 300 px: scrollY 0, scale 1
guide, two fingers spread to twice their distance: scrollY 0, scale 1
plain slider at 1000, its thumb moved 150 px left by a finger: 1000
guide without a phone's emulation, touch moved up 300 px: scrollY 0
guide without a phone's emulation, mouse moved up 300 px: scrollY 300
```

`node targets.cjs`:

```
Pixel 7 {"pointer: coarse":true,"hover: none":true,"list":"226×19","Hinzufügen":"83×21","track":"396×24","Entfernen: Ausländeranteil":"74×21","switch":"13×13","Zurück zum echten Ergebnis":"186×21","Vergrössern":"24×21","Verkleinern":"24×21","Ganze Schweiz":"109×21","language link":"54×18"}
computer {"pointer: coarse":false,"hover: none":false,"list":"226×19","Hinzufügen":"83×21","track":"480×24","Entfernen: Ausländeranteil":"74×21","switch":"13×13","Zurück zum echten Ergebnis":"186×21","Vergrössern":"24×21","Verkleinern":"24×21","Ganze Schweiz":"109×21","language link":"54×18"}
```

`node slowed_frames.cjs 3`:

```
CPU 1× slower: longest frame of zoom and move 0.8 ms, of the click 5.3 ms, of the drag 9.7 ms (20 steps)
CPU 1× slower: longest frame of zoom and move 0.7 ms, of the click 3.6 ms, of the drag 9.0 ms (20 steps)
CPU 1× slower: longest frame of zoom and move 0.7 ms, of the click 4.5 ms, of the drag 6.5 ms (20 steps)
CPU 4× slower: longest frame of zoom and move 4.5 ms, of the click 16.6 ms, of the drag 34.8 ms (20 steps)
CPU 4× slower: longest frame of zoom and move 3.7 ms, of the click 14.8 ms, of the drag 27.9 ms (20 steps)
CPU 4× slower: longest frame of zoom and move 3.1 ms, of the click 17.2 ms, of the drag 40.6 ms (20 steps)
CPU 6× slower: longest frame of zoom and move 6.7 ms, of the click 24.5 ms, of the drag 36.6 ms (20 steps)
CPU 6× slower: longest frame of zoom and move 5.8 ms, of the click 27.3 ms, of the drag 37.1 ms (20 steps)
CPU 6× slower: longest frame of zoom and move 4.7 ms, of the click 24.1 ms, of the drag 42.4 ms (20 steps)
```

`d3_zoom_size.sh`:

```
d3-color
d3-dispatch
d3-drag
d3-ease
d3-interpolate
d3-selection
d3-timer
d3-transition
d3-zoom
d3-zoom page: 52955 bytes minified, 17611 gzipped
site 6.CSRmlhez.js: 28157 bytes minified, 10158 gzipped
site 8.ClffscEo.js: 88625 bytes minified, 21271 gzipped
site BBbxcIfG.js: 43064 bytes minified, 15814 gzipped
site C_80NMBa.js: 26261 bytes minified, 8794 gzipped
site D3BhSEgC.js: 5355 bytes minified, 2262 gzipped
site DqjgSlZK.js: 44058 bytes minified, 16898 gzipped
```
