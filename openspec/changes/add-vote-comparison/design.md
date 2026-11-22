# Design

## Context

What the change builds on:
- **A vote's page holds one selection.** `[lang]/votes/[id]/+page.svelte` holds `limits` and
  `abroadCounted`, and `Limits.svelte` lays out the section "Gemeinden auswählen" from them, the
  vote's date and the characteristics. The page holds its own entries per canton from the build
  (`voteEntriesOf` over `map.json` and `municipalities.json`) and loads no file of entries (spec
  verdicts, "The page holds its result").
- **A vote's real result comes from its file.** `vote-page.ts` calculates it at build time from
  the file's entries (`judgedOfRows`, not exported) and writes it with `judgedOf`; the notes of a
  provisional result and of a known difference come from the vote of the list and the file.
- **The selection in the address.** `share-link.ts` writes and reads a selection (`linkOf`,
  `selectionOf(link, trackFor)`); the vote's page reads its address once the characteristics have
  loaded and on `hashchange`, and writes it half a second after the last change and after each
  reading, by a shallow `goto` of its own path.
- **The language switch** in `[lang]/+layout.svelte` builds its links by route (`addressIn`) and
  throws on a route it does not know; it adds the hash of the address as SvelteKit knows it.
- **The loaders** in `map-data.ts` fetch a file once per visit (`createCharacteristicsLoader`).
- **The start page** orders the votes newest first, and by id within a day (`vote-list.ts`).

`investigations/vote-comparison.md` gives the facts:
- the same limits on two vote days (1);
- two named comparisons (2);
- what a comparison page loads (3);
- the cost of recalculating two votes (4);
- the result boxes on a phone (5).

## Goals / Non-Goals

**Goals:**
- **What the page shows, in plain TypeScript.** The votes it offers, the comparison's address and
  each vote's table are worked out in `app/src/lib/` and tested without a browser, like the rest of
  `app/src/lib/`. The page only lays them out.
- **The real result is the vote page's own.** It comes from the same file by the same function.
- **No new dependency.** The page requests nothing but the site's own files.

**Non-Goals:**
- **Sharing the vote page's code beyond what it already shares.** The comparison page uses
  `share-link.ts` as it is, and `Limits.svelte` with one change: it shows no count when it is
  given none (decision 6). A vote's page changes only by its link, for which its data holds the
  vote's id (decision 10).
- **A comparison without the characteristics.** Without them there are no limits, so the tables
  show their real results only.

## Decisions

### 1. A page of its own, one per language (Q)

The comparison is the route `[lang]/compare/`, written at build time for each language:
`/de/compare/`, `/fr/compare/`, `/it/compare/`. The votes and the selection are in its hash, so
one page serves every pair.

Alternatives considered:
- **On a vote's page** (Q's first answer, reverted): the second vote's results beside the page's
  own. The vote's page would load another vote's file and grow by a second result.
- **One page per first vote**, `/de/votes/5960/compare/`: it would hold the first vote's entries
  from the build, but 375 more pages.

### 2. The same municipalities, by the first vote's figures (Q)

The limits' tracks are made from the figures that apply to the first vote, as on that vote's page.
The municipalities that remain under them count in both votes: `entriesThatRemain` over each
vote's entries with the same set, so the Swiss abroad of a canton count in a vote where one of
that canton's entries remains. A sentence above the limits says so:
- German: "Die Gemeinden werden nach den Zahlen der ersten Abstimmung ausgewählt; in beiden
  Abstimmungen zählen dieselben Gemeinden."
- French: "Les communes sont choisies selon les chiffres de la première votation; les mêmes
  communes comptent dans les deux votations."
- Italian: "I Comuni sono scelti secondo le cifre della prima votazione; nelle due votazioni
  contano gli stessi Comuni."

Alternative considered: **the same limits, each vote by its own figures**, "municipalities with
under 20% foreigners, then and now". Each limit would need two tracks and two labels, and the two
votes could keep up to 336 different municipalities (investigation, 1).

### 3. The votes' entries: the pipeline's files, loaded in the browser

When a vote is chosen, the page loads `data/votes/<id>.json` through a loader of its own in
`map-data.ts`, which fetches each file once per visit and rejects when the request fails. From the
file it calculates:
- the vote's real result, by the function the vote's page uses at build time, which `vote-page.ts`
  now exports;
- the entries per canton, by `voteEntriesOf`, checked against the list of the characteristics'
  municipalities, the same 2,110 as the map's (`vote-data.test.ts`), and the Swiss abroad, whose
  numbers the page holds from the build;
- the result of the selection, by `entriesThatRemain` and `calculateResult`, as a vote's page does.

A file is 57 to 60 KB, about 25 KB gzipped (investigation, 3).

Alternatives considered:
- **The other vote page's own data** (`/de/votes/6650/__data.json`): SvelteKit's internal format,
  which a later SvelteKit may change.
- **Every pair written at build time**: 124 × 123 pairs in three languages.

### 4. The list of votes, written into the page (Q: no preference)

The page holds, from the build, the 124 judged votes in its language. For each it holds:
- its id and date;
- its text in the lists, "28. Februar 2016 · Volksinitiative «Für Ehe und Familie - gegen die
  Heiratsstrafe»";
- its title, its date and kind as its page writes them, and the majorities it needs;
- its notes, the provisional mark and the known differences, as `vote-page.ts` writes them from
  the vote and its file at build time;
- the numbers of the Swiss abroad.

About 17 KB in German, 5 KB gzipped (investigation, 3). Alternative considered: **loading
`data/votes.json` when the lists are opened**, 101 KB (21 KB gzipped) with every title in three
languages, and a wait before the first choice.

### 5. The order of the lists (Q: no preference)

"Erste Abstimmung" offers the judged votes as the start page orders them: newest first, by id
within a day. "Zweite Abstimmung" offers the same votes without the first: those of the first
vote's day first, by id, then the others in the start page's order. 40 of the 44 vote days have
several votes (investigation, 3). The empty choice is "–", as in "Merkmal hinzufügen".

Alternative considered: **the second list in the start page's order** only.

### 6. A compact table per vote (Q)

For each chosen vote the page shows a table:
- **Head:** the vote's title as a heading, then its date and kind (class `secondary`), as its page.
- **Rows:** "Ja-Stimmen", "Nein-Stimmen", "Ja-Anteil", "Volksmehr" and "Ständemehr", each verdict
  with its word and its figure as the verdict boxes write them, and "Vorlage" with the outcome.
- **Columns:**
  - "Echtes Ergebnis";
  - while a selection applies (spec verdicts, "The result of the selection"), "Mit Ihrer Auswahl".
- **Colours:** the words take the class of their side (`side-yes`, `side-no`), and a figure of a
  majority that is not needed takes the class `greyed`, as on the vote's page.
- **Below it:**
  - while a selection applies, its count, "In der Auswahl: 1'455 von 2'103 Gemeinden mit eigenem
    Ergebnis." (Q);
  - the notes of its vote's page.
- **While its file loads, and when it cannot be loaded,** the table says so in place of its rows.

The texts:
- "Echtes Ergebnis", "Vrai résultat", "Risultato reale";
- "Vorlage", "Objet", "Oggetto";
- "Die Ergebnisse werden geladen.", "Les résultats sont en cours de chargement.", "I risultati
  vengono caricati.";
- "Die Ergebnisse dieser Abstimmung lassen sich nicht laden.", "Les résultats de cette votation ne
  peuvent pas être chargés.", "I risultati di questa votazione non possono essere caricati.".

The other texts are the vote page's.

Alternatives considered (Q):
- **The vote page's boxes**: four of them, about 1,600 pixels on a phone (investigation, 5).
- **Only the results with the selection on a phone**, the real ones folded away.

### 7. The page's order, the tables' places and the bar (Q)

The page stands in this order:
1. the heading;
2. the lists "Erste Abstimmung" and "Zweite Abstimmung";
3. the parts of the address it could not use;
4. the tables;
5. the sentence of decision 2;
6. the section "Gemeinden auswählen" of `Limits.svelte`, without its count (decision 6).

From 640 pixels the two tables stand side by side; below, the second below the first. On a touch
screen the two lists are at least 44 × 44 pixels, as "Merkmal hinzufügen" is.

**The bar.** Below 640 pixels, while a selection applies and a table does not lie wholly in the
window, a bar at the bottom names each vote's outcome with the selection: "Erste Abstimmung:
Angenommen", "Zweite Abstimmung: Abgelehnt", each outcome in the colour of its side. It works like
the vote page's `SelectionBar.svelte` (an `IntersectionObserver` on each table, sticky, its top
border in `--border`, `aria-hidden`), as a component of its own.

The page has no map and no table of the cantons (Q). The texts: "Zwei Abstimmungen vergleichen",
"Comparer deux votations", "Confrontare due votazioni"; "Erste Abstimmung", "Première votation",
"Prima votazione"; "Zweite Abstimmung", "Deuxième votation", "Seconda votazione".

Alternatives considered (Q): **the limits above the tables, without a bar**; **the tables above the
limits, without a bar**.

### 8. The comparison in the address

The hash is `votes=<first>,<second>`, then `&` and the selection as `linkOf` writes it:
`#votes=5960,5970&foreigners=-19.98`. The page reads it with `URLSearchParams`:
- `votes` names the votes;
- the rest goes to `selectionOf` with the first vote's tracks.

A `votes` part is unusable when it is not one or two ids joined by a comma, when its first id is
not a judged vote's, or when its second id is not a judged vote's or is the first again. The ids
before the bad one still apply, and the part is named, whole, in the sentence of the `share-link`
capability ("Diese Angaben der Adresse liessen sich nicht anwenden: «votes=5960,6823»."). A second
`votes` part is unusable, as a characteristic given twice is.

Reading and writing follow the vote's page:
- the page reads the address once the characteristics have loaded and on `hashchange`;
- it writes it half a second after the last change and after each reading, by a shallow `goto` of
  its own path, when it differs from the browser's address or from SvelteKit's.

The writer stands in the page itself, as on the vote's page: two places, not yet a third that would
make a shared one worth its abstraction. Without the characteristics, the page reads only the
votes, and writes nothing.

The language switch learns the route `/[lang]/compare`, so that it links to the comparison in the
other languages with the hash.

### 9. Another first vote keeps the selection (Q)

When the visitor chooses another first vote, the page writes the selection as a link (`linkOf`) and
reads it back on the new first vote's tracks (`selectionOf`), as a link opened in the tab would be.
Each bound keeps its value and takes the nearest step; a value the new track does not have moves at
most half a step (spec share-link). When the new first vote is the second, the second choice is
emptied.

Alternative considered (Q): **clearing the limits** on another first vote.

### 10. The link from a vote's page (Q)

Below the section "Gemeinden auswählen", a judged vote's page links "Mit einer anderen Abstimmung
vergleichen" ("Comparer avec une autre votation", "Confrontare con un'altra votazione") to the
comparison in its language, with `#votes=<id>` and, in the browser, `&` and the page's current
selection, the link `linkOf` gives, not the address's half a second old. The written page's link
has `#votes=<id>` only. The address is built from `resolve('/[lang]/compare', …)` and typed as a
`ResolvedPathname`, as the language switch types its links.

Alternative considered (Q): **the link below the results**, before any selection is made.

### 11. The budget

- **A step of a slider** recalculates both votes. One recalculation takes 0.066 ms in Node
  (investigation, 4), so the frame keeps the 16 ms of the `limits` capability.
- **A jump** keeps its 50 ms: a limit added or removed, the switch, the return to the real result,
  and a vote chosen whose file has loaded, whose tables are made in the frame after the choice.
- **When a file arrives**, its table is made in the frame after it, a jump's work. It follows no
  input, so it has no budget of its own, as a page's load has none.

The browser tests measure the drag and the jumps with `frames.ts`, as the limits' budget tests do,
once more when a frame exceeds its budget.

### 12. The tests

- **Unit tests** of the new module, against `votes.json`, the files of entries and
  `characteristics.json`:
  - the lists and their order;
  - the address read and written;
  - the unusable `votes` parts;
  - each vote's table for the two named comparisons (investigation, 2);
  - the real table of every judged vote equal to the figures its vote's page writes.
- **Browser tests** in `app/e2e/compare.spec.ts`, one or more per scenario of the spec, the link
  from a vote's page and the budgets among them.

## Risks / Trade-offs

- **[The same municipalities can surprise across years]**: a 2024 vote compared by the population
  of the end of 2015 → the sentence of decision 2, and the limits' labels name the first vote's
  dates.
- **[A slow connection]**: about 25 KB per vote → the sentence while it loads; each file is loaded
  once per visit.
- **[The real result computed in the browser drifts from the vote page's]** → the same function,
  and a unit test over every judged vote.
- **[The writer in two places]** → noted in decision 8; a third use would make one of them shared.
- **[A link to a vote that a later update drops]** → the unusable part is named, as for a
  characteristic that no longer exists.

## Migration Plan

None: the page is new, and a vote's page changes only by its link.

## Open Questions

None.
