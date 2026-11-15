# Spec Delta

## ADDED Requirements

### Requirement: The boundaries of the municipalities

The update command SHALL write the map's data with its reference date and the boundary of every
municipality of the list. The boundaries come from the BFS register of municipalities, at its
level K4, for the list's reference date, in the Swiss coordinate system LV95, rounded to the
metre and otherwise unchanged. A municipality without a boundary, a boundary of a number not on
the list, or a number given twice SHALL stop the update.

#### Scenario: The boundaries on 2026-11-15

- **GIVEN** the sources as they were on 2026-11-15
- **WHEN** the map's data is read
- **THEN** its reference date is 2026-01-01, and it holds 2,110 boundaries, one for each
  municipality of the list (`investigations/map-data.md`, "Answers", 1)

#### Scenario: A municipality without a boundary

- **GIVEN** an answer of the register that has no boundary for the municipality 261
- **WHEN** the update command runs
- **THEN** it stops with an error that names 261, and writes no data file

#### Scenario: A boundary of no municipality

- **GIVEN** an answer of the register with a boundary for the number 2391, which is not on the
  list of municipalities
- **WHEN** the update command runs
- **THEN** it stops with an error that names 2391, and writes no data file

#### Scenario: A number given twice

- **GIVEN** an answer of the register with two boundaries for the number 1
- **WHEN** the update command runs
- **THEN** it stops with an error that names 1, and writes no data file

#### Scenario: A new list of municipalities

- **GIVEN** BFS vote-day files that all state the reference date 2027-01-01
- **WHEN** the update command runs
- **THEN** it asks the register for the boundaries of 2027-01-01, and the map's data holds
  those of the list of 2027-01-01

### Requirement: The cantons and the outline of Switzerland

With the boundaries, the update command SHALL write the borders of the 26 cantons and the
outline of Switzerland, from the same answer of the register: same date, level K4, LV95,
rounded to the metre. When the register does not give each of the 26 cantons exactly once, or
gives no outline, the update SHALL stop with an error that names what is missing or doubled,
and SHALL write no data file.

#### Scenario: The cantons on 2026-11-15

- **GIVEN** the sources as they were on 2026-11-15
- **WHEN** the map's data is read
- **THEN** it holds the borders of the 26 cantons, from ZH to JU, and the outline of
  Switzerland (`investigations/map-data.md`, "Answers", 1)

#### Scenario: A canton is missing

- **GIVEN** an answer of the register without the canton JU
- **WHEN** the update command runs
- **THEN** it stops with an error that names JU, and writes no data file

### Requirement: The lakes

The update command SHALL write the lakes of the BFS ThemaKart set 2026, those of more than
195 ha, whole, as the set gives them: in LV95, rounded to the metre and otherwise unchanged,
with the year of the set. The lakes are not tied to a list of municipalities. When the set
cannot be read or holds no lakes, the update SHALL stop and write no data file.

#### Scenario: The lakes on 2026-11-15

- **GIVEN** the sources as they were on 2026-11-15
- **WHEN** the map's data is read
- **THEN** it holds 37 lakes from the ThemaKart set of 2026, among them the Zürichsee and the
  Lago Maggiore (`investigations/map-data.md`, "Answers", 3)

#### Scenario: A set without lakes

- **GIVEN** a ThemaKart set that holds no layer of lakes
- **WHEN** the update command runs
- **THEN** it stops with an error that names the set, and writes no data file
