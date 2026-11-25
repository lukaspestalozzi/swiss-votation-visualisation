# Spec Delta

## MODIFIED Requirements

### Requirement: One definition per characteristic

Each characteristic SHALL have one definition: its name, its group, its unit, its source, the
date of its figures, how its value is computed from the counts of the data file, and whether the
track of its limit is linear or logarithmic. Everything that shows, uses or limits a
characteristic SHALL take its name, its group, its value and its date from that one definition.

#### Scenario: The panel follows the definitions

- **WHEN** the panel shows a municipality
- **THEN** it shows the 35 characteristics in the order of their definitions, each in the group
  and with the name, the value and the date its definition gives

#### Scenario: The limits follow the definitions

- **WHEN** a visitor opens the list "Merkmal hinzufügen" on a vote's page
- **THEN** it offers the 35 characteristics in the order of their definitions, by the names
  their definitions give, and the tracks of exactly "Einwohner", "Einwohner je km²",
  "Arbeitsplätze je 100 Einwohner", "Fläche", "Rinder je Einwohner" and "Landwirtschaftsbetriebe
  je 1'000 Einwohner" are logarithmic
