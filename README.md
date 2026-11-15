# swiss-votation-visualisation

Working title: Popular Vote Explorer. A web app that shows how Switzerland voted in national
popular votes, municipality by municipality, and recalculates the result as if only
municipalities of a certain kind had voted. It is a static site: everything runs in the browser.

The site is at https://lukaspestalozzi.github.io/swiss-votation-visualisation/. CI publishes it
from `main` after every push whose checks all pass, as the build its browser tests checked. It
sets no cookie and loads nothing from other servers; GitHub, which hosts it, logs the IP
addresses of visitors for security.

Today it shows every vote and its result, without limits yet, in German:

- the start page lists the national votes since 2013 by year, each with its date, title, kind
  and official result, marked where the Federal Chancellery adds a note or the result is not
  validated yet;
- each vote has its page (`/votes/<id>/`): the yes and no votes, the yes share and the turnout,
  the majority of voters and the majority of cantons side by side, the outcome, and a table of
  the 26 cantons;
- the page also shows a map of the 2,110 municipalities. Each is coloured by the side with more
  votes and how clearly it won, blue-green for yes and orange-red for no; the cantons and the
  lakes are drawn on top. You can zoom and move it; pointing at a municipality shows its name,
  its yes share and its votes. Its shapes come from the Federal Statistical Office
  ("Kartengrundlage: © BFS": the register of municipalities and the ThemaKart set 2026), written
  by the pipeline to `app/static/data/map.json`;
- beside the map, a panel lists the characteristics of the municipality last clicked: its
  inhabitants, share of foreigners, five age groups and density at the end of the year before
  the vote, the party strengths of the last National Council election before it, the shares of
  the four national languages in the census of 2000, its area, and its cattle per inhabitant.
  They come from the Federal Statistical Office's statistics and swisstopo, written by the
  pipeline to `app/static/data/characteristics.json`; the limits on them come with #8;
- the results come from the data of every vote per municipality, made from public sources by
  the pipeline (`pipeline/`) and committed in `app/static/data/` with the map's data; they
  reproduce the official result of each vote, apart from one difference of 200 no votes that the
  page names;
- the calculation of a vote's result under the federal rules (`calculation/`), tested against
  the official results, works them out when the site is built.

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
