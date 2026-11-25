# Spec Delta

## MODIFIED Requirements

### Requirement: The limits on a vote's page

For every vote the calculation judges, the vote's page SHALL show a section headed "Gemeinden
auswählen" with the sentence of the reading guide, the number of municipalities that remain, the
limits added, the button "Merkmal hinzufügen", the switch for the Swiss abroad and, while there
is something to undo, the button back to the real result: right of the result and the map in a
window at least 1,024 pixels wide, below the map in a narrower one. A tie-break question's page
SHALL show none.

#### Scenario: The section of a vote

- **WHEN** a visitor opens `/votes/5960/` in a window 1,280 pixels wide and the characteristics
  have loaded
- **THEN** to the right of the map, its top level with the result's, the page shows "Gemeinden
  auswählen", the button "Merkmal hinzufügen", no limit, and the switch for the Swiss abroad, on

#### Scenario: No section for a tie-break question

- **WHEN** a visitor opens `/votes/6823/`
- **THEN** the page shows no "Gemeinden auswählen"

#### Scenario: The section in a narrow window

- **WHEN** a visitor opens `/de/votes/5960/` in a window 1,023 pixels wide, and in one 360 wide
- **THEN** "Gemeinden auswählen" stands below the map and above "Merkmale der Gemeinde", as wide
  as the result (`investigations/redesign.md`, 6)

### Requirement: Adding and removing a limit

"Merkmal hinzufügen" SHALL open a list headed so, with "Schliessen" and each of the 35
characteristics that has no limit yet, by the panel's names, in its order, under the panel's
headings without their dates. Choosing one SHALL add its limit after those already added, both
bounds at the ends of its track, and close the list; "Schliessen" and the Escape key SHALL close
it and add nothing. Each limit SHALL have a button "Entfernen" that removes it; the list then
offers its characteristic again.

#### Scenario: Adding a limit

- **WHEN** a visitor opens `/votes/5960/`, presses "Merkmal hinzufügen" and chooses
  "Ausländeranteil"
- **THEN** the list closes, the page shows the limit "Ausländeranteil (Ende 2015): von 0.00% bis
  61.10%", and the list, opened again, offers the other 34 characteristics but not
  "Ausländeranteil"

#### Scenario: The keyboard only chooses

- **WHEN** a visitor opens `/votes/5960/`, focuses "Merkmal hinzufügen", presses the Enter key,
  and presses the Tab key until "Ausländeranteil" has the focus
- **THEN** the list is open and the page shows no limit; pressing the Enter key adds the limit of
  "Ausländeranteil", closes the list, and "Merkmal hinzufügen" has the focus again

#### Scenario: Removing it

- **WHEN** the visitor then presses its "Entfernen"
- **THEN** the page shows no limit, and the list offers all 35 characteristics again

#### Scenario: The headings of the list

- **WHEN** a visitor opens the list "Merkmal hinzufügen" on `/de/votes/5960/`
- **THEN** its entries stand under the headings "Bevölkerung" (9 entries), "Nationalratswahl"
  (7), "Hauptsprache" (4), "Religion" (3), "Ausbildung" (2), "Wohnen" (2), "Arbeit" (4) and
  "Fläche und Landwirtschaft" (4), in this order

#### Scenario: A heading without an entry left

- **WHEN** a visitor on `/de/votes/5960/` adds the limits "Hochschule oder höhere Berufsbildung"
  and "Obligatorische Schule oder keine Ausbildung"
- **THEN** the list has no heading "Ausbildung" until one of the two limits is removed

#### Scenario: New characteristics with their tracks

- **WHEN** a visitor on `/de/votes/5960/` adds the limits "Im Ausland geboren" and "Arbeitsplätze
  je 100 Einwohner"
- **THEN** they read "Im Ausland geboren (Ende 2015): von 0.00% bis 66.13%" and "Arbeitsplätze je
  100 Einwohner (Ende 2015): von 5.2 bis 445.5" (`investigations/more-characteristics.md`, 12)

#### Scenario: Closing the list without choosing

- **WHEN** a visitor on `/de/votes/5960/` presses "Merkmal hinzufügen" and then the Escape key,
  and again "Merkmal hinzufügen" and then "Schliessen"
- **THEN** each time the list closes, the page shows no limit, and "Merkmal hinzufügen" has the
  focus

#### Scenario: Every characteristic has its limit

- **WHEN** a visitor opens `/de/votes/5960/` with a link that holds all 35 characteristics
- **THEN** "Merkmal hinzufügen" cannot be pressed

### Requirement: The number of municipalities that remain

The section SHALL say "In der Auswahl: <n> von <m> Gemeinden mit eigenem Ergebnis.", with <m> the
municipalities that have an entry in the vote and <n> those of them that remain, written as the
`vote-list` capability writes counts, and below it a bar filled to <n> of <m>. When none remains,
it SHALL say "Keine Gemeinde mit eigenem Ergebnis ist übrig." instead, the bar empty.

#### Scenario: No limit

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the section says "In der Auswahl: 2'103 von 2'103 Gemeinden mit eigenem Ergebnis.",
  and its bar is full

#### Scenario: A limit

- **WHEN** a visitor moves the upper bound of "Ausländeranteil" on `/votes/5960/` to step 327
- **THEN** it says "In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis.", and its bar
  is filled to 69.2% of its width, give or take 1 pixel (`investigations/limits.md`, 5)

#### Scenario: Nothing remains

- **WHEN** a visitor moves the lower bounds of "Deutsch" and "Französisch" on `/votes/5960/`
  each to step 1,000
- **THEN** it says "Keine Gemeinde mit eigenem Ergebnis ist übrig.", and its bar is empty

### Requirement: The budget of the limits

Each frame the browser draws after a step of a slider, by pointer or by key, SHALL take at most
16 ms of work on the page's main thread. Each frame after opening the list, adding or removing a
limit, the switch or "Zurück zum echten Ergebnis" SHALL take at most 50 ms. The browser tests
measure them as they measure the map's budget, and once more when a frame exceeds it.

#### Scenario: Dragging a bound

- **WHEN** the browser tests open `/votes/5960/`, wait until the characteristics have loaded, add
  the limit "Einwohner" and drag its lower bound by pointer across the whole track and back
- **THEN** no frame after these steps took more than 16 ms of work on the main thread, in the
  first measurement or, when a frame exceeded it, in the second

#### Scenario: Jumps

- **WHEN** the browser tests, on `/votes/5960/`, add the limit "Ausländeranteil", move its upper
  bound to step 327, add the limit "Einwohner", switch the Swiss abroad off and on, remove the
  limit "Einwohner" and press "Zurück zum echten Ergebnis"
- **THEN** no frame after these inputs, the opening of the list and the choice in it included,
  took more than 50 ms of work on the main thread, in the first measurement or, when a frame
  exceeded it, in the second

#### Scenario: Dragging with five limits and a municipality clicked

- **WHEN** the browser tests, on `/de/votes/5960/`, click Köniz, add five limits and drag the
  lower bound of "Einwohner" across the whole track and back
- **THEN** no frame after these steps took more than 16 ms of work on the main thread, in the
  first measurement or, when a frame exceeded it, in the second
  (`investigations/redesign.md`, 4: 8.5 ms with the drawings added to today's page)

## ADDED Requirements

### Requirement: Where the municipalities lie on a track

Above its track, each limit SHALL show 50 bars side by side, each for 20 steps of the track, the
last with step 1,000, as tall as the number of municipalities in it against the fullest bar's. A
municipality with a figure SHALL count at the lowest step whose value is not below its own; one
without a figure in no bar. The part of the bars between the two bounds SHALL be in the text's
colour, the rest in `#8c8c8c`, `#6e6e6e` in the dark scheme, following each step.

#### Scenario: The foreigners of 2015

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Ausländeranteil"
- **THEN** above its track stand 50 bars, all in the text's colour; the ninth, of steps 160 to
  179, is the tallest, with 140 municipalities, and the first has 10
  (`investigations/redesign.md`, "Output" of `hist.mjs`)
- **AND** Zürich, with 32.03%, counts in the bar of steps 520 to 539, as step 525, 32.08%, is the
  lowest whose value is not below it

#### Scenario: Between the bounds

- **WHEN** that visitor moves the upper bound to step 327
- **THEN** the bars are in the text's colour from their left end to 32.7% of their width, give or
  take 1 pixel, and `#8c8c8c` beyond

#### Scenario: A logarithmic track

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Einwohner"
- **THEN** the tallest bar is the 21st, of steps 400 to 419, with 146 municipalities
  (`investigations/redesign.md`, "Output" of `hist.mjs`)

#### Scenario: Municipalities without a figure

- **WHEN** a visitor on `/de/votes/6400/` adds the limit "SVP"
- **THEN** its bars count 2,104 municipalities: the six without a party figure in the election of
  2019 are in none (`investigations/limits.md`, 5)

### Requirement: The municipality last clicked on a track

While a municipality is the one last clicked or tapped (the `result-map` capability), each limit
SHALL show below its track a mark at that municipality's step, with its name as its details write
it and its value as the panel writes it. Before a click or a tap, and for a municipality without
a figure for the limit's characteristic, a limit SHALL show no mark.

#### Scenario: Köniz on two tracks

- **WHEN** a visitor on `/de/votes/5960/` adds the limits "Ausländeranteil" and "Einwohner" and
  clicks Köniz
- **THEN** below the first track stands "Köniz (BE): 18.02%" with its mark 29.5% along the bars
  above the track, where a thumb at its step would stand, and below the second "Köniz (BE):
  40'214" with its mark 75.8% along them, each give or take 1 pixel
  (`investigations/redesign.md`, "Output" of `hist.mjs`: steps 295 and 758)

#### Scenario: Before a click

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Ausländeranteil" without clicking a
  municipality
- **THEN** the limit shows no mark

#### Scenario: Another municipality

- **WHEN** a visitor with the limit "Einwohner" on `/de/votes/5960/` clicks Zürich and then Bern
- **THEN** the mark reads "Zürich (ZH): 396'955" at the end of the track, and then "Bern (BE):
  131'554"

#### Scenario: A municipality without a figure

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "SVP" and clicks Meienried, which has no
  election result
- **THEN** the limit shows no mark
