# Limits

Found while proposing `add-limits` (#8 of `docs/roadmap.md`), on 2026-11-16, from the data files
in `app/static/data/` as they were on that day. It answers what the roadmap and
`investigations/data-sources.md` (points 3 and 4) leave to #8: what a selection does with the
Swiss abroad, with a municipality that has no figure and with one that has no result; how
far apart a grey for set-aside municipalities is from the map's colours; and what a frame costs
in which many municipalities change their colour. It also gives the results of named selections,
the figures the specs cite. It decides nothing: the design of `add-limits` records the
decisions.

Words used here, as in the glossary of `openspec/config.yaml`: a **limit** is the lower and the
upper bound on one characteristic; a municipality outside it is **set aside**; the **selection**
is what remains. A limit is **narrowed** when one of its bounds lies inside the range of the
characteristic's values. A value **as written** is the value the panel of characteristics shows,
taken as a whole number in units of its last digit: 32.03% is 3,203 hundredths of a percent,
91.88 km² is 9,188 hundredths of a km².

## How to reproduce

The scripts are in `investigations/limits/`. The two in Python use the standard library only and
read the committed data files; the two in JavaScript use the global Playwright against the built
site, served as the browser tests serve it.

```sh
python3 investigations/limits/reference_selections.py
python3 investigations/limits/check_set_aside_grey.py
pnpm run build
(cd app && pnpm exec sirv build --port 4174) &
node investigations/limits/recolour.cjs
node investigations/limits/render_set_aside.cjs /path/outside/the/repository
node investigations/limits/measure_drag.cjs --runs 5 [--busy] [--trace /path/outside/the/repository]
# profile_drag.cjs reads an unminified build: build with `pnpm exec vite build --minify false` in
# app/, restart sirv, and run
node investigations/limits/profile_drag.cjs --runs 5
```

| File | What |
|------|------|
| `reference_selections.py` | The rules of the selection as the change proposes them, written apart from the app; the Swiss abroad over all votes; the gaps of the characteristics; the tracks and their steps; the results of six named selections; the ends of every track for the vote of 2016-02-28. |
| `check_set_aside_grey.py` | The distance of greys from every colour of the map, with the measure of `map-data/check_colours.py`, whose functions it loads. |
| `recolour.cjs` | The work of a frame in which 100, 1,000 or all 2,110 municipalities change their fill, set by the DOM directly. |
| `measure_drag.cjs` | The frames of a drag of a limit, with a Chrome trace that splits the longest into the main thread's work; with `--busy`, beside a second drag at the same time. |
| `profile_drag.cjs` | The functions that take the script time of a drag, from V8's profile, against an unminified build. |
| `render_set_aside.cjs` | Four images of the map of 2016-02-28 with 817 municipalities set aside, in two greys, with normal vision and with deuteranopia as Chrome emulates it. |

"Output" at the end of this file is what the two Python scripts printed on 2026-11-16; the
measurements of `recolour.cjs` are quoted under answer 6.

## Answers

### 1. The Swiss abroad

Over the 124 votes the calculation judges, the Swiss abroad hold 1.00% to 1.57% of the valid
votes, in 11 or 12 cantons. Without them one verdict changes: the optional referendum of
2015-06-14, the federal act on radio and television (id 5950), passed with 1,128,522 yes and
1,124,873 no votes (50.0810%, the official result, BBl 2015 6313); without its Swiss abroad it
has 1,107,734 yes and 1,113,998 no votes (49.8590%) and fails. The cantonal votes stay 6½ : 16½.

Hard constraint 2 says that a canton whose municipalities are all set aside has no cantonal
vote. That holds only when its Swiss abroad go with them: the twelve cantons with an entry of
their own for the Swiss abroad would otherwise keep a cantonal vote from it alone.

### 2. Where a figure is missing, and where a result is

Of the 21 characteristics only the party strengths lack figures: 5 to 7 municipalities of the
canton of Bern have no election result of their own (`investigations/characteristics.md`, 4).
No municipality has 0 inhabitants in any year, or in the census of 2000, so no share lacks a
whole. 117 to 147 municipalities have 0 cattle, which is a figure.

Most of the municipalities without a party figure have no vote result of their own either: they
are no entry, so a limit on them changes no count. But in 40 votes one of them has a result:
422 Rüti bei Lyssach, without a figure in the election of 2019 (vote days 2021-03-07 to
2023-06-18), and 868 Jaberg, without one in the election of 2015 (vote days 2018-03-04 to
2019-05-19). In the vote of 2021-03-07 (id 6400), Rüti bei Lyssach has 30 yes and 35 no votes.

The 5 to 7 municipalities without a vote result (`investigations/data-sources.md`, 4) have their
votes in a neighbour's figures, which is not recorded. Setting one aside changes no count.

### 3. Values compared as written

A value as written is a whole number, so a bound is one too, and every comparison is exact. It
rounds half away from zero from the counts, as `app/src/lib/format.ts` writes it; the script
does the same in whole numbers. The figures of the panel's spec come out: Zürich in 2016 has
3,203 (32.03% foreigners), 1,793 (SVP 17.93%), 4,320 inhabitants per km², 9,188 (91.88 km²) and
2 (0.002 cattle per inhabitant); Meienried 80, 65 (0.65 km²) and 2,519 (2.519).

### 4. The tracks

A track has 1,000 steps from the smallest value as written to the largest, over the
municipalities of the list with a figure, for the figures that apply to the vote. The value of a
step is rounded half up to a whole number of the characteristic's units. On a linear track the
steps add equal differences. On a logarithmic one they multiply by equal factors; when the
smallest value is 0, step 0 is 0 and the steps from 1 run from the smallest value above zero.
Inhabitants, inhabitants per km², area and cattle per inhabitant span several orders of
magnitude.

For the vote of 2016-02-28, in units of the last written digit (Output, 5):
- inhabitants run from 31 to 396,955, step 500 of a logarithmic track at 3,508;
- inhabitants per km² run from 1 to 10,824, step 500 at 104;
- the area runs from 32 to 43,861 (0.32 to 438.61 km²), step 500 at 1,185;
- cattle per inhabitant run from 0 to 8,158 (0 to 8.158), with 128 municipalities at 0; step 1 is
  0.001, step 500 0.090.

On a linear track the middle would be 198,493 inhabitants, more than every municipality but
Zürich. The shares run over most of their range, each party's from 0, with 7 municipalities
without a figure; Romansh is 0 in 906 municipalities. Not every bound is a step: the foreigners'
track of that vote runs from 0.00% to 61.10%, so its steps 327 and 328 are 19.98% and 20.04%.

### 5. Named selections

Each bound below is the value of a step, as a slider sets it; "Swiss abroad counted" means the
switch is on.

| Vote | Limit | Swiss abroad | Municipalities with a result that remain | Yes | No | Yes share | Cantonal votes | Verdict |
|------|-------|--------------|------------------|-----|----|-----------|----------------|---------|
| 5950, 2015-06-14 | none narrowed | counted, 12 cantons | 2,103 of 2,103 | 1,128,522 | 1,124,873 | 50.0810% | 6½ : 16½ | passed |
| 5950, 2015-06-14 | none narrowed | not counted | 2,103 of 2,103 | 1,107,734 | 1,113,998 | 49.8590% | 6½ : 16½ | failed |
| 5960, 2016-02-28 | Ausländeranteil (end of 2015) up to 19.98% (step 327) | counted, 11 cantons: BS has no municipality left | 1,455 of 2,103 | 733,402 | 664,373 | 52.4692% | 18 : 4½ (25 cantons) | passed |
| 5960, 2016-02-28 | Italienisch (2000) from 50.07% (step 517) | counted, none: GR and TI have no entry of their own | 115 of 2,103 | 81,350 | 67,260 | 54.7406% | 2 : 0 (GR, TI) | passed |
| 5960, 2016-02-28 | Einwohner (end of 2015) from 3,508 (step 500) | counted, 12 cantons | 576 of 2,103 | 1,137,986 | 1,266,006 | 47.3373% | 12½ : 10½ | failed |
| 6400, 2021-03-07 | SVP (election 2019) up to 49.96% (step 594) | counted, 12 cantons | 1,922 of 2,105 | 1,364,382 | 1,280,078 | 51.5940% | 17 : 5½ (25 cantons: NW has no municipality left, and no entry of its own for the Swiss abroad) | passed |

The first row is the official result (BBl 2015 6313). In the vote of 2021-03-07, the SVP's
values as written run from 0 to 8,411 hundredths. With the SVP limit at that full range all 2,110
municipalities remain, Rüti bei Lyssach included. With its upper bound at step 999, 84.03%,
2,103 remain: the one with 84.11% goes, and so do the six without a party figure, among them
Rüti bei Lyssach.

### 6. A grey for set-aside municipalities

The map's colours were chosen so that a viewer with a red-green colour vision deficiency tells
the sides apart (`investigations/map-data.md`). For such a viewer the yes colours look grey:
every grey from `#808080` to `#dcdcdc` lies within a Delta E of 4.0 of one of them, where 8 is
needed to tell two colours apart. Only a near-black grey stays apart: `#2c2c2c` is at least 22.0
from every colour of the map with normal vision and at least 15.5 with the deficiency, `#202020`
19.9 (Output). `render_set_aside.cjs` shows both greys on the map.

### 7. What a frame costs when many municipalities change colour

`recolour.cjs`, on 2026-11-16, on the built site, 15 runs each: a frame in which 100
municipalities change their fill took 1.9 ms of work at the median (at most 2.6 to 2.8 ms); 1,000,
4.6 to 5.2 ms (at most 7.0 to 9.1 ms); all 2,110, 7.7 to 12.4 ms (at most 18.4 to 21.4 ms), in two
runs of the script. These are floors: the app adds the work of Svelte, of the calculation and of
the verdicts. A step of a drag changes few municipalities; a jump (back to the real result, a
limit added or removed, the switch) can change them all.

### 8. The frames of a drag, found while applying

Found while applying task 6.1 of `add-limits`, on 2026-11-16: the browser test "the budget of
dragging" drags the lower bound of "Einwohner" on `/votes/5960/` across its track and back in 40
moves, and allows 16 ms of main-thread work per frame. Ten runs at once (`--repeat-each 10`) gave
a longest frame per run from 9.0 to 19.3 ms; one run failed its second measurement too.

**Facts**, measured with `measure_drag.cjs` and `profile_drag.cjs`:
- **Two workers.** Playwright runs two workers on this machine of 4 processors. With one worker
  (`--workers 1`), ten runs gave 8.3 to 11.1 ms, all passing.
- **The page alone.** Alone, the longest frame of a drag is 8.3 to 12.4 ms, the median 4 ms.
  With a second drag in another browser at the same time, the longest is 9.5 to 17.8 ms.
- **The trace.** The longest frames are mostly script (`FunctionCall` 4.4 to 8.5 ms); drawing
  them (paint, layout, layers, commit) takes 2 to 4 ms.
- **The profile.** A drag costs 96 ms of script in its 40 steps. Svelte's update of derived
  values and effects holds 72 ms of it, among which:
  - the map's `fills`, built anew for all 2,110 municipalities at every step (8.6 ms of its
    own);
  - the 2,110 effects of the paths that read it (7 ms);
  - Svelte's checks of what changed (about 18 ms).

  The garbage collector takes 6.8 ms. The calculation (`calculateResult`, the selection) takes
  about 4 ms.
- **A spike** (undone): the class colours computed once, only the paths whose state changes
  given a new fill, through a map from number to element, and the municipalities with an entry
  flattened once instead of at every step. A drag then costs 52 ms of script. The longest frame
  is 6.2 to 8.4 ms alone and 8.4 to 11.1 ms beside a second drag; the median falls to 3 ms. A
  first try that found each path by `querySelector` cost more than it saved (63 ms of it).

**Theories**, and what became of them:
1. A second worker competing for the processor stretches the frames: confirmed. The misses
   came only with two runs at once.
2. Svelte's 2,110 fill effects at every step: confirmed, the largest single part.
3. Drawing many changed fills: a part, 2 to 4 ms, not the cause.
4. The calculation: refuted, about 4 ms per drag.
5. Garbage collection from what each step allocates: a part, 6.8 ms per drag.
6. The test's moves of about 50 steps each, larger than a person's: not tested; it makes each
   step change more municipalities, so the test is the harder case.

## Not verified

- The work Svelte adds to a frame in which many fills change; the change's browser tests
  measure it.
- How a log track feels on a phone (#10).
- The rule of answer 1 on a canton with an entry for its Swiss abroad is checked on one
  selection only (BS, answer 5).

## Output

`python3 reference_selections.py`:

```
0. Over the 124 judged votes: the Swiss abroad hold 1.00% to 1.57% of the valid votes; the verdict differs without them for 5950 of 2015-06-14 (optional-referendum).
   Votes in which a municipality with a result of its own has no party figure: 40; the municipalities: [(422, 'Rüti bei Lyssach', 2019), (868, 'Jaberg', 2015)]
   Without a figure apart from the parties: 0 municipality-years with no inhabitants, 0 without inhabitants in 2000.
1. With every limit at its full range and the Swiss abroad counted:
   the official result
  vote 5950 of 2015-06-14 (optional-referendum): municipalities remaining 2103 of 2103 with a result of their own; Swiss abroad of AG, AI, BS, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 1,128,522, no 1,124,873, yes share 50.0810%, cantonal votes 6½ : 16½ (26 cantons), passed
2. The Swiss abroad not counted, no limit narrowed:
   2015-06-14
  vote 5950 of 2015-06-14 (optional-referendum): municipalities remaining 2103 of 2103 with a result of their own; Swiss abroad of no canton
  yes 1,107,734, no 1,113,998, yes share 49.8590%, cantonal votes 6½ : 16½ (26 cantons), failed
3. Selections of the vote of 2016-02-28, each bound set by a step of its track of 1000, Swiss abroad counted:
   a. Ausländeranteil (end of 2015), upper bound at step 327: 1998
  vote 5960 of 2016-02-28 (popular-initiative): municipalities remaining 1455 of 2103 with a result of their own; Swiss abroad of AG, AI, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 733,402, no 664,373, yes share 52.4692%, cantonal votes 18 : 4½ (25 cantons), passed
   b. Italienisch (census 2000), lower bound at step 517: 5007
  vote 5960 of 2016-02-28 (popular-initiative): municipalities remaining 115 of 2103 with a result of their own; Swiss abroad of no canton
  yes 81,350, no 67,260, yes share 54.7406%, cantonal votes 2 : 0 (2 cantons), passed
      cantons of the municipalities that remain: ['GR', 'TI']
   c. Einwohner (end of 2015), lower bound at step 500: 3508
  vote 5960 of 2016-02-28 (popular-initiative): municipalities remaining 576 of 2103 with a result of their own; Swiss abroad of AG, AI, BS, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 1,137,986, no 1,266,006, yes share 47.3373%, cantonal votes 12½ : 10½ (26 cantons), failed
4. A municipality with a result and no party figure, vote 6400 of 2021-03-07:
  422 Rüti bei Lyssach: entry with 30 yes and 35 no votes; SVP None; the SVP track runs from 0 to 8411 hundredths
  SVP upper bound at step 1000, 8411: 422 remains; 2110 of 2110 municipalities of the list remain
  SVP upper bound at step 999, 8403: 422 is set aside; 2103 of 2110 municipalities of the list remain
  SVP upper bound at step 594, 4996: 422 is set aside; 1922 of 2110 municipalities of the list remain
   SVP (election 2019) up to 4996
  vote 6400 of 2021-03-07 (optional-referendum): municipalities remaining 1922 of 2105 with a result of their own; Swiss abroad of AG, AI, BS, FR, GE, LU, SG, TG, UR, VD, VS, ZH
  yes 1,364,382, no 1,280,078, yes share 51.5940%, cantonal votes 17 : 5½ (25 cantons), passed
5. The ends of each track for the vote of 2016-02-28 (units of the last written digit), and the value at the middle step (500):
  Einwohner                31 to 396955, log    middle   3508, step 1    31; zero 0, smallest above zero 31, without a figure 0
  Ausländeranteil           0 to   6110, linear middle   3055, step 1     6; zero 4, smallest above zero 49, without a figure 0
  0–17                    204 to   3596, linear middle   1900, step 1   207; zero 0, smallest above zero 204, without a figure 0
  18–34                   638 to   3750, linear middle   2194, step 1   641; zero 0, smallest above zero 638, without a figure 0
  35–49                  1111 to   3265, linear middle   2188, step 1  1113; zero 0, smallest above zero 1111, without a figure 0
  50–64                  1124 to   3846, linear middle   2485, step 1  1127; zero 0, smallest above zero 1124, without a figure 0
  65+                     581 to   3616, linear middle   2099, step 1   584; zero 0, smallest above zero 581, without a figure 0
  Einwohner je km²          1 to  10824, log    middle    104, step 1     1; zero 0, smallest above zero 1, without a figure 0
  FDP                       0 to   6372, linear middle   3186, step 1     6; zero 50, smallest above zero 4, without a figure 7
  Die Mitte                 0 to   8653, linear middle   4327, step 1     9; zero 65, smallest above zero 65, without a figure 7
  SP                        0 to   5358, linear middle   2679, step 1     5; zero 39, smallest above zero 32, without a figure 7
  SVP                       0 to   8872, linear middle   4436, step 1     9; zero 9, smallest above zero 239, without a figure 7
  GLP                       0 to   1600, linear middle    800, step 1     2; zero 277, smallest above zero 2, without a figure 7
  Grüne                     0 to   4009, linear middle   2005, step 1     4; zero 152, smallest above zero 15, without a figure 7
  Übrige                    0 to   7649, linear middle   3825, step 1     8; zero 90, smallest above zero 1, without a figure 7
  Deutsch                   0 to  10000, linear middle   5000, step 1    10; zero 2, smallest above zero 22, without a figure 0
  Französisch               0 to   9978, linear middle   4989, step 1    10; zero 91, smallest above zero 4, without a figure 0
  Italienisch               0 to   9684, linear middle   4842, step 1    10; zero 214, smallest above zero 5, without a figure 0
  Rätoromanisch             0 to   9277, linear middle   4639, step 1     9; zero 906, smallest above zero 1, without a figure 0
  Fläche                   32 to  43861, log    middle   1185, step 1    32; zero 0, smallest above zero 32, without a figure 0
  Rinder je Einwohner       0 to   8158, log    middle     90, step 1     1; zero 128, smallest above zero 1, without a figure 0
```

`python3 check_set_aside_grey.py`:

```
Each grey and the closest colour of the map to it:
  #d0d0d0  normal   8.0 (yes, class 1)  red-green deficiency   1.3 (yes, class 1)
  #c4c4c4  normal   8.4 (lake)  red-green deficiency   2.7 (yes, class 1)
  #b8b8b8  normal   7.4 (lake)  red-green deficiency   1.6 (yes, class 2)
  #adadad  normal   8.1 (lake)  red-green deficiency   1.4 (yes, class 2)
  #a3a3a3  normal   9.9 (lake)  red-green deficiency   2.2 (yes, class 2)
  #999999  normal  12.3 (lake)  red-green deficiency   3.1 (yes, class 3)
  #8c8c8c  normal  11.6 (yes, class 3)  red-green deficiency   2.3 (yes, class 3)
  #7a7a7a  normal  12.1 (yes, class 3)  red-green deficiency   3.8 (yes, class 3)
  #5a5a5a  normal   9.5 (yes, class 4)  red-green deficiency   2.4 (yes, class 4)
  #3c3c3c  normal  16.5 (yes, class 4)  red-green deficiency  10.5 (no, class 4)
  #2c2c2c  normal  22.0 (yes, class 4)  red-green deficiency  15.5 (no, class 4)
  #202020  normal  26.6 (no, class 4)  red-green deficiency  19.9 (no, class 4)
Every grey from #202020 to #fcfcfc in steps of 4, with the largest smallest distance:
  #202020  smallest distance  19.9
  #242424  smallest distance  18.4
  #282828  smallest distance  16.9
The best grey from #808080 to #dcdcdc: #9c9c9c, smallest distance 4.0
```
