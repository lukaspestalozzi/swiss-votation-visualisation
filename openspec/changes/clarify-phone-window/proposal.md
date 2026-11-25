# Proposal

## Why

The verification of the work added to `redesign-site` after its merge and of `reword-site-texts`
(2026-11-25) found one warning and two suggestions; Q: fix them.

- **The warning:** `small-screens`, "The selection's result while a limit is set on a phone",
  promises that on a phone the selection's result and the first limit's sliders lie in one
  window. Its test checks a window 360 by 740 pixels only. In one 360 by 640 the sliders end at
  665 pixels, and on a phone held wide (740 by 360, 915 by 412) at 450: the promise does not hold
  there.
- **The suggestions:** no test checks the French and Italian sentences `reword-site-texts`
  changed; `README.md` describes only the wide layout of a vote's page.

## What Changes

- The requirement names the windows it holds for: a phone held upright, in a window at least 700
  pixels high. The promise needs at most 666 pixels, in German, French and Italian and at widths
  360, 375 and 412 (`investigations/redesign.md`, "Found after the merge"), so 700 leaves room.
  A lower window or a phone held wide is not held to it. Its scenario moves to that bound, 360
  by 700 pixels, in the three languages.
- Browser tests of the French and Italian sentences: the selection's place, and the guide's
  sentences on the figures that apply, the hatched municipalities and the Swiss abroad.
- `README.md`: on a phone the limits stand between the result and the map.

No page changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `small-screens`: "The selection's result while a limit is set on a phone" names the windows it
  holds for.

## Impact

- `openspec/specs/small-screens/spec.md`, through this change's delta.
- `app/e2e/small-screens.spec.ts`, `app/e2e/limits.spec.ts`, `app/e2e/guide.spec.ts`.
- `investigations/redesign.md` and a script in `investigations/redesign/`, `README.md`,
  `CLAUDE.md`, `docs/roadmap.md`.
