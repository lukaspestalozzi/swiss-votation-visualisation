# Spec Delta

## MODIFIED Requirements

### Requirement: Adding and removing a limit

The list "Merkmal hinzufügen" SHALL offer, by the names the panel of characteristics gives them
and in its order, each of the 35 characteristics that has no limit yet, under the panel's
headings without their dates. Choosing one and pressing
"Hinzufügen" SHALL add its limit after those already added, with both bounds at the ends of its
track; choosing alone SHALL add nothing. Each limit SHALL have a button "Entfernen" that removes
it, after which the list offers its characteristic again.

#### Scenario: Adding a limit

- **WHEN** a visitor opens `/votes/5960/`, chooses "Ausländeranteil" in "Merkmal hinzufügen" and
  presses "Hinzufügen"
- **THEN** the page shows the limit "Ausländeranteil (Ende 2015): von 0.00% bis 61.10%", and the
  list offers the other 34 characteristics but not "Ausländeranteil"

#### Scenario: The keyboard only chooses

- **WHEN** a visitor opens `/votes/5960/`, focuses "Merkmal hinzufügen" and presses the down arrow
  key twice
- **THEN** the page shows no limit and the list shows "Ausländeranteil"; pressing "Hinzufügen"
  adds its limit

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
