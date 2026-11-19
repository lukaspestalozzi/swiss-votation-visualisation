# reading-guide Specification

## Purpose

The explanation that a selection of municipalities is a thought experiment about whole
municipalities, not about people and not a forecast, and the sources of everything the site
shows.

The page "Lesehilfe" names the reference date of the list of municipalities and the year of the
lakes from the map's data file `app/static/data/map.json` (the `municipalities` capability: the
BFS register of municipalities and the BFS ThemaKart set, on the list of 2026-01-01), which the
pipeline's update command (`pipeline/README.md`) regenerates, and links to the record of the
sources, `app/static/data/sources.json`, which the same command writes. The figures in the
scenarios are those of `investigations/limits.md`.

## Requirements

### Requirement: The sentence at the limits

At the top of the section "Gemeinden auswählen" (the `limits` capability), the page of a vote
SHALL say "Ein Gedankenexperiment: So wäre die Abstimmung ausgegangen, wenn nur die ausgewählten
Gemeinden abgestimmt hätten. Es zeigt nicht, wie einzelne Menschen gestimmt haben, und ist keine
Prognose.", followed by the link "Lesehilfe und Quellen" to `/guide/`.

#### Scenario: The sentence on a vote's page

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the section "Gemeinden auswählen" begins with that sentence and the link "Lesehilfe
  und Quellen", which opens `/guide/`

### Requirement: The page "Lesehilfe"

The build SHALL write a page at `/guide/`, headed "Lesehilfe", with the link "Alle Abstimmungen"
to the start page, and these sections in this order, each under its heading: "Das echte
Ergebnis", "Gemeinden auswählen", "Was die Auswahl nicht zeigt", "Auslandschweizerinnen und
Auslandschweizer", "Gemeinden ohne eigenes Ergebnis oder ohne Angabe", "Die Merkmale" and
"Quellen".

#### Scenario: The page and its sections

- **WHEN** a visitor opens `/guide/`
- **THEN** the page's heading is "Lesehilfe", it links to the start page with "Alle
  Abstimmungen", and it shows the seven headings in this order

### Requirement: The real result

The section "Das echte Ergebnis" SHALL say that the figures and the verdicts at the top of a vote's
page are the official result, calculated from the figures of the municipalities by the rules of
the Federal Constitution, and that a recalculated result appears beside them, under "Mit Ihrer
Auswahl", only while municipalities are selected.

#### Scenario: The official result first

- **WHEN** a visitor opens `/guide/`
- **THEN** the section "Das echte Ergebnis" says "Oben auf der Seite einer Abstimmung steht ihr
  amtliches Ergebnis."

### Requirement: How a selection works

The section "Gemeinden auswählen" SHALL say: a limit sets a lower and an upper bound on one
characteristic; a municipality remains only when it lies within all limits at once; the others are
dark grey on the map and do not count; the result is calculated as if only the remaining
municipalities had voted, by the real rules, so a canton with no municipality left has no
cantonal vote; and when nothing remains, the vote fails.

#### Scenario: The rule in plain words

- **WHEN** a visitor opens `/guide/`
- **THEN** the section "Gemeinden auswählen" says "Eine Gemeinde bleibt nur, wenn sie innerhalb
  aller Grenzen liegt." and "Ein Kanton, in dem keine Gemeinde übrig ist, hat keine
  Standesstimme."

### Requirement: What a selection does not show

The section "Was die Auswahl nicht zeigt" SHALL say that a selection keeps or sets aside whole
municipalities with all their votes, so that it shows neither how the people with a
characteristic voted nor what would happen at another vote, and that it is no forecast.

#### Scenario: Municipalities, not people

- **WHEN** a visitor opens `/guide/`
- **THEN** the section "Was die Auswahl nicht zeigt" says "Eine Gemeinde mit vielen
  über 65-Jährigen zählt mit allen ihren Stimmen, auch mit denen der Jüngeren." and "Die Auswahl
  ist keine Prognose."

### Requirement: The Swiss abroad explained

The section "Auslandschweizerinnen und Auslandschweizer" SHALL say that 11 or 12 cantons count
their votes apart, from 1.0% to 1.6% of the valid votes, that they are not on the map and have no
characteristics, and that the switch counts them only in a canton where a municipality remains.

#### Scenario: The switch explained

- **WHEN** a visitor opens `/guide/`
- **THEN** the section says "Sie zählen nur in einem Kanton, in dem noch eine Gemeinde übrig ist."
  (`investigations/limits.md`, 1)

### Requirement: Municipalities without a result or a figure explained

The section "Gemeinden ohne eigenes Ergebnis oder ohne Angabe" SHALL say that a hatched municipality
has its votes counted with another municipality, so that a limit changes no count through it, and
that a narrowed limit sets aside a municipality without a figure for its characteristic, which
happens with the party strengths of a few small municipalities of the canton of Bern.

#### Scenario: Without a figure

- **WHEN** a visitor opens `/guide/`
- **THEN** the section says "Eine Gemeinde ohne Angabe fällt weg, sobald die Grenze dieses Merkmals
  enger gestellt ist." (`investigations/limits.md`, 2)

### Requirement: The characteristics explained

The section "Die Merkmale" SHALL say that a vote takes the figures of the population and the
cattle at the end of the last year before its day and of the last National Council election
before it, the languages of the census of 2000 and the area of 2026; that a limit compares a value
as the panel writes it; and that the tracks of the four characteristics with very large spans grow
by equal factors.

#### Scenario: The dates of the figures

- **WHEN** a visitor opens `/guide/`
- **THEN** the section "Die Merkmale" names "Volkszählung 2000" and says that the tracks of
  "Einwohner", "Einwohner je km²", "Fläche" and "Rinder je Einwohner" grow by equal factors

### Requirement: The sources

The section "Quellen" SHALL name the source of every figure the site shows: the vote results of
the BFS and the Federal Chancellery's validated results; the BFS register of municipalities and
its generalised boundaries, with the reference date of the list, and the lakes' ThemaKart set
with its year, both from the map's data file; and the five sources of the characteristics. It
SHALL link to `data/sources.json`, the record of every file read.

#### Scenario: The sources on 2026-11-16

- **GIVEN** the data files of 2026-11-16
- **WHEN** a visitor opens `/guide/`
- **THEN** the section "Quellen" names the BFS, the Bundeskanzlei, "Stand 1. Januar 2026",
  "ThemaKart 2026", "STATPOP", "Nationalratswahlen", "Volkszählung 2000", "Landwirtschaftliche
  Strukturerhebung" and "swissBOUNDARIES3D 2026", and links to `data/sources.json`

### Requirement: Every page links to the guide

Every page under `/de/`, `/fr/` and `/it/` SHALL link to the guide from its head, with the
guide's name "Lesehilfe" (the `site-style` capability, "The head of every page"); on the guide
itself the name is not a link. The start page SHALL show no other link to the guide below its
heading.

#### Scenario: From the start page

- **WHEN** a visitor opens the start page and follows "Lesehilfe" in its head
- **THEN** the page "Lesehilfe" opens
- **AND** the start page shows no link "Lesehilfe und Quellen"

#### Scenario: From a vote's page

- **WHEN** a visitor opens `/votes/5960/` and follows "Lesehilfe" in its head
- **THEN** the page "Lesehilfe" opens
