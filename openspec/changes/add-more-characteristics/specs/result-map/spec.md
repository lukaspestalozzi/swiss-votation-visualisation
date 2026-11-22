# Spec Delta

## MODIFIED Requirements

### Requirement: The characteristics of a municipality beside the map

Beside the map SHALL stand a panel headed "Merkmale der Gemeinde" with the characteristics of
the municipality last clicked or tapped (the `characteristics` capability), for the
figures that apply to the vote. It shows the municipality's name as its details write it, then
the 35 characteristics in eight groups, each group headed with the date of its figures. A line
whose figures are of another year than its group's heading SHALL name its year.

#### Scenario: Zürich in 2016

- **WHEN** a visitor opens `/votes/5960/` and clicks Zürich
- **THEN** the panel shows "Zürich (ZH)" and, under "Bevölkerung Ende 2015": "Einwohner:
  396'955", "Ausländeranteil: 32.03%", "Im Ausland geboren: 41.07%", "0–17 Jahre: 15.37%",
  "18–34 Jahre: 27.13%", "35–49
  Jahre: 25.41%", "50–64 Jahre: 16.43%", "65 Jahre und älter: 15.66%", "Einwohner je km²:
  4'320"
- **AND** under "Nationalratswahl 2015": "FDP: 14.07%", "Die Mitte (bis 2020 CVP und BDP):
  5.77%", "SP: 31.60%", "SVP: 17.93%", "GLP: 9.22%", "Grüne: 10.66%", "Übrige Parteien:
  10.74%"
- **AND** under "Hauptsprache, Volkszählung 2000": "Deutsch: 77.70%", "Französisch: 2.13%",
  "Italienisch: 4.70%", "Rätoromanisch: 0.27%"
- **AND** under "Religion, Volkszählung 2000": "Evangelisch-reformiert: 30.28%",
  "Römisch-katholisch: 33.27%", "Keine Religionszugehörigkeit: 16.83%"
- **AND** under "Ausbildung, Volkszählung 2000": "Hochschule oder höhere Berufsbildung: 24.92%",
  "Obligatorische Schule oder keine Ausbildung: 26.20%"
- **AND** under "Wohnen, Volkszählung 2000": "Vom Eigentümer bewohnte Wohnungen: 7.11%",
  "Einfamilienhäuser: 23.62%"
- **AND** under "Arbeit Ende 2015": "Arbeitsplätze je 100 Einwohner: 118.1", "Arbeitsplätze im
  Primärsektor: 0.05%", "Arbeitsplätze im Sekundärsektor: 6.41%", "Arbeitsplätze im
  Tertiärsektor: 93.54%"
- **AND** under "Fläche und Landwirtschaft": "Fläche (2026): 91.88 km²" and "Rinder je
  Einwohner (2015): 0.002", "Landwirtschaftsbetriebe je 1'000 Einwohner (2015): 0.1" and
  "Bio-Anteil der landwirtschaftlichen Nutzfläche (2015): 44.56%"
  (`investigations/characteristics.md`, `investigations/more-characteristics.md`)

#### Scenario: The figures follow the vote

- **GIVEN** the data file of 2026-11-22, whose newest jobs are those of 2024
- **WHEN** a visitor opens `/votes/6850/` and clicks Zürich
- **THEN** the panel's groups are headed "Bevölkerung Ende 2025", "Nationalratswahl 2023" and
  "Arbeit Ende 2024", and it shows "Arbeitsplätze je 100 Einwohner: 124.9"

#### Scenario: A line of another year than its group

- **GIVEN** a data file whose newest population is of 2025 and whose newest figures of those
  born abroad are of 2024
- **WHEN** a visitor opens `/votes/6850/` and clicks Zürich
- **THEN** under "Bevölkerung Ende 2025" stands "Im Ausland geboren (Ende 2024): 44.58%"

#### Scenario: Without a figure

- **WHEN** a visitor opens `/votes/5960/` and clicks Oberrieden
- **THEN** the panel shows "Arbeitsplätze im Primärsektor: keine Angabe", "Arbeitsplätze im
  Sekundärsektor: keine Angabe", "Arbeitsplätze im Tertiärsektor: 89.39%" and "Bio-Anteil der
  landwirtschaftlichen Nutzfläche (2015): keine Angabe"

### Requirement: How the characteristics are written

The panel SHALL write inhabitants and shares as the `vote-list` capability writes counts and
shares. It SHALL write the inhabitants per km² as a whole number, the area in km² with two
decimals, the cattle per inhabitant with three, and the jobs per 100 inhabitants and the farms
per 1,000 inhabitants with one, each rounded half away from zero, with its digits grouped as a
count is.

#### Scenario: Meienried's cattle

- **WHEN** a visitor opens `/votes/5960/` and clicks Meienried
- **THEN** the panel shows "Einwohner je km²: 80", "Fläche (2026): 0.65 km²" and "Rinder je
  Einwohner (2015): 2.519", "Arbeitsplätze je 100 Einwohner: 44.2" and
  "Landwirtschaftsbetriebe je 1'000 Einwohner (2015): 76.9"

### Requirement: The sources of the characteristics

Below the characteristics, the panel SHALL name their sources: "Quellen: BFS (STATPOP, STATENT,
Nationalratswahlen, Volkszählung 2000, Landwirtschaftliche Strukturerhebung); swisstopo
(swissBOUNDARIES3D 2026)."

#### Scenario: The sources

- **WHEN** a visitor opens `/votes/5960/` and clicks Zürich
- **THEN** the panel ends with "Quellen: BFS (STATPOP, STATENT, Nationalratswahlen, Volkszählung 2000,
  Landwirtschaftliche Strukturerhebung); swisstopo (swissBOUNDARIES3D 2026)."
