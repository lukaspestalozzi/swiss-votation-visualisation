# swiss-votation-visualisation

Working title: Popular Vote Explorer. A web app that shows how Switzerland voted in national
popular votes, municipality by municipality, and recalculates the result as if only
municipalities of a certain kind had voted. It is a static site: everything runs in the browser.

Today it is a skeleton: one page with the 26 cantons and their cantonal votes, 23 in total.
`docs/roadmap.md` lists what comes next.

## Run it

Requirements: Node 24 and pnpm (`npm install -g pnpm@12.18.0`).

```sh
pnpm install               # the dependencies
pnpm run dev               # the app with live reload, at the address it prints
pnpm run build             # the static site, written to app/build
./scripts/verify-local.sh  # every check CI runs
```

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
