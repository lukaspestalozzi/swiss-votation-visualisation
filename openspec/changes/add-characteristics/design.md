# Design

## Context

What the change builds on:
- **The pipeline** (`pipeline/`, Python with polars, run by uv) reads the BFS vote-day files,
  the Federal Chancellery, the BFS register and the map's sources. It checks them, and writes
  the data files into a new directory that replaces `app/static/data/` only when every check
  has passed (`update.py`).
  - Every count passes one function (`counts.py`).
  - `download.py` already sends requests with a body (the Chancellery's SPARQL query) and tries
    again on HTTP 429.
  - pyshp reads shapefiles (`boundaries.py`).
- **The map** (`ResultMap.svelte`) loads `data/map.json` and `data/municipalities.json` once per
  visit through a promise kept in a module (`map-data.ts`). Pointing, clicking or tapping a
  municipality shows its details in a box on the map.
- **`format.ts`** writes counts with apostrophes, and shares from two counts with two decimals,
  rounded half away from zero in whole numbers.
- **No characteristic exists yet.** The roadmap names the predecessor's.

`investigations/characteristics.md` holds the facts found while proposing:
- **Four STAT-TAB tables** give population (2010 to 2025), the elections (2011 to 2023), the
  cattle (yearly) and the languages of 2000. swisstopo's swissBOUNDARIES3D gives the area.
- **Each table uses one list for all its years**, exactly the register's list of one date:
  2025-04-06, 2023-01-01, 2025-04-06 and 2000-12-05. swisstopo's areas use the votes' list,
  2026-01-01.
- **The register's correspondences** bring every table onto the votes' list. Every municipality
  then has figures, and the sums over Switzerland are kept. One case of the census of 2000 leads
  to two of today's municipalities: Castel San Pietro and Breggia.
- **Missing figures:** only the elections have them, for the 5 to 7 municipalities of Bern
  without a result of their own. "..." for a single party means it had no list there.
- **Size:** a file of the counts is 1,342,669 bytes, 563,089 gzipped.

## Goals / Non-Goals

**Goals:**
- **One definition per characteristic, in one module of the app**, which the panel uses now and
  the limits of #8 will use. This prevents the predecessor's failure mode 5.
- **The counts, checked like the votes' counts**, on the votes' list, in one data file that the
  pipeline regenerates with the votes.
- **Every figure shown with its year**, so that the census of 2000 is not mistaken for today's.

**Non-Goals:**
- **Recalculating with limits, and what a limit does with a missing figure:** #8.
- **A choice of the year by the visitor:** the vote decides it.
- **Figures for Switzerland or a canton**, and a comparison of a municipality with them.

## Decisions

Q decided decisions 1 to 7, 9, 13 and 14 on 2026-11-15, each from the options and the facts of
the investigation. The others follow from them or from the code, and are open to Q's review of
this change.

### 1. The figures of the last year and the last election before the vote day (Q)

A vote takes:
- the population at the end of, and the cattle of, the last year before its day;
- the last National Council election before its day;
- the census of 2000 and the area of 2026, which have one date only.

When the file has no figures of the year before yet, the vote takes the newest year the file has
before it. The population of a year is published the following August or September, so a vote
in spring meets this until then. The app chooses the years from those the file holds, in one
function. A later run of the update that brings the new year changes those votes' figures, and
nothing else needs to change.

Alternatives considered:
- **The newest figures for every vote.** The smallest data and the simplest code, but a vote of
  2013 would be filtered by figures of 2025 and the election of 2023. GLP and the Greens rose
  sharply in 2019.
- **The figures published by the vote day.** Faithful to what was known then, but a year older
  than needed, with no gain for the thought experiment.

### 2. The sources

- **Population:** STAT-TAB `px-x-0102010000_101` (STATPOP), the permanent resident population at
  year end, by nationality and single year of age.
- **Elections:** STAT-TAB `px-x-1702020000_105`, the party votes per municipality.
- **Cattle:** STAT-TAB `px-x-0702000000_104`, the farm structure survey.
- **Languages:** STAT-TAB `px-x-4003000000_123`, the census of 2000, by main language, economic
  residence.
- **Area:** swisstopo's swissBOUNDARIES3D of 2026-01, `GEM_FLAECH`.
- **Onto the list:** the BFS register's lists and correspondences.

Alternatives considered, from the investigation:
- **The BFS Regionalporträts.** One year each, and none after 2021.
- **The structural survey's languages.** Not per municipality.
- **identitas' animal statistics.** Provisional since its renewal.
- **The area of the map's K4 shapes.** Simplified, and without a figure of its own.

### 3. Languages from the census of 2000 (Q)

Each municipality gets the shares of German, French, Italian and Romansh as main language in
2000. No newer shares exist per municipality. The panel heads them "Hauptsprache, Volkszählung
2000", so their age is visible.

Alternatives considered:
- **The BFS's language region of 2020** (in the register). It is current, but a category: as a
  limit it is only in or out.
- **Both.**
- **Leaving language to #13.**

### 4. Five age groups (Q)

The groups are 0–17, 18–34, 35–49, 50–64, and 65 and over, each a share of the inhabitants. The
source gives every single year of age, so the pipeline adds them up.

Alternatives considered:
- **Under 18, 18–64, 65 and over:** below the voting age, working age, pension age.
- **Under 20, 20–64, 65 and over:** the BFS's usual groups.
- **Only under 18 and 65 and over.**

### 5. Die Mitte throughout, and the other parties together (Q)

Seven party characteristics: FDP, Die Mitte, SP, SVP, GLP, Grüne, and the other parties.
- **Die Mitte** counts CVP and BDP for 2011, 2015 and 2019. Its name says so: "Die Mitte (bis
  2020 CVP und BDP)".
- **The other parties** are every party not named, LPS (the LDP of Basel), EVP, EDU, FGA (e.g.
  AL) and Lega among them, as the BFS lists them.

Alternatives considered:
- **CVP and BDP apart until 2019, Die Mitte from 2023:** three characteristics, each without a
  figure for part of the votes.
- **"CVP / Die Mitte"**, with BDP among the others until 2019: a jump in 2023.

### 6. Cattle per inhabitant (Q)

Per municipality the BFS gives cattle (all bovines) only. Cows alone are given by canton. The
characteristic is "Rinder je Einwohner": the cattle of a year divided by the inhabitants at the
end of the same year.

Alternative considered: **leaving it out.**

### 7. The area with its lake part (Q: "whatever data is easier to get")

The area is swisstopo's `GEM_FLAECH`, in ha, as it is: one field, no subtraction. Inhabitants
per km² divide by it.
- **Where it differs:** 204 municipalities have a part in a lake, for which the density is
  lower than over land alone.
- **Cantonal lakes:** the large lakes owned by a canton (Zürichsee ZH, Bodensee, Thunersee,
  ...) belong to no municipality.

Alternatives considered:
- **Land only** (`GEM_FLAECH` minus `SEE_FLAECH`): a subtraction more.
- **The BFS's land use statistics:** another source, surveyed every few years.

### 8. Onto the votes' list through the register's correspondences

For each table, the pipeline knows the date of its list (decision 2's dates). It checks that the
table's municipalities are exactly the register's list of that date, and stops naming each
number that differs.
- **Adding up:** it adds each municipality's counts to the municipality of the votes' list that
  the register's correspondences from that date name.
- **A split:** a number that leads to several municipalities makes them one group. Each member
  gets the group's counts, so the shares are right and only a national sum would count them
  twice. Only Castel San Pietro and Breggia in 2000 are such a group.
- **A newer list:** when STAT-TAB moves a table to a newer list (at the latest when the votes do),
  the update stops. A person checks the new list and changes the date (`pipeline/README.md`).

Alternatives considered:
- **Finding each table's list date by trying the register's dates.** Many requests, and a change
  of list would pass without anyone looking.
- **Following each number through the register's mutations without a date.** A table that mixed
  two lists would count a merged municipality twice, unnoticed.

### 9. A missing figure is none, shown as "keine Angabe" (Q)

- **No party has votes in a municipality** (the table writes "..." for every party): the
  municipality has no figure for that election, `null` in the file. Its seven party
  characteristics show "keine Angabe".
- **A party has "..." where others have votes:** it had no list in that canton. It counts zero
  votes there.
- **Any other missing value** stops the update.

What a limit does with a municipality without a figure is #8's decision, as the roadmap says.

Alternative considered: **leaving the line out**, so the panel lists only the figures a
municipality has.

### 10. The checks of #3, and the sums

- **Every count** passes `counts.py`'s function: a whole number from zero, or the run stops,
  naming the source, the municipality, the year and the figure.
- **The sums:**
  - the municipalities add up to the table's figure for Switzerland (population, foreigners,
    cattle, each language);
  - a municipality's ages add up to its inhabitants;
  - foreigners never exceed inhabitants;
  - a district's municipalities add up to its party votes;
  - an area is above zero.
- **Coverage:** after the adding up, every municipality of the votes' list has every figure,
  except those of decision 9.

### 11. The file holds counts, the app computes the values

`characteristics.json` holds counts:
- inhabitants;
- foreigners;
- the five age groups;
- the votes of the seven party groups;
- cattle;
- the census's total and four languages;
- the area in ha.

Each characteristic's definition in `app/src/lib/characteristics.ts` names its counts, its unit,
its source, its date and its value. The panel writes a share with `formatShare` from two counts,
exactly as a vote's share is written.

Alternatives considered:
- **The pipeline writes the values**, rounded. Then the definitions would be split between
  Python and TypeScript, and the app could not write a share exactly from its counts.
- **Both write them.** Duplication.

### 12. The shape of `characteristics.json`

```
{
  "referenceDate": "2026-01-01",
  "municipalities": [1, 2, ...],          // the list's numbers; every array below follows them
  "population": {"years": [2012, ...], "counts": [[[inhabitants, foreigners, 0-17, 18-34,
                 35-49, 50-64, 65+], ...], ...]},           // one array per year
  "elections": [{"year": 2011, "day": "2011-10-23", "votes": [[FDP, Die Mitte, SP, SVP, GLP,
                 Grüne, others] or null, ...]}, ...],
  "cattle": {"years": [2012, ...], "counts": [[head, ...], ...]},
  "languages2000": [[all, German, French, Italian, Romansh], ...],
  "area": [hectares, ...]
}
```

Each year and each election is one line, so that the diff of a run shows which changed (as
`map.json` puts one shape per line). The election days come from the pipeline (decision 17).
The size is about 1.34 MB, 563 KB gzipped. Each new year adds about 73 KB and each election
66 KB.

Alternatives considered:
- **An object per municipality.** Its keys would be repeated 2,110 times, and the file about a
  third larger.
- **One file per year.** More files and more code, for a smaller first load (decision 13).

### 13. One file, loaded once, and the map does not wait for it (Q)

The browser loads `data/characteristics.json` once per visit, with a second promise kept in the
same module as the map's. It starts the request at the same time as the map's.
- **The map draws** when the shapes and the names are there.
- **The panel** shows "Die Merkmale werden geladen …" until the characteristics arrive, and
  "Die Merkmale können nicht geladen werden." if they fail. The map then works as before.

Alternatives considered:
- **Everything together:** the least code, but the map would wait for the bigger file, and that
  file's failure would hide the map.
- **The figures in each vote's page:** about 150 KB per page, repeated on every page.
- **One file per year.**

### 14. A panel beside the map, keeping the last municipality (Q)

The panel, headed "Merkmale der Gemeinde", shows the municipality last pointed at, clicked or
tapped:
- **Its contents:** its name, then four groups headed with their dates:
  - "Bevölkerung Ende <year>": the inhabitants, the foreigners, the five ages, the density;
  - "Nationalratswahl <year>": the seven parties;
  - "Hauptsprache, Volkszählung 2000": the four languages;
  - "Fläche und Landwirtschaft": the area (2026) and the cattle (year).

  Then a line names the sources.
- **When it changes:** it keeps the municipality while the pointer leaves the map, points at a
  lake or moves to the panel, so its figures can be read. Before the first one, it asks the
  visitor to point at a municipality.
- **Where it stands:** to the right of the map in a window at least 960 pixels wide, otherwise
  below it (a CSS grid with one media query). At 960 pixels the map keeps about 600 pixels of
  width beside a panel of about 20rem.
- **The box of details** on the map stays as it is.

Alternatives considered:
- **All characteristics in the box on the map:** about 16 lines more, covering much of the map.
- **Five key figures in the box.**
- **Switzerland as a whole while nothing is selected**, or **an empty panel.**

### 15. How the values are written

- **Counts and shares:** `formatCount`, and `formatShare` from two counts.
- **The other values:** a new function writes a quotient of two whole numbers with a number of
  decimals, rounded half away from zero in whole numbers, like `formatShare`:
  - inhabitants per km²: 100 × inhabitants / ha, with no decimal (Zürich 4'320);
  - the area: ha / 100, with two decimals (91.88 km²);
  - cattle per inhabitant: with three decimals, so that a city's few cattle do not read as
    none (Zürich 0.002, Meienried 2.519).
- **"keine Angabe"** for a missing figure.

### 16. The record of the sources names the query

A request with a body (STAT-TAB's queries, the Chancellery's SPARQL) is recorded with its body
as `query`, and the records are sorted by address and query. Many answers share one address,
and without the query they could not be told apart or asked again.

Alternatives considered:
- **A checksum of the query:** not readable.
- **One record per address:** loses answers.

### 17. The downloads, and the election days

- **STAT-TAB, in the format json-stat2:** compact, with the labels and the signs for missing
  values. A query asks for at most 100,000 cells, so the single years of age take three queries
  per year: 49 queries in all, with a pause of 0.4 s between them. The existing retries answer
  HTTP 429.
- **swissBOUNDARIES3D:** the ZIP of shapefiles, 36 MB, of which only the attribute table of the
  municipalities is read, with pyshp.
- **The four election days** are a constant in the pipeline. The update stops when the table has
  an election since 2011 without a day. The investigation could not confirm the days from a
  source, so the apply phase checks them against the Federal Chancellery.

### 18. The modules

- **Pipeline:**
  - `characteristics.py`: the reader of the json-stat2 answers, the correspondences and the
    areas, the checks, and the adding up;
  - `download.py`: the queries;
  - `update.py` and `write.py`: the new file.
- **App:**
  - `characteristics.ts`: the definitions, the figures that apply to a vote, the values and how
    they are written;
  - `vote-data.ts`: the file's type;
  - `map-data.ts`: the second loader;
  - `CharacteristicsPanel.svelte` beside the map in `ResultMap.svelte`;
  - `texts.ts`;
  - `format.ts`.

### 19. Texts and accessibility

- **Texts:** every text is in `texts.ts`, in German. The names of the characteristics are those
  of the spec `characteristics`.
- **Accessibility:** the panel is a section with a heading, and is not announced on every
  change, unlike the box of details. Reading it without a pointer is #10's.

### Tests

- **Pipeline (pytest).** `tests/made_up.py` gains made-up json-stat2 answers, correspondences
  and an attribute table of areas. There is one test per scenario of the spec `characteristics`,
  each seen to fail first:
  - a list that differs;
  - a missing count, a fraction, a negative count;
  - the sums, the ages, foreigners over inhabitants, a district;
  - an area of zero;
  - a municipality without party votes, and a party without a list;
  - a merger, and a split into a group.

  Further tests: the file's bytes, a second run, and the record's query.
- **App (Vitest):**
  - `characteristics.ts`, against `characteristics.json` and the figures of
    `investigations/characteristics.md`: Zürich, Fétigny-Ménières, Moutier, Castel San Pietro
    and Breggia, Meienried;
  - the years of the votes 5960, 5920 and 6850, and of a made-up vote of 2027;
  - the order and the names of the 21 definitions;
  - every municipality of the list in the file;
  - the new format function at its rounding edges.
- **Browser (Playwright):**
  - one test per added or modified scenario of `result-map`;
  - the existing budget test, now with the panel;
  - the existing test that no page requests another server.

### Dependencies added

None. pyshp, already the pipeline's, reads swisstopo's attribute table. The app adds nothing,
and the file is served with the site.

### Performance budget

- **Pointing:** 16 ms of main-thread work per frame, now with the panel's update (spec
  `result-map`). Its 21 values are computed from one municipality's counts.
- **Loading:** `characteristics.json` is about 1.34 MB, 563 KB gzipped, loaded once per visit.
  The map does not wait for it (decision 13). Parsing it is not budgeted; the browser tests
  print its time.
- **The pipeline:** a run downloads about 50 MB more, and spends a few minutes more, mostly on
  STAT-TAB's limit of 50 queries in 15 seconds.

## Risks / Trade-offs

- **[STAT-TAB moves a table to a newer list]** → The update stops, naming the table and the
  dates (decision 8). `pipeline/README.md` gives the step, and the investigation's check script
  shows the new list.
- **[A vote's figures change when the BFS publishes the year before]** → Intended (decision 1).
  The panel shows the year, and the diff of the run shows the new year.
- **[The census of 2000 is old]** → The panel says so in the group's heading. #8's explanation
  names it again.
- **[The election days are not confirmed by a source yet]** → A task of the apply phase checks
  them. Today no vote day falls between June and December of an election year, so a wrong day
  would change nothing in today's data.
- **[Land exchanged without a change of number]** is counted where it was in the earlier year →
  Accepted. The investigation names it.
- **[Castel San Pietro and Breggia share the languages of 2000]** → Their shares are right;
  only a national sum would count them twice, and nothing adds them up.
- **[The panel makes the map narrower on wide screens]** → At 960 pixels the map keeps about
  600 pixels of width. The browser tests find their points from the map's own box.
- **[A rate-limited or slow STAT-TAB]** → The run takes minutes longer. A failure names the
  address and leaves every data file as it was.

## Migration Plan

1. While applying, run the update command for real. Review the diff: the new
   `characteristics.json`, about 1.34 MB, and `sources.json`, with 56 more sources and the
   queries.
2. Merge by rebasing. CI publishes the site with the panel.
3. Check by hand, on a computer and on a phone:
   - `/votes/5960/` and `/votes/6850/` show the panel with the right years;
   - Meienried shows "keine Angabe";
   - the panel stands beside the map on a wide window and below it on a narrow one.
4. Rollback: revert the commit on `main`. The panel and its data file go, and the map is as
   before.

## Open Questions

- **The terms of use** of STAT-TAB's tables and of swissBOUNDARIES3D were not read. The panel
  names the sources, which meets the BFS's OPEN-BY elsewhere. A clarification would change no
  part of this change.
