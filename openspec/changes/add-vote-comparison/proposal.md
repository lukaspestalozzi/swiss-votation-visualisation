# Proposal

## Why

A selection belongs to one vote's page: to see how the same municipalities voted on another
question, a visitor must rebuild every limit on that vote's page and keep both results in mind.
#12 of `docs/roadmap.md`, `add-vote-comparison`, applies the same selection of municipalities to
two votes side by side. It settles what the roadmap leaves open for it: the layout, on a phone
too.

`investigations/vote-comparison.md` gives the facts:
- **The same limits keep other municipalities on another day.** A limit's figures are those that
  apply to its vote's day. On the same day the same limits keep the same municipalities; across
  years up to 336 of the 2,110 differ ("Ausländeranteil up to 19.98%", 2013 and 2026). The census
  of 2000 (the languages) never differs.
- **A comparison needs the votes' entries in the browser.** A vote's page holds only its own. A
  vote's file of entries is 57 to 60 KB, about 25 KB gzipped.
- **Two recalculations fit a frame.** One takes 0.066 ms in Node, where a drag's longest frame on a
  vote's page takes 6.7 ms of its 16.
- **A vote page's two result boxes stack on a phone.** At 360 pixels they stand one below the
  other, 790 pixels together; two votes' boxes would be about 1,600.

## What Changes

- **A comparison page in each language**, `/de/compare/`, `/fr/compare/` and `/it/compare/`, with
  the heading "Zwei Abstimmungen vergleichen" and the head of every page (Q).
- **Two lists choose the votes:**
  - "Erste Abstimmung" offers every judged vote, newest first;
  - "Zweite Abstimmung" offers the others: the first vote's own day first, then the rest newest
    first;
  - the tie-break question, which has no result per municipality, is not offered.
- **The same municipalities count in both votes** (Q):
  - the limits keep municipalities by the figures that apply to the first vote, with its tracks
    and the dates in their labels;
  - exactly those municipalities count in the second vote too, with the switch for the Swiss
    abroad applied to both;
  - a sentence above the limits says so.
- **The limits are those of a vote's page:** the list "Merkmal hinzufügen", two sliders per limit,
  "Entfernen", the switch, the count and "Zurück zum echten Ergebnis".
- **A compact table per vote** (Q):
  - its heading is the vote's title and date;
  - its columns are "Echtes Ergebnis" and, while a selection applies, "Mit Ihrer Auswahl";
  - its rows are the yes votes, the no votes, the yes share, the Volksmehr and the Ständemehr
    with their figures, and the outcome, each word in the colour of its side;
  - below it, the number of its municipalities in the selection, and the notes its vote's page
    has: a provisional result, a known difference;
  - the real result is the one its vote's page shows.
- **The order:**
  - the choice of the votes, the two tables, then the limits (Q);
  - on a window narrower than 640 pixels the second table stands below the first, and a bar at the
    bottom names both votes' outcomes with the selection while their tables are out of view (Q);
  - on a wider window the tables stand side by side.
- **No map and no table of the cantons** on the comparison page (Q); a vote's own page keeps them.
- **The address holds the comparison**, after `#`, as a vote's page holds its selection (the
  `share-link` capability): `/de/compare/#votes=5960,5970&foreigners=-19.98`.
  - It is written and read by the same rules.
  - The parts it cannot use are named, among them a vote it does not know, the tie-break question
    and the same vote twice.
  - The language switch carries it.
- **The page loads each chosen vote's file of entries**, `data/votes/<id>.json`, once per visit, and
  the characteristics, as a vote's page does. It says so while they load, and when one cannot be
  loaded.
- **A judged vote's page links to the comparison:** "Mit einer anderen Abstimmung vergleichen"
  opens it with that vote first and the page's selection, the second vote still to choose (Q).
- **The budgets hold for both votes:** 16 ms per frame while a bound is dragged, 50 ms after a jump.
- **The investigation:** `investigations/vote-comparison.md`, with its scripts.

## Non-goals

- **No limits by each vote's own figures** (Q): the second vote never keeps other municipalities
  than the first.
- **No map and no table of the cantons** on the comparison page (Q).
- **No more than two votes**, and no comparison of the tie-break question.
- **No link from the start page or from the head of every page** (Q): the comparison starts from a
  vote's page, or from a link to it.
- **No address without a language** for the comparison page: it is new, so no address of before
  leads to it.
- **No new section in the guide.** The comparison page says in a sentence which municipalities
  count.
- **No change to a vote's page** but the link, and the vote's id in its data for it: it still
  holds its own result and loads no file of entries (spec verdicts, "The page holds its result").
- **No change to the data, the pipeline or the calculation.**

## Capabilities

### New Capabilities

- `vote-comparison`: the page that applies one selection to two votes:
  - its address in each language, and the choice of the votes;
  - the same municipalities in both votes;
  - the compact table of each vote;
  - the address after `#`;
  - the loading of the votes' entries;
  - the link from a vote's page;
  - the page on a phone;
  - its budgets.

### Modified Capabilities

None. The requirements that hold for every page (the three languages, the head, the language
switch, a window 360 pixels wide, the colours and their contrast) cover the new page as they are
written; the new capability's scenarios check them on it.

## Impact

- **App:**
  - a new route, `app/src/routes/[lang]/compare/`, with its page, its tables and its bar;
  - a new module in `app/src/lib/` that works out the votes it offers, the comparison's address
    and each vote's table, in plain TypeScript, with its unit tests;
  - a loader of a vote's file of entries beside the others in `map-data.ts`;
  - `vote-page.ts` gives a vote's real result from its file, so that the table shows the vote
    page's own;
  - `Limits.svelte` is used by the comparison page, which gives it no count to show;
  - `[lang]/+layout.svelte`'s language switch knows the new route;
  - a vote's page gets its link;
  - the texts in three languages.
- **Browser tests:** a new file for `vote-comparison`: the pages, the lists, the two named
  comparisons, the address, the loading, the link, a phone, the budgets, the look.
- **Docs:**
  - `CLAUDE.md`'s code map and "Where things are";
  - `README.md`;
  - `docs/roadmap.md`;
  - `investigations/vote-comparison.md` and `investigations/vote-comparison/`.
