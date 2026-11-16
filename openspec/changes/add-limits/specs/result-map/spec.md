# Spec Delta

## MODIFIED Requirements

### Requirement: The legend

The map SHALL show a legend with the colour of each class and side, from "Nein: 80% und mehr",
"Nein: 70–80%", "Nein: 60–70%" and "Nein: 50–60%" to "Ja: 50–60%", "Ja: 60–70%", "Ja: 70–80%"
and "Ja: 80% und mehr", followed by "Gleich viele Ja wie Nein" and "Kein eigenes Ergebnis" with
the hatching. While the selection sets aside at least one municipality, the legend SHALL end with
"Nicht in der Auswahl" in `#2c2c2c`.

#### Scenario: The legend of a vote

- **WHEN** a visitor opens `/votes/5960/` and the map has loaded
- **THEN** the legend shows these ten entries in this order, each with its colour or the
  hatching

#### Scenario: The legend of a selection

- **WHEN** a visitor opens `/votes/5960/` and moves the upper bound of "Ausländeranteil" to step
  327
- **THEN** the legend shows the same ten entries and, as the eleventh, "Nicht in der Auswahl" in
  `#2c2c2c`; after "Zurück zum echten Ergebnis" it shows the ten again

## ADDED Requirements

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
