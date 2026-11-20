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

For every vote the calculation judges, the vote's page SHALL show, below the outcome and above
the map, a section headed "Gemeinden auswählen" with the sentence of the reading guide, a list
"Merkmal hinzufügen", the limits added from it, the switch for the Swiss abroad, the number of
municipalities that remain and, while there is something to undo, the button back to the real
result. The page of a tie-break question SHALL show no such section.

#### Scenario: The section of a vote

- **WHEN** a visitor opens `/votes/5960/` and the characteristics have loaded
- **THEN** below "Abgelehnt" and above "Karte der Gemeinden" the page shows "Gemeinden
  auswählen", the list "Merkmal hinzufügen", no limit, and the switch for the Swiss abroad, on

#### Scenario: No section for a tie-break question

- **WHEN** a visitor opens `/votes/6823/`
- **THEN** the page shows no "Gemeinden auswählen"

### Requirement: Adding and removing a limit

The list "Merkmal hinzufügen" SHALL offer, by the names the panel of characteristics gives them
and in its order, each of the 21 characteristics that has no limit yet. Choosing one and pressing
"Hinzufügen" SHALL add its limit after those already added, with both bounds at the ends of its
track; choosing alone SHALL add nothing. Each limit SHALL have a button "Entfernen" that removes
it, after which the list offers its characteristic again.

#### Scenario: Adding a limit

- **WHEN** a visitor opens `/votes/5960/`, chooses "Ausländeranteil" in "Merkmal hinzufügen" and
  presses "Hinzufügen"
- **THEN** the page shows the limit "Ausländeranteil (Ende 2015): von 0.00% bis 61.10%", and the
  list offers the other 20 characteristics but not "Ausländeranteil"

#### Scenario: The keyboard only chooses

- **WHEN** a visitor opens `/votes/5960/`, focuses "Merkmal hinzufügen" and presses the down arrow
  key twice
- **THEN** the page shows no limit and the list shows "Ausländeranteil"; pressing "Hinzufügen"
  adds its limit

#### Scenario: Removing it

- **WHEN** the visitor then presses its "Entfernen"
- **THEN** the page shows no limit, and the list offers all 21 characteristics again

### Requirement: The track of a limit

A limit's track SHALL have 1,000 steps, from the smallest to the largest value, as the panel
writes values, of the municipalities of the list that have a figure, for the figures that apply
to the vote. Each step's value SHALL be rounded half up to the last digit the panel writes. The
track of the inhabitants, the inhabitants per km², the area and the cattle per inhabitant SHALL be
logarithmic, the others linear.

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
panel gives its characteristic; the date of its figures ("Ende <year>" for the population,
"Nationalratswahl <year>", "Volkszählung 2000", the year of the area and of the cattle); and both
bounds written as the panel writes the characteristic's values.

#### Scenario: Labels of a vote

- **WHEN** a visitor opens `/votes/6400/` and adds the limits "SVP", "Italienisch" and "Fläche"
- **THEN** they read "SVP (Nationalratswahl 2019): von 0.00% bis 84.11%", "Italienisch
  (Volkszählung 2000): von 0.00% bis 96.84%" and "Fläche (2026): von 0.32 km² bis 438.61 km²"
  (`investigations/limits.md`, 4 and 5)

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
`vote-list` capability writes counts. When none remains, it SHALL say "Keine Gemeinde mit eigenem
Ergebnis ist übrig." instead.

#### Scenario: No limit

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the section says "In der Auswahl: 2'103 von 2'103 Gemeinden mit eigenem Ergebnis."

#### Scenario: A limit

- **WHEN** a visitor moves the upper bound of "Ausländeranteil" on `/votes/5960/` to step 327
- **THEN** it says "In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis."
  (`investigations/limits.md`, 5)

#### Scenario: Nothing remains

- **WHEN** a visitor moves the lower bounds of "Deutsch" and "Französisch" on `/votes/5960/`
  each to step 1,000
- **THEN** it says "Keine Gemeinde mit eigenem Ergebnis ist übrig."

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

Each frame the browser draws after a step of a slider, by pointer or by key, SHALL take at most
16 ms of work on the page's main thread. Each frame after adding or removing a limit, the switch or
"Zurück zum echten Ergebnis" SHALL take at most 50 ms. The browser tests
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
- **THEN** no frame after these inputs took more than 50 ms of work on the main thread, in the
  first measurement or, when a frame exceeded it, in the second
