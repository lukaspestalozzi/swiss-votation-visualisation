# Spec Delta

## MODIFIED Requirements

### Requirement: The record of the sources

The pipeline SHALL write, with the data files, a record of every source file they were made
from: its address, its size, its checksum, and for a BFS vote-day file the time the file states
for itself. The data files hold no time of the run: an update with unchanged sources SHALL
leave every data file unchanged, byte for byte.

#### Scenario: The record names every source file

- **GIVEN** the sources as they were on 2026-11-15
- **WHEN** the record of the sources is read
- **THEN** it names 45 BFS vote-day files, the answer of the Federal Chancellery, the answer of
  the BFS register of municipalities, the register's three answers with the boundaries of the
  municipalities, of the cantons and of Switzerland, and the BFS ThemaKart set 2026, each with
  its address, size and checksum

#### Scenario: A second run changes nothing

- **GIVEN** the update command has run and the sources have not changed since
- **WHEN** it runs again
- **THEN** `git status` shows no changed data file
