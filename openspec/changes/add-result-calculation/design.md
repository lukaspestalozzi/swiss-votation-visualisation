# Design

## Context

See `proposal.md` for the motivation. `calculation/` is a TypeScript package without
dependencies; it is compiled without DOM and Node types and with `rootDir` `src`
(`calculation/tsconfig.json`). It holds the 26 cantons with their cantonal votes
(`cantons.ts`). The app imports it and shows the cantons; nothing else uses it yet.

`investigations/data-sources.md` gives what this design builds on: the BFS file of each vote
day has every vote's municipal results, on the list of municipalities of 2026-01-01; the
Swiss abroad of 11 to 12 cantons are entries of their own; six kinds of vote occur; and seven
votes have validated official figures on which all sources agree.

The decisions marked "user decision" were asked on 2026-11-14 while drafting. The others were
tried in a throwaway copy of the repository, outside it, before this design was written. What
that showed, with Node 24.22.1:

| Observed | Result |
|----------|--------|
| The reference data for seven votes, generated from the BFS files | 220,910 bytes, 242 lines, 2,114 to 2,117 entries per vote, 11 or 12 of them Swiss abroad. |
| A draft of the calculation on all seven votes | Reproduces yes, no, the cantonal votes and the verdict of each. |
| A test that imports the reference data as a JSON module under the calculation's compiler settings | Compiles and runs with no setting changed. `tsc` takes 3.0 s, the lint 3.9 s, as without the file. |
| `performance` and `console` in a test of the calculation | Do not compile: the package has neither DOM nor Node types. Tests use neither. |
| The formatter on the reference data | Wants to rewrite it into 15,230 lines; with the file in `.prettierignore` the check passes. |
| The answer of a tie-break question passed to the draft calculation | Does not compile (TS2345: `"not-calculated"` is not assignable to the majorities). |
| The built site | Does not contain the reference data. |
| One calculation for a vote with 2,117 entries | 0.04 ms (37.65 microseconds, mean of 20,000 calls). |
| The vote of 2016-02-28 without the entries of the canton of Zürich | 1,355,455 yes, 1,334,232 no, cantonal votes 16.5 : 5.5: it passes. With all entries it fails. |
| The optional referendum of 2015-06-14 | Its cantonal votes calculate to 6.5 : 16.5; no source publishes a figure for it. |

## Goals / Non-Goals

**Goals:**

- One pure function gives the whole result of a vote from the entries that remain.
- Every rule of hard constraint 2 has a test with official figures where a real case exists,
  and with made-up figures where none does (a tied canton, cantonal votes split evenly).
- A kind that is not calculated cannot be passed to the calculation by mistake: the compiler
  rejects it.

**Non-Goals:**

- A format for the app's data, a mapping from the sources' codes to the kinds, or validation of
  the sources: #3.
- The outcome per canton, a breakdown of the result, or rounding for display: the changes that
  show them.

## Decisions

### 1. The tie-break question is not calculated

User decision. A popular initiative voted on together with a counter-proposal, and the
counter-proposal, are each judged like any vote that needs both majorities, from their own yes
and no votes. Their tie-break question is not calculated.

In the period this case occurs once (2026-03-08), and the tie-break did not matter: the
initiative failed. If both were ever accepted, the app would not say which one comes into
force; a later change can add the rule of the Federal Constitution, art. 139b para. 3.

Alternatives considered: the full rule (three linked questions and a comparison of percentage
sums, built for one vote in 13 years, with no second official case to test it against); leaving
all three questions out (one vote day would show three of its six votes without the app's core
feature).

For these two kinds, valid ballots are more than yes plus no, because a voter may leave a
question unanswered. The calculation uses yes and no only, as the rule does (the unanswered
are not counted), so it is not affected.

### 2. When nothing remains, the vote has failed

User decision; the recommendation was "no result". Zero yes votes are not more than zero no
votes, so the majority of voters is not reached, by the same rule as a tie, and the vote has
failed whatever its kind. The screens have one state fewer to handle.

Alternative considered: no verdict and an explicit "nothing remains" (it would not claim a
rejection by nobody, at the price of a third state in every place that shows a verdict).

What follows from the decision, decided here so that nothing is left implicit:

- **The yes share.** With no valid vote it does not exist; the result carries no number for it
  (`undefined`), not 0 and not 0.5. A screen has to say what it shows then; that is #4's
  question.
- **A canton.** A canton takes part when at least one of its entries remains. With as many yes
  as no votes, zero included, it counts against, by the same tie rule. A canton with no entry
  remaining has no cantonal vote, as hard constraint 2 says.
- **The majority of cantons.** With no cantonal vote on either side it is not reached.

### 3. The reference data: seven votes with all their municipal entries

User decision; the recommendation was the figures of the 26 cantons per vote. The tests call
the calculation the way the app will: with one entry per municipality.

- **The votes.** Numbers 567, 568, 595, 596, 614, 636 and 679. Six are the reference votes of
  `investigations/data-sources.md`; 568 (2013-03-03, "gegen die Abzockerei", 1,616,184 yes,
  761,975 no, cantonal votes 23 : 0, BBl 2013 3129) is added as the plainly accepted
  initiative. Number 665, in which the municipal data differs from the Federal Chancellery's
  figure, is left out (decision 4).
- **The file.** `calculation/src/reference-votes.json`: per vote its number, date, German title
  and kind, and per canton a list of `[BFS number, yes, no]`, one canton per line. It lives in
  the calculation's `src/` because the package's `rootDir` lets a test import nothing from
  outside it. Only a test imports it, so it is not part of the app.
- **Where it comes from.** A new script, `investigations/data-sources/write_reference_votes.py`,
  downloads the six vote days' files of the BFS feed and writes the file. The entries are on
  the list of municipalities of 2026-01-01. The BFS rewrites its files after a merger of
  municipalities; the national and cantonal sums stay, the entries change. Running the script
  again then changes the file, and the counts of entries in the spec with it.
- **The expected figures** are written in the tests, taken from
  `investigations/data-sources.md`, not read from the file: the file is the input, the
  investigation is the oracle.
- **Not formatted.** The file is listed in `.prettierignore`; formatted, it would be 15,230
  lines, one entry per line.
- **Its shape decides nothing for #3.** It is test data. The kinds' names in it are the
  calculation's (decision 5).

Alternatives considered: the 26 cantons' figures per vote (4 KB, enough to test every rule, but
not the call with thousands of entries); every validated vote per canton (brings vote data
into the repository one change early).

### 4. "Matches the official result" stays as it is until #3

User decision. Hard constraint 1 is not reworded here. The calculation only sums what it is
given; which figure the app shows for the one vote that differs is decided with the data.

### 5. The interface of the calculation

Decided while drafting. Two functions and their types, exported from `calculation/src/index.ts`:

```ts
// kinds.ts
type Kind =
  | 'popular-initiative'
  | 'mandatory-referendum'
  | 'optional-referendum'
  | 'initiative-with-counter-proposal'
  | 'counter-proposal'
  | 'tie-break-question';
type Majorities = 'voters' | 'voters-and-cantons';
function majoritiesNeeded(kind: Kind): Majorities | 'not-calculated';

// result.ts
interface Entry { canton: string; yes: number; no: number }
interface Result {
  yes: number;
  no: number;
  valid: number;                    // yes + no
  yesShare: number | undefined;     // yes / valid, from 0 to 1; undefined with no valid vote
  cantonalVotesInFavour: number;
  cantonalVotesAgainst: number;
  majorityOfVoters: boolean;
  majorityOfCantons: boolean;       // given for every vote
  passed: boolean;
}
function calculateResult(entries: readonly Entry[], majorities: Majorities): Result;
```

- **The calculation takes the majorities, not the kind.** `calculateResult` accepts `'voters'`
  or `'voters-and-cantons'`. The answer `'not-calculated'` of a tie-break question is not of
  that type, so passing it on does not compile. The caller has to handle it first.
- **The majority of cantons is always calculated**, also for an optional referendum, where
  `passed` ignores it. Whether and how a screen shows it there is #4's decision.
- **The yes share is a fraction**, not a percentage, and not rounded.
- **The kinds have names, not the sources' codes.** The BFS feed numbers them 1 to 6; mapping
  those to the names is #3's.
- **An entry is not only a municipality.** It is whatever line of the results has a canton, yes
  and no votes; the Swiss abroad of a canton are entries too.
- **One pass.** The function adds up the entries once, per canton and in total. Counts are
  whole numbers far below 2^53 and the cantonal votes are multiples of 0.5, so every sum is
  exact.

Alternatives considered: `calculateResult(entries, kind)` returning a result or "not
calculated" (every caller would have to narrow the answer, also for kinds that are always
calculated); throwing for a tie-break question (a rule of the domain is not an error).

### 6. An entry that cannot be counted is an error

Decided while drafting. `calculateResult` throws a `RangeError` that names the canton the entry
gave when the canton is not one of the 26, or when yes or no is not a whole number from zero.
It does not skip the entry: a skipped entry would be a wrong result that looks right. Checking
costs one lookup and two comparisons per entry and is part of the 0.04 ms measured.

This is the calculation's own guard, not the check of the data: #3 catches wrong input where it
enters the pipeline.

Alternative considered: trusting the input (an unknown canton would then silently lose its
votes in the cantonal count, which is failure mode 1 in another form).

### 7. Files

```
calculation/src/
├── cantons.ts               unchanged
├── kinds.ts                 the kinds and the majorities they need
├── kinds.test.ts
├── result.ts                the entry, the result and its calculation
├── result.test.ts           the rules, with made-up figures
├── reference-votes.json     the municipal entries of the seven votes
├── reference-votes.test.ts  the seven votes and the scenarios that use their entries
└── index.ts                 exports
```

The tests that need official figures are in `reference-votes.test.ts`; the tests of the rules
with made-up figures are in `result.test.ts`.

### 8. The project context

`openspec/config.yaml` is updated with what is decided here: hard constraint 2 gains the two
further kinds, the tie-break question that is not calculated, and the result when nothing
remains; the glossary's "Kind of vote" names all six. Hard constraint 1 is not touched
(decision 4).

### Dependencies added

None.

### Performance budget

This change adds no interaction. From #8 on, the calculation runs while a limit is dragged, so
its cost is stated here: one call for one vote's entries (about 2,100) takes 0.04 ms, measured
as above. Budget for this function: 1 ms per call. It is not enforced by a test, since a
timing test on shared CI machines fails for reasons that are not the code's; #8 sets and tests
the budget of the whole recalculation, of which this is one part.

## Risks / Trade-offs

- [The reference data is a snapshot of files the BFS rewrites after each merger of
  municipalities] → The file is committed, so the tests do not depend on the source. The script
  that writes it is in the repository, and the investigation says what changes on a new run:
  the entries and their count, not the sums.
- [220 KB of data sit in the calculation's source directory] → Accepted with decision 3. Only a
  test imports it; a task checks that the built site does not contain it.
- [The counts of entries in the spec (2,114 to 2,117) are tied to that snapshot] → They are
  named in the reference votes' scenarios and nowhere else in the rules.
- ["Failed" for an empty selection reads like a result] → Accepted with decision 2. The result
  also carries zero valid votes and no yes share, so a screen can say that nothing remains.
- [A tie-break question reaches a screen that expects a result] → It cannot reach
  `calculateResult`; the compiler rejects it (decision 5), and a task checks that it does.
- [The names of the kinds are fixed before #3 has looked at the data's needs] → They are six
  string literals in one file; renaming them is a mechanical change.

## Migration Plan

Nothing to migrate: the change adds code and data that nothing but tests uses. It lands as one
pull request. Rolling back is reverting it.

## Open Questions

- How a screen words an empty selection, and whether it shows the majority of cantons of an
  optional referendum: #4.
- Whether the tie-break rule is ever needed: when a vote occurs in which both the initiative
  and the counter-proposal are accepted.
