# Spec Delta

## MODIFIED Requirements

### Requirement: The list of votes

The pipeline SHALL write one list of all covered votes, ordered by date and then by id. For
each vote it SHALL hold: the id the BFS gives it, the number the Federal Chancellery gives it,
the date, the kind, the title in German, French and Italian as the BFS gives it, whether the
vote is validated, the result, the Chancellery's reference and note, the sums of the
vote's entries, and its summary of what it is about and the address of its vote day's
explanations with that document's language, each for German, French and Italian, from the file
of the summaries
(`vote-summaries`). A title that is missing or empty in one of the three languages SHALL stop
the update.

#### Scenario: A vote in the list

- **WHEN** the vote with id 5960 is read from the list of votes
- **THEN** its number is 596, its date is 2016-02-28, its kind is `popular-initiative`, and its
  German title is "Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»"

#### Scenario: Three questions under one number

- **WHEN** the votes of 2026-03-08 are read from the list of votes
- **THEN** the ids 6821, 6822 and 6823 are three votes, and each has the number 682

#### Scenario: A title is missing

- **GIVEN** a BFS file in which a vote has no Italian title
- **WHEN** the update command runs
- **THEN** it stops with an error that names the vote and the language, and writes no data file

#### Scenario: A vote's summary and explanations

- **WHEN** the vote with id 5960 is read from the list of votes
- **THEN** its summary in each of the three languages is the one `pipeline/vote-summaries.json`
  holds for 5960, and the address of its explanations in each language is the one that file
  holds for 2016-02-28

#### Scenario: Three votes of one day share their explanations

- **WHEN** the votes 6821, 6822 and 6823 are read from the list of votes
- **THEN** each has a summary of its own, and all three have the same addresses of explanations,
  those of 2026-03-08

### Requirement: The record of the sources

The pipeline SHALL write, with the data files, a record of every source file they were made
from: its address, its size, its checksum, for a BFS vote-day file the time the file states for
itself, and for an answer to a query the query it answers. The record SHALL also name the file
of the summaries, `pipeline/vote-summaries.json`, with its size and checksum. The data files hold no
time of the run: an update with unchanged sources SHALL leave every data file unchanged, byte
for byte.

#### Scenario: The record names every source file

- **GIVEN** the sources as they were on 2026-11-23
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

#### Scenario: The record names the file of the summaries

- **WHEN** the record of the sources is read after an update
- **THEN** it names `pipeline/vote-summaries.json` with its size and checksum, and does not
  name the explanations, which the update requests but does not read

#### Scenario: A second run changes nothing

- **GIVEN** the update command has run and the sources have not changed since
- **WHEN** it runs again
- **THEN** `git status` shows no changed data file
