# Proposal

## Why

The product's question is "what would the result have been if only municipalities of a certain
kind had voted?". Answering it needs the kinds: figures for every municipality that a limit of #8
can act on. Change #7 of `docs/roadmap.md`, `add-characteristics`, implemented here, is the
pipeline's second data. It brings the predecessor's characteristics onto the votes' list of
municipalities and shows them on a vote's page. It settles the decisions the roadmap leaves open
for it:
- the sources;
- which year's figures apply to a vote;
- the age groups;
- the parties over the period;
- what a municipality without a figure shows.

## What Changes

- **21 characteristics per municipality**, each with one definition (name, unit, source,
  reference date) in one module of the app, which the panel uses now and the limits of #8 will:
  - **Population**, at the end of the last year before the vote day (BFS, STATPOP):
    - inhabitants;
    - share of foreigners;
    - the shares aged 0–17, 18–34, 35–49, 50–64 and 65 and over;
    - inhabitants per km².
  - **Party strengths** in the last National Council election before the vote day (BFS):
    - FDP, Die Mitte (CVP and BDP until 2020), SP, SVP, GLP and Grüne;
    - the other parties together.
  - **Main language**, census of 2000 (BFS): the shares of German, French, Italian and Romansh.
    No newer figures per municipality exist.
  - **Area**, from swisstopo's swissBOUNDARIES3D of 2026.
  - **Cattle per inhabitant**, the cattle of the same year as the population (BFS, farm
    structure survey).
    "Cows per inhabitant" of the roadmap: the BFS gives cows alone only by canton.
- **The pipeline writes them.** It writes one new data file, `app/static/data/characteristics.json`,
  with the counts each characteristic is computed from:
  - every year a vote needs, per municipality of the votes' list (2026-01-01);
  - figures given for an earlier list added up through the register's correspondences;
  - the checks of #3 on every count;
  - the update stops when a source's municipalities are not the list it is expected to use.

  The record of the sources names the new sources, and the query of each answer that was asked
  for with one.
- **A panel beside the map** lists all characteristics of the municipality last clicked or
  tapped:
  - to the right of the map on a wide screen, below it on a narrow one;
  - each figure with the year it is from;
  - "keine Angabe" where a figure is missing: the party strengths of the 5 to 7 municipalities
    of the canton of Bern that have no election result of their own.

  The box of details on the map stays as it is.
- **The characteristics load once:** the browser loads `data/characteristics.json` once per
  visit, at the same time as the shapes and the names.
  - The map does not wait for it.
  - The panel says while it loads, and says so when it cannot be loaded.
  - The map then works as before.
- **A new investigation**, `investigations/characteristics.md`, with its scripts. It found:
  - the sources;
  - the list of municipalities each of them uses;
  - what they lack;
  - how they come onto the votes' list;
  - the figures the specs cite.

## Capabilities

### New Capabilities

- `characteristics`: the characteristics of the municipalities. It covers:
  - their definitions and sources;
  - which figures apply to a vote;
  - how figures of earlier lists of municipalities come onto the votes' list;
  - the checks on the input;
  - missing figures;
  - the data file.

### Modified Capabilities

- `result-map`:
  - the panel of characteristics beside the map;
  - the characteristics, loaded once with the map's data, and the panel's messages while they
    load or when they cannot be loaded;
  - the performance budget, which now also covers updating the panel.
- `vote-data`:
  - the record of the sources names the characteristics' sources and the query of an answer
    that was asked for with one;
  - the update command also runs the checks of `characteristics`.

## Non-goals

- **Limits, set-aside municipalities and recalculation:** #8. It also decides what a limit does
  with a municipality that has no figure.
- **More characteristics** (income, education, religion, urban or rural type): #13.
- **French and Italian:** #9. The panel's texts are German.
- **Reading the panel on a phone without a pointer:** #10. A tap selects a municipality as a click
  does.
- **Figures for Switzerland as a whole, or for a canton.**
- **Figures for the Swiss abroad.** They belong to no municipality.
- **Cows alone, or language shares after 2000.** No public source gives them per municipality.
- **Newer figures than the vote day's**, or the newest figures for every vote.

## Impact

- **Pipeline** (`pipeline/`):
  - the addresses and queries of the new sources in `download.py`;
  - a new module that reads and checks the characteristics' sources and brings them onto the
    list;
  - `write.py` writes `characteristics.json`, `update.py` runs both;
  - new unit tests with made-up answers;
  - `README.md`'s table of sources and the yearly step.

  No new dependency: pyshp already reads swisstopo's areas.
- **Data files** (`app/static/data/`):
  - new `characteristics.json`;
  - `sources.json` gains the new sources.
- **App** (`app/`):
  - the types of `characteristics.json`;
  - a module with the definitions of the characteristics, the figures that apply to a vote, and
    their values;
  - the panel beside the map;
  - the map's loader, which loads the third file;
  - new texts in `texts.ts`, and the decimal numbers in `format.ts`;
  - unit tests and browser tests.

  No new dependency of the app.
- **Docs:**
  - `CLAUDE.md` (code map, "Where things are");
  - `docs/roadmap.md`: #7's row;
  - `openspec/config.yaml`: the sources of area and language are found;
  - `README.md`;
  - `investigations/characteristics.md` and `investigations/characteristics/`.
- **Sources:**
  - the BFS statistics API (STAT-TAB), for four tables;
  - the BFS register's correspondences;
  - swisstopo's swissBOUNDARIES3D.
