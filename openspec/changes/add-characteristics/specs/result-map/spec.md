## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: The map's performance budget

Each frame the browser draws after a zoom step, a move of the map, or pointing at or clicking a
municipality, with the panel showing its characteristics, SHALL take at most 16 ms of work on the
page's main thread: the handling of the input and the drawing that follows, measured by the
browser tests on the machine that runs them.

#### Scenario: Zooming, moving and pointing

- **WHEN** the browser tests zoom in four times, drag the map, and point at and click three
  municipalities on `/votes/5960/` once the characteristics have loaded
- **THEN** no frame after these inputs took more than 16 ms of work on the main thread
