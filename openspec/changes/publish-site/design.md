# Design

## Context

See `proposal.md` for the motivation. Today:

- **The build.** SvelteKit's static adapter writes the site to `app/build`: 11 MB in 397 files,
  of which 7.5 MB are the data files (measured on 2026-11-15).
- **How pages are written.** With SvelteKit's defaults, a page is a file `<path>.html`
  (`votes/5670.html`), and its data for client-side navigation is in a directory of the same
  name (`votes/5670/__data.json`). Links and assets are addressed relative to the page
  (`./votes/6880`, `../../_app/...`).
- **The browser tests** (`app/e2e/`) run against `app/build`, served by `sirv` at the root of
  `http://localhost:4173`, and open pages by absolute paths (`/votes/5960`).
- **CI** (`.github/workflows/ci.yml`) runs three independent jobs, `specs`, `build` and
  `pipeline`, on pushes to `main` and on pull requests. Nothing is published.
- **The repository** `lukaspestalozzi/swiss-votation-visualisation` is public.

What was found while proposing (2026-11-15), in a spike on a copy of the project outside the
repository, and in GitHub's and SvelteKit's documentation:

- **Built for a path.** With the path set in SvelteKit's configuration and `trailingSlash`
  `'always'`, each vote is written as `votes/<id>/index.html` next to its `__data.json`, with
  no `votes/<id>.html`.
  - The links still read `./votes/6890`, without the slash: `resolve()` adds none.
  - Following a link, SvelteKit writes the address with the slash (`.../votes/6880/`).
- **Relative asset paths need the slash.** Opened at `votes/5670`, without the slash, on a
  server that does not redirect (sirv), the page's 12 files under `_app` were requested from
  the server's root and failed with 404. The page's scripts did not start, and its link back
  (`../../`) led to the server's root.
  - With `paths.relative: false`, the assets and links are absolute
    (`/swiss-votation-visualisation/_app/...`), and nothing failed at either address.
- **The browser tests under the path.** sirv served a build written into
  `build/swiss-votation-visualisation/` under that path, unchanged. The 12 browser tests, their
  paths made relative to the base URL, then gave 11 passes. The 12th expected `votes/5960` and
  saw `votes/5960/`, as above.
- **GitHub Pages** (docs.github.com, read 2026-11-15):
  - **Limits:**
    - a published site may be no larger than 1 GB;
    - a soft bandwidth limit of 100 GB per month;
    - a deployment that takes longer than 10 minutes times out;
    - the soft limit of 10 builds per hour does not apply to a custom Actions workflow.
  - **Use:** not "a free web-hosting service to run your online business".
  - **Visitors:** "the visitor's IP address is logged and stored for security purposes".
  - **Publishing from Actions:** the docs name `actions/upload-pages-artifact` and
    `actions/deploy-pages`, and the environment `github-pages`, which is created on first use.
    They name `.nojekyll` only for a build that an outside tool commits to a `gh-pages` branch.
  - **Previews:** the `preview` input of `actions/deploy-pages` deploys a pull request as a
    preview, but its README says the feature "is only in alpha currently and is not available
    to the public".
  - **Address and current releases:** a site of a project is served at
    `https://<owner>.github.io/<repository>/`. The current releases are
    `actions/upload-pages-artifact` v5 (2026-04-08) and `actions/deploy-pages` v5 (v5.0.1,
    2026-09-01).
- **Not verified:** whether GitHub Pages serves `/votes/5670` from `votes/5670.html` when a
  directory `votes/5670/` exists too. No source says so for GitHub Pages. A GitLab Pages issue
  describes GitHub Pages as rewriting `/about` to `/about/`, and guides for SvelteKit on GitHub
  Pages set `trailingSlash = 'always'`.

## Goals / Non-Goals

**Goals:**

- One build per CI run, tested and then published as it is.
- The browser tests exercise the site under the path it is published at, so that a link or an
  asset that ignores the path fails a test, not the published site.
- Every way the configuration can drift fails loudly: a build for another path fails the
  browser tests, a missing build directory fails the upload.

**Non-Goals:**

- Keeping the build portable to another path. It is built for exactly one path, the
  published one.
- A second environment (staging) or a release process; `main` is what is published.

## Decisions

Decisions 1 to 8 were asked while drafting (2026-11-15); each records the answer and the
alternatives. Decisions 9 to 12 follow from them and were not asked one by one.

### 1. GitHub Pages

The site is hosted on GitHub Pages. It is free for a public repository, needs no new account and
no secret (CI publishes with GitHub's own token), and SvelteKit documents the recipe. It hosts
what we have: 11 MB of 1 GB, and the data grows by about 60 kB per vote.

Alternatives considered:
- **Cloudflare Pages.** A root address and a preview per pull request built in. Rejected: a new
  account, an API token stored as a repository secret, and one more company that serves every
  visitor's requests.
- **Netlify.** As Cloudflare, and the free plan caps build minutes and bandwidth. Rejected for
  the same reasons.

### 2. The default address

The site is at `https://lukaspestalozzi.github.io/swiss-votation-visualisation/`. It costs
nothing and needs nothing set up, and it does not carry a product name, which is not decided.

Alternatives considered:
- **A custom domain at the root.** No path to build for. Rejected for now: a domain and a DNS
  record to keep, and an address that names a product whose name is not decided. It can follow
  as a change of its own (see Open Questions).

### 3. No previews of pull requests

A pull request is checked by the browser tests and published only after it is merged.

Alternatives considered:
- **The build as an artifact of each CI run.** Rejected: a zip to download and serve; it
  cannot be opened on a phone.
- **Previews on a `gh-pages` branch** (for example `rossjrw/pr-preview-action`, each pull
  request at `/pr-preview/pr-<n>/`). Rejected:
  - Pages would publish from a branch, not from CI.
  - A third-party action would get write access to the repository.
  - Each preview would be a build for its own path, not the tested one.
  - It can be reconsidered in #6 or #10, where looking before merging matters most.

### 4. The tested build is published, after every check of the run

The build job uploads the build its browser tests ran against. A fourth job, `deploy`, publishes
it on a push to `main`, after the jobs `specs`, `build` and `pipeline` have all passed.

Alternatives considered:
- **A workflow of its own that builds again and publishes** (SvelteKit's recipe). Rejected:
  - It publishes a second build, not the tested one.
  - It publishes even when a check of CI fails.
- **Publishing by hand** (`workflow_dispatch`). Rejected: `main` and the site drift apart until
  someone starts it.

### 5. Every page is written as `<path>/index.html`, with absolute paths

`trailingSlash = 'always'` and `paths.relative: false`. The spikes showed why both are needed:

- Every static host serves `votes/5670/index.html` for `/votes/5670/`.
- No page shares its name with a directory any more.
- With absolute paths, `/votes/5670` without the slash works too, on a server that redirects
  and on one that does not.

The address of a vote becomes `/votes/<id>/` (specs `verdicts` and `vote-list`).

Alternatives considered:
- **Keep `votes/5670.html` and see on the first deployment.** Rejected: if GitHub Pages prefers
  the directory, every vote page opened directly (a bookmark, a shared link) is a 404 until a
  fix is merged.
- **`trailingSlash = 'always'` with relative paths.** Rejected by the spike: without the slash,
  the page's scripts and styles fail on a server that does not redirect. It would work on GitHub
  Pages only if GitHub Pages redirects, which is not verified.

### 6. GitHub's own "not found" page

An address that names no page is answered by the server: on GitHub Pages, its generic "not
found" page, in English and without a link back. Votes are never removed (the pipeline refuses
to lose one, change #3), so only a mistyped address reaches it.

Alternatives considered:
- **A German 404 page of our own** (SvelteKit's fallback page and an error page with its text in
  `texts.ts`). Rejected: more code, more tests, and one more page for #9 to translate, for a case
  that only a typo reaches.

### 7. No check of the published site by CI

After a deployment, CI does not fetch the published site. The first deployment is checked by
hand (Migration Plan). Q chose this over the recommended check.

Alternatives considered:
- **CI fetches the start page and `/votes/5960/` and `/votes/5960` after each deployment, and
  fails unless each shows its title** (recommended). Not chosen: the host's behaviour that the
  spike could not reproduce, decision 5, is checked by hand once instead of by every run.

### 8. GitHub Pages is switched on by hand

Q switches on Pages once, before the first deployment: Settings → Pages → Build and deployment →
Source: "GitHub Actions". CI's own token cannot do this.

Alternatives considered:
- **`actions/configure-pages` with `enablement: true`.** Rejected: it needs a personal access
  token with administration rights stored as a secret, a powerful secret for a one-time switch.

### 9. The path is set once in the app's configuration, and the build directory mirrors it

`app/vite.config.ts` holds the path `/swiss-votation-visualisation` as one constant. It uses the
constant for SvelteKit's `paths.base` and for the adapter's output directory,
`build/swiss-votation-visualisation`. So the build directory has the shape of the address:

- `sirv build` serves the site under the path, as before but one level down.
- CI uploads `app/build/swiss-votation-visualisation`.
- The development server serves under the path too
  (`http://localhost:5173/swiss-votation-visualisation/`).

Alternatives considered:
- **The path from the environment** (`BASE_PATH`, from `actions/configure-pages`, as
  SvelteKit's recipe does). Rejected: a local build would differ from CI's unless every command
  sets the variable, and the path only changes with the address.
- **The build at `app/build`, served through a symlink in a directory of its own.** It works
  (spike), but it adds a directory for git, the linter and the formatter to skip.
- **`vite preview`**, which serves under the path. Rejected: it is SvelteKit's server, not the
  plain files a static host serves (decision of #1).

### 10. The browser tests open the site under its path

`app/playwright.config.ts` sets the base URL to
`http://localhost:4173/swiss-votation-visualisation/`:

- The tests open pages by paths relative to it (`votes/5960/`, `./`), since an absolute path
  (`/votes/5960`) would leave the site's path.
- A test that checks the path of a request computes it from Playwright's `baseURL` fixture, so
  the path is written once in the tests' configuration.

A build for another path fails the tests: the start page is not found.

Alternatives considered:
- **Tests at the root, the published build under the path.** Rejected: two different builds,
  and a link that ignores the path would pass the tests.

### 11. The workflow

In `.github/workflows/ci.yml`:

- **The build job**, after the browser tests, uploads `app/build/swiss-votation-visualisation`
  with `actions/upload-pages-artifact`. It does so on pull requests too, so that the step is
  exercised before a merge. The artifact is kept for one day, the action's default.
- **The new job `deploy`:**
  - `needs: [specs, build, pipeline]`, and it runs only for a push to `main`. On a pull
    request it shows as skipped.
  - Permissions `pages: write` and `id-token: write`, for this job only.
  - The environment `github-pages`, with the address as its URL.
  - `concurrency: pages` without cancelling a running deployment, so that two quick merges
    publish one after the other.
  - One step: `actions/deploy-pages`.

The deploy job does not check out or build anything (spec `publishing`: one build per run).

Alternatives considered:
- **Uploading only on pushes to `main`.** Rejected: the upload would first run after a merge,
  where a failure turns `main` red.

### 12. No `.nojekyll`

GitHub's documentation names `.nojekyll` only for a build that an outside tool commits to a
`gh-pages` branch. An artifact that `actions/deploy-pages` publishes is not run through Jekyll,
and the `_app` directory, which Jekyll would drop for its underscore, is published as it is.
This is a belief, checked by the first deployment: a page whose verdicts stand side by side has
its styles from `_app`.

Alternatives considered:
- **An empty `app/static/.nojekyll` anyway**, as SvelteKit's recipe adds. Rejected: a file for a
  case this setup does not have. If the first deployment shows otherwise, it is a one-line fix.

### Tests

- **Browser tests:** the existing 12 run under the path (decision 10), and the spec scenarios
  that change get their tests:
  - "There and back" expects `votes/5960/`.
  - "The page of a vote" opens `votes/5960/`.
  - A new test opens `votes/5960`, without the slash, and finds the heading and no failed
    request.
  - A new test asks for `votes/9999/` and gets the status 404.
- **The scenarios of `publishing` about CI** are checked on the pull request's CI run and on the
  first run on `main`:
  - the deploy job skipped on the pull request, and the artifact uploaded;
  - after the merge, the deploy job publishing.

  A failing push to `main` and Pages switched off are not provoked: that a failed job fails the
  run and skips the jobs that need it is how GitHub Actions works, not code of this change.

### Dependencies added

- `actions/upload-pages-artifact@v5` and `actions/deploy-pages@v5`: the two steps GitHub's
  documentation names for publishing from a workflow. They are pinned by major version, like
  `actions/checkout` and `actions/setup-node`.
- No npm or Python package. Nothing the site loads changes: the published files are the tested
  ones, and the browser tests check that no page requests anything from another server.

### Performance budget

No computation triggered by user interaction is added. A publishing must finish within GitHub's
10 minutes. Uploading and deploying 11 MB is expected to take well under that; the first runs
show the actual time.

## Risks / Trade-offs

- **[GitHub logs the IP address of every visitor for security]** → The site itself sets no
  cookie and loads nothing from another server, so hard constraint 4 (no tracking of users)
  holds for the app. The host's own logs are named in the design, and in `README.md` where the
  address is.
- **[The path is part of the build]** → Moving to a custom domain or renaming the repository
  changes the address. That is one constant in `app/vite.config.ts`, the base URL of the browser
  tests and the upload path in `ci.yml`; a mismatch fails the tests or the upload.
- **[GitHub Pages' handling of `/votes/5670` is not verified before the first deployment]**
  (decision 7) → Decision 5 makes both forms work under sirv. The first deployment is checked by
  hand at both addresses.
- **[A change that passes every test but looks wrong goes live]** → Every merge is published.
  Revert the commit on `main`, and CI publishes the state before it.
- **[GitHub's limits]** → 11 MB of 1 GB. The bandwidth limit of 100 GB a month is about 590,000
  visits of the start page: it loads 170 kB in 14 requests, a vote's page 108 kB, both measured
  uncompressed in the spike. That is far beyond what this site expects, and the limit is soft.
- **[The development server moves under the path]** → `http://localhost:5173/` redirects to
  `http://localhost:5173/swiss-votation-visualisation` (302, seen while applying task 5.2), so
  the old address still leads there. `CLAUDE.md` and `README.md` name the new address.

## Migration Plan

1. Before the pull request is merged, Q switches on GitHub Pages: Settings → Pages → Build and
   deployment → Source: "GitHub Actions". The pull request's CI run shows the job `deploy` as
   skipped and the build job's artifact `github-pages`.
2. Merge by rebasing. The push to `main` runs CI, and the job `deploy` publishes. The run's
   summary links the address.
3. Check by hand, on a computer and on a phone:
   - the address shows the start page;
   - `/votes/5960/` and `/votes/5960` show the vote's page, with the two verdicts side by side;
   - `/votes/9999/` shows GitHub's "not found" page.
4. Rollback: revert the commit on `main`, and CI publishes the state before it. To take the site
   down: Settings → Pages → "Unpublish site", or switch the source off.

## Open Questions

- **A custom domain**, once the product's name is decided: a change of its own. It sets the path
  to the root, drops the path from the tests' base URL and the upload, and adds a DNS record.
  Nothing in this change depends on it.
- **Previews of pull requests**, to be asked again when #6 or #10 is proposed.
