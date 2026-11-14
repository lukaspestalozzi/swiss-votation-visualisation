# Proposal

## Why

The app's core is one calculation: from the municipalities that remain under the user's limits,
what would the result of the vote have been? The predecessor got it wrong in three ways: it
counted only the last municipality of each canton, it swapped two cantons' voting weights, and
it judged every vote by the double majority (failure modes 1, 2 and 4 in `docs/roadmap.md`). The
calculation is therefore built and tested against official results before any data loading or
screen depends on it.

It implements entry #2 of `docs/roadmap.md`, `add-result-calculation`. The data-sources
investigation (`investigations/data-sources.md`) is done and supplies the reference votes.

## What Changes

- The calculation module gains the result of a vote from the entries that remain: the yes
  votes, the no votes, the valid votes and the yes share; the cantonal votes in favour and
  against; whether the majority of voters and the majority of cantons are reached; and the
  verdict, passed or failed.
- It knows which majorities each kind of vote needs. Besides the three kinds of hard constraint
  2 it covers the one further case of the period: a popular initiative voted on together with a
  counter-proposal. Both are judged like any vote that needs the double majority. The tie-break
  question between them is not calculated; the calculation says so and gives no verdict for
  it.
- When nothing remains, the vote counts as failed.
- An entry that cannot be counted (a canton that does not exist, votes that are not whole
  numbers from zero) is refused with an error, not skipped.
- Reference data for the tests: the municipal results of seven named votes, generated from the
  BFS feed by a script of the investigation and committed with the calculation. The tests
  reproduce the official figures of all seven.
- The project context records the two rules decided here (the kinds beyond the three, and the
  result when nothing remains).

Nothing visible changes: the start page still shows the cantons.

## Non-goals

- No loading of data in the app, no data files for the app, and no format for them (#3). The
  reference data is test data of the calculation; its shape decides nothing for #3.
- No limits on characteristics and no filtering: the calculation takes the entries that remain
  and does not decide which remain (#8).
- No screen, and no decision on how a result is shown, for example the majority of cantons of
  an optional referendum (#4).
- No calculation of the tie-break question (user decision; see `design.md`).
- No new meaning of "matches the official result" for the one vote in which the municipal data
  differs from the Federal Chancellery's figure; that is decided in #3. The seven reference
  votes do not include it.
- No outcome per canton in the result (which cantons are in favour); nothing needs it yet.
- No performance test. The calculation's cost is measured and stated in `design.md`; the budget
  of the whole recalculation is set by #8.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `result-calculation`: requirements are added for the votes and the yes share, the cantonal
  votes, both majorities, the majorities a kind of vote needs, the verdict, entries that cannot
  be counted, and the reference votes. The existing requirement on the cantons and their
  cantonal votes is unchanged.

## Impact

- **New code:** in `calculation/src/`, the kinds of vote with the majorities they need, the
  calculation of a result, their tests, and the reference data with its test.
- **New in the investigation:** a script in `investigations/data-sources/` that writes the
  reference data, and in `investigations/data-sources.md` the seventh reference vote and a
  section on the reference data.
- **Changed files:** `calculation/src/index.ts` (exports), `.prettierignore` (the reference data
  is not formatted), `openspec/config.yaml` (hard constraint 2 and the glossary),
  `docs/roadmap.md` (entry #2), `CLAUDE.md` (status, code map).
- **Dependencies:** none added.
- **App:** unchanged. The reference data is imported only by a test, so it is not part of the
  built site.
- **Later changes:** #3 can reuse or replace the kinds' names when it maps the sources' codes to
  them; #4 and #8 call the calculation.
