# Spec Delta

## MODIFIED Requirements

### Requirement: The colours of the light scheme

Unless the browser prefers a dark colour scheme, every page SHALL show its text in `#1c1c1c` on
`#ffffff`; a vote's date and kind, and sources and notes, in `#595959`; links below the head,
underlined, and the ring of a focused control in the text's colour; the cantonal votes of a
majority that is not needed in `#767676`. Every text SHALL have at least 4.5:1 against the colour behind it, text of at
least 24 pixels, or of 18.66 bold, at least 3:1 (WCAG 2.2, 1.4.3; `investigations/site-style.md`,
3).

#### Scenario: The contrast of every text

- **WHEN** a visitor opens the start page, the guide, and `/votes/5960/` with the upper bound of
  "Ausländeranteil" at step 327, in each of the three languages
- **THEN** a paragraph is `#1c1c1c` on `#ffffff`, a link below the head `#1c1c1c` and underlined,
  and every text has at least 4.5:1 against the colour behind it, or 3:1 where it is large

#### Scenario: A majority that is not needed

- **WHEN** a visitor opens `/de/votes/5950/`, a vote that needs only the majority of voters
- **THEN** the Ständemehr reads "nicht nötig" in `#1c1c1c`, and its cantonal votes are `#767676`,
  4.54:1 on `#ffffff`

### Requirement: The dark scheme

When the browser prefers a dark colour scheme, every page SHALL show its text in `#e8e8e8` on
`#121212`; a vote's date and kind, and sources and notes, in `#b0b0b0`; links below the head,
underlined, and the ring of a focused control in the text's colour; the cantonal votes of a
majority that is not needed in `#9a9a9a`, with the contrasts of the light scheme. A page SHALL follow the browser when
its preference changes, keeping its state, with no switch of its own, no cookie and no local
storage.

#### Scenario: A dark page

- **WHEN** a visitor whose browser prefers a dark colour scheme opens the start page, the guide,
  and `/votes/5960/` with the upper bound of "Ausländeranteil" at step 327, in each of the three
  languages
- **THEN** a paragraph is `#e8e8e8` on `#121212`, a link below the head `#e8e8e8` and underlined,
  and every text has at least 4.5:1 against the colour behind it, or 3:1 where it is large

#### Scenario: The preference changes on an open page

- **WHEN** a visitor on `/de/votes/5960/` moves the upper bound of "Ausländeranteil" to step 327
  and then sets the browser to prefer a dark colour scheme
- **THEN** the page turns dark without loading anew, the bound stays at step 327, and "Mit Ihrer
  Auswahl" still shows "Angenommen" (`investigations/limits.md`, 5)

#### Scenario: Nothing stored

- **WHEN** a visitor opens the start page in the dark scheme and in the light scheme
- **THEN** the page offers no switch between them, and writes no cookie and nothing to the
  browser's local storage

### Requirement: The verdicts in the map's colours

Wherever a page writes a verdict, it SHALL write a yes ("Ja", "Angenommen") in `#007260` and a no
("Nein", "Abgelehnt") in `#934319`, the darkest class of each side on the map; in the dark scheme
in `#4bc1ad` and `#e5946f`, the map's class 2. This SHALL hold in each language for the result of
a vote and of a selection, the table of the cantons, the bar of a narrow window, the comparison
and the start page's list. "nicht nötig" and a tie-break question's figures keep the text's
colour.

#### Scenario: The vote of 2016-02-28

- **WHEN** a visitor opens `/de/votes/5960/`
- **THEN** the Volksmehr's "Nein" and the outcome "Abgelehnt" are `#934319`; the Ständemehr's
  "Ja" is `#007260`; and the row of ZH in the table of the cantons reads "Nein" in `#934319`
  (`investigations/data-sources.md`, "Reference data for the calculation")
- **AND** the start page's row of that vote writes "abgelehnt" in `#934319`

#### Scenario: A selection on a phone

- **WHEN** a visitor opens `/de/votes/5960/` in a window 412 pixels wide, adds the limit
  "Ausländeranteil", moves its upper bound to step 327 and keeps the slider in the middle of the
  window
- **THEN** "Angenommen" under "Mit Ihrer Auswahl" and in the bar, and "Ja" of both majorities in
  the bar, are `#007260` (`investigations/limits.md`, 5)

#### Scenario: In the dark scheme

- **WHEN** a visitor whose browser prefers a dark colour scheme opens `/fr/votes/5960/`
- **THEN** the majority of the people's "Non" and the outcome "Rejeté" are `#e5946f`, and the
  majority of the cantons' "Oui" is `#4bc1ad`

### Requirement: The head of every page

Every page under `/de/`, `/fr/` and `/it/` SHALL begin with a head that names, in this order: the
working title "Popular Vote Explorer" with a mark before it, linked to the start page in the
page's language; the comparison, "Vergleichen", "Comparer" or "Confrontare"; the guide,
"Lesehilfe", "Guide de lecture" or "Guida alla lettura"; and the three languages of the switch
(the `interface-languages` capability). The entry of the page shown SHALL NOT be a link. A page
that redirects has no head.

#### Scenario: On a vote's page

- **WHEN** a visitor opens `/fr/votes/5960/`
- **THEN** before the page's heading, its head shows "Popular Vote Explorer", linked to `/fr/`,
  "Comparer", linked to `/fr/compare/`, "Guide de lecture", linked to `/fr/guide/`, and "Deutsch",
  "Français" and "Italiano"

#### Scenario: On the start page and the guide

- **WHEN** a visitor opens `/de/`, `/de/guide/` and `/de/compare/`
- **THEN** on `/de/` "Popular Vote Explorer" in the head is not a link, and "Vergleichen" and
  "Lesehilfe" link to `/de/compare/` and `/de/guide/`; on `/de/guide/` "Lesehilfe" is not a link;
  on `/de/compare/` "Vergleichen" is not a link; on both, "Popular Vote Explorer" links to `/de/`

#### Scenario: The head in a narrow window

- **WHEN** a visitor opens `/it/votes/5960/` in a window 360 pixels wide
- **THEN** the head is no wider than the window, none of its words is broken, and it takes two
  lines: the title with "DE", "FR" and "IT", then "Confrontare" and "Guida alla lettura"

#### Scenario: The mark is no image

- **WHEN** a visitor opens `/de/votes/6823/`, the page of a tie-break question
- **THEN** the head shows its mark, and the page holds no image and no `svg`

### Requirement: The width of a page

A page SHALL be at most 1,600 pixels wide, in the middle of a wider window, with 32 pixels between
its content and each side of the window, 16 in a window narrower than 640 pixels. The start page
and the guide SHALL be at most 1,216 pixels wide. A paragraph of text SHALL be at most 40rem wide,
640 pixels at the browser's default text size.

#### Scenario: A wide window

- **WHEN** a visitor opens `/de/votes/5960/` in a window 1,920 pixels wide and 1,080 high
- **THEN** the head and the heading begin 192 pixels from the window's left edge, the map is 1,104
  pixels wide, give or take 1, and the limits' column to its right is 384 pixels wide and ends 192
  pixels from the window's right edge (`investigations/redesign.md`, 6)

#### Scenario: A narrow window

- **WHEN** a visitor opens `/de/` in a window 360 pixels wide
- **THEN** the head and the list begin 16 pixels from the window's left edge and end at least 16
  pixels from its right edge

#### Scenario: The start page in a wide window

- **WHEN** a visitor opens `/de/` and `/de/guide/` in a window 1,920 pixels wide
- **THEN** the page is 1,216 pixels wide in the middle of the window: its head begins 384 pixels
  from the window's left edge and ends 384 pixels from its right edge, give or take 1

### Requirement: The controls

Every control a page shows, its buttons, fields, lists, switches and a limit's sliders, SHALL be
drawn in the colours of the page's scheme. Its border or fill SHALL have at least 3:1 against the
colour behind it, its text at least 4.5:1, and, when focused from the keyboard, it SHALL show a
ring of 2 pixels in the text's colour (WCAG 2.2, 1.4.11). A control that cannot be used is exempt,
and a button of underlined text needs no border.

#### Scenario: The controls in both schemes

- **WHEN** a visitor opens `/de/votes/5960/`, adds the limit "Ausländeranteil" and moves its upper
  bound to step 327, in the light and in the dark scheme
- **THEN** the borders or fills of "+", "−", "Ganze Schweiz", "Merkmal hinzufügen", "Zurück zum
  echten Ergebnis", the switch, the track and both thumbs have at least 3:1 against the colour
  behind them, and their texts at least 4.5:1; "Entfernen" is underlined text of at least 4.5:1

#### Scenario: A control focused from the keyboard

- **WHEN** a visitor on `/de/votes/5960/` presses the Tab key until "Ganze Schweiz" has the focus,
  in the light and in the dark scheme
- **THEN** a ring 2 pixels wide surrounds it, `#1c1c1c` in the light scheme and `#e8e8e8` in the
  dark one

#### Scenario: The start page's controls

- **WHEN** a visitor opens `/de/` in the light and in the dark scheme
- **THEN** the borders of the search field and of "Alle", "Angenommen" and "Abgelehnt" have at
  least 3:1 against the colour behind them, and their texts at least 4.5:1

## ADDED Requirements

### Requirement: The look of the head's entries

In the head, the comparison, the guide and a language that link SHALL be written in `#595959`, in
the dark scheme in `#b0b0b0`, without a line until the pointer is on them, when they are underlined
in the text's colour. The entry of the page shown and the page's language SHALL be written in the
text's colour, in a heavier weight, above a line of that colour. The title SHALL be in the text's
colour and not underlined.

#### Scenario: The entries on the guide

- **WHEN** a visitor opens `/de/guide/`
- **THEN** "Vergleichen" in the head is `#595959` and not underlined, and underlined while the
  pointer is on it; "Lesehilfe" is `#1c1c1c` in a weight of 600

#### Scenario: The entries in the dark scheme

- **WHEN** a visitor whose browser prefers a dark colour scheme opens `/de/guide/`
- **THEN** "Vergleichen" in the head is `#b0b0b0` and not underlined, and "Lesehilfe" is `#e8e8e8`

### Requirement: The colours of a bar

A bar that shows a yes share SHALL draw its yes part in `#009c86` and its no part in `#c2673b`,
the map's class 3; in the dark scheme in `#4bc1ad` and `#e5946f`, its class 2. Between the two
parts SHALL lie a gap of 2 pixels in the ground's colour, and a mark at half SHALL be in the
text's colour. Each part SHALL have at least 3:1 against the ground (WCAG 2.2, 1.4.11;
`investigations/redesign.md`, 5). A bar of anything else SHALL take no side's colour.

#### Scenario: The bars of a vote

- **WHEN** a visitor opens `/de/votes/5960/`, whose yes share is 49.16%
  (`investigations/data-sources.md`, "Reference values")
- **THEN** the Volksmehr's bar is `#009c86` on its left and `#c2673b` on its right, 3.44:1 and
  3.96:1 on `#ffffff`, with a gap between them and a mark at half in `#1c1c1c`

#### Scenario: The bars in the dark scheme

- **WHEN** a visitor whose browser prefers a dark colour scheme opens `/de/votes/5960/`
- **THEN** the Volksmehr's bar is `#4bc1ad` and `#e5946f`, 8.50:1 and 7.85:1 on `#121212`

#### Scenario: A bar that judges nothing

- **WHEN** a visitor opens `/de/votes/6823/`, the tie-break question, and `/de/votes/5960/` with
  Zürich clicked
- **THEN** the tie-break question's bar is `#1c1c1c` and `#8c8c8c`, and the bars of Zürich's
  shares in the panel are `#1c1c1c`

### Requirement: The colours of rows

A row that can be chosen SHALL show the ground `#f4f4f4` while pointed at, `#1c1c1c` in the dark
scheme, on which every text keeps at least 4.5:1. The grey of a majority that is not needed and
the grey of a set-aside municipality SHALL stand on the page's ground only
(`investigations/redesign.md`, 5).

#### Scenario: A row of the start page pointed at

- **WHEN** a visitor on `/de/` points at the row of the vote with id 5960
- **THEN** the row's ground is `#f4f4f4`, its title is underlined, and its "abgelehnt" in
  `#934319` has 6.24:1 against it
