# More characteristics

Found while proposing `add-more-characteristics` (#13 of `docs/roadmap.md`), on 2026-11-22, from
the live sources. It answers the roadmap's question for #13: which further figures exist for
every municipality, from which source, for which years, on which list of municipalities, and what
they lack. The roadmap names four: income, education, religion and the urban or rural type. It
also gives the figures the specs cite. It decides nothing: the design of
`add-more-characteristics` records the decisions.

Words used here, as in `investigations/characteristics.md`:
- **STAT-TAB** is the BFS statistics API (`https://www.pxweb.bfs.admin.ch/api/v1/de/`).
- The **register** is the BFS register of municipalities.
- The **votes' list** is the register's list of 2026-01-01, which all data files use (2,110
  municipalities).
- A table's **list** is the register's list of the date whose municipalities it gives.

## How to reproduce

The scripts are in `investigations/more-characteristics/`. They use Python's standard library
only, and reuse `figures.py` of `investigations/characteristics/` (the reader of STAT-TAB's
answers, the register's lists and correspondences, and how counts come onto the votes' list). The
downloads are about 60 MB and stay outside the repository. Run them in this order, each with the
same directory:

```sh
python3 investigations/more-characteristics/stat_tab_catalogue.py /path/outside/the/repository
python3 investigations/more-characteristics/table_lists.py /path/outside/the/repository \
    px-x-0102010000_100 px-x-0102010000_101 px-x-0602010000_102 px-x-0702000000_104 \
    px-x-1702020000_101 px-x-4003000000_122 px-x-4003000000_161 px-x-0903020000_113 \
    px-x-0902020100_114
python3 investigations/more-characteristics/census_2000.py /path/outside/the/repository
python3 investigations/more-characteristics/candidate_tables.py /path/outside/the/repository
python3 investigations/more-characteristics/register_levels.py /path/outside/the/repository
python3 investigations/more-characteristics/data_size.py /path/outside/the/repository
python3 investigations/more-characteristics/reference_figures.py /path/outside/the/repository
python3 investigations/more-characteristics/official_terms.py /path/outside/the/repository
```

| File | What |
|------|------|
| `stat_tab_catalogue.py` | STAT-TAB's list of tables and the description of each, kept one file per table; the tables with a variable of at least 2,000 values, which are those per municipality. One request per table, 628 of them, about one a second. |
| `table_lists.py` | For the tables named, the date of the register's list with exactly the table's municipalities, among the dates on which the register changed since 2010 and the list of the census of 2000. |
| `census_2000.py` | Religion and highest completed education in the census of 2000: the tables' list, whole numbers, sums, the counts on the votes' list, how the shares spread, named municipalities. |
| `candidate_tables.py` | The same checks for jobs by sector, inhabitants born abroad, turnout at National Council elections, farms and farmland, and the dwellings and buildings of 2000. It takes the inhabitants and the areas from the site's own `app/static/data/characteristics.json`. |
| `register_levels.py` | The classifications the register gives each municipality of the votes' list, with each class's name in three languages. |
| `data_size.py` | What each group of counts would add to the site's data file, in bytes and with gzip. |
| `reference_figures.py` | The figures of named municipalities for 2015, 2024 and 2025, written as the site writes its values, and the municipalities without one. |
| `official_terms.py` | The BFS's words in German, French and Italian for what the figures count, from the tables' descriptions in each language. |

"Output" at the end of this file is what these scripts printed on 2026-11-22.

## Sources

| Source | Address | What it gives | Publisher |
|--------|---------|---------------|-----------|
| Population by place of birth (STATPOP) | STAT-TAB table `px-x-0102010000_100` | The permanent and non-permanent resident population at the end of each year from 2010 to 2025, by municipality, place of birth (in Switzerland, abroad), sex and marital status. | BFS, "Statistik der Bevölkerung und der Haushalte" |
| Jobs (STATENT) | STAT-TAB table `px-x-0602010000_102` | Per municipality and year from 2011 to 2024: workplaces, employed persons and full-time equivalents, in all and by sector (primary, secondary, tertiary). | BFS, "Statistik der Unternehmensstruktur" |
| Farms | STAT-TAB table `px-x-0702000000_104`, which the pipeline reads for the cattle | Per municipality and year: farms, farmland in hectares and livestock, in all and for organic farms. | BFS, "Landwirtschaftliche Strukturerhebung" |
| Census 2000, religion | STAT-TAB table `px-x-4003000000_122` | The population of 2000 per municipality by religion (18 of them, among them none and no answer) and residence (legal or economic). | BFS, "Eidgenössische Volkszählung (1850-2000)" |
| Census 2000, education | STAT-TAB table `px-x-4003000000_161` | The population of 2000 (economic residence) per municipality by highest completed education (13 levels, among them no answer, of school age and below it), nationality and sex. | BFS, the same |
| Census 2000, dwellings | STAT-TAB table `px-x-0903020000_113` | The occupied dwellings of 1990 and 2000 per municipality by number of rooms and by who lives in them (tenant, member of a cooperative, three kinds of owner, three others). | BFS, "Gebäude- und Wohnungserhebung (bis 2000)" |
| Census 2000, buildings | STAT-TAB table `px-x-0902020100_114` | The buildings with dwellings of 1990 and 2000 per municipality by kind (single-family houses and three others) and period of construction. | BFS, the same |
| National Council elections, turnout | STAT-TAB table `px-x-1702020000_101` | Per municipality and election since 1971: those entitled to vote, the voters, and the kinds of ballot. | BFS |
| Register's levels | `https://www.agvchapp.bfs.admin.ch/api/communes/levels?date=01-01-2026&labelLanguages=de,fr,it` | For each municipality of a date, its class in 22 classifications, with each class's name in the languages asked for. | BFS |
| Direct federal tax, natural persons, by municipality | The page `https://www.estv.admin.ch/de/statistiken-natuerliche-personen-gemeinden-1983-bis-heute`, which links one or several Excel files per tax year | Not read (answer 2). | Federal Tax Administration (ESTV) |

Looked at and not used:
- **The undated siblings of the two housing tables**, `px-x-0903020000_103` and
  `px-x-0902020100_107`. They give the figures of 2000 without naming the year. The dwellings are
  the same; the buildings differ by 7 of 1,462,167 over Switzerland, one of them in Zürich
  (answer 4).
- **Enterprises founded and closed** (`px-x-0602030000_205`, 2013 to 2023), **the demographic
  balance** (`px-x-0102020000_201`), **naturalisations** (`px-x-0103030100_102`), **new
  dwellings** (`px-x-0904030000_105`, 2013 to 2024) and **construction spending**
  (`px-x-0904010000_201`): per municipality, but flows of one year, not what a municipality is.
- **The censuses of 1970 to 1990** (`px-x-4001000000_*`, `px-x-4002000000_*`): older than 2000.
- **opendata.swiss**, the Confederation's catalogue of open data: its server answers HTTP 403 to
  every request from this environment, to `curl` under its own name too.

## Answers

### 1. What STAT-TAB gives per municipality

STAT-TAB lists 628 tables. 96 of them have a variable of at least 2,000 values, which is a
municipality in each. They lie in six themes:

| Theme | Tables | What |
|-------|--------|------|
| Population (`px-x-0102…`, `px-x-0103…`) | 28 | The population of 2010 to 2025 by age, nationality, place of birth and marital status; births, deaths and migration; naturalisations. |
| Jobs and enterprises (`px-x-0602…`) | 3 | Workplaces and employed persons by sector, 2011 to 2024 (and 1995 to 2008); enterprises founded and closed. |
| Farms (`px-x-0702…`) | 1 | The farm structure survey. |
| Buildings, dwellings, construction (`px-x-0902…` to `px-x-0904…`) | 31 | The buildings and dwellings of the censuses of 1970 to 2000; construction spending and new dwellings since 1994. |
| Politics (`px-x-1702…`, `px-x-1703…`) | 3 | The National Council elections (party votes; those entitled and the voters); the popular votes. |
| Censuses (`px-x-4001…` to `px-x-4004…`) | 30 | The censuses of 1970 to 2000: religion, language, education, occupation, sector, households, place of birth. |

STAT-TAB has no table per municipality on income or taxes, on land use, on vehicles, on social
assistance, or on religion and education after 2000. One table, `px-x-2105000000_411`, gave no
description (HTTP 400).

### 2. Income

**The source.** The Federal Tax Administration publishes the direct federal tax of natural
persons by municipality. Its page lists the tax years 1983 to 2023:
- one Excel file a year to 2019 (`statistik-dbst-np-gemeinde-<year>-auswertung-de.xls`, `.xlsx`
  from 2014; 7.5 to 7.7 MB each for 2016 to 2019);
- six files a year from 2020, by whether the taxpayers owe the tax and by normal and special
  cases (1.1 to 1.7 MB each), under two further file names;
- each file at an address with an id of its own
  (`https://www.estv.admin.ch/dam/de/sd-web/<id>/<name>`), which only the page gives.

A tax year appears about three years later. The page dates the files of 2019 to 30 November
2023, of 2020 to 9 July 2024, of 2021 to 10 October 2024, of 2022 to 20 November 2025, and of 2023
to 5 November 2026.

**Its server refuses the pipeline's client.** It answers a browser and `curl` under its own name
(HTTP 200). To a client that names itself `Python-urllib`, which is what Python's standard
library and so the pipeline's downloads send, it closes the connection without a reply (`curl`
exit 52, over HTTP/1.1 and HTTP/2 alike). While finding this out I sent the page three requests
under made-up client names, which it answered. This session's safety check then refused a
download under such a name as unauthorized access. I sent nothing further and have not read the
files.

**No terms on automated use.** The two pages fetched with `curl` link an imprint and the
Confederation's general legal page; they say nothing on downloads by a script.

So the contents of the files, their list of municipalities, and whether their counts add up are
not known here.

### 3. Religion and education: the census of 2000

Both tables give the census of 2000 on the register's list of 2000-12-05, 2,896 municipalities,
the list of the main-language table the pipeline already reads (`px-x-4003000000_123`). In each:
- no cell lacks a value, and every count is a whole number;
- in every municipality the parts add up to the total;
- the municipalities add up to the table's Switzerland, 7,288,010 inhabitants.

The register's correspondences bring them onto the votes' list as they bring the languages:
every one of the 2,110 municipalities has its figures, and Castel San Pietro and Breggia, which
exchanged land in 2004, share one sum (`investigations/characteristics.md`, 2).

**Religion** (economic residence, as the languages). Over Switzerland: Evangelical Reformed
33.04%, Roman Catholic 41.82%, no affiliation 11.11%, no answer 4.33%, and 14 further religions
together 9.70%, the largest of them the Islamic communities with 4.26%.

| Share of the inhabitants | Least | 1st decile | Median | 9th decile | Most |
|------|------|------|------|------|------|
| Evangelical Reformed | 0.00% | 5.48% | 40.09% | 74.45% | 94.25% |
| Roman Catholic | 0.55% | 10.10% | 33.37% | 83.28% | 100.00% |
| No affiliation | 0.00% | 2.88% | 8.00% | 16.00% | 37.24% |
| No answer | 0.00% | 1.15% | 2.94% | 5.17% | 21.56% |

**Education.** The table sorts the inhabitants into 13 levels. Grouped:

| Group | Levels of the table | Switzerland |
|-------|---------------------|-------------|
| None or compulsory school | "Keine Ausbildung abgeschlossen", "Obligatorische Schule" | 1,638,451 |
| Upper secondary | "Diplommittelschule oder berufsvorbereitende Schule", "Berufslehre, Vollzeit-Berufsschule", "Maturitätsschule", "Lehrerseminar" | 2,866,860 |
| Tertiary | "Höhere Fach- und Berufsausbildung", "Höhere Fachschule", "Fachhochschule", "Universität, Hochschule" | 1,010,049 |
| No answer | "Ohne Angabe" | 527,990 |
| Of school age or below it | "Schulpflichtig", "Noch nicht schulpflichtig" | 1,244,660 |

Of those who named a level (the first three groups), 18.31% have a tertiary degree and 29.71%
none or compulsory school.

| Share of those who named a level | Least | 1st decile | Median | 9th decile | Most |
|------|------|------|------|------|------|
| Tertiary | 0.00% | 8.85% | 14.51% | 24.92% | 49.69% |
| None or compulsory school | 8.70% | 20.57% | 30.70% | 41.74% | 67.57% |

**Those without an answer** are 6.81% of those past school age in the median municipality, and
more than 20% in six. One stands apart: in Hérémence (6084, Valais) 1,077 of 1,093 gave no
answer, 98.54%. Its 16 answers are 4 with none or compulsory school, 6 upper secondary and 6
tertiary, so its shares would read 25.00% and 37.50%. The next are Presinge with 27.46% and
Vendlincourt with 25.20%.

### 4. Housing: the dwellings and buildings of 2000

Two tables of the buildings and dwellings survey that went with the census of 2000, on the same
list of 2000-12-05, complete and whole, the municipalities adding up to Switzerland.

**Two tables each.** One gives 1990 and 2000 and is asked for a year (`…_113`, `…_114`); its
sibling gives one set of figures and names no year (`…_103`, `…_107`). For Zürich:
- the dwellings agree: 181,801 occupied, 12,920 of them lived in by an owner, in both;
- the buildings differ by one: 36,121 in the table asked for 2000, 36,122 in the other ("Gebäude
  mit teilweiser Wohnnutzung", built before 1919: 1,037 and 1,038); over Switzerland 1,462,160
  and 1,462,167. The single-family houses agree, 8,530.

The figures below are those of the tables asked for 2000.

| Share | Of | Least | 1st decile | Median | 9th decile | Most |
|------|------|------|------|------|------|------|
| Lived in by an owner (of the flat, of the house alone, of the house with others) | the occupied dwellings | 3.61% | 34.55% | 56.32% | 71.18% | 95.52% |
| Single-family houses | the buildings with dwellings | 0.00% | 41.33% | 60.25% | 74.89% | 97.12% |

### 5. Inhabitants born abroad

The table of the population by place of birth is on the list of 2025-04-06, the list of the
population table the pipeline reads, for the same years, 2010 to 2025. No cell lacks a value, and
the municipalities add up to Switzerland. On the votes' list its inhabitants are those the
site's data file holds, in each of the 29,540 municipality-years from 2012 to 2025 (Zürich at the
end of 2015: 396,955 in both).

| Share of the inhabitants born abroad | Least | 1st decile | Median | 9th decile | Most |
|------|------|------|------|------|------|
| 2012 | 0.00% | 7.43% | 16.84% | 32.74% | 64.92% |
| 2025 | 0.00% | 10.47% | 21.99% | 38.26% | 70.31% |

It is not the share of foreigners: in Zürich at the end of 2015, 41.07% were born abroad and
32.03% were foreigners.

### 6. Jobs

The table gives the employed persons ("Beschäftigte", in French "emplois") at the workplaces of
each municipality at the end of each year from 2011 to 2024, on the list of 2024-01-01 (2,131
municipalities). They are jobs in the municipality, not inhabitants who work.

**Some counts are withheld.** Of 119,336 cells, 2,664 carry the sign "X" in place of a value:
- 15 of them the number of all jobs, the other 2,649 a sector's (931 primary, 1,197 secondary,
  521 tertiary);
- in 1,284 of 29,834 municipality-years, two or three sectors at once in all but 13 of them, so
  that none can be worked out from the total;
- about 100 municipalities a year, 102 in 2024, small ones: the median has 68 jobs.

So the municipalities do not add up to the table's Switzerland (46 of 56 sums differ). Where a
municipality has all four counts of a year, in 28,550 municipality-years, its three sectors add
up to its number of all jobs in every one.

On the votes' list, where a municipality made of several has a figure only when each part has
one:

| | 2012 | 2015 | 2024 |
|------|------|------|------|
| Municipalities without the number of all jobs | 0 | 0 | 3 (Linescio, Villars-Epeney, Trient) |
| Without a share of the primary sector | 62 | 58 | 85 |
| Without a share of the secondary sector | 87 | 85 | 94 |
| Without a share of the tertiary sector | 44 | 37 | 37 |

13 municipalities of the votes' list are made of several of the table's list. One of them is Rue
(2097), of Chapelle (Glâne), Auboranges, Ecublens (FR) and Rue: in 2015 Chapelle (Glâne) has 36
jobs, 20 of them in the tertiary sector, and its two other counts are withheld. So Rue has 434
jobs and 217 in the tertiary sector, and no count of the primary or the secondary.

| Value | Year | Least | 1st decile | Median | 9th decile | Most |
|------|------|------|------|------|------|------|
| Jobs per 100 inhabitants | 2012 | 3.8 | 18.4 | 35.9 | 69.6 | 398.8 |
| | 2024 | 6.6 | 17.4 | 35.2 | 72.8 | 410.1 |
| Jobs in the primary sector | 2024 | 0.00% | 0.89% | 9.14% | 35.44% | 84.38% |
| Jobs in the secondary sector | 2024 | 0.00% | 8.19% | 23.33% | 46.28% | 95.18% |
| Jobs in the tertiary sector | 2024 | 4.21% | 36.20% | 61.75% | 84.64% | 100.00% |

No municipality has no job at all in 2015 or 2024.

**The newest year is 2024.** The population goes to 2025. A vote of 2026 has the population at
the end of 2025 and the jobs of 2024.

### 7. Farms and farmland

The pipeline reads this table for the cattle, on the list of 2025-04-06, with the farm survey's
years from 2012 to 2025. It also gives the farms and their farmland in whole hectares, each in
all and for organic farms. No cell lacks a value.

| Value | Year | Least | 1st decile | Median | 9th decile | Most |
|------|------|------|------|------|------|------|
| Farms per 1,000 inhabitants | 2012 | 0.0 | 1.5 | 12.8 | 43.5 | 235.3 |
| | 2025 | 0.0 | 1.0 | 9.1 | 33.2 | 243.2 |
| Organic farmland, of the farmland | 2012 | 0.00% | 0.00% | 3.97% | 30.37% | 100.00% |
| | 2025 | 0.00% | 0.00% | 11.85% | 47.33% | 100.00% |

- **Without farmland** there is no organic share: 32 municipalities in 2015, 31 in 2024, 34 in
  2025, among them Oberrieden. 31, 25 and 29 have no farm.
- **Organic farmland never exceeds the farmland** of a municipality.
- **Farmland as a share of the area misleads.** A farm's land counts in the municipality of the
  farm, wherever the land lies: the farmland exceeds swisstopo's area in 27 municipalities in
  2012 and in 39 in 2025, up to 243% of it.
- **The farms add up, the farmland does not.** The municipalities' farms, all and organic, add
  up to the table's Switzerland in every year. Their farmland does not in 27 of 28 sums: each
  municipality's is a whole number of hectares.

### 8. Turnout at National Council elections

Those entitled to vote and the voters, on the list of 2023-01-01, as the party votes the pipeline
reads. 50 cells carry "..." in place of a value: the municipalities that count their ballots
with another, which have no party strengths either (`investigations/characteristics.md`, 4). On
the votes' list 7 municipalities have no figure in 2011 and 2015, 6 in 2019 and 5 in 2023. The
median municipality's turnout is 49.89%, 49.94%, 46.51% and 48.76%.

### 9. The urban or rural type

The register's levels sort every municipality of the votes' list into classes. Each of the 2,110
has a class in each classification, and the register names the classes in German, French and
Italian.

| Classification | Column | Classes |
|------|------|------|
| Urban or rural type 2020 | `STALAN2020` | 509 urban, 580 intermediate, 1,021 rural |
| Type of municipality 2020, 9 classes | `GDETYP2020_9` | from 174 urban municipalities of a large agglomeration to 209 peripheral rural ones |
| Degree of urbanisation 2021 | `DEGURB2021` | 135 densely, 959 intermediately and 1,016 thinly populated |
| Language region 2020 | `SPRGEB2020` | 1,374 German, 606 French, 115 Italian, 15 Romansh |
| Mountain areas 2019 | `MONT2019` | 778 in them, 1,332 not |

They are categories, not numbers: a limit with a lower and an upper bound does not fit them.

### 10. The size of the data

The site's `characteristics.json` is 1,355,172 bytes, 568,360 with gzip. The counts of each
group, on the votes' list, as compact JSON:

| Counts | Bytes | With gzip |
|------|------|------|
| Religion of 2000 (all, Evangelical Reformed, Roman Catholic, no affiliation) | 38,923 | 17,110 |
| Education of 2000 (three levels) | 29,532 | 12,571 |
| Dwellings of 2000 (occupied, by their owner) | 21,518 | 8,751 |
| Buildings of 2000 (with dwellings, single-family houses) | 21,020 | 8,421 |
| Born abroad, 14 years | 177,498 | 54,309 |
| Jobs, 14 years, all sectors | 186,053 | 58,692 |
| Jobs, 14 years, each of the three sectors | 498,083 | 141,789 |
| Turnout, 4 elections (entitled, voters) | 91,086 | 36,533 |
| Farms, 14 years (farms, farmland, organic farmland) | 340,106 | 110,998 |
| The urban or rural type alone | 8,441 | 711 |
| Four classifications | 23,211 | 1,805 |

All but the turnout and the classifications are 1,312,733 bytes, 412,641 with gzip: the file
would be about 2.67 MB, about 981 KB with gzip.

### 11. The BFS's words

STAT-TAB describes the two newer tables in German, French and Italian, and the farm survey and
the tables of 2000 in German and French only (HTTP 400 for Italian).

| German | French | Italian | Table |
|---|---|---|---|
| Geburtsort: Im Ausland | Lieu de naissance: A l'étranger | Luogo di nascita: All'estero | `px-x-0102010000_100` |
| Beschäftigte | Emplois | Impieghi | `px-x-0602010000_102` |
| Primärsektor, Sekundärer Sektor, Tertiärer Sektor | Secteur primaire, Secteur secondaire, Secteur tertiaire | Settore primario, Settore secondario, Settore terziario | the same |
| Betriebe; Landwirtschaftliche Nutzfläche (LN); Biologische Betriebe | Exploitations; Surface agricole utile (SAU); Exploitations biologiques | none | `px-x-0702000000_104` |
| Evangelisch-reformierte Kirche; Römisch-katholische Kirche; Keine Zugehörigkeit | Eglise évangélique réformée; Eglise catholique romaine; Aucune appartenance | none | `px-x-4003000000_122` |
| Höchste abgeschlossene Ausbildung; Obligatorische Schule; Keine Ausbildung abgeschlossen | Plus haute formation achevée; Scolarité obligatoire; Aucune formation achevée | none | `px-x-4003000000_161` |
| Bewohnte Wohnungen; Stockwerkeigentümer/in, Alleineigentümer/in des Hauses, Miteigentümer/in des Hauses | Logements occupés; Propriétaire par étage, Propriétaire unique de la maison, Copropriétaire de la maison | none | `px-x-0903020000_113` |
| Einfamilienhäuser | Maisons individuelles | none | `px-x-0902020100_114` |

The BFS's Italian pages on religion, the level of education, tenants and owners, and the kinds of
building say only "Continua in tedesco o francese". So the Italian words for the census and the
farm survey have no source here.

### 12. The figures of named municipalities

For the vote of 2016-02-28 the yearly figures are those of 2015. Shares with two decimals,
numbers per inhabitants with one, rounded half away from zero from the counts.

| | Zürich (261) | Genève (6621) | Bister (6172) | Hérémence (6084) | Lugano (5192) |
|------|------|------|------|------|------|
| Inhabitants, end of 2015 | 396,955 | 198,072 | 31 | 1,362 | 63,583 |
| Born abroad | 163,047: 41.07% | 113,936: 57.52% | 1: 3.23% | 128: 9.40% | 30,225: 47.54% |
| Jobs, end of 2015 | 468,852: 118.1 per 100 inhabitants | 178,354: 90.0 | 9: 29.0 | 415: 30.5 | 55,274: 86.9 |
| Primary sector | 231: 0.05% | 26: 0.01% | 9: 100.00% | 41: 9.88% | 108: 0.20% |
| Secondary sector | 30,062: 6.41% | 9,989: 5.60% | 0: 0.00% | 154: 37.11% | 5,628: 10.18% |
| Tertiary sector | 438,559: 93.54% | 168,339: 94.38% | 0: 0.00% | 220: 53.01% | 49,538: 89.62% |
| Farms, 2015 | 41: 0.1 per 1,000 inhabitants | 4: 0.0 | 3: 96.8 | 22: 16.2 | 39: 0.6 |
| Farmland, organic | 855 ha, 381 ha: 44.56% | 8 ha, 1 ha: 12.50% | 55 ha, 10 ha: 18.18% | 336 ha, 61 ha: 18.15% | 374 ha, 107 ha: 28.61% |
| Inhabitants in 2000 | 363,273 | 177,964 | 33 | 1,294 | 55,751 |
| Evangelical Reformed | 110,008: 30.28% | 24,105: 13.54% | 3: 9.09% | 40: 3.09% | 3,160: 5.67% |
| Roman Catholic | 120,853: 33.27% | 66,491: 37.36% | 28: 84.85% | 1,239: 95.75% | 39,546: 70.93% |
| No affiliation | 61,153: 16.83% | 41,289: 23.20% | 1: 3.03% | 4: 0.31% | 4,407: 7.90% |
| Named a level of education | 290,377 | 123,611 | 30 | 16 | 43,877 |
| Tertiary | 72,373: 24.92% | 40,733: 32.95% | 3: 10.00% | 6: 37.50% | 8,353: 19.04% |
| None or compulsory school | 76,077: 26.20% | 34,170: 27.64% | 13: 43.33% | 4: 25.00% | 15,132: 34.49% |
| Occupied dwellings, by an owner | 181,801, 12,920: 7.11% | 85,330, 4,992: 5.85% | 14, 11: 78.57% | 450, 391: 86.89% | 25,935, 6,034: 23.27% |
| Buildings with dwellings, single-family houses | 36,121, 8,530: 23.62% | 6,990, 743: 10.63% | 32, 22: 68.75% | 352, 149: 42.33% | 9,006, 4,925: 54.69% |

In 2015, from the least to the most over the 2,110 municipalities: born abroad 0.00% to 66.13%,
jobs per 100 inhabitants 5.2 to 445.5, farms per 1,000 inhabitants 0.0 to 210.5.

Municipalities without a figure in 2015:
- **Oberrieden (137)**, 5,037 inhabitants: 1,037 jobs, 927 of them in the tertiary sector, and no
  count of the primary and the secondary; no farm and no farmland;
- **Meienried (389)**, 52 inhabitants: 23 jobs, 14 of them in the primary sector, and no count of
  the secondary and the tertiary;
- **Rue (2097)**, above.

In 2024 **Linescio (5315)** has no count of all jobs, so none of its four job figures.

The newest figures, for Zürich: 44.98% born abroad at the end of 2025; 545,295 jobs at the end of
2024, 124.9 per 100 of its 436,551 inhabitants then; 37 farms in 2025 and 591 of 812 hectares
organic, 72.78%.

## Not verified

- **The tax statistics.** The files were not read: their contents, their list of municipalities
  and their sums are unknown (answer 2). Whether the Federal Tax Administration means to keep
  scripts out, or its server only filters a client name, is not known either.
- **Whether the two population tables appear together.** Both give 2010 to 2025 today. The
  `updated` date of a STAT-TAB answer is the day the table was created (2011), not the day of its
  newest figures, so it does not say.
- **The Italian words** for the census and the farm survey (answer 11).
- **When the jobs of a year appear.** The table gives 2024 as its newest year on 2026-11-22; its
  date of publication was not looked for.
- **The frame after a link with 35 limits.** With 21 limits it took 55 to 94 ms, about 1.3 ms of
  it for each track made (`investigations/share-link.md`). In proportion 35 limits would take 92
  to 157 ms; that is an estimate, as the 14 new limits do not exist yet.
- **Loading the larger file on a phone.** The file would double (answer 10); how long a phone
  takes to read it was not measured.
- **STAT-TAB's limit.** After the catalogue's 628 requests and some 20 queries within half an
  hour, it answered HTTP 429, and still did after a wait of 20 seconds; some minutes later it
  answered again. The limit it states, 50 queries in 15 seconds, was not exceeded; what else it
  counts is not known.

## Output

```
$ python3 investigations/more-characteristics/stat_tab_catalogue.py /path/outside/the/repository
628 tables, 1 without a description: [('px-x-2105000000_411', 'HTTP Error 400: Bad Request')]
px-x-0102010000_100 | 2286 places | 2010 to 2025 (16) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Geburtsort, Geschlecht und Zivilstand
px-x-0102010000_101 | 2286 places | 2010 to 2025 (16) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Staatsangehörigkeit (Kategorie), Geschlecht und Alter
px-x-0102010000_103 | 2286 places | 2010 to 2025 (16) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Geschlecht, Zivilstand und Altersklasse
px-x-0102010000_104 | 2286 places | 2010 to 2025 (16) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Geburtsort und Staatsangehörigkeit
px-x-0102020000_201 | 2289 places | 1981 to 2025 (45) | Demografische Bilanz nach institutionellen Gliederungen
px-x-0103010000_201 | 2286 places | 2020 to 2025 (6) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Staatsangehörigkeit (Kategorie), Geburtsort, Geschlecht und Altersklasse
px-x-0103010000_202 | 2285 places | 2010 to 2019 (10) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Staatsangehörigkeit (Kategorie), Geburtsort, Geschlecht und Altersklasse
px-x-0103010200_121 | 2286 places | 2011 to 2025 (15) | Wanderung der ständigen Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Auswahl), Geschlecht und Migrationstyp
px-x-0103030000_102 | 2286 places | 2020 to 2025 (6) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Geschlecht und Alter
px-x-0103030000_103 | 2285 places | 2010 to 2019 (10) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Geschlecht und Alter
px-x-0103030000_211 | 2315 places | 2011 to 2011 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_212 | 2315 places | 2012 to 2012 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_213 | 2315 places | 2013 to 2013 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_214 | 2315 places | 2014 to 2014 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_215 | 2315 places | 2015 to 2015 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_216 | 2315 places | 2016 to 2016 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_217 | 2315 places | 2017 to 2017 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_218 | 2315 places | 2018 to 2018 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_219 | 2315 places | 2019 to 2019 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_220 | 2285 places | 2020 to 2020 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_221 | 2285 places | 2021 to 2021 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_222 | 2286 places | 2022 to 2022 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_223 | 2286 places | 2023 to 2023 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_224 | 2286 places | 2024 to 2024 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_225 | 2286 places | 2025 to 2025 (1) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Bevölkerungstyp, Altersklasse und Geschlecht
px-x-0103030000_298 | 2285 places | 2010 to 2019 (10) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030000_299 | 2286 places | 2020 to 2025 (6) | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Wohnort vor 1 Jahr, Staatsangehörigkeit (Auswahl), Geschlecht und Altersklasse
px-x-0103030100_102 | 2286 places | 2011 to 2025 (15) | Erwerb des Schweizer Bürgerrechts nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit ehemalig (Auswahl) und Geschlecht
px-x-0602010000_102 | 2132 places | 2011 to 2024 (14) | Arbeitsstätten und Beschäftigte nach Jahr, Gemeinde, Wirtschaftssektor und Beobachtungseinheit
px-x-0602030000_205 | 2136 places | 2013 to 2023 (11) | Gründungen, Schliessungen und Bestand aktiver Unternehmen nach Gemeinde und Wirtschaftssektor
px-x-0602050000_103 | 2707 places | 1995 to 2008 (4) | Arbeitsstätten und Beschäftigte nach Jahr, Gemeinde, Wirtschaftssektor, Grössenklasse und Variable
px-x-0702000000_104 | 2285 places | 1975 to 2025 (28) | Beschäftigte, Landwirtschaftliche Betriebe, Landwirtschaftliche Nutzfläche (LN) und Nutztiere auf Klassifizierungsebene 1 nach Beobachtungseinheit, Kanton (-) / Bezirk (>>) / Gemeinde (......), Betriebssystem und Jahr
px-x-0902020100_107 | 2897 places | no year | Gebäude nach Gemeinde, Gebäudekategorie und Bauperiode
px-x-0902020100_108 | 2897 places | no year | Gebäude nach Gemeinde, Gebäudekategorie und Hauseigentümertyp
px-x-0902020100_114 | 2897 places | 1990 to 2000 (2) | Gebäude nach Gemeinde, Gebäudekategorie, Bauperiode und Jahr
px-x-0902020100_115 | 2897 places | 1990 to 2000 (2) | Gebäude nach Gemeinde, Gebäudekategorie, Hauseigentümertyp und Jahr
px-x-0902020100_124 | 2897 places | 1970 to 2000 (4) | Gebäude nach Gemeinde, Gebäudekategorie, Bauperiode und Jahr
px-x-0902020100_125 | 2897 places | 1970 to 2000 (4) | Gebäude nach Gemeinde, Gebäudekategorie, Hauseigentümertyp und Jahr
px-x-0902020100_135 | 2897 places | no year | Wohnungen nach Gemeinde, Anzahl Zimmer und Wohnungsfläche
px-x-0902020100_136 | 2897 places | no year | Wohnungen nach Gemeinde, Belegungsart und Anzahl Zimmer
px-x-0902020100_137 | 2897 places | no year | Wohnungen nach Gemeinde, Anzahl Zimmer und Mietpreisklasse
px-x-0902020100_142 | 2897 places | 1990 to 2000 (2) | Wohnungen 1990 und 2000 nach Gemeinde, Anzahl Zimmer, Wohnungsfläche und Jahr
px-x-0902020100_143 | 2897 places | 1990 to 2000 (2) | Wohnungen nach Gemeinde, Anzahl Zimmer, Belegungsart und Jahr
px-x-0902020100_144 | 2897 places | 1990 to 2000 (2) | Wohnungen 1990 und 2000 nach Gemeinde, Anzahl Zimmer, Mietpreisklasse und Jahr
px-x-0902020100_152 | 2897 places | 1970 to 2000 (4) | Bewohnte Wohnungen nach Gemeinde, Anzahl Zimmer, Wohnungsfläche und Jahr
px-x-0902020100_154 | 2897 places | 1970 to 2000 (4) | Bewohnte Wohnungen nach Gemeinde, Anzahl Zimmer, Mietpreisklasse und Jahr
px-x-0903020000_103 | 2897 places | no year | Bewohnte Wohnungen nach Gemeinde, Anzahl Zimmer und Bewohnertyp
px-x-0903020000_113 | 2897 places | 1990 to 2000 (2) | Bewohnte Wohnungen nach Gemeinde, Anzahl Zimmer, Bewohnertyp und Jahr
px-x-0903020000_123 | 2897 places | 1970 to 2000 (4) | Bewohnte Wohnungen nach Gemeinde, Anzahl Zimmer, Bewohnertyp und Jahr
px-x-0904010000_111 | 3112 places | 1995 to 2012 (18) | Bauvorhaben nach Kanton (-) / Gemeinde (......), Art der Auftraggeber, Art der Bauwerke, Art der Arbeiten und Jahr
px-x-0904010000_112 | 3112 places | 1995 to 2012 (18) | Bauvorhaben nach Kanton (-) / Gemeinde (......), Kategorie der Auftraggeber, Art der Bauwerke und Jahr
px-x-0904010000_113 | 3112 places | 1995 to 2012 (18) | Bauvorhaben nach Kanton (-) / Gemeinde (......), Art der Auftraggeber, Kategorie der Bauwerke und Jahr
px-x-0904010000_201 | 2192 places | 1994 to 2024 (31) | Bauausgaben und Arbeitsvorrat nach Grossregion (<<) / Kanton (-) / Gemeinde (......), Art der Auftraggeber, Art der Bauwerke, Art der Arbeiten, Beobachtungseinheit und Jahr
px-x-0904010000_203 | 2192 places | 1994 to 2024 (31) | Bauinvestitionen und Arbeitsvorrat nach Grossregion (<<) / Kanton (-) / Gemeinde (......), Art der Auftraggeber, Kategorie der Bauwerke, Beobachtungseinheit und Jahr
px-x-0904010000_204 | 2192 places | 1994 to 2024 (31) | Bauinvestitionen und Arbeitsvorrat (Investitionen) nach Grossregion (<<) / Kanton (-) / Gemeinde (......), Art und Kategorie der Auftraggeber, Art der Bauwerke, Beobachtungseinheit und Jahr
px-x-0904010000_205 | 2192 places | 1994 to 2024 (31) | Bauinvestitionen und Arbeitsvorrat (Investitionen) nach Grossregion (<<) / Kanton (-) / Gemeinde (......), Art der Arbeiten, Kategorie der Bauwerke, Beobachtungseinheit und Jahr
px-x-0904030000_101 | 3085 places | 1995 to 2012 (18) | Neu erstellte Wohnungen nach Kanton (-) / Gemeinde (......), Anzahl Zimmer und Jahr
px-x-0904030000_102 | 3085 places | 1995 to 2012 (18) | Neu erstellte Gebäude mit Wohnungen nach Kanton (-) / Gemeinde (......), Gebäudetyp und Jahr
px-x-0904030000_103 | 3085 places | 1995 to 2012 (18) | Neu erstellte Wohnungen nach Kanton (-) / Gemeinde (......), Gebäudetyp und Jahr
px-x-0904030000_104 | 3085 places | 1995 to 2012 (18) | Neu erstellte Gebäude mit Wohnungen, neu erstellte Wohnungen nach Kanton (-) / Gemeinde (......), Kategorie der Auftraggeber, Typ der Bauwerke und Jahr
px-x-0904030000_105 | 2165 places | 2013 to 2024 (12) | Neu erstellte Wohnungen nach Grossregion (<<) / Kanton (-) / Gemeinde (......), Anzahl Zimmer und Jahr
px-x-0904030000_106 | 2165 places | 2013 to 2024 (12) | Neu erstellte Gebäude mit Wohnungen nach Grossregion (<<) / Kanton (-) / Gemeinde (......), Gebäudetyp und Jahr
px-x-0904030000_107 | 2165 places | 2013 to 2024 (12) | Neu erstellte Wohnungen nach Grossregion (<<) / Kanton (-) / Gemeinde (......), Gebäudetyp und Jahr
px-x-1702020000_101 | 2360 places | 1971 to 2023 (14) | Nationalratswahlen (Wahlberechtigte, Wählende und Typen von Wahlzetteln seit 1971)
px-x-1702020000_105 | 2333 places | 1971 to 2023 (14) | Nationalratswahlen (Parteistimmen und Parteistärke seit 1971: Bezirke und Gemeinden)
px-x-1703030000_101 | 2363 places | no year | Volksabstimmungen (Ergebnisse Ebene Gemeinde seit 1960)
px-x-4001000000_101 | 3107 places | 1970 to 2000 (4) | Privathaushalte nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......) und Haushaltsgrösse
px-x-4001000000_102 | 3107 places | 1970 to 2000 (4) | Haushalte nach Haushaltstyp und institutionellen Gliederungen, 1970-2000
px-x-4001000000_103 | 3107 places | 1970 to 2000 (4) | Familienhaushalte mit Kindern nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Haushaltstyp und Anzahl ledige Kinder unter 18 Jahren
px-x-4001000000_121 | 3107 places | 1970 to 2000 (4) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Geschlecht, Staatsangehörigkeit (Kategorie), Kanton (-) / Bezirk (>>) / Gemeinde (......), Jahr und Zivilstand
px-x-4001000000_122 | 3107 places | 1970 to 2000 (4) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......) und Religion
px-x-4001000000_123 | 3107 places | 1970 to 2000 (4) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Hauptsprache und Staatsangehörigkeit (Kategorie)
px-x-4001000000_141 | 3107 places | 1970 to 2000 (4) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Wirtschaftssektor
px-x-4001000000_142 | 3107 places | 1970 to 2000 (4) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Arbeitsmarktstatus
px-x-4001000000_161 | 3107 places | 1970 to 2000 (4) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Berufliche Tätigkeit
px-x-4001000000_181 | 3107 places | 1970 to 2000 (4) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Geburtsort
px-x-4001000000_182 | 3107 places | 1970 to 2000 (4) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Wohnort vor 5 Jahren
px-x-4001000000_183 | 3107 places | 1970 to 2000 (4) | Wanderungsbilanz der Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......) und Wanderungsbilanz
px-x-4002000000_121 | 3107 places | 1990 to 2000 (2) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie) und Hauptsprache
px-x-4002000000_122 | 3107 places | 1990 to 2000 (2) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......) und Religion
px-x-4002000000_141 | 3107 places | 1990 to 2000 (2) | Erwerbstätige am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Wirtschaftszweig
px-x-4002000000_142 | 3107 places | 1990 to 2000 (2) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Arbeitsmarktstatus
px-x-4002000000_143 | 3107 places | 1990 to 2000 (2) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Sozio-professionelle Kategorie
px-x-4002000000_161 | 3107 places | 1990 to 2000 (2) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Höchste abgeschlossene Ausbildung
px-x-4002000000_162 | 3107 places | 1990 to 2000 (2) | Wohnbevölkerung am wirtschaftlichen Wohnsitz nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Berufliche Tätigkeit
px-x-4003000000_101 | 3107 places | no year | Wohnbevölkerung am wirtschaftlichem Wohnsitz 2000 nach Geschlecht, Kanton (-) / Bezirk (>>) / Gemeinde (......) und Alter
px-x-4003000000_121 | 3107 places | no year | Wohnbevölkerung 2000 nach Wohnsitztyp, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Zivilstand
px-x-4003000000_122 | 3107 places | no year | Wohnbevölkerung 2000 nach Wohnsitztyp, Kanton (-) / Bezirk (>>) / Gemeinde (......) und Religion
px-x-4003000000_123 | 3107 places | no year | Wohnbevölkerung 2000 nach Wohnsitztyp, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie) und Hauptsprache
px-x-4003000000_141 | 3107 places | no year | Wohnbevölkerung am wirtschaftlichen Wohnsitz 2000 nach Staatsangehörigkeit (Kategorie), Kanton (-) / Bezirk (>>) / Gemeinde (......), Geschlecht und Sozio-professionelle Kategorie
px-x-4003000000_142 | 3107 places | no year | Wohnbevölkerung am wirtschaftlichen Wohnsitz 2000 nach Staatsangehörigkeit (Kategorie), Kanton (-) / Bezirk (>>) / Gemeinde (......), Geschlecht und Wirtschaftszweig der Unternehmung
px-x-4003000000_161 | 3107 places | no year | Wohnbevölkerung am wirtschaftlichen Wohnsitz 2000 nach Höchste abgeschlossene Ausbildung, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie) und Geschlecht
px-x-4003000000_162 | 3107 places | no year | Wohnbevölkerung am wirtschaftlichen Wohnsitz 2000 nach Berufliche Tätigkeit, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie) und Geschlecht
px-x-4003000000_181 | 3107 places | no year | Wohnbevölkerung 2000 nach Wohnsitztyp, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht und Geburtsort
px-x-4003000000_182 | 3107 places | no year | Wohnbevölkerung 2000 nach Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie), Geschlecht, Wohnort vor 5 Jahren und Wohnsitztyp
px-x-4004000000_101 | 3107 places | 1850 to 2000 (16) | Bevölkerungsentwicklung nach institutionellen Gliederungen, 1850-2000
```

```
$ python3 investigations/more-characteristics/table_lists.py /path/outside/the/repository px-x-0102010000_100 px-x-0102010000_101 px-x-0602010000_102 px-x-0702000000_104 px-x-1702020000_101 px-x-4003000000_122 px-x-4003000000_161 px-x-0903020000_113 px-x-0902020100_114
35 dates of change from 01-01-2010 to 01-01-2026
px-x-0102010000_100 | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / | 2115 municipalities (the number in the label) | list of 06-04-2025
px-x-0102010000_101 | Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / | 2115 municipalities (the number in the label) | list of 06-04-2025
px-x-0602010000_102 | Arbeitsstätten und Beschäftigte nach Jahr, Gemeinde, Wirtschaftssektor und Beoba | 2131 municipalities (plain names, 1 other codes) | list of 01-01-2024
px-x-0702000000_104 | Beschäftigte, Landwirtschaftliche Betriebe, Landwirtschaftliche Nutzfläche (LN)  | 2115 municipalities (the number in the label) | list of 06-04-2025
px-x-1702020000_101 | Nationalratswahlen (Wahlberechtigte, Wählende und Typen von Wahlzetteln seit 197 | 2136 municipalities (the number as the code, 27 codes from 9000 on left out) | list of 01-01-2023
px-x-4003000000_122 | Wohnbevölkerung 2000 nach Wohnsitztyp, Kanton (-) / Bezirk (>>) / Gemeinde (.... | 2896 municipalities (the number in the label) | list of 05-12-2000
px-x-4003000000_161 | Wohnbevölkerung am wirtschaftlichen Wohnsitz 2000 nach Höchste abgeschlossene Au | 2896 municipalities (the number in the label) | list of 05-12-2000
px-x-0903020000_113 | Bewohnte Wohnungen nach Gemeinde, Anzahl Zimmer, Bewohnertyp und Jahr | 2896 municipalities (plain names, 1 other codes) | list of 05-12-2000
px-x-0902020100_114 | Gebäude nach Gemeinde, Gebäudekategorie, Bauperiode und Jahr | 2896 municipalities (plain names, 1 other codes) | list of 05-12-2000
```

```
$ python3 investigations/more-characteristics/census_2000.py /path/outside/the/repository
religion_2000: 2896 municipalities, the register's list of 05-12-2000 has 2896; the same numbers: True
  cells without a value: 0 (signs []); with a fraction: 0; municipalities whose parts do not add up to the total: 0
  the municipalities add up to the table's Switzerland: True; Switzerland: 7,288,010
  on the votes' list: 2110 municipalities, 0 without a figure, 1 groups of several
  Switzerland, on the votes' list: Evangelisch-reformierte Kirche 2,408,049 (33.04%), Römisch-katholische Kirche 3,047,887 (41.82%), Keine Zugehörigkeit 809,838 (11.11%), Ohne Angabe 315,766 (4.33%), Islamische Gemeinschaften 310,807 (4.26%)
  Evangelical Reformed: 2110 of 2110 with a figure; least 0.00%, 1st decile 5.48%, median 40.09%, 9th decile 74.45%, most 94.25%
  Roman Catholic: 2110 of 2110 with a figure; least 0.55%, 1st decile 10.10%, median 33.37%, 9th decile 83.28%, most 100.00%
  no affiliation: 2110 of 2110 with a figure; least 0.00%, 1st decile 2.88%, median 8.00%, 9th decile 16.00%, most 37.24%
  no answer: 2110 of 2110 with a figure; least 0.00%, 1st decile 1.15%, median 2.94%, 9th decile 5.17%, most 21.56%
  Zürich (261): 363,273 inhabitants; Evangelical Reformed 110,008 (30.28%), Roman Catholic 120,853 (33.27%), no affiliation 61,153 (16.83%), no answer 18,935
  Bister (6172): 33 inhabitants; Evangelical Reformed 3 (9.09%), Roman Catholic 28 (84.85%), no affiliation 1 (3.03%), no answer 0
  Luzern (1061): 75,425 inhabitants; Evangelical Reformed 10,115 (13.41%), Roman Catholic 45,836 (60.77%), no affiliation 7,176 (9.51%), no answer 4,001
  Genève (6621): 177,964 inhabitants; Evangelical Reformed 24,105 (13.54%), Roman Catholic 66,491 (37.36%), no affiliation 41,289 (23.20%), no answer 26,575
  Lugano (5192): 55,751 inhabitants; Evangelical Reformed 3,160 (5.67%), Roman Catholic 39,546 (70.93%), no affiliation 4,407 (7.90%), no answer 3,738
  Vaz/Obervaz (3506): 2,691 inhabitants; Evangelical Reformed 655 (24.34%), Roman Catholic 1,694 (62.95%), no affiliation 139 (5.17%), no answer 92
  Bern (351): 128,634 inhabitants; Evangelical Reformed 60,455 (47.00%), Roman Catholic 31,510 (24.50%), no affiliation 16,363 (12.72%), no answer 7,855
  Aarau (4001): 18,122 inhabitants; Evangelical Reformed 7,573 (41.79%), Roman Catholic 5,216 (28.78%), no affiliation 2,557 (14.11%), no answer 538
education_2000: 2896 municipalities, the register's list of 05-12-2000 has 2896; the same numbers: True
  cells without a value: 0 (signs []); with a fraction: 0; municipalities whose parts do not add up to the total: 0
  the municipalities add up to the table's Switzerland: True; Switzerland: 7,288,010
  Switzerland, on the votes' list: none or compulsory school 1,638,451, upper secondary 2,866,860, tertiary 1,010,049, no answer 527,990, of or below school age 1,244,660 ; of those who named a level, tertiary 18.31%, none or compulsory school 29.71%
  tertiary, of those who named a level: 2110 of 2110 with a figure; least 0.00%, 1st decile 8.85%, median 14.51%, 9th decile 24.92%, most 49.69%
  none or compulsory school, of those who named a level: 2110 of 2110 with a figure; least 8.70%, 1st decile 20.57%, median 30.70%, 9th decile 41.74%, most 67.57%
  no answer, of those past school age: 2110 of 2110 with a figure; least 0.00%, 1st decile 2.59%, median 6.81%, 9th decile 11.27%, most 98.54%
  Zürich (261): named a level 290,377; tertiary 72,373 (24.92%), none or compulsory school 76,077 (26.20%), no answer 29,947
  Bister (6172): named a level 30; tertiary 3 (10.00%), none or compulsory school 13 (43.33%), no answer 1
  Luzern (1061): named a level 59,288; tertiary 11,988 (20.22%), none or compulsory school 16,704 (28.17%), no answer 6,360
  Genève (6621): named a level 123,611; tertiary 40,733 (32.95%), none or compulsory school 34,170 (27.64%), no answer 29,658
  Lugano (5192): named a level 43,877; tertiary 8,353 (19.04%), none or compulsory school 15,132 (34.49%), no answer 3,945
  Vaz/Obervaz (3506): named a level 2,061; tertiary 284 (13.78%), none or compulsory school 608 (29.50%), no answer 204
  Bern (351): named a level 101,460; tertiary 24,311 (23.96%), none or compulsory school 23,272 (22.94%), no answer 12,808
  Aarau (4001): named a level 14,552; tertiary 3,284 (22.57%), none or compulsory school 3,766 (25.88%), no answer 1,097
```

```
$ python3 investigations/more-characteristics/candidate_tables.py /path/outside/the/repository
Jobs by sector (BFS, STATENT), employed persons at the end of each year:
  2131 municipalities; against the register of 01-01-2024: 0 not in it, 0 of it missing
  cells: 119,336; without a value: 2,664 (signs ['X']); with a fraction: 0; sums over the municipalities that differ from the table's Switzerland: 46 of 56
  years: 2011 to 2024; cells withheld: all sectors 15, primary 931, secondary 1197, tertiary 521; municipalities with one in 2024: 102
  municipality-years with a cell withheld: 1,284 of 29,834; by the number of sectors withheld at once: {1: 13, 2: 1177, 3: 94}; their number of all jobs: median 68, most 28,314
  municipality-years with all four counts: 28,550; of them, the sectors do not add up to all jobs in 0
  2012, on the votes' list: without the number of jobs 0
  jobs per 100 inhabitants (2012): 2110 of 2110 with a figure; least 3.8, 1st decile 18.4, median 35.9, 9th decile 69.6, most 398.8
  jobs in the primary sector (2012): 2048 of 2110 with a figure; least 0.00%, 1st decile 1.14%, median 10.92%, 9th decile 42.68%, most 100.00%
  jobs in the secondary sector (2012): 2023 of 2110 with a figure; least 0.00%, 1st decile 9.55%, median 25.35%, 9th decile 49.91%, most 95.47%
  jobs in the tertiary sector (2012): 2066 of 2110 with a figure; least 0.00%, 1st decile 31.51%, median 56.84%, 9th decile 80.98%, most 97.41%
  2024, on the votes' list: without the number of jobs 3
  jobs per 100 inhabitants (2024): 2107 of 2110 with a figure; least 6.6, 1st decile 17.4, median 35.2, 9th decile 72.8, most 410.1
  jobs in the primary sector (2024): 2025 of 2110 with a figure; least 0.00%, 1st decile 0.89%, median 9.14%, 9th decile 35.44%, most 84.38%
  primary (2024): Zürich 0.04%, Bister 63.64%, Luzern 0.14%, Genève 0.02%, Lugano 0.20%, Vaz/Obervaz 2.93%, Bern 0.15%, Aarau 0.09%
  jobs in the secondary sector (2024): 2016 of 2110 with a figure; least 0.00%, 1st decile 8.19%, median 23.33%, 9th decile 46.28%, most 95.18%
  secondary (2024): Zürich 5.31%, Bister 0.00%, Luzern 8.02%, Genève 5.36%, Lugano 8.71%, Vaz/Obervaz 12.60%, Bern 7.25%, Aarau 8.30%
  jobs in the tertiary sector (2024): 2073 of 2110 with a figure; least 4.21%, 1st decile 36.20%, median 61.75%, 9th decile 84.64%, most 100.00%
  tertiary (2024): Zürich 94.66%, Bister 36.36%, Luzern 91.85%, Genève 94.62%, Lugano 91.09%, Vaz/Obervaz 84.47%, Bern 92.60%, Aarau 91.61%
  jobs per 100 inhabitants (2024): Zürich 124.9, Bister 29.7, Luzern 98.0, Genève 93.2, Lugano 92.2, Vaz/Obervaz 104.9, Bern 146.4, Aarau 161.4
Inhabitants born abroad (BFS, STATPOP), permanent residents at the end of each year:
  2115 municipalities; against the register of 06-04-2025: 0 not in it, 0 of it missing
  cells: 59,220; without a value: 0 (signs []); with a fraction: 0; sums over the municipalities that differ from the table's Switzerland: 0 of 28
  its inhabitants against the site's data file, 2012 to 2025, on the votes' list: 0 of 29,540 differ
  born abroad (2012): 2110 of 2110 with a figure; least 0.00%, 1st decile 7.43%, median 16.84%, 9th decile 32.74%, most 64.92%
  born abroad (2025): 2110 of 2110 with a figure; least 0.00%, 1st decile 10.47%, median 21.99%, 9th decile 38.26%, most 70.31%
  born abroad (2025): Zürich 44.98%, Bister 12.82%, Luzern 34.34%, Genève 60.93%, Lugano 50.82%, Vaz/Obervaz 24.94%, Bern 31.59%, Aarau 28.14%
Turnout at National Council elections (BFS):
  2136 municipalities; against the register of 01-01-2023: 0 not in it, 0 of it missing
  cells: 17,088; without a value: 50 (signs ['...']); with a fraction: 0; sums over the municipalities that differ from the table's Switzerland: 8 of 8
  voters among those entitled (2011): 2103 of 2110 with a figure; least 26.05%, 1st decile 40.58%, median 49.89%, 9th decile 61.13%, most 86.85%
    without a figure: [389, 408, 422, 535, 629, 868, 877]
  voters among those entitled (2015): 2103 of 2110 with a figure; least 29.53%, 1st decile 41.01%, median 49.94%, 9th decile 61.00%, most 100.00%
    without a figure: [389, 408, 422, 535, 629, 868, 877]
  voters among those entitled (2019): 2104 of 2110 with a figure; least 23.16%, 1st decile 38.12%, median 46.51%, 9th decile 56.68%, most 85.35%
    without a figure: [389, 408, 422, 535, 629, 877]
  voters among those entitled (2023): 2105 of 2110 with a figure; least 21.87%, 1st decile 39.44%, median 48.76%, 9th decile 58.89%, most 84.67%
    without a figure: [389, 408, 535, 629, 877]
  turnout (2023): Zürich 51.62%, Bister 54.55%, Luzern 51.28%, Genève 42.20%, Lugano 44.79%, Vaz/Obervaz 47.66%, Bern 58.91%, Aarau 57.73%
Farms and farmland (BFS, farm structure survey):
  2115 municipalities; against the register of 06-04-2025: 0 not in it, 0 of it missing
  cells: 118,440; without a value: 0 (signs []); with a fraction: 0; sums over the municipalities that differ from the table's Switzerland: 27 of 56
  sums that differ from Switzerland, by what is counted (0 farms, 10 farmland) and of which farms (0 all, 1 organic): {('10', '0'): 14, ('10', '1'): 13}
  municipality-years with more organic farms than farms: 0; with more organic farmland than farmland: 0
  farms per 1,000 inhabitants (2012): 2110 of 2110 with a figure; least 0.0, 1st decile 1.5, median 12.8, 9th decile 43.5, most 235.3
  organic farms among the farms (2012): 2082 of 2110 with a figure; least 0.00%, 1st decile 0.00%, median 4.76%, 9th decile 25.00%, most 100.00%
  farmland of the area (2012): 2110 of 2110 with a figure; least 0.00%, 1st decile 6.89%, median 42.87%, 9th decile 73.45%, most 243.14%
  organic farmland of the farmland (2012): 2080 of 2110 with a figure; least 0.00%, 1st decile 0.00%, median 3.97%, 9th decile 30.37%, most 100.00%
    farmland with a fraction of a hectare: 0; farmland larger than the area: 27
  farms per 1,000 inhabitants (2025): 2110 of 2110 with a figure; least 0.0, 1st decile 1.0, median 9.1, 9th decile 33.2, most 243.2
  organic farms among the farms (2025): 2081 of 2110 with a figure; least 0.00%, 1st decile 0.00%, median 12.50%, 9th decile 38.85%, most 100.00%
  farmland of the area (2025): 2110 of 2110 with a figure; least 0.00%, 1st decile 6.36%, median 41.49%, 9th decile 72.76%, most 208.82%
  organic farmland of the farmland (2025): 2076 of 2110 with a figure; least 0.00%, 1st decile 0.00%, median 11.85%, 9th decile 47.33%, most 100.00%
    farmland with a fraction of a hectare: 0; farmland larger than the area: 39
  farms per 1,000 inhabitants (2025): Zürich 0.1, Bister 51.3, Luzern 0.4, Genève 0.0, Lugano 0.5, Vaz/Obervaz 10.7, Bern 0.2, Aarau 0.2
  farmland of the area (2025): Zürich 8.84%, Bister 9.81%, Luzern 17.70%, Genève 0.33%, Lugano 3.89%, Vaz/Obervaz 18.49%, Bern 16.21%, Aarau 10.45%
  organic farmland of the farmland (2025): Zürich 72.78%, Bister 17.54%, Luzern 16.01%, Genève 16.67%, Lugano 24.48%, Vaz/Obervaz 91.35%, Bern 15.89%, Aarau 0.00%
Census of 2000, occupied dwellings by who lives in them, and buildings by kind:
  2896 municipalities; against the register of 05-12-2000: 0 not in it, 0 of it missing
  cells: 231,680; without a value: 0 (signs []); with a fraction: 0; sums over the municipalities that differ from the table's Switzerland: 0 of 80
  dwellings lived in by their owner: 2110 of 2110 with a figure; least 3.61%, 1st decile 34.55%, median 56.32%, 9th decile 71.18%, most 95.52%
  dwellings lived in by their owner: Zürich 7.11%, Bister 78.57%, Luzern 12.05%, Genève 5.85%, Lugano 23.27%, Vaz/Obervaz 51.34%, Bern 10.89%, Aarau 29.50%
  2896 municipalities; against the register of 05-12-2000: 0 not in it, 0 of it missing
  cells: 92,672; without a value: 0 (signs []); with a fraction: 0; sums over the municipalities that differ from the table's Switzerland: 0 of 32
  single-family houses among the buildings with dwellings: 2110 of 2110 with a figure; least 0.00%, 1st decile 41.33%, median 60.25%, 9th decile 74.89%, most 97.12%
  single-family houses: Zürich 23.62%, Bister 68.75%, Luzern 22.63%, Genève 10.63%, Lugano 54.69%, Vaz/Obervaz 54.84%, Bern 27.33%, Aarau 55.15%
```

```
$ python3 investigations/more-characteristics/register_levels.py /path/outside/the/repository
2110 rows, 2110 numbers; the numbers of the votes' list: True
columns: HistoricalCode, BfsCode, Name, CantonId, Canton, DistrictId, District, FUA2014, DEGURB2021, FUA2021, GCITIES2021, STREG2022, DEGURB2011, GCITIES2011, REGCH, AGKG2020, STADTE2020, STGD2020, RSC2020, SPRGEB2020, AGKSA2020, AGGL2020, AGGLGK2020, MONT2019, STALAN2020, GDETYP2020_9, GDETYP2020_25, GBAE2018, BAE2018
STALAN2020: 3 classes, 0 municipalities without one
    1   509  Städtisch | Urbain | Urbano
    2   580  Intermediär (dichter periurbaner Raum und ländliche Zentren) | Intermédiaire (périurbain dense et centres ruraux) | Intermedio (periurbano denso e centri rurali)
    3  1021  Ländlich | Rural | Rurale
GDETYP2020_9: 9 classes, 0 municipalities without one
   11   174  Städtische Gemeinde einer grossen Agglomeration | Commune urbaine d’une grande agglomération | Comune urbano di un grande agglomerato
   12   200  Städtische Gemeinde einer mittelgrossen Agglomeration | Commune urbaine d'une agglomération moyenne | Comune urbano di un agglomerato medio
   13   135  Städtische Gemeinde einer kleinen oder ausserhalb einer Agglomeration | Commune urbaine d’une petite ou hors agglomération | Comune urbano di un piccolo/ fuori agglomerato
   21   120  Periurbane Gemeinde hoher Dichte | Commune périurbaine de forte densité | Comune periurbano di elevata densità
   22   372  Periurbane Gemeinde mittlerer Dichte | Commune périurbaine de moyenne densité | Comune periurbano di media densità
   23   424  Periurbane Gemeinde geringer Dichte | Commune périurbaine de faible densité | Comune periurbano di bassa densità
   31    88  Ländliche Zentrumsgemeinde | Commune d’un centre rural | Comune di un centro rurale
   32   388  Ländliche zentral gelegene Gemeinde | Commune rurale en situation centrale | Comune rurale in situazione centrale
   33   209  Ländliche periphere Gemeinde | Commune rurale périphérique | Comune rurale periferico
DEGURB2021: 3 classes, 0 municipalities without one
    1   135  Dichtbesiedeltes Gebiet | Zone densément peuplée | Area altamente urbanizzata
    2   959  Mitteldicht besiedeltes Gebiet | Zone urbanisée intermédiaire | Area mediamente urbanizzata
    3  1016  Geringbesiedeltes Gebiet | Zone faiblement peuplée | Area rurale
SPRGEB2020: 4 classes, 0 municipalities without one
    1  1374  Deutsch | Allemand | Tedesco
    2   606  Französisch | Français | Francese
    3   115  Italienisch | Italien | Italiano
    4    15  Rätoromanisch | Romanche | Romancio
MONT2019: 2 classes, 0 municipalities without one
    0  1332  Gemeinden ausseralb der Berggebiete | Commune hors des régions de montagne | Comuni fuori dalle regioni di montagna
    1   778  Gemeinden im Berggebiet | Commune des régions de montagne | Comuni delle regioni di montagna
Zürich (261): STALAN2020 1 Städtisch, GDETYP2020_9 11 Städtische Gemeinde einer grossen Agglomeration, DEGURB2021 1 Dichtbesiedeltes Gebiet, SPRGEB2020 1 Deutsch, MONT2019 0 Gemeinden ausseralb der Berggebiete
Wettingen (4045): STALAN2020 1 Städtisch, GDETYP2020_9 12 Städtische Gemeinde einer mittelgrossen Agglomeration, DEGURB2021 2 Mitteldicht besiedeltes Gebiet, SPRGEB2020 1 Deutsch, MONT2019 0 Gemeinden ausseralb der Berggebiete
Speicher (3023): STALAN2020 2 Intermediär (dichter periurbaner Raum und ländliche Zentren), GDETYP2020_9 21 Periurbane Gemeinde hoher Dichte, DEGURB2021 2 Mitteldicht besiedeltes Gebiet, SPRGEB2020 1 Deutsch, MONT2019 1 Gemeinden im Berggebiet
Bister (6172): STALAN2020 3 Ländlich, GDETYP2020_9 23 Periurbane Gemeinde geringer Dichte, DEGURB2021 3 Geringbesiedeltes Gebiet, SPRGEB2020 1 Deutsch, MONT2019 1 Gemeinden im Berggebiet
Zwischbergen (6011): STALAN2020 3 Ländlich, GDETYP2020_9 33 Ländliche periphere Gemeinde, DEGURB2021 3 Geringbesiedeltes Gebiet, SPRGEB2020 1 Deutsch, MONT2019 1 Gemeinden im Berggebiet
Genève (6621): STALAN2020 1 Städtisch, GDETYP2020_9 11 Städtische Gemeinde einer grossen Agglomeration, DEGURB2021 1 Dichtbesiedeltes Gebiet, SPRGEB2020 2 Französisch, MONT2019 0 Gemeinden ausseralb der Berggebiete
Lugano (5192): STALAN2020 1 Städtisch, GDETYP2020_9 12 Städtische Gemeinde einer mittelgrossen Agglomeration, DEGURB2021 1 Dichtbesiedeltes Gebiet, SPRGEB2020 3 Italienisch, MONT2019 1 Gemeinden im Berggebiet
```

```
$ python3 investigations/more-characteristics/data_size.py /path/outside/the/repository
the site's file today: 1,355,172 bytes, 568,360 with gzip
religion of 2000 (all, Evangelical Reformed, Roman Catholic, no affiliation): 38,923 bytes, 17,110 with gzip
education of 2000 (three levels): 29,532 bytes, 12,571 with gzip
dwellings of 2000 (occupied, by their owner): 21,518 bytes, 8,751 with gzip
buildings of 2000 (with dwellings, single-family houses): 21,020 bytes, 8,421 with gzip
born abroad, 14 years (one count; the inhabitants are in the file): 177,498 bytes, 54,309 with gzip
jobs, 14 years (all sectors): 186,053 bytes, 58,692 with gzip
jobs, 14 years (each of the three sectors, apart): 498,083 bytes, 141,789 with gzip
turnout, 4 elections (entitled, voters): 91,086 bytes, 36,533 with gzip
farms, 14 years (farms, farmland, organic farmland): 340,106 bytes, 110,998 with gzip
classes (STALAN2020): 8,441 bytes, 711 with gzip
classes (STALAN2020, GDETYP2020_9, SPRGEB2020, MONT2019): 23,211 bytes, 1,805 with gzip
```

```
$ python3 investigations/more-characteristics/reference_figures.py /path/outside/the/repository
The census of 2000 (religion: all, Evangelical Reformed, Roman Catholic, no affiliation; education: none or compulsory school, upper secondary, tertiary; dwellings: occupied, by their owner; buildings: with dwellings, single-family):
  Zürich (261): religion [363273, 110008, 120853, 61153]: 30.28%, 33.27%, 16.83%; education [76077, 141927, 72373]: tertiary 24.92%, none or compulsory 26.20%; dwellings [181801, 12920]: 7.11%; buildings [36121, 8530]: 23.62%
  Genève (6621): religion [177964, 24105, 66491, 41289]: 13.54%, 37.36%, 23.20%; education [34170, 48708, 40733]: tertiary 32.95%, none or compulsory 27.64%; dwellings [85330, 4992]: 5.85%; buildings [6990, 743]: 10.63%
  Bister (6172): religion [33, 3, 28, 1]: 9.09%, 84.85%, 3.03%; education [13, 14, 3]: tertiary 10.00%, none or compulsory 43.33%; dwellings [14, 11]: 78.57%; buildings [32, 22]: 68.75%
  Hérémence (6084): religion [1294, 40, 1239, 4]: 3.09%, 95.75%, 0.31%; education [4, 6, 6]: tertiary 37.50%, none or compulsory 25.00%; dwellings [450, 391]: 86.89%; buildings [352, 149]: 42.33%
  Lugano (5192): religion [55751, 3160, 39546, 4407]: 5.67%, 70.93%, 7.90%; education [15132, 20392, 8353]: tertiary 19.04%, none or compulsory 34.49%; dwellings [25935, 6034]: 23.27%; buildings [9006, 4925]: 54.69%
The figures of 2015:
  Zürich (261): inhabitants 396,955; born abroad 163,047 of 396,955: 41.07%; jobs 468852, by sector 231, 30062, 438559: 118.1 per 100 inhabitants, 0.05%, 6.41%, 93.54%; farms 41, farmland 855 ha, organic 381 ha: 0.1 per 1,000 inhabitants, organic 44.56%
  Genève (6621): inhabitants 198,072; born abroad 113,936 of 198,072: 57.52%; jobs 178354, by sector 26, 9989, 168339: 90.0 per 100 inhabitants, 0.01%, 5.60%, 94.38%; farms 4, farmland 8 ha, organic 1 ha: 0.0 per 1,000 inhabitants, organic 12.50%
  Bister (6172): inhabitants 31; born abroad 1 of 31: 3.23%; jobs 9, by sector 9, 0, 0: 29.0 per 100 inhabitants, 100.00%, 0.00%, 0.00%; farms 3, farmland 55 ha, organic 10 ha: 96.8 per 1,000 inhabitants, organic 18.18%
  Hérémence (6084): inhabitants 1,362; born abroad 128 of 1,362: 9.40%; jobs 415, by sector 41, 154, 220: 30.5 per 100 inhabitants, 9.88%, 37.11%, 53.01%; farms 22, farmland 336 ha, organic 61 ha: 16.2 per 1,000 inhabitants, organic 18.15%
  Lugano (5192): inhabitants 63,583; born abroad 30,225 of 63,583: 47.54%; jobs 55274, by sector 108, 5628, 49538: 86.9 per 100 inhabitants, 0.20%, 10.18%, 89.62%; farms 39, farmland 374 ha, organic 107 ha: 0.6 per 1,000 inhabitants, organic 28.61%
  Oberrieden (137): inhabitants 5,037; born abroad 1,318 of 5,037: 26.17%; jobs 1037, by sector None, None, 927: 20.6 per 100 inhabitants, none, none, 89.39%; farms 0, farmland 0 ha, organic 0 ha: 0.0 per 1,000 inhabitants, organic none
  Meienried (389): inhabitants 52; born abroad 4 of 52: 7.69%; jobs 23, by sector 14, None, None: 44.2 per 100 inhabitants, 60.87%, none, none; farms 4, farmland 60 ha, organic 0 ha: 76.9 per 1,000 inhabitants, organic 0.00%
  Rue (2097): inhabitants 2,336; born abroad 337 of 2,336: 14.43%; jobs 434, by sector None, None, 217: 18.6 per 100 inhabitants, none, none, 50.00%; farms 50, farmland 1432 ha, organic 20 ha: 21.4 per 1,000 inhabitants, organic 1.40%
  Linescio (5315): inhabitants 49; born abroad 8 of 49: 16.33%; jobs 13, by sector 4, 0, 9: 26.5 per 100 inhabitants, 30.77%, 0.00%, 69.23%; farms 1, farmland 33 ha, organic 0 ha: 20.4 per 1,000 inhabitants, organic 0.00%
  the parts of Rue (2097) on the jobs table's list, their jobs (all, primary, secondary, tertiary): Chapelle (Glâne) [36, None, None, 20]; Auboranges [53, 16, 17, 20]; Ecublens (FR) [72, 29, 9, 34]; Rue [273, 80, 50, 143]
  jobs, all sectors: 0 municipalities without a count
  jobs, primary: 58 municipalities without a count, the first [(137, 'Oberrieden'), (244, 'Geroldswil'), (336, 'Reisiswil')]
  jobs, secondary: 85 municipalities without a count, the first [(137, 'Oberrieden'), (244, 'Geroldswil'), (336, 'Reisiswil')]
  jobs, tertiary: 37 municipalities without a count, the first [(389, 'Meienried'), (422, 'Rüti bei Lyssach'), (591, 'Saxeten')]
  municipalities with no job: []
  without a farm: 31; without farmland: 32, the first [(137, 'Oberrieden'), (743, 'Nidau'), (2271, 'Meyriez')]; organic farmland larger than the farmland: 0
  from the least to the most: born abroad 0.00 to 66.13; farms per 1,000 inhabitants 0.00 to 210.53; jobs per 100 inhabitants 5.20 to 445.54
The figures of 2024:
  Zürich (261): inhabitants 436,551; born abroad 194,608 of 436,551: 44.58%; jobs 545295, by sector 199, 28928, 516168: 124.9 per 100 inhabitants, 0.04%, 5.31%, 94.66%; farms 39, farmland 772 ha, organic 551 ha: 0.1 per 1,000 inhabitants, organic 71.37%
  Genève (6621): inhabitants 209,061; born abroad 126,756 of 209,061: 60.63%; jobs 194744, by sector 36, 10433, 184275: 93.2 per 100 inhabitants, 0.02%, 5.36%, 94.62%; farms 6, farmland 8 ha, organic 1 ha: 0.0 per 1,000 inhabitants, organic 12.50%
  Bister (6172): inhabitants 37; born abroad 4 of 37: 10.81%; jobs 11, by sector 7, 0, 4: 29.7 per 100 inhabitants, 63.64%, 0.00%, 36.36%; farms 2, farmland 57 ha, organic 10 ha: 54.1 per 1,000 inhabitants, organic 17.54%
  Hérémence (6084): inhabitants 1,545; born abroad 198 of 1,545: 12.82%; jobs 479, by sector 70, 83, 326: 31.0 per 100 inhabitants, 14.61%, 17.33%, 68.06%; farms 21, farmland 362 ha, organic 159 ha: 13.6 per 1,000 inhabitants, organic 43.92%
  Lugano (5192): inhabitants 63,629; born abroad 32,027 of 63,629: 50.33%; jobs 58680, by sector 119, 5112, 53449: 92.2 per 100 inhabitants, 0.20%, 8.71%, 91.09%; farms 33, farmland 340 ha, organic 91 ha: 0.5 per 1,000 inhabitants, organic 26.76%
  Oberrieden (137): inhabitants 5,392; born abroad 1,744 of 5,392: 32.34%; jobs 1098, by sector 17, 129, 952: 20.4 per 100 inhabitants, 1.55%, 11.75%, 86.70%; farms 0, farmland 0 ha, organic 0 ha: 0.0 per 1,000 inhabitants, organic none
  Meienried (389): inhabitants 57; born abroad 7 of 57: 12.28%; jobs 25, by sector None, None, 15: 43.9 per 100 inhabitants, none, none, 60.00%; farms 3, farmland 82 ha, organic 0 ha: 52.6 per 1,000 inhabitants, organic 0.00%
  Rue (2097): inhabitants 2,638; born abroad 472 of 2,638: 17.89%; jobs 411, by sector 117, 61, 233: 15.6 per 100 inhabitants, 28.47%, 14.84%, 56.69%; farms 46, farmland 1367 ha, organic 46 ha: 17.4 per 1,000 inhabitants, organic 3.37%
  Linescio (5315): inhabitants 41; born abroad 5 of 41: 12.20%; jobs None, by sector 0, 0, None: none per 100 inhabitants, none, none, none; farms 0, farmland 0 ha, organic 0 ha: 0.0 per 1,000 inhabitants, organic none
  jobs, all sectors: 3 municipalities without a count, the first [(5315, 'Linescio'), (5935, 'Villars-Epeney'), (6142, 'Trient')]
  jobs, primary: 83 municipalities without a count, the first [(27, 'Feuerthalen'), (160, 'Zumikon'), (244, 'Geroldswil')]
  jobs, secondary: 93 municipalities without a count, the first [(27, 'Feuerthalen'), (160, 'Zumikon'), (244, 'Geroldswil')]
  jobs, tertiary: 36 municipalities without a count, the first [(423, 'Willadingen'), (591, 'Saxeten'), (609, 'Häutligen')]
  municipalities with no job: []
  without a farm: 25; without farmland: 31, the first [(27, 'Feuerthalen'), (29, 'Flurlingen'), (137, 'Oberrieden')]; organic farmland larger than the farmland: 0
  from the least to the most: born abroad 1.48 to 70.93; farms per 1,000 inhabitants 0.00 to 242.42; jobs per 100 inhabitants 6.59 to 410.12
The figures of 2025:
  Zürich (261): inhabitants 440,935; born abroad 198,342 of 440,935: 44.98%; jobs: the table has no figures of this year; farms 37, farmland 812 ha, organic 591 ha: 0.1 per 1,000 inhabitants, organic 72.78%
  Genève (6621): inhabitants 211,152; born abroad 128,652 of 211,152: 60.93%; jobs: the table has no figures of this year; farms 7, farmland 6 ha, organic 1 ha: 0.0 per 1,000 inhabitants, organic 16.67%
  Bister (6172): inhabitants 39; born abroad 5 of 39: 12.82%; jobs: the table has no figures of this year; farms 2, farmland 57 ha, organic 10 ha: 51.3 per 1,000 inhabitants, organic 17.54%
  Hérémence (6084): inhabitants 1,553; born abroad 203 of 1,553: 13.07%; jobs: the table has no figures of this year; farms 20, farmland 362 ha, organic 162 ha: 12.9 per 1,000 inhabitants, organic 44.75%
  Lugano (5192): inhabitants 63,691; born abroad 32,366 of 63,691: 50.82%; jobs: the table has no figures of this year; farms 32, farmland 335 ha, organic 82 ha: 0.5 per 1,000 inhabitants, organic 24.48%
  Oberrieden (137): inhabitants 5,410; born abroad 1,778 of 5,410: 32.87%; jobs: the table has no figures of this year; farms 0, farmland 0 ha, organic 0 ha: 0.0 per 1,000 inhabitants, organic none
  Meienried (389): inhabitants 56; born abroad 7 of 56: 12.50%; jobs: the table has no figures of this year; farms 3, farmland 82 ha, organic 0 ha: 53.6 per 1,000 inhabitants, organic 0.00%
  Rue (2097): inhabitants 2,638; born abroad 478 of 2,638: 18.12%; jobs: the table has no figures of this year; farms 47, farmland 1392 ha, organic 46 ha: 17.8 per 1,000 inhabitants, organic 3.30%
  Linescio (5315): inhabitants 42; born abroad 5 of 42: 11.90%; jobs: the table has no figures of this year; farms 0, farmland 0 ha, organic 0 ha: 0.0 per 1,000 inhabitants, organic none
  without a farm: 29; without farmland: 34, the first [(27, 'Feuerthalen'), (29, 'Flurlingen'), (137, 'Oberrieden')]; organic farmland larger than the farmland: 0
  from the least to the most: born abroad 0.00 to 70.31; farms per 1,000 inhabitants 0.00 to 243.24
```

```
$ python3 investigations/more-characteristics/official_terms.py /path/outside/the/repository
px-x-0102010000_100
  de: Ständige und nichtständige Wohnbevölkerung nach Jahr, Kanton (-) / Bezirk (>>) / Gemeinde (......), Bevölkerungstyp, Geburtsort, Geschlecht und Zivilstand
  fr: Population résidante permanente et non permanente selon Année, Canton (-) / District (>>) / Commune (......), Type de population, Lieu de naissance, Sexe et Etat civil
  it: Popolazione residente permanente e non permanente da Anno, Cantone (-) / Distretto (>>) / Comune (......), Tipo di popolazione, Luogo di nascita, Sesso e Stato civile
    Geburtsort 2: Im Ausland | A l'étranger | All'estero
px-x-0602010000_102
  de: Arbeitsstätten und Beschäftigte nach Jahr, Gemeinde, Wirtschaftssektor und Beobachtungseinheit
  fr: Etablissements et emplois selon Année, Commune, Secteur économique et Unité d'observation
  it: Stabilimenti e impieghi da Anno, Comune, Settore economico e Unità di osservazione
    Wirtschaftssektor 1: Primärsektor | Secteur primaire | Settore primario
    Wirtschaftssektor 2: Sekundärer Sektor | Secteur secondaire | Settore secondario
    Wirtschaftssektor 3: Tertiärer Sektor | Secteur tertiaire | Settore terziario
    Beobachtungseinheit 1: Arbeitsstätten | Etablissements | Stabilimenti
    Beobachtungseinheit 2: Beschäftigte | Emplois | Impieghi
px-x-0702000000_104
  de: Beschäftigte, Landwirtschaftliche Betriebe, Landwirtschaftliche Nutzfläche (LN) und Nutztiere auf Klassifizierungsebene 1 nach Beobachtungseinheit, Kanton (-) / Bezirk (>>) / Gemeinde (......), Betriebssystem und Jahr
  fr: Emplois, exploitations agricoles, surface agricole utile (SAU) et animaux de rente selon le niveau de classification 1 selon Unité d'observation, Canton (-) / District (>>) / Commune (......), Système d'exploitation et Année
  it: no description in this language
    Beobachtungseinheit 0: Betriebe | Exploitations | (none)
    Beobachtungseinheit 10: LN - Landwirtschaftliche Nutzfläche Total (in ha) | SAU - Surface agricole utile totale (en ha) | (none)
    Betriebssystem 1: Biologische Betriebe | Exploitations biologiques | (none)
px-x-4003000000_122
  de: Wohnbevölkerung 2000 nach Wohnsitztyp, Kanton (-) / Bezirk (>>) / Gemeinde (......) und Religion
  fr: Population résidante en 2000 selon Type de domicile, Canton (-) / District (>>) / Commune (......) et Religion
  it: no description in this language
    Religion 1: Evangelisch-reformierte Kirche | Eglise évangélique réformée | (none)
    Religion 8: Römisch-katholische Kirche | Eglise catholique romaine | (none)
    Religion 17: Keine Zugehörigkeit | Aucune appartenance | (none)
px-x-4003000000_161
  de: Wohnbevölkerung am wirtschaftlichen Wohnsitz 2000 nach Höchste abgeschlossene Ausbildung, Kanton (-) / Bezirk (>>) / Gemeinde (......), Staatsangehörigkeit (Kategorie) und Geschlecht
  fr: Population résidante au domicile économique en 2000 selon Plus haute formation achevée, Canton (-) / District (>>) / Commune (......), Nationalité (catégorie) et Sexe
  it: no description in this language
    Höchste abgeschlossene Ausbildung 1: Keine Ausbildung abgeschlossen | Aucune formation achevée | (none)
    Höchste abgeschlossene Ausbildung 2: Obligatorische Schule | Scolarité obligatoire | (none)
    Höchste abgeschlossene Ausbildung 7: Höhere Fach- und Berufsausbildung | Formation professionnelle supérieure | (none)
    Höchste abgeschlossene Ausbildung 8: Höhere Fachschule | Ecole professionnelle supérieure | (none)
    Höchste abgeschlossene Ausbildung 9: Fachhochschule | Haute école spécialisée | (none)
    Höchste abgeschlossene Ausbildung 10: Universität, Hochschule | Université, haute école | (none)
px-x-0903020000_113
  de: Bewohnte Wohnungen nach Gemeinde, Anzahl Zimmer, Bewohnertyp und Jahr
  fr: Logements occupés selon Commune, Nombre de pièces, Statut d'occupation et Année
  it: no description in this language
    Bewohnertyp 3: Stockwerkeigentümer/in | Propriétaire par étage | (none)
    Bewohnertyp 4: Alleineigentümer/in des Hauses | Propriétaire unique de la maison | (none)
    Bewohnertyp 5: Miteigentümer/in des Hauses | Copropriétaire de la maison | (none)
px-x-0902020100_114
  de: Gebäude nach Gemeinde, Gebäudekategorie, Bauperiode und Jahr
  fr: Bâtiments selon Commune, Type de bâtiment, Epoque de construction et Année
  it: no description in this language
    Gebäudekategorie EFH: Einfamilienhäuser | Maisons individuelles | (none)
```
