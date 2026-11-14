# Design

## Context

See `proposal.md` for the motivation. The repository has no product code. CI has one job
(`specs`, the OpenSpec validation, on Node 22), `scripts/verify-local.sh` runs the same one
step, and `.claude/hooks/session-start.sh` installs the OpenSpec CLI in web sessions.
`openspec/config.yaml` fixes a static web app in TypeScript, three modules with their
boundaries, and the quality bar; it leaves the tools open and names this change as the one that
decides them.

The decisions below were asked of the user on 2026-11-14 while drafting, and then tried out
together in a spike before this design was written. The spike was a throwaway workspace outside
the repository with the layout of decision 3; nothing of it is in the repository. What it
showed, on a clean install with Node 24.22.1 and pnpm 12.18.0:

| Observed | Result |
|----------|--------|
| The six steps of the `build` job, run from the root | All pass: formatting 0.5 s, lint 3.3 s, static analysis 2.9 s, unit tests 0.5 s, build 2.6 s, browser test 3.0 s. The OpenSpec validation takes 0.2 s. |
| The built site | `app/build/index.html` holds the 26 rows and the total 23 as markup. |
| The browser test against `app/build` on a plain static file server | 2 tests pass with the Chromium of the cloud image, without a download. With a link to `fonts.googleapis.com` added to the page, the test for other servers fails and names that origin. |
| Forbidden imports in the calculation: the app by relative path, the app by name, the pipeline, `svelte`, `document`, `node:fs` | Each fails the calculation's static analysis (TS6059, TS2882, TS6059, TS2307, TS2584, TS2591). |
| The app importing a file of `pipeline/` | Fails the app's static analysis (TS6059), once `rootDir` is set in the app's `tsconfig.json`; without it, it passes. |
| `svelte` declared in the root package | The calculation can then import `svelte`. The root must not declare it. |
| Type-aware lint rules | A promise that is not awaited is reported in a `.ts` file of the calculation and in a `.svelte` file of the app. |
| Lint before the SvelteKit types exist | 2 errors in `+layout.svelte`. The app's `prepare` script (`svelte-kit sync`) creates them at install time. |
| TypeScript 7 | Not usable: `svelte-check` 4.7 accepts TypeScript 5 and 6, `typescript-eslint` 8.72 accepts versions below 6.1. |
| Node 22 with `engineStrict` | `pnpm install` refuses it; `pnpm run` does not. |
| pnpm's minimum release age | pnpm 12 writes an exception into `pnpm-workspace.yaml` when it installs a version published very recently (it did for `eslint@10.15.0`). |
| The scaffolder `sv create --no-install` | With the add-ons for Prettier, ESLint, Vitest and Playwright it still left a `node_modules` and a lockfile in the new directory; stale links in it hid two of the findings above until they were deleted. With the static adapter as its only add-on (the command of decision 13) it leaves neither. |

## Goals / Non-Goals

**Goals:**

- One command per check, the same in CI, in `scripts/verify-local.sh` and in a web session.
- The module boundaries hold because the compiler and the package manager reject a wrong import,
  not because a rule asks for it.
- The fewest moving parts that satisfy the specs: no tool that no requirement needs.
- Everything decided here is verified by a task of `tasks.md` in the repository itself, since the
  spike is gone.

**Non-Goals:**

- A toolchain for the pipeline, tests of Svelte components in isolation, code coverage, caching
  of dependencies in CI, a favicon or any styling beyond the browser's defaults. None is needed
  by a requirement of this change.
- A setting for publishing under a sub-path (#5 decides the address).

## Decisions

### 1. UI framework: Svelte 5

User decision. Svelte compiles the components away, has a small run-time, and updates only what
changed, which fits "recalculate while a limit is dragged" (hard constraint 3). Its compiler
warns about controls without a label, which serves "says what it does".

Alternatives considered: no framework (one checker for everything, but the update logic for the
list, the controls, the verdicts and three languages would be written by hand); React 19 (best
known, plain `.tsx`, but the largest run-time, and the map would have to bypass its
re-rendering); SolidJS (fine-grained updates in plain `.tsx`, but the smallest ecosystem).

Cost accepted: `.svelte` files need their own checker (`svelte-check`) and plugins for the
formatter and the linter.

### 2. Build: SvelteKit 3 with the static adapter, on Vite 8

User decision; the recommendation was Vite alone. SvelteKit is the application framework of the
Svelte project: routes as files, prerendering, conventions for pages. The static adapter writes
the site to `app/build/` as plain files. Every page is prerendered (`prerender = true` in the
root layout), so the start page is complete markup before any script runs.

Alternative considered: Vite 8 with the Svelte plugin alone (fewer parts for a one-screen app;
no router, no generated configuration).

Consequences: SvelteKit 3 keeps its configuration in `app/vite.config.ts` (there is no
`svelte.config.js`); it generates types into `app/.svelte-kit/`, which must exist before the
lint and the static analysis run, so the app's `prepare` script runs `svelte-kit sync` on every
install; a sub-path for publishing is a setting of SvelteKit that #5 decides.

### 3. Layout and names: a pnpm workspace, packages at the root

User decision.

```
/
├── package.json            root: scripts, formatter and linter; private
├── pnpm-workspace.yaml     packages: calculation, app; engineStrict
├── pnpm-lock.yaml
├── eslint.config.js
├── prettier.config.js
├── .prettierignore
├── .gitignore
├── calculation/            package "calculation"
│   ├── package.json        no dependencies; devDependencies: typescript, vitest
│   ├── tsconfig.json       no DOM, no Node types, rootDir src
│   └── src/
│       ├── index.ts        what the package exports
│       ├── cantons.ts
│       └── cantons.test.ts
├── app/                    package "app"
│   ├── package.json        dependencies: calculation (workspace:*)
│   ├── tsconfig.json       extends SvelteKit's; rootDir "."
│   ├── vite.config.ts
│   ├── playwright.config.ts
│   ├── src/
│   │   ├── app.html
│   │   ├── app.d.ts
│   │   └── routes/         +layout.ts, +layout.svelte, +page.svelte
│   └── e2e/
│       └── start-page.spec.ts
└── pipeline/
    └── README.md           what the pipeline is; its tools come with #3
```

The packages are named after the modules of `openspec/config.yaml`, `calculation` and `app`,
without a scope: both are private, and `workspace:*` makes pnpm resolve `calculation` to the
directory and never to the registry. The root package is named `popular-vote-explorer` after
the working title; it is private, and renaming it changes nothing else.

The app consumes the calculation as TypeScript source: `calculation/package.json` exports
`./src/index.ts`, and Vite compiles it with the app. The calculation has no build step of its
own.

Alternatives considered: one package with `src/calculation` and `src/app` and a lint rule on
imports (the boundary would be a configuration that can be edited or suppressed, and the
calculation would be compiled with browser types); the packages under `packages/` with a scope
(one more level, and a scope name before the product has a name).

### 4. How the boundaries are enforced

By the static analysis, with three mechanisms, each observed in the spike:

- **`rootDir`.** `calculation/tsconfig.json` sets `rootDir` to `src`, `app/tsconfig.json` sets it
  to `.`. An import that leaves the package by a relative path fails with TS6059. A package
  reached through `node_modules` is not affected, so the app can import `calculation`.
- **No DOM and no Node in the calculation.** Its `tsconfig.json` has `lib: ["ES2023"]` and
  `types: []`, so `document` and `node:fs` do not exist for it.
- **pnpm's strict `node_modules`.** A package can import only what it declares. The calculation
  declares no dependency, so `svelte` and `app` cannot be resolved from it. For this to hold,
  **the root package must not declare `svelte`**: the compiler also looks in the root
  `node_modules`. The formatter's and the linter's Svelte plugins get `svelte` as a peer from
  pnpm without it being linked there.

Not decided here, and not blocked: whether the pipeline may use the calculation for its checks
(`openspec/config.yaml` leaves it to #3).

Alternative considered: a dependency rule in the linter, or a dedicated tool
(dependency-cruiser). Rejected because the compiler already does it, with no tool added.

### 5. Package manager and Node: pnpm 12.18.0 on Node 24

User decision. Node 24 is supported until April 2028 and is in the cloud image at
`/opt/node24`; Node 22, the image's default, ends in April 2027. pnpm's strict `node_modules`
is one of the three mechanisms of decision 4.

- `package.json` pins pnpm in `packageManager` (`pnpm@12.18.0`) and requires Node in `engines`
  (`>=24`); `pnpm-workspace.yaml` sets `engineStrict: true`, so an install on Node 22 fails.
- The dependencies are declared with caret ranges; `pnpm-lock.yaml` is committed, and CI and the
  hook install with `--frozen-lockfile`. Exception: `@playwright/test` is pinned exactly
  (decision 8).
- pnpm's minimum release age stays on. If an install writes a `minimumReleaseAgeExclude` entry,
  the previous version of that package is used instead; the committed `pnpm-workspace.yaml`
  holds no such entry.

Alternatives considered: npm on Node 24 (no extra tool, but no strict `node_modules`); npm on
Node 22 (no change to the hook, but five months of support left); Node 26 (the newest LTS, but
not in the cloud image).

### 6. TypeScript 6.0, not 7

Forced by the tools of decisions 1 and 7 (see Context). Both packages and the root use
TypeScript `^6.0.3`. Moving to TypeScript 7 is a later change, once `svelte-check` and
`typescript-eslint` support it.

The calculation is compiled with `strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes` and `verbatimModuleSyntax`. The app takes SvelteKit's settings plus
`strict`.

### 7. Formatter and linter: Prettier 3 and ESLint 10

User decision. One configuration of each at the root, for both packages.

- **ESLint** with `typescript-eslint`'s `strictTypeChecked` and `stylisticTypeChecked` sets and
  the Svelte plugin's recommended set; type information comes from each package's own
  `tsconfig.json`. The root's own `.js` configuration files are linted without type
  information, since they belong to no `tsconfig.json`. The script runs
  `eslint --max-warnings 0 .`, so a warning fails it.
- **Prettier** with its defaults, single quotes and a print width of 100, and the Svelte plugin.
  It formats the code and the configuration of `calculation/`, `app/` and the root. It does not
  touch Markdown, `openspec/`, `docs/`, `.agents/`, `.claude/`, `.github/` or the lockfile:
  the documents are wrapped by hand at 100 columns, and the skills are generated by OpenSpec and
  not edited.

Alternatives considered: Biome (one tool, but its support for `.svelte` files was not verified,
and it has fewer type-aware rules); ESLint without a formatter (formatting unchecked).

### 8. Tests: Vitest 5 for units, Playwright for the built site

User decision.

- **Unit tests** live next to the code as `*.test.ts` and run with Vitest in Node. In this
  change only the calculation has them.
- **The browser test** (`app/e2e/`) runs against `app/build/`, served by a plain static file
  server (`sirv-cli`), not by SvelteKit's preview server: that is what the requirement "the site
  is a set of static files" asks for. It checks the table, and it records the origin of every
  request and expects exactly one, the page's own. The build is its own step before it; the
  test does not build.
- **`@playwright/test` is pinned to exactly 1.63.0**, the version whose Chromium the cloud image
  ships (`/opt/pw-browsers`), so that a web session needs no download. CI installs that
  Chromium with `playwright install --with-deps chromium`.
- There are no component tests yet: the page has no logic of its own, and the browser test
  covers what it shows.

Alternatives considered: Vitest only, with a text search of the built files for foreign
addresses (no browser, but it does not test what a browser does); Vitest's browser mode (one
runner, but it tests components, not the built site).

### 9. The visible result: the cantons and their 23 cantonal votes

User decision. The calculation exports the 26 cantons, each with its abbreviation and its
cantonal votes, and the total of a list of cantons; the start page renders them as a table.
This is real content with an exact test, nothing is thrown away, and failure mode 2 (Schaffhausen
and Appenzell Ausserrhoden swapped) is specified against before #2.

Alternatives considered: the title plus a placeholder value from the calculation (stays inside
`app-shell`, but the placeholder is removed again in #2); the title alone (the app → calculation
import is not exercised until #2).

Assumptions made here, each small and easy to change:

- The cantons are shown by their official two-letter abbreviations, which are the same in every
  language. Their names need a language and come with the screens.
- The few words on the page ("Popular Vote Explorer", "Canton", "Cantonal votes", "Total") are
  in English, and the page declares `lang="en"`, until #4 decides the language of the interface.
- The source of the requirement is the Federal Constitution (art. 1 for the order, art. 142
  para. 4 for the half votes), cited in the spec. The rule of `openspec/config.yaml` that a
  requirement about a result cites a named vote from `investigations/` does not apply: this is a
  constant of the rules, not the result of a vote, and no investigation exists yet.

### 10. The pipeline: a directory and its boundary, no tools

User decision. `pipeline/README.md` says what the pipeline is, that nothing imports it, and that
#3 decides its language and tools after the data-sources investigation. Decision 4 already keeps
the calculation and the app from importing it.

Alternatives considered: TypeScript now (cheap to set up, but fixes the language before the
sources are known); Python now (a second toolchain in CI before any pipeline code exists).

### 11. CI and `scripts/verify-local.sh`

- CI keeps the `specs` job and gains a `build` job; both use Node 24. The `build` job: check
  out, set up Node 24, install pnpm in the version of `packageManager` with npm, `pnpm install
  --frozen-lockfile`, then `pnpm run format:check`, `lint`, `check`, `test`, `build`, install
  Chromium, `test:e2e`.
- `scripts/verify-local.sh` gets the six `pnpm run` steps after the OpenSpec validation, in that
  order, 7 steps in all. It installs nothing: the dependencies and the browser are requirements,
  named in its header.
- The script checks the major version of Node against `node-version` in `ci.yml`, the way it
  already checks the OpenSpec version, because `pnpm run` does not (see Context).
- `--quick` runs the unit tests (`pnpm run test`). The roadmap says "the fastest": the OpenSpec
  validation is faster (0.2 s) but says nothing about code; among the checks of code, the unit
  tests and the formatting check are equally fast (0.5 s), and the unit tests are the ones that
  catch a wrong number. This was decided while drafting without asking; it changes one line.
- pnpm is installed with `npm install -g` and not with a third-party action
  (`pnpm/action-setup`): one dependency of CI fewer. Dependencies are not cached; an install
  takes seconds.

### 12. The cloud session hook

`.claude/hooks/session-start.sh` puts `/opt/node24/bin` first on the `PATH`, for itself and,
through `CLAUDE_ENV_FILE`, for the session; it stops with a message if `node` is then not
version 24. It installs pnpm in the version of `packageManager` and the OpenSpec CLI under Node
24, and runs `pnpm install --frozen-lockfile`. Its output stays off stdout, as today. The
Chromium for the browser test is already in the image.

### 13. How the app is created

The app starts from the official scaffolder, pinned: `pnpm dlx sv@1.3.0 create app --template
minimal --types ts --add sveltekit-adapter="adapter:static" --no-install`. Then it is reduced to
the files of decision 3: the scaffolder's README, `.gitignore`, `.npmrc`, `.vscode/`,
`static/robots.txt`, `src/lib/` with the Svelte logo used as favicon, and the `#lib` import
alias are removed, and `prepare` loses its `|| echo ''`, which would hide a failure. The
formatter, the linter and the tests are set up by hand as in decisions 7 and 8, not by the
scaffolder's add-ons.

Alternative considered: writing the ten files by hand (nothing to remove, but the scaffolder
knows the current shape of a SvelteKit 3 project better than a copy from memory).

### Dependencies added

Loaded by the browser, built into the site's own files (nothing is fetched from another server):

| Package | Version | Why |
|---------|---------|-----|
| `svelte` | ^5.57 | The UI framework (decision 1). |
| `@sveltejs/kit` | ^3.2 | The application framework and its client code (decision 2). |

Development tools of `app/`:

| Package | Version | Why |
|---------|---------|-----|
| `@sveltejs/adapter-static` | ^4.0 | Writes the site as static files. |
| `@sveltejs/vite-plugin-svelte` | ^7.3 | Required by SvelteKit to compile `.svelte` files. |
| `vite` | ^8.3 | The bundler SvelteKit builds with. |
| `svelte-check` | ^4.7 | Static analysis of `.svelte` and `.ts` files of the app. |
| `typescript` | ^6.0.3 | The compiler behind `svelte-check`. |
| `@types/node` | ^24 | Types for the app's configuration files, which run in Node. |
| `@playwright/test` | 1.63.0 | The browser test (decision 8). |
| `sirv-cli` | ^3.0 | The plain static file server the browser test uses. |

Development tools of `calculation/`:

| Package | Version | Why |
|---------|---------|-----|
| `typescript` | ^6.0.3 | Static analysis (`tsc --noEmit`). |
| `vitest` | ^5.1 | Unit tests. |

Development tools of the root:

| Package | Version | Why |
|---------|---------|-----|
| `prettier` | ^3.10 | The formatter. |
| `prettier-plugin-svelte` | ^4.1 | Formats `.svelte` files. |
| `eslint` | ^10 | The linter. |
| `@eslint/js` | ^10 | ESLint's recommended rules for JavaScript. |
| `typescript-eslint` | ^8.72 | Parser and type-aware rules for TypeScript. |
| `eslint-plugin-svelte` | ^3.24 | Rules and parser for `.svelte` files. |
| `eslint-config-prettier` | ^10.1 | Switches off the lint rules that would contradict the formatter. |
| `globals` | ^17 | The lists of global names (browser, Node) ESLint needs. |
| `typescript` | ^6.0.3 | Required by `typescript-eslint`. |

Tools that are not dependencies: pnpm 12.18.0 (the package manager) and `sv` 1.3.0 (the
scaffolder, run once).

### Performance budget

This change adds no computation that a user's action triggers: the page is prerendered and has
no control. No budget applies. The budget of hard constraint 3 is set by #8.

## Risks / Trade-offs

- [The app's side of the spike ran once on stale `node_modules`; the findings were repeated on a
  clean install, but only in the spike] → Every finding this design relies on has its own task
  with its own check in the repository, among them one task per forbidden import.
- [SvelteKit brings a router and generated files that a one-screen app does not need] → Accepted
  with decision 2. The generated files stay out of the repository (`app/.svelte-kit/` is
  ignored) and are created at install time.
- [Playwright is pinned to the cloud image's browser; when the image moves to another version,
  the browser test no longer finds its Chromium in a web session] → The failure names the
  missing browser. The fix is one line: the version of `@playwright/test`. CI is not affected,
  since it installs the browser for the pinned version.
- [The `PATH` of a web session depends on the hook; a session that starts without it runs Node
  22] → `pnpm install` and `scripts/verify-local.sh` both refuse Node 22 with a message.
- [The hook can only be tried for real in a new web session] → A task runs the hook by hand with
  a temporary `CLAUDE_ENV_FILE` and checks the result; the first session after the merge
  confirms it.
- [Root-level tools (ESLint, Prettier, TypeScript) can be resolved from the calculation, because
  the compiler looks in the root `node_modules`] → Accepted: none of them is a module, the DOM
  or a UI framework. A task checks that `svelte` cannot be resolved, and `CLAUDE.md` says why
  the root package must not declare it.
- [CI downloads Chromium on every run, about a minute] → Accepted; caching it is not needed yet.
- [Two rows of `docs/roadmap.md` change their scope] → The last task group updates entries #1,
  #2 and #3.

## Migration Plan

There is nothing to migrate and nothing deployed. The change lands as one pull request; CI's
`build` job runs for the first time on it. Rolling back is reverting that pull request.

A machine outside web sessions needs, once: Node 24, `npm install -g pnpm@12.18.0`,
`pnpm install`, and `pnpm --filter app exec playwright install chromium`. `CLAUDE.md` and
`README.md` say so.

## Open Questions

- When to move to TypeScript 7: once `svelte-check` and `typescript-eslint` support it. It
  changes no spec.
- Whether CI should cache the dependencies and the browser: when its run time starts to matter.
