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

Every municipality of the list SHALL have 35 characteristics, in this order:
- 9 of the population: inhabitants, foreigners, born abroad, five age groups, inhabitants per
  km²;
- 7 party strengths: FDP, Die Mitte, SP, SVP, GLP, Grüne, the other parties;
- 4 languages: German, French, Italian, Romansh;
- 3 of religion, 2 of education, 2 of housing;
- 4 of the jobs: per 100 inhabitants, and three sectors;
- area, cattle per inhabitant, farms per 1,000 inhabitants, organic share of farmland.

#### Scenario: The names of the characteristics

- **WHEN** the characteristics of a municipality are listed
- **THEN** their names are, in this order: "Einwohner", "Ausländeranteil", "Im Ausland geboren",
  "0–17 Jahre", "18–34 Jahre", "35–49 Jahre", "50–64 Jahre", "65 Jahre und älter", "Einwohner je
  km²", "FDP", "Die Mitte (bis 2020 CVP und BDP)", "SP", "SVP", "GLP", "Grüne", "Übrige
  Parteien", "Deutsch", "Französisch", "Italienisch", "Rätoromanisch", "Evangelisch-reformiert",
  "Römisch-katholisch", "Keine Religionszugehörigkeit", "Hochschule oder höhere Berufsbildung",
  "Obligatorische Schule oder keine Ausbildung", "Vom Eigentümer bewohnte Wohnungen",
  "Einfamilienhäuser", "Arbeitsplätze je 100 Einwohner", "Arbeitsplätze im Primärsektor",
  "Arbeitsplätze im Sekundärsektor", "Arbeitsplätze im Tertiärsektor", "Fläche", "Rinder je
  Einwohner", "Landwirtschaftsbetriebe je 1'000 Einwohner", "Bio-Anteil der landwirtschaftlichen
  Nutzfläche"

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

### Requirement: The characteristics of the population

The characteristics of the population SHALL be computed from the permanent resident population
at the end of a year (BFS, STATPOP): the inhabitants; the foreigners and each age group in
percent of the inhabitants; those born abroad at the end of a year in percent of the inhabitants
at the end of the same year; the inhabitants per km² of the municipality's area.

#### Scenario: Zürich at the end of 2015

- **WHEN** the characteristics of the population of Zürich (261) at the end of 2015 are
  computed
- **THEN** they are 396,955 inhabitants; 127,151 foreigners (32.0316%); 163,047 born abroad
  (41.0744%); 61,020 aged 0–17 (15.3720%), 107,696 aged 18–34 (27.1305%), 100,857 aged 35–49
  (25.4077%), 65,204 aged 50–64 (16.4260%) and 62,178 aged 65 and over (15.6637%); 4,320.36
  inhabitants per km² (`investigations/characteristics.md`,
  `investigations/more-characteristics.md`), each share within 0.00005 points

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
  figures;
- those born abroad, the jobs, and the cattle and the farms, each of the last such year of which
  the file has them and the population;
- the party strengths of the last National Council election before the vote day;
- the languages, the religion, the education and the housing of the census of 2000;
- the area of 2026.

#### Scenario: The vote of 2016-02-28

- **WHEN** the characteristics apply to the vote with id 5960 of 2016-02-28
- **THEN** they take the population, those born abroad and the jobs at the end of 2015, the
  cattle and the farms of 2015 and the election of 2015-10-18

#### Scenario: A vote before the year's election

- **WHEN** the characteristics apply to the vote with id 5920 of 2015-06-14
- **THEN** they take the population, those born abroad and the jobs at the end of 2014, the
  cattle and the farms of 2014 and the election of 2011-10-23

#### Scenario: The newest vote day

- **GIVEN** the data file of 2026-11-23, whose newest jobs are those of 2024
- **WHEN** the characteristics apply to the vote with id 6850 of 2026-03-08
- **THEN** they take the population and those born abroad at the end of 2025, the cattle and
  the farms of 2025, the jobs at the end of 2024 and the election of 2023-10-22

#### Scenario: The year before is not published yet

- **GIVEN** a data file whose newest population, cattle and farms are of 2025
- **WHEN** the characteristics apply to a vote of 2027-03-07
- **THEN** they take the population at the end of 2025 and the cattle and the farms of 2025

#### Scenario: The cattle published before the population

- **GIVEN** a data file whose newest cattle are of 2026 and whose newest population is of 2025
- **WHEN** the characteristics apply to a vote of 2027-03-07
- **THEN** they take the population at the end of 2025 and the cattle of 2025

#### Scenario: The population published before the cattle

- **GIVEN** a data file whose newest population is of 2025 and whose newest cattle and farms are
  of 2024
- **WHEN** the characteristics apply to a vote of 2026-03-08
- **THEN** they take the population at the end of 2025, and the cattle and the farms of 2024 per
  inhabitant at the end of 2024

#### Scenario: Those born abroad published later

- **GIVEN** a data file whose newest population is of 2025 and whose newest figures of those
  born abroad are of 2024
- **WHEN** the characteristics apply to a vote of 2026-03-08
- **THEN** they take the population at the end of 2025, and those born abroad at the end of 2024
  in percent of the inhabitants at the end of 2024: for Zürich 194,608 of 436,551 (44.5785%)

#### Scenario: The jobs published later

- **GIVEN** a data file whose newest population is of 2025 and whose newest jobs are of 2024
- **WHEN** the characteristics apply to a vote of 2026-03-08
- **THEN** they take the population at the end of 2025, and the jobs at the end of 2024 per 100
  inhabitants at the end of 2024

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
- population, place of birth and farms: 2025-04-06;
- jobs: 2024-01-01;
- elections: 2023-01-01;
- census 2000 (languages, religion, education, dwellings, buildings): 2000-12-05;
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

#### Scenario: The jobs on another list

- **GIVEN** a jobs table without the municipality 261
- **WHEN** the update command runs
- **THEN** it stops with an error that names the jobs table, 2024-01-01 and 261, and writes no
  data file

### Requirement: Every count of a characteristic is a whole number from zero

The update SHALL stop when a count of a source is missing (except as the requirements "A
municipality without an election result" and "A count the source withholds" allow), is not a
whole number, or is below zero. The error SHALL name the source, the municipality, the year and
the figure. A value SHALL never be replaced by zero, skipped, rounded or converted. An area SHALL
be above zero.

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

#### Scenario: A religion without a count

- **GIVEN** a religion table without the Roman Catholics of Zürich
- **WHEN** the update command runs
- **THEN** it stops with an error that names the religion table, 261, 2000 and "Roman
  Catholic", and writes no data file

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

- **GIVEN** the sources as they were on 2026-11-23
- **WHEN** the update command has run
- **THEN** the file holds the population and those born abroad at the end of, and the cattle and
  the farms of, each year from 2012 to 2025, the jobs at the end of each year from 2012 to 2024,
  the elections of 2011, 2015, 2019 and 2023, the census of 2000 with its languages, religion,
  education, dwellings and buildings, and the areas of 2026, for 2,110 municipalities

#### Scenario: A year missing

- **GIVEN** a table of the cattle that gives no figures of 2012
- **WHEN** the update command runs
- **THEN** it stops with "cattle.json: no figures of the years [2012]", and the data files stay
  as they were

#### Scenario: A second run changes nothing

- **GIVEN** the update command has run and the sources have not changed since
- **WHEN** it runs again
- **THEN** `git status` shows no change of `app/static/data/characteristics.json`

### Requirement: The religion of 2000

The shares of religion SHALL be the Evangelical Reformed, the Roman Catholic and the inhabitants
without a religious affiliation, each in percent of all inhabitants in the census of 2000 (BFS,
economic residence). The inhabitants of every other religion and those without an answer SHALL
count among all inhabitants only.

#### Scenario: Zürich

- **WHEN** the shares of religion of Zürich (261) are computed
- **THEN** of 363,273 inhabitants, 110,008 are Evangelical Reformed (30.2825%), 120,853 Roman
  Catholic (33.2678%) and 61,153 without a religious affiliation (16.8339%)
  (`investigations/more-characteristics.md`, 12), each within 0.00005 points

### Requirement: The education of 2000

The shares of education SHALL be computed from the highest completed education in the census of
2000 (BFS, economic residence), in percent of the inhabitants who named a level: those with a
degree of a university, a university of applied sciences or higher vocational education, and
those with compulsory school or no completed education. The inhabitants of school age or below
it and those without an answer SHALL count in neither.

#### Scenario: Zürich

- **WHEN** the shares of education of Zürich (261) are computed
- **THEN** 290,377 inhabitants named a level: 72,373 a university or higher vocational degree
  (24.9238%) and 76,077 compulsory school or none (26.1994%)
  (`investigations/more-characteristics.md`, 12), each within 0.00005 points

#### Scenario: Few answers

- **WHEN** the shares of education of Hérémence (6084) are computed, where 16 inhabitants named
  a level and 1,077 past school age gave no answer
- **THEN** they are 6 of 16 (37.5000%) and 4 of 16 (25.0000%): the municipality has its figures
  like any other (`investigations/more-characteristics.md`, 3)

### Requirement: The housing of 2000

The share of dwellings lived in by their owner SHALL be the occupied dwellings whose occupant
owns the flat, the house, or the house with others, in percent of all occupied dwellings. The
share of single-family houses SHALL be the single-family houses in percent of the buildings with
dwellings. Both SHALL come from the buildings and dwellings survey of the census of 2000 (BFS),
from its tables that are asked for the year.

#### Scenario: Zürich

- **WHEN** the shares of housing of Zürich (261) are computed
- **THEN** 12,920 of 181,801 occupied dwellings are lived in by their owner (7.1067%), and 8,530
  of 36,121 buildings with dwellings are single-family houses (23.6151%)
  (`investigations/more-characteristics.md`, 4 and 12), each within 0.00005 points

### Requirement: The jobs

The jobs SHALL be the employed persons at the workplaces of a municipality at the end of a year
(BFS, STATENT), wherever they live. The jobs per 100 inhabitants SHALL be all jobs divided by the
inhabitants at the end of the same year, times 100. A sector's share SHALL be the jobs of the
primary, the secondary or the tertiary sector in percent of all jobs.

#### Scenario: Zürich at the end of 2015

- **WHEN** the jobs of Zürich (261) at the end of 2015 are computed
- **THEN** they are 468,852 jobs, 118.1121 per 100 of its 396,955 inhabitants; 231 in the
  primary sector (0.0493%), 30,062 in the secondary (6.4118%) and 438,559 in the tertiary
  (93.5389%) (`investigations/more-characteristics.md`, 12), each within 0.00005

#### Scenario: One sector only

- **WHEN** the jobs of Bister (6172) at the end of 2015 are computed
- **THEN** they are 9 jobs, 29.0323 per 100 of its 31 inhabitants, all in the primary sector:
  100.0000%, 0.0000% and 0.0000%

### Requirement: A count the source withholds

Where the jobs table gives its sign for a withheld count in place of a count, the data file
SHALL hold none for it, never zero, and every characteristic computed from it SHALL have no
figure for that municipality and year. A municipality of the list made of several of the table's
SHALL have none where one of them has none. Any other sign in place of a count SHALL stop the
update.

#### Scenario: Two sectors withheld

- **WHEN** the jobs of Oberrieden (137) at the end of 2015 are computed, where the table
  withholds the counts of the primary and the secondary sector
- **THEN** "Arbeitsplätze im Primärsektor" and "Arbeitsplätze im Sekundärsektor" have no figure;
  its 1,037 jobs are 20.5877 per 100 of its 5,037 inhabitants, and 927 of them are in the
  tertiary sector (89.3925%) (`investigations/more-characteristics.md`, 12)

#### Scenario: A part of a municipality

- **WHEN** the jobs of Rue (2097) at the end of 2015 are computed, which the table gives as
  Chapelle (Glâne), Auboranges, Ecublens (FR) and Rue, withholding Chapelle (Glâne)'s counts of
  the primary and the secondary sector
- **THEN** Rue has 434 jobs, 217 of them in the tertiary sector (50.0000%), and no figure for
  the primary and the secondary sector (`investigations/more-characteristics.md`, 6)

#### Scenario: All jobs withheld

- **GIVEN** the data file of 2026-11-23
- **WHEN** the characteristics of Linescio (5315) apply to the vote with id 6850 of 2026-03-08,
  where the table withholds the number of all its jobs at the end of 2024
- **THEN** its four characteristics of the jobs have no figure

#### Scenario: Another sign

- **GIVEN** a jobs table that gives "..." in place of Zürich's jobs at the end of 2015
- **WHEN** the update command runs
- **THEN** it stops with an error that names the jobs table, 261, 2015 and "jobs", and writes no
  data file

### Requirement: The farms and the organic farmland

The farms per 1,000 inhabitants SHALL be the farms of a year (BFS, farm structure survey)
divided by the inhabitants at the end of the same year, times 1,000. The organic share of the
farmland SHALL be the farmland of the organic farms in percent of the farmland of all farms, in
whole hectares as the source gives them. A municipality without farmland SHALL have no figure
for that share.

#### Scenario: Zürich in 2015

- **WHEN** these characteristics of Zürich (261) are computed for 2015
- **THEN** its 41 farms are 0.1033 per 1,000 of its 396,955 inhabitants, and 381 of its 855
  hectares of farmland are organic (44.5614%) (`investigations/more-characteristics.md`, 12),
  each within 0.00005

#### Scenario: Without farmland

- **WHEN** these characteristics of Oberrieden (137) are computed for 2015, where it has no farm
  and no farmland
- **THEN** its farms per 1,000 inhabitants are 0.0000, and the organic share of its farmland has
  no figure

#### Scenario: No organic farm

- **WHEN** these characteristics of Meienried (389) are computed for 2015, where none of its 60
  hectares of farmland is organic
- **THEN** the organic share of its farmland is 0.0000%

### Requirement: The counts of the new tables add up

The update SHALL stop when:
- the municipalities do not add up to a table's figure for Switzerland (those born abroad,
  farms, religions, levels of education, dwellings, buildings);
- a municipality's inhabitants of a year differ between the place-of-birth and the population
  table;
- its religions or levels of education do not add up to its inhabitants of 2000;
- its sectors do not add up to all its jobs, where none is withheld;
- its organic farmland exceeds its farmland.

#### Scenario: The place of birth against the population

- **GIVEN** a place-of-birth table with 396,954 inhabitants of Zürich at the end of 2015, where
  the population table has 396,955
- **WHEN** the update command runs
- **THEN** it stops with an error that names the place-of-birth table, 261 and 2015, and writes
  no data file

#### Scenario: The sectors do not add up

- **GIVEN** a jobs table in which Zürich's three sectors at the end of 2015 add up to 468,851,
  not to its 468,852 jobs
- **WHEN** the update command runs
- **THEN** it stops with an error that names the jobs table, 261 and 2015, and writes no data
  file

#### Scenario: The religions do not add up

- **GIVEN** a religion table in which Zürich's religions add up to 363,272, not to its 363,273
  inhabitants
- **WHEN** the update command runs
- **THEN** it stops with an error that names the religion table and 261, and writes no data file

#### Scenario: Farmland in whole hectares

- **GIVEN** the farms table of 2026-11-23, whose municipalities' farmland does not add up to its
  figure for Switzerland, each being a whole number of hectares
- **WHEN** the update command runs
- **THEN** it does not stop for that sum: the farmland is compared within a municipality only

### Requirement: The answers of final figures are kept

The update SHALL keep in `pipeline/stat-tab-cache/`, gzipped, the STAT-TAB answers of figures
that no longer change: the census of 2000, each National Council election but the newest, and
the population by age of each year but the newest the BFS gives. It SHALL take such an answer
from there when its query is the same, and ask STAT-TAB for every other. The record of the
sources SHALL say of each STAT-TAB answer whether it came from the cache.

#### Scenario: A normal update

- **GIVEN** the cache holds the answers of the census of 2000, of the elections of 2011, 2015
  and 2019, and of the population of 2012 to 2024
- **WHEN** the update command runs, and the BFS gives the population up to 2025 and the
  elections up to 2023
- **THEN** it asks STAT-TAB for the population of 2025 and the election of 2023 and takes the
  others from the cache, and the data files are the same as after a run that asks for all

#### Scenario: A query that changed

- **GIVEN** the cache holds the answer of the population of 2016 to a query, and the pipeline
  now asks that year with another query
- **WHEN** the update command runs
- **THEN** it asks STAT-TAB for that year and keeps the new answer in the cache

#### Scenario: A year that becomes final

- **GIVEN** the cache holds the population up to 2024, and the BFS now gives 2026 as its newest
  year
- **WHEN** the update command runs
- **THEN** the cache also holds the answers of 2025, and 2026 is asked anew at every run

#### Scenario: The record names the cached answers

- **WHEN** the record of the sources is read after a normal update
- **THEN** each STAT-TAB answer says whether it came from the cache, and the answers of the
  newest year say it did not

### Requirement: The refresh

`update --refresh` SHALL ask STAT-TAB for every answer, the cached ones too, and write the cache
anew with the answers of final figures. `pipeline/README.md` SHALL say to run it once a year,
with the new list of municipalities, and when the BFS revises past figures. A refresh whose
answers equal the cache SHALL leave the cache and every data file but the record of the sources
unchanged.

#### Scenario: A refresh

- **GIVEN** the cache holds the answers of final figures
- **WHEN** `update --refresh` runs
- **THEN** it asks STAT-TAB for all of them, and the record of the sources says of none that it
  came from the cache

#### Scenario: A revised past year

- **GIVEN** the BFS has revised its population of 2020, and the cache holds the former answer
- **WHEN** `update --refresh` runs
- **THEN** the cache holds the revised answer, and `characteristics.json` the revised counts
