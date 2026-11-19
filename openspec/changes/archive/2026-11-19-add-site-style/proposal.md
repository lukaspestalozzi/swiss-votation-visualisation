# Proposal

## Why

v1 is to be styled, and #10a of `docs/roadmap.md`, `add-site-style`, is its last change. It is
implemented here, after #10, so that it styles what #10 added. It settles what the roadmap leaves
open for it: the font, the colours and their contrast, the width of the column, the head of the
page, and a dark mode.

`investigations/site-style.md` shows what a visitor gets today:
- **The browser's defaults.** Every page is set in the browser's serif (Times New Roman,
  rendered by this machine as Liberation Serif), black on white, with the browser's blue links,
  an 8-pixel margin and the browser's own buttons and list.
- **No head.** The top of a page is the language switch alone; only the start page shows the
  working title.
- **The test machine's font is no visitor's.** A phone renders another serif, so the browser
  tests that check 360 pixels measure a font no visitor sees.

## What Changes

- **A font served with the site:**
  - Source Sans 3, one variable file of 28,872 bytes, its Latin face;
  - it holds every character the site writes (investigation, 2);
  - its digits have one width, so the columns of figures line up;
  - until it has loaded, or if it cannot be loaded, the system's sans-serif font.
- **The colours of the page:**
  - text `#1c1c1c` on white;
  - secondary text `#595959`;
  - links and focus rings `#1a5fb4`;
  - the grey of a majority that is not needed stays `#767676`;
  - every text at least 4.5:1 against its ground, 3:1 for large text and for the borders and
    focus rings of controls.
- **Verdicts in the map's colours:**
  - yes, "Ja" and "Angenommen", in the map's darkest yes, `#007260`;
  - no, "Nein" and "Abgelehnt", in its darkest no, `#934319`;
  - wherever a page writes a verdict: the boxes, the outcome, the table of the cantons, the bar of
    #10 and the start page's list;
  - the word always stands, so the colour is never the only sign.
- **A dark mode** when the browser prefers one:
  - the page on `#121212`, text `#e8e8e8`, links `#8ab4f8`, the verdicts in the map's class 2;
  - the map keeps its colours, the set-aside grey 11.1 apart from the dark ground;
  - the borders between municipalities and the ground under the hatching take the page's ground;
  - no switch on the page, no cookie and nothing in the browser's local storage.
- **A head on every page.** It holds the working title, linked to the start page, then the
  guide's name, linked to the guide, then the language switch. The link to the guide below the
  start page's heading goes.
- **The width:**
  - the page fills the window, with 16 pixels at each side;
  - a paragraph is at most 40rem wide;
  - the map grows with the window as it does now.
- **Controls drawn by the page** in both schemes: buttons, the list, the switch, the limits'
  sliders and the map's buttons. The sizes on a touch screen stay as #10 set them.
- **A browser test of contrast and font** on the start page, the guide and a vote's page, in each
  language and both schemes. Screenshots at 360 and 1,280 pixels for Q's review in the pull
  request.
- **The investigation:** `investigations/site-style.md`, with its scripts.

## Non-goals

- **No limit on the column's width** (Q): only paragraphs are limited. On a wide screen the map
  stays as large as the window allows, 1552 × 982 pixels at 1920.
- **No switch between light and dark**, no cookie and nothing in local storage: the page follows
  the browser.
- **The map's colours stay** as #6 and #8 set them:
  - the classes, the tie, the lakes and the set-aside grey `#2c2c2c`;
  - the cantons' borders;
  - the outline, black on a white halo.
  - The hatching keeps its lines of `#999999`, 2.85:1 on white, below WCAG's 3:1 for a graphic;
    its legend names it (investigation, 3).
- **No name and no logo.** "Popular Vote Explorer" stays a working title.
- **Links keep their size** on a touch screen, the head's included, as #10 decided.
- **No italic and no second font.**
- **No pixel comparison of screenshots.** A new Chromium or font rendering changes pixels.
- **No change to the texts, the data, the pipeline or the calculation**, apart from the guide's
  link moving into the head.

## Capabilities

### New Capabilities

- `site-style`: the look of every page:
  - the font;
  - the colours and their contrast;
  - the dark mode;
  - the verdicts in the map's colours;
  - the head of every page;
  - the width of a page and of its paragraphs;
  - the controls.

### Modified Capabilities

- `reading-guide`: every page links to the guide from its head; the link below the start
  page's heading goes.
- `result-map`:
  - a municipality without a result is hatched on the page's ground, white or, in the dark mode,
    `#121212`;
  - the set-aside grey is also measured against the dark ground.

## Impact

- **App:**
  - a stylesheet for every page, with the font, the colours of both schemes, the width and the
    controls, loaded by the layout that wraps every page;
  - the head in `[lang]/+layout.svelte`;
  - the start page loses its link to the guide;
  - the styles of each screen use the colours of the stylesheet: the vote's page, the limits,
    the map, the panel and the bar;
  - the verdict words in the vote's page, the table, the bar and the start page's list carry their
    side.
- **Dependency:** `@fontsource-variable/source-sans-3` 5.3.1, the font and its licence, SIL Open
  Font License 1.1. Its file is built into the site, and nothing is requested from another server.
- **Browser tests:**
  - a new file for `site-style`: the font, the contrast in both schemes, the head, the width, the
    verdicts' colours, the controls;
  - the tests of the guide's link and of the hatching follow the change.
- **Docs:**
  - `CLAUDE.md`'s code map and "Where things are";
  - `docs/roadmap.md`;
  - `investigations/site-style.md` and `investigations/site-style/`.
