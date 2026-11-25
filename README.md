# swiss-votation-visualisation

Working title: Popular Vote Explorer. A web app that shows how Switzerland voted in national
popular votes, municipality by municipality, and recalculates the result as if only
municipalities of a certain kind had voted. It is a static site: everything runs in the browser.

The site is at https://lukaspestalozzi.github.io/swiss-votation-visualisation/. CI publishes it
from `main` after every push whose checks all pass, as the build its browser tests checked. It
sets no cookie and loads nothing from other servers; GitHub, which hosts it, logs the IP
addresses of visitors for security.

Today it shows every vote and its result, and recalculates it under limits, in German, French
and Italian:

- every page is written in each language, under `/de/`, `/fr/` and `/it/`. The site's address
  opens the start page in the first of the three among your browser's preferred languages, or in
  German; a switch at the top of every page opens the same page in the other two. The addresses
  from before the languages (`/votes/<id>/`, `/guide/`) still lead to their page the same way.
  The texts use the Confederation's own terms, and a vote's title, reference and note are those
  of the data in each language; places keep their one official name;
- the start page asks the question the site answers and lists the national votes since 2013 by
  year and vote day, each a row with its title, kind, a bar of its official yes share and its
  result, marked where the Federal Chancellery adds a note or the result is not validated yet.
  A search by title, three buttons for the result and links to the years stay at the top of the
  window;
- each vote has its page (`/de/votes/<id>/`): its result as a row, the outcome, the majority of
  voters with a bar of the yes share and the yes and no votes, and the majority of cantons with
  a bar of one segment per canton and the turnout; below, a table of the 26 cantons with a bar
  per canton;
- the page also shows a map of the 2,110 municipalities. Each is coloured by the side with more
  votes and how clearly it won, blue-green for yes and orange-red for no; the cantons and the
  lakes are drawn on top, and its legend is one scale. You can zoom it, with its buttons, with
  Ctrl or ⌘ and the mouse wheel or with two fingers, and move it; pointing at a municipality shows its name, its yes
  share and its votes. Its shapes come from the Federal Statistical Office
  ("Kartengrundlage: © BFS": the register of municipalities and the ThemaKart set 2026), written
  by the pipeline to `app/static/data/map.json`;
- below the map, a panel lists the 35 characteristics of the municipality last clicked, in
  eight groups, its shares drawn as bars:
  - its inhabitants, the shares of foreigners and of those born abroad, five age groups and its
    density, at the end of the year before the vote;
  - the party strengths of the last National Council election before it;
  - from the census of 2000, the newest figures there are per municipality: the four national
    languages; the Evangelical Reformed, the Roman Catholic and those without a religious
    affiliation; those with a university or higher vocational degree and those with compulsory
    school or none; the dwellings lived in by their owner and the single-family houses;
  - its jobs per 100 inhabitants and their shares in the primary, the secondary and the
    tertiary sector;
  - its area, its cattle per inhabitant, its farms per 1,000 inhabitants and the organic share
    of its farmland.

  A figure the Federal Statistical Office withholds reads "keine Angabe". The figures come from
  its statistics (STATPOP, STATENT, the National Council elections, the census of 2000, the
  farm structure survey) and from swisstopo, written by the pipeline to
  `app/static/data/characteristics.json`;
- beside the result and the map, which stay in the window on a wide screen, limits on these
  characteristics select municipalities: one button opens a list of them under the panel's
  headings; a limit draws where the municipalities lie on its track and marks the municipality
  last clicked, and you set its lower and upper bound with two sliders. A municipality remains
  only when it lies within all limits. While you drag, the map greys out the others in dark
  grey, and the result of the selection, "Mit Ihrer Auswahl", stands below the real one, bar
  above bar, with both majorities and the cantons recalculated by the same rules. A switch decides whether the Swiss abroad
  count, and one button returns to the real result. The page's address holds the selection, so
  that a link, a reload or the language switch keeps it;
- a page compares two votes (`/de/compare/`): you choose a first and a second vote, and one
  selection, made by the figures of the first, keeps the same municipalities in both. Each vote
  is drawn as on its page, its real result and below it its result with the selection, the
  second vote below the first, and the address holds both votes and the selection. Below its limits, each vote's page links to it with that vote first
  and the page's selection;
- a page "Lesehilfe" (`/de/guide/`) explains that this is a thought experiment about whole
  municipalities, not about people and not a forecast, and names every source;
- the results come from the data of every vote per municipality, made from public sources by
  the pipeline (`pipeline/`) and committed in `app/static/data/` with the map's data; they
  reproduce the official result of each vote, apart from one difference of 200 no votes that the
  page names;
- the calculation of a vote's result under the federal rules (`calculation/`), tested against
  the official results, works them out when the site is built, and again in the browser for a
  selection.

`docs/roadmap.md` lists what comes next.

## Run it

Requirements: Node 24, pnpm (`npm install -g pnpm@12.18.0`), and for the pipeline
[uv](https://docs.astral.sh/uv/getting-started/installation/), which installs the Python
version and the packages the pipeline pins.

```sh
pnpm install               # the dependencies
pnpm run dev               # the app with live reload, at http://localhost:5173/swiss-votation-visualisation/
pnpm run build             # the static site, written to app/build/swiss-votation-visualisation
./scripts/verify-local.sh  # every check CI runs

# After a vote day: download the sources, check them, and write the data files.
uv run --directory pipeline --locked python -m pipeline update
```

`pipeline/README.md` gives the procedure for a new vote day and what to do when the update
stops.

`./scripts/verify-local.sh` also needs the OpenSpec CLI
(`npm install -g @fission-ai/openspec@2.0.0`) and, once, the browser of the browser tests
(`pnpm --filter app exec playwright install chromium`).

## Spec-first workflow

The project is developed spec-first with [OpenSpec](https://github.com/Fission-AI/OpenSpec): no
code is written without an approved change. `CLAUDE.md` describes the workflow step by step.

| Path | What |
|------|------|
| `openspec/specs/` | What the app does, one spec per capability. |
| `openspec/changes/` | Changes in progress; finished ones are under `archive/`, with their proposal, design decisions and tasks. |
| `openspec/config.yaml` | Project context: product, hard constraints, stack, modules, quality bar and glossary. |
| `docs/roadmap.md` | Planned changes and their status. |
| `investigations/` | Spikes and verified reference values used as test oracles. Created by the first investigation. |
