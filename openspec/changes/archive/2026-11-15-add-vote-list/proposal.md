# Proposal

## Why

The calculation and the data of every national vote since 2013 exist, but the app shows only a
table of the 26 cantons. A visitor cannot yet find a vote or see how it was decided. This
change builds the first screen: the list of the votes, and for each vote its result with the
majority of voters and the majority of cantons side by side, calculated from the municipal
data by the same calculation that #8 will run under the limits. It is also the first place
where the two verdicts are shown separately, so that a vote can no longer be judged by the
wrong majorities on screen (failure mode 4 in `docs/roadmap.md`).

It implements entry #4 of `docs/roadmap.md`, `add-vote-list`.

## What Changes

- **The start page lists the votes** (capability `vote-list`): every vote of the data files,
  grouped by year, newest first, each with its date, its German title, its kind and its
  official result. A vote with a note of the Federal Chancellery is marked, and so is a vote
  whose result is not validated yet. The table of the cantons from #1 goes.
- **Every vote has its own page** at `/votes/<id>` (capability `verdicts`), written at build
  time for every vote, with:
  - its title, date and kind, and which majorities that kind needs;
  - its yes votes, no votes, yes share and turnout;
  - the two verdicts side by side, the majority of voters and the majority of cantons, each
    marked as reached or not, and the outcome of the vote;
  - a table of the 26 cantons, each with its yes share and its cantonal vote;
  - the Federal Chancellery's note and reference, a mark when the result is not validated yet,
    and a note where the municipal figures differ from the validated result (one vote).
- For an optional referendum, the majority of cantons reads "not needed" and still shows the
  cantonal votes the calculation gives, greyed out.
- The tie-break question of 2026-03-08 shows its votes for the initiative and for the
  counter-proposal, without a verdict.
- The result on a vote's page comes from the calculation module over the vote's entries, run
  when the site is built; the page holds the result, not the entries.
- **The calculation gives the outcome of each canton** (capability `result-calculation`): its
  yes votes, no votes, yes share and on which side its cantonal vote counts. The canton table
  uses it, so that the rule for a canton's vote exists once.
- The interface and the titles are in German until #9; numbers are written the Swiss way
  (1'609'152, 49.16%).
- No page of the site requests anything from another server; the browser tests check the start
  page and a vote's page.

## Non-goals

- No limits on characteristics and no recalculation in the browser (#8). The entries of a vote
  are not loaded by the browser in this change.
- No map (#6), no characteristics (#7), no publishing (#5).
- No French or Italian, and no choice of language (#9). The titles in French and Italian stay
  in the data files.
- No layout for small screens beyond a page that reads top to bottom (#10).
- No search, filter or sorting of the list; no link that keeps a selection (#11).
- No verdict for the tie-break question, and no rule for which proposal it puts into force
  (hard constraint 2: it is not calculated).
- No change of the data files or of the pipeline.

## Capabilities

### New Capabilities

- `vote-list`: the start page's list of all votes, its grouping and order, what each entry
  shows and marks, and how it leads to a vote's page.
- `verdicts`: the page of one vote: its figures, the two verdicts side by side and the outcome,
  the table of the cantons, and how notes, provisional results, the known difference, optional
  referendums and the tie-break question are shown.

### Modified Capabilities

- `app-shell`: the requirement "The start page shows the cantons and their cantonal votes" is
  removed (the list replaces it); "The page requests nothing from other servers" applies to
  every page of the site, not only the start page.
- `result-calculation`: a requirement is added for the outcome of each canton.

## Impact

- **New code:** in `app/src/routes/`, the list on the start page and the route `votes/[id]` with
  its build-time loading; in `app/src/lib/`, the formatting of numbers and dates and the texts
  of the screen, with their unit tests; browser tests of the list and of a vote's page.
- **Changed code:** `calculation/src/result.ts` (the outcome of each canton) and its tests;
  `app/src/routes/+page.svelte` (the list replaces the table); `app/e2e/start-page.spec.ts`
  (its tests of the cantons table go).
- **Site:** 125 more pages, about 1.5 MB; the start page grows by the list.
- **Dependencies:** none added.
- **Docs:** `openspec/config.yaml` (the language until #9), `docs/roadmap.md` (#4),
  `CLAUDE.md`, `README.md`.
- **Later changes:** #5 publishes these pages; #8 loads a vote's entries in the browser and
  recalculates the same figures; #9 translates the texts collected here; #11 builds on the
  address of each vote.
