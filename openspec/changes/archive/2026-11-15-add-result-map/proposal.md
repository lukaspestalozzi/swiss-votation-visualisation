# Proposal

## Why

The product shows how Switzerland voted municipality by municipality, but a vote's page still
shows only national and cantonal figures. The map is the screen the limits of #8 will act on.
Change #6 of `docs/roadmap.md`, `add-result-map`, implemented here, settles the four decisions
the roadmap leaves open for it:
- how the map is drawn;
- where its data comes from and at what level of detail;
- how it follows the mergers of municipalities;
- its colours.

## What Changes

- **The pipeline writes the map's data.** It writes one new data file, `app/static/data/map.json`:
  - the boundary of every municipality of the list of 2026-01-01;
  - the borders of the 26 cantons and the outline of Switzerland, all from the BFS register of
    municipalities for the list's reference date;
  - the 37 lakes of the BFS ThemaKart set 2026, as whole lakes.

  The update stops when a municipality of the list has no boundary, or a boundary names none.
  The record of the sources names the new source files. The pipeline gets one dependency,
  pyshp, to read shapefiles.
- **A vote's page shows a map**, below the outcome and above the table of the cantons, for every
  vote the calculation judges, not for a tie-break question:
  - Each municipality is coloured by the side with more votes and that side's share, in four
    classes per side (50 to 60%, 60 to 70%, 70 to 80%, 80% or more): blue-green for yes,
    orange-red for no. These hues are chosen so that red-green colour-blind viewers can tell
    the sides apart.
  - A municipality with as many yes as no votes is light grey.
  - A municipality without a result of its own is hatched.
  - The map shows the cantons' borders, the lakes, a legend, the source ("Kartengrundlage: ©
    BFS ...") and a sentence on the Swiss abroad, who are not on the map.
- **Pointing at a municipality** shows its name, its canton, its yes share and its yes and no
  votes. A mouse shows them on hover; a click or tap shows the same.
- **Zoom and move:**
  - with the mouse wheel and the buttons "+", "−" and "Ganze Schweiz";
  - by dragging.

  Pinch on touch screens is left to #10.
- **The data stays light:**
  - The page is written with each municipality's yes and no votes.
  - The browser loads the shapes (`data/map.json`) and the names (`data/municipalities.json`)
    once for all pages.
  - It still loads no file of entries.
  - When the shapes cannot be loaded, the page says so and shows everything else.
- **A performance budget for the map's interactions:** at most 16 ms of main-thread work per
  frame for a zoom step, a move or pointing at a municipality. A browser test checks it.
- **A new investigation**, `investigations/map-data.md`. Its scripts found the sources, how they
  fit the list, the colours' distances and the municipal figures the specs cite.

## Capabilities

### New Capabilities

- `result-map`: the map of a vote on its page. It covers:
  - what the map draws;
  - the colour classes, their colours and the legend;
  - municipalities with as many yes as no votes, or without a result of their own;
  - pointing at a municipality;
  - zoom and move;
  - the source shown, and the Swiss abroad;
  - loading the map's data, and its failure;
  - the performance budget.

### Modified Capabilities

- `municipalities`: adds the map's data:
  - the boundaries of the municipalities of the list on its reference date;
  - the cantons and the outline of Switzerland;
  - the lakes;
  - the checks that stop the update.
- `vote-data`: the record of the sources also names the map's source files: the register's
  boundaries and the ThemaKart set.

## Non-goals

- **Pinch and other touch gestures**, and reading a municipality's details without a pointer:
  #10 (`add-small-screens`). Before v1 ends, #10 also checks whether a library for zoom and move
  would serve better than this change's own code.
- **Limits, set-aside municipalities in grey, and recalculation:** #8. This change colours
  municipalities by their real result only.
- **A municipality's characteristics:** #7.
- **French and Italian:** #9. The map's texts are German.
- **A map for the tie-break question.**
- **Showing which neighbour counts the votes of a municipality without a result.** The data does
  not record it.
- **A map without JavaScript.**
- **Finer boundaries than the BFS's K4** (G1 or swisstopo's).
- **Lakes cut at the border.**
- **A map of the start page, of cantons only, or of several votes side by side** (#12).

## Impact

- **Pipeline** (`pipeline/`):
  - new addresses in `download.py`;
  - a new module that reads and checks the map's sources;
  - `write.py` writes `map.json`, `update.py` runs both;
  - `pyproject.toml` and `uv.lock` gain pyshp;
  - new unit tests with made-up shapefiles;
  - `README.md`'s table of sources.

  A run downloads about 13 MB more.
- **Data files** (`app/static/data/`):
  - new `map.json`, about 370 KB, 165 KB gzipped;
  - `sources.json` gains the map's sources.
- **App** (`app/`):
  - the types of `map.json`;
  - a module for the colour classes and the details of a municipality;
  - a module for the zoom and the view;
  - the map component on the vote page;
  - the page's data gains each municipality's yes and no votes, and the build checks them
    against the map;
  - new texts in `texts.ts`;
  - unit tests and browser tests.

  No new dependency of the app.
- **Docs:**
  - `CLAUDE.md` (code map, "Where things are");
  - `docs/roadmap.md`: #6's row, and in #10 the check of a zoom library;
  - `openspec/config.yaml`: how the map is drawn is decided;
  - `README.md`;
  - `investigations/map-data.md` and `investigations/map-data/`.
- **Sources:** the BFS register's boundaries, and the BFS ThemaKart set 2026 (OPEN-BY; the source
  is named on the map).
