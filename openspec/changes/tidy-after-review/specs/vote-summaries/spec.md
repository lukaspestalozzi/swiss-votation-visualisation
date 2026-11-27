## MODIFIED Requirements

### Requirement: What a summary says

A vote's summary SHALL say in two or three sentences what the proposal would change or would have
changed, in the present tense of the proposal, from the short text that opens its part of the
Federal Council's explanations. It SHALL NOT give the result, an argument for or against, the
recommendation or position of the Federal Council, Parliament, a party or a committee, or a cost
or its funding that the campaign argued over. A figure that defines the change itself, such as a
new rate, an amount paid out or an age, MAY stand. A tie-break question's summary SHALL say what
the question asks.

#### Scenario: A sample is reviewed

- **GIVEN** the summaries of at least 15 votes chosen in `investigations/vote-summaries.md`, from
  every year from 2013 and of every kind, among them 6650 (13th AHV pension) and 5800 (against
  mass immigration)
- **WHEN** Q reads them before the change is merged
- **THEN** Q finds each accurate against its explanations and free of a result, an argument and
  a recommendation, or the change is not merged until it is

#### Scenario: The tie-break question's summary

- **WHEN** the German summary of the vote 6823 is read
- **THEN** it says that the question asks which of the initiative and the counter-proposal
  applies if voters and cantons accept both, and names neither result

#### Scenario: The motorways without their cost

- **WHEN** the summaries of the vote 6730, the motorways of 2024-11-24, are read
- **THEN** they name the six sections and no amount of francs

## ADDED Requirements

### Requirement: How a summary writes numbers

A summary SHALL write numbers as the rest of the screen does (the `vote-list` capability): a
decimal point, never a comma, and a whole number of five digits or more grouped by three with an
apostrophe ("10'100"); an amount of four digits is grouped too ("4'000 Franken"), a year is not.
The update SHALL stop with an error that names the vote and the language on a decimal comma, on
three digits parted from the digits before them by a space, and on five digits or more in a row.

#### Scenario: A decimal comma

- **GIVEN** a file of the summaries whose German summary of 6860 says "9,5 Millionen"
- **WHEN** the update command runs
- **THEN** it stops with an error that names 6860 and German, and every data file is as it was
  before

#### Scenario: Digits parted by a space

- **GIVEN** a file of the summaries whose Italian summary of 6330 says "10 100 franchi"
- **WHEN** the update command runs
- **THEN** it stops with an error that names 6330 and Italian, and every data file is as it was
  before

#### Scenario: The summaries as written

- **WHEN** the update command reads `pipeline/vote-summaries.json`
- **THEN** it finds no number to stop on, and the German summary of 6860 says "9.5 Millionen" and
  the German summary of 6330 "10'100"

### Requirement: The spaces of a French summary

A French summary SHALL take a no-break space (U+00A0) before ":", after « and before », and a
narrow no-break space (U+202F) before ";", "?" and "!", and no other space before these signs.
The update SHALL stop with an error that names the vote and French when one of these signs lacks
its space.

#### Scenario: A colon without its space

- **GIVEN** a file of the summaries whose French summary of 6750 says "pour besoin propre: le
  besoin", without a space before the colon
- **WHEN** the update command runs
- **THEN** it stops with an error that names 6750 and French, and every data file is as it was
  before

#### Scenario: Guillemets with their spaces

- **WHEN** the French summary of 6750 is read from `pipeline/vote-summaries.json`
- **THEN** it says "besoin propre : le besoin" and « urgent », each space a no-break space
