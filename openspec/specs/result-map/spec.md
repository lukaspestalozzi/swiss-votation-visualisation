# result-map Specification

## Purpose

The map of a vote on its page: every municipality coloured by how strongly it said yes or no,
with the cantons and the lakes, which a visitor can zoom, move and point at to read a
municipality's result.

The map draws the data file `app/static/data/map.json` (the `municipalities` capability: the
boundaries of the BFS register of municipalities and the lakes of the BFS ThemaKart set 2026, on
the list of 2026-01-01) with the names of `app/static/data/municipalities.json`. It colours each
municipality from the vote's file of entries (the `vote-data` capability: the BFS vote-day
files, on the same list). The pipeline's update command (`pipeline/README.md`) regenerates
these files. The figures in the scenarios are those of `investigations/map-data.md`.

## Requirements

### Requirement: A map on the page of a vote

For every vote the calculation judges, the vote's page SHALL show, below the outcome and above
the table of the cantons, a map under the heading "Karte der Gemeinden" with every municipality
of the list of municipalities. The page of a tie-break question SHALL show no map.

#### Scenario: The map of a vote

- **WHEN** a visitor opens `/votes/5960/` and the map has loaded
- **THEN** below "Abgelehnt" and above the table of the cantons the page shows "Karte der
  Gemeinden" and a map with 2,110 municipalities

#### Scenario: No map for a tie-break question

- **WHEN** a visitor opens `/votes/6823/`
- **THEN** the page shows no map and no "Karte der Gemeinden"

### Requirement: The colour classes

A municipality with an entry SHALL be coloured by the side with more votes, yes or no, and by
the class of that side's share of the municipality's yes and no votes: 1 below 60%, 2 from 60%
to below 70%, 3 from 70% to below 80%, 4 from 80%. The shares SHALL be compared exactly, from
the counts: a share of exactly 60% is in class 2.

#### Scenario: Named municipalities of 2016-02-28

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** 1 Aeugst am Albis (432 yes, 550 no) is no, class 1; 261 Zürich (46,565 yes, 99,614
  no) is no, class 2; 351 Bern (15,928 yes, 41,756 no) is no, class 3; and 946 Wachseldorn (95
  yes, 25 no) is yes, class 3 (`investigations/map-data.md`, "Municipal figures")

#### Scenario: Shares on the boundary of a class

- **WHEN** a visitor opens `/votes/5960/` and `/votes/6650/`
- **THEN** 29 Flurlingen (272 yes, 408 no, exactly 60% no) is no, class 2; 2702 Bettingen (324
  yes, 216 no, exactly 60% yes) is yes, class 2; and in vote 6650, 5761 Romainmôtier-Envy (200
  yes, 50 no, exactly 80% yes) is yes, class 4 (`investigations/map-data.md`)

#### Scenario: The clearest classes

- **WHEN** a visitor opens `/votes/6650/`
- **THEN** 6745 Les Enfers (61 yes, 3 no) is yes, class 4, and 1211 Isenthal (39 yes, 161 no)
  is no, class 4 (`investigations/map-data.md`)

### Requirement: The colours of the classes

The classes SHALL have these colours, from class 1 to class 4: for no `#fbbea3`, `#e5946f`,
`#c2673b`, `#934319`; for yes `#92dfd0`, `#4bc1ad`, `#009c86`, `#007260`. Between the same class
of yes and of no, the colours differ by a Delta E (OKLab, times 100) of at least 6.9 for a
viewer with a red-green colour vision deficiency, as `investigations/map-data.md` measures.

#### Scenario: The colour of a municipality

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** 261 Zürich is filled with `#e5946f`, 351 Bern with `#c2673b` and 946 Wachseldorn
  with `#009c86`

### Requirement: As many yes as no votes

A municipality with an entry whose yes votes equal its no votes, also when both are zero, SHALL
be filled with `#f0efec`, the colour of neither side.

#### Scenario: A tie in a municipality

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** 1703 Hünenberg (2,111 yes, 2,111 no) is filled with `#f0efec`
  (`investigations/map-data.md`)

### Requirement: A municipality without a result

A municipality that the vote's file names as without a result SHALL be hatched with grey
diagonal lines on white, and SHALL take no colour of a class.

#### Scenario: The municipalities without a result in 2016

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the seven municipalities the vote's file names as without a result, among them 389
  Meienried, are hatched, and no other municipality is

### Requirement: The legend

The map SHALL show a legend with the colour of each class and side, from "Nein: 80% und mehr",
"Nein: 70–80%", "Nein: 60–70%" and "Nein: 50–60%" to "Ja: 50–60%", "Ja: 60–70%", "Ja: 70–80%"
and "Ja: 80% und mehr", followed by "Gleich viele Ja wie Nein" and "Kein eigenes Ergebnis" with
the hatching.

#### Scenario: The legend of a vote

- **WHEN** a visitor opens `/votes/5960/` and the map has loaded
- **THEN** the legend shows these ten entries in this order, each with its colour or the
  hatching

### Requirement: The cantons and the lakes

The map SHALL draw the borders of the 26 cantons over the municipalities, and the 37 lakes in
`#9fb8e8`, whole, also where they reach past the national border. Inside the outline of
Switzerland, any area that no municipality covers SHALL show the colour of the lakes.

#### Scenario: Cantons and lakes on the map

- **WHEN** a visitor opens `/votes/5960/` and the map has loaded
- **THEN** the map shows the borders of 26 cantons and 37 lakes, among them the Zürichsee and
  the Lago Maggiore, whose southern end lies outside Switzerland

### Requirement: Pointing at a municipality

Pointing at a municipality, or clicking or tapping it, SHALL show its details, and only its
own: its name, followed by its canton's abbreviation in brackets unless the name already ends
with it; then "Ja-Anteil: ", "Ja-Stimmen: " and "Nein-Stimmen: " with its figures, written as
the `vote-list` capability writes them. Pointing at no municipality SHALL show no details.

#### Scenario: The details of a municipality

- **WHEN** a visitor opens `/votes/5960/` and points at Zürich
- **THEN** the map shows "Zürich (ZH)", "Ja-Anteil: 31.85%", "Ja-Stimmen: 46'565" and
  "Nein-Stimmen: 99'614" (`investigations/map-data.md`)

#### Scenario: A name that holds its canton

- **WHEN** a visitor opens `/votes/5960/` and points at the municipality 22
- **THEN** its details begin with "Benken (ZH)", not "Benken (ZH) (ZH)"

#### Scenario: Clicking instead of pointing

- **WHEN** a visitor opens `/votes/5960/` and clicks Bern without having pointed at it before
- **THEN** the map shows "Bern (BE)" with "Ja-Anteil: 27.61%"

#### Scenario: Pointing at a lake

- **WHEN** a visitor points at Zürich and then at the middle of the Zürichsee
- **THEN** the map shows no details

### Requirement: The details of a municipality without a result

For a municipality without a result, the details SHALL show its name as above and "Kein
eigenes Ergebnis: seine Stimmen sind mit denen einer anderen Gemeinde gezählt." instead of the
figures.

#### Scenario: Meienried in 2016

- **WHEN** a visitor opens `/votes/5960/` and points at Meienried
- **THEN** the map shows "Meienried (BE)" and "Kein eigenes Ergebnis: seine Stimmen sind mit
  denen einer anderen Gemeinde gezählt."

### Requirement: Zoom

The map SHALL first show the whole of Switzerland. The buttons "+" and "−" SHALL zoom in and
out by a factor of 2 around the centre of the view, and the mouse wheel over the map around the
point under the pointer, between the whole of Switzerland and 16 times. The button "Ganze
Schweiz" SHALL show the whole of Switzerland again. Borders SHALL keep their width on the
screen.

#### Scenario: Zooming in with the button

- **WHEN** a visitor presses "+" once
- **THEN** the map shows the area around the same centre, half as wide and half as high

#### Scenario: The limits of the zoom

- **WHEN** a visitor presses "+" five times, then "Ganze Schweiz", then "−" once
- **THEN** after the presses of "+" the map shows a sixteenth of the width of Switzerland, and
  after "Ganze Schweiz" and "−" it shows the whole of Switzerland

#### Scenario: Zooming with the wheel

- **WHEN** a visitor turns the mouse wheel away from them over Zürich
- **THEN** the map zooms in, and Zürich stays under the pointer within one pixel

### Requirement: Moving the map

Dragging the map SHALL move it with the pointer. The centre of the view SHALL stay inside the
smallest rectangle that holds Switzerland. A drag SHALL NOT show a municipality's details by
itself.

#### Scenario: Dragging the map

- **WHEN** a visitor zoomed in four times drags the map 100 pixels to the left
- **THEN** the map shows the area 100 pixels further east

#### Scenario: Dragging past the edge

- **WHEN** a visitor zoomed in twice drags the map far to the right, past the western border
- **THEN** the centre of the view stops at the western edge of the rectangle around
  Switzerland

### Requirement: The source of the map

Below the map the page SHALL name its source: "Kartengrundlage: © BFS, Gemeinden und Kantone am
<reference date>, Seen: ThemaKart <year>", with the reference date of the map's data, written
as the `vote-list` capability writes dates, and the year of the lakes' ThemaKart set.

#### Scenario: The source on 2026-11-15

- **GIVEN** the data files of 2026-11-15
- **WHEN** a visitor opens `/votes/5960/` and the map has loaded
- **THEN** the page shows "Kartengrundlage: © BFS, Gemeinden und Kantone am 1. Januar 2026,
  Seen: ThemaKart 2026"

### Requirement: The Swiss abroad

Below the map, for a vote with entries of Swiss abroad, the page SHALL say "Nicht auf der Karte:
die Stimmen der Auslandschweizerinnen und Auslandschweizer, die <n> Kantone getrennt zählen.",
with the number of the vote's entries of Swiss abroad.

#### Scenario: Twelve cantons in 2016

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the page shows "Nicht auf der Karte: die Stimmen der Auslandschweizerinnen und
  Auslandschweizer, die 12 Kantone getrennt zählen."

#### Scenario: Eleven cantons in 2013

- **WHEN** a visitor opens `/votes/5670/`
- **THEN** the sentence names 11 cantons

### Requirement: The map's data is loaded once

A vote's page SHALL hold the yes and the no votes of each municipality of the vote, written when
the site is built, and SHALL load no file under `/data/votes/`. The map's shapes
(`data/map.json`), the names (`data/municipalities.json`) and the characteristics
(`data/characteristics.json`) SHALL be loaded once: going from one vote's page to another SHALL
NOT load them again.

#### Scenario: From one vote to another

- **WHEN** a visitor opens `/votes/5960/`, follows the link to the start page, follows the link
  to `/votes/5670/`, and waits until each page has stopped loading
- **THEN** the browser requested `data/map.json`, `data/municipalities.json` and
  `data/characteristics.json` once each, and no file under `/data/votes/`

### Requirement: A map that cannot be loaded

When the map's shapes or the names cannot be loaded, the page SHALL show "Die Karte kann nicht
geladen werden." in place of the map, and SHALL show everything else as without the map.

#### Scenario: The map's file is missing

- **GIVEN** a browser in which every request for `data/map.json` fails
- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the page shows "Die Karte kann nicht geladen werden.", the figures, the verdicts and
  the table of the cantons

### Requirement: The figures fit the map

When the site is built, every municipality of the map SHALL be either one entry of each judged
vote or named by the vote's file as without a result, and every entry that is no Swiss abroad
SHALL be a municipality of the map. Otherwise the build SHALL fail and name the vote and the
municipality.

#### Scenario: A municipality of the map without figures

- **GIVEN** a vote's file that has no entry for the municipality 261 and does not name it as
  without a result
- **WHEN** the site is built
- **THEN** the build fails and names the vote and the municipality 261

### Requirement: The map's performance budget

Each frame the browser draws after a zoom step, a move of the map or pointing at a municipality
SHALL take at most 16 ms of work on the page's main thread: the handling of the input and the
drawing that follows, measured by the browser tests on the machine that runs them. Clicking a
municipality, which fills the panel, and the inputs that follow it SHALL take at most 50 ms per
frame, until a later change revisits this budget.

#### Scenario: Zooming, moving and pointing

- **WHEN** the browser tests zoom in four times, drag the map, and point at three municipalities
  on `/votes/5960/` once the characteristics have loaded
- **THEN** no frame after these inputs took more than 16 ms of work on the main thread

#### Scenario: Clicking municipalities

- **WHEN** the browser tests click three municipalities on `/votes/5960/` once the
  characteristics have loaded, each after showing the whole of Switzerland and pointing at it
- **THEN** no frame after these inputs took more than 50 ms of work on the main thread

### Requirement: The characteristics of a municipality beside the map

Beside the map SHALL stand a panel headed "Merkmale der Gemeinde" with the characteristics of
the municipality last clicked or tapped (the `characteristics` capability), for the
figures that apply to the vote. It shows the municipality's name as its details write it, then
the 21 characteristics in four groups, each group headed with the date of its figures.

#### Scenario: Zürich in 2016

- **WHEN** a visitor opens `/votes/5960/` and clicks Zürich
- **THEN** the panel shows "Zürich (ZH)" and, under "Bevölkerung Ende 2015": "Einwohner:
  396'955", "Ausländeranteil: 32.03%", "0–17 Jahre: 15.37%", "18–34 Jahre: 27.13%", "35–49
  Jahre: 25.41%", "50–64 Jahre: 16.43%", "65 Jahre und älter: 15.66%", "Einwohner je km²:
  4'320"
- **AND** under "Nationalratswahl 2015": "FDP: 14.07%", "Die Mitte (bis 2020 CVP und BDP):
  5.77%", "SP: 31.60%", "SVP: 17.93%", "GLP: 9.22%", "Grüne: 10.66%", "Übrige Parteien:
  10.74%"
- **AND** under "Hauptsprache, Volkszählung 2000": "Deutsch: 77.70%", "Französisch: 2.13%",
  "Italienisch: 4.70%", "Rätoromanisch: 0.27%"
- **AND** under "Fläche und Landwirtschaft": "Fläche (2026): 91.88 km²" and "Rinder je
  Einwohner (2015): 0.002" (`investigations/characteristics.md`)

#### Scenario: The figures follow the vote

- **WHEN** a visitor opens `/votes/6850/` and clicks Zürich
- **THEN** the panel's groups are headed "Bevölkerung Ende 2025" and "Nationalratswahl 2023"

### Requirement: How the characteristics are written

The panel SHALL write inhabitants and shares as the `vote-list` capability writes counts and
shares. It SHALL write the inhabitants per km² as a whole number, the area in km² with two
decimals and the cattle per inhabitant with three decimals, each rounded half away from zero,
with its digits grouped as a count is.

#### Scenario: Meienried's cattle

- **WHEN** a visitor opens `/votes/5960/` and clicks Meienried
- **THEN** the panel shows "Einwohner je km²: 80", "Fläche (2026): 0.65 km²" and "Rinder je
  Einwohner (2015): 2.519"

### Requirement: The panel keeps the last municipality

The panel SHALL show the municipality last clicked or tapped, and keep it while the pointer
points at other municipalities, leaves the map, points at a lake or moves to the panel. Pointing
alone SHALL NOT change it. Before the first click or tap, the panel SHALL show "Klicken Sie auf
eine Gemeinde, um ihre Merkmale zu sehen."

#### Scenario: Before clicking

- **WHEN** a visitor opens `/votes/5960/` and the map has loaded
- **THEN** the panel shows "Klicken Sie auf eine Gemeinde, um ihre Merkmale zu sehen."

#### Scenario: Moving to the panel

- **WHEN** a visitor clicks Zürich and then moves the pointer across the map onto the panel
- **THEN** the map shows no details and the panel still shows "Zürich (ZH)" with "Einwohner:
  396'955"

#### Scenario: Pointing does not change the panel

- **WHEN** a visitor clicks Zürich and then points at Bern
- **THEN** the map shows the details of "Bern (BE)" and the panel still shows "Zürich (ZH)"

#### Scenario: Another municipality

- **WHEN** a visitor clicks Zürich and then clicks Bern
- **THEN** the panel shows "Bern (BE)" with "Einwohner: 131'554"

### Requirement: Where the panel stands

In a window at least 960 pixels wide, the panel SHALL stand to the right of the map, its top at
the map's top. In a narrower window it SHALL stand below the map. The map SHALL keep its shape
in both.

#### Scenario: A wide window

- **WHEN** a visitor opens `/votes/5960/` in a window 1,280 pixels wide
- **THEN** the panel's left edge lies to the right of the map's right edge

#### Scenario: A narrow window

- **WHEN** a visitor opens `/votes/5960/` in a window 800 pixels wide
- **THEN** the panel's top edge lies below the map's bottom edge

### Requirement: A characteristic without a figure

A characteristic that has no figure for the municipality SHALL be shown with "keine Angabe" in
place of its value.

#### Scenario: Meienried's parties

- **WHEN** a visitor opens `/votes/5960/` and clicks Meienried
- **THEN** the panel shows "Meienried (BE)", "Einwohner: 52", and "keine Angabe" for each of
  the seven parties

### Requirement: The sources of the characteristics

Below the characteristics, the panel SHALL name their sources: "Quellen: BFS (STATPOP,
Nationalratswahlen, Volkszählung 2000, Landwirtschaftliche Strukturerhebung); swisstopo
(swissBOUNDARIES3D 2026)."

#### Scenario: The sources

- **WHEN** a visitor opens `/votes/5960/` and clicks Zürich
- **THEN** the panel ends with "Quellen: BFS (STATPOP, Nationalratswahlen, Volkszählung 2000,
  Landwirtschaftliche Strukturerhebung); swisstopo (swissBOUNDARIES3D 2026)."

### Requirement: Characteristics that are loading or cannot be loaded

The map SHALL NOT wait for the characteristics. Until they are loaded, the panel SHALL show "Die
Merkmale werden geladen …". When they cannot be loaded, it SHALL show "Die Merkmale können nicht
geladen werden.", and the map, its details and everything else on the page SHALL work as
without the panel.

#### Scenario: The characteristics' file is missing

- **GIVEN** a browser in which every request for `data/characteristics.json` fails
- **WHEN** a visitor opens `/votes/5960/` and points at Zürich
- **THEN** the panel shows "Die Merkmale können nicht geladen werden." and the map shows
  "Zürich (ZH)" with "Ja-Anteil: 31.85%"

#### Scenario: The characteristics arrive after the map

- **GIVEN** a browser in which the answer for `data/characteristics.json` is held back
- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the map shows its 2,110 municipalities and the panel shows "Die Merkmale werden
  geladen …"
