# Spec Delta

## MODIFIED Requirements

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
  der Gemeinde, wo immer diese wohnen." and "Sind die Zahlen des letzten Jahres noch nicht
  veröffentlicht, gelten die neuesten davor."
