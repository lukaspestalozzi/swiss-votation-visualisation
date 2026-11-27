## MODIFIED Requirements

### Requirement: The list of votes

The pipeline SHALL write one list of all covered votes, ordered by date and then by id. For
each vote it SHALL hold: the id the BFS gives it, the number the Federal Chancellery gives it,
the date, the kind, the title in German, French and Italian as the BFS gives it, the result, the
Chancellery's reference and note, and the sums of the vote's entries. It SHALL NOT hold whether
the vote is validated: a validated vote is the one with a reference. A title that is missing or
empty in one of the three languages SHALL stop the update.

#### Scenario: A vote in the list

- **WHEN** the vote with id 5960 is read from the list of votes
- **THEN** its number is 596, its date is 2016-02-28, its kind is `popular-initiative`, and its
  German title is "Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»"

#### Scenario: Three questions under one number

- **WHEN** the votes of 2026-03-08 are read from the list of votes
- **THEN** the ids 6821, 6822 and 6823 are three votes, and each has the number 682

#### Scenario: No mark of validation

- **WHEN** the list of votes is read
- **THEN** no vote in it holds a field that says whether it is validated

#### Scenario: A title is missing

- **GIVEN** a BFS file in which a vote has no Italian title
- **WHEN** the update command runs
- **THEN** it stops with an error that names the vote and the language, and writes no data file

### Requirement: The result of a vote

The result of a validated vote SHALL be the Federal Chancellery's: the yes votes, the no votes,
the cantonal votes in favour and against, and whether the vote passed. A vote is validated when
the Chancellery gives its yes and its no votes. The result of any other vote SHALL be the one
of the BFS file, without a reference. Cantonal votes SHALL be held as the source of the result
gives them, and as none where it gives none. A tie-break question SHALL have no verdict.

#### Scenario: A validated vote

- **WHEN** the vote with id 5960 is read from the list of votes
- **THEN** its result is the Chancellery's, 1,609,152 yes votes, 1,664,224 no votes, cantonal
  votes of 16.5 in favour and 6.5 against, and not passed (`investigations/data-sources.md`,
  "Reference values"), with the reference "BBl 2019 4599"

#### Scenario: A validated optional referendum has no cantonal votes

- **WHEN** the vote with id 6790, the optional referendum of 2025-09-28, is read from the list
  of votes
- **THEN** its result is 1,384,586 yes votes, 1,363,362 no votes and passed, and its cantonal
  votes in favour and against are both none, because the Federal Chancellery gives none

#### Scenario: A vote that is not validated

- **GIVEN** the sources as they were on 2026-11-14
- **WHEN** the vote with id 6850, the optional referendum of 2026-03-08 "Bundesgesetz über die
  Individualbesteuerung", is read from the list of votes
- **THEN** its result is the one of the BFS file: 1,662,477 yes votes, 1,401,322 no votes,
  cantonal votes of 10 in favour and 13 against, and passed; and its reference is none

#### Scenario: The validated and the other votes on 2026-11-14

- **GIVEN** the sources as they were on 2026-11-14
- **WHEN** the list of votes is read
- **THEN** 117 votes hold a reference and 8 do not: the six of 2026-03-08 and the two of
  2026-06-14

#### Scenario: A tie-break question has no verdict

- **WHEN** the vote with id 6823 is read from the list of votes
- **THEN** its result holds yes and no votes as its source gives them, and whether it passed is
  none

#### Scenario: A validated vote without a verdict

- **GIVEN** a vote of a kind other than the tie-break question, for which the Federal
  Chancellery gives yes and no votes and neither "accepted" nor "rejected"
- **WHEN** the update command runs
- **THEN** it stops with an error that names the vote, and writes no data file

### Requirement: Adding a vote day

One command, run by hand, SHALL bring the data files up to date: it downloads the sources,
runs every check of the pipeline, and writes all data files, adding a new vote day and
replacing a result once validated. When a source cannot be reached or a check fails, it SHALL
say which, exit with a status other than zero, and leave every data file as it was. The
calculation's check runs with the unit tests; `pipeline/README.md` SHALL give the procedure.

#### Scenario: A new vote day

- **GIVEN** data files that end with the votes of 2026-06-14, and sources that have complete
  results for 2026-09-27
- **WHEN** the update command runs
- **THEN** the list of votes also has the votes of 2026-09-27, each with its file of entries,
  and the output names the votes added

#### Scenario: A vote is validated

- **GIVEN** data files in which a vote has no reference, and sources in which the Federal
  Chancellery now gives its result
- **WHEN** the update command runs
- **THEN** the vote in the list of votes holds the Chancellery's result and reference

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
