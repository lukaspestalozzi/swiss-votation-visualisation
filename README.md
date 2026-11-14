# swiss-votation-visualisation

Working title: Popular Vote Explorer. A web app that shows how Switzerland voted in national
popular votes, municipality by municipality, and recalculates the result as if only
municipalities of a certain kind had voted. It is a static site: everything runs in the browser.

Today it holds the data and the rules, and no screen for them yet:

- the results of every national vote since 2013 per municipality, made from public sources by
  the pipeline (`pipeline/`) and committed in `app/static/data/`; they reproduce the official
  result of each vote, apart from one difference of 200 no votes that is written down;
- the calculation of a vote's result under the federal rules (`calculation/`), tested against
  the official results;
- one page with the 26 cantons and their cantonal votes, 23 in total.

`docs/roadmap.md` lists what comes next.

## Run it

Requirements: Node 24, pnpm (`npm install -g pnpm@12.18.0`), and for the pipeline
[uv](https://docs.astral.sh/uv/getting-started/installation/), which installs the Python
version and the packages the pipeline pins.

```sh
pnpm install               # the dependencies
pnpm run dev               # the app with live reload, at the address it prints
pnpm run build             # the static site, written to app/build
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
