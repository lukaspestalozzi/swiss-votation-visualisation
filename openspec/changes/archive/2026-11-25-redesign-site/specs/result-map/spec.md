# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: The characteristics of a municipality beside the map`
- TO: `### Requirement: The characteristics of a municipality`

## MODIFIED Requirements

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

## ADDED Requirements

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
