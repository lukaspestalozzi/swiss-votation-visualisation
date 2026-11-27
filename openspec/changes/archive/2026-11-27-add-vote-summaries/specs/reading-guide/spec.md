# Spec Delta

## MODIFIED Requirements

### Requirement: The sources

The section "Quellen" SHALL name the source of every figure the site shows: the vote results of
the BFS and the Federal Chancellery's validated results; the BFS register of municipalities and
its generalised boundaries, with the reference date of the list, and the lakes' ThemaKart set
with its year, both from the map's data file; and the six sources of the characteristics. It
SHALL say that the summary of each vote is the site's own summary of the Federal
Council's explanations, not an official text. It SHALL link to `data/sources.json`, the record
of every file read.

#### Scenario: The sources on 2026-11-16

- **GIVEN** the data files of 2026-11-16
- **WHEN** a visitor opens `/guide/`
- **THEN** the section "Quellen" names the BFS, the Bundeskanzlei, "Stand 1. Januar 2026",
  "ThemaKart 2026", "STATPOP", "Nationalratswahlen", "Volkszählung 2000", "Landwirtschaftliche
  Strukturerhebung" and "swissBOUNDARIES3D 2026", and links to `data/sources.json`

#### Scenario: The six sources of the characteristics

- **WHEN** a visitor opens `/de/guide/`
- **THEN** the section "Quellen" names "STATPOP", "STATENT", "Nationalratswahlen", "Volkszählung
  2000", "Landwirtschaftliche Strukturerhebung" and "swissBOUNDARIES3D 2026"

#### Scenario: The summaries of the votes

- **WHEN** a visitor opens `/de/guide/`, `/fr/guide/` and `/it/guide/`
- **THEN** the section names the summaries of the votes as the site's own summaries of the
  "Erläuterungen des Bundesrates" ("Explications du Conseil fédéral", "Spiegazioni del Consiglio
  federale"), in a sentence that is not the German one in French and Italian
