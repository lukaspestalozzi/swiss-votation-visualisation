# Proposal

## Why

The site is correct and complete, but it "does not look very modern" (Q, 2026-11-24). The look at
it that followed, `investigations/redesign.md`, found that the larger problem is its layout: on a
vote's page the result, the limits and the map lie on three screens, so a visitor cannot watch the
map and the verdict while moving a limit, which is what the product is for.

This change is off the roadmap: `docs/roadmap.md` planned nothing after #13. It adds itself as
#14, as Q asked for it, and it is one change for the whole site (Q).

`investigations/redesign.md` gives the facts:
- **Three screens.** In a window 1,280 by 800 pixels with two limits set, the result begins 236
  pixels down a vote's page, the first slider 846 and the map 1,225.
- **Every figure but the map's is text.** The result stands in two boxes per result, the 35
  characteristics are 35 lines, the cantons a table of 26 rows. A limit does not show where the
  municipalities lie.
- **The start page is running text**, 125 linked titles with no column to read down, no sentence
  on what the site does, and no way to find a vote but to scroll 6,205 pixels.
- **A broadcaster's result pages** draw a result as one bar with a mark at half, the cantonal
  votes as 23 dots, and the map's legend as one strip. None lets the visitor change the result.
- **The drawings are cheap.** Added to today's page and redrawn on every step of a slider, they
  cost 1 to 2 ms of a frame; no run of 60 had a frame over 16 ms.
- **155 of the 255 browser tests name today's structure**, most through a few helpers and class
  names. Keeping today's words keeps most of what they assert.

## What Changes

Q chose the layout from two mockups and saw every page of the second round
(`investigations/redesign.md`, 6). Today's wording stays wherever it can: the change is in the
layout and in what is drawn.

- **A vote's page is a workbench.** In a window at least 1,024 pixels wide the result and the map
  stand in a column that stays in the window, and the limits in a column to their right. Below
  both stand the panel of characteristics and, beside it, the table of the cantons. In a narrower
  window the order is result, map, limits, panel, cantons.
- **A result is drawn.** Each result is a row: its outcome, the majority of voters as a bar with
  a mark at half and the votes below it, and the cantons as a bar of one segment per canton. The
  result with the selection stands below the real one, bar above bar. A majority that is not
  needed has no bar.
- **A limit shows where the municipalities lie:** a histogram of 50 bins over its track, the bins
  within its bounds dark, and a mark for the municipality last clicked (Q). Its label, its two
  sliders and "Entfernen" stay.
- **A limit is added with one button** (Q): "Merkmal hinzufügen" opens the characteristics under
  their eight headings, and choosing one adds its limit. The browser's list and "Hinzufügen" go.
- **The map** keeps its colours and its details. Its legend becomes one scale with the yes shares
  at the classes' borders; a municipality's details gain a bar.
- **The mouse wheel over the map scrolls the page** (Q), as the map now stays in the window. The
  map zooms with Ctrl or ⌘ and the wheel, with a pinch on a trackpad, with its buttons and with
  two fingers.
- **The panel and the cantons are drawn too:** each share of a municipality with a small bar, each
  canton's yes share with a bar from 50%, and, under a selection, a mark at its real share.
- **The head** gains a mark and the entry "Vergleichen" (Q). In a window narrower than 640 pixels
  the switch writes "DE", "FR", "IT".
- **Colour means a result** (Q). Links, controls and the ring of focus take the text's colour;
  the only colours of a page are those of yes, of no and of the map.
- **A page is at most 1,600 pixels wide**, 32 pixels from each side of its window, 16 in a narrow
  one.
- **The start page** opens with the question the site answers and one sentence, and lists the
  votes by year and vote day, each a row of title, kind, a small bar, the yes share and the
  verdict. A search field, three buttons for the result and a link per year find a vote (Q). It
  shows no example (Q).
- **The comparison** shows the two votes one below the other, each with its results drawn as on a
  vote's page, the limits beside them.
- **The guide** is one column of text. One sentence changes: the result with the selection stands
  below the real one, not beside it.

## Non-goals

- No change to the data, the pipeline or the calculation, and no new dependency.
- The map's colours and classes, the font, the dark scheme's ground and the budgets stay as they
  are.
- Addresses and links stay: a vote's address, the selection after `#`, the comparison's address.
- No example on the start page (Q), no sorting of its list, and no search in its address:
  nothing a visitor types is stored or sent.
- The comparison's two lists of votes stay the browser's lists.
- No switch between the light and the dark scheme, no animation, and no map of the cantons.
- The French and Italian wording of the new texts is written with the change and reviewed by Q;
  the look on a real phone is checked by hand after the merge, as in #10 and #10a.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-style`: links, controls and the ring of focus in the text's colour; the colours of bars
  and of a histogram; the head with a mark and "Vergleichen"; a page at most 1,600 pixels wide.
- `verdicts`: a result as a row with two bars; the selection's result below the real one; no bar
  for a majority that is not needed; a bar for the tie-break question; the table of the cantons
  with a bar per row, headed "Kantone", beside the panel.
- `limits`: the limits beside the map; adding a limit with one button and its list; the histogram
  of a track; the mark of the municipality last clicked; the count with its bar.
- `result-map`: the map's heading for assistive technology; the legend as a scale; a bar in a
  municipality's details; the panel below the map, its shares drawn; the result and the map
  staying in the window.
- `vote-list`: the start page's heading and sentence; the votes by vote day; what a row shows;
  the search, the filter by result and the links to the years.
- `vote-comparison`: the head; a vote's results drawn as on its page; the two votes one below the
  other.
- `small-screens`: the two majorities one below the other where a result is narrow; the controls
  of 44 pixels, with the new ones.
- `interface-languages`: the switch's short names in a narrow window.
- `reading-guide`: the sentence on where the selection's result stands.
- `characteristics`: one scenario's wording, as the panel no longer stands beside the map.

## Impact

- **Code:** the app only. `app/src/app.css`; the layout and every page under
  `app/src/routes/[lang]/` with their components; new components for a result's row, the list of
  characteristics and the start page's list; `app/src/lib/` for what the drawings show (the bars
  of a result and of a canton, a track's histogram, the legend's scale, the list's days and its
  search); the texts in three languages.
- **Tests:** the browser tests' helpers and the tests that name today's structure
  (`investigations/redesign.md`, 3); unit tests for the new functions in `app/src/lib/`; the
  budget tests measured again.
- **Data, pipeline, calculation:** none.
- **Dependencies:** none added.
- **Docs:** `CLAUDE.md`, `README.md`, `docs/roadmap.md` (#14).
