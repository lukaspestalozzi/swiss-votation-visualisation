# Vote comparison

Found while proposing `add-vote-comparison` (#12 of `docs/roadmap.md`), on 2026-11-20, against
the site built from `2b33f14` (the archive of `add-share-link`) and its data files. It answers what
#12 needs to decide how the same selection of municipalities applies to two votes:
- whether the same limits keep the same municipalities on two vote days;
- the results of two named comparisons;
- what a page that compares two votes would load, and how large it is;
- what recalculating two votes costs in a frame;
- where the result boxes of a vote's page stand on a phone.

It decides nothing: the design of `add-vote-comparison` records the decisions.

Words used here: a **selection** is a set of limits and the switch for the Swiss abroad (spec
limits); the **figures that apply** to a vote are those of the last year and election before its
day (spec characteristics, "The figures that apply to a vote"); a **file of entries** is
`app/static/data/votes/<id>.json`.

## How to reproduce

The scripts are in `investigations/vote-comparison/`. Four run in Node 24, which runs the app's
own `.ts` files with their types stripped; `layout.mjs` uses the global Playwright against the
built site; `reference_comparisons.py` is Python, standard library only, apart from the app.

```sh
node investigations/vote-comparison/same_limits.mjs "$PWD"
node investigations/vote-comparison/calc_cost.mjs "$PWD"
node investigations/vote-comparison/sizes.mjs "$PWD"
node investigations/vote-comparison/first_vote.mjs "$PWD"
python3 investigations/vote-comparison/reference_comparisons.py
pnpm run build
(cd app && pnpm exec sirv build --port 4174) &
node investigations/vote-comparison/layout.mjs
```

| File | What |
|------|------|
| `same_limits.mjs` | Four selections of `investigations/limits.md`, 5, by value, on the vote day of 2016-02-28 and on five other days: how many municipalities each keeps, and how many leave and join against 2016-02-28; then the first and the last vote day. |
| `calc_cost.mjs` | One recalculation of the vote of 2016-02-28 under a selection that keeps two of every three municipalities, `entriesThatRemain` and `calculateResult`, averaged over 1,000. |
| `sizes.mjs` | The files of entries and `votes.json`, plain and gzipped; a list of the judged votes (id, date, title) in each language; the votes per vote day. |
| `first_vote.mjs` | "Ausländeranteil" up to 19.98%, read as a link on the track of the vote day of 2016-02-28 and of 2020-09-27: the step and the limit's label. |
| `reference_comparisons.py` | The results of two named comparisons, by the rules of the selection as `investigations/limits/reference_selections.py` writes them apart from the app, which it imports: the municipalities "Ausländeranteil" keeps by the first vote's figures count in both votes; for contrast, the second vote with the municipalities its own figures keep. |
| `layout.mjs` | A vote's page with a selection (`#foreigners=-19.98`), 360 and 1,280 pixels wide: the width of the two result boxes, the height of the pair, and where the limits begin. |

"Output" at the end of this file is what the scripts printed on 2026-11-20, with Google Chrome
for Testing 153.0.8010.12, the Chromium of Playwright 1.63.0 in the cloud image.

## Answers

### 1. The same limits on two vote days

The same limits, by value, keep the same municipalities on two votes of the same day, as the same
figures apply. On different days they keep different municipalities wherever the figures change
(Output, `same_limits.mjs`):

- **Population** (end of the year before the vote): "Ausländeranteil up to 19.98%" keeps 1,462
  municipalities of the list on 2016-02-28 and 1,239 on 2026-09-27: 243 leave and 20 join. Between
  the first vote day, 2013-03-03, and the last, 2026-09-27, 336 differ. "Einwohner from 3,508":
  576 on 2016-02-28, 630 on 2026-09-27; 84 differ between the first and the last day.
- **Elections** (the last National Council election before the vote): "SVP up to 49.96%" keeps the
  same 1,850 municipalities from the vote of 2016-02-28 to that of 2018-03-04, both after the
  election of 2015, and changes with the elections of 2019 and 2023; 163 differ between the first
  and the last day.
- **The census of 2000** (the languages): "Italienisch from 50.07%" keeps the same 115
  municipalities on every day.

The 1,462 are municipalities of the list; 1,455 of them have a result of their own in the vote of
2016-02-28 (`investigations/limits.md`, 5).

A selection read anew on another vote's track keeps each bound's value at the nearest step. Read
on the track of 2020-09-27 (the population at the end of 2019), "up to 19.98%" lands on step 346,
19.99%; on that of 2016-02-28 on step 327, 19.98% (Output, `first_vote.mjs`).

So "the same selection applied to two votes" has two readings that differ by up to 336 of 2,110
municipalities: the same municipalities, kept by one vote's figures, or the same limits, each
vote keeping the municipalities its own figures put within them.

### 2. Two named comparisons

"Ausländeranteil" up to step 327 of the vote of 2016-02-28, 19.98%, keeps 1,462 of the 2,110
municipalities of the list by the figures of the end of 2015; the Swiss abroad counted. The same
municipalities, applied to a second vote (Output, `reference_comparisons.py`):

| Vote | Result | Municipalities with a result that remain | Yes | No | Yes share | Cantonal votes | Verdict |
|------|--------|------------------------------------------|-----|----|-----------|----------------|---------|
| 5960, 2016-02-28 | real | 2,103 of 2,103 | 1,609,152 | 1,664,224 | 49.1588% | 16½ : 6½ | failed |
| 5960, 2016-02-28 | the selection | 1,455 of 2,103 | 733,402 | 664,373 | 52.4692% | 18 : 4½ (25 cantons) | passed |
| 5970, 2016-02-28 | real | 2,103 of 2,103 | 1,375,098 | 1,966,965 | 41.1452% | 4½ : 18½ | failed |
| 5970, 2016-02-28 | the same municipalities | 1,455 of 2,103 | 654,548 | 769,763 | 45.9554% | 8½ : 14 (25 cantons) | failed |
| 6310, 2020-09-27 | real | 2,104 of 2,104 | 1,233,995 | 1,988,349 | 38.2949% | 3½ : 19½ | failed |
| 6310, 2020-09-27 | the same municipalities | 1,456 of 2,104 | 603,173 | 796,237 | 43.1020% | 4½ : 18 (25 cantons) | failed |

In both comparisons the canton without a municipality left is Basel-Stadt, and the Swiss abroad
of 11 cantons count. On the same day, 2016-02-28, the second vote's own figures keep the same
municipalities. On 2020-09-27 they would keep 1,425 by the population at the end of 2019, 85
differing from the 1,462, and 1,419 with a result: 576,424 yes and 759,648 no votes, 43.1432%.

### 3. What a comparison page would load

A vote's page holds its own entries from the build and loads no file of entries (spec verdicts,
"The page holds its result"). A page that compares votes chosen in the browser needs their entries
there (Output, `sizes.mjs`):

- a file of entries: 57,066 to 60,400 bytes, 24,341 to 25,981 gzipped;
- `votes.json`, every title in three languages: 101,548 bytes, 21,425 gzipped;
- a list of the 124 judged votes (id, date, title in one language), as a page could hold it from
  the build: 16,615 bytes in German, 18,412 in French, 18,024 in Italian, about 5,000 gzipped.

Of the 125 votes, 124 are judged; the one tie-break question has no result per municipality to
compare. 40 of the 44 vote days have several votes, at most 6.

### 4. Recalculating two votes

One recalculation of a vote under a selection, the work a step of a slider does once per vote,
takes 0.066 ms in Node (Output, `calc_cost.mjs`). A comparison does it twice. The longest frame of
the limits' budget test while a bound is dragged was 6.7 ms in the browser, against a budget of
16 ms (archived change `add-share-link`, task 2.5).

### 5. The result boxes on a phone

On a vote's page with a selection, 360 pixels wide, the real result and "Mit Ihrer Auswahl" do not
stand side by side: each is 328 pixels wide and the pair is 790 pixels high, one box below the
other; the limits begin at 1,153 pixels from the top. At 1,280 pixels the two boxes stand side by
side, 616 pixels wide each, and the pair is 386 pixels high (Output, `layout.mjs`). Only the two
verdicts within a box stand side by side at 360 (spec small-screens). The pairs of two votes, one
below the other, would take about 1,600 pixels on a phone.

## Not verified

- The cost of recalculating two votes in the browser: measured in Node only; a comparison page
  does not exist yet. Its budget tests will measure it.
- How long loading a file of entries takes on a slow connection: measured as sizes only.

## Output

```text
$ node investigations/vote-comparison/same_limits.mjs "$PWD"
vote days: 44, 2013-03-03 to 2026-09-27; municipalities 2110
Ausländeranteil up to 19.98%: 2016-02-28 keeps 1462 | 2016-06-05: 1462 (0 out, 0 in) | 2018-03-04: 1434 (41 out, 13 in) | 2020-09-27: 1425 (61 out, 24 in) | 2024-03-03: 1313 (171 out, 22 in) | 2026-09-27: 1239 (243 out, 20 in)
Einwohner from 3,508: 2016-02-28 keeps 576 | 2016-06-05: 576 (0 out, 0 in) | 2018-03-04: 589 (2 out, 15 in) | 2020-09-27: 600 (1 out, 25 in) | 2024-03-03: 625 (1 out, 50 in) | 2026-09-27: 630 (2 out, 56 in)
SVP up to 49.96%: 2016-02-28 keeps 1850 | 2016-06-05: 1850 (0 out, 0 in) | 2018-03-04: 1850 (0 out, 0 in) | 2020-09-27: 1922 (28 out, 100 in) | 2024-03-03: 1865 (64 out, 79 in) | 2026-09-27: 1865 (64 out, 79 in)
Italienisch (2000) from 50.07%: 2016-02-28 keeps 115 | 2016-06-05: 115 (0 out, 0 in) | 2018-03-04: 115 (0 out, 0 in) | 2020-09-27: 115 (0 out, 0 in) | 2024-03-03: 115 (0 out, 0 in) | 2026-09-27: 115 (0 out, 0 in)
Ausländeranteil up to 19.98%: 2013-03-03 keeps 1547, 2026-09-27 1239, 336 differ
Einwohner from 3,508: 2013-03-03 keeps 550, 2026-09-27 630, 84 differ
SVP up to 49.96%: 2013-03-03 keeps 1982, 2026-09-27 1865, 163 differ
Italienisch (2000) from 50.07%: 2013-03-03 keeps 115, 2026-09-27 115, 0 differ

$ node investigations/vote-comparison/calc_cost.mjs "$PWD"
one recalculation: 0.066 ms

$ node investigations/vote-comparison/sizes.mjs "$PWD"
files of entries: 125, 57066 to 60400 bytes, gzipped 24341 to 25981
votes.json: 101548 bytes, gzipped 21425
votes 125, judged 124
a list of the judged votes in de: 16615 bytes, gzipped 4734
a list of the judged votes in fr: 18412 bytes, gzipped 5069
a list of the judged votes in it: 18024 bytes, gzipped 4927
vote days 44: 40 with several votes, at most 6

$ node investigations/vote-comparison/first_vote.mjs "$PWD"
2016-02-28: step 327, Ausländeranteil (Ende 2015): von 0.00% bis 19.98%
2020-09-27: step 346, Ausländeranteil (Ende 2019): von 0.00% bis 19.99%

$ python3 investigations/vote-comparison/reference_comparisons.py
The selection: Ausländeranteil (figures of vote 5960, 2016-02-28) up to step 327, 1998 hundredths of a percent: 1462 of 2110 municipalities of the list remain; Swiss abroad counted

Vote 5960 compared with vote 5970 of 2016-02-28:
  the first vote, real
  vote 5960 of 2016-02-28 (popular-initiative): municipalities remaining 2103 of 2103 with a result of their own; Swiss abroad of AG, AI, BS, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 1,609,152, no 1,664,224, yes share 49.1588%, cantonal votes 16½ : 6½ (26 cantons), failed
  the first vote, with the selection
  vote 5960 of 2016-02-28 (popular-initiative): municipalities remaining 1455 of 2103 with a result of their own; Swiss abroad of AG, AI, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 733,402, no 664,373, yes share 52.4692%, cantonal votes 18 : 4½ (25 cantons), passed
  the second vote, real
  vote 5970 of 2016-02-28 (popular-initiative): municipalities remaining 2103 of 2103 with a result of their own; Swiss abroad of AG, AI, BS, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 1,375,098, no 1,966,965, yes share 41.1452%, cantonal votes 4½ : 18½ (26 cantons), failed
  the second vote, with the same municipalities
  vote 5970 of 2016-02-28 (popular-initiative): municipalities remaining 1455 of 2103 with a result of their own; Swiss abroad of AG, AI, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 654,548, no 769,763, yes share 45.9554%, cantonal votes 8½ : 14 (25 cantons), failed
  for contrast, the second vote with its own figures up to 1998 (1462 remain, 0 differ)
  vote 5970 of 2016-02-28 (popular-initiative): municipalities remaining 1455 of 2103 with a result of their own; Swiss abroad of AG, AI, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 654,548, no 769,763, yes share 45.9554%, cantonal votes 8½ : 14 (25 cantons), failed

Vote 5960 compared with vote 6310 of 2020-09-27:
  the first vote, real
  vote 5960 of 2016-02-28 (popular-initiative): municipalities remaining 2103 of 2103 with a result of their own; Swiss abroad of AG, AI, BS, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 1,609,152, no 1,664,224, yes share 49.1588%, cantonal votes 16½ : 6½ (26 cantons), failed
  the first vote, with the selection
  vote 5960 of 2016-02-28 (popular-initiative): municipalities remaining 1455 of 2103 with a result of their own; Swiss abroad of AG, AI, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 733,402, no 664,373, yes share 52.4692%, cantonal votes 18 : 4½ (25 cantons), passed
  the second vote, real
  vote 6310 of 2020-09-27 (popular-initiative): municipalities remaining 2104 of 2104 with a result of their own; Swiss abroad of AG, AI, BS, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 1,233,995, no 1,988,349, yes share 38.2949%, cantonal votes 3½ : 19½ (26 cantons), failed
  the second vote, with the same municipalities
  vote 6310 of 2020-09-27 (popular-initiative): municipalities remaining 1456 of 2104 with a result of their own; Swiss abroad of AG, AI, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 603,173, no 796,237, yes share 43.1020%, cantonal votes 4½ : 18 (25 cantons), failed
  for contrast, the second vote with its own figures up to 1998 (1425 remain, 85 differ)
  vote 6310 of 2020-09-27 (popular-initiative): municipalities remaining 1419 of 2104 with a result of their own; Swiss abroad of AG, AI, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 576,424, no 759,648, yes share 43.1432%, cantonal votes 4½ : 18 (25 cantons), failed

$ node investigations/vote-comparison/layout.mjs
360 px: {"resultsTop":344,"resultsHeight":790,"limitsTop":1153,"boxes":[328,328]}
1280 px: {"resultsTop":236,"resultsHeight":386,"limitsTop":642,"boxes":[616,616]}
```
