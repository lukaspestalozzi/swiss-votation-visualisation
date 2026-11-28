## ADDED Requirements

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
