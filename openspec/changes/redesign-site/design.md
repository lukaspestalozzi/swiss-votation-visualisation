# Design

## Context

See `proposal.md` for the motivation. What shapes the approach:

- **The look of today** is #10a's (`add-site-style`): Source Sans 3 from one file served with the
  site, every colour named once in `app/src/app.css`, a light and a dark scheme that follow the
  browser, text of at least 4.5:1 and controls of at least 3:1. A page fills its window.
- **A vote's page** is one column: result, limits, map with the panel to its right from 960
  pixels, table of the cantons. What a page shows is worked out in plain TypeScript in
  `app/src/lib/`; the Svelte components lay it out.
- **Hard constraint 3:** each frame while a limit is dragged takes at most 16 ms of work, each
  frame after a jump at most 50 ms. The map repaints only the municipalities whose state changed.
- **The map's colours are fixed** by `investigations/map-data.md` and `investigations/limits.md`:
  eight classes, the set-aside grey `#2c2c2c`, and a dark ground between `#121212` and `#161616`
  that keeps that grey apart from it.
- **The page requests nothing from other servers** and stores nothing.
- **255 browser tests** follow the specs; 155 name today's structure, most through a few shared
  helpers (`investigations/redesign.md`, 3).
- **The mockups** of `investigations/redesign/mockups/` are the reference for the look: `build.mjs`
  writes them from the site's real content, and `mock.css` holds every size and colour named
  below. They do nothing; the behaviour is the specs'.

## Goals / Non-Goals

**Goals:**
- The result, the map and the limits in one view on a screen of 1,280 by 800 pixels.
- Every figure a visitor compares is drawn as well as written.
- Today's words stay, so that the specs' scenarios and the tests keep their figures and texts.
- The budgets of hard constraint 3 hold with the new drawings.

**Non-Goals:**
- A design system of its own: the look stays one stylesheet of named colours and the components'
  own styles.
- New texts where today's fit, and any change to how numbers and dates are written.

## Decisions

Decisions marked (Q) are Q's, of 2026-11-24: from two mockups of a vote's page, from the second
round of mockups of every page, or asked while drafting. The others are mine; each was in the
mockups Q saw unless it says otherwise.

### The page and its colours

1. **Colour means a result (Q).** Links, buttons, sliders, the switch and the ring of focus take
   the text's colour, `#1c1c1c`, and `#e8e8e8` in the dark scheme. A link is underlined, 1 pixel,
   2 when pointed at. The only colours of a page are the verdicts', the bars' and the map's.
   Rejected: today's blue `#1a5fb4`, which is one more colour beside those of yes, no and the
   lakes.
2. **The colours added**, each measured (`investigations/redesign.md`, 5):

   | Role | Light | Dark | Contrast on the ground |
   |------|-------|------|------------------------|
   | Yes part of a bar | `#009c86` | `#4bc1ad` | 3.44:1, 8.50:1 |
   | No part of a bar | `#c2673b` | `#e5946f` | 3.96:1, 7.85:1 |
   | A histogram's bins outside the bounds | `#8c8c8c` | `#6e6e6e` | 3.36:1, 3.67:1 |
   | Hover ground | `#f4f4f4` | `#1c1c1c` | (a ground) |
   | Empty part of a track | `#e4e4e4` | `#303030` | 1.27:1, 1.42:1 |
   | Hairline between rows | `#dedede` | `#333333` | 1.35:1, 1.48:1 |

   The bars take the map's class 3, in the dark scheme its class 2, as the verdicts' words take
   its darkest class: each has 3:1 as a graphic. The empty part of a track and a hairline are
   below 3:1 and carry no meaning of their own: every bar stands beside its figure in text. The
   grey of a majority that is not needed, `#767676`, has only 4.13:1 on the hover ground and stays
   on the ground. The set-aside grey stays on the ground too, 6.7 from the dark hover ground.
3. **A gap in a bar.** The yes and the no part of a bar have 1.15:1 against each other. A gap of 2
   pixels in the ground's colour separates them, so that where a bar turns does not rest on hue.
4. **The font stays** Source Sans 3 in its one file, which holds the weights 200 to 900. The pages
   use 300, 400, 600 and 700. Rejected: a second font for headings, which is another file to
   serve.
5. **A page is at most 1,600 pixels wide (Q)**, 100rem, centred, 32 pixels from each side of its
   window and 16 in a window narrower than 640. The start page and the guide are at most 76rem
   wide; a paragraph stays at most 40rem. This replaces #10a's page without a limit: at 1,920 the
   map was 1,552 pixels wide and taller than its window, and limits beside a wider map stand far
   from what they change.
6. **The head** is the working title with a mark before it, "Vergleichen", "Lesehilfe" and the
   switch. The entry of the page shown is text, not a link. "Vergleichen" is new (Q). The mark is
   a bar of yes and no with the mark at half, drawn with CSS: it is no image, and no page gains
   an `svg`. Rejected: an entry "Abstimmungen", as the title leads there already.
7. **The switch writes "DE", "FR", "IT" in a window narrower than 640 pixels**, so that the head
   takes two lines there, not three. Each link is named "DE – Deutsch", "FR – Français" or "IT –
   Italiano" for assistive technology at every width: the name holds what is written.

### A vote's page

8. **The workbench (Q).** In a window at least 1,024 pixels wide the page's parts stand in two
   columns: the result above the map on the left, the limits on the right in a column of
   `clamp(19rem, 30vw, 24rem)`, 307 to 384 pixels. While the window is also at least 700 pixels
   high, the left column stays in the window as the page scrolls, and the map is at most the
   window's height less 17rem tall. Below the columns stand the panel and the table of the
   cantons. Rejected: today's order restyled, which leaves the map two screens down (mockup A);
   the limits on the left, as the result is what a visitor reads first; and 960 pixels as the
   threshold, where the map would be 464 pixels wide.
9. **In a narrower window** the order is result, map, limits, panel, cantons: the map moves above
   the limits. Nothing stays in the window but #10's bar at the bottom.
10. **A result is a row (Q saw it in both rounds):** the outcome, then the majority of voters, then
    the cantons. The selection's result stands below the real one, so that their bars lie one
    above the other. This replaces the two boxes side by side of #4 and #8. A row follows the room
    it has, not the window: with less than 640 pixels the outcome stands above the two majorities,
    with less than 448 all three stand one below the other (Q: #10 kept the boxes side by side at
    360). Until a selection applies, the selection's place says what will stand there.
11. **The bar of the voters:** the yes part from the left, as wide as the yes share; the no part
    the rest; a mark at half, 2 pixels wide, 4 pixels taller than the bar at each end. With no
    valid vote the bar is empty.
12. **The bar of the cantons:** one segment per canton that has a cantonal vote, a half vote half
    as wide; the cantons in favour from the left, then those against, each group in the order of
    the Constitution; the mark at half of the votes that count. A canton with no municipality
    left has no segment. Rejected: 23 dots as a broadcaster draws them, as a half vote is no dot.
13. **A majority that is not needed has no bar.** Its cantonal votes stay written, greyed.
    Rejected: grey segments, which would draw a majority the vote does not need.
14. **The tie-break question** gets one bar of its two shares, the initiative's in the text's
    colour and the counter-proposal's in `#8c8c8c`: it is not judged, so it takes no side's
    colour.
15. **The mouse wheel over the map scrolls the page (Q).** The map zooms with the wheel while
    Ctrl or ⌘ is held, which is also how browsers report a pinch on a trackpad, and with its
    buttons and two fingers as before. Rejected: the wheel zooming as today, as the map now covers
    most of the first screen and stays there. No hint is shown: the buttons are in view.
16. **The map's parts.** Its heading "Karte der Gemeinden" stays for assistive technology and is
    not shown. The legend is one scale of the eight classes with the yes shares 20 to 80 at their
    borders, "Nein" and "Ja" at its ends, then the entries of a tie, of no result and of the
    set-aside. A municipality's details keep their lines and gain a bar of its yes share. The zoom
    buttons keep their names and places. In a window narrower than 640 pixels the map runs from
    edge to edge.
17. **The panel stands below the map (Q)**, as the limits take the place beside it. Its lines keep
    their text, "Einwohner: 396'955"; a share has a bar of 4rem beside its figure. Its groups
    stand in columns of at least 15rem. From 960 pixels the table of the cantons stands to its
    right.
18. **The table of the cantons** keeps its four columns and is headed "Kantone". The yes share's
    cell gains a bar on a track of 0 to 100%: from 50% to the share, in the colour of its side.
    Under a selection a mark shows the canton's real share. Rejected: a track from 35% to 65%,
    which shows a close canton better but ends 19 of 26 bars at its end in a vote of 68% yes; and
    two columns of thirteen rows, which one table cannot be.

### The limits

19. **One button adds a limit (Q).** "Merkmal hinzufügen" opens a dialog with that heading, the
    characteristics without a limit under the panel's eight headings, and "Schliessen". Choosing a
    characteristic adds its limit and closes the dialog; Escape and "Schliessen" close it and add
    nothing. It is the browser's modal `dialog`: the focus stays inside it and returns to the
    button. Moving through it with the keyboard adds nothing, as #8 required of the list.
    Rejected: the browser's list with "Hinzufügen" (Q); a list fixed to the button, whose place
    not every browser can set; and arrow keys of its own.
20. **A limit keeps its label**, "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%", as one text
    in three parts: the name bold, the date after it, the bounds on the next line. "Entfernen"
    stays a button with that word. The two sliders stay the browser's range inputs, and the switch
    stays a checkbox, drawn as a switch. So the tests' events and names hold.
21. **The histogram of a track:** 50 bins of 20 steps each, the last with step 1,000; a
    municipality with a figure counts in the bin of the lowest step whose value is not below its
    own. A bin is as tall as its count against the fullest bin's. It is drawn twice, grey and in
    the text's colour, the second clipped to the part between the two thumbs: a step of a slider
    moves one edge of the clip and redraws no bin. It is worked out once, when the limit is added.
22. **The mark of the municipality last clicked (Q)** stands under each track at its step, with
    its name and value. Without a click, or without a figure, there is no mark.
23. **The count keeps its sentence** and gains a bar of the municipalities that remain.

### The other pages

24. **The start page (Q).** Its heading is the question "Wie hätte die Schweiz abgestimmt, wenn
    nur ein Teil der Gemeinden an die Urne gegangen wäre?", with one sentence below. It shows no
    example (Q). The votes stand by year and vote day; a row is the linked title with the kind
    below it, a bar of the official yes share, "49.16% Ja" and the verdict, "abgelehnt". The whole
    row leads to the vote.
25. **Finding a vote (Q).** A search field keeps the rows whose title, in the page's language,
    holds every word typed, whatever the case. "Alle", "Angenommen" and "Abgelehnt" keep the votes
    with that official result; the tie-break question shows under "Alle" only. A vote day or a
    year without a row left goes, and a sentence says when nothing is left. A link per year jumps
    to it. Nothing typed is stored, sent, or written to the address. The rows are on the page as
    built: without scripts the list is whole.
26. **The comparison (Q)** shows the two votes one below the other at every width, each headed as
    today and with its results as a vote's page draws them, the limits beside them from 1,024
    pixels. Its two lists stay the browser's lists.
27. **The guide** is a column of at most 42rem. Its sentence on the selection's result says
    "darunter" where it said "daneben".

### Texts, tests and budgets

28. **New texts**, each in three languages, the French and the Italian written with the change and
    reviewed by Q: the start page's question and sentence; "Titel suchen", "Alle", "Angenommen",
    "Abgelehnt" and the sentence for no match; "Vergleichen"; "Kantone"; "Schliessen"; "Ja-Anteil
    in %"; the sentence under the table of the cantons; and the sentence in the selection's place.
29. **The tests' helpers first.** The helpers that add a limit, read a result and read the head are
    rewritten before the tests that use them, and the class names that still name a part stay
    (`.result`, `.selection`, `.limit .label`, `.details`, `.panel`, `.legend`), so a test changes
    only where its assertion does.
30. **The budgets stay.** 16 ms per frame while a bound is dragged, with the bars, the segments,
    the cantons' bars and the histograms' clips redrawn in it; 50 ms per frame after a jump, to
    which opening the list, choosing in it, a key in the search field and a press of a filter now
    belong; 100 and 170 ms for the frame after a link with up to 21 and with all 35 limits, whose
    histograms are worked out in it. Added to today's page, the drawings cost 1 to 2 ms of a
    frame (`investigations/redesign.md`, 4). No dependency is added.

## Risks / Trade-offs

- [A link with all 35 limits works out 35 histograms in its frame, which today takes 71 to 126 ms
  of its 170.] → A histogram is two paths, not 50 elements; the task that adds it measures that
  frame, and if it exceeds the budget the histograms are drawn in the frames after it, their room
  kept.
- [A column that stays in the window is new, and the tests point at municipalities under it.] →
  Nothing lies over the map but its details and its buttons, as today; the task of the workbench
  runs the map's tests in both layouts.
- [Ctrl and the wheel is not found by everyone.] → The buttons "+" and "−" are in view, and two
  fingers zoom on a touch screen as before.
- [The start page gets longer: 10,104 pixels against 6,205, and 17,232 against 14,897 on a
  phone.] → The search, the filter and the years stay at the top of the window.
- [French and Italian are longer, and only German was mocked up.] → The browser tests of the
  width at 360 pixels run in three languages; the longest names are in them already.
- [Seven of today's requirements name where parts stand.] → Each is modified with its scenarios
  kept by name; the texts in them stay.
- [The frames with the real drawings in the new layout are not measured yet.] → The budget tests
  run with every task that adds a drawing, twice when a frame exceeds the budget, as today.

## Open Questions

- Whether Safari on a Mac reports a pinch on its trackpad as Ctrl and the wheel. It is checked by
  hand after the merge; the buttons zoom there in any case.
