# Design

## Context

What the change builds on:
- **A vote's page** (`app/src/routes/votes/[id]/`) is written at build time.
  - `vote-page.ts` calculates its result with `calculateResult` over all entries and writes
    the figures, the two verdicts and the table of the cantons.
  - `mapFiguresOf` (`result-map.ts`) puts each municipality's yes and no votes on the page for
    the map, checked against `map.json`, and counts the Swiss abroad. The browser never loads a
    vote's file.
- **The calculation** (`calculation/`) takes "the entries that remain": an entry has a canton,
  yes and no votes. A canton with no entry left already has no cantonal vote, and fewer are
  needed. Nothing in it knows about limits yet.
- **The map** (`ResultMap.svelte`):
  - loads `map.json` and `municipalities.json`, and `characteristics.json` apart, through two
    loaders created in its module script, each requested once per visit;
  - its `fills` are a `$derived` map from municipality to colour;
  - its loaded files are raw state (design of `tighten-map-budget`, decision 2).
- **The characteristics** (`characteristics.ts`): 21 definitions, each with name, unit, source,
  year and a `value` that gives a quotient of counts, or none.
  - `applyingTo` gives a vote's years.
  - `written` writes a value as the panel shows it, with the rounding of `format.ts`: half away
    from zero, in whole numbers.

`investigations/limits.md` holds the facts found while proposing:
- the Swiss abroad's share (1.00% to 1.57%) and the one verdict they change (5950);
- where a figure is missing: parties only; Rüti bei Lyssach and Jaberg in 40 votes;
- the ends of every track;
- the results of six named selections;
- the greys against the map's colours;
- the floor of a frame in which many fills change: 1.9 ms for 100, about 5 ms for 1,000, 7.7 to
  12.4 ms for all 2,110, with single frames up to 21 ms.

## Goals / Non-Goals

**Goals:**
- **One rule for which municipalities and Swiss abroad remain**, in the calculation, tested
  there, so that the voting rules and the selection are both pure and exist once.
- **A limit made from its characteristic's one definition**: its track, label and values,
  against the predecessor's failure mode 5.
- **Comparisons in whole numbers**, as the panel writes values, so that what is shown is what
  is filtered.
- **The map and the verdicts follow a drag within 16 ms per frame.**

**Non-Goals:**
- **A slider of the app's own**, typing a bound, or clicking a bare track to move a bound
  (decision 7).
- **Keeping limits across pages or visits** (#11 gives the link).
- **The phone's layout** (#10).

## Decisions

Q decided decisions 1 to 15 on 2026-11-16, while exploring and proposing, each from the options
and the facts of the investigation. Decisions 16 to 19 were proposed while exploring and not
objected to; the others follow from them or from the code. All are open to Q's review of this
change.

### 1. The Swiss abroad have a switch of their own (Q)

A switch "Auslandschweizerinnen und Auslandschweizer mitzählen (in jedem Kanton, in dem eine
Gemeinde übrig ist)", on when the page opens. With every limit at its ends and the switch on,
the page shows the official result (hard constraint 1).

Alternatives considered:
- **Set aside as soon as a limit is narrowed.** It fits "only municipalities of a kind", but the
  first touch moves the result by 1% to 1.6% and turns vote 5950.
- **Always counted.** A canton cut down to nothing would keep a cantonal vote from its Swiss
  abroad alone, against hard constraint 2.
- **Counted with their canton** while one of its municipalities remains, without a switch.

### 2. With the switch on, a canton's Swiss abroad go with its last municipality (Q)

While the switch is on, the entry of a canton's Swiss abroad remains when at least one
municipality's entry of that canton remains. "That canton" is the canton the entry counted for
in the vote's file, so Moutier counts for BE before 2026, as its result does. Hard constraint 2
holds as written. The switch's label says so, and so does the guide.

Alternatives considered:
- **The Swiss abroad alone decide the canton**, as a real canton's would: hard constraint 2
  reworded, and a tiny Swiss abroad entry could carry a cantonal vote.
- **Their votes count for the voters, but the canton has no cantonal vote:** not a real rule.

### 3. A narrowed limit sets aside a municipality without a figure (Q)

Only the party strengths lack figures (5 to 7 municipalities of Bern). A limit at both ends sets
nothing aside, so adding a limit changes nothing until it is moved. The guide says so.

Alternative considered: **kept**, a limit not applying to it. A visitor who keeps "SVP from 40%"
would find a municipality without an SVP figure counted.

### 4. A municipality without a result stays hatched (Q)

Hatched means "no result of its own" whatever the limits; dark grey means only "set aside". Its
votes are in a neighbour's figures, so the selection changes no count through it.

Alternative considered: **dark grey when outside**, which would hide that its votes are counted
elsewhere.

### 5. Linear tracks, and logarithmic ones for four characteristics (Q)

Inhabitants, inhabitants per km², area and cattle per inhabitant are logarithmic; the rest are
linear. Each definition says which (spec `characteristics`). On a linear track the middle of the
inhabitants would be 198,493, more than every municipality but Zürich.

Alternatives considered:
- **By rank:** equal numbers of municipalities per step. One rule for all, but the track is not
  proportional to the value.
- **Linear everywhere:** the skewed five unusable.

### 6. The visitor adds the limits they need (Q)

A list "Merkmal hinzufügen" offers the characteristics without a limit, in the panel's order;
choosing one and pressing "Hinzufügen" beside it adds its limit at its full range, and
"Entfernen" removes it.

The button came while applying (Q, 2026-11-16). At first, choosing in the list added the limit at
once. In Chromium an arrow key on a closed list changes its choice at once, so a keyboard user
browsing the list added every characteristic they passed. Alternatives considered then: a button
per characteristic, 21 of them; keeping the list as it was.

Alternatives considered:
- **All 21 at once, in the panel's four groups:** nothing to discover, but a long column.
- **The groups folded.**

### 7. Two of the browser's sliders on one track (Q: "start with the simplest")

Each limit has two `<input type="range" min="0" max="1000" step="1">` laid over one track. The
inputs take no pointer events; their thumbs do (`::-webkit-slider-thumb`, `::-moz-range-thumb`).
So a pointer or a finger drags a thumb, and a click on the bare track moves nothing.
- **Keyboard:** the browser's own, one step per arrow key.
- **Names:** `aria-label` "Untere Grenze: <name>" and "Obere Grenze: <name>".
- **Read-out:** `aria-valuetext` gives the bound as written, not the step.
- **Crossing:** on `input`, a bound moved past the other is set back to the other's step.
- **No dependency.**

Alternatives considered:
- **A slider of the app's own** with the ARIA slider role. Any look, and a track click, but
  keyboard and screen readers to build and test.
- **Sliders and number fields:** twice the controls.

### 8. Budget: 16 ms per frame while dragging, 50 ms for a jump (Q)

- **Dragging:** each frame after a step of a slider, by pointer or key, takes at most 16 ms of
  main-thread work, as the map's frames do.
- **Jumps:** adding or removing a limit, the switch, or "Zurück zum echten Ergebnis" can repaint
  every municipality. Their floor alone is 7.7 to 12.4 ms (up to 21 ms), so they get 50 ms, three
  frames at 60 Hz, not felt as lag.

The browser tests measure as the map's do (design of `add-result-map`, decision 10, and of
`tighten-map-budget`), with a second run when a frame exceeds the budget.

Alternatives considered:
- **16 ms for everything:** a jump may not meet it on a busy machine without tricks.
- **100 ms for any input:** a drag would judder.

### 9. The selection's result beside the real one (Q)

The vote's figures and verdicts stay. Beside them, while a selection applies, "Mit Ihrer
Auswahl" shows:
- the yes and no votes and the yes share;
- the Volksmehr and the Ständemehr, as the vote's own are shown ("nicht nötig", greyed, for an
  optional referendum);
- the outcome.

A selection applies while a limit is narrowed or the switch is off. Two columns from about 640
pixels, one above the other below.

Alternative considered: **replaced in place, marked:** compact, but the real result is out of
sight while comparing.

### 10. The table of the cantons follows the selection (Q)

While a selection applies, the table is headed "Mit Ihrer Auswahl" and shows each canton's
figures from what remains. A canton of the vote with nothing left keeps its row, with "–" and
"keine Gemeinde übrig", so that it is visible why the cantonal votes add up to less than 23.

Alternative considered: **always the real table.**

### 11. A sentence at the limits and a page of its own (Q)

The sentence opens the section and links to "Lesehilfe" at `/guide/`, a prerendered page. It has
seven sections, which spec `reading-guide` names; its texts are in `texts.ts`. Its sources name
the reference date of the list and the lakes' set from `map.json`, as the map's source does, and
it links to `data/sources.json`. The start page links to it too.

Alternatives considered:
- **Everything on the vote's page, folded:** repeated on 125 pages and long on a phone.
- **The page only:** a visitor who never follows the link never learns it is a thought
  experiment.

### 12. Set aside is dark grey, `#2c2c2c` (Q)

Every grey from `#808080` to `#dcdcdc` lies within a Delta E of 4.0 of a yes colour for a
red-green colour vision deficiency. `#2c2c2c` is at least 15.5 from every colour of the map
(investigation, 6). The legend adds "Nicht in der Auswahl" while something is set aside. The
details add "Nicht in der Auswahl." to a set-aside municipality's own figures.

Alternatives considered:
- **`#999999`:** about 1 in 12 men could not tell it from yes.
- **`#999999` with dots:** a second pattern beside the hatching.

### 13. The limits between the verdicts and the map (Q)

Below the outcome, above "Karte der Gemeinden", in the page's column. Verdicts and limits are seen
together; #10 revisits the layout for phones.

Alternative considered: **beside the map, above the panel:** the verdicts out of view while
dragging.

### 14. The number of municipalities that remain (Q)

"In der Auswahl: <n> von <m> Gemeinden mit eigenem Ergebnis.", counting entries of
municipalities; "Keine Gemeinde mit eigenem Ergebnis ist übrig." for none. An empty or tiny
selection explains a failed vote.

### 15. No turnout for the selection (Q)

The page holds only canton, yes and no per entry. The vote's own turnout stays.

### 16. Values compared as written, in whole numbers

A limit compares each municipality's value as the panel writes it, taken as a whole number of
the units of its last digit:
- hundredths of a percent for a share;
- whole inhabitants;
- whole inhabitants per km²;
- hundredths of a km²;
- thousandths of a head of cattle per inhabitant.

A bound is such a number too, and both bounds are included.
- **No float compare:** a panel value "19.98%" and a bound "19.98%" are the same number.
- **One function** gives the units of a value, with the rounding of `format.ts`. The panel's
  `written` writes those units, so the panel and the limits cannot drift apart. A unit test
  compares the old and new writing for every municipality and characteristic of a vote.

Alternative considered: **exact quotients.** A municipality shown at "19.98%" could then fall
outside a bound written "19.98%".

### 17. 1,000 steps from the smallest to the largest value

A track's ends are the smallest and the largest value, in units, of the municipalities of the
list with a figure, for the vote's figures. So at its ends a limit sets nothing aside, and
"narrowed" means a bound away from its end.
- **Linear:** step *s* is `smallest + (largest − smallest)·s/1000`, rounded half up in whole
  numbers.
- **Logarithmic:** `smallest·(largest/smallest)^(s/1000)`, rounded as `Math.floor(x + 0.5)`.
  With a smallest value of 0 (cattle), step 0 is 0 and steps 1 to 1,000 run from the smallest
  value above zero.
- **Precision:** 1,000 steps give each arrow key a small move. Values such as 19.98% are fine
  to read; not every round bound is a step (the foreigners' 20.00% is not).

`investigations/limits/reference_selections.py` writes the same formula a second time; the unit
tests compare named steps with it.

Alternatives considered:
- **Round steps** (0.1 points) with ends rounded outward: rounder labels, but a rule per unit, and
  logarithmic tracks have no round steps.
- **One step per distinct value:** that is the rank scale Q did not choose.

### 18. Limits live and die with the page

Opening a vote, from anywhere, starts with no limit and the switch on. The state is `$state` of
the page's component, which SvelteKit creates anew for each vote.

Alternative considered: **kept in memory across votes.** That is half of #11 and #12, without
their decisions on characteristics whose figures differ between votes.

### 19. The selection is the calculation's; it takes plain numbers

`calculation/src/selection.ts`, exported from the package:
- **`remainingMunicipalities(numbers, limits)`:** each limit is the values in the order of
  `numbers` (a whole number, or `null` without a figure) and its lower and upper bound. It gives
  the numbers that remain. A limit whose bounds lie at or beyond the smallest and largest of its
  values is not narrowed and sets nothing aside. This is where the rule lives, not in the app.
- **`entriesThatRemain(cantons, remaining, abroadCounted)`:** from the vote's entries per canton,
  the municipalities' and the Swiss abroad's apart. It gives the `Entry` list `calculateResult`
  takes, by decision 2.

The calculation stays without DOM, framework and data format: it does not know the
characteristics, only numbers. `openspec/config.yaml` puts "the limits on characteristics" in the
calculation.

Alternatives considered:
- **In the app:** against the module boundary, and harder to test without the DOM.
- **The calculation reads `characteristics.json`:** it would depend on the data format.

### 20. The page holds its entries per canton

`mapFiguresOf` becomes `voteEntriesOf`, with the same checks against the map. Per canton in the
order of the file, it gives the municipalities' `[number, yes, no]` and the Swiss abroad's
`[yes, no]` or none, with the numbers without a result. It also gives the vote's kind of majority
(`Majorities`), so that the browser can calculate.
- **The map** flattens the municipalities once for its colours, as `figures` did before.
- **Size:** for 5960 the entries are 31,595 bytes (13,395 gzipped), where the map's figures were
  much the same. The page's HTML, 43.5 KB today, grows by a few KB.

### 21. The state, and what follows it

The vote page (`+page.svelte`) holds the selection:
- `limits`: a list of the characteristic's index and both steps;
- `abroadCounted`.

A new component `Limits.svelte` lays out the section and changes them. The page derives:
- the remaining municipalities: `remainingMunicipalities`, with each limit's values computed once
  when it is added;
- the entries that remain, the result (`calculateResult`), and the selection's figures, verdicts
  and table (a `judged` part of `vote-page.ts`, shared with the build);
- the set of set-aside numbers, which goes to `ResultMap` as a prop for the fills, the legend and
  the details.

Each loaded or computed structure is `$state.raw` or a `$derived` of plain values, without deep
proxies (design of `tighten-map-budget`, decision 2).

The characteristics loader moves from `ResultMap`'s module script to a module of the route,
`loaders.ts`, which `ResultMap` and `Limits` both use. It is one promise, so the file is requested
once. The limits show "Die Merkmale werden geladen …" until then, and the failure text when it
fails.

### 22. The tracks in `limits.ts`

`app/src/lib/limits.ts`, plain TypeScript:
- a limit's track from a definition, the file and the vote's years: the values in units per
  municipality, the ends and the step's value;
- the label "<name> (<date>): von … bis …" (decision 16);
- the selection's figures for the screen.

`characteristics.ts` gains each definition's scale and the units of a value; `format.ts` gains
writing a number of units with its decimals.

### 23. Texts, the guide, the start page

- **Texts:** every new text is in `texts.ts`, German.
- **The guide:** `app/src/routes/guide/+page.svelte` and `+page.server.ts`, which reads `map.json`
  at build time for the date and the lakes' set.
- **The start page** links to it below its heading.
- **`openspec/config.yaml`:**
  - hard constraint 3 gets the budget of decision 8;
  - the glossary's "set aside" says dark grey;
  - "selection" names the Swiss abroad of decision 2.

### Tests

- **Calculation (Vitest):** one test per scenario of the rule, with made-up numbers, each seen to
  fail first:
  - a bound included;
  - no figure under a narrowed limit and under a full one;
  - several limits;
  - the Swiss abroad on and off, and a canton with nothing left;
  - nothing remains.
- **App (Vitest):**
  - the tracks' named steps against `investigations/limits.md`: 19.98% and 20.04%, 3,508, 0.001
    and 0.090, the ends of "65 Jahre und älter" and of "0–17 Jahre";
  - the labels;
  - the units of every municipality's every value, written, equal to the panel's text for the
    votes 5960 and 6400;
  - the six selections of the investigation's table, from the data files, with every figure;
  - `voteEntriesOf` and its checks.
- **Browser (Playwright):**
  - one test per scenario of `limits`, `reading-guide` and the modified scenarios of `verdicts`
    and `result-map`;
  - the existing tests unchanged;
  - the budget: the map's measuring script gains the events `input` and `change`; drag a thumb by
    pointer across the track and back for 16 ms; the jumps for 50 ms; each in a `describe` with
    one retry, as the map's budget tests.
- **A mutant per budget:** with a delay of 20 ms (and 60 ms) put into the handler while the test
  is written, the test fails, then the delay goes.

### Dependencies added

None. The sliders are the browser's own, and the guide is a prerendered page of the site.

### Performance budget

- **A step of a drag:** at most 16 ms of main-thread work per frame (decision 8), measured by the
  browser tests. It costs:
  - one comparison per municipality and narrowed limit;
  - the entries and `calculateResult` over about 2,117 entries;
  - the fills of the municipalities whose state changed. Svelte sets an attribute only when it
    changes, but runs the 2,110 fill effects.

  Expected a few ms; the floor of 100 changed fills is 1.9 ms.
- **A jump:** at most 50 ms per frame (decision 8). Its floor is up to 21 ms when every fill
  changes.
- **Building a limit's values:** once per added limit, 2,110 values; part of the 50 ms of adding
  it.
- **Loading:** nothing new; the characteristics are loaded for the panel already.

## Risks / Trade-offs

- **[A drag over a dense part of a track changes hundreds of fills in one frame]** → The browser
  test drags across the whole track of "Einwohner", the densest. If it fails, the fills move to
  a class per path, toggled only for the municipalities whose state changed, without Svelte's
  per-path effects.
- **[A click on a bare track does nothing]** → Decision 7. The thumbs and the keys work; a later
  change can replace the control.
- **[The first touch of the switch turns vote 5950]** → Intended (decision 1). The guide names
  the Swiss abroad's share.
- **[A bound such as 20.00% is not a step]** → Decision 17. The label shows the exact bound.
- **[Hatched municipalities inside a set-aside area]** → Decision 4. The legend and the details
  say what hatching means.
- **[Dark grey makes a narrow selection heavy]** → Decision 12; what remains stands out. The
  canton borders fade on it, the municipalities' white borders stay.
- **[The guide's texts age]** → They name no figure that changes with a run, except the dates
  read from `map.json` at build time.

## Migration Plan

1. Apply; `./scripts/verify-local.sh` passes. No data file changes.
2. Merge by rebasing. CI publishes the site with the limits.
3. Check by hand, on a computer and on a phone:
   - `/votes/5960/`: add "Ausländeranteil", drag, see the map and "Mit Ihrer Auswahl" follow;
   - the switch on `/votes/5950/`;
   - the guide and its links;
   - a keyboard-only pass over the limits.
4. Rollback: revert the commits on `main`. The limits, the guide and the entries on the page go,
   and the page is as before.

## Open Questions

- **The wording of the guide's sections** beyond the sentences the spec fixes is drafted in
  `texts.ts` while applying, and reviewed in the pull request. It changes no requirement.
