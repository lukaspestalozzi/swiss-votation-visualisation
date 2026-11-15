# Tasks

All commands run from the repository root, on a branch started from an updated `main`. Before
this change:

- `pnpm run test` reports 41 passed in the calculation and 37 in the app;
- `uv run --directory pipeline --locked pytest` reports 81;
- the browser tests are 12;
- `./scripts/verify-local.sh` reports 11 of 11 steps.

Each test is written first and seen to fail before the code that makes it pass, one at a time.
A test that passes when written is seen to fail against a mutant, and the task says so in a
note "As built". The numbers of tests are the plan. Where a count differs while building, the
note says so too.

"Temporary" edits in a verification step are removed before the task is ticked;
`git status --short` then shows nothing of them.

## 1. The site under its path

In `app/playwright.config.ts`, `app/e2e/*.spec.ts` and `app/vite.config.ts` (spec `app-shell`,
"The site is a set of static files"; design, decisions 9 and 10).

- [x] 1.1 Make the browser tests open the site under its path:
  - The base URL in `app/playwright.config.ts` becomes
    `http://localhost:4173/swiss-votation-visualisation/`.
  - Every `page.goto`, `request.get` and `toHaveURL` takes a path relative to it: `./`,
    `votes/5960`, `data/votes.json`.
  - The three checks of a request's path compute it from the `baseURL` fixture:
    `new URL('votes/5960', baseURL).pathname`, and the same for `data/votes/` and
    `__data.json`.

  Verify: `pnpm run build && pnpm run test:e2e` against the build of today, at the root, gives
  10 failed and 2 passed. The two that pass, "all requests go to the site itself" and "the
  vote's entries stay out of the browser", look only at requests, which a page that is not found
  also makes. Every other test fails because nothing is found under the path.
- [x] 1.2 In `app/vite.config.ts`, one constant holds the path `/swiss-votation-visualisation`.
  SvelteKit's `paths.base` is set to it, and the adapter's `pages` and `assets` to `build` plus
  the path. Verify:
  - `rm -rf app/build && pnpm run build` writes `app/build/swiss-votation-visualisation/index.html`,
    and `ls app/build` shows only `swiss-votation-visualisation`;
  - `pnpm run test:e2e` gives 12 passed;
  - `pnpm run check` and `pnpm run lint` pass.

## 2. A vote's page at `/votes/<id>/`

In `app/e2e/*.spec.ts`, `app/src/routes/+layout.ts` and `app/vite.config.ts` (specs `verdicts`,
"A page for every vote", and `vote-list`, "From the list to a vote"; design, decision 5).

- [x] 2.1 Make the browser tests open a vote's page at its address with the slash, `votes/5960/`
  (likewise for 6790, 6823 and 6650), and make "from the list to a vote and back" expect
  `votes/5960/`. Verify: `pnpm run test:e2e` gives 6 failed and 6 passed.
  - Five tests of `vote-page.spec.ts` fail, because sirv finds no `votes/5960/index.html`.
  - "From the list to a vote and back" fails: it sees `votes/5960`.
  - "The vote's entries stay out of the browser" passes, as in 1.1: it looks only at requests.

  (As built: 3 failed and 9 passed. sirv answers `votes/5960/` with `votes/5960.html` too, so the
  tests that read the prerendered page pass. At that address the page's relative paths
  `../_app/...` point into `votes/_app/`, which is 404. So the page has no styles and no scripts,
  and three tests catch it:
  - the greyed figure of 6790 is black;
  - "from the list to a vote and back" sees `votes/5960`;
  - the link back, still the prerendered `../`, leads to `votes/`.)
- [x] 2.2 `export const trailingSlash = 'always';` in `app/src/routes/+layout.ts`, with a comment
  that says why: no page shares its name with a directory. Verify:
  - `pnpm run build && pnpm run test:e2e` gives 12 passed;
  - `find app/build/swiss-votation-visualisation/votes -name index.html | wc -l` prints 125;
  - `find app/build/swiss-votation-visualisation/votes -name '*.html' ! -name index.html` prints
    nothing.
- [x] 2.3 Write the browser test "a vote's page without the final slash" in
  `app/e2e/vote-page.spec.ts`. It opens `votes/5960`, waits until the page has stopped loading,
  and expects the heading of 5960 and no response with a status of 400 or more and no failed
  request, naming any it finds. Verify: `pnpm run test:e2e` gives 1 failed, naming the files
  under `_app` that fail with 404, and 12 passed.
- [x] 2.4 `paths.relative: false` in `app/vite.config.ts`, with a comment that says why: a page
  opened without its final slash finds its scripts. Verify: `pnpm run build && pnpm run
  test:e2e` gives 13 passed.

## 3. An address that names no page

In `app/e2e/vote-page.spec.ts` (spec `publishing`, "An address that names no page").

- [x] 3.1 Write the browser test "an address that names no page": a browser opening
  `votes/9999/` gets the status 404. It passes when written, so it must be seen to fail against
  a mutant. Verify:
  - `pnpm run test:e2e` gives 14 passed;
  - with the web server of `app/playwright.config.ts` temporarily started as `sirv build --single
    --port 4173`, which answers every address with a page, the test fails and shows the status
    200;
  - after the mutant is undone, 14 passed again.

  (As built: `sirv build --single` alone was no mutant. It falls back to the `index.html` at the
  root of `build`, and since 1.2 there is none, so it still answered 404, and the test passed.
  Given the fallback file, `sirv build --single swiss-votation-visualisation/index.html --port
  4173` answers every unknown address with the start page. With it the test failed: expected
  404, received 200. Undone, 14 passed.)

## 4. Publishing from CI

In `.github/workflows/ci.yml` (spec `publishing`; design, decisions 4, 8 and 11). The CI run of
the pull request checks these tasks (task 6.3); before that, nothing in them runs.

- [x] 4.1 In the job `build`, after the step "Browser tests", add a step that uploads
  `app/build/swiss-votation-visualisation` with `actions/upload-pages-artifact@v5`. Its comment
  says that this is the build the browser tests checked, and that it runs on pull requests too,
  so the step is exercised before a merge. Verify, before the push:
  `python3 -c "import yaml; s = yaml.safe_load(open('.github/workflows/ci.yml'))['jobs']['build']['steps']; print([x['name'] for x in s][-2:])"`
  prints the step "Browser tests" followed by the new step. After the push, in the pull request's
  CI run (task 6.3), the job `build` passes and lists the artifact `github-pages`.
  (As built: the YAML check printed `['Browser tests', 'Upload the tested site']`. On `019732f`
  the job `build` passed and uploaded `github-pages`, 3,299,937 bytes compressed.)
- [x] 4.2 Add the job `deploy`:
  - `needs: [specs, build, pipeline]`;
  - `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`;
  - `permissions: { pages: write, id-token: write }`;
  - `environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`;
  - `concurrency: { group: pages, cancel-in-progress: false }`;
  - one step, `actions/deploy-pages@v5` with `id: deployment`;
  - a comment that says it publishes the build of the job `build`, and only from `main`.

  Verify, before the push:
  `python3 -c "import yaml; j = yaml.safe_load(open('.github/workflows/ci.yml'))['jobs']; print(list(j), j['deploy']['needs'], j['deploy']['if'])"`
  prints the four jobs, the three it needs and its condition. After the push, in the pull
  request's CI run (task 6.3), the job `deploy` is shown as skipped and the three others pass.
  (As built: the YAML check printed the four jobs, the three needed and the condition. On
  `019732f`, `deploy` was skipped and `specs`, `build` and `pipeline` passed.)
- [x] 4.4 Added after Copilot's review of the pull request (design, decision 13; spec
  `publishing`, "An older push never replaces a newer site"):
  - a workflow-level `concurrency` in `ci.yml`, with the group `ci-${{ github.ref }}` and
    `cancel-in-progress: false`, and a comment that says why;
  - the job `deploy` loses its own `concurrency`.

  Verify, before the push: `python3 -c "import yaml; w = yaml.safe_load(open('.github/workflows/ci.yml')); print(w['concurrency'], w['jobs']['deploy'].get('concurrency'))"`
  prints the group, `cancel-in-progress` false, and `None`. After the push, in the pull request's
  CI run, `specs`, `build` and `pipeline` pass and `deploy` is skipped.
  (As built: the YAML check printed `{'group': 'ci-${{ github.ref }}', 'cancel-in-progress':
  False} None`. On `b74215e`, `specs`, `build` and `pipeline` passed and `deploy` was skipped.)
- [x] 4.3 Q switches on GitHub Pages: Settings → Pages → Build and deployment → Source: "GitHub
  Actions". Verify: Q confirms that the page shows the source "GitHub Actions", before the pull
  request is merged.
  (As built: Q confirmed on 2026-11-15 that Pages is switched on.)

## 5. The project context and the documents

- [x] 5.1 Update `openspec/config.yaml`:
  - Under the decided stack: the site is published on GitHub Pages at
    `https://lukaspestalozzi.github.io/swiss-votation-visualisation/`, from CI, after every check
    of a push to `main`; the design of the archived change publish-site gives the reasons and the
    alternatives.
  - "The hosting target" leaves the list of what is not decided.

  Verify: `openspec validate --all --strict --no-interactive` passes; `grep -n "hosting"
  openspec/config.yaml` shows only the decided line.
  (As built: the validation passes. `grep -n "hosting"` also shows two older lines of the stack
  paragraph ("static hosting", "hosting cost"), and the new line says "GitHub Pages", not
  "hosting". The check that holds is `grep -n "hosting target"`, which prints nothing, and
  `grep -n "GitHub Pages"`, which prints the new line.)
- [x] 5.2 Update `README.md`:
  - the address of the site, published from `main` after every check passes;
  - that GitHub, the host, logs the IP addresses of visitors for security (design, Risks);
  - that the development server is at `http://localhost:5173/swiss-votation-visualisation/`.

  Verify: the address in `README.md` is the one in the spec `publishing`.
  (As built: the addresses match. The README's `/votes/<id>` and "written to app/build" are
  updated too, since this change made them stale. `pnpm run dev` serves the path with 200, and
  redirects `http://localhost:5173/` to it (302), not "not found" as the design's Risks said;
  the design is corrected.)
- [x] 5.3 Update `CLAUDE.md`:
  - **The status:** #5 done once archived. **Next:** #6.
  - **The code map of `app`:**
    - `vite.config.ts`: the path, the output directory, absolute paths;
    - `+layout.ts`: every page as `<path>/index.html`;
    - `playwright.config.ts`: the tests run under the path;
    - the two browser test files: the slash and the 404;
    - "Generated": `app/build/swiss-votation-visualisation/`.
  - **"Where things are":** `ci.yml` with the job `deploy`.
  - **"Build and verify":**
    - `pnpm run dev` and its address;
    - where `pnpm run build` writes;
    - the CI paragraph with the job `deploy`, which runs only on pushes to `main`;
    - the two Pages actions pinned by major version like the others.

  Verify: every file this change adds or changes under `app/` and `.github/` is named with its
  current role (`git diff --name-status origin/main` against `CLAUDE.md`); `grep -n "app/build"
  CLAUDE.md` shows only the new path.
  (As built: the six files are named with their current role. `grep -n "app/build"` shows the
  nested path three times, and twice "against `app/build`, under the site's path": the
  directory sirv serves, with the site under the path in it, which is accurate. The status
  gains the published address now. The list of archived changes ("#1 to #4") and "Next" move to
  #5 and #6 when the change is archived, as the list of specs did in #4.)

## 6. Integration

- [x] 6.1 Run `./scripts/verify-local.sh`. Verify: `All 11 steps passed`, with 41 unit tests in
  the calculation, 37 in the app, 14 browser tests and 81 in the pipeline.
  (As built: passed, with exactly these counts.)
- [x] 6.2 Map each scenario of the four delta specs to the test or check that covers it, in the
  pull request's description. The scenarios of `publishing` about CI are covered by the CI runs
  of the pull request and of `main` (design, Tests). Verify: the list has no scenario without a
  test or check.
  (As built: the map is in the description of PR #8. Every scenario has a test or check; two
  of `publishing` are covered by how GitHub Actions treats `needs` and failed steps, not
  provoked, as the design's Tests say.)
- [x] 6.3 Push the branch and open the pull request. Verify: the CI run shows `specs`, `build`
  and `pipeline` passed, `deploy` skipped, and the artifact `github-pages` in the run's
  artifacts.
  (As built: the branch was pushed to the open PR #8. On `019732f`, `specs`, `build` and
  `pipeline` passed, `deploy` was skipped, and the artifact `github-pages` was uploaded.)

## Workflow follow-up

- Verify the change with the verify workflow, then archive it and set the status of #5 in
  `docs/roadmap.md`.
- Before the merge: task 4.3, GitHub Pages switched on.
- After the merge (design, Migration Plan):
  - The CI run of the push to `main` shows `deploy` passed and links the address.
  - Check by hand, on a computer and on a phone:
    - the address shows the start page;
    - `/votes/5960/` and `/votes/5960` show the vote's page with the two verdicts side by side;
    - `/votes/9999/` shows GitHub's "not found" page.
