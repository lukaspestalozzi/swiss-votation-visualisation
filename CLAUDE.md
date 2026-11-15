# Popular Vote Explorer

A web app that shows how Switzerland voted in national popular votes, municipality by
municipality, and recalculates the result as if only municipalities of a certain kind had voted.
A static site for the curious public; everything runs in the browser. "Popular Vote Explorer" is
a working title: the name is not decided.

**Status:** the skeleton, the calculation, the vote data, the first screen, the map and the
characteristics. The start page lists the national votes by year, and each vote has its page with
its result, the two verdicts side by side, a map of the municipalities in the colours of their
result, which can be zoomed, moved, pointed at and clicked, a panel beside it with the 21
characteristics of the municipality last clicked, and a table of the cantons, calculated when the site is built and
in German until #9; the calculation gives the result of a vote from the entries that remain and the outcome of
each canton, and is tested against seven official votes; the pipeline writes the results of the
125 national votes since 2013, per municipality, the map's shapes and the characteristics'
counts to `app/static/data/`, and
a test runs the calculation over every one of them; the build, the checks, the module boundaries and CI are in
place, and CI publishes the site at https://lukaspestalozzi.github.io/swiss-votation-visualisation/
after every push to `main` whose checks pass. Changes #1 to #6 of `docs/roadmap.md`,
`add-project-skeleton`, `add-result-calculation`, `add-vote-data`, `add-vote-list`,
`publish-site` and `add-result-map`, are archived, and `openspec/specs/` holds their specs.
Change #7, `add-characteristics`, is applied and not yet archived (`openspec/changes/`). Three
investigations are done: `investigations/data-sources.md`, `investigations/map-data.md` and
`investigations/characteristics.md`. Next: archiving #7, then a look at performance (Q,
2026-11-15), then change #8, `add-limits`.
`README.md` is the human-facing overview.

## Where things are

| Path | What |
|------|------|
| `openspec/config.yaml` | Project context and rules: product, hard constraints, decided stack and what is still open, module boundaries, quality bar, glossary. Read first. |
| `openspec/specs/` | Current truth: what the app does, one spec per capability: `app-shell`, `build-checks`, `municipalities`, `publishing`, `result-calculation`, `result-map`, `verdicts`, `vote-data`, `vote-list`. |
| `openspec/changes/` | In-flight changes: proposal, spec deltas, design, tasks. Finished ones are under `openspec/changes/archive/`. |
| `docs/roadmap.md` | Ordered list of planned changes and their status, what counts as v1, the investigations, and the predecessor's failure modes with the change that specifies against each. |
| `investigations/` | Spikes and verified reference values (test oracles). `data-sources.md` is the first, `map-data.md` the second (the map's sources, the distances of its colours, the municipal figures its specs cite; scripts in `map-data/`, run as the file says), `characteristics.md` the third (the characteristics' sources, the list each uses, how they come onto the votes' list, and the figures the specs cite; scripts in `characteristics/`, run as the file says); the first's scripts are in `data-sources/` (Python, standard library only; the downloads stay outside the repository). One of them, `write_reference_votes.py`, writes the reference data of the calculation; `investigations/data-sources/check_ids_and_cantons.py` shows the three facts found while proposing #3, and `check_tie_break.py` what the yes and no of a tie-break question stand for, found while proposing #4. Each file names its sources, the script and the output that produced its values, and the expected values with tolerances, so that specs and tests can cite it. |
| `calculation/`, `app/`, `pipeline/` | The three modules. The code map below lists their files. |
| `app/static/data/` | The data files of the app: `app/static/data/votes.json` (the list of votes), `app/static/data/votes/<id>.json` (one file per vote, its entries), `app/static/data/municipalities.json` (the list of municipalities and the Swiss abroad), `app/static/data/map.json` (the map's shapes: municipalities, cantons, the outline of Switzerland, lakes), `app/static/data/characteristics.json` (the counts of the characteristics of each municipality, per year and election), `app/static/data/sources.json` (the record of the source files, with the query of each answer to one). Written by the pipeline (`pipeline/README.md`), never by hand; committed, and served with the site as they are. Their shape is decision 12 of the design of `add-vote-data` (of `map.json`, decision 14 of the design of `add-result-map`; of `characteristics.json`, decision 12 of the design of `add-characteristics`), their types are in `app/src/lib/vote-data.ts`. |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` | The root of the pnpm workspace: the scripts of every check, pnpm pinned in `packageManager`, Node 24 required (`engineStrict`). |
| `eslint.config.js`, `prettier.config.js`, `.prettierignore` | The linter and the formatter, one configuration for both packages. Prettier leaves Markdown, `openspec/`, `docs/`, `.agents/`, `.claude/`, `.github/`, the calculation's reference data and the app's data files alone. |
| `.agents/skills/` | The OpenSpec workflows as skills, generated by `openspec init`; `.claude/skills/` holds a link to each. Not edited by hand: `openspec update` writes them again. |
| `.github/workflows/ci.yml` | CI: the jobs `specs`, `build` and `pipeline`, and `deploy`, which publishes the build the browser tests checked on GitHub Pages, on pushes to `main` only. It pins the OpenSpec version, the Node version and the version of `astral-sh/setup-uv`. |
| `scripts/verify-local.sh` | The same checks as CI, run locally. |
| `.claude/hooks/session-start.sh` | Web sessions only: puts Node 24 on the `PATH`, installs pnpm, the OpenSpec CLI in CI's version (with its profile and workflows), the project's dependencies and the pipeline's Python and packages (`uv sync`). Registered in `.claude/settings.json`. |

## Code map

Three modules; `openspec/config.yaml` gives their boundaries. The last task of every change
keeps this map current.

### calculation

Pure TypeScript: the rules of a vote. It depends on nothing, neither on the other modules nor on
the DOM, Node or a UI framework.

| File | What |
|------|------|
| `calculation/package.json` | The package `calculation`. No dependencies. It exports `src/index.ts` as TypeScript source; there is no build step of its own. |
| `calculation/tsconfig.json` | No DOM and no Node types, `rootDir` `src`: this is what makes a forbidden import fail. |
| `calculation/src/index.ts` | What the package exports. |
| `calculation/src/cantons.ts` | The 26 cantons with their cantonal votes, and the total of a list of cantons. |
| `calculation/src/cantons.test.ts` | Its unit tests. Unit tests live next to the code as `*.test.ts`. |
| `calculation/src/kinds.ts` | The six kinds of vote and the majorities each needs; a tie-break question is not calculated. |
| `calculation/src/kinds.test.ts` | Its unit tests. |
| `calculation/src/result.ts` | `calculateResult`: from the entries that remain, the votes, the yes share, the cantonal votes, both majorities, the verdict, and the outcome of each canton with an entry, in the order of the constitution. It throws on an entry it cannot count. |
| `calculation/src/result.test.ts` | The rules, with made-up figures. The package has neither DOM nor Node types, so a test uses no `console` and no `performance`. |
| `calculation/src/reference-votes.json` | Test data: all municipal entries of seven official votes. Written by `investigations/data-sources/write_reference_votes.py`, not by hand, and not formatted. Only a test imports it. |
| `calculation/src/reference-votes.test.ts` | The seven votes against their official figures, which are those of `investigations/data-sources.md`. |

### app

The user interface: SvelteKit 3 with the static adapter, Svelte 5. It depends on `calculation`.
SvelteKit 3 has no `$lib`: the routes import `src/lib/` by relative paths. What a page shows is
worked out in plain TypeScript in `src/lib/`; the Svelte components only lay it out.

| File | What |
|------|------|
| `app/package.json` | The package `app`. `@playwright/test` is pinned exactly (see "Build and verify"); Vitest for the unit tests. |
| `app/vite.config.ts` | The configuration of Vite and SvelteKit, with the static adapter, and of Vitest, which runs `src/**/*.test.ts` only, not the browser tests. There is no `svelte.config.js`. It holds the site's path, `/swiss-votation-visualisation`: the site is built for it, with absolute paths, and written to `app/build/swiss-votation-visualisation/`. |
| `app/tsconfig.json` | Extends the one SvelteKit generates. `rootDir` `.` makes an import from `pipeline/` fail. |
| `app/src/app.html` | The page template; its language is German (`lang="de"`). |
| `app/src/app.d.ts` | SvelteKit's place for the app's global types. |
| `app/src/routes/+layout.ts` | `prerender = true`: every page is written as a file at build time; `trailingSlash = 'always'`: as `<path>/index.html`, at the address `<path>/` (`/votes/5960/`). |
| `app/src/routes/+page.server.ts` | The start page's data, at build time: the list of `vote-list.ts`, from `app/static/data/votes.json`. |
| `app/src/routes/+page.svelte` | The start page: the working title and the votes by year, each linked to its page. |
| `app/src/routes/votes/[id]/+page.server.ts` | A vote's page, at build time: `entries()` names every vote of the list; `load` reads the vote's file through `import.meta.glob` and returns what `vote-page.ts` gives, so the page holds its result and the browser loads no entries, and, for a judged vote, each municipality's yes and no votes for the map, checked against `map.json`. |
| `app/src/routes/votes/[id]/+page.svelte` | A vote's page: the head, the figures, the two verdicts side by side, the outcome, the map, the table of the cantons or the tie-break question's figures, the sources and notes, and the link back. |
| `app/src/routes/votes/[id]/ResultMap.svelte` | The map of a vote: it loads the shapes and the names once per visit, draws the outline in the lakes' colour, the municipalities in their colours or hatched, the lakes and the cantons as SVG; the box of details on pointing or clicking; zoom with the buttons and the wheel, and dragging; the legend, the source and the Swiss abroad; the message when it cannot load. It loads the characteristics apart, without waiting for them, and keeps the municipality last clicked or tapped for the panel, which stands to its right in a window at least 960 pixels wide and below it otherwise. |
| `app/src/routes/votes/[id]/CharacteristicsPanel.svelte` | The panel beside the map: the characteristics of the municipality last clicked, in four groups headed with their dates, and their sources; a sentence before the first click, while they load, or when they cannot be loaded. |
| `app/src/lib/format.ts` | Counts, shares and quotients with decimals (rounded half away from zero, from the counts), cantonal votes and dates as the screen writes them, without the locale data of the machine. |
| `app/src/lib/format.test.ts` | Its unit tests. |
| `app/src/lib/texts.ts` | Every text of the screen, in German until #9; a text with figures is a function of them. |
| `app/src/lib/vote-list.ts` | The start page's list: the years from the newest, and for each vote its date, title, kind, official result and marks. An empty list is an error. |
| `app/src/lib/vote-list.test.ts` | Its unit tests, against `votes.json` up to 2026-09-27. |
| `app/src/lib/vote-page.ts` | What a vote's page shows, from its vote of the list and the result the calculation gives over its file. A missing file or a refused entry is an error that names the vote. |
| `app/src/lib/vote-page.test.ts` | Its unit tests, against the data files and the figures of `investigations/data-sources.md`. |
| `app/src/lib/vote-data.ts` | The types of the data files in `app/static/data/`, `map.json` and `characteristics.json` included. |
| `app/src/lib/characteristics.ts` | The characteristics: one definition each (name, unit, source, value as a quotient of counts), the figures that apply to a vote (the last year and election before its day), a municipality's counts, how each value is written, and the panel's groups and lines. |
| `app/src/lib/characteristics.test.ts` | Its unit tests, against `characteristics.json` and the figures of `investigations/characteristics.md`, and a made-up file. |
| `app/src/lib/result-map.ts` | What the map shows: the side and class of a municipality from its votes, compared in whole numbers; the colours; the legend; the details of a municipality; a vote's figures for the map, checked against it. |
| `app/src/lib/result-map.test.ts` | Its unit tests, with the figures of `investigations/map-data.md`. |
| `app/src/lib/map-view.ts` | The part of the map shown, as the SVG's view box: zoom around a point from 1 to 16 times, and moving by a distance on the screen, the view's centre kept inside Switzerland. |
| `app/src/lib/map-view.test.ts` | Its unit tests. |
| `app/src/lib/map-data.ts` | Loads `map.json` and `municipalities.json` once, and `characteristics.json` once with a loader of its own, from addresses and a fetch function the page gives; a failed request rejects. |
| `app/src/lib/map-data.test.ts` | Its unit tests, with a fake fetch. |
| `app/src/lib/vote-data.test.ts` | The calculation over every vote of the data files: it gives each vote's yes and no votes, cantonal votes and verdict; four named votes against the official figures of `investigations/data-sources.md`; the map: its municipalities are the list's, every judged vote fits it; and the characteristics: their municipalities are the list's. |
| `app/static/data/` | The data files (see "Where things are"). |
| `app/playwright.config.ts` | The browser tests: they run against `app/build`, served as plain files on port 4173, under the site's path; the tests open pages by paths relative to it (`votes/5960/`). |
| `app/e2e/vote-list.spec.ts` | The browser tests of the start page, among them "all requests go to the site itself"; they compare with the site's own `data/votes.json`. |
| `app/e2e/vote-page.spec.ts` | The browser tests of the vote pages: named votes, the address without the final slash, no entries loaded, no other server, and an address that names no page (404). |
| `app/e2e/result-map.spec.ts` | The browser tests of the map: its place, colours, hatching, legend, cantons and lakes, source and Swiss abroad; pointing and clicking; zoom and move; loading once and failing; the panel of characteristics, its place and its loading; and the budgets of 16 ms per frame for zoom, move and pointing and 50 ms for clicking, measured by a script added before the page loads. |

Generated and not in the repository: `app/.svelte-kit/` (types, written by `svelte-kit sync` on
every install) and `app/build/` (the site, in `app/build/swiss-votation-visualisation/`).

### pipeline

Python 3.13 with polars, run by uv: it turns the public sources into the data files of the app
and checks them. Nothing imports it, and it does not use the calculation.

| File | What |
|------|------|
| `pipeline/README.md` | The sources, the procedure that adds a vote day, what to do when the update stops. |
| `pipeline/pyproject.toml`, `pipeline/uv.lock`, `pipeline/.python-version` | The project, its dependencies and their pinned versions; the settings of ruff, mypy (strict) and pytest. |
| `pipeline/known-differences.json` | The differences between the entries and the official result that are written down (vote 6650, 200 no votes). A line the sources no longer show stops the update. |
| `pipeline/canton-changes.json` | The municipalities that changed canton, with their earlier canton and their last day there (Moutier, BE until 2025). |
| `pipeline/src/pipeline/__init__.py` | The package; it holds only its description. |
| `pipeline/src/pipeline/__main__.py` | The command line: `update`, with `--reuse-downloads`. |
| `pipeline/src/pipeline/update.py` | The steps of a run, the characteristics among them: download, read, check, write into a new directory that replaces `app/static/data/` only when every check has passed and no vote of the data files would be lost; the two lists above; the report. |
| `pipeline/src/pipeline/download.py` | The addresses of the sources (the map's two and the characteristics' among them), the Federal Chancellery's SPARQL query, STAT-TAB's queries, the list each STAT-TAB table gives, the election days, and the download with its retries. |
| `pipeline/src/pipeline/counts.py` | `SourceError`, and the one function every count passes: a whole number from zero, or the run stops. |
| `pipeline/src/pipeline/feed.py` | The reader of the BFS vote-day files: votes, kinds, titles, entries, and their checks. |
| `pipeline/src/pipeline/chancellery.py` | The reader of the Federal Chancellery's answer: the validated results. |
| `pipeline/src/pipeline/register.py` | The reader of the BFS register: the list of municipalities. |
| `pipeline/src/pipeline/boundaries.py` | The reader of the map's sources (with pyshp): the register's K4 boundaries of the municipalities, checked against the list, the cantons and the outline of Switzerland, and the ThemaKart set's lakes, as SVG path data in whole metres. |
| `pipeline/src/pipeline/characteristics.py` | The reader of the characteristics' sources: STAT-TAB's answers in json-stat2 (population, elections, cattle, census of 2000), the register's correspondences and swisstopo's areas, with the checks of every count and sum; the seven party groups; the adding up onto the list of the votes. |
| `pipeline/src/pipeline/checks.py` | The checks between the sources: the entries against the list, the canton an entry counts for, the sums, the official result. They apply no voting rule. |
| `pipeline/src/pipeline/write.py` | The data files, `map.json` and `characteristics.json` among them, and the record of the sources with each query: the same bytes for the same sources. |
| `pipeline/tests/made_up.py` | Made-up sources in the shape of the real ones, the map's ZIPs of shapefiles and the characteristics' STAT-TAB answers, correspondences and areas among them; each test breaks its own copy. |
| `pipeline/tests/test_*.py` | The unit tests (pytest), one file per module. |

Generated and not in the repository: `pipeline/.venv/` (written by `uv`) and
`pipeline/downloads/` (the source files of the last run, about 185 MB).

## Workflow: no code without an approved change

1. `/openspec-explore` (optional): think an idea through, measure, run spikes.
2. `/openspec-propose <change-name>`: creates `openspec/changes/<change-name>/` with the proposal,
   the spec deltas, the design and the tasks.
3. Decisions that shape the change are asked while proposing and recorded in the design with the
   alternatives considered. The user reviews the whole change before it is applied.
4. `/openspec-apply-change`: implement the tasks in order; each task ends with its own
   verification step.
5. `/openspec-verify-change`: check the implementation against the change.
6. `/openspec-archive-change`: merge the spec deltas into `openspec/specs/`; update
   `docs/roadmap.md`.

So `openspec/specs/` is always the current truth of what the product does, the archive holds why
it is so, and CI validates both.

Also installed: `/openspec-update-change` (revise the artifacts of a change) and
`/openspec-sync-specs` (merge spec deltas without archiving). OpenSpec 2.0 installs skills only;
the `/opsx:*` commands of 1.x do not exist here.

Useful CLI: `openspec list`, `openspec show <name>`, `openspec validate --all --strict` (also run
by CI), `openspec instructions <artifact> --change <name>` (what the author of an artifact is
told: the context and the rules of `openspec/config.yaml`).

## Build and verify

Node 24 and pnpm 12.18.0 (pinned in `package.json`); uv for the pipeline. All commands run from
the root.

| Command | What |
|---------|------|
| `pnpm install` | The dependencies. It fails on Node older than 24. |
| `pnpm run dev` | The app with live reload, at `http://localhost:5173/swiss-votation-visualisation/`. |
| `pnpm run format` | Format the code. `pnpm run format:check` only checks. |
| `pnpm run lint` | ESLint, type-aware; warnings fail it. |
| `pnpm run check` | Static analysis: `tsc` for the calculation, `svelte-check` for the app. It enforces the module boundaries. |
| `pnpm run test` | The unit tests (Vitest) of the calculation and of the app; the app's run the calculation over the data files. |
| `pnpm run build` | The static site, written to `app/build/swiss-votation-visualisation`. |
| `pnpm run test:e2e` | The browser tests (Playwright) against `app/build`, under the site's path; build first. |
| `uv run --directory pipeline --locked python -m pipeline update` | Download the sources, check them and write the data files (`pipeline/README.md`). About 185 MB and a quarter of an hour, most of it waiting for STAT-TAB's limit of 50 queries in 15 seconds. |
| `uv run --directory pipeline --locked ruff format --check .` | The pipeline's formatting; `ruff format .` formats. |
| `uv run --directory pipeline --locked ruff check .` | The pipeline's lint. |
| `uv run --directory pipeline --locked mypy` | The pipeline's static analysis, strict. |
| `uv run --directory pipeline --locked pytest` | The pipeline's unit tests. |

- `./scripts/verify-local.sh`: the same checks as CI in the same order, 11 steps: the OpenSpec
  validation, then `format:check`, `lint`, `check`, `test`, `build`, `test:e2e`, then the
  pipeline's four (`ruff format --check`, `ruff check`, `mypy`, `pytest`). Run before every
  push. It refuses to run when Node's major version or the OpenSpec CLI is not the version CI
  uses, or when `uv` is missing.
- `./scripts/verify-local.sh --quick`: the unit tests only, of both packages and of the pipeline.
- CI (`.github/workflows/ci.yml`), on pushes to `main` and on pull requests targeting `main`: the
  `specs` job (OpenSpec validation), the `build` job (the six checks of the packages) and the
  `pipeline` job (the pipeline's four). The three are independent, so one run shows every
  failure. On a push to `main`, once all three have passed, the `deploy` job publishes the build
  the `build` job uploaded after its browser tests, on GitHub Pages
  (`actions/upload-pages-artifact`, `actions/deploy-pages`, pinned by major version like
  `actions/checkout`). Pull requests publish nothing. CI runs one run per branch at a time, in
  the order of the pushes (a waiting run is replaced by a newer one), so an older run of `main`
  never publishes over a newer site. GitHub Pages is switched on in the repository's settings
  (Pages → Source: "GitHub Actions").
- **The root `package.json` must not declare `svelte`.** The compiler also looks in the root
  `node_modules`, so the calculation could then import the UI framework. The Svelte plugins of
  ESLint and Prettier get `svelte` from pnpm as a peer.
- Pinned versions that must stay equal:
  - OpenSpec 2.0.0, in `.github/workflows/ci.yml` and in `.claude/hooks/session-start.sh`. After
    changing it, run `openspec update` and commit the skills it writes (`openspec update
    --dry-run` shows whether they are up to date).
  - Node 24, in `.github/workflows/ci.yml` (the jobs `specs` and `build`), in
    `.claude/hooks/session-start.sh` and in `engines` of `package.json`.
  - Python 3.13 in `pipeline/.python-version`, and every package of the pipeline in
    `pipeline/uv.lock`. Every `uv` command runs with `--locked`, so a lockfile that does not
    match `pipeline/pyproject.toml` fails; after changing a dependency, run `uv lock --directory
    pipeline` and commit the lockfile.
  - `astral-sh/setup-uv` v10.3.3 in `.github/workflows/ci.yml`. It publishes no tag per major
    version, so a newer release is taken by hand.
  - `@playwright/test` 1.63.0 in `app/package.json`, the version whose Chromium the cloud image
    ships. When the image changes it, the browser tests name the missing browser; change the
    version then.
- TypeScript stays on 6.0 until `svelte-check` and `typescript-eslint` support 7.
- pnpm holds back versions published very recently. If an install adds a
  `minimumReleaseAgeExclude` entry to `pnpm-workspace.yaml`, use the previous version of that
  package instead of keeping the entry.
- Outside web sessions, once: Node 24, `npm install -g pnpm@12.18.0`, `pnpm install`,
  `pnpm --filter app exec playwright install chromium`,
  `npm install -g @fission-ai/openspec@2.0.0`, and uv
  (https://docs.astral.sh/uv/getting-started/installation/). To generate the skills again, the global
  configuration must match: `openspec config set profile custom` and
  `openspec config set workflows '["propose","explore","apply","update","sync","archive","verify"]'`.
- Web sessions: the SessionStart hook does all of this, and `uv sync` for the pipeline (uv is
  part of the cloud image). The image's default is Node 22; the hook puts Node 24 first on the
  `PATH`.
- Running Python on the pipeline's code writes `__pycache__` directories; git ignores them.

## Conventions

- Conventional commits: `type(scope): description`. Types: feat, fix, refactor, test, docs,
  chore, style, ci.
- Pull requests are merged by rebasing, so that the history stays linear. A branch is started
  from an updated `main`. After a merge the branch is deleted, not reused: `main` then holds its
  commits under new ids.
- Stage files individually (never `git add .`); review the diff before committing.
- The linter at zero issues; no suppressed warning without a written justification.
- Numeric behavior is tested against reference values with explicit tolerances; counts of votes
  and of cantonal votes are exact.
- The data files in `app/static/data/` are written by the pipeline only, never by hand. A change
  of them is a run of the update, reviewed in a pull request like any other change.
- Code, comments, specs, docs and commit messages are in English.
- The predecessor, `lukaspestalozzi/votation-visualisation`, is to learn from, not to port: its
  code and its data files are not copied.
