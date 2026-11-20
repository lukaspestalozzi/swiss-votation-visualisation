# Proposal

## Why

A selection lives only as long as its page: a reload, a link sent to someone, or the language
switch loses it, and the next visitor must rebuild every limit by hand. #11 of `docs/roadmap.md`,
`add-share-link`, the first change after v1, makes a link reproduce a chosen vote together with
all its limits. It settles what the roadmap leaves open for it: the form of the link, and what a
link shows when its vote or one of its characteristics no longer exists.

`investigations/share-link.md` gives the facts:
- **Browsers limit address changes.**
  - Safari throws an error after 100 in 10 seconds, and Firefox throws past its own limit.
  - Chrome silently drops changes beyond 200 in a row.
  - An arrow key held on a slider makes 10 to 30 changes a second.
  - Playwright switches Chrome's limit off, so the browser tests do not see it.
- **A value comes back to its step.** Every value of every track, written as its label writes it,
  finds a step of the same value as its nearest. A value that no step has lands at most half a
  gap away: 0.05 percentage points on a share, about half a percent at the top of a logarithmic
  track.
- **A link is short enough.** With all 21 limits, the whole address is at most 505 characters.
- **A link to the same page does not reload it.** Pasted into a tab that shows the same vote, it
  only changes the hash and fires `hashchange`.

## What Changes

- **The address holds the selection**, after a `#` on the vote's page:
  - `/de/votes/5960/#foreigners=-19.98&abroad=no` is the limit "Ausländeranteil" up to 19.98%,
    with the Swiss abroad switched off;
  - each limit is written as its characteristic's key, which is the same in every language;
  - each bound is written as its label writes it, without the unit and the apostrophes;
  - a bound at its track's end is written empty, so that it stays at the end when the data
    change;
  - limits keep the page's order, and `abroad=no` is written only while the switch is off;
  - a page without a selection has no `#`;
  - the part after `#` is never sent to a server.
- **The address follows the selection** once it has stayed the same for half a second: after a
  drag, a key, adding or removing a limit, the switch, or "Zurück zum echten Ergebnis". It
  replaces the history's entry, so "Back" leaves the page as before. It changes at most 20 times
  in 10 seconds, below every browser's limit. No button.
- **Opening a link applies its selection** once the characteristics have loaded:
  - each bound takes the step whose value is nearest the link's;
  - a reload keeps the selection;
  - a link pasted into a tab that shows the same vote applies its selection too.
- **A link that cannot be fully used:**
  - the page applies the parts it can;
  - a sentence at the limits names, as written in the address, the parts it could not: an
    unknown key, a characteristic given twice, a malformed or crossed bound;
  - the sentence goes with the visitor's next change of the selection;
  - a vote that no longer exists gives the site's 404, as it does today;
  - the page of a tie-break question, which has no limits, ignores the part after `#`.
- **The language switch carries the selection**, in place of "A selection stays behind". The
  municipality clicked and the map's view still stay behind.
- **The guide says so:** its section "Gemeinden auswählen" adds that the page's address holds
  the selection, and that whoever opens it sees the same selection.
- **The investigation:** `investigations/share-link.md`, with its script.

## Non-goals

- **No button** to copy or share the link, and no short link (Q).
- **No history step per change** (Q): "Back" does not undo a limit.
- **The municipality clicked and the map's view are not part of the link.**
- **No change for the addresses of before.** `/votes/<id>/` and the address without a language
  never carried a selection, and their redirects stay as they are.
- **No query (`?`)** (Q): unlike the part after `#`, it is sent to the server with the request.
- **No catching of the browsers' errors.** The half second keeps the page below their limits.
- **No change to the data, the pipeline or the calculation.**

## Capabilities

### New Capabilities

- `share-link`: the selection in the page's address:
  - its form;
  - writing it as the selection changes;
  - reading it when the page opens and when its hash changes;
  - the parts it cannot use;
  - the page of a tie-break question.

### Modified Capabilities

- `limits`: "Limits belong to the page" opens a vote's page with the selection its address
  carries, and with none otherwise.
- `interface-languages`: "Changing the language" carries the selection to the other language.
- `reading-guide`: the section "Gemeinden auswählen" says that the address holds the selection.

## Impact

- **App:**
  - a new module in `app/src/lib/` that writes and reads a link, in plain TypeScript, with its
    unit tests;
  - the vote's page applies an address's selection when the characteristics have loaded and on
    `hashchange`, writes the address with SvelteKit's shallow `goto` half a second after the
    selection's last change, and holds the sentence of the unusable parts;
  - `Limits.svelte` shows that sentence;
  - `[lang]/+layout.svelte` adds the page's hash to the switch's links, in the browser;
  - the texts in three languages: the sentence and the guide's addition.
- **Browser tests:** a new file for `share-link`: the address after a drag and after a held key,
  opening a link, a reload, a link in the same tab, unusable parts, the switch, a tie-break
  question; the test of "A selection stays behind" follows the change.
- **Docs:**
  - `CLAUDE.md`'s code map and "Where things are";
  - `docs/roadmap.md`;
  - `investigations/share-link.md` and `investigations/share-link/`.
