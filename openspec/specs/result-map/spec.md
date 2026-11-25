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

For every vote the calculation judges, the vote's page SHALL show, below the result, a map with
every municipality of the list of municipalities. Its heading "Karte der Gemeinden" SHALL name it
for assistive technology and SHALL take no room on the page. The page of a tie-break question
SHALL show no map.

#### Scenario: The map of a vote

- **WHEN** a visitor opens `/votes/5960/` and the map has loaded
- **THEN** below "Abgelehnt" and above the table of the cantons the page shows a map with 2,110
  municipalities, whose heading "Karte der Gemeinden" is read by a screen reader and not seen

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
diagonal lines on the page's ground, white, or `#121212` in the dark scheme (the `site-style`
capability), and SHALL take no colour of a class.

#### Scenario: The municipalities without a result in 2016

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the seven municipalities the vote's file names as without a result, among them 389
  Meienried, are hatched, and no other municipality is

#### Scenario: Hatched in the dark scheme

- **WHEN** a visitor whose browser prefers a dark colour scheme opens `/votes/5960/`
- **THEN** 389 Meienried is hatched with grey lines on `#121212`

### Requirement: The legend

The map SHALL show a legend: a scale of the eight classes' colours, from the clearest no on its
left to the clearest yes on its right, headed "Nein", "Ja-Anteil in %" and "Ja", with the yes
shares 20, 30, 40, 50, 60, 70 and 80 below the borders of its classes; then "Gleich viele Ja wie
Nein" and "Kein eigenes Ergebnis" with the hatching. While the selection sets aside at least one
municipality, the legend SHALL end with "Nicht in der Auswahl" in `#2c2c2c`.

#### Scenario: The legend of a vote

- **WHEN** a visitor opens `/votes/5960/` and the map has loaded
- **THEN** the scale shows `#934319`, `#c2673b`, `#e5946f`, `#fbbea3`, `#92dfd0`, `#4bc1ad`,
  `#009c86` and `#007260` in this order, the seven yes shares below it, and after it the two
  entries with their colour or the hatching
- **AND** each class is named for assistive technology, from "Nein: 80% und mehr" to "Ja: 80% und
  mehr"

#### Scenario: The legend of a selection

- **WHEN** a visitor opens `/votes/5960/` and moves the upper bound of "Ausländeranteil" to step
  327
- **THEN** the legend shows the same scale and entries and, as the last, "Nicht in der Auswahl" in
  `#2c2c2c`; after "Zurück zum echten Ergebnis" it ends with "Kein eigenes Ergebnis" again

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
the `vote-list` capability writes them, and a bar of its yes share, drawn as a result's.
Pointing at no municipality SHALL show no details.

#### Scenario: The details of a municipality

- **WHEN** a visitor opens `/votes/5960/` and points at Zürich
- **THEN** the map shows "Zürich (ZH)", "Ja-Anteil: 31.85%", "Ja-Stimmen: 46'565" and
  "Nein-Stimmen: 99'614", and a bar whose yes part is 31.85% of its width
  (`investigations/map-data.md`)

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
out by a factor of 2 around the centre of the view, the mouse wheel with Ctrl or ⌘ held around
the point under the pointer, and two fingers by the ratio of their distance to that when both
touched, around the point midway between them; always between the whole of Switzerland and 16
times. "Ganze Schweiz" SHALL show the whole of Switzerland again. Borders SHALL keep their width
on the screen.

#### Scenario: Zooming in with the button

- **WHEN** a visitor presses "+" once
- **THEN** the map shows the area around the same centre, half as wide and half as high

#### Scenario: The limits of the zoom

- **WHEN** a visitor presses "+" five times, then "Ganze Schweiz", then "−" once
- **THEN** after the presses of "+" the map shows a sixteenth of the width of Switzerland, and
  after "Ganze Schweiz" and "−" it shows the whole of Switzerland

#### Scenario: Zooming with the wheel

- **WHEN** a visitor holds the Ctrl key and turns the mouse wheel away from them over Zürich
- **THEN** the map zooms in, Zürich stays under the pointer within one pixel, and the page has
  not scrolled

#### Scenario: Zooming with two fingers

- **WHEN** a visitor on a touch screen opens `/de/votes/5960/`, puts two fingers on the map 100
  pixels apart with Zürich midway between them, and moves them apart to 200 pixels, keeping
  their midpoint
- **THEN** the map shows an area half as wide and half as high, and Zürich stays midway between
  the fingers within one pixel

#### Scenario: Two fingers at the limits

- **WHEN** a visitor on a touch screen, the map showing the whole of Switzerland, moves two
  fingers on the map from 200 to 100 pixels apart
- **THEN** the map still shows the whole of Switzerland

### Requirement: Moving the map

Dragging the map with a pointer or one finger SHALL move it with the pointer or the finger, and
two fingers SHALL move it with the point midway between them. The centre of the view SHALL stay
inside the smallest rectangle that holds Switzerland. A drag or two fingers SHALL NOT show a
municipality's details by themselves. A finger on the map SHALL neither scroll nor zoom the page;
elsewhere, fingers scroll and zoom the page as the browser does.

#### Scenario: Dragging the map

- **WHEN** a visitor zoomed in four times drags the map 100 pixels to the left
- **THEN** the map shows the area 100 pixels further east

#### Scenario: Dragging past the edge

- **WHEN** a visitor zoomed in twice drags the map far to the right, past the western border
- **THEN** the centre of the view stops at the western edge of the rectangle around
  Switzerland

#### Scenario: Moving with a finger

- **WHEN** a visitor on a touch screen, zoomed in four times on `/de/votes/5960/`, moves one
  finger on the map 100 pixels to the left
- **THEN** the map shows the area 100 pixels further east, the page has not scrolled, and the map
  shows no details

#### Scenario: Two fingers moving together

- **WHEN** a visitor on a touch screen, zoomed in four times, moves two fingers on the map, 100
  pixels apart, 60 pixels to the left together
- **THEN** the map shows the area 60 pixels further east, as wide as before

#### Scenario: A finger beside the map

- **WHEN** a visitor on a phone moves a finger up over the limits, and then over the map
- **THEN** over the limits the page scrolls; over the map the map moves and the page does not
  scroll (checked by hand on a phone: `investigations/small-screens.md`, 4)

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

Of the frames the browser draws after a zoom step, a move of the map, pointing at a
municipality (the first time after the page has loaded included) or clicking one, which fills
the panel, at least nine in ten of a measurement SHALL take at most 16 ms of work on the page's
main thread, handling the input and drawing, and none more than 50 ms. The browser tests measure
it one test at a time, with 50 ms between a pointer's arrival and a click, and once more when a
measurement exceeds it.

#### Scenario: Zooming, moving and pointing

- **WHEN** the browser tests open `/votes/5960/`, wait until the characteristics have loaded,
  move the pointer onto the map, zoom in four times, drag the map, and point at three
  municipalities
- **THEN** at least nine in ten of the frames after these inputs, the first pointing at a
  municipality included, took at most 16 ms of work on the main thread and none more than 50 ms,
  in the first measurement or, when it exceeded this, in the second (`investigations/redesign.md`, "Found after the merge")

#### Scenario: Clicking municipalities

- **WHEN** the browser tests click three municipalities on `/votes/5960/` once the
  characteristics have loaded, each after showing the whole of Switzerland, pointing at it and
  waiting 50 ms
- **THEN** at least nine in ten of the frames after these inputs took at most 16 ms of work on
  the main thread and none more than 50 ms, in the first measurement or, when it exceeded this, in the second

#### Scenario: No other test beside a budget test

- **WHEN** the browser tests run, by `pnpm run test:e2e`, in `scripts/verify-local.sh` or in CI
- **THEN** they run one test at a time, so no other test runs while a budget test measures, the
  budget tests of the limits included

### Requirement: The characteristics of a municipality

Below the map and the limits SHALL stand a panel headed "Merkmale der Gemeinde" with the
characteristics of the municipality last clicked or tapped (the `characteristics` capability), for
the figures that apply to the vote. It shows the municipality's name as its details write it, then
the 35 characteristics in eight groups, each headed with the date of its figures, each share with
a bar beside its figure. A line whose figures are of another year than its group's heading SHALL
name its year.

#### Scenario: Zürich in 2016

- **WHEN** a visitor opens `/votes/5960/` and clicks Zürich
- **THEN** the panel shows "Zürich (ZH)" and, under "Bevölkerung Ende 2015": "Einwohner:
  396'955", "Ausländeranteil: 32.03%", "Im Ausland geboren: 41.07%", "0–17 Jahre: 15.37%",
  "18–34 Jahre: 27.13%", "35–49
  Jahre: 25.41%", "50–64 Jahre: 16.43%", "65 Jahre und älter: 15.66%", "Einwohner je km²:
  4'320"
- **AND** under "Nationalratswahl 2015": "FDP: 14.07%", "Die Mitte (bis 2020 CVP und BDP):
  5.77%", "SP: 31.60%", "SVP: 17.93%", "GLP: 9.22%", "Grüne: 10.66%", "Übrige Parteien:
  10.74%"
- **AND** under "Hauptsprache, Volkszählung 2000": "Deutsch: 77.70%", "Französisch: 2.13%",
  "Italienisch: 4.70%", "Rätoromanisch: 0.27%"
- **AND** under "Religion, Volkszählung 2000": "Evangelisch-reformiert: 30.28%",
  "Römisch-katholisch: 33.27%", "Keine Religionszugehörigkeit: 16.83%"
- **AND** under "Ausbildung, Volkszählung 2000": "Hochschule oder höhere Berufsbildung: 24.92%",
  "Obligatorische Schule oder keine Ausbildung: 26.20%"
- **AND** under "Wohnen, Volkszählung 2000": "Vom Eigentümer bewohnte Wohnungen: 7.11%",
  "Einfamilienhäuser: 23.62%"
- **AND** under "Arbeit Ende 2015": "Arbeitsplätze je 100 Einwohner: 118.1", "Arbeitsplätze im
  Primärsektor: 0.05%", "Arbeitsplätze im Sekundärsektor: 6.41%", "Arbeitsplätze im
  Tertiärsektor: 93.54%"
- **AND** under "Fläche und Landwirtschaft": "Fläche (2026): 91.88 km²" and "Rinder je
  Einwohner (2015): 0.002", "Landwirtschaftsbetriebe je 1'000 Einwohner (2015): 0.1" and
  "Bio-Anteil der landwirtschaftlichen Nutzfläche (2015): 44.56%"
  (`investigations/characteristics.md`, `investigations/more-characteristics.md`)

#### Scenario: The figures follow the vote

- **GIVEN** the data file of 2026-11-23, whose newest jobs are those of 2024
- **WHEN** a visitor opens `/votes/6850/` and clicks Zürich
- **THEN** the panel's groups are headed "Bevölkerung Ende 2025", "Nationalratswahl 2023" and
  "Arbeit Ende 2024", and it shows "Arbeitsplätze je 100 Einwohner: 124.9"

#### Scenario: A line of another year than its group

- **GIVEN** a data file whose newest population is of 2025 and whose newest figures of those
  born abroad are of 2024
- **WHEN** a visitor opens `/votes/6850/` and clicks Zürich
- **THEN** under "Bevölkerung Ende 2025" stands "Im Ausland geboren (Ende 2024): 44.58%"

#### Scenario: Without a figure

- **WHEN** a visitor opens `/votes/5960/` and clicks Oberrieden
- **THEN** the panel shows "Arbeitsplätze im Primärsektor: keine Angabe", "Arbeitsplätze im
  Sekundärsektor: keine Angabe", "Arbeitsplätze im Tertiärsektor: 89.39%" and "Bio-Anteil der
  landwirtschaftlichen Nutzfläche (2015): keine Angabe"

#### Scenario: The bars of the shares

- **WHEN** a visitor opens `/de/votes/5960/` and clicks Zürich, and then Oberrieden
- **THEN** for Zürich the 29 lines with a share each show a bar, that of "Ausländeranteil: 32.03%"
  filled to 32.03% of its width, give or take 1 pixel, and the 6 lines without a share
  ("Einwohner", "Einwohner je km²", "Arbeitsplätze je 100 Einwohner", "Fläche", "Rinder je
  Einwohner", "Landwirtschaftsbetriebe je 1'000 Einwohner") show none
- **AND** for Oberrieden the lines that read "keine Angabe" show no bar

### Requirement: How the characteristics are written

The panel SHALL write inhabitants and shares as the `vote-list` capability writes counts and
shares. It SHALL write the inhabitants per km² as a whole number, the area in km² with two
decimals, the cattle per inhabitant with three, and the jobs per 100 inhabitants and the farms
per 1,000 inhabitants with one, each rounded half away from zero, with its digits grouped as a
count is.

#### Scenario: Meienried's cattle

- **WHEN** a visitor opens `/votes/5960/` and clicks Meienried
- **THEN** the panel shows "Einwohner je km²: 80", "Fläche (2026): 0.65 km²" and "Rinder je
  Einwohner (2015): 2.519", "Arbeitsplätze je 100 Einwohner: 44.2" and
  "Landwirtschaftsbetriebe je 1'000 Einwohner (2015): 76.9"

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

The panel SHALL stand below the map and below the limits. In a window at least 960 pixels wide
the table of the cantons SHALL stand to its right, their tops level; in a narrower window below
it. The map SHALL keep its shape in both.

#### Scenario: A wide window

- **WHEN** a visitor opens `/votes/5960/` in a window 1,280 pixels wide
- **THEN** the panel's top edge lies below the map's bottom edge and below the limits' bottom
  edge, and the left edge of the table of the cantons lies to the right of the panel's right edge

#### Scenario: A narrow window

- **WHEN** a visitor opens `/votes/5960/` in a window 800 pixels wide
- **THEN** the panel's top edge lies below the map's bottom edge, the map's top edge below the
  limits' bottom edge, and the top edge of the table of the cantons below the panel's bottom
  edge

### Requirement: A characteristic without a figure

A characteristic that has no figure for the municipality SHALL be shown with "keine Angabe" in
place of its value.

#### Scenario: Meienried's parties

- **WHEN** a visitor opens `/votes/5960/` and clicks Meienried
- **THEN** the panel shows "Meienried (BE)", "Einwohner: 52", and "keine Angabe" for each of
  the seven parties

### Requirement: The sources of the characteristics

Below the characteristics, the panel SHALL name their sources: "Quellen: BFS (STATPOP, STATENT,
Nationalratswahlen, Volkszählung 2000, Landwirtschaftliche Strukturerhebung); swisstopo
(swissBOUNDARIES3D 2026)."

#### Scenario: The sources

- **WHEN** a visitor opens `/votes/5960/` and clicks Zürich
- **THEN** the panel ends with "Quellen: BFS (STATPOP, STATENT, Nationalratswahlen, Volkszählung 2000,
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

### Requirement: A set-aside municipality

A municipality with an entry that the selection sets aside (the `limits` capability) SHALL be
filled with `#2c2c2c`, whatever its result. That grey is at least 15.5 apart (Delta E, OKLab times
100) from every other colour of the map, also for a viewer with a red-green colour vision
deficiency (`investigations/limits.md`, 6). A municipality without a result SHALL stay hatched,
whether the selection keeps it or not.

#### Scenario: Set aside and kept

- **WHEN** a visitor opens `/votes/5960/` and moves the upper bound of "Ausländeranteil" to step
  327, 19.98%
- **THEN** 261 Zürich (32.03%) is filled with `#2c2c2c`, 1 Aeugst am Albis (12.77%) keeps its
  class colour of no, class 1, `#fbbea3`, and the seven municipalities without a result stay
  hatched (`investigations/limits.md`, 3)

#### Scenario: Without a result and without a figure

- **WHEN** a visitor opens `/votes/6400/` and moves the upper bound of "SVP" to step 999
- **THEN** 389 Meienried, which has neither a result nor a party figure, stays hatched, and 422
  Rüti bei Lyssach, which has a result and no party figure, is filled with `#2c2c2c`
  (`investigations/limits.md`, 2)

### Requirement: The details of a set-aside municipality

Pointing at, clicking or tapping a municipality that the selection sets aside SHALL show its
details as before, with its own figures, followed by "Nicht in der Auswahl.".

#### Scenario: Zürich set aside

- **WHEN** a visitor opens `/votes/5960/`, moves the upper bound of "Ausländeranteil" to step 327
  and points at Zürich
- **THEN** the map shows "Zürich (ZH)", "Ja-Anteil: 31.85%", "Ja-Stimmen: 46'565",
  "Nein-Stimmen: 99'614" and "Nicht in der Auswahl." (`investigations/map-data.md`)

### Requirement: A tap does what a click does

On a touch screen, a tap on a municipality SHALL do what a click does: show its details, show its
characteristics in the panel, and outline it. A tap on a lake or outside Switzerland SHALL show
no details, and SHALL keep the panel and the outline as they were.

#### Scenario: Tapping Zürich

- **WHEN** a visitor on a touch screen 412 pixels wide opens `/de/votes/5960/` and taps Zürich
- **THEN** the map shows "Zürich (ZH)" with "Ja-Anteil: 31.85%", the panel shows "Zürich (ZH)"
  with "Einwohner: 396'955", and Zürich is outlined (`investigations/map-data.md`,
  `investigations/characteristics.md`)

#### Scenario: Tapping a lake

- **WHEN** that visitor then taps the middle of the Zürichsee
- **THEN** the map shows no details, and the panel still shows "Zürich (ZH)", outlined on the map

### Requirement: The municipality last clicked or tapped is outlined

The municipality last clicked or tapped, whose characteristics the panel shows, SHALL be
outlined on the map by a black line 3 pixels wide on a white line 7 pixels wide, above the
borders of the cantons, at every zoom the same width on the screen. Pointing alone SHALL NOT
move the outline. Before the first click or tap, no municipality is outlined.

#### Scenario: Before clicking

- **WHEN** a visitor opens `/de/votes/5960/` and the map has loaded
- **THEN** no municipality is outlined

#### Scenario: Clicking, pointing, clicking again

- **WHEN** a visitor on `/de/votes/5960/` clicks Zürich, points at Bern, and then clicks Bern
- **THEN** after the click on Zürich and while pointing at Bern, Zürich is outlined; after the
  click on Bern, Bern is outlined and Zürich is not

#### Scenario: A set-aside municipality

- **WHEN** a visitor on `/de/votes/5960/` moves the upper bound of "Ausländeranteil" to step 327
  and clicks Zürich
- **THEN** Zürich, filled with `#2c2c2c`, is outlined (`investigations/limits.md`, 3)

### Requirement: The budget of fingers

Of the frames the browser draws after a step of one finger or two moving on the map, or after a
tap on a municipality, which fills the panel, at least nine in ten of a measurement SHALL take at
most 16 ms of work on the page's main thread and none more than 50 ms, as for the map's other
inputs. The browser tests measure it on a touch screen's emulation, and once more when a
measurement exceeds it.

#### Scenario: Pinching, moving and tapping

- **WHEN** the browser tests, on a touch screen 412 pixels wide, open `/de/votes/5960/`, wait
  until the characteristics have loaded, zoom in twice with two fingers, move the map with one
  finger, and tap three municipalities, each after showing the whole of Switzerland
- **THEN** at least nine in ten of the frames after these inputs took at most 16 ms of work on
  the main thread and none more than 50 ms, in the first measurement or, when it exceeded this, in the second

### Requirement: The map in the dark scheme

When the browser prefers a dark colour scheme (the `site-style` capability), the map SHALL keep
its colours, the set-aside grey and the outline of the municipality last clicked or tapped among
them, and the borders between municipalities SHALL take the page's ground, `#121212`, as they
take white in the light scheme. The set-aside grey `#2c2c2c` lies 11.1 apart from that ground
(Delta E, OKLab times 100), also for a red-green colour vision deficiency
(`investigations/site-style.md`, 4).

#### Scenario: A selection on a dark map

- **WHEN** a visitor whose browser prefers a dark colour scheme opens `/de/votes/5960/`, moves the
  upper bound of "Ausländeranteil" to step 327 and clicks Zürich
- **THEN** 261 Zürich is filled with `#2c2c2c` and outlined black on white, 1 Aeugst am Albis
  keeps `#fbbea3`, and the borders between municipalities are `#121212`
  (`investigations/limits.md`, 3)

#### Scenario: The colours of the classes stay

- **WHEN** a visitor whose browser prefers a dark colour scheme opens `/votes/5960/`
- **THEN** 261 Zürich is filled with `#e5946f`, 351 Bern with `#c2673b` and 946 Wachseldorn with
  `#009c86`, as in the light scheme (`investigations/map-data.md`)

### Requirement: The mouse wheel over the map

Over the map, the mouse wheel SHALL zoom it only while the Ctrl or the ⌘ key is held, which is
also how a browser reports a pinch on a trackpad. Without such a key the wheel SHALL scroll the
page, as it does elsewhere.

#### Scenario: The wheel alone scrolls the page

- **WHEN** a visitor on `/de/votes/5960/`, in a window 1,280 by 800 pixels, turns the mouse wheel
  towards them over Zürich, holding no key
- **THEN** the page scrolls, and the map still shows the whole of Switzerland

#### Scenario: With the ⌘ key

- **WHEN** that visitor holds the ⌘ key and turns the mouse wheel away from them over Zürich
- **THEN** the map zooms in around Zürich, and the page does not scroll

### Requirement: The result and the map stay in the window

In a window at least 1,024 pixels wide and 700 pixels high, the result and the map with its legend
SHALL stay in the window while the page scrolls along the limits beside them, and the map SHALL be
no taller than the window's height less 17rem, 272 pixels at the browser's default text size. In
any other window they SHALL scroll with the page. In a window narrower than 640 pixels the map
SHALL reach from one side of the window to the other.

#### Scenario: Scrolling along five limits

- **WHEN** a visitor opens `/de/votes/5960/` in a window 1,280 by 800 pixels, adds five limits and
  scrolls until "Zurück zum echten Ergebnis" lies in the window
- **THEN** the result's top edge and the map's top edge still lie in the window, and the map is
  784 pixels wide and 496 high, give or take 1 (`investigations/redesign.md`, 6)

#### Scenario: A wide and a low window

- **WHEN** a visitor opens that page in a window 1,600 by 900 pixels, and in one 1,280 by 600
- **THEN** in the first the map is 628 pixels high, the window's height less 272, keeps its shape
  and stands in the middle of its column; in the second the result and the map scroll away with
  the page

#### Scenario: A phone

- **WHEN** a visitor opens that page in a window 360 pixels wide
- **THEN** the map is 360 pixels wide and 228 high, give or take 1, and scrolls with the page
