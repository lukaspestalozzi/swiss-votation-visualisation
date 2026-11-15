# Characteristics

Found while proposing `add-characteristics` (#7 of `docs/roadmap.md`), on 2026-11-15, from the
live sources. It answers the roadmap's first question for #7: where the characteristics of the
municipalities come from, for which years, on which list of municipalities, what they lack, and
how they come onto the list of the votes. It also gives the figures the specs cite. It decides
nothing: the design of `add-characteristics` records the decisions.

Words used here:
- **STAT-TAB** is the BFS statistics API (`https://www.pxweb.bfs.admin.ch/api/v1/de/`). It
  answers a query of a table with the cells asked for, in the format json-stat2 among others.
- The **register** is the BFS register of municipalities, which the pipeline already reads for the
  list.
- The **votes' list** is the register's list of 2026-01-01, which all data files use (2,110
  municipalities).
- A table's **list** is the register's list of the date whose municipalities it gives for all its
  years.

## How to reproduce

The scripts are in `investigations/characteristics/`. They need the package pyshp, which `uv`
provides for the run, to read swisstopo's areas; everything else uses Python's standard library.
They reuse `sources.py` of `investigations/data-sources/`. The downloads are about 55 MB and stay
outside the repository.

```sh
cd investigations/characteristics
uv run --no-project --with pyshp==3.1.6 python check_characteristic_sources.py /path/outside/the/repository
uv run --no-project --with pyshp==3.1.6 python reference_figures.py /path/outside/the/repository
```

| File | What |
|------|------|
| `figures.py` | The sources, their download (49 queries to STAT-TAB, at most 100,000 cells each, with a pause between them), the reader of json-stat2, and how counts of a table's list are added up onto the votes' list. |
| `check_characteristic_sources.py` | Each table's list against the register; missing values; the sums against the table's totals; the correspondences to the votes' list; swisstopo's areas; the size of a data file of the counts. |
| `reference_figures.py` | Which figures apply to each vote day, and the characteristics of the municipalities the specs name for the vote of 2016-02-28. |

"Output" at the end of this file is what these scripts printed on 2026-11-15.

## Sources

| Source | Address | What it gives | Publisher, terms |
|--------|---------|---------------|------------------|
| Population (STATPOP) | STAT-TAB table `px-x-0102010000_101` | The permanent and non-permanent resident population at the end of each year from 2010 to 2025, by municipality, nationality (Swiss, foreign), sex and single year of age (0 to 99, and 100 and over). | BFS. Not read. |
| National Council elections | STAT-TAB table `px-x-1702020000_105` | Per municipality and election since 1971: the votes and the strength of 25 parties (Parteistimmen, Parteistärke). | BFS. Not read. |
| Farms | STAT-TAB table `px-x-0702000000_104` | Per municipality and year since 1975 (yearly since 2010): farms, workers, farmland and livestock at classification level 1, among them cattle ("Tiere - Rinder"). | BFS, farm structure survey. Not read. |
| Census 2000 | STAT-TAB table `px-x-4003000000_123` | The population of 2000 per municipality by main language (36 languages), nationality and residence (legal or economic). | BFS. The same figures as the census file `su-d-vz-SPRA_HG_2000_1` (asset 147501, an `.xls` of 2004), whose terms are OPEN-BY. |
| Register's correspondences | `https://www.agvchapp.bfs.admin.ch/api/communes/correspondances?startPeriod=<dd-mm-yyyy>&endPeriod=<dd-mm-yyyy>` | For each municipality of the start date that changed until the end date, the municipality or municipalities it is part of at the end date. | BFS. The pages state no terms. |
| swissBOUNDARIES3D | `https://data.geo.admin.ch/ch.swisstopo.swissboundaries3d/swissboundaries3d_2026-01/swissboundaries3d_2026-01_2056_5728.shp.zip` (found through the STAC API `https://data.geo.admin.ch/api/stac/v0.9/collections/ch.swisstopo.swissboundaries3d/items`), 36 MB | The boundaries of the municipalities, districts, cantons and the country of 2026-01. Per municipality: `BFS_NUMMER`, `GEM_FLAECH` (its area in ha, its part of a lake included) and `SEE_FLAECH` (that part). | swisstopo. Not read. |

Looked at and not used:
- **The BFS Regionalporträts** ("Kennzahlen aller Gemeinden", order number `je-d-21.03.01`).
  They were published for 2015, 2016, 2018 and 2021 only, one year each.
- **The register's and ThemaKart's shapefiles.** They have no field for the area.
- **The BFS's languages after 2010:** the structural survey, by canton, district and city only
  (for example `su-d-40.02.01.08.09-2024`, "Hauptsprachen nach Bezirk, 2022-2024 kumuliert").
- **The language region of each municipality**, `SPRGEB2020` in the register's answer
  `https://www.agvchapp.bfs.admin.ch/api/communes/levels?date=01-01-2026`. It is on the votes'
  list, but it is a category (German, French, Italian or Romansh), not a share.
- **Cows**, the classification level 2 (`px-x-0702000000_102`), which is given by canton only.
- **identitas' animal statistics.** Since the renewal of its database, the site offers a
  "provisional" set of 20 evaluations of 2026-10-19 and no longer updates them.

## Answers

### 1. Every table gives all its years on one list, and each list is exact

Each table gives every year on one list of municipalities. That list is exactly the register's
list of one date: no municipality not in it, none of it missing.

| Table | Its list | Municipalities | Years read |
|-------|----------|----------------|------------|
| Population | 2025-04-06 | 2,115 | 2012 to 2025 |
| Elections | 2023-01-01 | 2,136, and 27 codes from 9000 on: the Swiss abroad and other votes of no municipality | 2011, 2015, 2019, 2023 |
| Farms | 2025-04-06 | 2,115, with the number in the label (`......0261 Zürich`); the code is a running number | 2012 to 2025 |
| Census 2000 | 2000-12-05 | 2,896 | 2000 |

None of them uses the votes' list. The BFS has brought each table's earlier years onto the
table's own list itself.

### 2. The register's correspondences bring them onto the votes' list

The register's correspondences from a table's list to 2026-01-01 name every municipality that
changed. The others keep their number.

| From | Numbers that lead to another number | To several |
|------|------|------|
| 2025-04-06 | 7, among them Moutier (700, Bern) to 6831 (Jura), and Fétigny (2016) and Ménières (2027) to Fétigny-Ménières (2056) | none |
| 2023-01-01 | 32 | none |
| 2000-12-05 | 928 | 4 |

The four are Caneggio, Casima, Castel San Pietro and Monte (Ticino). They exchanged land in
2004, and Caneggio became part of Breggia in 2009. Their figures of 2000 cannot be divided
between today's Castel San Pietro (5249) and Breggia (5269).

Added up this way, every municipality of the votes' list has its figures in every year. The
sums over Switzerland stay the same. Only the elections have municipalities without figures
(answer 4).

### 3. The counts are whole and add up

- **Population:**
  - The municipalities add up to the table's figure for Switzerland, in every year, for all
    inhabitants and for the foreigners (2015: 8,327,126 and 2,048,667).
  - The single years of age of each municipality add up to its total.
  - No value is missing.
  - The smallest municipality has 28 to 33 inhabitants.
- **Farms:** the survey's day within the year was not looked up (see "Not verified").
  - The municipalities add up to Switzerland's cattle in every year (2015: 1,554,319).
  - 117 to 148 municipalities have no cattle (0, not missing).
  - No value is missing.
- **Census 2000:** the municipalities add up to Switzerland's 7,288,010 inhabitants with
  economic residence, and to each of the four languages (German 4,640,359, French 1,485,056,
  Italian 470,961, Romansh 35,095). No value is missing. This is the population with economic
  residence. The census file of 2004 gives the same figures; the legal residence gives
  7,287,357.
- **Elections:** the municipalities of each district add up to the district, party by party.

### 4. Where a figure is missing

The elections table writes "..." in two cases:
- **A party that had no list in the municipality's canton.** Its municipalities have votes for
  other parties. Its votes there are none: 0.
- **A municipality without an election result of its own.** Every party is "..." there. These
  are the municipalities of the canton of Bern whose votes the BFS counts with another
  municipality's:

  | Election | Municipalities without votes |
  |------|------|
  | 2011 | 7: Meienried, Hellsau, Rüti bei Lyssach, Deisswil bei Münchenbuchsee, Oberhünigen, Jaberg, Niedermuhlern |
  | 2015 | the same 7 |
  | 2019 | 6, without Jaberg |
  | 2023 | 5, also without Rüti bei Lyssach |

  They are the vote data's municipalities without a result of their own
  (`investigations/data-sources.md`, "Votes that belong to no municipality on the map"). The
  vote data names the same municipalities: 7 until 2017, 6 from 2018 to 2020, 5 from 2021.

No other table has a missing value.

### 5. The parties

The table's 25 parties are FDP (1), Mitte (34), SP (3), SVP (4), LPS (5), EVP (7), CSP (8),
GLP (31), PdA (9), Sol. (27), FGA (12), Grüne (13), SD (15), EDU (16), Lega (18), MCR (33),
CVP (2), BDP (32), LdU (6), POCH (11), Rep. (14), PSA (10), FPS (17), Sep. (26) and Übrige (35).
- **Before Die Mitte:** in 2011, 2015 and 2019, CVP and BDP have votes and Mitte has none.
- **From 2023:** Mitte has votes and CVP and BDP have none.
- **A party's strength** is its votes divided by the votes of all parties in the municipality.
  For Zürich, Bern and Moutier in 2015 and 2023 this equals the table's own "Parteistärke in
  %" within 0.005 points.

### 6. Area

swissBOUNDARIES3D of 2026-01 has 2,110 municipal areas, exactly the votes' list. Each has its
area (`GEM_FLAECH`, in ha) and its part in a lake (`SEE_FLAECH`).
- **Lake parts:** 204 municipalities have a part in a lake.
- **Cantonal lakes:** the large lakes or parts that belong to a canton are areas of their own
  (`Kantonsgebiet`) and belong to no municipality. Examples: Zürichsee (ZH), Bodensee,
  Thunersee, Lac de Neuchâtel.
- **Size:** the municipalities cover 4,084,036 ha. The smallest is Gottlieben, with 32 ha.

### 7. Which figures apply to a vote day

The rule the reference figures use:
- **Population and cattle:** the population at the end of, and the cattle of, the last year
  before the vote day.
- **Parties:** the last National Council election before the vote day.
- **Language:** the census of 2000.
- **Area:** that of swissBOUNDARIES3D 2026-01.

The election days are 2011-10-23, 2015-10-18, 2019-10-20 and 2023-10-22. With the votes of the
data files, this gives:

| Population and cattle | Election | Vote days |
|------|------|------|
| 2012 | 2011 | 2013-03-03 to 2013-11-24 (4) |
| 2013 | 2011 | 2014-02-09 to 2014-11-30 (4) |
| 2014 | 2011 | 2015-03-08 to 2015-06-14 (2) |
| 2015 | 2015 | 2016-02-28 to 2016-11-27 (4) |
| 2016 | 2015 | 2017-02-12 to 2017-09-24 (3) |
| 2017 | 2015 | 2018-03-04 to 2018-11-25 (4) |
| 2018 | 2015 | 2019-02-10 to 2019-05-19 (2) |
| 2019 | 2019 | 2020-02-09 to 2020-11-29 (3) |
| 2020 | 2019 | 2021-03-07 to 2021-11-28 (4) |
| 2021 | 2019 | 2022-02-13 to 2022-09-25 (3) |
| 2022 | 2019 | 2023-06-18 (1) |
| 2023 | 2023 | 2024-03-03 to 2024-11-24 (4) |
| 2024 | 2023 | 2025-02-09 to 2025-11-30 (3) |
| 2025 | 2023 | 2026-03-08 to 2026-09-27 (3) |

No vote day falls between June and the end of an election year. So the exact election day
decides nothing in these votes.

The population at the end of a year is published in the following August or September. A vote
day early in a year comes before the figures of the year before exist. A run of the update then
has only the year before that.

### 8. The size of the data

A file of the counts the characteristics need, for each municipality of the votes' list, is
1,342,669 bytes, 563,089 compressed with gzip. It holds:
- the population and its parts for 14 years;
- the votes of the six named parties and of the others for 4 elections;
- the cattle for 14 years;
- the four languages of 2000 and their total;
- the area.

### 9. The figures of named municipalities for the vote of 2016-02-28

The population at the end of 2015, the cattle of 2015, the election of 2015, the census of 2000
and the area of 2026, per municipality of the votes' list (`reference_figures.py`). A share is given to four
decimals. A spec rounds it to two, half away from zero.

| | Zürich (261) | Bern (351) | Meienried (389) | Fétigny-Ménières (2056) | Moutier (6831) |
|---|---|---|---|---|---|
| Inhabitants | 396,955 | 131,554 | 52 | 1,376 (962 + 414) | 7,615 |
| Foreigners | 127,151 (32.0316%) | 33,207 (25.2421%) | 2 (3.8462%) | 192 (13.9535%) | 2,066 (27.1307%) |
| Aged 0–17 | 61,020 (15.3720%) | 19,081 (14.5043%) | 3 (5.7692%) | 356 (25.8721%) | 1,347 (17.6888%) |
| Aged 18–34 | 107,696 (27.1305%) | 35,606 (27.0657%) | 12 (23.0769%) | 283 (20.5669%) | 1,632 (21.4314%) |
| Aged 35–49 | 100,857 (25.4077%) | 30,078 (22.8636%) | 8 (15.3846%) | 353 (25.6541%) | 1,481 (19.4485%) |
| Aged 50–64 | 65,204 (16.4260%) | 23,631 (17.9630%) | 20 (38.4615%) | 194 (14.0988%) | 1,539 (20.2101%) |
| Aged 65 and over | 62,178 (15.6637%) | 23,158 (17.6034%) | 9 (17.3077%) | 190 (13.8081%) | 1,616 (21.2213%) |
| Area | 9,188 ha (395 ha lake) | 5,162 ha | 65 ha | 848 ha | 1,961 ha |
| Inhabitants per km² | 4,320.3635 | 2,548.5083 | 80.0000 | 162.2642 | 388.3223 |
| Cattle | 850 (0.002141 per inhabitant) | 1,189 (0.009038) | 131 (2.519231) | 509 (0.369913) | 765 (0.100460) |
| Party votes | 3,798,109 | 1,184,235 | none | 2,744 | 38,276 |
| FDP | 14.0710% | 9.9150% | – | 14.9052% | 8.1565% |
| Die Mitte (CVP + BDP) | 5.7743% (142,412 + 76,901) | 9.6042% | – | 25.2187% | 13.0473% |
| SP | 31.6043% | 34.3309% | – | 16.2901% | 29.5747% |
| SVP | 17.9285% | 12.3902% | – | 38.5933% | 31.4427% |
| GLP | 9.2165% | 9.3843% | – | 0.9840% | 1.4552% |
| Grüne | 10.6613% | 17.3869% | – | 3.8994% | 5.2748% |
| The others | 10.7441% | 6.9886% | – | 0.1093% | 11.0487% |
| Main language 2000, of | 363,273 | 128,634 | 59 | 883 | 7,701 |
| German | 77.7038% | 81.2110% | 93.2203% | 2.9445% | 3.9346% |
| French | 2.1323% | 3.6312% | 5.0847% | 96.2627% | 86.4563% |
| Italian | 4.6970% | 3.9352% | 0.0000% | 0.2265% | 3.5710% |
| Romansh | 0.2725% | 0.1329% | 0.0000% | 0.0000% | 0.0260% |

Castel San Pietro (5249) and Breggia (5269) both have the languages of the two together:
- 3,724 inhabitants in 2000;
- German 6.6864%, French 0.9667%, Italian 90.1987%, Romansh 0.0537%.

Their other figures are their own, as the Output shows.

## Not verified

- The terms of use of STAT-TAB's tables, the register's correspondences and swissBOUNDARIES3D.
  The census file's asset states OPEN-BY.
- **The four election days** (2011-10-23, 2015-10-18, 2019-10-20, 2023-10-22). They were not
  read from a source here: the elections table gives only the years.
- When STAT-TAB moves the population and the farms to a newer list. Today it uses the list of
  2025-04-06, although the votes already use that of 2026-01-01.
- **The land exchanges between municipalities** that the correspondences do not show, because no
  number changes. A figure of an earlier year counts such land where it was then.
- The day of the year to which the farm structure survey counts the cattle.
- Whether swisstopo's areas of 2026-01 change in a later release for the same list.

## Output

`check_characteristic_sources.py <data>`:

```
Population (BFS, STATPOP): Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Staatsangehörigkeit (Kategorie), Geschlecht und Alter
  its municipalities: 2115 (and 0 codes from 9000 on, which are no municipality); against the register of 06-04-2025: 0 not in it, 0 of it missing
  years read: 2012 to 2025; values missing: 0
  2012: Switzerland 8,039,060, the municipalities add up to 8,039,060; foreigners 1,869,969 and 1,869,969; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 30
  2013: Switzerland 8,139,631, the municipalities add up to 8,139,631; foreigners 1,937,447 and 1,937,447; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 30
  2014: Switzerland 8,237,666, the municipalities add up to 8,237,666; foreigners 1,998,459 and 1,998,459; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 33
  2015: Switzerland 8,327,126, the municipalities add up to 8,327,126; foreigners 2,048,667 and 2,048,667; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 31
  2016: Switzerland 8,419,550, the municipalities add up to 8,419,550; foreigners 2,101,146 and 2,101,146; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 30
  2017: Switzerland 8,484,130, the municipalities add up to 8,484,130; foreigners 2,126,392 and 2,126,392; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 29
  2018: Switzerland 8,544,527, the municipalities add up to 8,544,527; foreigners 2,148,275 and 2,148,275; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 28
  2019: Switzerland 8,606,033, the municipalities add up to 8,606,033; foreigners 2,175,375 and 2,175,375; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 32
  2020: Switzerland 8,670,300, the municipalities add up to 8,670,300; foreigners 2,210,788 and 2,210,788; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 32
  2021: Switzerland 8,738,791, the municipalities add up to 8,738,791; foreigners 2,244,181 and 2,244,181; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 33
  2022: Switzerland 8,815,385, the municipalities add up to 8,815,385; foreigners 2,296,023 and 2,296,023; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 29
  2023: Switzerland 8,962,258, the municipalities add up to 8,962,258; foreigners 2,417,288 and 2,417,288; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 31
  2024: Switzerland 9,051,029, the municipalities add up to 9,051,029; foreigners 2,479,888 and 2,479,888; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 32
  2025: Switzerland 9,127,125, the municipalities add up to 9,127,125; foreigners 2,528,117 and 2,528,117; ages missing 0, municipalities whose ages do not add up to the total: 0; smallest municipality 29

National Council elections (BFS): Nationalratswahlen (Parteistimmen und Parteistärke seit 1971: Bezirke und Gemeinden)
  parties: 1 FDP, 34 Mitte, 3 SP, 4 SVP, 5 LPS, 7 EVP, 8 CSP, 31 GLP, 9 PdA, 27 Sol., 12 FGA, 13 Grüne, 15 SD, 16 EDU, 18 Lega, 33 MCR, 2 CVP, 32 BDP, 6 LdU, 11 POCH, 14 Rep., 10 PSA, 17 FPS, 26 Sep., 35 Übrige
  its municipalities: 2136 (and 27 codes from 9000 on, which are no municipality); against the register of 01-01-2023: 0 not in it, 0 of it missing
  2011: signs for missing values {'...': 33819}; municipalities without any party votes: 7 ['Meienried', 'Hellsau', 'Rüti bei Lyssach', 'Deisswil bei Münchenbuchsee', 'Oberhünigen', 'Jaberg', 'Niedermuhlern']; districts whose municipalities do not add up: []
  2015: signs for missing values {'...': 35171}; municipalities without any party votes: 7 ['Meienried', 'Hellsau', 'Rüti bei Lyssach', 'Deisswil bei Münchenbuchsee', 'Oberhünigen', 'Jaberg', 'Niedermuhlern']; districts whose municipalities do not add up: []
  2019: signs for missing values {'...': 34588}; municipalities without any party votes: 6 ['Meienried', 'Hellsau', 'Rüti bei Lyssach', 'Deisswil bei Münchenbuchsee', 'Oberhünigen', 'Niedermuhlern']; districts whose municipalities do not add up: []
  2023: signs for missing values {'...': 36692}; municipalities without any party votes: 5 ['Meienried', 'Hellsau', 'Deisswil bei Münchenbuchsee', 'Oberhünigen', 'Niedermuhlern']; districts whose municipalities do not add up: []

Farms (BFS): Beschäftigte, Landwirtschaftliche Betriebe, Landwirtschaftliche Nutzfläche (LN) und Nutztiere auf Klassifizierungsebene 1 nach Beobachtungseinheit, Kanton (-) / Bezirk (>>) / Gemeinde (......), Betriebssystem und Jahr
  its municipalities: 2115 (and 0 codes from 9000 on, which are no municipality); against the register of 06-04-2025: 0 not in it, 0 of it missing
  2012: cattle in Switzerland 1,564,631, the municipalities add up to 1,564,631; municipalities without cattle 123
  2013: cattle in Switzerland 1,550,319, the municipalities add up to 1,550,319; municipalities without cattle 117
  2014: cattle in Switzerland 1,562,801, the municipalities add up to 1,562,801; municipalities without cattle 119
  2015: cattle in Switzerland 1,554,319, the municipalities add up to 1,554,319; municipalities without cattle 125
  2016: cattle in Switzerland 1,555,396, the municipalities add up to 1,555,396; municipalities without cattle 129
  2017: cattle in Switzerland 1,544,612, the municipalities add up to 1,544,612; municipalities without cattle 127
  2018: cattle in Switzerland 1,543,345, the municipalities add up to 1,543,345; municipalities without cattle 133
  2019: cattle in Switzerland 1,524,820, the municipalities add up to 1,524,820; municipalities without cattle 138
  2020: cattle in Switzerland 1,515,123, the municipalities add up to 1,515,123; municipalities without cattle 140
  2021: cattle in Switzerland 1,513,701, the municipalities add up to 1,513,701; municipalities without cattle 138
  2022: cattle in Switzerland 1,525,270, the municipalities add up to 1,525,270; municipalities without cattle 141
  2023: cattle in Switzerland 1,528,595, the municipalities add up to 1,528,595; municipalities without cattle 144
  2024: cattle in Switzerland 1,533,483, the municipalities add up to 1,533,483; municipalities without cattle 144
  2025: cattle in Switzerland 1,528,177, the municipalities add up to 1,528,177; municipalities without cattle 148
  values missing: 0

Census 2000 (BFS): Wohnbevölkerung 2000 nach Wohnsitztyp, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie) und Hauptsprache
  its municipalities: 2896 (and 0 codes from 9000 on, which are no municipality); against the register of 05-12-2000: 0 not in it, 0 of it missing
  all main languages: Switzerland 7,288,010, the municipalities add up to 7,288,010
  German: Switzerland 4,640,359, the municipalities add up to 4,640,359
  French: Switzerland 1,485,056, the municipalities add up to 1,485,056
  Italian: Switzerland 470,961, the municipalities add up to 470,961
  Romansh: Switzerland 35,095, the municipalities add up to 35,095
  values missing: 0

Onto the votes' list of 01-01-2026 (2110 municipalities), through the register's correspondences:
  population (06-04-2025): 7 numbers lead to another number, 0 to several: {}
    2012: without figures 0 []; sums kept: True
    2013: without figures 0 []; sums kept: True
    2014: without figures 0 []; sums kept: True
    2015: without figures 0 []; sums kept: True
    2016: without figures 0 []; sums kept: True
    2017: without figures 0 []; sums kept: True
    2018: without figures 0 []; sums kept: True
    2019: without figures 0 []; sums kept: True
    2020: without figures 0 []; sums kept: True
    2021: without figures 0 []; sums kept: True
    2022: without figures 0 []; sums kept: True
    2023: without figures 0 []; sums kept: True
    2024: without figures 0 []; sums kept: True
    2025: without figures 0 []; sums kept: True
  party votes (01-01-2023): 32 numbers lead to another number, 0 to several: {}
    2011: without figures 7 ['Meienried', 'Hellsau', 'Rüti bei Lyssach', 'Deisswil bei Münchenbuchsee', 'Oberhünigen', 'Jaberg', 'Niedermuhlern']
    2015: without figures 7 ['Meienried', 'Hellsau', 'Rüti bei Lyssach', 'Deisswil bei Münchenbuchsee', 'Oberhünigen', 'Jaberg', 'Niedermuhlern']
    2019: without figures 6 ['Meienried', 'Hellsau', 'Rüti bei Lyssach', 'Deisswil bei Münchenbuchsee', 'Oberhünigen', 'Niedermuhlern']
    2023: without figures 5 ['Meienried', 'Hellsau', 'Deisswil bei Münchenbuchsee', 'Oberhünigen', 'Niedermuhlern']
  cattle (06-04-2025): 7 numbers lead to another number, 0 to several: {}
    2012: without figures 0 []; sums kept: True
    2013: without figures 0 []; sums kept: True
    2014: without figures 0 []; sums kept: True
    2015: without figures 0 []; sums kept: True
    2016: without figures 0 []; sums kept: True
    2017: without figures 0 []; sums kept: True
    2018: without figures 0 []; sums kept: True
    2019: without figures 0 []; sums kept: True
    2020: without figures 0 []; sums kept: True
    2021: without figures 0 []; sums kept: True
    2022: without figures 0 []; sums kept: True
    2023: without figures 0 []; sums kept: True
    2024: without figures 0 []; sums kept: True
    2025: without figures 0 []; sums kept: True
  languages (05-12-2000): 928 numbers lead to another number, 4 to several: {5246: {5249, 5269}, 5248: {5249, 5269}, 5249: {5249, 5269}, 5256: {5249, 5269}}
    2000: without figures 0 []; sums kept: True; groups: [(5249, 5269)]

swissBOUNDARIES3D 2026-01: 2110 municipalities; against the list of 01-01-2026: 0 not in it, 0 missing; 204 with a part in a lake; total 4,084,036 ha; smallest (32, 'Gottlieben')

A file of these counts per municipality of the votes' list (the six named parties and the others): 1,342,669 bytes, 563,089 compressed with gzip
```

`reference_figures.py <data>`:

```
Vote days and the figures that apply:
  population and cattle 2012, election 2011 (2011-10-23): 2013-03-03 to 2013-11-24 (4 vote days)
  population and cattle 2013, election 2011 (2011-10-23): 2014-02-09 to 2014-11-30 (4 vote days)
  population and cattle 2014, election 2011 (2011-10-23): 2015-03-08 to 2015-06-14 (2 vote days)
  population and cattle 2015, election 2015 (2015-10-18): 2016-02-28 to 2016-11-27 (4 vote days)
  population and cattle 2016, election 2015 (2015-10-18): 2017-02-12 to 2017-09-24 (3 vote days)
  population and cattle 2017, election 2015 (2015-10-18): 2018-03-04 to 2018-11-25 (4 vote days)
  population and cattle 2018, election 2015 (2015-10-18): 2019-02-10 to 2019-05-19 (2 vote days)
  population and cattle 2019, election 2019 (2019-10-20): 2020-02-09 to 2020-11-29 (3 vote days)
  population and cattle 2020, election 2019 (2019-10-20): 2021-03-07 to 2021-11-28 (4 vote days)
  population and cattle 2021, election 2019 (2019-10-20): 2022-02-13 to 2022-09-25 (3 vote days)
  population and cattle 2022, election 2019 (2019-10-20): 2023-06-18 to 2023-06-18 (1 vote days)
  population and cattle 2023, election 2023 (2023-10-22): 2024-03-03 to 2024-11-24 (4 vote days)
  population and cattle 2024, election 2023 (2023-10-22): 2025-02-09 to 2025-11-30 (3 vote days)
  population and cattle 2025, election 2023 (2023-10-22): 2026-03-08 to 2026-09-27 (3 vote days)

The characteristics for the vote of 2016-02-28 (population and cattle 2015, election 2015, census 2000, area 2026), per municipality of the list of 01-01-2026:
  261 Zürich: inhabitants 396,955; foreigners 127,151 (32.0316%)
    ages 0-17: 61,020 (15.3720%), 18-34: 107,696 (27.1305%), 35-49: 100,857 (25.4077%), 50-64: 65,204 (16.4260%), 65-: 62,178 (15.6637%)
    area 9,188 ha = 91.88 km2 (lake part 395 ha); inhabitants per km2 4320.3635
    cattle 850, per inhabitant 0.002141
    party votes 3,798,109: FDP 534,433 (14.0710%), Die Mitte 219,313 (5.7743%), SP 1,200,367 (31.6043%), SVP 680,944 (17.9285%), GLP 350,053 (9.2165%), Grüne 404,927 (10.6613%), Übrige 408,072 (10.7441%)
    census 2000, main language of 363,273: German 282,277 (77.7038%), French 7,746 (2.1323%), Italian 17,063 (4.6970%), Romansh 990 (0.2725%)
  351 Bern: inhabitants 131,554; foreigners 33,207 (25.2421%)
    ages 0-17: 19,081 (14.5043%), 18-34: 35,606 (27.0657%), 35-49: 30,078 (22.8636%), 50-64: 23,631 (17.9630%), 65-: 23,158 (17.6034%)
    area 5,162 ha = 51.62 km2 (lake part 0 ha); inhabitants per km2 2548.5083
    cattle 1,189, per inhabitant 0.009038
    party votes 1,184,235: FDP 117,417 (9.9150%), Die Mitte 113,736 (9.6042%), SP 406,558 (34.3309%), SVP 146,729 (12.3902%), GLP 111,132 (9.3843%), Grüne 205,902 (17.3869%), Übrige 82,761 (6.9886%)
    census 2000, main language of 128,634: German 104,465 (81.2110%), French 4,671 (3.6312%), Italian 5,062 (3.9352%), Romansh 171 (0.1329%)
  389 Meienried: inhabitants 52; foreigners 2 (3.8462%)
    ages 0-17: 3 (5.7692%), 18-34: 12 (23.0769%), 35-49: 8 (15.3846%), 50-64: 20 (38.4615%), 65-: 9 (17.3077%)
    area 65 ha = 0.65 km2 (lake part 0 ha); inhabitants per km2 80.0000
    cattle 131, per inhabitant 2.519231
    party votes: none
    census 2000, main language of 59: German 55 (93.2203%), French 3 (5.0847%), Italian 0 (0.0000%), Romansh 0 (0.0000%)
  2056 Fétigny-Ménières: inhabitants 1,376; foreigners 192 (13.9535%)
    ages 0-17: 356 (25.8721%), 18-34: 283 (20.5669%), 35-49: 353 (25.6541%), 50-64: 194 (14.0988%), 65-: 190 (13.8081%)
    area 848 ha = 8.48 km2 (lake part 0 ha); inhabitants per km2 162.2642
    cattle 509, per inhabitant 0.369913
    party votes 2,744: FDP 409 (14.9052%), Die Mitte 692 (25.2187%), SP 447 (16.2901%), SVP 1,059 (38.5933%), GLP 27 (0.9840%), Grüne 107 (3.8994%), Übrige 3 (0.1093%)
    census 2000, main language of 883: German 26 (2.9445%), French 850 (96.2627%), Italian 2 (0.2265%), Romansh 0 (0.0000%)
  6831 Moutier: inhabitants 7,615; foreigners 2,066 (27.1307%)
    ages 0-17: 1,347 (17.6888%), 18-34: 1,632 (21.4314%), 35-49: 1,481 (19.4485%), 50-64: 1,539 (20.2101%), 65-: 1,616 (21.2213%)
    area 1,961 ha = 19.61 km2 (lake part 0 ha); inhabitants per km2 388.3223
    cattle 765, per inhabitant 0.100460
    party votes 38,276: FDP 3,122 (8.1565%), Die Mitte 4,994 (13.0473%), SP 11,320 (29.5747%), SVP 12,035 (31.4427%), GLP 557 (1.4552%), Grüne 2,019 (5.2748%), Übrige 4,229 (11.0487%)
    census 2000, main language of 7,701: German 303 (3.9346%), French 6,658 (86.4563%), Italian 275 (3.5710%), Romansh 2 (0.0260%)
  5249 Castel San Pietro: inhabitants 2,096; foreigners 257 (12.2615%)
    ages 0-17: 364 (17.3664%), 18-34: 341 (16.2691%), 35-49: 441 (21.0401%), 50-64: 474 (22.6145%), 65-: 476 (22.7099%)
    area 1,184 ha = 11.84 km2 (lake part 0 ha); inhabitants per km2 177.0270
    cattle 79, per inhabitant 0.037691
    party votes 7,841: FDP 1,295 (16.5158%), Die Mitte 2,094 (26.7058%), SP 1,060 (13.5187%), SVP 745 (9.5013%), GLP 36 (0.4591%), Grüne 347 (4.4255%), Übrige 2,264 (28.8739%)
    census 2000, main language of 3,724: German 249 (6.6864%), French 36 (0.9667%), Italian 3,359 (90.1987%), Romansh 2 (0.0537%)
  5269 Breggia: inhabitants 2,048; foreigners 231 (11.2793%)
    ages 0-17: 318 (15.5273%), 18-34: 328 (16.0156%), 35-49: 456 (22.2656%), 50-64: 486 (23.7305%), 65-: 460 (22.4609%)
    area 2,548 ha = 25.48 km2 (lake part 0 ha); inhabitants per km2 80.3768
    cattle 210, per inhabitant 0.102539
    party votes 7,315: FDP 1,829 (25.0034%), Die Mitte 1,752 (23.9508%), SP 1,235 (16.8831%), SVP 509 (6.9583%), GLP 43 (0.5878%), Grüne 301 (4.1148%), Übrige 1,646 (22.5017%)
    census 2000, main language of 3,724: German 249 (6.6864%), French 36 (0.9667%), Italian 3,359 (90.1987%), Romansh 2 (0.0537%)
```
