# characteristics Specification

## Purpose

The characteristics of the municipalities: figures for every municipality of the list of
municipalities that a limit can act on. Each characteristic has one definition: its name, its
unit, its source, the date of its figures and how its value is computed. The pipeline's update
command (`pipeline/README.md`) writes their counts to `app/static/data/characteristics.json`,
on the list of 2026-01-01 (the `municipalities` capability). Its sources are BFS STAT-TAB
tables, the BFS register's correspondences and swisstopo's swissBOUNDARIES3D. The figures in
the scenarios are those of `investigations/characteristics.md`.

## Requirements

### Requirement: The characteristics

Every municipality of the list SHALL have 21 characteristics, in this order:
- inhabitants, share of foreigners, the shares aged 0–17, 18–34, 35–49, 50–64 and 65 and over;
- inhabitants per km²;
- the party strengths of FDP, Die Mitte, SP, SVP, GLP, Grüne and the other parties;
- the shares of German, French, Italian and Romansh;
- area;
- cattle per inhabitant.

#### Scenario: The names of the characteristics

- **WHEN** the characteristics of a municipality are listed
- **THEN** their names are, in this order: "Einwohner", "Ausländeranteil", "0–17 Jahre",
  "18–34 Jahre", "35–49 Jahre", "50–64 Jahre", "65 Jahre und älter", "Einwohner je km²",
  "FDP", "Die Mitte (bis 2020 CVP und BDP)", "SP", "SVP", "GLP", "Grüne", "Übrige Parteien",
  "Deutsch", "Französisch", "Italienisch", "Rätoromanisch", "Fläche", "Rinder je Einwohner"

### Requirement: One definition per characteristic

Each characteristic SHALL have one definition: its name, its unit, its source, the date of its
figures, how its value is computed from the counts of the data file, and whether the track of its
limit is linear or logarithmic. Everything that shows, uses or limits a characteristic SHALL take
its name, its value and its date from that one definition.

#### Scenario: The panel follows the definitions

- **WHEN** the panel beside the map shows a municipality
- **THEN** it shows the 21 characteristics in the order of their definitions, each with the
  name, the value and the date its definition gives

#### Scenario: The limits follow the definitions

- **WHEN** a visitor opens the list "Merkmal hinzufügen" on a vote's page
- **THEN** it offers the 21 characteristics in the order of their definitions, by the names
  their definitions give, and the tracks of exactly "Einwohner", "Einwohner je km²", "Fläche" and
  "Rinder je Einwohner" are logarithmic

### Requirement: The characteristics of the population

The characteristics of the population SHALL be computed from the permanent resident population
at the end of a year (BFS, STATPOP): the inhabitants; the foreigners and each age group in
percent of the inhabitants; the inhabitants per km² of the municipality's area.

#### Scenario: Zürich at the end of 2015

- **WHEN** the characteristics of the population of Zürich (261) at the end of 2015 are
  computed
- **THEN** they are 396,955 inhabitants; 127,151 foreigners (32.0316%); 61,020 aged 0–17
  (15.3720%), 107,696 aged 18–34 (27.1305%), 100,857 aged 35–49 (25.4077%), 65,204 aged 50–64
  (16.4260%) and 62,178 aged 65 and over (15.6637%); 4,320.36 inhabitants per km²
  (`investigations/characteristics.md`), each share within 0.00005 points

### Requirement: The party strengths

A party's strength SHALL be its votes in percent of the votes of all parties in the
municipality in a National Council election (BFS). Die Mitte SHALL count the votes of CVP and
of BDP before 2021, and "Übrige Parteien" the votes of every party not named.

#### Scenario: Zürich in 2015

- **WHEN** the party strengths of Zürich (261) are computed for the election of 2015
- **THEN** of 3,798,109 party votes, FDP has 534,433 (14.0710%), Die Mitte 219,313 (5.7743%),
  SP 1,200,367 (31.6043%), SVP 680,944 (17.9285%), GLP 350,053 (9.2165%), Grüne 404,927
  (10.6613%) and the other parties 408,072 (10.7441%), each within 0.00005 points

#### Scenario: Die Mitte before 2021

- **WHEN** the party strength of Die Mitte of Zürich is computed for the election of 2015
- **THEN** it counts the votes of CVP (142,412) and of BDP (76,901): 219,313

### Requirement: The languages, the area and the cattle

A language's share SHALL be the inhabitants with it as main language in percent of all
inhabitants in the census of 2000 (BFS, economic residence). The area SHALL be swisstopo's area
of 2026 with its part of a lake. The cattle per inhabitant SHALL be the cattle of a year (BFS,
farm structure survey) divided by the inhabitants at the end of the same year.

#### Scenario: Zürich

- **WHEN** these characteristics of Zürich (261) are computed for 2015
- **THEN** German is 282,277 of 363,273 (77.7038%), French 7,746 (2.1323%), Italian 17,063
  (4.6970%) and Romansh 990 (0.2725%); the area is 9,188 ha, 91.88 km²; the cattle are 850,
  0.002141 per inhabitant (`investigations/characteristics.md`), each share within 0.00005
  points

### Requirement: The figures that apply to a vote

For a vote, a characteristic SHALL take:
- the population at the end of the last year before the vote day of which the data file has
  figures, and the cattle of the last such year of which it has the cattle and the population;
- the party strengths of the last National Council election before the vote day;
- the languages of the census of 2000;
- the area of 2026.

#### Scenario: The vote of 2016-02-28

- **WHEN** the characteristics apply to the vote with id 5960 of 2016-02-28
- **THEN** they take the population at the end of 2015, the cattle of 2015 and the election of
  2015-10-18

#### Scenario: A vote before the year's election

- **WHEN** the characteristics apply to the vote with id 5920 of 2015-06-14
- **THEN** they take the population at the end of 2014, the cattle of 2014 and the election of
  2011-10-23

#### Scenario: The newest vote day

- **WHEN** the characteristics apply to the vote with id 6850 of 2026-03-08
- **THEN** they take the population at the end of 2025, the cattle of 2025 and the election of
  2023-10-22

#### Scenario: The year before is not published yet

- **GIVEN** a data file whose newest population and cattle are of 2025
- **WHEN** the characteristics apply to a vote of 2027-03-07
- **THEN** they take the population at the end of 2025 and the cattle of 2025

#### Scenario: The cattle published before the population

- **GIVEN** a data file whose newest cattle are of 2026 and whose newest population is of 2025
- **WHEN** the characteristics apply to a vote of 2027-03-07
- **THEN** they take the population at the end of 2025 and the cattle of 2025

#### Scenario: The population published before the cattle

- **GIVEN** a data file whose newest population is of 2025 and whose newest cattle are of 2024
- **WHEN** the characteristics apply to a vote of 2026-03-08
- **THEN** they take the population at the end of 2025, and the cattle of 2024 per inhabitant
  at the end of 2024

### Requirement: Figures of an earlier list of municipalities

The counts a source gives for a municipality of an earlier list SHALL be added to the
municipality of the list of 2026-01-01 it is part of, by the BFS register's correspondences.
Where a municipality of an earlier list is part of several of today's, each of those SHALL get
the counts of all of them together.

#### Scenario: A merger

- **WHEN** the population of Fétigny-Ménières (2056) at the end of 2015 is computed
- **THEN** it is 1,376: Fétigny's 962 and Ménières's 414

#### Scenario: A change of canton

- **WHEN** the population of Moutier (6831) at the end of 2015 is computed
- **THEN** it is 7,615, the figure the source gives for Moutier as municipality 700 of Bern

#### Scenario: Land exchanged in 2004

- **WHEN** the languages of Castel San Pietro (5249) and of Breggia (5269) are computed
- **THEN** both have those of the two together: Italian 3,359 of 3,724 (90.1987%)

### Requirement: Each source gives the list it is expected to give

The update SHALL stop when the municipalities a source gives are not exactly those of the
register's list of the date expected for it:
- population and farms: 2025-04-06;
- elections: 2023-01-01;
- census 2000: 2000-12-05;
- swisstopo's areas: 2026-01-01.

The error SHALL name the source, the date and each number that differs.

#### Scenario: A municipality the list does not have

- **GIVEN** a population table that also gives a municipality 9999 for every year
- **WHEN** the update command runs
- **THEN** it stops with an error that names the population table, 2025-04-06 and 9999, and
  writes no data file

#### Scenario: A municipality missing

- **GIVEN** swisstopo's areas without the municipality 261
- **WHEN** the update command runs
- **THEN** it stops with an error that names swissBOUNDARIES3D, 2026-01-01 and 261, and writes
  no data file

### Requirement: Every count of a characteristic is a whole number from zero

The update SHALL stop when a count of a source is missing (except as the requirement "A
municipality without an election result" allows), is not a whole number, or is below zero.
The error SHALL name the source, the municipality, the year and the figure. A value SHALL never
be replaced by zero, skipped, rounded or converted. An area SHALL be above zero.

#### Scenario: A missing population

- **GIVEN** a population table without the inhabitants of Zürich at the end of 2015
- **WHEN** the update command runs
- **THEN** it stops with an error that names the population table, 261, 2015 and
  "inhabitants", and writes no data file

#### Scenario: Cattle with a fraction

- **GIVEN** a farms table that gives Zürich 850.5 cattle for 2015
- **WHEN** the update command runs
- **THEN** it stops with an error that names the farms table, 261, 2015 and "cattle", and
  writes no data file

### Requirement: The counts add up

The update SHALL stop when, in a source:
- the municipalities do not add up to its figure for Switzerland (population, foreigners,
  cattle, each language);
- a municipality's age groups do not add up to its inhabitants;
- its foreigners exceed its inhabitants;
- a district's municipalities do not add up to the district's party votes.

The error SHALL name the source, the year and the figures.

#### Scenario: The ages do not add up

- **GIVEN** a population table in which Zürich's single years of age at the end of 2015 add up
  to 396,954, not 396,955
- **WHEN** the update command runs
- **THEN** it stops with an error that names the population table, 261 and 2015, and writes no
  data file

#### Scenario: The cattle do not add up

- **GIVEN** a farms table whose municipalities add up to one head of cattle more than its
  figure for Switzerland in 2015
- **WHEN** the update command runs
- **THEN** it stops with an error that names the farms table and 2015, and writes no data file

### Requirement: A municipality without an election result

When the elections table gives no party any votes in a municipality, that municipality SHALL
have no party strengths for that election, and its seven party characteristics SHALL have no
figure. A party without votes in a municipality where other parties have votes SHALL count zero
votes there.

#### Scenario: Meienried

- **WHEN** the characteristics of Meienried (389) apply to the vote with id 5960
- **THEN** its seven party characteristics have no figure, and its population is 52

#### Scenario: A party without a list

- **WHEN** the party strengths of Zürich are computed for the election of 2023
- **THEN** CVP and BDP count zero votes and Die Mitte's 265,215 votes are its own

### Requirement: The data file of the characteristics

The update command SHALL write `app/static/data/characteristics.json` with, for each
municipality of the list, the counts every characteristic is computed from, for every year from
the one before the first vote day to the newest the sources give, and every election from the
last before the first vote day. It SHALL hold no value that the sources do not give. When a
source lacks one of these years or elections, the update SHALL stop and name them. The same
sources SHALL give the same bytes.

#### Scenario: The years in the file

- **GIVEN** the sources as they were on 2026-11-15
- **WHEN** the update command has run
- **THEN** the file holds the population at the end of, and the cattle of, each year from 2012
  to 2025, the elections of 2011, 2015, 2019 and 2023, the census of 2000 and the areas of 2026,
  for 2,110 municipalities

#### Scenario: A year missing

- **GIVEN** a table of the cattle that gives no figures of 2012
- **WHEN** the update command runs
- **THEN** it stops with "cattle.json: no figures of the years [2012]", and the data files stay
  as they were

#### Scenario: A second run changes nothing

- **GIVEN** the update command has run and the sources have not changed since
- **WHEN** it runs again
- **THEN** `git status` shows no change of `app/static/data/characteristics.json`
