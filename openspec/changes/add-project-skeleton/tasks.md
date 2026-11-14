# Tasks

All commands run from the repository root with Node 24 and pnpm 12.18.0 on the `PATH`. In a web
session started before this change is merged, Node 22 is the default and the shell keeps no
state between commands: run `npm install -g pnpm@12.18.0` once with `/opt/node24/bin` first on
the `PATH`, and start every command with `export PATH=/opt/node24/bin:$PATH &&`.

"Temporary" files and edits in a verification step are removed before the task is ticked;
`git status --short` then shows nothing of them.

## 1. Workspace and root tools

- [x] 1.1 Create the root `package.json` (name `popular-vote-explorer`, private, `type: module`,
  `packageManager: pnpm@12.18.0`, `engines.node: >=24`), `pnpm-workspace.yaml` (packages
  `calculation` and `app`, `engineStrict: true`) and `.gitignore` (`node_modules`, `app/build`,
  `app/.svelte-kit`, `app/test-results`). Verify: `pnpm install` exits 0 and writes
  `pnpm-lock.yaml`; `PATH=/opt/node22/bin:$PATH pnpm install --frozen-lockfile` exits 1 with
  `Unsupported engine` and `wanted: {"node":">=24"}`.
- [x] 1.2 Add Prettier with the Svelte plugin to the root (design, decision 7):
  `prettier.config.js`, `.prettierignore`, the scripts `format` and `format:check`. Verify:
  `pnpm run format` then `pnpm run format:check` prints `All matched files use Prettier code
  style!`, and `git status --short` lists no file under `openspec/`, `docs/`, `.agents/`,
  `.claude/`, `.github/` and no `.md` file as modified.
- [x] 1.3 Add ESLint with `typescript-eslint`, the Svelte plugin, `eslint-config-prettier` and
  `globals` to the root: `eslint.config.js` and the script `lint` as `eslint --max-warnings 0 .`.
  Verify: `pnpm run lint` exits 0; with a temporary `w.js` holding `console.log('x');`,
  `pnpm exec eslint --max-warnings 0 --rule '{"no-console":"warn"}' w.js` exits 1 with `ESLint
  found too many warnings (maximum: 0)`; `grep -c minimumReleaseAgeExclude pnpm-workspace.yaml`
  prints `0` (if not, pin the previous version of the package pnpm named and install again).

## 2. Calculation module

- [x] 2.1 Create `calculation/package.json` (no `dependencies`; `typescript` and `vitest` as
  `devDependencies`; `exports` pointing at `./src/index.ts`; scripts `check` as `tsc --noEmit -p
  tsconfig.json` and `test` as `vitest run`), `calculation/tsconfig.json` (design, decisions 4
  and 6) and the root scripts `check` (`pnpm -r run check`) and `test` (`pnpm -r run test`).
  Write the test "the 26 cantons in the order of the constitution" in
  `calculation/src/cantons.test.ts`, then the list of cantons in `cantons.ts`, exported through
  `index.ts`. Verify: `pnpm run test` reports `1 passed`; `pnpm run check` exits 0.
- [x] 2.2 Write the test "six cantons have half a vote" (OW, NW, BS, BL, AR, AI are exactly 0.5),
  see it fail, then add the cantonal votes to the cantons. Verify: `pnpm run test` reports `2
  passed`.
- [x] 2.3 Write the tests "every other canton has one vote" (the other 20 are exactly 1) and
  "Schaffhausen and Appenzell Ausserrhoden are not swapped" (SH 1, AR 0.5), one after the other.
  Verify: `pnpm run test` reports `4 passed`.
- [x] 2.4 Write the test "all cantons together have 23 cantonal votes" (exactly 23), see it fail,
  then add the total of a list of cantons. Verify: `pnpm run test` reports `5 passed`.
- [x] 2.5 Run the root tools over the package. Verify: `pnpm run format:check`, `pnpm run lint`
  and `pnpm run check` each exit 0; with a temporary `calculation/src/violation.ts` that calls
  an `async` function without awaiting it, `pnpm run lint` exits 1 and reports
  `@typescript-eslint/no-floating-promises` for that file.

## 3. App module

- [x] 3.1 Scaffold the app with the command of design decision 13 and reduce it to the files of
  decision 3: remove what decision 13 lists, declare `calculation` (`workspace:*`) as its
  dependency, set `prepare` to `svelte-kit sync` and
  `check` to `svelte-check --tsconfig ./tsconfig.json`, set `rootDir` to `.` in
  `app/tsconfig.json`, add `src/routes/+layout.ts` with `prerender = true`, and set the root
  scripts `build`, `dev` and `test:e2e` to the app's. Verify: `pnpm install` exits 0 and
  `app/.svelte-kit/` exists; `pnpm run check` ends with `0 ERRORS 0 WARNINGS`;
  `ls node_modules | grep -cx svelte` prints `0`.
- [x] 3.2 Write the start page: the heading "Popular Vote Explorer" and the table of the cantons
  with the total, all read from `calculation`; `lang="en"` in `app.html`. Verify: `pnpm run
  build` exits 0 and writes `app/build/index.html`; `grep -o '<td>[A-Z][A-Z]</td>'
  app/build/index.html | wc -l` prints `26`; `grep -c 'Popular Vote Explorer'
  app/build/index.html` prints at least `1`.
- [x] 3.3 Add `@playwright/test` (exactly `1.63.0`) and `sirv-cli` to the app,
  `app/playwright.config.ts` (the tests in `app/e2e/`, the web server `sirv build` on port
  4173) and the script `test:e2e`. Write the first browser test: the heading is shown, the
  table has 26 rows of cantons, the first is `ZH` and the last `JU`. Verify: after `pnpm run
  build`, `pnpm run test:e2e` reports `1 passed`.
- [x] 3.4 Write the browser tests "the six cantons with half a vote" (those six rows show `0.5`,
  the other 20 show `1`) and "the total" (`23`), one after the other. Verify: `pnpm run
  test:e2e` reports `3 passed`.
- [x] 3.5 Write the browser test "all requests go to the site itself": it records the origin of
  every request until the network is idle and expects only the page's own. Verify: `pnpm run
  test:e2e` reports `4 passed`; with a temporary `<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter">` in `app/src/app.html` and a new build,
  it reports `1 failed` and the output names `https://fonts.googleapis.com`; after removing the
  link and building again, `4 passed`.
- [x] 3.6 Run the root tools over the app. Verify: `pnpm run format:check`, `pnpm run lint` and
  `pnpm run check` each exit 0; with a temporary unawaited call of an `async` function in the
  script of `+page.svelte`, `pnpm run lint` exits 1 and reports
  `@typescript-eslint/no-floating-promises` for `+page.svelte`.

## 4. Module boundaries

Each task adds one temporary file, runs the check and removes the file.

- [ ] 4.1 Write `pipeline/README.md`: what the pipeline is, that the calculation and the app never
  import it, and that #3 decides its language and tools. Verify: `pnpm run format:check` and
  `pnpm run lint` still exit 0.
- [ ] 4.2 The calculation imports the app by a relative path (`import
  '../../app/src/routes/+layout.ts';` in `calculation/src/violation.ts`). Verify: `pnpm run
  check` exits with a status other than 0 and prints `error TS6059` for `violation.ts`.
- [ ] 4.3 The calculation imports the app by its name (`import 'app';`). Verify: `pnpm run check`
  fails and prints `error TS2882` for `violation.ts`.
- [ ] 4.4 The calculation imports the pipeline (a temporary `pipeline/x.ts`, imported by a
  relative path). Verify: `pnpm run check` fails and prints `error TS6059` for `violation.ts`.
- [ ] 4.5 The calculation imports the UI framework (`import { mount } from 'svelte';`). Verify:
  `pnpm run check` fails and prints `error TS2307` for `violation.ts`.
- [ ] 4.6 The calculation uses the DOM (`export const title = document.title;`). Verify: `pnpm
  run check` fails and prints `error TS2584` for `violation.ts`.
- [ ] 4.7 The app imports the pipeline (a temporary `pipeline/x.ts`, imported by a relative path
  from a temporary `app/src/violation.ts`). Verify: `pnpm run check` fails and prints `is not
  under 'rootDir'` for `violation.ts`; without the temporary files, `pnpm run check` exits 0
  with the app importing `calculation`.

## 5. Checks locally, in CI and in web sessions

- [ ] 5.1 Extend `scripts/verify-local.sh`: the six steps `pnpm run format:check`, `lint`,
  `check`, `test`, `build`, `test:e2e` after the OpenSpec validation, the header (steps,
  requirements: Node, pnpm, the installed dependencies, the browser), and `--quick` as `pnpm run
  test`. Verify: `./scripts/verify-local.sh` ends with `All 7 steps passed` and status 0;
  `./scripts/verify-local.sh --quick` runs one step, `pnpm run test`, and exits 0.
- [ ] 5.2 Update `.github/workflows/ci.yml`: Node 24 in the `specs` job, and the `build` job of
  design decision 11. It comes before 5.3, whose check reads the Node version from this file.
  Verify: the `run:` commands of the `build` job contain the six `pnpm run` steps in the order
  of `scripts/verify-local.sh` (compare both lists); `grep -c "node-version: '24'"
  .github/workflows/ci.yml` prints `2`; after the push, the `specs` and the `build` job of the
  pull request are green.
- [ ] 5.3 Make the script refuse a major version of Node other than the `node-version` of
  `.github/workflows/ci.yml`, the way it refuses another OpenSpec version. Verify:
  `PATH=/opt/node22/bin:$PATH ./scripts/verify-local.sh` runs no step, prints the installed and
  the expected version, and exits 1; with Node 24, `./scripts/verify-local.sh --quick` exits 0.
- [ ] 5.4 Check the behaviour on a failure. Verify: with one expected value in
  `calculation/src/cantons.test.ts` temporarily changed, `./scripts/verify-local.sh` still runs
  the build and the browser test, prints `[FAIL] pnpm run test` and `1 of 7 steps failed`, and
  exits 1; after restoring the value, `All 7 steps passed`.
- [ ] 5.5 Update `.claude/hooks/session-start.sh` (design, decision 12). Verify: with `f=$(mktemp)`,
  `CLAUDE_CODE_REMOTE=true CLAUDE_ENV_FILE=$f PATH=/opt/node22/bin:$PATH
  ./.claude/hooks/session-start.sh` exits 0 and prints nothing; `bash -c "source $f && node
  --version && pnpm --version && openspec --version"` prints `v24.`…, `12.18.0` and `2.0.0`; a
  second run leaves `$f` with the same number of lines.

## 6. Documentation

- [ ] 6.1 Add to `README.md` what the app is today and how to run it: the requirements, `pnpm
  install`, `pnpm run dev`, `pnpm run build`, `./scripts/verify-local.sh`. Verify: each command
  of the new section, run as written, exits 0 (`pnpm run dev` starts and answers on its printed
  address).
- [ ] 6.2 Update `docs/roadmap.md`: entry #1 (the three capabilities, the decisions taken, no open
  decision left), entry #2 (the cantons and their half votes are specified; #2 extends that
  requirement), entry #3 (the pipeline's toolchain is its open decision). Verify: `openspec
  validate --all --strict --no-interactive` exits 0, and the capabilities named in entry #1 are
  the directories under `openspec/changes/add-project-skeleton/specs/`.
- [ ] 6.3 Update `CLAUDE.md`: the status, the "Where things are" table (the root configuration
  files, `calculation/`, `app/`, `pipeline/`), the code map (one table per module: file or
  package, and what), "Build and verify" (the commands, Node 24 and pnpm, the browser for the
  browser test, why the root package must not declare `svelte`, the `build` job), and the pinned
  versions that must stay equal (OpenSpec; Playwright and the cloud image's browser). Verify:
  every path named in the two tables exists (`ls` each), and `./scripts/verify-local.sh` ends
  with `All 7 steps passed`.

## Workflow follow-up

- Verify the change with `/openspec-verify-change` before archiving.
- Archive it with `/openspec-archive-change`, and set the status of entry #1 in
  `docs/roadmap.md`.
- The first web session after the merge confirms the hook: `node --version` prints `v24.`… and
  `./scripts/verify-local.sh` passes without any manual step.
