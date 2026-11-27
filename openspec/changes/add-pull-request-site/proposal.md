# Proposal

## Why

To look at a change on the site, Q has had to merge it to `main`, which publishes it. GitHub
gives a repository one Pages site, so a second, preview site of this repository is not possible,
and GitHub's own preview deployments are "not available to the public" (README of
`actions/deploy-pages`, 2026-11-27). Q (2026-11-27): each pull request's build shall be kept as
an artifact that can be downloaded and looked at offline.

CI already uploads the tested site from every pull request run, as the artifact `github-pages`.
That artifact is made for publishing, not for looking at: a `.tar` inside a `.zip`, kept for one
day, holding the site's files without the folder `swiss-votation-visualisation/` that their
addresses name, so that a browser finds none of its scripts or data when it is unpacked and
served.

## What Changes

- Each CI run of a pull request to `main`, once all its browser tests pass, keeps the build they
  were run against as a second artifact, `site-pr-<number>`, for 14 days: a `.zip` holding the
  folder `swiss-votation-visualisation/` and a file `README.txt` that says how to look at it
  (Python's built-in web server in the unpacked folder, and the address to open) and which
  commit it is.
- The site still cannot be opened by a double click on a file: its addresses are absolute, and a
  browser refuses its data requests from `file://`. The README says so.
- Nothing changes on `main`: it publishes as before, and keeps no such artifact. A pull request
  still publishes nothing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `publishing`: "Nothing is published unless every check passed" keeps that a pull request
  publishes nothing, without "and gets no preview"; a new requirement, "The site of a pull
  request", says what a pull request's run keeps.

## Impact

- `.github/workflows/ci.yml`: one step that writes the README and one that uploads the artifact,
  in the job `build`, on pull requests only.
- `README.md` and `CLAUDE.md`: how to look at a pull request's site.
- No code of the app, the calculation or the pipeline; no dependency. About 21 MB per run, kept
  14 days.
