# limits Specification

## Purpose

Limits on the characteristics of the municipalities, and the selection they make: which
municipalities and which Swiss abroad remain, so that a vote's result can be recalculated as if
only they had voted.

A limit acts on the characteristics of the `characteristics` capability, which the pipeline's
update command (`pipeline/README.md`) writes to `app/static/data/characteristics.json` from BFS
STAT-TAB tables, the BFS register's correspondences and swisstopo's swissBOUNDARIES3D, on the
list of 2026-01-01. The selection keeps entries of the vote's file (the `vote-data` capability:
the BFS vote-day files, on the same list, written by the same command); the `result-calculation`
capability calculates the result from those that remain. The figures in the scenarios are those
of `investigations/limits.md`.

## Requirements

### Requirement: The limits on a vote's page

For every vote the calculation judges, the vote's page SHALL show a section headed "Gemeinden
auswählen" with the sentence of the reading guide, the number of municipalities that remain, the
limits added, the button "Merkmal hinzufügen", the switch for the Swiss abroad and, while there
is something to undo, the button back to the real result: right of the result and the map in a
window at least 1,024 pixels wide, between them in a narrower one. A tie-break question's page
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
- **THEN** "Gemeinden auswählen" stands below the result and above the map, which stands above
  "Merkmale der Gemeinde", and is as wide as the result (`investigations/redesign.md`, "Found
  after the merge")

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

### Requirement: The track of a limit

A limit's track SHALL have 1,000 steps, from the smallest to the largest value, as the panel
writes values, of the municipalities of the list that have a figure, for the figures that apply
to the vote. Each step's value SHALL be rounded half up to the last digit the panel writes. The
track of the inhabitants, the inhabitants per km², the jobs per 100 inhabitants, the area, the
cattle per inhabitant and the farms per 1,000 inhabitants SHALL be logarithmic, the others
linear.

#### Scenario: A linear track

- **WHEN** a visitor adds the limit "Ausländeranteil" on `/votes/5960/` and moves its upper
  bound to step 327, then to step 328
- **THEN** the limit reads "von 0.00% bis 19.98%", then "von 0.00% bis 20.04%"
  (`investigations/limits.md`, 4)

#### Scenario: A logarithmic track

- **WHEN** a visitor adds the limit "Einwohner" on `/votes/5960/` and moves its lower bound to
  step 500
- **THEN** the limit reads "Einwohner (Ende 2015): von 3'508 bis 396'955"
  (`investigations/limits.md`, 4)

#### Scenario: The two new logarithmic tracks

- **WHEN** a visitor adds the limits "Arbeitsplätze je 100 Einwohner" and
  "Landwirtschaftsbetriebe je 1'000 Einwohner" on `/de/votes/5960/` and moves the lower bound of
  each to step 500
- **THEN** they read "Arbeitsplätze je 100 Einwohner (Ende 2015): von 48.1 bis 445.5" and
  "Landwirtschaftsbetriebe je 1'000 Einwohner (2015): von 4.6 bis 210.5", far below the middle
  of their values (`investigations/more-characteristics.md`, 12)

### Requirement: A logarithmic track

From one step to the next, the value of a logarithmic track SHALL grow by the same factor. When
its smallest value is 0, step 0 SHALL be 0, and the steps from 1 to 1,000 SHALL run by equal
factors from the smallest value above zero to the largest.

#### Scenario: Cattle, with municipalities at zero

- **WHEN** a visitor adds the limit "Rinder je Einwohner" on `/votes/5960/` and moves its upper
  bound to step 1, then to step 500
- **THEN** the limit reads "Rinder je Einwohner (2015): von 0.000 bis 0.001", then "von 0.000 bis
  0.090" (`investigations/limits.md`, 4)

### Requirement: The two bounds

Each limit SHALL have two sliders on its track, named "Untere Grenze: <name>" and "Obere Grenze:
<name>" for assistive technology, whose thumbs a pointer or a finger drags and the arrow keys move,
one step per arrow key. The lower bound SHALL NOT pass the upper one: a slider moved beyond the other SHALL
stop at the other's step.

#### Scenario: A step by key

- **WHEN** a visitor adds the limit "Ausländeranteil" on `/votes/5960/`, focuses "Obere Grenze:
  Ausländeranteil" and presses the left arrow key once
- **THEN** the limit reads "von 0.00% bis 61.04%", the value of step 999

#### Scenario: The bounds do not cross

- **WHEN** a visitor moves the upper bound of "Ausländeranteil" to step 327 and then drags its
  lower bound to the end of the track
- **THEN** the lower bound stops at step 327, and the limit reads "von 19.98% bis 19.98%"

### Requirement: The label of a limit

Each limit SHALL read "<name> (<date>): von <lower bound> bis <upper bound>": the name the
panel gives its characteristic; the date of its figures ("Ende <year>" for the population, those
born abroad and the jobs, "Nationalratswahl <year>", "Volkszählung 2000", the year of the area,
of the cattle and of the farms); and both bounds written as the panel writes the
characteristic's values.

#### Scenario: Labels of a vote

- **WHEN** a visitor opens `/votes/6400/` and adds the limits "SVP", "Italienisch" and "Fläche"
- **THEN** they read "SVP (Nationalratswahl 2019): von 0.00% bis 84.11%", "Italienisch
  (Volkszählung 2000): von 0.00% bis 96.84%" and "Fläche (2026): von 0.32 km² bis 438.61 km²"
  (`investigations/limits.md`, 4 and 5)

#### Scenario: Labels of the new characteristics

- **WHEN** a visitor opens `/de/votes/5960/` and adds the limits "Hochschule oder höhere
  Berufsbildung" and "Bio-Anteil der landwirtschaftlichen Nutzfläche"
- **THEN** they read "Hochschule oder höhere Berufsbildung (Volkszählung 2000): von 0.00% bis
  49.69%" and "Bio-Anteil der landwirtschaftlichen Nutzfläche (2015): von 0.00% bis 100.00%"

### Requirement: One definition for a limit

A limit's name, date, track, label and the values it compares SHALL all come from the one
definition of its characteristic (the `characteristics` capability), for the figures that apply to
the vote; no part of a limit SHALL take them from another characteristic.

#### Scenario: The elderly are the elderly

- **WHEN** a visitor adds the limit "65 Jahre und älter" on `/votes/5960/`
- **THEN** it reads "65 Jahre und älter (Ende 2015): von 5.81% bis 36.16%", the range of the
  shares aged 65 and over, not "von 2.04% bis 35.96%", that of the shares aged 0–17
  (`investigations/limits.md`, 5; failure mode 5 of the predecessor)

### Requirement: Which municipalities remain

A limit SHALL be narrowed when the value of one of its bounds lies above the smallest or below the
largest value of its track. A municipality SHALL remain when, for every narrowed limit, its value
as the panel writes it lies within both bounds, each bound included. A narrowed limit SHALL set
aside a municipality that has no figure for its characteristic; a limit that is not narrowed
SHALL set nothing aside. A municipality's entry remains when the municipality remains.

#### Scenario: A bound is included

- **GIVEN** three municipalities whose values are 10.00%, 20.00% and 30.01%
- **WHEN** a limit on them runs from 10.00% to 30.00%
- **THEN** the first two remain and the third is set aside

#### Scenario: Without a figure

- **WHEN** a visitor opens `/votes/6400/`, adds the limit "SVP", and moves its upper bound from
  step 1,000, 84.11%, to step 999, 84.03%
- **THEN** 422 Rüti bei Lyssach, which has 30 yes and 35 no votes and no party figure, remains
  at step 1,000 and is set aside at step 999, together with 932 Horrenbach-Buchen, the
  municipality with 84.11% (`investigations/limits.md`, 2 and 5)

#### Scenario: Several limits at once

- **WHEN** a visitor opens `/votes/5960/` and moves the lower bounds of "Deutsch" and
  "Französisch" each to step 1,000, 100.00% and 99.78%
- **THEN** no municipality remains

#### Scenario: A step that keeps the end's value

- **WHEN** a visitor opens `/votes/5960/`, adds the limit "Einwohner" and moves its lower bound to
  step 1, whose value is still 31, the smallest (`investigations/limits.md`, 5)
- **THEN** the limit is not narrowed: the page shows no "Mit Ihrer Auswahl" and no municipality
  in dark grey

### Requirement: The Swiss abroad

The section SHALL have a switch "Auslandschweizerinnen und Auslandschweizer mitzählen (in jedem
Kanton, in dem eine Gemeinde übrig ist)", on when the page opens. While it is on, the entry of a
canton's Swiss abroad SHALL remain when at least one municipality's entry of that canton remains.
While it is off, no entry of Swiss abroad SHALL remain.

#### Scenario: Switched off

- **WHEN** a visitor opens `/votes/5950/` and switches the Swiss abroad off
- **THEN** the selection's result has 1,107,734 yes and 1,113,998 no votes, 49.86%, and the
  outcome "Abgelehnt", while the vote's own result stays 1,128,522 yes and 1,124,873 no votes,
  50.08%, "Angenommen" (`investigations/limits.md`, 1 and 5; BBl 2015 6313)

#### Scenario: A canton with nothing left loses its Swiss abroad

- **WHEN** a visitor opens `/votes/5960/` and moves the upper bound of "Ausländeranteil" to
  step 327, 19.98%, with the switch on
- **THEN** no municipality of BS remains, the Swiss abroad of BS are set aside, those of the 11
  other cantons that count them apart remain, and the cantonal votes read "18 : 4½"
  (`investigations/limits.md`, 5)

### Requirement: Recalculated at once

Every step of a slider, the switch, and every limit added or removed SHALL update the map, the
result of the selection and the table of the cantons at once, also while a slider is being
dragged, without a button to confirm.

#### Scenario: While dragging

- **WHEN** a visitor adds the limit "Ausländeranteil" on `/votes/5960/` and drags its upper bound
  from the end of the track to step 327 without releasing it
- **THEN** before the release the page shows "Mit Ihrer Auswahl" with the yes share "52.47%",
  and Zürich is dark grey on the map (`investigations/limits.md`, 5)

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

### Requirement: Back to the real result

While there is a limit or the switch is off, the section SHALL show a button "Zurück zum echten
Ergebnis". Pressing it SHALL remove every limit and turn the switch on, after which the page shows
the vote's result as without the section, and the button goes.

#### Scenario: Back from a selection

- **WHEN** a visitor on `/votes/5960/` adds the limits "Ausländeranteil" and "Einwohner", moves
  their bounds, switches the Swiss abroad off and presses "Zurück zum echten Ergebnis"
- **THEN** the page shows no limit, the switch on, no "Mit Ihrer Auswahl", no dark grey
  municipality, and no "Zurück zum echten Ergebnis"

### Requirement: Limits belong to the page

Opening a vote's page, also by a link from another vote's page, SHALL start with the selection its
address holds (the `share-link` capability), and with no limit and the switch on when its address
holds none.

#### Scenario: To another vote

- **WHEN** a visitor adds a limit on `/votes/5960/`, follows "Alle Abstimmungen" and opens
  `/votes/5670/`
- **THEN** that page shows no limit and the switch on

#### Scenario: A link with a selection

- **WHEN** a visitor opens `/de/votes/5960/#foreigners=-19.98&abroad=no`
- **THEN** the page shows the limit "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%" and the
  switch off

### Requirement: Limits wait for the characteristics

The limits SHALL use the characteristics the page loads for the panel, without loading them a
second time. Until they are loaded, the section SHALL show "Die Merkmale werden geladen …" in
place of its controls. When they cannot be loaded, it SHALL show "Ohne die Merkmale lassen sich
keine Gemeinden auswählen." and no control, and the page SHALL show everything else as without
the section.

#### Scenario: The characteristics' file is missing

- **GIVEN** a browser in which every request for `data/characteristics.json` fails
- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the section shows "Ohne die Merkmale lassen sich keine Gemeinden auswählen.", no
  "Merkmal hinzufügen", and the page shows the figures, the verdicts, the map and the table of
  the cantons

### Requirement: The budget of the limits

Of the frames the browser draws after a step of a slider, by pointer or by key, at least nine in
ten of a measurement SHALL take at most 16 ms of work on the page's main thread, and none more
than 50 ms. Each frame after opening the list, adding or removing a limit, the switch or "Zurück
zum echten Ergebnis" SHALL take at most 50 ms. The browser tests measure them as they measure the
map's budget, and once more when a measurement exceeds it.

#### Scenario: Dragging a bound

- **WHEN** the browser tests open `/votes/5960/`, wait until the characteristics have loaded, add
  the limit "Einwohner" and drag its lower bound by pointer across the whole track and back
- **THEN** at least nine in ten of the frames after these steps took at most 16 ms of work on
  the main thread and none more than 50 ms, in the first measurement or, when it exceeded this, in the second
  (`investigations/redesign.md`, "Found after the merge")

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
- **THEN** at least nine in ten of the frames after these steps took at most 16 ms of work on
  the main thread and none more than 50 ms, in the first measurement or, when it exceeded this, in the second
  (`investigations/redesign.md`, 4: 8.5 ms with the drawings added to today's page)

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

#### Scenario: A bar with one municipality

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Einwohner"
- **THEN** its last bar, with Zürich alone where the fullest bar holds 146, is a fiftieth as tall
  as the fullest: a bar that holds a municipality is at least that tall, so that it is seen
  (`investigations/redesign.md`, "Output" of `hist.mjs`)

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
