# Spec Delta

## MODIFIED Requirements

### Requirement: The record of the sources

The pipeline SHALL write, with the data files, a record of every source file they were made
from: its address, its size, its checksum, for a BFS vote-day file the time the file states for
itself, and for an answer to a query the query it answers. The data files hold no time of the
run: an update with unchanged sources SHALL leave every data file unchanged, byte for byte.

#### Scenario: The record names every source file

- **GIVEN** the sources as they were on 2026-11-22
- **WHEN** the record of the sources is read
- **THEN** it names 45 BFS vote-day files, the answer of the Federal Chancellery, the answer of
  the BFS register of municipalities, the register's three answers with the boundaries of the
  municipalities, of the cantons and of Switzerland, and the BFS ThemaKart set 2026, each with
  its address, size and checksum
- **AND** for the characteristics it names 61 answers of the BFS statistics API (STAT-TAB) to a
  query and its description of the table of the elections, the register's lists of 2000-12-05,
  2023-01-01, 2024-01-01 and 2025-04-06 and its correspondences from each of them to 2026-01-01,
  and
  swisstopo's swissBOUNDARIES3D of 2026-01, each with its address, size and checksum, and each
  answer of STAT-TAB and of the Federal Chancellery with its query

#### Scenario: A second run changes nothing

- **GIVEN** the update command has run and the sources have not changed since
- **WHEN** it runs again
- **THEN** `git status` shows no changed data file
