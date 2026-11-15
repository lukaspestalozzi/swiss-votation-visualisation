# pipeline

The offline data pipeline. It turns the public sources into the data files the app loads, and
checks them on the way. It runs on a developer's machine, by hand, never in the browser and
never in the build.

Python 3.13 with polars, run by [uv](https://docs.astral.sh/uv/), which installs the Python of
`.python-version` and the packages of `uv.lock`. The design of the change `add-vote-data`
(under `openspec/changes/`) gives the reasons; the specs `vote-data` and `municipalities`
(`openspec/specs/`) say what the data holds.

## Sources

| Source | Address | What the pipeline takes from it |
|--------|---------|---------------------------------|
| BFS vote-day files (Federal Statistical Office) | `https://ogd-static.voteinfo-app.ch/v1/ogd/sd-t-17-02-<yyyymmdd>-eidgAbstimmung.json` | The votes, their kinds and titles, the entries per municipality, the BFS's figures per canton and for Switzerland, and the reference date of the list of municipalities. |
| Federal Chancellery | `https://lindas.admin.ch/query` (SPARQL; the query is in `download.py`) | The vote days, the number of each vote, and the result the Federal Council validated, with its reference in the Federal Gazette and its note. |
| BFS register of municipalities | `https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date=<dd-mm-yyyy>` | The municipalities on the reference date, with their names and cantons. |

`investigations/data-sources.md` describes the sources and what was found in them.

## Adding a vote day

After a vote day, when the BFS's file has the complete results (usually the evening of the
day), and again when the Federal Chancellery has validated them (some weeks later):

1. Start a branch from an updated `main`.
2. From the repository's root, run:

   ```sh
   uv run --directory pipeline --locked python -m pipeline update
   ```

   It downloads the three sources into `pipeline/downloads/` (about 125 MB, a few minutes; git
   ignores the directory), checks them, and writes the data files to `app/static/data/`. It
   prints the reference date of the list of municipalities, the number of votes and how many
   are validated, the votes added, the votes validated since the last run, and the votes left
   out because their result is not complete yet.
3. Review the diff of `app/static/data/`: the new vote files, the changed lines of
   `votes.json`, and `sources.json`.
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
| `src/pipeline/download.py` | The addresses of the sources, the Federal Chancellery's query, and the download. |
| `src/pipeline/counts.py` | The one function every count passes: a whole number from zero, or the run stops. |
| `src/pipeline/feed.py` | The reader of the BFS vote-day files, with its checks. |
| `src/pipeline/chancellery.py` | The reader of the Federal Chancellery's answer. |
| `src/pipeline/register.py` | The reader of the BFS register. |
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
