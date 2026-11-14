# Proposal

## Why

The repository holds the workflow and the roadmap but no product code, no build and no tests, so
nothing that is specified later can be built, checked or looked at. The predecessor had no
automated tests and no CI, and it loaded its libraries from third-party servers at run time
(failure modes 7 and 8 in `docs/roadmap.md`). This change creates the ground every later change
stands on, and specifies against both failure modes from the first line of code.

It implements entry #1 of `docs/roadmap.md`, `add-project-skeleton`.

## What Changes

- A static web app that is built into a directory of plain files and shows one page in the
  browser: the working title and the 26 cantons with their cantonal votes, 23 in total.
- The three modules of `openspec/config.yaml` exist as directories: `calculation/`, `app/` and
  `pipeline/`. The checks fail when a module imports what it must not: the calculation cannot
  import the app, the pipeline, the UI framework or the browser's DOM; the app cannot import the
  pipeline.
- The calculation module gets its first content: the 26 cantons, each with its number of
  cantonal votes (half a vote for the six cantons of hard constraint 2). This is one fact of
  roadmap entry #2, taken forward so that the page shows something real and tested (user
  decision, 2026-11-14).
- Automated checks: formatting, lint at zero issues, static analysis, unit tests, the build, and
  a test that opens the built site in a browser. `./scripts/verify-local.sh` and CI run the same
  checks in the same order; CI gets a `build` job.
- The page requests nothing from other servers; the browser test fails if it does.
- The cloud session hook installs the toolchain and the project's dependencies, so that a web
  session can run every check.
- `pipeline/` is a directory with a note only. Its language and its tools are decided in #3,
  after the data-sources investigation.

Nothing is removed, and nothing breaks: there is no earlier behaviour.

## Non-goals

- No votes, no municipalities, no data files and no loading of data (#3).
- No calculation beyond the cantons and their cantonal votes: no sums of votes, no majorities,
  no verdict (#2).
- No vote list, no map, no limits (#4, #6, #8).
- No publishing; the site is built and tested, not hosted (#5).
- No choice of the interface languages and no translation. The page's few words are in English
  until #4 decides the language of the interface (#9 adds the three languages).
- No layout for small screens beyond what the browser does by itself (#10).
- No toolchain for the pipeline (#3).
- No product name: "Popular Vote Explorer" stays the working title.

## Capabilities

### New Capabilities

- `app-shell`: the site a visitor opens. It is a set of static files, it shows the start page
  without a server of its own, and it loads everything from where it is served.
- `result-calculation`: the result of a national vote under the federal voting rules. This
  change adds its first requirement only: the cantons and their cantonal votes. #2 adds the
  rest.
- `build-checks`: the automated checks every change passes, the same locally and in CI, among
  them the boundaries between the three modules.

The roadmap named `app-shell` alone for this change. `result-calculation` is here because of the
decision on the visible result; `build-checks` is separate so that `app-shell` describes what a
visitor gets and not how the project is checked.

### Modified Capabilities

None. `openspec/specs/` is empty.

## Impact

- **New code:** `calculation/` (TypeScript package, no dependencies at run time), `app/`
  (SvelteKit app, depends on `calculation`), `pipeline/` (a README), and the configuration of the
  workspace, the formatter and the linter at the root.
- **Changed files:** `.github/workflows/ci.yml` (Node 24, new `build` job),
  `scripts/verify-local.sh` (the new steps, `--quick`), `.claude/hooks/session-start.sh` (Node
  24, the package manager, the project's dependencies), `CLAUDE.md` (status, where things are,
  code map, build and verify), `README.md` (how to run it), `docs/roadmap.md` (entries #1 and
  #2).
- **Dependencies:** the first ones the project has. `design.md` names each with its reason. Two
  end up in what the browser loads (Svelte and SvelteKit's client code), built into the site's
  own files; all others are development tools.
- **Toolchain:** Node 24 and pnpm replace Node 22 and npm in CI and in web sessions. A machine
  outside web sessions needs Node 24, pnpm and, once, the browser for the browser test.
- **Roadmap:** entry #2 loses the cantons' half votes as new scope (it extends the requirement
  added here); entry #3 keeps the pipeline's language and gains its toolchain.
