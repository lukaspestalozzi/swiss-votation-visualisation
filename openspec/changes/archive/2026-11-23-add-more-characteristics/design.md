# Design

## Context

What the change builds on:
- **One definition per characteristic.** `app/src/lib/characteristics.ts` holds 21 definitions: a
  key, a unit, a source, a scale, and the value as a quotient of counts. The panel, the limits,
  the tracks and the share link all read them. A quotient without a whole, and a count of none,
  give "keine Angabe"; a narrowed limit sets such a municipality aside.
- **The panel's four groups** come from the definitions' sources (`panelOf`); the list "Merkmal
  hinzufügen" is flat.
- **The figures that apply to a vote** (`applyingTo`): the population's last year before the vote
  day, the cattle's last year with the population too, the last election before it.
- **One data file**, `characteristics.json`, 1.36 MB: the counts per municipality of the votes'
  list, yearly ones under their years (`Yearly`), written by the pipeline.
- **The pipeline** reads four STAT-TAB tables with 49 queries, checks each table's list against
  the register's list of a date (`LIST_DATES`), brings the counts onto the votes' list
  (`onto_list`), and stops on any count that is missing, fractional or does not add up. A
  municipality without an election result is its one exception: it has none, and inside a
  municipality made of several it adds nothing.
- **A link** holds each limit under its characteristic's key; its frame has a budget of 100 ms
  for 21 limits.

`investigations/more-characteristics.md` gives the facts, by its answers' numbers:
- what STAT-TAB has per municipality (1), and what it lacks;
- income, whose source refuses the pipeline's client (2);
- religion and education (3), housing (4), those born abroad (5), jobs (6), farms (7);
- turnout (8) and the urban or rural type (9), checked and not chosen;
- the size of the data (10), the BFS's words (11), the figures of named municipalities (12).

## Goals / Non-Goals

**Goals:**
- **A characteristic is added by its definition.** The panel, the list, the tracks, the limits,
  the link and the comparison take the 14 new ones from their definitions; none of them gets code
  for a single characteristic.
- **The new tables are checked as the old ones.** The list each gives, whole numbers, sums.
- **No new dependency**, in the app or in the pipeline: every new table is STAT-TAB's, which the
  pipeline already reads.

**Non-Goals:**
- **A new kind of limit.** Every new characteristic is a number with a lower and an upper bound.
- **Loading less.** The file stays one file (Q, decision 10).
- **Changing the calculation.** It takes numbers and none, as before.

## Decisions

### 1. The 14 characteristics (Q)

| Characteristic | Counts | Of | Source |
|------|------|------|------|
| Born abroad | permanent residents born abroad, end of a year | the inhabitants at the end of that year | STATPOP, `px-x-0102010000_100` |
| Evangelical Reformed, Roman Catholic, no religious affiliation | inhabitants of 2000 | all inhabitants of 2000 | census, `px-x-4003000000_122` |
| University or higher vocational degree; compulsory school or none | inhabitants of 2000 | those who named a level | census, `px-x-4003000000_161` |
| Lived in by their owner | occupied dwellings of 2000 | all occupied dwellings | census, `px-x-0903020000_113` |
| Single-family houses | buildings with dwellings of 2000 | all of them | census, `px-x-0902020100_114` |
| Jobs per 100 inhabitants | employed persons at workplaces, end of a year | the inhabitants at the end of that year | STATENT, `px-x-0602010000_102` |
| Primary, secondary, tertiary sector | their jobs | all jobs | the same |
| Farms per 1,000 inhabitants | farms of a year | the inhabitants at the end of that year | farm survey, `px-x-0702000000_104` |
| Organic share of farmland | hectares of organic farms | hectares of all farms | the same |

Considered and left out (Q):
- **Turnout at National Council elections:** the source holds up (investigation, 8).
- **The urban or rural type and other categories:** a limit on a category is another control; Q
  left categories out rather than give them a change of their own or the panel alone.
- **Income:** the Federal Tax Administration's server sends no reply to a client that names
  itself as Python does. A download under another client name was refused as unauthorized
  access, and the files were not read (investigation, 2). It stays open on the roadmap.

Not offered: **farmland as a share of the area**, which exceeds 100% in up to 39 municipalities
(investigation, 7).

### 2. Names that say what is counted (Q)

Each name reads alone in a limit's label. Its key is English and the same in every language.

| Key | German | French | Italian |
|------|------|------|------|
| `born-abroad` | Im Ausland geboren | Nés à l'étranger | Nati all'estero |
| `reformed` | Evangelisch-reformiert | Évangéliques réformés | Evangelici riformati |
| `catholic` | Römisch-katholisch | Catholiques romains | Cattolici romani |
| `no-religion` | Keine Religionszugehörigkeit | Sans appartenance religieuse | Senza appartenenza religiosa |
| `higher-education` | Hochschule oder höhere Berufsbildung | Haute école ou formation professionnelle supérieure | Scuola universitaria o formazione professionale superiore |
| `compulsory-education` | Obligatorische Schule oder keine Ausbildung | Scolarité obligatoire ou aucune formation | Scuola dell'obbligo o nessuna formazione |
| `owner-occupied` | Vom Eigentümer bewohnte Wohnungen | Logements occupés par leur propriétaire | Abitazioni occupate dal proprietario |
| `single-family-houses` | Einfamilienhäuser | Maisons individuelles | Case unifamiliari |
| `jobs` | Arbeitsplätze je 100 Einwohner | Emplois pour 100 habitants | Impieghi ogni 100 abitanti |
| `primary-sector` | Arbeitsplätze im Primärsektor | Emplois du secteur primaire | Impieghi nel settore primario |
| `secondary-sector` | Arbeitsplätze im Sekundärsektor | Emplois du secteur secondaire | Impieghi nel settore secondario |
| `tertiary-sector` | Arbeitsplätze im Tertiärsektor | Emplois du secteur tertiaire | Impieghi nel settore terziario |
| `farms` | Landwirtschaftsbetriebe je 1'000 Einwohner | Exploitations agricoles pour 1'000 habitants | Aziende agricole ogni 1'000 abitanti |
| `organic-farmland` | Bio-Anteil der landwirtschaftlichen Nutzfläche | Part bio de la surface agricole utile | Quota bio della superficie agricola utile |

Where they come from (investigation, 11):
- **French:** the tables' own words ("Emplois", "Secteur primaire", "Exploitations", "Surface
  agricole utile", "Scolarité obligatoire", "Formation professionnelle supérieure", "Maisons
  individuelles").
- **Italian:** STAT-TAB's for the jobs and the place of birth ("Impieghi", "Settore primario",
  "All'estero"). For the census and the farm survey STAT-TAB and the BFS's Italian pages give
  none; those are composed after the French.

Alternative considered (Q): **the BFS's own terms** ("Beschäftigte je 100 Einwohner",
"Tertiärstufe", "Wohneigentumsquote"). Shorter, but "Beschäftigte" reads as inhabitants who work,
where it counts jobs in the municipality.

### 3. Each characteristic has a group

A definition names its group, one of eight, in this order. The panel heads each group with the
date of its figures; the list uses the same headings without their dates (Q, decision 13).

| Group | Panel heading (German) | List heading | Characteristics |
|------|------|------|------|
| population | Bevölkerung Ende 2015 | Bevölkerung | 9 |
| election | Nationalratswahl 2015 | Nationalratswahl | 7 |
| languages | Hauptsprache, Volkszählung 2000 | Hauptsprache | 4 |
| religion | Religion, Volkszählung 2000 | Religion | 3 |
| education | Ausbildung, Volkszählung 2000 | Ausbildung | 2 |
| housing | Wohnen, Volkszählung 2000 | Wohnen | 2 |
| jobs | Arbeit Ende 2015 | Arbeit | 4 |
| land | Fläche und Landwirtschaft | Fläche und Landwirtschaft | 4 |

In French: "Religion", "Formation", "Logement", "Travail"; in Italian: "Religione", "Formazione",
"Abitazione", "Lavoro"; each with the census ("recensement 2000", "censimento 2000") or the year
as the existing headings write them.

"Im Ausland geboren" stands third, after "Ausländeranteil", so that the first two entries of the
list stay as the limits' keyboard scenario has them. The farms follow the cattle. A group's
source is no longer what sorts the panel: the group is, as the census now fills four groups.

Alternative considered: **one group "Volkszählung 2000"** with 11 lines, where "Deutsch: 77.70%"
and "Einfamilienhäuser: 23.62%" would stand under one heading that says nothing of either.

### 4. Those born abroad take their own year (Q)

Their table is another than the population's. The share takes the last year before the vote day
of which the file has both those born abroad and the population, and divides by the inhabitants
at the end of that year, as the cattle do. Both tables give 2010 to 2025 today; whether the BFS
always publishes them together was not verified (investigation, "Not verified").

A line of the panel whose figures are of another year than its group's heading names its year:
"Im Ausland geboren (Ende 2024): 44.58%" under "Bevölkerung Ende 2025". The rule holds for every
group with a date in its heading. A limit's label names its year in any case.

Alternative considered (Q): **the population's year**, with an update that stops while the two
tables differ in their years; a new vote day would then wait for the BFS.

### 5. Education: of those who named a level (Q)

The table sorts the inhabitants of 2000 into 13 levels (investigation, 3):
- **the degree of a university or of higher vocational education:** "Höhere Fach- und
  Berufsausbildung", "Höhere Fachschule", "Fachhochschule", "Universität, Hochschule";
- **compulsory school or none:** "Keine Ausbildung abgeschlossen", "Obligatorische Schule";
- **those who named a level:** these six and the four levels between them;
- **in no count:** "Ohne Angabe", "Schulpflichtig", "Noch nicht schulpflichtig".

The file holds three counts per municipality: none or compulsory school, upper secondary, tertiary.

**Hérémence keeps its figures** (Q): 6 and 4 of its 16 answers, 37.50% and 25.00%, though 1,077
people past school age gave none. Alternative considered (Q): **no figure where fewer than half
answered**, which would touch Hérémence alone.

Religion is in percent of all inhabitants, those of other religions and without an answer among
them, as a language's share is.

### 6. Housing: the tables that are asked for the year

Each housing table has a sibling without a year. The buildings differ between them by 7 of
1,462,167, one in Zürich (investigation, 4). The pipeline reads `…_113` and `…_114` with the year
2000 in the query, so that the query says which figures it wants.

An owner is the occupant who owns the flat ("Stockwerkeigentümer/in"), the house alone or the
house with others. Tenants, members of a cooperative, and the holders of a service, a free or a
leased dwelling are not.

### 7. Jobs, and counts the BFS withholds

**What is counted.** STATENT's employed persons ("Beschäftigte") at the workplaces in the
municipality at the end of a year: jobs there, whoever holds them. The guide says so.

**Withheld counts.** The table writes "X" where it withholds a count: 2,664 of 119,336 cells, 15
of them the number of all jobs (investigation, 6). The pipeline:
- writes none (`null`) for such a count, never zero;
- accepts "X" in this table only; any other sign stops the update, as a missing count does;
- gives a municipality made of several none where one part has none. `onto_list` adds a part
  without a figure as nothing, which suits a municipality that votes with another; for the jobs
  it takes a parameter that makes the sum none instead.

In the app nothing is new: a quotient with a count of none has no figure. With all jobs withheld,
the four characteristics have none; with a sector withheld, that sector's share.

**Jobs per 100 inhabitants** divide by the inhabitants at the end of the same year, as the
cattle do. They and the farms per 1,000 inhabitants are written with one decimal, a unit the
definitions do not have yet: one new unit, a number with one decimal.

### 8. Farms: per inhabitants, and the organic share of farmland

Both come from the table the pipeline reads for the cattle, for the same years. The farmland is
in whole hectares, as the table gives it; a municipality without farmland has no organic share
(32 in 2015), through the quotient without a whole.

Found while applying: the table goes back to 1975 and has no organic farmland of 1975, 1980 and
1985. The pipeline reads the farms, the farmland and the organic farmland for the cattle's years
alone, each of which their answers must give; the cattle are read for every year, as before.

### 9. Which tracks grow by equal factors

| Characteristic | In 2015, from the least to the most | Track |
|------|------|------|
| Jobs per 100 inhabitants | 5.2 to 445.5 | logarithmic |
| Farms per 1,000 inhabitants | 0.0 to 210.5, the median near 10 | logarithmic, from 0 as the cattle's |
| The ten shares | within 0% to 100% | linear |

So six tracks are logarithmic, with the four of before.

### 10. The data file: one file, seven more sets of counts (Q)

`characteristics.json` gains, per municipality of the list:

| Key | Shape | Counts |
|------|------|------|
| `bornAbroad` | yearly, a number | those born abroad |
| `jobs` | yearly, four numbers or none | all, primary, secondary, tertiary |
| `farms` | yearly, three numbers | farms, farmland, organic farmland (hectares) |
| `religion2000` | four numbers | all, Evangelical Reformed, Roman Catholic, no affiliation |
| `education2000` | three numbers | none or compulsory school, upper secondary, tertiary |
| `dwellings2000` | two numbers | occupied, by an owner |
| `buildings2000` | two numbers | with dwellings, single-family houses |

Each yearly set has its own years, from 2012 to the newest its table gives. The file grows from
1.36 MB to about 2.67 MB, 568 KB to about 981 KB with gzip (investigation, 10). As built:
2.40 MB, 976 KB with gzip.

Alternatives considered (Q):
- **Without the three sectors**, about 840 KB with gzip.
- **One file per vote day**, about 100 KB each: it would move the rule of which figures apply
  from the app into the pipeline.

### 11. The pipeline: six more tables, twelve more queries, one more list

| Table | Queries | Its list |
|------|------|------|
| Place of birth, `px-x-0102010000_100` | 1 | 2025-04-06 |
| Jobs, `px-x-0602010000_102` | 2, by halves of its sectors (119,392 cells) | 2024-01-01 |
| Farms, `px-x-0702000000_104`, read for the cattle today | 3 more: farms, farmland, organic farmland | 2025-04-06 |
| Religion, `px-x-4003000000_122` | 1 | 2000-12-05 |
| Education, `px-x-4003000000_161` | 1 | 2000-12-05 |
| Dwellings, `px-x-0903020000_113` | 3, by rooms (231,760 cells) | 2000-12-05 |
| Buildings, `px-x-0902020100_114` | 1 | 2000-12-05 |

- **61 answers** of STAT-TAB instead of 49, and the register's list of 2024-01-01 with its
  correspondences to 2026-01-01; `sources.json` records them.
- **Three tables name their municipalities otherwise:** the jobs, the dwellings and the buildings
  have a dimension "Gemeinde" whose labels have no six dots ("1 Aeugst am Albis", "0001 Aeugst am
  Albis") beside one code for Switzerland. The reader of a table takes a municipality's number
  from such a code too.
- **The checks** are those of the spec: each list, whole numbers, the sums over Switzerland, the
  sums within a municipality, the inhabitants of the place-of-birth table against the
  population's for the years both give. The farmland is not summed over Switzerland: each
  municipality's is a whole number of hectares, and 27 of 28 sums differ (investigation, 7).
- **STAT-TAB's pace** stays the pipeline's: a pause of 0.4 seconds between queries.
- **The jobs are asked by sectors** (Q, while applying): all jobs and the primary sector in one
  query, the secondary and the tertiary in the other, each for every year the table gives. The
  pipeline does not know a table's years before it asks, so a query by years would need the
  table's description, a 62nd file in the record, or years written in the code, which a new
  year would not reach.
- **The organic farms are not read** (Q, while applying): the file holds the farms, the farmland
  and the organic farmland, so only the organic farmland is compared with the farmland. A query
  for the organic farms would serve that check alone.

### 12. The figures that apply

`applyingTo` gains two years, each the last before the vote day of which the file has the figures
and the population: those born abroad, and the jobs. The farms take the cattle's year, as they
come from one table for the same years; the app refuses a file in which they differ.

### 13. The list under headings (Q)

"Merkmal hinzufügen" groups its entries with the browser's own grouped list (`<optgroup>`), one
group per group of the panel that still has a characteristic without a limit. A group whose
characteristics all have a limit is left out. The list takes at most the page's width: its
longest entry has 46 characters, more than a window 360 pixels wide holds (the comparison's lists
met the same, `add-vote-comparison`, task 5.1).

Alternative considered (Q): **one flat list** of 35.

### 14. The keys and the budget of a link (Q)

The 14 keys are those of decision 2. The 21 keys of before stay, so every link the site wrote
still applies.

A link with all 35 limits makes 35 tracks in one frame. With 21 limits that frame took 55 to
94 ms, about 1.3 ms of it per track (`investigations/share-link.md`); in proportion 35 limits
take 92 to 157 ms, an estimate (investigation, "Not verified"). The budget:
- **170 ms** for a link with all 35 limits (Q): 100 ms × 35 / 21, rounded up;
- **100 ms** stays for a link with up to 21 limits, with its test.

When the measurement of 35 limits exceeds 170 ms, the work stops and Q decides. As measured
(task 5.2): 71 to 126 ms with 35 limits and 45 to 82 ms with the 21 of before, seven times each.

Alternatives considered (Q): **keeping 100 ms** and making the reading of a link faster, work of
unknown size; **100 ms for up to 21 limits** and no budget beyond.

### 15. The budgets of the other inputs

- **A step of a slider** recalculates as before: the limits on the page decide its cost, not the
  number of characteristics offered. The 16 ms of the `limits` capability stay.
- **Adding a limit** makes one track, a jump: its 50 ms stay.
- **A click on the map** writes 35 lines into the panel where it wrote 21. The 16 ms of the map's
  budget stay, and its test covers the click.
- **Reading the file** follows no input and has no budget, as before. It is about twice as large.

### 16. The guide and the panel's sources

- **"Gemeinden ohne eigenes Ergebnis oder ohne Angabe"** gains: "Bei den Arbeitsplätzen eines
  Sektors fehlt die Angabe, wo das BFS die Zahl nicht veröffentlicht, und beim Bio-Anteil, wo es
  keine landwirtschaftliche Nutzfläche gibt."
- **"Die Merkmale"** names the new figures and their dates, says "Arbeitsplätze sind die
  Beschäftigten der Betriebe in der Gemeinde, wo immer diese wohnen." and "Wo die Zahlen des
  letzten Jahres noch nicht veröffentlicht sind, nimmt sie die neuesten davor.", and names the
  six logarithmic tracks.
- **The sources** gain "STATENT", in the guide and below the panel.

### 17. The tests

- **Pipeline** (pytest, made-up tables): each new reader; "X" as none and another sign as an
  error; a part without a count; each sum; the list of 2024-01-01.
- **App, unit:** the 35 definitions in order with their groups; the values of named
  municipalities against the investigation's figures (12); the years that apply; a line of
  another year; the keys.
- **Browser:** the panel's eight groups and a municipality without a figure; the list's headings
  and its width at 360 pixels; a new key in a link; the budgets of a link with 21 and with 35
  limits.

## Risks / Trade-offs

- **[The link with 35 limits exceeds 170 ms]**: an estimate of 92 to 157 ms → measured in its own
  task; over the budget, the work stops and Q decides.
- **[A first visit loads about 410 KB more]** → one file, cached for every vote; splitting it
  stays possible (decision 10).
- **[A phone reads a file twice as large]**: not measured (investigation, "Not verified") → Q
  looks at a vote's page on a phone after the merge.
- **[The BFS revises the jobs of its newest year]**: STATENT's last year is provisional → an
  update writes the revised counts, reviewed like any change of the data.
- **[The two population tables appear apart]** → those born abroad have their own year
  (decision 4).
- **[The census is from 2000]**: religion, education and housing are 13 to 26 years older than
  the votes → every heading and label names 2000, and the guide says they are the newest per
  municipality.
- **[The Italian names are composed]** where the BFS gives none → named in decision 2 for Q's
  review.
- **[Long names on a phone]** → the list takes at most the page's width, and the browser test of
  the width covers a page with the new limits.
- **[STAT-TAB refuses when asked too often]**: HTTP 429 after 650 requests in half an hour → the
  update sends 61 queries at its pace, and tries a refused one again, as today.

## Migration Plan

1. The pipeline learns the tables; its tests pass on made-up tables.
2. One run of the update writes `characteristics.json` and `sources.json` anew; no other data
   file changes.
3. The app learns the definitions, against the new file.

Rolling back is reverting the commits: the file of before has every count the 21 characteristics
need.

## Open Questions

- **When the jobs of a year appear.** The table's newest year is 2024 on 2026-11-22; the day it
  gains a year decides only when an update brings it, not how.
