# Proposal

## Why

To look at a change on the site, Q has had to merge it to `main`, which publishes it. Q wants to
check a branch on the phone, easily and quickly, for its design and features; one language and a
part of the data are enough (2026-11-27).

GitHub gives a repository one Pages site, and the preview deployments of `actions/deploy-pages`
are "not available to the public" (its README). An artifact of CI, unzipped on a phone, does not
run: a browser blocks a page opened from a file from loading its scripts and data (measured,
`origin 'null'`). A private Claude Artifact does run it: on 2026-11-27 the German site, built
with relative addresses, published as one, worked on Q's phone (start page, a vote's map, a
limit and the selection's result).

## What Changes

- A preview build: one setting of the app's build, `PREVIEW=1`, that builds the site with
  relative addresses into `app/build/preview/`. The live site's build does not change.
- `scripts/preview.mjs`: builds the preview, packs the German pages with the scripts and data
  they load (all votes; the comparison's entries for the ten newest) and a short launcher that
  names the branch and the commit, into `app/build/preview-artifact/`, with the lists of files to
  publish.
- On Q's request ("preview this branch") Claude runs the script and publishes the result to the
  one preview Artifact, which keeps its address; files of an earlier preview that are gone are
  removed from it. `CLAUDE.md` describes the procedure.
- A pull request still publishes nothing, and CI does not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `publishing`: "Nothing is published unless every check passed" keeps that a pull request
  publishes nothing, without "and gets no preview".

## Impact

- `app/vite.config.ts` (the preview setting), `scripts/preview.mjs` (new), `CLAUDE.md`.
- No change to the pages, the calculation, the pipeline, CI or the live site; no dependency.
