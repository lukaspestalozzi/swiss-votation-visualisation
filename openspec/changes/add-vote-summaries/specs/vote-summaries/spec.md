# Spec Delta

## Purpose

A short summary of every vote that says what the proposal was about, in German, French and
Italian, with a link to the Federal Council's explanations of its vote day, so that a visitor
knows what was decided before reading its map.

The summaries are the site's own, written from the Federal Council's explanations ("Erläuterungen
des Bundesrates", the voting booklet, published by the Federal Chancellery on www.admin.ch for
each vote day) and kept in `pipeline/vote-summaries.json`, which is written by hand and
reviewed. The pipeline's update command (`pipeline/README.md`) checks them and writes them into
the list of votes (`vote-data`), on the list of municipalities of 2026-01-01. Where the
explanations of each vote day are published is in `investigations/vote-summaries.md`.

## ADDED Requirements

### Requirement: What a summary says

A vote's summary SHALL say in two or three sentences what the proposal would change or would have
changed, in the present tense of the proposal, from the short text that opens its part of the
Federal Council's explanations. It SHALL NOT give the result, an argument for or against, or
the recommendation or position of the Federal Council, Parliament, a party or a committee. A
tie-break question's summary SHALL say what the question asks.

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

### Requirement: The length and form of a summary

Each summary SHALL be in German, French and Italian, each of at least 120 and at most 450
characters, as plain text: no line break, no markup, no link. The update SHALL stop with an
error that names the vote and the language when a summary is missing, empty, shorter or longer.

#### Scenario: A summary too long

- **GIVEN** a file of the summaries whose French summary of 5960 has 451 characters
- **WHEN** the update command runs
- **THEN** it stops with an error that names 5960 and French, and every data file is as it was
  before

#### Scenario: A summary with a line break

- **GIVEN** a file of the summaries whose German summary of 5960 holds a line break
- **WHEN** the update command runs
- **THEN** it stops with an error that names 5960 and German, and every data file is as it was
  before

### Requirement: Every vote has a summary, and every summary a vote

The file of the summaries SHALL hold a summary for every vote the update writes, and none for a vote
it does not write. A vote without a summary SHALL stop the update with an error that names its id
and date; a summary whose vote is not among the votes SHALL stop it with an error that names the
id.

#### Scenario: A new vote day without its summaries

- **GIVEN** sources with complete results for 2026-11-29, and a file of the summaries without the
  votes of that day
- **WHEN** the update command runs
- **THEN** it stops with an error that names each vote of 2026-11-29 by its id and date, and
  every data file is as it was before

#### Scenario: A summary for no vote

- **GIVEN** a file of the summaries that holds a summary for the id 9990, which no source gives
- **WHEN** the update command runs
- **THEN** it stops with an error that names 9990, and every data file is as it was before

### Requirement: The link to the explanations

Each vote day SHALL have in the file of the summaries the address of the Federal Council's
explanations in German, French and Italian, each an `https` address on `www.admin.ch`. The
update SHALL request each address and stop, naming the vote day, the language and the address,
when one is missing, on another server, or does not answer with a PDF.

#### Scenario: An address that no longer answers

- **GIVEN** a file of the summaries whose Italian address for 2016-02-28 answers with status 404
- **WHEN** the update command runs
- **THEN** it stops with an error that names 2016-02-28, Italian and the address, and every
  data file is as it was before

#### Scenario: An address on another server

- **GIVEN** a file of the summaries whose German address for 2016-02-28 is on `swissvotes.ch`
- **WHEN** the update command runs
- **THEN** it stops with an error that names 2016-02-28, German and the address, and requests
  nothing from that server

### Requirement: The summary on a vote's page

A vote's page SHALL show the vote's summary in the page's language below its head (title, date,
kind and the majorities it needs) and above its result, and below the summary a link "Erläuterungen
des Bundesrates (PDF)" ("Explications du Conseil fédéral (PDF)", "Spiegazioni del Consiglio
federale (PDF)") to the address of its vote day in that language. The summary SHALL be no wider
than a paragraph of the site (`site-style`).

#### Scenario: The summary of a vote

- **WHEN** a visitor opens `/de/votes/5960/`
- **THEN** below "Braucht das Volksmehr und das Ständemehr." and above "Echtes Ergebnis" stands
  the German summary of 5960 from the file of the summaries, and below it the link "Erläuterungen des
  Bundesrates (PDF)" to the German address of 2016-02-28

#### Scenario: The summary in French and Italian

- **WHEN** a visitor opens `/fr/votes/5960/` and `/it/votes/5960/`
- **THEN** each shows the summary of 5960 in its language, and the link "Explications du Conseil
  fédéral (PDF)" or "Spiegazioni del Consiglio federale (PDF)" to the address of 2016-02-28 in
  its language

#### Scenario: The tie-break question's page

- **WHEN** a visitor opens `/de/votes/6823/`
- **THEN** its summary and the link stand below its head, as on the page of a judged vote

#### Scenario: On a phone

- **WHEN** a visitor opens `/de/votes/5960/` in a window 360 pixels wide
- **THEN** the page is no wider than the window, and the link is at least 44 pixels high on a
  touch screen (`small-screens`)

#### Scenario: Both colour schemes

- **WHEN** a visitor opens `/de/votes/5960/` with a light and with a dark colour scheme
- **THEN** the summary and the link have at least 4.5:1 against the colour behind them, and the
  link is in the text's colour (`site-style`)

### Requirement: The summary on the comparison

The comparison SHALL show each chosen vote's summary in the page's language below that vote's
head and above its results, with the link to its explanations, as its vote's page does.

#### Scenario: Two summaries

- **WHEN** a visitor opens `/de/compare/#votes=5960,5970`
- **THEN** below the head of 5960 stands its German summary with the link to the explanations of
  2016-02-28, and below the head of 5970 its German summary with the same link, both above
  "Echtes Ergebnis"

#### Scenario: No vote chosen

- **WHEN** a visitor opens `/de/compare/` without votes in its address
- **THEN** the page shows no summary
