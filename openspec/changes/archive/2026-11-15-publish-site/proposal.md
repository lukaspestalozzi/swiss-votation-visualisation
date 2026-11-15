# Proposal

## Why

The site exists only as a build on a developer's machine and in CI. Nobody can open it, and
the changes that follow (the map, the limits, the phone) cannot be looked at, on a phone least
of all. This change publishes it: every change merged into `main` is on the web minutes later,
at a public address, as the files the checks tested.

It implements entry #5 of `docs/roadmap.md`, `publish-site`.

## What Changes

- **The site is published at `https://lukaspestalozzi.github.io/swiss-votation-visualisation/`**
  (capability `publishing`), on GitHub Pages, from CI: on every push to `main`, once the three
  CI jobs (`specs`, `build`, `pipeline`) have passed, a new job publishes the files the browser
  tests of the same run checked. A failing check publishes nothing. Pull requests publish
  nothing and get no preview.
- **The site is built for its path.** The address has the path `/swiss-votation-visualisation/`,
  so the app is built for that path, and the browser tests serve the build under the same path:
  the files they test are the files that are published. The build is written to
  `app/build/swiss-votation-visualisation/`.
- **A vote's page is written as `votes/<id>/index.html`**, so its address is `/votes/<id>/`
  (capabilities `verdicts` and `vote-list`). `/votes/<id>` without the final slash shows the
  same page. The page of a vote and the directory of its data no longer share a name, which a
  static host may resolve either way.
- An address on the site that names no page is answered with GitHub's "not found" page.
- GitHub Pages is switched on once, by hand, in the repository's settings.

## Non-goals

- No preview of a pull request before it is merged; revisit in #6 or #10.
- No custom domain; the product's name is not decided. A domain can follow as a change of its own.
- No check of the published site by CI after a deployment; the first deployment is checked by
  hand.
- No page of our own for an unknown address; GitHub's "not found" page answers.
- No change of what a page shows, of the calculation, the data files or the pipeline.
- No analytics, no cookies, no tracking (hard constraint 4).

## Capabilities

### New Capabilities

- `publishing`: where the site is published, when and from which files, and what the published
  site answers for an address that names no page.

### Modified Capabilities

- `app-shell`: the site is served under the path of its address, `/swiss-votation-visualisation/`,
  not at the root of the server; the addresses the specs name are relative to that path.
- `verdicts`: a vote's page is at `/votes/<id>/`, and `/votes/<id>` shows the same page.
- `vote-list`: an entry leads to `/votes/<id>/`.

## Impact

- `app/vite.config.ts`: the path of the site, the output directory, absolute asset paths.
- `app/src/routes/+layout.ts`: every page written as `<path>/index.html`.
- `app/playwright.config.ts` and `app/e2e/*.spec.ts`: the tests open the site under its path.
- `.github/workflows/ci.yml`: the build job uploads the tested build; a new job `deploy`
  publishes it, on pushes to `main` only.
- Two GitHub actions added: `actions/upload-pages-artifact` and `actions/deploy-pages`. No npm
  or Python dependency.
- `pnpm run dev` serves the app under the same path (`http://localhost:5173/swiss-votation-visualisation/`).
- The repository's settings: GitHub Pages switched on, source "GitHub Actions".
- `README.md`, `CLAUDE.md`, `openspec/config.yaml`: the address, the hosting target as decided,
  the new path of the build.
