# Design

## Context

What the change builds on:
- **The selection lives in the vote's page.** `[lang]/votes/[id]/+page.svelte` holds `limits`
  (each a `LimitSetting`: its track, and its two bounds as steps from 0 to 1,000) and
  `abroadCounted`. `Limits.svelte` binds both and changes them in `add`, `move`, `remove`,
  `backToReal` and the switch's `bind:checked`.
- **A track needs the characteristics.** `trackOf(definition, file, applyingTo(file, voteDate))`
  makes a limit's track. The page loads `characteristics.json` once per visit, after it has
  mounted (`loaders.ts`), so a selection can only be applied once that file has loaded.
- **The language switch** in `[lang]/+layout.svelte` builds its links with `resolve`, by route
  (`addressIn`), with `data-sveltekit-reload`, at prerender time.
- **SvelteKit 3.2.0:**
  - `replaceState` of `$app/navigation` is deprecated in favour of
    `goto(url, { state, shallow: true, replace: true })`;
  - a call of `history.replaceState` by the app conflicts with the router, and SvelteKit warns
    about it in development;
  - `url.hash` throws on the server and in `load` (investigation, 2).
- **A tie-break question's page** has no entries per canton (`data.entries` is null), no limits
  and no map.

`investigations/share-link.md` gives the facts:
- the browsers' limits on address changes, and the events a slider sends (1);
- SvelteKit's shallow `goto`, and that an address change fires no `hashchange` (2);
- a link pasted into a tab that shows the same vote (3);
- the length of a link (4);
- values and steps (5);
- what a change of the data moves (6).

## Goals / Non-Goals

**Goals:**
- **The link in plain TypeScript.** One module writes a selection as a link and reads a link
  into a selection, the unusable parts with it. It is tested without a browser, like the rest of
  `app/src/lib/`. The page and the layout only connect it.
- **The address as the one place of the selection outside the page.** Nothing is stored in the
  browser, and nothing is sent to a server.
- **No new dependency.**

**Non-Goals:**
- **Following the browser's "Back" and "Forward" within the page**: the page adds no history
  entries, so there is nothing to follow.
- **A link to the old addresses** (`/votes/<id>/`) or to the address without a language.
- **Shortening the link**, by a code or a service.

## Decisions

### 1. The selection after `#`, by value (Q)

The selection is written after `#`, as `<key>=<lower>-<upper>` for each limit in the page's order,
then `abroad=no` while the switch is off, joined by `&`. The keys are those of the definitions in
`characteristics.ts` (`Definition.key`), the same in every language. The bounds are values, as
their labels write them without the unit and the apostrophes: `foreigners=-19.98`.

Alternatives considered:
- **A query (`?foreigners=…`)**: sent to the server with every request, which the part after `#`
  never is.
- **Steps (`foreigners=0-327`)**: shorter, but a step means another value when an update of the
  data moves a track's ends; a value keeps its meaning (investigation, 6).
- **An encoded object** (JSON in base64): no one could read or write it by hand, and it is longer.

### 2. A bound at its track's end is written empty (Q)

A bound whose value is its track's end, the side that sets nothing aside (`isNarrowed`), is
written empty: `foreigners=-19.98` for an upper bound only, `foreigners=-` for a limit that sets
nothing aside yet. Read, an empty bound takes its track's end.

The reason: an update of the data with a newer list of municipalities can move a track's ends.
Shares and quotients stay or move inward, but the largest inhabitants and area can grow by a
merger (investigation, 6). A bound written as today's largest value would then set the new
largest municipality aside; an empty bound stays at the end.

Alternative considered: **the end's value**, so every bound is a number. That fails as above, a
rare case, but silently.

### 3. Reading a value: its units, then the nearest step

A bound is read as a number with at most the decimals its label writes, the units of its last
decimal: "19.98" is 1998, "20" is 2000 for a share. A number with more decimals, or anything else,
is unusable. The bound then takes the step whose value (`valueAt`) is nearest, of two the lower,
found by going through the 1,001 steps.

Every value of a step comes back to a step of the same value; a value that no step has lands at
most half a gap away (investigation, 5).

Alternative considered: **inverting the track's formula** (linear, logarithmic, the step to zero)
to compute the step. That is faster, but its rounding must match `valueAt`'s exactly. The search
is exact by construction, and 42 searches of 1,001 steps fit the budget (decision 10).

### 4. The parts of a link, and those it cannot use

The page reads the part after `#` with `URLSearchParams`, which decodes what a messenger may have
encoded, keeps the order and the repeats, and never throws. A part is unusable when:
- its key is no characteristic's and not `abroad`;
- its characteristic came before in the link;
- it has no single `-` between two bounds;
- a bound is no number with at most its label's decimals;
- its lower bound's step lies above its upper bound's;
- `abroad` has any value but `no`.

The usable parts apply (Q). The unusable ones are named in the sentence, each as `<key>=<value>`,
decoded, in « », in the order of the address. The sentence stands below the guide's sentence in
the section "Gemeinden auswählen". The texts:
- German: "Diese Angaben der Adresse liessen sich nicht anwenden: «rainfall=1-2»."
- French: "Ces indications de l'adresse n'ont pas pu être appliquées: «rainfall=1-2»."
- Italian: "Queste indicazioni dell'indirizzo non hanno potuto essere applicate: «rainfall=1-2»."

The sentence goes at the visitor's next change of the selection. The page keeps the link it
applied and its unusable parts, and forgets the parts once the selection's link differs from it.

### 5. The address follows after 500 ms at rest (Q)

The page derives the selection's link from `limits` and `abroadCounted`. An effect starts a timer
of 500 ms whenever the link changes or the page has read its address, and clears the previous
one. When the timer fires, and the link differs from the browser's address or from the address as
SvelteKit knows it, `(page.shallow?.url ?? page.url)`, the page writes the address with
`goto(page.url.pathname + link, { shallow: true, replace: true })`: its own path, with the site's
path and the final slash. A shallow `goto` keeps scroll and focus; it sets `page.shallow.url` and
leaves `page.url` as it was (decision 8).

Planned as `goto(<the page's address by resolve> + link, …)`, when the link differs from the
address's. Applying found that `resolve` gives the path without the final slash, and that the lint
rule `svelte/no-navigation-without-resolve` accepts no address built from it: the page writes its
own path, with the rule's warning suppressed and the reason beside it (Q, 2026-11-19). The
verification found that a link opened in the tab, whose selection the page already showed but
written otherwise (`#foreigners=-20` for `-19.98`), stayed as it was opened: a reading now restarts
the timer, and the browser's address is compared too (Q, 2026-11-20).

The writer starts only once the address has been read (decision 6). So the address keeps its
selection while the characteristics load, and when they cannot be loaded.

The reasons:
- **One rule for every input:** a drag, a held key, a button, the switch.
- **Below every limit:** at most 20 changes in 10 seconds, against Safari's 100 and Chrome's and
  Firefox's 200 (investigation, 1).
- **No error to catch.** The browsers' errors would stop the page's update (Safari, Firefox), or
  leave an older address (Chrome).

Alternatives considered:
- **At once, throttled** (Q chose against): the address is current right after a drag, at the
  cost of a timer and the time of the last write.
- **At every change**: a held arrow key makes 10 to 30 a second (investigation, 1).
- **`replaceState` of `$app/navigation`**: deprecated in SvelteKit 3.2.0.
- **`history.replaceState` itself**: it bypasses the router, which keeps its own state in
  `history.state`.

### 6. Reading the address: when the characteristics have loaded, and on `hashchange` (Q)

When the characteristics have loaded, the judged vote's page reads `location.hash`. If there is a
selection, the page makes its tracks, sets `limits` and `abroadCounted` and keeps the unusable
parts; then it starts the writer.

On `hashchange`, which only a change from outside fires (investigation, 2 and 3), the page reads
the address again and replaces its selection. A `hashchange` before the characteristics have
loaded changes nothing: the page reads the address it has when they load.

Alternative considered: **reading at load only** (Q chose against): a link pasted into a tab that
shows the same vote would leave the old selection under the new address.

### 7. The tie-break question's page ignores the address (Q)

The reading and the writer run only on the page of a judged vote, where the limits are. A
tie-break question's page neither reads its address nor changes it. Alternative considered:
**a sentence** saying that a selection does not apply; it would be three texts and a test for a
link the site never writes.

### 8. The language switch adds the page's hash (Q)

The switch's links to the two other languages add the hash of the address as SvelteKit knows it,
`(page.shallow?.url ?? page.url).hash`, in the browser only: the prerendered page's links have
none, as `url.hash` is not available while prerendering. With `data-sveltekit-reload`, the other
language's page loads anew and reads the hash as any link's.

Planned as `page.url.hash`, on the belief that a shallow `goto` changes `page.url`. Applying found
that it does not: it sets `page.shallow.url`, and a link opened in the tab changes neither (found
while applying, investigation). So the writer of decision 5 compares the selection's link with
that address, not with `location.hash`: after reading a link opened in the tab, it writes the
address once more, and the links follow (Q, 2026-11-20).

The links carry the selection the address holds, up to half a second old. A visitor who follows
"Français" within half a second of a change carries the selection before it.

Alternatives considered:
- **A shared state of the selection** between the page and the layout: always current, but a
  state outside the page, for a lag of half a second.
- **Reading `location.hash` when the link is clicked**: the same lag, and a handler on the links;
  the link shown on hover, copied or opened in a new tab would carry no selection.
- **A hash of the layout's own**, kept from `location.hash` on `hashchange` and after each shallow
  `goto`: as current, with a listener and an effect in the layout.

### 9. The guide says that the address holds the selection (Q)

The guide's section "Gemeinden auswählen" ends with a third paragraph:
- German: "Die Adresse der Seite hält Ihre Auswahl fest: Wer sie öffnet, sieht dieselbe Auswahl."
- French: "L'adresse de la page retient votre sélection: qui l'ouvre voit la même sélection."
- Italian: "L'indirizzo della pagina conserva la Sua selezione: chi lo apre vede la stessa
  selezione."

Alternatives considered: the sentence at the limits, on every vote's page, a line or two more on a
phone; or nothing.

### 10. The budget

- **A step of a slider** keeps its 16 ms per frame (spec limits). The step itself only restarts a
  timer; the address is written half a second after the selection's last change, outside the
  steps. The limits' budget tests run with it unchanged.
- **Applying a link** makes up to 21 tracks, `trackOf` over the list's 2,110 municipalities each,
  and up to 42 searches of 1,001 steps, then recalculates as a jump does. On `hashchange`, each
  frame takes at most 100 ms of main-thread work, twice a jump's budget (spec share-link, "The
  budget of a link"); a browser test measures it with all 21 limits, as the limits' budget tests
  do. Planned as 50 ms, a jump's budget; applying found 55 to 94 ms, about 27 ms of it making the
  21 tracks as the link is read, and Q raised it (2026-11-20) rather than make the tracks when the
  page loads: a link opened in the tab that shows its vote is rare.
- **When the page opens**, applying a link shares its frames with the map's first drawing. The
  page load has no budget of its own, as before.

### 11. The tests

- **Unit tests of the link module**, against `characteristics.json`:
  - writing: the forms of decisions 1 and 2;
  - reading: values, fewer decimals, empty bounds, each unusable part;
  - the round trip of every step of every characteristic on the vote day of 2016-02-28;
  - the nearest step of a value no step has, and the lower of two.
- **Browser tests** in `app/e2e/share-link.spec.ts`, one per scenario of the spec. "A held key"
  counts the page's calls of `history.replaceState` with a script added before the page loads.
  The count does not depend on Chrome's limit, which Playwright switches off (investigation, 1).
- **The test of "A selection stays behind"** (`languages.spec.ts`) becomes "A selection goes
  along".

## Risks / Trade-offs

- **[The switch lags by half a second]** → Accepted with decision 5 (Q). The language a visitor
  ends in shows the selection the address held.
- **[SvelteKit's announcer reads the page's title]** once per visit, half a second after the
  first change of the selection, as a shallow `goto` runs the navigation hooks (found while
  applying, investigation) → Accepted (Q, 2026-11-20): later changes do not repeat it, and focus
  stays on the slider.
- **[A shallow `goto` in a later SvelteKit]** writes the address differently → The browser tests
  check the address, the history and, through the switch, the address as SvelteKit knows it.
- **[An update of the data moves a value off its step]** → The bound lands at most half a gap away
  (investigation, 5), and its label shows the value it now has.
- **[Safari and Firefox are not tested here]** → The half second keeps the page at a fifth of the
  strictest limit. Q's check by hand on a phone includes Safari on iOS: a held arrow key on a
  hardware keyboard if one is at hand, else a drag, then a reload.
- **[A messenger cuts a long link]** → 505 characters at most with all 21 limits
  (investigation, 4).
- **[Chrome starts to throw beyond its limit]** (a PSA for Chrome 144, investigation, 1) → The
  page stays far below it.

## Migration Plan

None: no link carried a selection before. A link made with this change keeps working as long as
its characteristics' keys do. A later change that renames a key would make that part of old links
unusable, which the sentence then names.

## Open Questions

None.
