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
