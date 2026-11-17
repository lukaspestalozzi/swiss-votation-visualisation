# Proposal

## Why

The product's question is "what would the result have been if only municipalities of a certain
kind had voted?". The votes, the map and the 21 characteristics are in place; what is missing is
the question itself: limits that keep some municipalities and set the others aside, and a result
recalculated from what remains. Change #8 of `docs/roadmap.md`, `add-limits`, implemented here,
adds them, with the explanation that this is a thought experiment and the sources. It settles
the decisions the roadmap leaves open for it:
- the performance budget (hard constraint 3);
- what a limit does with a municipality that has no figure;
- the form of the controls;
- where the explanation and the sources are shown.

It also settles two that `investigations/data-sources.md` left to #8: what a limit does with the
Swiss abroad and with a municipality that has no result of its own.

## What Changes

- **Limits on the characteristics.** Below the outcome and above the map, under "Gemeinden
  auswählen":
  - the visitor adds a limit for any of the 21 characteristics from a list, and removes it again;
  - each limit has a lower and an upper bound, two sliders on one track from the smallest to the
    largest value of the vote's figures;
  - the track is linear, or logarithmic for inhabitants, inhabitants per km², area and cattle per
    inhabitant, whose values span several orders of magnitude;
  - each limit is labelled in plain words with its characteristic, the date of its figures and
    its two bounds, written as the panel writes values.

  The track's range, the label and the filter all come from the characteristic's one definition
  (failure mode 5 of the predecessor).
- **The selection.**
  - A municipality remains when, for every narrowed limit, its value as the panel writes it lies
    within both bounds, bounds included.
  - A narrowed limit sets aside a municipality without a figure: the party strengths of 5 to 7
    small Bern municipalities. A limit at its full range sets nothing aside.
  - A switch, "Auslandschweizerinnen und Auslandschweizer mitzählen", on by default, counts the Swiss abroad of a canton
    while at least one of its municipalities remains. So a canton whose municipalities are all set
    aside has no cantonal vote, as hard constraint 2 says. Switched off, no Swiss abroad count.
  - A sentence says how many municipalities with a result of their own remain.
  - One button returns to the real result: no limit, the switch on.
- **Recalculated while dragging.** Every movement of a slider, and the switch, recalculates the
  map, the two verdicts and the table of the cantons, without a button:
  - beside the real result, which stays as it is, "Mit Ihrer Auswahl" shows the selection's yes
    and no votes, yes share, both majorities and outcome;
  - the table of the cantons shows the selection's figures, and says which cantons have nothing
    left;
  - on the map, a set-aside municipality is dark grey (`#2c2c2c`), the only grey that stays apart
    from the yes colours for a viewer with a red-green colour vision deficiency
    (`investigations/limits.md`);
  - a municipality without a result of its own stays hatched;
  - the legend names the dark grey while something is set aside, and pointing at a set-aside
    municipality says so.
- **A budget.** Each frame while a slider is dragged takes at most 16 ms of work on the main
  thread, as the map's frames do. A jump that may change the whole map takes at most 50 ms:
  - the return to the real result;
  - adding or removing a limit;
  - the switch.

  Hard constraint 3 in `openspec/config.yaml` gets these figures.
- **The page holds its entries.** For the recalculation, a vote's page holds every entry's canton,
  yes votes and no votes, the Swiss abroad's included, written when the site is built. It still
  loads no file under `/data/votes/`.
- **A reading guide.** At the limits, one sentence says that this is a thought experiment about
  whole municipalities, not about people and not a forecast. It links to a page of its own,
  "Lesehilfe", at `/guide/`, which explains:
  - the real result;
  - the selection and its rules;
  - the Swiss abroad;
  - municipalities without a result or without a figure;
  - the dates of the characteristics.

  It also names every source. The start page links to it too.
- **A new investigation**, `investigations/limits.md`, with its scripts. It gives:
  - the Swiss abroad's share and the one verdict they change;
  - where a figure is missing;
  - the results of named selections;
  - the ends of every track;
  - the greys measured against the map's colours;
  - the floor of a frame in which many municipalities change colour.

## Capabilities

### New Capabilities

- `limits`: the limits on the characteristics and the selection they make:
  - adding and removing a limit;
  - the track, its scale and its label;
  - which municipalities and Swiss abroad remain;
  - the switch, the count and the return to the real result;
  - their loading;
  - the performance budget of the recalculation.
- `reading-guide`: the explanation that the selection is a thought experiment:
  - the sentence at the limits;
  - the page "Lesehilfe" with its sections and its sources;
  - the links to it.

### Modified Capabilities

- `verdicts`:
  - the page holds every entry's canton and votes;
  - "Mit Ihrer Auswahl" beside the real figures and verdicts;
  - the table of the cantons follows the selection.
- `result-map`:
  - set-aside municipalities in dark grey;
  - hatching kept for municipalities without a result;
  - the legend's entry for the dark grey;
  - the details of a set-aside municipality.
- `characteristics`: each characteristic's one definition also gives the scale of its limit's
  track, and limits take everything from it as the panel does.

`result-calculation` is unchanged: it already calculates from the entries that remain, and gives
a canton with no entry left no cantonal vote.

## Non-goals

- **A link that reproduces a vote with its limits:** #11. Limits belong to the page, and opening
  another vote starts without them.
- **The same selection on two votes:** #12.
- **French and Italian:** #9. Every new text is German.
- **The layout on a phone, and touch beyond what the browser's own sliders give:** #10.
- **Typing a bound as a number**, or a slider of the app's own. The browser's slider is the
  simplest control; a later change can replace it.
- **The selection's turnout.** The page holds no registered voters or ballots per entry for it.
- **Limits by canton or by municipality name.** Only the characteristics are limited.
- **More characteristics:** #13.
- **Saving limits between visits.**

## Impact

- **Calculation** (`calculation/`): the selection, which municipalities and Swiss abroad remain
  under limits, with its unit tests. It takes plain numbers, so the characteristics' definitions
  stay in the app. The result itself is calculated as before.
- **App** (`app/`):
  - the vote page's data holds the entries;
  - a new section with the limits and the switch;
  - "Mit Ihrer Auswahl" beside the figures;
  - the table of the cantons, the map's fills, legend and details follow the selection;
  - the definitions gain their scale;
  - a new page at `/guide/`;
  - the start page's link;
  - new texts in `texts.ts`;
  - unit tests;
  - browser tests, the budget's among them.

  No new dependency: the sliders are the browser's `<input type="range">`.
- **Pipeline and data files:** unchanged.
- **Docs:**
  - `openspec/config.yaml`: hard constraint 3's budget, and the glossary's "set aside" and
    "selection";
  - `CLAUDE.md`: code map, "Where things are";
  - `docs/roadmap.md`: #8's row, and the investigation;
  - `README.md`;
  - `investigations/limits.md` and `investigations/limits/`.
