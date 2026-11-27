# Design

## Context

The site is built for one address, `/swiss-votation-visualisation/`, with absolute paths
(`app/vite.config.ts`), into `app/build/swiss-votation-visualisation/`. A Claude Artifact serves a
page and, beside it, files at relative paths under its own address; one version holds at most 511
files, one publish at most 255 (64 MB), one file at most 16 MB. The whole built site has 1,068
files (57 MB); its German pages with the scripts and the data they load, 314 files (19.3 MB).

The experiment of 2026-11-27 (a scratch copy of `main`, nothing committed) showed:
- Built with `base: ''` and `paths.relative: true`, every address in the pages is relative, and
  SvelteKit takes its base from the page's own place.
- Entered as `.../de/index.html`, the client finds no route ("the language switch knows no route
  null") and the page goes blank; entered as `.../de/`, it works. A line at the top of each page
  that replaces `.../index.html` with `.../` in the address before the scripts start fixes it.
- So built and published, the German site ran in the Artifact on Q's phone.

## Goals / Non-Goals

**Goals:**

- A branch's site on Q's phone in one request to Claude, at one address that stays the same.

**Non-Goals:**

- A preview from CI: CI cannot publish to claude.ai.
- French and Italian, and the comparison of every vote: the file limit of an Artifact.
- A reload inside the preview: the Artifact serves `de/index.html`, not `de/`.

## Decisions

1. **A setting of the build, `PREVIEW=1`, not a second configuration.** It switches the base to
   `''`, the paths to relative and the output to `app/build/preview/`; without it the build is
   as before, byte for byte but for SvelteKit's stamp of each build. The app has no Node types,
   so `vite.config.ts` declares the one global it reads, `process`, for itself alone (Q,
   2026-11-27). Rejected: relative paths for the live site too, which would change what the
   browser tests and the live site get; Vite's mode (`--mode preview`), which reaches only the
   first of the three times SvelteKit loads the configuration in a build (the other two are in
   the mode `production`, measured), so the prerendering asked for the live site's paths; Node's
   types for the whole app (`@types/node`), which would let browser code name `process`.
2. **The address line is added by the script, to the preview only.** It is the experiment's line;
   the app itself keeps no code for a host that serves `index.html` by name.
3. **German only, every vote, the comparison's entries for the ten newest votes:** 314 files, in
   two publishes. Every link of the start page works. (Q: one language and fewer votes are
   enough.)
4. **One preview Artifact, reused (Q).** Each preview publishes to the same address; the files
   that an earlier preview had and this one does not (the scripts' hashed names change with each
   build) are removed in the same publishes, so the Artifact stays within 511 files. Nothing is
   deleted after a day: the one Artifact does not pile up (Q).
5. **The procedure is in `CLAUDE.md` only (Q)**: a development tool, not something a visitor
   sees, so no spec beyond `publishing`'s one sentence.

## Risks / Trade-offs

- [A preview publishes only what the script packs.] → The launcher names the branch and the
  commit, so Q sees which state it is.
- [The Artifact's limits grow tight if the site grows.] → The script prints the number of files
  and the size; above 511 files the comparison's entries go first.
