# Design

## Context

The job `build` of `.github/workflows/ci.yml` builds the site once, runs the browser tests
against it and uploads it with `actions/upload-pages-artifact@v5` as `github-pages`, on pushes to
`main` and on pull requests alike; only the job `deploy` is limited to pushes to `main`
(spec `publishing`). The build is `app/build/swiss-votation-visualisation/`, 59 MB, about 21 MB
zipped. Its addresses are absolute, under `/swiss-votation-visualisation/` (`app/vite.config.ts`).
Measured on 2026-11-27: `python3 -m http.server` run in `app/build/` serves every page, the data
files as `application/json`, and redirects `/de/votes/5960` to `/de/votes/5960/`; a vote's page
served so draws its map, takes a limit and shows "Mit Ihrer Auswahl" without a failed request.

## Goals / Non-Goals

**Goals:**

- A pull request's tested site, downloadable from its CI run, that runs on Q's computer with
  nothing to install where Python 3 is there (as on macOS), in two commands.

**Non-Goals:**

- A preview at an address (Q chose the artifact over a second repository, a preview host or
  subfolders of the one Pages site).
- A site that opens from `file://`: it would need relative addresses and data that needs no
  request, a change of the app.
- Artifacts for pushes to branches without a pull request (Q: when its pull request is opened).

## Decisions

1. **A second artifact, not a changed `github-pages`.** `deploy` needs `github-pages` in the
   form `actions/deploy-pages` reads; it stays as it is, and its upload keeps running on pull
   requests, so that the step is exercised before a merge. The new one is uploaded with
   `actions/upload-artifact@v7`, pinned by major version as the other actions are.
2. **Its root is `app/build/`**, which holds the folder `swiss-votation-visualisation/`, so that
   the unpacked artifact keeps the path the site's addresses name. Rejected: the folder's
   contents at the root, as `github-pages` has them, which a server must then be told to serve
   under that path.
3. **`README.txt` beside the folder**, written by a step before the upload into `app/build/`,
   after the browser tests: the pull request's number, the commit, the two commands
   (`python3 -m http.server 8000`, then open
   `http://localhost:8000/swiss-votation-visualisation/`) and why a double click does not work.
   It is not part of the site, which is `swiss-votation-visualisation/` alone.
4. **Named `site-pr-<number>`, kept 14 days.** The number finds it; each run has its own. A pull
   request's runs follow each other within days; 14 days at about 21 MB a run. Rejected: one day,
   as `github-pages` is kept, too short for a look after a weekend; the repository's default of
   90 days.
5. **Only when every browser test passed, only on pull requests:** the steps follow the browser
   tests in the job, so a failure skips them, and run `if: github.event_name == 'pull_request'`.

## Risks / Trade-offs

- [A workflow cannot be run locally.] → The change's own pull request is its test: its run must
  show the artifact, which is downloaded, unpacked and served as `README.txt` says, and a vote's
  page checked in a browser.
- [Storage: about 21 MB a run.] → Kept 14 days; GitHub deletes it after.
- [Someone opens `index.html` by a double click and sees a blank page.] → `README.txt` says why,
  first.
