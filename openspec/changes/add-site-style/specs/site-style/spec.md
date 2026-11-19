# Spec Delta

## Purpose

The look of every page of the site: the font, the colours of a light and a dark scheme and their
contrast, the verdicts in the colours of the map, the head of every page, the width of a page,
and the controls, so that the site reads as one and every text is legible.

The pages show the data files of the `vote-data`, `municipalities` and `characteristics`
capabilities: the BFS vote-day files, the BFS register's boundaries and the characteristics' BFS
and swisstopo tables, on the list of municipalities of 2026-01-01, which the pipeline's update
command (`pipeline/README.md`) regenerates. The font's figures, the contrasts and the widths are
those of `investigations/site-style.md`, the results those of `investigations/data-sources.md`
and `investigations/limits.md`.

## ADDED Requirements

### Requirement: The font

Every page SHALL set its text, its headings and its controls in Source Sans 3, from one file
served with the site: the font's Latin face, 28,872 bytes, which holds every character the site
writes and whose ten digits have one width (`investigations/site-style.md`, 2). Until the file has
loaded, and when it cannot be loaded, a page SHALL show its text in the system's sans-serif font,
and SHALL work as it does with the font.

#### Scenario: The font of the pages

- **WHEN** a visitor opens `/de/`, `/fr/guide/` and `/it/votes/5960/`
- **THEN** the browser renders the heading and a paragraph of each, and the table and the buttons
  of the vote's page, in "Source Sans 3"
- **AND** each page requests one font file, from the site itself

#### Scenario: A font that cannot be loaded

- **WHEN** the font's file cannot be loaded and a visitor opens `/de/votes/5960/`
- **THEN** the browser renders the page's text in its sans-serif font, and the map, the limits and
  the result work as they do with the font

### Requirement: The colours of the light scheme

Unless the browser prefers a dark colour scheme, every page SHALL show its text in `#1c1c1c` on
`#ffffff`; a vote's date and kind, and sources and notes, in `#595959`; links and the ring of a
focused control in `#1a5fb4`; the cantonal votes of a majority that is not needed in `#767676`.
Every text SHALL have at least 4.5:1 against the colour behind it, text of at least 24 pixels, or
of 18.66 bold, at least 3:1 (WCAG 2.2, 1.4.3; `investigations/site-style.md`, 3).

#### Scenario: The contrast of every text

- **WHEN** a visitor opens the start page, the guide, and `/votes/5960/` with the upper bound of
  "Ausländeranteil" at step 327, in each of the three languages
- **THEN** a paragraph is `#1c1c1c` on `#ffffff`, a link `#1a5fb4`, and every text has at least
  4.5:1 against the colour behind it, or 3:1 where it is large

#### Scenario: A majority that is not needed

- **WHEN** a visitor opens `/de/votes/5950/`, a vote that needs only the majority of voters
- **THEN** the Ständemehr reads "nicht nötig" in `#1c1c1c`, and its cantonal votes are `#767676`,
  4.54:1 on `#ffffff`

### Requirement: The dark scheme

When the browser prefers a dark colour scheme, every page SHALL show its text in `#e8e8e8` on
`#121212`; a vote's date and kind, and sources and notes, in `#b0b0b0`; links and the ring of a
focused control in `#8ab4f8`; the cantonal votes of a majority that is not needed in `#9a9a9a`,
with the contrasts of the light scheme. A page SHALL follow the browser when its preference
changes, keeping its state. It SHALL offer no switch of its own and store nothing.

#### Scenario: A dark page

- **WHEN** a visitor whose browser prefers a dark colour scheme opens the start page, the guide,
  and `/votes/5960/` with the upper bound of "Ausländeranteil" at step 327, in each of the three
  languages
- **THEN** a paragraph is `#e8e8e8` on `#121212`, a link `#8ab4f8`, and every text has at least
  4.5:1 against the colour behind it, or 3:1 where it is large

#### Scenario: The preference changes on an open page

- **WHEN** a visitor on `/de/votes/5960/` moves the upper bound of "Ausländeranteil" to step 327
  and then sets the browser to prefer a dark colour scheme
- **THEN** the page turns dark without loading anew, the bound stays at step 327, and "Mit Ihrer
  Auswahl" still shows "Angenommen" (`investigations/limits.md`, 5)

#### Scenario: Nothing stored

- **WHEN** a visitor opens the start page in the dark scheme and in the light scheme
- **THEN** the page offers no switch between them, and writes no cookie and nothing to the
  browser's storage

### Requirement: The verdicts in the map's colours

Wherever a page writes a verdict, it SHALL write a yes ("Ja", "Angenommen") in `#007260` and a no
("Nein", "Abgelehnt") in `#934319`, the darkest class of each side on the map; in the dark scheme
in `#4bc1ad` and `#e5946f`, the map's class 2. This SHALL hold in each language for the verdict
boxes, the outcome, the result of a selection, the table of the cantons, the bar of a narrow
window and the start page's list. "nicht nötig" and a tie-break question's figures keep the text's
colour.

#### Scenario: The vote of 2016-02-28

- **WHEN** a visitor opens `/de/votes/5960/`
- **THEN** the Volksmehr's "Nein", with "49.16%", and the outcome "Abgelehnt" are `#934319`; the
  Ständemehr's "Ja", with "16½ : 6½", is `#007260`; and the row of ZH in the table of the cantons
  reads "Nein" in `#934319` (`investigations/data-sources.md`, "Reference data for the
  calculation")
- **AND** the start page's entry of that vote writes "abgelehnt" in `#934319`

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
working title "Popular Vote Explorer", linked to the start page in the page's language; the guide,
"Lesehilfe", "Guide de lecture" or "Guida alla lettura", linked to the guide in that language;
and the three languages of the switch (the `interface-languages` capability). On the start page
the title, and on the guide its name, SHALL NOT be links. A page that redirects has no head.

#### Scenario: On a vote's page

- **WHEN** a visitor opens `/fr/votes/5960/`
- **THEN** before the page's heading, its head shows "Popular Vote Explorer", linked to `/fr/`,
  "Guide de lecture", linked to `/fr/guide/`, and "Deutsch", "Français" and "Italiano"

#### Scenario: On the start page and the guide

- **WHEN** a visitor opens `/de/` and `/de/guide/`
- **THEN** on `/de/` "Popular Vote Explorer" in the head is not a link and "Lesehilfe" links to
  `/de/guide/`; on `/de/guide/` "Popular Vote Explorer" links to `/de/` and "Lesehilfe" is not a
  link

#### Scenario: The head in a narrow window

- **WHEN** a visitor opens `/it/votes/5960/` in a window 360 pixels wide
- **THEN** the head is no wider than the window, and none of its words is broken

### Requirement: The width of a page

A page SHALL fill its window, less 16 pixels at each side, with no limit on its width. A
paragraph of text SHALL be at most 40rem wide, 640 pixels at the browser's default text size. The
map, its panel and the tables keep the room the window gives them.

#### Scenario: A wide window

- **WHEN** a visitor opens `/de/votes/5960/` in a window 1,920 pixels wide
- **THEN** the head and the heading begin 16 pixels from the window's left edge, the map is 1,552
  pixels wide, give or take 1, with the panel beside it, and the sentence at the limits is at
  most 640 pixels wide (`investigations/site-style.md`, 5)

#### Scenario: A narrow window

- **WHEN** a visitor opens `/de/` in a window 360 pixels wide
- **THEN** the head and the list begin 16 pixels from the window's left edge and end at least 16
  pixels from its right edge

### Requirement: The controls

Every control a page shows, its buttons, lists, switches and a limit's sliders, SHALL be drawn in
the colours of the page's scheme. Its border or fill SHALL have at least 3:1 against the colour
behind it, its text at least 4.5:1, and, when focused from the keyboard, it SHALL show a ring of 2
pixels in the colour of links (WCAG 2.2, 1.4.11). A control that cannot be used is exempt.

#### Scenario: The controls in both schemes

- **WHEN** a visitor opens `/de/votes/5960/`, adds the limit "Ausländeranteil" and moves its upper
  bound to step 327, in the light and in the dark scheme
- **THEN** the borders or fills of "+", "−", "Ganze Schweiz", the list, "Entfernen", "Zurück zum
  echten Ergebnis", the switch's box, the track and both thumbs have at least 3:1 against the
  colour behind them, and their texts at least 4.5:1

#### Scenario: A control focused from the keyboard

- **WHEN** a visitor on `/de/votes/5960/` presses the Tab key until "Ganze Schweiz" has the focus,
  in the light and in the dark scheme
- **THEN** a ring 2 pixels wide surrounds it, `#1a5fb4` in the light scheme and `#8ab4f8` in the
  dark one
