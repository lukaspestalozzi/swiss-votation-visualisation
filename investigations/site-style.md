# Site style

Found while proposing `add-site-style` (#10a of `docs/roadmap.md`), on 2026-11-19, against the
site built from `b730551` (the archive of `add-small-screens`). It answers what #10a needs to
decide the look of the site:
- what the pages look like today;
- what a font served with the site weighs, and how it sets the site's text;
- the contrast of the colours a page could take, on a light and on a dark ground;
- how far a dark ground lies from the map's colours, the set-aside grey among them;
- how large the map is for a given width of the page;
- where the pages name the start page, the guide and a verdict.

It decides nothing: the design of `add-site-style` records the decisions.

Words used here: the **contrast** of two colours is WCAG 2.2's ratio of their relative luminances
(1.4.3: 4.5:1 for text, 3:1 for large text; 1.4.11: 3:1 for the parts of a control and of a
graphic); the **distance** of two colours is the Delta E of `investigations/map-data.md` (OKLab
times 100; 8 tells two colours apart); a **pixel** is a CSS pixel.

## How to reproduce

The scripts are in `investigations/site-style/`. `look.cjs` uses the global Playwright against
the built site, served as the browser tests serve it; `fonts.sh` packs five npm packages into a
directory outside the repository and runs `fonts.py` on them with fontTools, which `uv` fetches;
`colours.py` uses the standard library only. Found while applying, `drag.cjs` and `lake_tap.mjs`
use the global Playwright against the built site; `lake_tap.mjs` imports the browser tests'
`app/e2e/pointing.ts`, which Node 24 runs with its types stripped.

```sh
pnpm run build
(cd app && pnpm exec sirv build --port 4174) &
node investigations/site-style/look.cjs
investigations/site-style/fonts.sh /new/path/outside/the/repository
python3 investigations/site-style/colours.py
# Found while applying:
node investigations/site-style/drag.cjs [--scrolled]
node investigations/site-style/lake_tap.mjs "$PWD" nearest|overlap <zooms> <margin>
```

| File | What |
|------|------|
| `look.cjs` | The start page, the guide and the page of the vote of 2016-02-28 in windows 360, 1280 and 1920 pixels wide: the font asked for and the one rendered, the text's size and line height, the colours of the text, the ground and the links, the body's margin, the map's size and the page's height. |
| `fonts.sh` | Packs `@fontsource-variable/source-sans-3` 5.3.1, `@fontsource/atkinson-hyperlegible` 5.3.0, `@fontsource-variable/noto-sans` 5.3.0, `@fontsource/ibm-plex-sans` 5.3.0 and `@fontsource-variable/inter` 5.3.0 into a new directory and unpacks them there; then runs `fonts.py`. |
| `fonts.py` | For each package, its Latin files of the upright style: their size, whether the ten digits have one width, the feature `tnum`, the average width of the lowercase letters, the characters of the three languages it lacks. Then every character of the data files and of the texts of the screen outside the Latin face of Source Sans 3. |
| `colours.py` | The contrast of the colours of a light and of a dark palette on their grounds, and of the colours considered and not taken; the distance of the set-aside grey from dark grounds, and of each dark ground from the map's colours, measured as `map-data/check_colours.py` measures, whose functions it loads. |
| `drag.cjs` | Found while applying: the steps of the browser test "recalculated while dragging" in a window 1,280 × 720, with the upper slider's value and place, the scroll, the heights of the vote's result and of "Mit Ihrer Auswahl", and whether the fonts have loaded; with `--scrolled`, the slider scrolled into view first. |
| `lake_tap.mjs` | Found while applying: the browser test "tapping a lake" on a phone, with the lake whose centre lies nearest Zürich's or whose box overlaps Zürich's, after a number of zoom steps and with a margin from the shore: the map's and the lake's size, the point, the shape there, the details the tap shows. |

"Output" at the end of this file is what the scripts printed on 2026-11-19, those found while
applying against the site built from `f30e07c` (the merge of `add-site-style`).

## Answers

### 1. The look of today

Every page is in the browser's defaults: the font asked for is "Times New Roman", which this
machine renders as Liberation Serif, a phone as its own serif; 16 pixels, line height `normal`;
black text on the browser's white ground (the page sets no ground); links in the browser's
`#0000ee`; a margin of 8 pixels around the body, and no limit on the width (Output, `look.cjs`).
What each screen styles for itself: the verdict boxes (a 1-pixel border), the grey of a majority
that is not needed (`#767676`), the limits' track (`#999999`) and thumbs (`#333333`, a white ring,
a `#1a5fb4` focus ring), the map's colours, the white of the bar of #10, and the browser's own
look for buttons, the list and the switch.

The map grows with the window: 344 × 218 pixels at 360, 928 × 587 at 1280, 1568 × 992 at 1920,
where it is taller than a window 800 pixels high. The start page is 11,083 pixels long at 360 and
5,143 at 1280.

### 2. A font served with the site

Five fonts published under the SIL Open Font License by Fontsource, each as the files of the
Latin subset that the three languages need (Output, `fonts.sh`):

| Font | Bytes | Digits of one width | `tnum` | Lowercase width (em) |
|------|-------|---------------------|--------|----------------------|
| Source Sans 3, variable | 28,872 | yes | no | 0.448 |
| Atkinson Hyperlegible, 400 and 700 | 34,732 | no | yes | 0.483 |
| Noto Sans, variable | 35,820 | yes | yes | 0.530 |
| IBM Plex Sans, 400 and 700 | 45,420 | yes | no | 0.505 |
| Inter, variable | 48,256 | no | yes | 0.536 |

A variable file holds every weight; the others need a file per weight. "Digits of one width" means
that the default figures line up in columns without `font-variant-numeric`. The lowercase width
is the average advance of a to z: the smaller, the fewer words break at 360 pixels. Each font has
every letter of German, French and Italian the site writes, with « », ’, –, ½ and −.

The Latin face of Source Sans 3 covers 19 ranges of Unicode (its `unicode-range` in the package's
`wght.css`). No character of the 133 files of text the site shows, the data files and the texts of
the screen, lies outside it: a page requests that one file and none of the other six subsets.

For comparison, a vote's page loads 16.6 KB of HTML, 160 KB of `map.json`, 17 KB of
`municipalities.json` and 571 KB of `characteristics.json`, each gzipped (measured with
`gzip -c | wc -c` on the build); a `woff2` file is compressed already.

### 3. The contrast of the colours

On white (`#ffffff`), the light palette (Output, `colours.py`): text `#1c1c1c` 17.04:1, secondary
text `#595959` 7.00:1, links and focus rings `#1a5fb4` 6.29:1, the grey of a majority that is not
needed `#767676` 4.54:1, the map's darkest yes `#007260` 5.87:1 and darkest no `#934319` 6.87:1.
Every one passes 4.5:1. The map's class 3, `#009c86` 3.44:1 and `#c2673b` 3.96:1, would not.

On `#121212`, the dark palette: text `#e8e8e8` 15.29:1, secondary text `#b0b0b0` 8.64:1, links
and focus rings `#8ab4f8` 8.89:1, grey `#9a9a9a` 6.66:1, the map's class 2 of yes `#4bc1ad`
8.50:1 and of no `#e5946f` 7.85:1. The darkest classes fail on a dark ground: on `#1c1c1c`,
`#007260` 2.90:1 and `#934319` 2.48:1.

An off-white ground lowers the grey below the threshold: `#767676` on `#f5f5f2` is 4.16:1.

The hatching of a municipality without a result, `#999999` lines on white, has 2.85:1, below
1.4.11's 3:1; its legend names it. On `#121212` the same lines have 6.58:1.

Not taken, on white: the red of the flag `#d52b1e` 5.01:1 and a deeper red `#c8102e` 5.88:1, which
pass, but read as "no" beside the map's no colours.

### 4. A dark ground and the map

The set-aside grey `#2c2c2c` must stay: every lighter grey lies within 4.0 of a yes colour for a
viewer with a red-green colour vision deficiency (`investigations/limits.md`, 6). Its distance
from a dark ground, the same with and without the deficiency, as both are greys: 29.3 from
`#000000`, 13.4 from `#0d0d0d`, 11.1 from `#121212`, 9.3 from `#161616`, 6.7 from `#1c1c1c` and
5.0 from `#202020` (Output). From `#121212` up to `#161616` it stays above 8, the distance that
tells two colours apart.

The map's other colours stay far from a dark ground: the closest to `#121212` is no, class 4,
32.1 apart, 25.7 with the deficiency.

Today the borders between municipalities are white lines of 0.5 pixels and the ground under the
hatching is white, the page's ground; the cantons' borders are `#333333`, the municipality last
clicked is outlined black on a white halo. None of these colours is in `result-map`'s spec except
"diagonal lines on white" for the hatching.

### 5. The width of the page and the map

The map keeps the proportion of `map.json`'s box, 348,832 × 220,581 metres, 1.581. From 960
pixels the panel stands beside it, 20rem with a gap of 1rem, 336 pixels. With 16 pixels at each
side of the page and no limit on its width, the map is 912 × 577 pixels at 1280 and 1552 × 982 at
1920; with a column of at most 72rem (1152 pixels), 816 × 516 from 1184 pixels up; of 64rem,
688 × 435; of 80rem, 944 × 597. At 360 the map has 328 pixels, 207 high (computed from the
proportion, not measured).

### 6. The start page, the guide and the verdicts on the pages

- The top of every page under `/de/`, `/fr/` and `/it/` is the language switch, a `nav` of the
  layout. The working title "Popular Vote Explorer" is the start page's heading and its `title`;
  the other pages do not show it.
- The start page links to the guide below its heading, "Lesehilfe und Quellen"; the sentence at
  the limits links to it too. The guide is headed "Lesehilfe", "Guide de lecture", "Guida alla
  lettura".
- A vote's page and the guide link to the start page with "Alle Abstimmungen" at their top.
- A verdict is written on a vote's page in the two boxes ("Ja", "Nein"), in the outcome
  ("Angenommen", "Abgelehnt"), both for the vote and under "Mit Ihrer Auswahl", in the column of
  the table of the cantons ("Ja", "Nein"), and in the bar of #10; on the start page in each entry's
  result ("angenommen", "abgelehnt").

### 7. Found while applying

- **The pages at 360 pixels.** With Source Sans 3, the head and 16 pixels at each side, every page
  still fits: `investigations/small-screens/widths.cjs 360` gives "0 of 381 pages wider than
  360 px".
- **The font and the budget tests.** The budget tests now wait for `document.fonts.ready` before
  their first input (`app/e2e/frames.ts`, `fontsLoaded`), so the font's arrival is no frame they
  measure.
- **A tap on "a lake" on a phone.** With 16 pixels at each side the map on a Pixel 7 is 380.0 ×
  240.3 pixels, where with 8 it was 396.0 × 250.4 (a temporary edit of `app.css`). The browser
  test took the lake whose centre lies nearest Zürich's. That is the Greifensee, 4.6 × 6.3
  pixels (4.8 × 6.6 at 8 pixels), and the tap at its point landed on Fällanden, while at 8
  pixels it stayed on the lake. The Zürichsee is the lake whose box overlaps Zürich's. Zoomed in
  once, it is 68.1 × 41.4 pixels: a point 2 pixels from its shore still sent the tap to Zürich,
  and one 4 pixels from it stayed on the lake (Output, `lake_tap.mjs`).
- **A slider that moves while it is dragged.** When "Mit Ihrer Auswahl" appears beside the vote's
  result, the results grow and the slider moves down under the pressed pointer:
  - on `main` before this change (`b730551`), from 301 to 346 pixels, 44 pixels;
  - with it, from 340 to 386, 46 pixels (Output, `drag.cjs`).

  The drag goes on, as the slider keeps the pointer pressed on it. This is #8's layout.
  - **Where the slider lay.** On the build of task 4.3 the upper slider lay at y 752, below the
    window, after a scroll of 3, so the test's press missed it. On `main` before, it was at
    y 659. On the merged build the click on "Hinzufügen" scrolls the page by 391 pixels and the
    slider lies at y 409. The test now scrolls the slider into view itself.
  - **How those were measured.** These earlier builds were measured with the steps of
    `drag.cjs`, from a copy in the session's scratch space (`main` in a worktree of `b730551`).

## Not verified

- How the fonts look and wrap on a real phone, Chrome on Android and Safari on iOS, and with a
  phone's dark mode. The change's tasks leave this to Q's check by hand after the merge.

## Output

`node look.cjs`:

```
360 start: {"family":"\"Times New Roman\"","size":"16px","lineHeight":"normal","text":"rgb(0, 0, 0)","ground":"rgba(0, 0, 0, 0)","link":"rgb(0, 0, 238)","margin":"8px","map":"-","height":11083} rendered: Liberation Serif
360 guide: {"family":"\"Times New Roman\"","size":"16px","lineHeight":"normal","text":"rgb(0, 0, 0)","ground":"rgba(0, 0, 0, 0)","link":"rgb(0, 0, 238)","margin":"8px","map":"-","height":2028} rendered: Liberation Serif
360 vote: {"family":"\"Times New Roman\"","size":"16px","lineHeight":"normal","text":"rgb(0, 0, 0)","ground":"rgba(0, 0, 0, 0)","link":"rgb(0, 0, 238)","margin":"8px","map":"344 x 218","height":2734} rendered: Liberation Serif
1280 start: {"family":"\"Times New Roman\"","size":"16px","lineHeight":"normal","text":"rgb(0, 0, 0)","ground":"rgba(0, 0, 0, 0)","link":"rgb(0, 0, 238)","margin":"8px","map":"-","height":5143} rendered: Liberation Serif
1280 guide: {"family":"\"Times New Roman\"","size":"16px","lineHeight":"normal","text":"rgb(0, 0, 0)","ground":"rgba(0, 0, 0, 0)","link":"rgb(0, 0, 238)","margin":"8px","map":"-","height":1362} rendered: Liberation Serif
1280 vote: {"family":"\"Times New Roman\"","size":"16px","lineHeight":"normal","text":"rgb(0, 0, 0)","ground":"rgba(0, 0, 0, 0)","link":"rgb(0, 0, 238)","margin":"8px","map":"928 x 587","height":2321} rendered: Liberation Serif
1920 start: {"family":"\"Times New Roman\"","size":"16px","lineHeight":"normal","text":"rgb(0, 0, 0)","ground":"rgba(0, 0, 0, 0)","link":"rgb(0, 0, 238)","margin":"8px","map":"-","height":4693} rendered: Liberation Serif
1920 guide: {"family":"\"Times New Roman\"","size":"16px","lineHeight":"normal","text":"rgb(0, 0, 0)","ground":"rgba(0, 0, 0, 0)","link":"rgb(0, 0, 238)","margin":"8px","map":"-","height":1362} rendered: Liberation Serif
1920 vote: {"family":"\"Times New Roman\"","size":"16px","lineHeight":"normal","text":"rgb(0, 0, 0)","ground":"rgba(0, 0, 0, 0)","link":"rgb(0, 0, 238)","margin":"8px","map":"1568 x 992","height":2666} rendered: Liberation Serif
```

`fonts.sh /new/path/outside/the/repository`:

```
Package: bytes of its Latin files; digits of one width; tnum; lowercase width (em); lacking
  fontsource-atkinson-hyperlegible-5.3.0: 17208 + 17524 = 34732 bytes; False; True; 0.483; nothing
  fontsource-ibm-plex-sans-5.3.0: 22588 + 22832 = 45420 bytes; True; False; 0.505; nothing
  fontsource-variable-inter-5.3.0: 48256 = 48256 bytes; False; True; 0.536; nothing
  fontsource-variable-noto-sans-5.3.0: 35820 = 35820 bytes; True; True; 0.530; nothing
  fontsource-variable-source-sans-3-5.3.1: 28872 = 28872 bytes; True; False; 0.448; nothing
The Latin face of Source Sans 3: 19 ranges; 133 files of text read
Characters outside it: 0
```

`python3 colours.py`:

```
The light palette on #ffffff:
  text                 #1c1c1c  17.04:1
  secondary text       #595959   7.00:1
  link and focus       #1a5fb4   6.29:1
  greyed               #767676   4.54:1
  yes                  #007260   5.87:1
  no                   #934319   6.87:1
  borders of controls  #767676   4.54:1
  hatching's lines     #999999   2.85:1
The dark palette on #121212:
  text                 #e8e8e8  15.29:1
  secondary text       #b0b0b0   8.64:1
  link and focus       #8ab4f8   8.89:1
  greyed               #9a9a9a   6.66:1
  yes                  #4bc1ad   8.50:1
  no                   #e5946f   7.85:1
  borders of controls  #9a9a9a   6.66:1
  hatching's lines     #999999   6.58:1
Considered and not taken, on #ffffff:
  browser's link       #0000ee   9.40:1
  red of the flag      #d52b1e   5.01:1
  deep red             #c8102e   5.88:1
  yes, class 3         #009c86   3.44:1
  no, class 3          #c2673b   3.96:1
The light palette's greys on an off-white ground, #f5f5f2:
  #1c1c1c  15.60:1
  #595959   6.41:1
  #767676   4.16:1
  #1a5fb4   5.76:1
On #1c1c1c, a softer dark ground:
  yes, class 4         #007260   2.90:1
  no, class 4          #934319   2.48:1
  greyed of light      #767676   3.75:1
  yes, class 2         #4bc1ad   7.73:1
  no, class 2          #e5946f   7.14:1
  greyed               #9a9a9a   6.06:1
The set-aside grey #2c2c2c and a dark ground (Delta E, normal / red-green deficiency):
  #000000   29.3 /  29.3
  #0d0d0d   13.4 /  13.4
  #121212   11.1 /  11.1
  #161616    9.3 /   9.3
  #1c1c1c    6.7 /   6.7
  #202020    5.0 /   5.0
Each dark ground and the closest colour of the map's classes, tie and lakes:
  #000000  normal  49.5 (no, class 4)  red-green deficiency  43.4 (no, class 4)
  #121212  normal  32.1 (no, class 4)  red-green deficiency  25.7 (no, class 4)
  #1c1c1c  normal  28.1 (no, class 4)  red-green deficiency  21.5 (no, class 4)
```

`node drag.cjs` (on `f30e07c`; `--scrolled` printed the same):

```
before the press: {"value":"1000","sliderY":409,"scrollY":391,"own":340,"selection":null,"fonts":"loaded"}
try 0: pointer at y 420.6 {"value":"328","sliderY":455,"scrollY":391,"own":386,"selection":386,"fonts":"loaded"}
try 1: pointer at y 420.6 {"value":"327","sliderY":455,"scrollY":391,"own":386,"selection":386,"fonts":"loaded"}
```

`node lake_tap.mjs "$PWD" nearest 0 0`, `overlap 1 2` and `overlap 1 4` (on `f30e07c`):

```
{"which":"nearest","zooms":0,"margin":0,"map":"380.0 x 240.3","lake":"4.6 x 6.3","point":"241.1, 351.9","atPoint":"a lake","details":["Fällanden (ZH)"]}
{"which":"overlap","zooms":1,"margin":2,"map":"380.0 x 240.3","lake":"68.1 x 41.4","point":"263.6, 301.5","atPoint":"a lake","details":["Zürich (ZH)"]}
{"which":"overlap","zooms":1,"margin":4,"map":"380.0 x 240.3","lake":"68.1 x 41.4","point":"285.7, 319.1","atPoint":"a lake","details":[]}
```
