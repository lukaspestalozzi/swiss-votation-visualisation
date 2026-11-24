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

It decides nothing: the design of `redesign-site` records the decisions.

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
outside the repository.

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

"Output" at the end of this file is what the scripts printed on 2026-11-24.

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

## Not verified

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
