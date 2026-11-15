# pipeline

The offline data pipeline. It turns the public sources into the data files the app loads, and
checks them on the way. It runs on a developer's machine, by hand, never in the browser and
never in the build.

Python 3.13 with polars, run by [uv](https://docs.astral.sh/uv/), which installs the Python of
`.python-version` and the packages of `uv.lock`. The design of the change `add-vote-data`
(under `openspec/changes/`) gives the reasons; the specs `vote-data`, `municipalities` and
`characteristics` (`openspec/specs/`) say what the data holds.

## Sources

| Source | Address | What the pipeline takes from it |
|--------|---------|---------------------------------|
| BFS vote-day files (Federal Statistical Office) | `https://ogd-static.voteinfo-app.ch/v1/ogd/sd-t-17-02-<yyyymmdd>-eidgAbstimmung.json` | The votes, their kinds and titles, the entries per municipality, the BFS's figures per canton and for Switzerland, and the reference date of the list of municipalities. |
| Federal Chancellery | `https://lindas.admin.ch/query` (SPARQL; the query is in `download.py`) | The vote days, the number of each vote, and the result the Federal Council validated, with its reference in the Federal Gazette and its note. |
| BFS register of municipalities | `https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date=<dd-mm-yyyy>` | The municipalities on the reference date, with their names and cantons. |
| BFS register of municipalities, boundaries | `https://www.agvchapp.bfs.admin.ch/api/boundaries/divisions?division=<Commune\|Canton\|Country>&resolution=K4&dissolve=true&date=<dd-mm-yyyy>&format=shp` | The boundaries of the municipalities and the cantons on the reference date, and the outline of Switzerland, for `map.json`: in LV95, rounded to the metre. |
| BFS ThemaKart set 2026 | `https://dam-api.bfs.admin.ch/hub/api/dam/assets/36390072/master` | The 37 lakes, whole, for `map.json`. They are valid for all years; a newer set is taken by changing the address in `download.py`. |
| BFS statistics API (STAT-TAB) | `https://www.pxweb.bfs.admin.ch/api/v1/de/<table>/<table>.px` (49 queries in json-stat2, and the description of the elections table; the queries are in `download.py`) | For `characteristics.json`: the population by nationality and single year of age at the end of each year (`px-x-0102010000_101`); the party votes of each National Council election (`px-x-1702020000_105`); the cattle of each year (`px-x-0702000000_104`); the main languages of the census of 2000 (`px-x-4003000000_123`). |
| BFS register of municipalities, lists and correspondences | `.../api/communes/snapshot?date=<dd-mm-yyyy>` and `.../api/communes/correspondances?startPeriod=<dd-mm-yyyy>&endPeriod=<dd-mm-yyyy>` | The list each STAT-TAB table gives (`LIST_DATES` in `download.py`), and what each of its municipalities is part of on the reference date. |
| swisstopo, swissBOUNDARIES3D of 2026-01 | `https://data.geo.admin.ch/ch.swisstopo.swissboundaries3d/swissboundaries3d_2026-01/swissboundaries3d_2026-01_2056_5728.shp.zip` | The area of each municipality, its part in a lake included. |
| The Federal Council's circulars to the cantons on the National Council elections | Federal Gazette; their days are `ELECTION_DAYS` in `download.py` | The day of each election, which decides the election that applies to a vote. |

`investigations/data-sources.md` describes the sources and what was found in them,
`investigations/map-data.md` those of the map, and `investigations/characteristics.md` those of
the characteristics.

## Adding a vote day

After a vote day, when the BFS's file has the complete results (usually the evening of the
day), and again when the Federal Chancellery has validated them (some weeks later):

1. Start a branch from an updated `main`.
2. From the repository's root, run:

   ```sh
   uv run --directory pipeline --locked python -m pipeline update
   ```

   It downloads the sources into `pipeline/downloads/` (about 185 MB and a quarter of an hour,
   most of it waiting for the BFS statistics API, which answers 50 queries in 15 seconds at
   most; git ignores the directory), checks them, and writes the data files to `app/static/data/`. It
   prints the reference date of the list of municipalities, the number of votes and how many
   are validated, the votes added, the votes validated since the last run, and the votes left
   out because their result is not complete yet.
3. Review the diff of `app/static/data/`: the new vote files, the changed lines of
   `votes.json`, and `sources.json`. `map.json` changes only with a new list of
   municipalities. `characteristics.json` gains a line when the BFS publishes a new year or a
   new election (the population in August or September, the farms in spring).
4. Run `./scripts/verify-local.sh`: among its steps, a test runs the calculation over every
   vote of the data files.
5. Commit the data files and open a pull request.

`--reuse-downloads` uses the files in `pipeline/downloads/` where they are there instead of
downloading them again; for development only, since the sources change.

## When the update stops

Nothing is written when a check fails: the data files stay as they were, and the message names
the file, the vote and, where there is one, the entry.

- **A difference from the official result.** The yes or the no votes of the entries differ
  from the Federal Chancellery's validated figure. If the difference is in the sources and
  cannot be resolved, add a line to `known-differences.json` with the vote, the count, both
  figures and the reason. The update also stops when a line there no longer occurs: remove it.
- **The entries of a canton do not sum to the canton.** A municipality has changed canton: the
  BFS lists it under its canton of today for every vote, and counts it for its earlier canton
  in the votes before the change. Add a line to `canton-changes.json` with the municipality,
  its earlier canton and its last day there.
- **The vote-day files use different lists of municipalities.** The BFS moves its files to a
  new list after the mergers of a year, one file at a time. Wait until every file states the
  new reference date, then run the update again: every data file changes.
- **The map's boundaries do not fit the list.** The register gives no boundary for a
  municipality of the list, a boundary for a number not on it, a number or a canton twice, or
  no outline; or the ThemaKart set holds no lakes. The register's boundaries of a date are made
  from its list of that date, so this means a broken answer: look at the ZIP in
  `pipeline/downloads/` and run the update again later.
- **A table of the characteristics gives another list of municipalities.** Each STAT-TAB table
  gives all its years on the register's list of one date, `LIST_DATES` in `download.py`. When
  the BFS moves a table to a newer list, the message names the table, the date and the numbers
  that differ. Find the table's new date with `investigations/characteristics/` (its check
  script compares each table's list with the register's), change it in `LIST_DATES`, and run
  the update again.
- **An election has no day.** The elections table has an election that `ELECTION_DAYS` in
  `download.py` does not have: add its day, as the Federal Council's circular to the cantons
  gives it (the next is 2027-10-24).
- **The characteristics do not add up.** The municipalities do not add up to a table's figure
  for Switzerland or a district, a municipality's ages to its inhabitants, or it has more
  foreigners than inhabitants. Look at the answer in `pipeline/downloads/` and run the update
  again later.
- **A vote of the data files is missing from the sources.** The update never removes a vote;
  a vote that the sources no longer give means an incomplete answer, usually the Federal
  Chancellery's. Run the update again later, and look at `pipeline/downloads/chancellery.json`.
- **A value the reader does not understand** (a missing count, a text where a number belongs,
  an unknown kind of vote, an unknown municipality). Look at the source file in
  `pipeline/downloads/`. The source has changed or is wrong; the reader is not to be loosened
  without a change to the specs.

## Files

| File | What |
|------|------|
| `pyproject.toml`, `uv.lock`, `.python-version` | The project, its dependencies and the pinned versions; the settings of ruff, mypy and pytest. |
| `known-differences.json` | The differences between the entries and the official result that are written down. |
| `canton-changes.json` | The municipalities that changed canton, with their earlier canton and their last day there. |
| `src/pipeline/__init__.py` | The package; it holds only its description. |
| `src/pipeline/__main__.py` | The command line: `update`. |
| `src/pipeline/update.py` | The steps of a run: download, read, check, write; and the two lists above. |
| `src/pipeline/download.py` | The addresses of the sources, the Federal Chancellery's and STAT-TAB's queries, the lists the STAT-TAB tables give, the election days, and the download. |
| `src/pipeline/counts.py` | The one function every count passes: a whole number from zero, or the run stops. |
| `src/pipeline/feed.py` | The reader of the BFS vote-day files, with its checks. |
| `src/pipeline/chancellery.py` | The reader of the Federal Chancellery's answer. |
| `src/pipeline/register.py` | The reader of the BFS register. |
| `src/pipeline/boundaries.py` | The reader of the map's sources: the register's boundaries, checked against the list, and the ThemaKart set's lakes. |
| `src/pipeline/characteristics.py` | The reader of the characteristics' sources: STAT-TAB's answers in json-stat2, the register's correspondences and swisstopo's areas, with their checks, and the adding up onto the list. |
| `src/pipeline/checks.py` | The checks between the sources: entries against the list, the sums, the official result. |
| `src/pipeline/write.py` | The data files. |
| `tests/` | The unit tests (pytest); `made_up.py` builds made-up sources in the shape of the real ones. |

The pipeline's checks are steps 8 to 11 of `scripts/verify-local.sh` and the CI job `pipeline`:

```sh
uv run --directory pipeline --locked ruff format --check .
uv run --directory pipeline --locked ruff check .
uv run --directory pipeline --locked mypy
uv run --directory pipeline --locked pytest
```

## Boundary

Nothing imports from this directory. `calculation/` and `app/` share only the data files and
their format with the pipeline; the static analysis fails when one of them imports a file from
here (`pnpm run check`). The pipeline does not use the calculation: its checks add up and
compare, and apply no voting rule. A test of the app runs the calculation over the data files.
