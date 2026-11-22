# Spec Delta

## MODIFIED Requirements

### Requirement: Municipalities without a result or a figure explained

The section "Gemeinden ohne eigenes Ergebnis oder ohne Angabe" SHALL say that a hatched municipality
has its votes counted with another municipality, so that a limit changes no count through it, and
that a narrowed limit sets aside a municipality without a figure for its characteristic, which
happens with the party strengths of a few small municipalities of the canton of Bern, with a
sector's jobs where the BFS withholds their number, and with the organic share where there is no
farmland.

#### Scenario: Without a figure

- **WHEN** a visitor opens `/guide/`
- **THEN** the section says "Eine Gemeinde ohne Angabe fällt weg, sobald die Grenze dieses Merkmals
  enger gestellt ist." (`investigations/limits.md`, 2)

#### Scenario: Jobs and farmland without a figure

- **WHEN** a visitor opens `/de/guide/`
- **THEN** the section says "Bei den Arbeitsplätzen eines Sektors fehlt die Angabe, wo das BFS die
  Zahl nicht veröffentlicht, und beim Bio-Anteil, wo es keine landwirtschaftliche Nutzfläche
  gibt." (`investigations/more-characteristics.md`, 6 and 7)

### Requirement: The characteristics explained

The section "Die Merkmale" SHALL say that a vote takes the population, the jobs, the cattle and
the farms of the last year before its day, or the newest published before that, the last National
Council election before it, the census of 2000 and the area of 2026; that jobs count where the
workplace is; that a limit compares a value as the panel writes it; and that the tracks of the
six characteristics with very large spans grow by equal factors.

#### Scenario: The dates of the figures

- **WHEN** a visitor opens `/guide/`
- **THEN** the section "Die Merkmale" names "Volkszählung 2000" and says that the tracks of
  "Einwohner", "Einwohner je km²", "Arbeitsplätze je 100 Einwohner", "Fläche", "Rinder je
  Einwohner" and "Landwirtschaftsbetriebe je 1'000 Einwohner" grow by equal factors

#### Scenario: What the jobs count

- **WHEN** a visitor opens `/de/guide/`
- **THEN** the section "Die Merkmale" says "Arbeitsplätze sind die Beschäftigten der Betriebe in
  der Gemeinde, wo immer diese wohnen." and "Wo die Zahlen des letzten Jahres noch nicht
  veröffentlicht sind, nimmt sie die neuesten davor."

### Requirement: The sources

The section "Quellen" SHALL name the source of every figure the site shows: the vote results of
the BFS and the Federal Chancellery's validated results; the BFS register of municipalities and
its generalised boundaries, with the reference date of the list, and the lakes' ThemaKart set
with its year, both from the map's data file; and the six sources of the characteristics. It
SHALL link to `data/sources.json`, the record of every file read.

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
