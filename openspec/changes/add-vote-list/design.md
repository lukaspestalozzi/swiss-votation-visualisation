# Design

## Context

See `proposal.md` for the motivation. The app has one page, the table of the cantons
(`app/src/routes/+page.svelte`), and its browser tests (`app/e2e/start-page.spec.ts`). The data
files of #3 are in `app/static/data/`: `votes.json` (125 votes, about 100 kB) and one file of
entries per vote (57 to 60 kB). Their types are in `app/src/lib/vote-data.ts`. The calculation
(`calculation/src/result.ts`) gives the votes, the yes share, the cantonal votes, both
majorities and the verdict, but not the outcome of each canton: change #2 left that out because
nothing needed it.

Two things were checked while proposing (2026-11-15):

- **What the tie-break question's yes and no stand for.** The BFS files give a tie-break
  question yes and no votes; the Federal Chancellery gives, for the tie-break questions before
  2013, the votes for the initiative and for the counter-proposal. For all three (ids 4653,
  4893 and 5523, of 2000, 2002 and 2010), the BFS table's yes equals the Chancellery's votes for
  the initiative and its no the votes for the counter-proposal: 570,401 and 1,079,944; 953,316
  and 1,020,309; 1,252,761 and 1,271,365. So for 2026-03-08, id 6823, yes (1,098,341) are the
  votes for the initiative. Task group 1 adds this to the investigation with its script.
- **A spike of the build** (outside the repository): a route `votes/[id]` whose server load
  reads a vote's file through `import.meta.glob`, calculates the result and returns it; with
  `entries()` naming every id, the build wrote the 125 pages in about 4 seconds, each with its
  result in the HTML and a `__data.json` of about 5 kB that holds the vote and the result. No
  script of the browser holds an entry. One calculation took about 0.03 ms. Node's `Intl`
  writes de-CH as "1'609'152" and "49.16%". The spike's own code failed the type check and the
  lint (an import without `.ts`, untyped parameters); the real code uses SvelteKit's generated
  types.

## Goals / Non-Goals

**Goals:**

- Every vote reachable from the start page, at an address of its own.
- The two verdicts side by side on every vote the calculation judges, calculated by the same
  module that #8 will run under the limits.
- Every text of the screen in one place, so that #9 can translate it.

**Non-Goals:**

- A visual design beyond a plain, readable page. No colours that carry meaning on their own:
  every verdict is also written out.
- Loading the entries in the browser; #8 does that.

## Decisions

Decisions 1 to 8 were asked while drafting (2026-11-15); each records the answer and the
alternatives. Decisions 9 to 14 follow from them and were not asked one by one.

### 1. The list on the start page, a page per vote

The start page lists the votes; each vote has its page at `/votes/<id>` (`/votes/5960`), written
at build time. A vote can be bookmarked and shared, the back button works, and #11 builds on the
address. The table of the cantons goes, and its requirement in `app-shell` with it.

Alternatives considered:
- **One page with the list and the chosen vote side by side.** Rejected: no address per vote,
  and the back button leaves the site.
- **A page per vote, and the cantons table kept on the start page.** Rejected: a table of
  constants a visitor has little use for.

### 2. German until #9

The interface and the titles are in German, the language of most voters and of the official
terms (Volksmehr, Ständemehr). #9 adds French and Italian.

Alternatives considered:
- **English interface, German titles.** Rejected: a mixed screen that #9 replaces entirely.
- **English interface, titles in all three languages.** Rejected: long entries, and #9 still
  translates the labels.

### 3. The majority of cantons of an optional referendum: "nicht nötig", with its figures

The Ständemehr of an optional referendum reads "nicht nötig" and shows, greyed out, the cantonal
votes the calculation gives (2025-09-28: 7½ : 15½). The user chose this over the recommended
"nicht nötig" without figures: the data holds the figures, and the visitor sees them.

Alternatives considered:
- **"nicht nötig" without figures** (recommended). Not chosen: the official result has no
  cantonal votes for these votes, and a hasty reader may take the greyed figures for a verdict.
  The greyed style and "nicht nötig" next to them are the answer to that risk.
- **Only the majority of voters shown.** Rejected: the two verdicts would not be side by side on
  every vote.

### 4. The known difference: the calculated figures, with a note

A vote's page shows what the calculation gives from the municipal entries, also for the vote of
2024-03-03, and adds a note with the validated figure and the reference. The rule is general:
any validated vote whose yes or no votes differ from the sums of its entries gets the note; today
that is one vote.

Alternative considered: **the validated figures, with a note.** Rejected: one vote's page would
mix two sources, and its figures would change once #8 recalculates.

The list shows the official result (from `votes.json`), so its entry for 2024-03-03 reads
"58.25% Ja" either way: the two yes shares round alike.

### 5. The tie-break question: its figures, no verdict

The tie-break question of 2026-03-08 is in the list and has its page: the votes for the
initiative (its yes) and for the counter-proposal (its no) with their shares, the cantons for
each side (2 and 21, from the BFS's result), and the sentence that it counts only when both pass
and is not judged here. No verdicts, no outcome, no table of the cantons: the calculation does
not judge it (hard constraint 2), and which side a canton counts for is part of the rule it does
not apply.

Alternatives considered:
- **In the list, its page only a sentence.** Rejected: hides the data.
- **Left out of the screen.** Rejected: the ballot of 2026-03-08 would be incomplete.

### 6. Notes and provisional results: marked in the list, in full on the page

An entry carries "Hinweis" when the Federal Chancellery gives a note, and "vorläufig" when its
result is not validated. A vote's page shows the note in full, the reference ("Quelle: BBl 2019
4599"), or the sentence that the result is not validated yet. All of it comes from the data
files; there is no flag kept by hand (the annulled vote of 2016 is one of the four with a note).

Alternative considered: **only on the vote's page.** Rejected: the list would not show that the
vote of 2016 was annulled.

### 7. A vote's page: the figures, the verdicts and a table of the cantons

The page shows the title, date, kind and the majorities it needs; yes votes, no votes, yes share
and turnout; the two verdicts and the outcome; and a table of the 26 cantons with each one's yes
share and cantonal vote. The user chose the table over the recommended page without it.

Alternatives considered:
- **The figures without the table** (recommended). Not chosen: the table shows how the cantonal
  votes come about, which the verdicts alone do not.
- **Only the verdicts.** Rejected: the yes share people look for would be missing.

### 8. The result is calculated at build time; the page holds it

A server load function of the route `votes/[id]` reads the vote's file, calls the calculation
and returns the result; the build writes every page with it. The page shows at once, also
without JavaScript, and the browser loads no file of entries. #8 loads the entries in the
browser when the limits come.

Alternatives considered:
- **In the browser, from the vote's file.** Rejected for now: the result appears only after
  about 58 kB have loaded, and not at all without JavaScript.
- **Both.** Rejected: each vote's data would travel twice, and two paths to test for one screen.

### 9. The calculation gives the outcome of each canton

Follows from decision 7. The table of the cantons needs each canton's yes share and the side of
its cantonal vote. Worked out in the app, the rule of a canton's vote (more yes than no votes; a
tie counts against) would exist twice. So `calculateResult` adds to its result `cantons`: for
each canton with an entry, in the order of the constitution, `{ canton, yes, no, yesShare,
cantonalVotes, inFavour }`. The existing fields and their tests stay as they are. This adds the
requirement "The outcome of each canton" to `result-calculation`.

### 10. Loading at build time

- `app/src/routes/+page.server.ts` reads `votes.json` and returns, per vote, only what an entry
  shows (id, date, title in German, kind, the official verdict and yes share, the two marks), so
  that the start page's data stays small.
- `app/src/routes/votes/[id]/+page.server.ts` names every id in `entries()`, reads the vote's file
  through `import.meta.glob` (lazily, one file per page), calls the calculation and returns the
  vote and what the page shows. A missing file or an entry the calculation refuses throws an
  error that names the vote, and the build stops.
- `app/src/routes/+layout.ts` keeps `prerender = true`. Client-side navigation is left on (the
  default); between pages it loads only the small `__data.json` of the next page.

The data files themselves stay in `app/static/data/` and are served with the site, as #3 left
them; this change reads them at build time only.

### 11. What a page shows is worked out in plain TypeScript

`app/src/lib/vote-page.ts` turns a vote of the list and its calculated result into what the page
shows (the texts and formatted figures of decisions 3 to 7); `app/src/lib/vote-list.ts` does the
same for the list. The Svelte components only lay them out. Both modules are unit-tested with
Vitest against the real data files and the investigation's figures; the browser tests check the
built pages.

### 12. Numbers and dates are formatted by the app's own functions

`app/src/lib/format.ts`: counts grouped by three with an apostrophe ("1'609'152"), shares as
percent with two decimals, rounded half away from zero ("49.16%"), half cantonal votes as "½",
dates as "28. Februar 2016". They match what Node's de-CH formatting gives, but do not depend on
the locale data of the machine or the browser, so a page reads the same wherever it is built or
shown. Rounding works on the counts where it can (the share of `yes` in `yes + no`), so that a
share like 37.36% is not off by a binary fraction.

### 13. Every text of the screen in one module

`app/src/lib/texts.ts` holds every German text of the screen: labels, kinds, verdicts, the
sentences of decisions 3 to 6. #9 translates this one module.

### 14. Tests

- **Calculation:** the requirement "The outcome of each canton", one test at a time, with
  made-up figures and with vote 596 of the reference data.
- **App, unit:** `format.test.ts`, `vote-list.test.ts`, `vote-page.test.ts`, against the data
  files and the investigation's figures.
- **App, browser:** `app/e2e/vote-list.spec.ts` (the list, the marks, there and back) and
  `app/e2e/vote-page.spec.ts` (the named votes of the specs, the requests). The tests of the
  cantons table in `app/e2e/start-page.spec.ts` go; its test "all requests go to the site
  itself" moves to `vote-list.spec.ts`.
- **Build failures** ("No list of votes", "A vote without its file"): checked by hand with a
  temporary change of a data file and a build, as tasks; they need no permanent test.

### Dependencies added

None. The pages use SvelteKit, Svelte and the calculation, all in the workspace already.

### Performance budget

No computation in this change is triggered by the user: every result is calculated at build
time. Budgets the browser tests or the build check:

| What | Budget | Measured in the spike |
|------|--------|-----------------------|
| The build of all pages | below 60 s on CI | about 4 s for the 125 vote pages |
| A vote's page, HTML and `__data.json` | below 30 kB together | about 12 kB, without the table of the cantons |
| The start page, HTML and `__data.json` | below 150 kB together | not measured; `votes.json` is about 100 kB, the list holds less |

## Risks / Trade-offs

- **The greyed cantonal votes of an optional referendum have no official counterpart** (decision
  3) → "nicht nötig" stands next to them, and they are greyed; the official result is never
  shown as having cantonal votes it does not have.
- **German only until #9** → all texts are in `texts.ts`; the titles in French and Italian stay
  in the data.
- **The vote pages grow with each vote day** (about 12 kB each) → no concern at this size.
- **A rounding to two decimals can make a share near 50% look like a tie** (50.00%) → the
  verdicts are written out as "Ja" or "Nein" from the calculation, never derived from the
  rounded share.
- **The tie-break question's meaning rests on three earlier tie-break questions** → recorded in
  the investigation with its script; the Chancellery's validated figures for number 682 will
  confirm it.

## Migration Plan

Nothing is deployed yet (#5). The start page's content changes; its address stays.

## Open Questions

None.
