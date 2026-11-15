## MODIFIED Requirements

### Requirement: The record of the sources

The pipeline SHALL write, with the data files, a record of every source file they were made
from: its address, its size, its checksum, for a BFS vote-day file the time the file states for
itself, and for an answer to a query the query it answers. The data files hold no time of the
run: an update with unchanged sources SHALL leave every data file unchanged, byte for byte.

#### Scenario: The record names every source file

- **GIVEN** the sources as they were on 2026-11-15
- **WHEN** the record of the sources is read
- **THEN** it names 45 BFS vote-day files, the answer of the Federal Chancellery, the answer of
  the BFS register of municipalities, the register's three answers with the boundaries of the
  municipalities, of the cantons and of Switzerland, and the BFS ThemaKart set 2026, each with
  its address, size and checksum
- **AND** for the characteristics it names 49 answers of the BFS statistics API (STAT-TAB), the
  register's lists of 2000-12-05, 2023-01-01 and 2025-04-06 and its correspondences from each of
  them to 2026-01-01, and swisstopo's swissBOUNDARIES3D of 2026-01, each with its address, size
  and checksum, and each answer of STAT-TAB and of the Federal Chancellery with its query

#### Scenario: A second run changes nothing

- **GIVEN** the update command has run and the sources have not changed since
- **WHEN** it runs again
- **THEN** `git status` shows no changed data file

### Requirement: Adding a vote day

One command, run by hand, SHALL bring the data files up to date: it downloads the sources,
runs the pipeline's checks of this capability, of `municipalities` and of `characteristics`,
and writes all data files, adding a new vote day and replacing a result once validated. When a
source cannot be reached or a check fails, it SHALL say which, exit with a status other than
zero, and leave every data file as it was. The calculation's check runs with the unit tests;
`pipeline/README.md` SHALL give the procedure.

#### Scenario: A new vote day

- **GIVEN** data files that end with the votes of 2026-06-14, and sources that have complete
  results for 2026-09-27
- **WHEN** the update command runs
- **THEN** the list of votes also has the votes of 2026-09-27, each with its file of entries,
  and the output names the votes added

#### Scenario: A vote is validated

- **GIVEN** data files in which a vote is not validated, and sources in which the Federal
  Chancellery now gives its result
- **WHEN** the update command runs
- **THEN** the vote is validated in the list of votes, with the Chancellery's result and
  reference

#### Scenario: A source cannot be reached

- **GIVEN** the Federal Chancellery's server does not answer
- **WHEN** the update command runs
- **THEN** it names the address, exits with a status other than zero, and every data file is as
  it was before

#### Scenario: A check fails

- **GIVEN** sources in which one check of this capability fails
- **WHEN** the update command runs
- **THEN** it exits with a status other than zero, and every data file is as it was before

#### Scenario: The characteristics' source cannot be reached

- **GIVEN** the BFS statistics API does not answer
- **WHEN** the update command runs
- **THEN** it names the address, exits with a status other than zero, and every data file is as
  it was before
