# Redesign

Found while proposing `redesign-site` (#14 of `docs/roadmap.md`), on 2026-11-24, against the site
built from `761b6c1` (the archive of `add-more-characteristics`). Q asked for a look at the site's
design, as it "does not look very modern". It answers what #14 needs to decide a new look and
layout:
- what a window shows of the pages today, and how long they are;
- what the result pages of a Swiss broadcaster draw;
- which browser tests name today's structure;
- what the drawings a new look adds cost in the frames of a drag;
- the contrast of the colours it adds;
- what the mockups show, and where their parts stand by window.

It decides nothing: the design of `redesign-site` records the decisions. "Found while applying"
holds what the change's implementation found, on 2026-11-24 and 2026-11-25.

Words used here: the **contrast** of two colours is WCAG 2.2's ratio of their relative luminances
(1.4.3: 4.5:1 for text; 1.4.11: 3:1 for the parts of a control and of a graphic); the
**distance** of two colours is the Delta E of `investigations/map-data.md` (OKLab times 100; 8
tells two colours apart); a **pixel** is a CSS pixel; the **work** of a frame is what the browser
tests' `app/e2e/frames.ts` measures; a **mockup** is a page that shows a look with the site's real
content and does nothing.

## How to reproduce

The scripts are in `investigations/redesign/`. Those in JavaScript use the global Playwright;
`look.cjs`, `drag_with_drawings.cjs` and `mockups/extract.cjs` run against the built site, served
as the browser tests serve it. `mockups/hist.mjs` and `mockups/build.mjs` import the app's own
modules or read its data files, which Node 24 runs with their types stripped. `colours.py` uses
the standard library only. What the mockups' scripts write, about 1.4 MB, goes to a directory
outside the repository. `stays.cjs`, `first_step.cjs` and `start_page.cjs` were added while
applying and run against the built site too. The server holds the list of the build's files from
its start: after a build it is started anew.

```sh
pnpm run build
(cd app && pnpm exec sirv build --port 4174) &
node investigations/redesign/look.cjs [/new/path/outside/the/repository]
node investigations/redesign/drag_with_drawings.cjs [--runs 10] [--limits 1] [--phone]
python3 investigations/redesign/colours.py
# The mockups:
node investigations/redesign/mockups/extract.cjs /new/path/outside/the/repository
node investigations/redesign/mockups/hist.mjs "$PWD" /new/path/outside/the/repository
node investigations/redesign/mockups/build.mjs "$PWD" /new/path/outside/the/repository
node investigations/redesign/mockups/shots.cjs /new/path/outside/the/repository [--shots]
# Found while applying:
node investigations/redesign/stays.cjs
node investigations/redesign/first_step.cjs [<width> <height>]
node investigations/redesign/start_page.cjs
```

| File | What |
|------|------|
| `look.cjs` | The start page, the page of the vote of 2016-02-28 without and with a selection, the comparison and the guide, in windows 1,280 and 360 pixels wide: the page's size and, for the vote's page, how far down its result, its limits, its first slider, its map and its table begin. With a directory, a screenshot of each in both schemes. |
| `drag_with_drawings.cjs` | The frames of a drag of a limit on today's page, without and with the drawings a new look adds, which the script adds to the page and redraws in the frame of every step: two results as bars, the cantons as 26 segments each, a bar per canton, the count's bar, and a histogram of 50 bins per limit. |
| `colours.py` | The contrast of the colours a new look adds, on the ground and on the hover ground of a light and of a dark scheme, and the distance of the two sides of a bar; measured as `map-data/check_colours.py` measures, whose functions it loads. |
| `mockups/extract.cjs` | The real content of the built site for the mockups: the figures, the table of the cantons, the panel of Köniz and each municipality's fill for the vote of 2016-02-28 without and with a selection; the start page's entries; a second vote of that day, an optional referendum without the Swiss abroad, and the tie-break question. |
| `mockups/hist.mjs` | Where the municipalities lie on the tracks of "Ausländeranteil" and "Einwohner" for that vote day, in 50 bins of 20 steps, and where Köniz lies. |
| `mockups/build.mjs` | Writes the six mockups, each one file with the map's shapes and the font: `vote-b.html` and `vote-b-real.html` (a vote with and without a selection), `start.html`, `compare.html`, `guide.html` and `parts.html` (a vote that needs only the majority of voters, the tie-break question, the list of "Merkmal hinzufügen" open). |
| `mockups/mock.css` | The mockups' stylesheet: the look the design describes. |
| `mockups/shots.cjs` | Where the parts of a vote's mockup stand in eight windows, each mockup's size in windows 1,280 and 360 pixels wide, and, with `--shots`, a screenshot of each in both schemes. |
| `stays.cjs` | Found while applying: by how much the part of a vote's page that stays in the window, the result, the map and its legend, is taller than the window, with a selection, in 12 widths by 6 heights and three languages. |
| `first_step.cjs` | Found while applying: where the results, the map, the legend and the last limit's slider stand in the window before and after the step with which a selection first applies, with five limits and the page scrolled to the last. |
| `start_page.cjs` | Found while applying: the start page in ten windows and three languages: its size, the narrowest title of a row, the widest share and result, and the height of the part that stays at the top against the room a year keeps for it. |

"Output" at the end of this file is what the scripts printed on 2026-11-24, and, under "Found
while applying", on 2026-11-25 against the site built from the change's branch.

## Answers

### 1. What a window shows today

A vote's page puts its parts one below the other: the result, the limits, the map with the panel
beside it, the table of the cantons. In a window 1,280 pixels wide, with the limits
"Ausländeranteil" and "Einwohner" set, the result begins 236 pixels down the page, the first
slider 846, the map 1,225 and the table 1,990; the page is 3,216 pixels long (Output, `look.cjs`).
A window 800 pixels high therefore shows either the result with the first slider, or a slider with
the top of the map, and never the map with the result: the three parts the visitor needs while
moving a limit lie on three screens. In a window 360 pixels wide the first slider begins 1,531
pixels down and the map 2,101; there a bar at the bottom of the window repeats the selection's
outcome.

The start page is 6,205 pixels long in a window 1,280 wide and 14,897 in one 360 wide. Its 125
entries are running text: the date, the linked title, the kind and the result follow each other
and wrap where the line ends, so no column can be read down. Its heading is the working title; no
sentence says what the site does, and nothing searches or filters the list.

What the pages draw: the map. Every other figure is text: the result in two boxes per result, the
35 characteristics of a municipality as 35 lines, the cantons as a table of 26 rows. A limit is
the browser's range input, a track with two thumbs, which does not show where the municipalities
lie.

### 2. What a broadcaster's result pages draw

Looked at on 2026-11-24, SRF's pages for the vote day of 2026-09-27
(`https://www.srf.ch/news/schweiz/abstimmung-27-september-2026-so-hat-die-schweiz-abgestimmt-in-grafiken`
and `…/abstimmung-27-september-2026-wie-hat-ihre-gemeinde-an-der-urne-entschieden`) draw, for each
vote:
- the result as one bar, yes from the left and no from the right, with a mark at half and the
  counts of votes below;
- the cantonal votes as a row of 23 dots, "Standesstimmen (23/23)";
- the verdict as a word in a box, "NEIN", with a sentence, "Am Volks- und Ständemehr gescheitert";
- a map with a legend of one strip of colours and the yes shares 100, 65, 50, 35 and 0 below it;
- a column of text 680 pixels wide in a window 1,280 wide.

None of them lets the visitor change the result. blue News's page of 2026-03-08 was covered by an
advertisement; four other news sites answered the request with 403 and were left alone.

### 3. The browser tests that name today's structure

A read of the ten files of `app/e2e/` counted 255 browser tests, of which 155 assert something a
new layout or other controls would change. The count is that read's; it was not checked test by
test.

| File | Tests | Affected | What they lean on |
|------|-------|----------|-------------------|
| `limits.spec.ts` | 43 | 41 | The list "Merkmal hinzufügen" with "Hinzufügen" (the helpers `open` and `addLimit`), a limit's label as one text, the switch as a checkbox, `.figures dd`, `.verdict`, `.outcome` |
| `compare.spec.ts` | 29 | 25 | The table of a vote, its columns and rows by index; the two tables side by side at 1,280 |
| `share-link.spec.ts` | 23 | 22 | The same helpers as `limits.spec.ts` |
| `site-style.spec.ts` | 21 | 19 | Links and the ring of focus in `#1a5fb4`; the head's five parts; the map 1,552 pixels wide at 1,920; no control on the start page |
| `result-map.spec.ts` | 59 | 16 | The legend's ten entries; the panel to the right of the map; the order outcome, map, table |
| `small-screens.spec.ts` | 16 | 14 | The two verdict boxes side by side at 360; the controls named for 44 pixels |
| `languages.spec.ts` | 35 | 11 | The start page's heading and the parts of an entry; the switch's three names |
| `vote-list.spec.ts` | 6 | 4 | The start page's heading, a list item per vote, "abgelehnt, 49.16% Ja" as one text |
| `vote-page.spec.ts` | 8 | 3 | `.figures dd`, `.verdict`, `.outcome`, the cells of a canton's row |
| `guide.spec.ts` | 15 | 0 | (three may need a look: the guide's sections, a sentence that says "daneben") |

Most of them reach the page through a few shared helpers and class names. A change that keeps
today's words (a limit's label, the count's sentence, the names of the buttons, the details' three
lines, a panel line as "name: value") breaks far fewer assertions than one that rewrites them.
`app/e2e/frames.ts` counts the browser's own `input` and `change` events; `app/e2e/pointing.ts`
needs a municipality's shape to be the topmost element at its point.

### 4. The frames of a drag with the drawings

`drag_with_drawings.cjs` drags the lower bound of "Einwohner" across its track and back, 40 steps,
on today's page with a selection, as the browser test of the budget does. With the drawings it
adds 165 elements for one limit and 369 for five, and redraws every one of them in the frame after
each step, reading the values from what the page writes; the app would have them at hand.

| Limits | Window | Longest frame of a run, today | With the drawings | Runs over 16 ms |
|--------|--------|-------------------------------|-------------------|-----------------|
| 1 | 1,280 × 900 | 7.0 ms on average (5.2 to 9.2) | 8.4 ms (5.8 to 11.9) | 0 of 10 and 0 of 10 |
| 5 | 1,280 × 900 | 7.6 ms (5.3 to 12.7) | 8.5 ms (6.7 to 11.0) | 0 of 10 and 0 of 10 |
| 5 | the tests' phone | 6.8 ms (5.0 to 10.0) | 8.6 ms (6.3 to 11.6) | 0 of 10 and 0 of 10 |

The drawings cost 1 to 2 ms of a frame's work. The median frame rose from 3.5 to 3.9 ms with one
limit and from 3.6 to 4.3 ms with five (Output).

### 5. The colours a new look adds

On white, the light scheme (Output, `colours.py`): links, controls and the ring of focus in the
text's colour `#1c1c1c` have 17.04:1. A hover ground `#f4f4f4` lies 3.3 from white; on it the text
has 15.49:1, secondary text `#595959` 6.37:1, the verdicts' `#007260` 5.34:1 and `#934319` 6.24:1,
but the grey of a majority that is not needed, `#767676`, only 4.13:1: it must stay on the ground.
The two sides of a bar in the map's class 3, `#009c86` and `#c2673b`, have 3.44:1 and 3.96:1 on
white. They lie 22.4 apart, 10.4 for a red-green colour vision deficiency, but their contrast with
each other is 1.15:1, so the place where a bar turns from yes to no rests on hue unless a gap
marks it. A grey `#8c8c8c` for a histogram's bins outside a limit has 3.36:1 on white and 5.07:1
against the bins inside it. An empty track `#e4e4e4` has 1.27:1 and a hairline `#dedede` 1.35:1:
neither can carry a meaning of its own.

On `#121212`, the dark scheme: the text `#e8e8e8` has 15.29:1, and 13.91:1 on a hover ground
`#1c1c1c`; the two sides of a bar in the map's class 2, `#4bc1ad` and `#e5946f`, have 8.50:1 and
7.85:1 and lie 20.3 apart, 9.4 with the deficiency; bins outside in `#6e6e6e` have 3.67:1, and
4.16:1 against those inside. The set-aside grey `#2c2c2c` lies 6.7 from `#1c1c1c`, below 8: a
set-aside swatch or municipality must stand on the ground, not on the hover ground.

### 6. The mockups

Two rounds of mockups were shown to Q on a private page; the scripts in `mockups/` write the
second round, the one the design describes. They use the site's real content, read from the built
site (Output, `extract.cjs`): the vote of 2016-02-28, number 596, with the limits "Ausländeranteil"
up to 19.98% and "Einwohner" from 2'987, under which 279 of 2,103 municipalities remain and the
vote passes with 50.87% and 14½ : 7; and Köniz clicked, which remains.

What they show:
- **A vote's page.** In a window at least 1,024 pixels wide, the result and the map stand in a
  column on the left that stays in the window, the limits in a column of 307 to 384 pixels on the
  right. The real result stands above the selection's: each is a row of the outcome, the majority
  of voters as a bar with a mark at half, and the cantons as a bar of one segment per canton, a
  half vote half as wide. Each limit keeps today's label and adds a histogram of 50 bins and a
  mark for the municipality last clicked. Below the two columns stand the panel, each share with a
  small bar, and beside it the table of the cantons, each yes share with a bar from 50%.
- **The start page.** A question as its heading and one sentence; the votes by year and vote day,
  each a row of title and kind, a small bar, the yes share and the verdict; a search field, three
  buttons for the result, and a link per year.
- **The comparison.** The two votes one below the other, each with its real result and its result
  with the selection as on a vote's page, the limits beside them.
- **The guide.** Its text in one column.
- **Single states.** A vote that needs only the majority of voters; the tie-break question; the
  list of "Merkmal hinzufügen" open, the characteristics under their eight headings.

Where the parts of the vote's mockup stand (Output, `shots.cjs`; left, top, width, height):

| Window | Result | Map | Limits | Result and map stay |
|--------|--------|-----|--------|---------------------|
| 1,920 × 1,080 | 192, 213, 1,104 × 164 | 192, 397, 1,104 × 698 | 1,344, 213, 384 wide | yes |
| 1,280 × 800 | 32, 213, 784 × 164 | 32, 397, 784 × 496 | 864, 213, 384 wide | yes |
| 1,024 × 768 | 32, 211, 605 × 297 | 32, 528, 605 × 382 | 685, 211, 307 wide | yes |
| 1,023 × 768 | 32, 211, 959 × 164 | 32, 395, 959 × 606 | 32, 1,162, below the map | no |
| 360 × 740 | 16, 316, 328 × 468 | 0, 858, 360 × 228 | 16, 1,363, below the map | no |

In a window 1,280 by 800 the result, the top 403 pixels of the map's 496 and both limits lie in
the first screen, where today the map begins 1,225 pixels down. The page is at most 1,600 pixels
wide: at 1,920 it begins 160 pixels from the left. At 1,024 the result has 605 pixels and writes
its outcome above its two majorities; at 480 and below it has 448 or less and writes all three one
below the other. No mockup is wider than a window 360 pixels wide.

The mockups are 2,432 (a vote with a selection), 10,104 (the start page), 1,027 (the comparison)
and 2,410 pixels (the guide) long in a window 1,280 wide; 5,602, 17,232, 2,620 and 3,769 in one
360 wide. The start page grows from 6,205 to 10,104 pixels, and from 14,897 to 17,232 on a phone,
as each vote has a row of its own.

## Found while applying

Found on 2026-11-24 and 2026-11-25 while applying `redesign-site`. A figure of the site as built
comes from one of the scripts above ("Output", "Found while applying") or from the browser tests,
which print a line `frames: <number>, longest <ms>; …` before the line of each budget test
(`pnpm run test:e2e`). A figure of a state before a fix names the commit the script ran against,
or says "at the time": it was then measured with a probe that was not kept, and cannot be
measured again without building that state. The frames are those of the cloud sandbox the
change was built in; CI's runner measured about 0.6 times them (a drag of one limit: longest
4.9 ms in its log of `main`, 9 to 11.5 here).

### The pages as built

`look.cjs` on the built site, against section 1 and the mockups of section 6:

| Page, in a window 1,280 by 800 | Before | Mockup | Built |
|---|---|---|---|
| The start page | 6,205 | 10,104 | 10,304 |
| A vote | 2,908 | 2,343 | 2,542 |
| A vote with two limits set | 3,216 | 2,432 | 2,587 |
| The comparison with a selection | 1,030 | 1,027 | 902 |
| The guide | 1,993 | 2,410 | 2,393 |

In a window 360 wide the built pages are 17,221, 3,575, 4,311, 2,392 and 3,736 pixels long. With
two limits set the map of a vote's page begins 429 pixels down in the wide window, where it began
1,225 down, and the first slider 596 down, beside it; on the phone the map begins 859 down, where
it began 2,101 down.

### The part that stays in the window

- **Its lines of text scroll away.** With the map's source line and the sentence on the Swiss
  abroad, the column that stays was 856 to 938 pixels tall in a window 800 high, at the time.
  They now stand below it and scroll with the page (`MapNotes.svelte`).
- **The map leaves the result its room.** A result takes more room in a narrower column: in a
  window 1,024 by 768 the part that stays was 799 pixels tall, at the time. The map's height is the window's
  less 17rem, less 21.5rem where its column is narrower than 768 pixels and less 26.5rem where it
  is narrower than 640. `stays.cjs`: with a selection, the part ends within the window in each of
  216 windows, 1,024 to 1,920 pixels wide and 700 to 1,080 high, in three languages.
- **The map keeps its shape** where its height is capped, and stands in the middle of its column:
  dragging and pinching count in pixels of a box of the view's shape.

### The frame in which a selection first applies

One full run of the checks failed "the budget of dragging with five limits and a municipality
clicked": 16.7 ms, and 16.3 ms measured once more. Alone
(`pnpm --filter app exec playwright test e2e/limits.spec.ts -g "five limits"`) it took 9.4 to
13.3 ms in five runs. The long frame was the drag's first or second step.

That step is the one with which the selection first applies. `first_step.cjs` against the site
built from `bde58e9`, before the fix: in a window 1,280 by 800 the results grew from 132 to 164
pixels, as the place of the selection's result was 50 pixels tall and the result that took it
83; the map moved from 168 to 200; and the browser, which keeps a page where it is by a part
below what grew, scrolled it from 563 to 596, so that the slider being moved went from 641 to
608 under the pointer. In a window 1,024 by 768 the legend grew by a line too, 54 to 71 pixels,
as its entry for the set-aside municipalities joined the two beside the scale; the page scrolled
from 855 to 947 and the slider went from 372 to 280. The frame held a layout of the column and a
repaint of the whole map.

Since `b208c71` and `83f2c3e`, where the limits stand beside the map:

- the vote's result and the place are rows of one height, so the place is as tall as a result,
  83 pixels at 1,280 and 149 at 1,024, where a result takes two rows;
- the legend's entries beside the scale keep the room of three lines in a column narrower than
  768 pixels;
- the map's column has `overflow-anchor: none`, so the browser keeps the page by a part of the
  limits, as the comparison's column of votes has.

`first_step.cjs` then: nothing moves in a window 1,280 by 800, 1,024 by 768 or 1,100 by 720, and
`stays.cjs` still finds every window fitting.

### The frames in the new layout

The longest frame of each budget test in three full runs of the browser tests: on `bde58e9`
before that fix, on `b208c71` with it, and on `83f2c3e`.

| Budget test | Budget | Before the fix | With it | With the legend's |
|---|---|---|---|---|
| A drag of one limit | 16 ms | 12.4 | 9.1 | 14.4 |
| A drag with five limits and Köniz clicked | 16 ms | 16.7, then 16.3 | 13.3 | 15.7 |
| Jumps of the selection | 50 ms | 17.2 | 22.8 | 17.4 |
| Zooming, moving and pointing on the map | 16 ms | 8.5 | 8.2 | 13.9 |
| Clicking a municipality | 16 ms | 6.3 | 5.7 | 7.9 |
| Fingers: the moves and the taps | 16 ms | 8.5 | 8.6 | 9.7 |
| A link with 21 limits in the same tab | 100 ms | 66.4 | 69.1 | 95.2 |
| A link with all 35 limits | 170 ms | 95.4 | 70.3 | 104.9 |
| The comparison: a drag with two votes | 16 ms | 6.1 | 8.2 | 8.3 |
| The comparison: jumps with two votes | 50 ms | 22.5 | 14.1 | 15.4 |
| The start page: keys and presses | 50 ms | 15.8 | 10.9 | 15.9 |

In the two later runs a drag's steps took 4.4 to 6.3 ms at the median and 6.5 to 9.9 ms at the
ninth decile. The longest are the first step, 9 to 13 ms, and steps near the low end of the
logarithmic track of "Einwohner", where many municipalities change at once. On this machine the
drag with five limits keeps little of its budget; the test measures once more when a frame
exceeds it.

- **A key in the frame of a pointing.** After the wheel over the map scrolled the page, the
  map's budget test pressed Ctrl in the frame of its first pointing, and that frame took 13.7 to
  17.6 ms where it took 4.5 to 6.5 without the key; a key pressed at rest cost 0.1 to 0.5 ms (at
  the time, three runs each). The test now waits 50 ms before the key, as a person would: its
  first pointing took 4.3 to 6.1 ms in five runs.
- **A finger's touchdown** is still not measured: its frame took 36 to 38 ms in each run
  (`investigations/small-screens.md`, 8).

### The start page

`start_page.cjs`:

- **A row's columns.** The widest share is 67.9 pixels in German, 93.5 in French ("49.16% de
  oui") and 78.8 in Italian; the widest result with its marks 156.8, 120.1 and 137.1. Their
  columns are 6.5rem and 10.5rem.
- **A row takes two lines below 1,024 pixels.** With the mockup's breakpoint of 640 the title's
  column was at most 16 pixels wide in a window of 700 and the page 31,179 pixels long in German,
  at the time; it is 636 pixels wide and the page 14,301 long now. The year and the vote day
  stand above their rows below 768.
- **The part that stays at the top** is 97 pixels tall from 640 pixels, 145 at 360, 153 on a
  phone 412 wide and 101 on one held wide. With rooms written into the stylesheet, the German
  buttons took a line of their own at 640 and the part covered 9 pixels of a year's heading, at
  the time. The field now gives way first, and the page measures the part: the room a year keeps
  equals its height in each of the 30 windows, and a year's heading stands 32 pixels below it.
- **The budget of the list.** The longest frame is the one after the field is emptied, which
  writes the 125 rows again: 10.9 to 15.9 ms. A key took 1.2 to 8.3 ms.
- **The French heading** holds a word joiner after the hyphen of "aurait-elle", which the
  balanced lines parted.

### The specs

- Three specs still named the start page's old heading or the list's result in one text:
  `app-shell`, `publishing` and two scenarios of `interface-languages`. The change gained their
  deltas.
- The first deltas said every link below the head is underlined. The head's entries and a row's
  title on the start page carry a line only while pointed at, as the mockups drew them.

### The comparison and the tests

- **A choice before the scripts run is lost.** The built comparison shows its two lists before
  its scripts run. A vote chosen then is dropped when they do, and the list shows no choice
  again. A browser test chose that early once in a full run, and failed with the scripts
  delayed by 300 ms (a test run once and removed); it now waits until the page has asked for the
  characteristics, and passed with the same delay. The
  behaviour is that of `add-vote-comparison`, and the redesign did not change it.
- **A tap beside a border.** In a window 360 pixels wide a tap 0 or 2 pixels inside Zürich
  reached Schlieren or Urdorf, and one 3 to 5 pixels inside reached Zürich, at the time: Chrome
  moves a tap to a neighbour (`investigations/small-screens.md`, 8). The test takes a point 4
  pixels inside.
- **A link over its row.** A row's title on the start page is a link that reaches over the row.
  Playwright does not click a part another element lies over, so the test of the whole row
  clicks the row at the share's place.

### Found by the verification

`/openspec-verify-change` on 2026-11-25, by four readers of the specs, the code and the tests,
none of whom had written them:

- **A single half canton filled half its bar.** A segment's width is its cantonal votes as a
  share of the flex line, and weights that add up to less than 1 fill only that part of the
  line: a bar of 400 pixels drew one half canton 200 wide, one whole canton 400. The weights are
  now 2 and 1. The browser test keeps Basel alone, the one municipality with 150,000 to 180,000
  inhabitants at the end of 2015.
- **Three paragraphs were exempt from the page's 40rem:** the selection's place, 1,104 pixels in
  a window 1,920 wide, the note under the cantons and the comparison's notes. The place is now a
  box around a paragraph.
- **A requirement of 503 characters.** OpenSpec's validation warns above 500, for an added
  requirement in a change and for every requirement of a spec, not for a modified one in a
  change: the change validated, and the merged spec would not have, which a trial of the archive
  in a copy of `openspec/` showed.
- **A slider's thumb tells no script its size.** `getComputedStyle(slider,
  '::-webkit-slider-thumb')` gave 380 by 44 pixels on the tests' phone, the slider's own box. The
  thumb's 44 pixels are tested by a press 20 pixels beside its centre.
- **A step by key** took at most 13.1 ms of the 16 allowed, in the new budget test of thirty
  steps (`pnpm --filter app exec playwright test e2e/limits.spec.ts -g "step by key"`).

## Not verified

Of the five points below, applying the change settled four: the browser tests open the built
pages in French and Italian, measure the frames of the real drawings ("Found while applying"),
move, zoom and tap the map below the result that stays, and use the list of "Merkmal hinzufügen"
by keys and by fingers. A real phone remains, and a pinch on a trackpad in Safari, which reports
it differently from Chrome.

- The new look in French and Italian: only German was mocked up. The longest names ("Maggioranza
  dei Cantoni", the French and Italian names of the characteristics) may wrap where the German
  ones do not.
- The frames of a drag with the real drawings, in the layout of the mockups: section 4 measures
  them added to today's page.
- A column that stays in the window while another scrolls, with the map's zoom, move and the
  fingers of a phone; and the tests' way of pointing at a municipality under it.
- The list of "Merkmal hinzufügen" as a control: its keys, its focus, and what a phone shows.
- The mockups on a real phone.

## Output

`node investigations/redesign/look.cjs`:

```
1280 x 800 start: 1280 x 6205
1280 x 800 vote: 1280 x 2908 | tops: result 236, limits 596, first slider null, map 941, cantons 1706
1280 x 800 vote-selection: 1280 x 3216 | tops: result 236, limits 642, first slider 846, map 1225, cantons 1990
1280 x 800 compare: 1280 x 1030
1280 x 800 guide: 1280 x 1993
360 x 740 start: 360 x 14897
360 x 740 vote: 360 x 3510 | tops: result 344, limits 751, first slider null, map 1367, cantons 2069
360 x 740 vote-selection: 360 x 4425 | tops: result 344, limits 1153, first slider 1531, map 2101, cantons 2831
360 x 740 compare: 360 x 2158
360 x 740 guide: 360 x 3089
```

`node investigations/redesign/drag_with_drawings.cjs --runs 10`, then with `--limits 5`, then with
`--limits 5 --phone`:

```
today, 1 limit(s): 10 runs of 40 input frames; longest frame of a run 7.0 ms on average, from 5.2 to 9.2; median frame 3.5 ms; runs with a frame over 16 ms: 0
with the drawings (165 elements), 1 limit(s): 10 runs of 40 input frames; longest frame of a run 8.4 ms on average, from 5.8 to 11.9; median frame 3.9 ms; runs with a frame over 16 ms: 0
today, 5 limit(s): 10 runs of 40 input frames; longest frame of a run 7.6 ms on average, from 5.3 to 12.7; median frame 3.6 ms; runs with a frame over 16 ms: 0
with the drawings (369 elements), 5 limit(s): 10 runs of 40 input frames; longest frame of a run 8.5 ms on average, from 6.7 to 11.0; median frame 4.3 ms; runs with a frame over 16 ms: 0
today, 5 limit(s), phone: 10 runs of 40 input frames; longest frame of a run 6.8 ms on average, from 5.0 to 10.0; median frame 3.9 ms; runs with a frame over 16 ms: 0
with the drawings (369 elements), 5 limit(s), phone: 10 runs of 40 input frames; longest frame of a run 8.6 ms on average, from 6.3 to 11.6; median frame 4.7 ms; runs with a frame over 16 ms: 0
```

`python3 investigations/redesign/colours.py`:

```
The light scheme:
  Text, at least 4.5:1:
    text            #1c1c1c  on the ground 17.04:1  on the surface 15.49:1
    secondary       #595959  on the ground  7.00:1  on the surface  6.37:1
    greyed          #767676  on the ground  4.54:1  on the surface  4.13:1
    greyed, darker  #6e6e6e  on the ground  5.10:1  on the surface  4.64:1
    yes word        #007260  on the ground  5.87:1  on the surface  5.34:1
    no word         #934319  on the ground  6.87:1  on the surface  6.24:1
  Links, controls and the ring of focus in the text's colour, at least 3:1:
    text            #1c1c1c  on the ground 17.04:1
  Parts of a drawing, at least 3:1 on the ground:
    yes bar         #009c86   3.44:1
    no bar          #c2673b   3.96:1
    control border  #767676   4.54:1
    bins outside    #8c8c8c   3.36:1
    empty track     #e4e4e4   1.27:1
    hairline        #dedede   1.35:1
  Told apart:
    bins inside and outside:  5.07:1
    the two sides of a bar: distance  22.4, red-green deficiency  10.4; contrast 1.15:1
    the surface and the ground: distance  3.3
    the set-aside grey #2c2c2c and the surface: distance 67.4
The dark scheme:
  Text, at least 4.5:1:
    text            #e8e8e8  on the ground 15.29:1  on the surface 13.91:1
    secondary       #b0b0b0  on the ground  8.64:1  on the surface  7.86:1
    greyed          #9a9a9a  on the ground  6.66:1  on the surface  6.06:1
    greyed, darker  #9a9a9a  on the ground  6.66:1  on the surface  6.06:1
    yes word        #4bc1ad  on the ground  8.50:1  on the surface  7.73:1
    no word         #e5946f  on the ground  7.85:1  on the surface  7.14:1
  Links, controls and the ring of focus in the text's colour, at least 3:1:
    text            #e8e8e8  on the ground 15.29:1
  Parts of a drawing, at least 3:1 on the ground:
    yes bar         #4bc1ad   8.50:1
    no bar          #e5946f   7.85:1
    control border  #9a9a9a   6.66:1
    bins outside    #6e6e6e   3.67:1
    empty track     #303030   1.42:1
    hairline        #333333   1.48:1
  Told apart:
    bins inside and outside:  4.16:1
    the two sides of a bar: distance  20.3, red-green deficiency   9.4; contrast 1.08:1
    the surface and the ground: distance  4.4
    the set-aside grey #2c2c2c and the surface: distance  6.7
```

`node investigations/redesign/mockups/extract.cjs /new/path/outside/the/repository`:

```
5960: Ja-Stimmen 1'609'152, Nein-Stimmen 1'664'224, Ja-Anteil 49.16%, Stimmbeteiligung 63.25%; Abgelehnt
5960 with foreigners=-19.98&inhabitants=3000-: Ja-Stimmen 406'681, Nein-Stimmen 392'725, Ja-Anteil 50.87%; Angenommen
  set aside: 1824 of 2110
  clicked: Köniz (BE) Ja-Anteil: 39.45%Ja-Stimmen: 7'160Nein-Stimmen: 10'989
5970 with the same: Ja-Stimmen 352'754, Nein-Stimmen 461'583, Ja-Anteil 43.32%; Abgelehnt
6790 without the Swiss abroad: Ja-Stimmen 1'362'481, Nein-Stimmen 1'350'889, Ja-Anteil 50.21%; Angenommen
start page: 125 entries in 14 years
```

`node investigations/redesign/mockups/hist.mjs "$PWD" /new/path/outside/the/repository`:

```
foreigners {"name":"Ausländeranteil","date":"Ende 2015","scale":"linear","smallest":"0.00%","largest":"61.10%","lower":0,"upper":327,"lowerText":"0.00%","upperText":"19.98%","ticks":["0.00%","15.28%","30.55%","45.83%","61.10%"],"bins":"10 31 53 75 77 113 121 117 140 106 112 114 112 93 80 84 67 65 53 57 59 54 47 51 25 33 25 17 15 17 16 10 12 11 5 6 8 4 3 4 0 0 4 0 2 1 0 0 0 1"}
inhabitants {"name":"Einwohner","date":"Ende 2015","scale":"logarithmic","smallest":"31","largest":"396'955","lower":483,"upper":1000,"lowerText":"2'987","upperText":"396'955","ticks":["31","330","3'508","37'316","396'955"],"bins":"2 3 5 4 1 9 7 15 18 30 29 36 53 66 77 91 95 123 127 132 146 109 122 122 107 101 108 72 69 45 45 39 24 28 15 10 4 8 3 1 1 2 0 1 2 1 1 0 0 1"}
```

`node investigations/redesign/mockups/shots.cjs /new/path/outside/the/repository`:

```
1920 x 1080: head 160 0 1600 56 | result 192 213 1104 164 | map 192 397 1104 698 | limits 1344 213 384 832 | panel 192 1280 1088 845 | cantons 1328 1280 400 1027 | result and map sticky | page 1920 x 2601
1600 x 900: head 0 0 1600 56 | result 32 213 1104 164 | map 32 397 1104 628 | limits 1184 213 384 832 | panel 32 1210 1088 845 | cantons 1168 1210 400 1027 | result and map sticky | page 1600 x 2531
1280 x 800: head 0 0 1280 56 | result 32 213 784 164 | map 32 397 784 496 | limits 864 213 384 832 | panel 32 1111 768 971 | cantons 848 1111 400 1027 | result and map sticky | page 1280 x 2432
1024 x 768: head 0 0 1024 56 | result 32 211 605 297 | map 32 528 605 382 | limits 685 211 307 902 | panel 32 1177 512 1550 | cantons 592 1177 400 1027 | result and map sticky | page 1024 x 3021
1023 x 768: head 0 0 1023 56 | result 32 211 959 164 | map 32 395 959 606 | limits 32 1162 959 662 | panel 32 1888 511 1550 | cantons 591 1888 400 1027 | result and map static | page 1023 x 3732
640 x 800: head 0 0 640 92 | result 32 271 576 297 | map 32 588 576 364 | limits 32 1166 576 707 | panel 32 1921 576 1257 | cantons 32 3226 576 1006 | result and map static | page 640 x 4548
480 x 800: head 0 0 480 88 | result 16 287 448 468 | map 0 829 480 304 | limits 16 1391 448 761 | panel 16 2200 448 1595 | cantons 16 3843 448 1105 | result and map static | page 480 x 5324
360 x 740: head 0 0 360 88 | result 16 316 328 468 | map 0 858 360 228 | limits 16 1363 328 832 | panel 16 2243 328 1799 | cantons 16 4091 328 1105 | result and map static | page 360 x 5594
vote-b: 1280 x 2432 in a window 1,280 wide, 360 x 5602 in one 360 wide
vote-b-real: 1280 x 2343 in a window 1,280 wide, 360 x 4854 in one 360 wide
start: 1280 x 10104 in a window 1,280 wide, 360 x 17232 in one 360 wide
compare: 1280 x 1027 in a window 1,280 wide, 360 x 2620 in one 360 wide
guide: 1280 x 2410 in a window 1,280 wide, 360 x 3769 in one 360 wide
parts: 1280 x 2355 in a window 1,280 wide, 360 x 3824 in one 360 wide
```

### Found while applying

`node investigations/redesign/look.cjs`, against the site built from `2427471`:

```
1280 x 800 start: 1280 x 10304
1280 x 800 vote: 1280 x 2542 | tops: result 244, limits 244, first slider null, map 429, cantons 1234
1280 x 800 vote-selection: 1280 x 2587 | tops: result 244, limits 244, first slider 596, map 429, cantons 1234
1280 x 800 compare: 1280 x 902
1280 x 800 guide: 1280 x 2393
360 x 740 start: 360 x 17221
360 x 740 vote: 360 x 3575 | tops: result 356, limits 1308, first slider null, map 750, cantons 2005
360 x 740 vote-selection: 360 x 4311 | tops: result 356, limits 1443, first slider 1795, map 859, cantons 2565
360 x 740 compare: 360 x 2392
360 x 740 guide: 360 x 3736
```

`node investigations/redesign/first_step.cjs`, then with `1024 768`, against the site built from
`bde58e9`, before the fix:

```
1280 x 800
before {"scroll":563,"results":"16+132","place":"98+50","selection":null,"map":"168+496","legend":"675+54","stays":"0+729","last slider":"641+24"}
after  {"scroll":596,"results":"16+164","place":null,"selection":"98+83","map":"200+496","legend":"708+54","stays":"0+762","last slider":"608+24"}
1024 x 768
before {"scroll":855,"results":"16+222","place":"164+74","selection":null,"map":"258+344","legend":"614+54","stays":"0+668","last slider":"372+24"}
after  {"scroll":947,"results":"-131+297","place":null,"selection":"17+149","map":"186+344","legend":"542+71","stays":"-147+760","last slider":"280+24"}
```

The same, then with `1100 720`, against the site built from `83f2c3e`:

```
1280 x 800
before {"scroll":563,"results":"16+165","place":"99+83","selection":null,"map":"201+496","legend":"709+54","stays":"0+763","last slider":"641+24"}
after  {"scroll":563,"results":"16+165","place":null,"selection":"99+83","map":"201+496","legend":"709+54","stays":"0+763","last slider":"641+24"}
1024 x 768
before {"scroll":855,"results":"-40+298","place":"109+149","selection":null,"map":"278+344","legend":"634+71","stays":"-56+761","last slider":"372+24"}
after  {"scroll":855,"results":"-40+298","place":null,"selection":"109+149","map":"278+344","legend":"634+71","stays":"-56+761","last slider":"372+24"}
1100 x 720
before {"scroll":879,"results":"13+165","place":"95+83","selection":null,"map":"198+376","legend":"586+71","stays":"-3+660","last slider":"348+24"}
after  {"scroll":879,"results":"13+165","place":null,"selection":"95+83","map":"198+376","legend":"586+71","stays":"-3+660","last slider":"348+24"}
```

`node investigations/redesign/stays.cjs`, against the same site:

```
de: pixels over the window's height (0 when it fits); a row per width, a column per height 700, 720, 768, 800, 900, 1080
  1024:   0   0   0   0   0   0
  1050:   0   0   0   0   0   0
  1074:   0   0   0   0   0   0
  1076:   0   0   0   0   0   0
  1100:   0   0   0   0   0   0
  1150:   0   0   0   0   0   0
  1200:   0   0   0   0   0   0
  1280:   0   0   0   0   0   0
  1366:   0   0   0   0   0   0
  1440:   0   0   0   0   0   0
  1600:   0   0   0   0   0   0
  1920:   0   0   0   0   0   0
fr: pixels over the window's height (0 when it fits); a row per width, a column per height 700, 720, 768, 800, 900, 1080
  1024:   0   0   0   0   0   0
  1050:   0   0   0   0   0   0
  1074:   0   0   0   0   0   0
  1076:   0   0   0   0   0   0
  1100:   0   0   0   0   0   0
  1150:   0   0   0   0   0   0
  1200:   0   0   0   0   0   0
  1280:   0   0   0   0   0   0
  1366:   0   0   0   0   0   0
  1440:   0   0   0   0   0   0
  1600:   0   0   0   0   0   0
  1920:   0   0   0   0   0   0
it: pixels over the window's height (0 when it fits); a row per width, a column per height 700, 720, 768, 800, 900, 1080
  1024:   0   0   0   0   0   0
  1050:   0   0   0   0   0   0
  1074:   0   0   0   0   0   0
  1076:   0   0   0   0   0   0
  1100:   0   0   0   0   0   0
  1150:   0   0   0   0   0   0
  1200:   0   0   0   0   0   0
  1280:   0   0   0   0   0   0
  1366:   0   0   0   0   0   0
  1440:   0   0   0   0   0   0
  1600:   0   0   0   0   0   0
  1920:   0   0   0   0   0   0
```

`node investigations/redesign/start_page.cjs`, against the site built from `2427471`:

```
1920 x 1080 de: {"page":"1920 x 10304","narrowest title":492,"widest share":67.9,"widest result":156.8,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
1920 x 1080 fr: {"page":"1920 x 10449","narrowest title":492,"widest share":93.5,"widest result":120.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
1920 x 1080 it: {"page":"1920 x 10532","narrowest title":492,"widest share":78.8,"widest result":137.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
1280 x 800 de: {"page":"1280 x 10304","narrowest title":492,"widest share":67.9,"widest result":156.8,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
1280 x 800 fr: {"page":"1280 x 10449","narrowest title":492,"widest share":93.5,"widest result":120.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
1280 x 800 it: {"page":"1280 x 10532","narrowest title":492,"widest share":78.8,"widest result":137.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
1024 x 768 de: {"page":"1024 x 12839","narrowest title":300,"widest share":67.9,"widest result":156.8,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
1024 x 768 fr: {"page":"1024 x 13026","narrowest title":300,"widest share":93.5,"widest result":120.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
1024 x 768 it: {"page":"1024 x 12964","narrowest title":300,"widest share":78.8,"widest result":137.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
1023 x 768 de: {"page":"1023 x 12012","narrowest title":719,"widest share":67.9,"widest result":156.8,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
1023 x 768 fr: {"page":"1023 x 12158","narrowest title":719,"widest share":93.5,"widest result":120.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
1023 x 768 it: {"page":"1023 x 12220","narrowest title":719,"widest share":78.8,"widest result":137.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
768 x 800 de: {"page":"768 x 13400","narrowest title":464,"widest share":67.9,"widest result":156.8,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
768 x 800 fr: {"page":"768 x 13650","narrowest title":464,"widest share":93.5,"widest result":120.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
768 x 800 it: {"page":"768 x 13712","narrowest title":464,"widest share":78.8,"widest result":137.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
700 x 800 de: {"page":"700 x 14301","narrowest title":636,"widest share":67.9,"widest result":156.8,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
700 x 800 fr: {"page":"700 x 14525","narrowest title":636,"widest share":93.5,"widest result":120.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
700 x 800 it: {"page":"700 x 14483","narrowest title":636,"widest share":78.8,"widest result":137.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
640 x 800 de: {"page":"640 x 14622","narrowest title":576,"widest share":67.9,"widest result":156.8,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
640 x 800 fr: {"page":"640 x 14747","narrowest title":576,"widest share":93.5,"widest result":120.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
640 x 800 it: {"page":"640 x 14768","narrowest title":576,"widest share":78.8,"widest result":137.1,"past their box":0,"stays":97,"room":97,"year at":97,"heading at":129}
360 x 740 de: {"page":"360 x 17213","narrowest title":328,"widest share":67.9,"widest result":156.8,"past their box":0,"stays":145,"room":145,"year at":145,"heading at":177}
360 x 740 fr: {"page":"360 x 17588","narrowest title":328,"widest share":93.5,"widest result":120.1,"past their box":0,"stays":145,"room":145,"year at":145,"heading at":177}
360 x 740 it: {"page":"360 x 17346","narrowest title":328,"widest share":78.8,"widest result":137.1,"past their box":0,"stays":145,"room":145,"year at":145,"heading at":177}
a phone de: {"page":"412 x 16266","narrowest title":380,"widest share":67.9,"widest result":156.8,"past their box":0,"stays":153,"room":153,"year at":153,"heading at":185}
a phone fr: {"page":"412 x 16620","narrowest title":380,"widest share":93.5,"widest result":120.1,"past their box":0,"stays":153,"room":153,"year at":153,"heading at":185}
a phone it: {"page":"412 x 16536","narrowest title":380,"widest share":78.8,"widest result":137.1,"past their box":0,"stays":153,"room":153,"year at":153,"heading at":185}
a phone held wide de: {"page":"863 x 12832","narrowest title":559,"widest share":67.9,"widest result":156.8,"past their box":0,"stays":101,"room":101,"year at":101,"heading at":133}
a phone held wide fr: {"page":"863 x 12957","narrowest title":559,"widest share":93.5,"widest result":120.1,"past their box":0,"stays":101,"room":101,"year at":101,"heading at":133}
a phone held wide it: {"page":"863 x 12936","narrowest title":559,"widest share":78.8,"widest result":137.1,"past their box":0,"stays":101,"room":101,"year at":101,"heading at":133}
```
