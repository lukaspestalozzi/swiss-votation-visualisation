# Share link

Found while proposing `add-share-link` (#11 of `docs/roadmap.md`), on 2026-11-19, against the
site built from `7803b5f` (the archive of `add-site-style`) and its data files. It answers what
#11 needs to decide how the address carries a selection:
- how often a page may change its address, in the browsers and in SvelteKit;
- which events a slider sends while dragged and while pressed with a key;
- what a link to the same page does in a tab that already shows it;
- how long a link with all 21 limits is;
- whether a bound written as a value comes back to the same step, and how far it can move when
  the data change.

It decides nothing: the design of `add-share-link` records the decisions.

Words used here: a **step** is one of the 1,001 positions of a limit's track (0 to 1,000,
`app/src/lib/limits.ts`); a value is in **units** of the last decimal its label writes (19.98% is
1998, design of `add-limits`, decision 16); a **gap** is the difference between the values of two
neighbouring steps; an **address change** is a call of `history.replaceState`, which SvelteKit's
shallow navigation makes.

## How to reproduce

The script is `investigations/share-link/link.mjs`. It imports the app's own
`app/src/lib/limits.ts`, `characteristics.ts` and `texts/index.ts`, which Node 24 runs with their
types stripped, and reads `app/static/data/`; then it uses the global Playwright against the built
site, served as the browser tests serve it.

```sh
pnpm run build
(cd app && pnpm exec sirv build --port 4174) &
node investigations/share-link/link.mjs "$PWD"
```

| File | What |
|------|------|
| `link.mjs` | Part 1, over the 44 vote days of `votes.json`: for each characteristic, the smallest and the largest end of its track, the largest gap and the value where it lies, and whether every value of a step, written as a link would write it and read back, finds a step of the same value as the nearest; then the longest link with all 21 limits. Part 2, in Chromium: 300 address changes in a row with Playwright's flags and without `--disable-ipc-flooding-protection`; the `input` and `change` events of a drag of 20 moves and of 20 presses of an arrow key on a slider; whether an address change fires `hashchange`; a link to the same page with another hash, opened in the tab. |

"Output" at the end of this file is what the script printed on 2026-11-19, with Google Chrome for
Testing 153.0.8010.12, the Chromium of Playwright 1.63.0 in the cloud image.

## Answers

### 1. How often a page may change its address

Every browser limits how often a page may change its address, and they differ in what they do
beyond the limit:

- **Safari** throws a `SecurityError`: "Attempt to use history.replaceState() more than 100 times
  per 10 seconds", in WebKit's `History.cpp` today (`perStateObjectTimeSpanLimit = 100`,
  `stateObjectTimeSpan { 10_s }`, https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/History.cpp);
  older Safaris wrote "per 30 seconds" (WebKit bug 276205,
  https://bugs.webkit.org/show_bug.cgi?id=276205, and the reports of developers). A page that does
  not catch it stops in the middle of what it was doing. In the test case of Firefox bug 1995636,
  Safari stopped after 100 calls.
- **Firefox** throws too ("Too many calls to Location or History APIs within a short timeframe"),
  after 200 calls in that test case; Firefox 148 raised its limit, by a preference whose new value
  the bug does not state (https://bugzilla.mozilla.org/show_bug.cgi?id=1995636).
- **Chrome** drops the calls beyond its limit without an error, and warns in the console. Chromium
  here kept 200 of 300 calls in a row and dropped the last 100, with the warning "Throttling
  navigation to prevent the browser from hanging" (Output). A PSA on blink-dev proposes to throw
  instead, from Chrome 144, for more than 200 calls a second; it was still under discussion
  (https://groups.google.com/a/chromium.org/g/blink-dev/c/TyvBybEFIKU).

**The browser tests do not see Chrome's limit.** Playwright launches Chromium with
`--disable-ipc-flooding-protection`: with Playwright's flags, the same 300 calls all took effect,
without a warning (Output). An earlier measurement while proposing #11 ("300 calls in a row, no
warning") was this flag's doing, not Chrome's. A test of the limit must launch without the flag.

What makes the calls: a slider sends `input` at every step and `change` when it is let go, once
for a drag of 20 moves; but a press of an arrow key sends both, once per press (Output). A key
held down repeats at the system's rate, commonly 10 to 30 presses a second (not measured here), so
a page that changed its address at every `change` would reach Safari's 100 in 10 seconds after 4
to 10 seconds of a key held down. Changing the address at most once in every half second stays
below every limit above: 20 in 10 seconds, 60 in 30.

### 2. SvelteKit's address change

In SvelteKit 3.2.0, the version of `app/`, `replaceState` of `$app/navigation` is deprecated
("Use `goto(url, { state, shallow: true, replace: true })` instead", in its types and as a
warning in development). `goto` with `shallow: true` changes the address and `page.state`
without navigating, and with `replace: true` replaces the history's entry instead of adding one;
`reset` defaults to false for a shallow `goto`, so scroll and focus stay. In development, a call of
`history.replaceState` by the app itself warns that it conflicts with the router
(`history_api_conflict`); SvelteKit's own calls do not warn.

An address change does not fire `hashchange` (Output, "after replaceState").

### 3. A link to the same page in the same tab

A link to the page a tab shows, with another hash, opened in that tab (pasted into its address
bar, or clicked in another page of the site), does not load the page again: the browser only
changes the hash and fires `hashchange` once. The page kept its variables and its limit as they
were (Output, "still here", one limit), so a page that reads its address only when it loads would
show the old selection under the new address.

### 4. The length of a link

With all 21 limits narrowed on both sides, each bound as wide as the widest value inside its track
on that vote day, and the switch of the Swiss abroad off, the hash is 428 characters and the whole
address of a vote's page on the published site 505 (Output; the vote day of 2013-03-03 is the
widest, by its inhabitants and areas). The keys are those of the characteristics in
`app/src/lib/characteristics.ts`, the same in every language; the nines stand for the widest
written value, its point included.

### 5. Values and steps

Written as its label writes it, without the unit and the apostrophes ("19.98", "440935",
"438.61", "9.853"), a value of a step reads back to the same units, and the nearest step to it
has that value: every one of the 41,615 to 44,044 values of each characteristic's tracks, over
the 44 vote days (Output, "round trip"). Several steps can share a value (at the low end of a
logarithmic track); they set aside the same municipalities, as the selection compares values
(`remainingUnder`).

A value that no step has, as after a change of the data, lands on the nearest step, at most half
a gap away. The largest gaps (Output):
- shares on a linear track: 0.03 to 0.10 percentage points (a tenth of a thousandth of 100%, at
  most), so a bound moves by 0.05 at most;
- inhabitants 4,226 at 440,935, density 107 at 11,431, area 3.16 km² at 438.61, cattle per
  inhabitant 0.090 at 9.763: about 1% of the value at the top of a logarithmic track, so a bound
  moves by about half a percent of its value at most.

### 6. What a change of the data moves

The data hold one list of municipalities, that of 2026-01-01 (2,110), onto which the pipeline
adds up the entries and the characteristics of every vote (`municipalities.json`,
`characteristics.json`). An update with a newer list adds them up onto that list: the
municipalities merged since are one, with the sums of their counts. `characteristics.json` was
written once (99c82d2), so no earlier version shows a change; what follows is reasoning, not
measured:

- A share or quotient of a merged municipality (foreigners, ages, density, parties, languages,
  cattle per inhabitant) lies between those of its parts, so the ends of those tracks stay or
  move inward.
- A sum (inhabitants, area) of a merged municipality is larger than each part, so the largest end
  of those tracks can move outward: a merger larger than today's largest municipality would lie
  above a bound written as today's largest value.
- A source's revision of a past figure can move any end either way.

So a bound written as the value of its track's end, while it sets nothing aside, could set aside a
municipality after an update; a bound written as "at the end" stays at the end. A bound inside the
track keeps its meaning, at most half a gap away (5).

## Not verified

- Safari's and Firefox's limits, from their sources and bug reports only: neither browser runs
  here. Firefox's value since version 148 is not stated in its bug.
- Whether Chrome 144 or later throws beyond its limit: the PSA was under discussion, and Chromium
  153 here dropped the calls without an error.
- The rate at which a held key repeats on a visitor's machine.
- How long an address a messenger or mail program keeps whole: 505 characters is a quarter of the
  2,000 commonly cited as safe, not a measured limit.

## Output

`node investigations/share-link/link.mjs "$PWD"`:

```
Part 1: 44 vote days, 2013-03-03 to 2026-09-27

key | scale | smallest end | largest end | largest gap between steps (at) | round trip
inhabitants | logarithmic | 28 | 440'935 | 4'226 (at 440'935) | 41615 of 41615 values
foreigners | linear | 0.00% | 63.98% | 0.07% (at 0.43%) | 44044 of 44044 values
age-0-17 | linear | 0.00% | 36.67% | 0.04% (at 2.02%) | 44044 of 44044 values
age-18-34 | linear | 0.00% | 42.87% | 0.05% (at 0.25%) | 44044 of 44044 values
age-35-49 | linear | 5.13% | 36.84% | 0.03% (at 12.28%) | 44044 of 44044 values
age-50-64 | linear | 6.67% | 50.00% | 0.04% (at 6.77%) | 44044 of 44044 values
age-65 | linear | 4.76% | 50.00% | 0.05% (at 6.86%) | 44044 of 44044 values
density | logarithmic | 1 | 11'538 | 107 (at 11'431) | 26605 of 26605 values
fdp | linear | 0.00% | 92.11% | 0.10% (at 0.28%) | 44044 of 44044 values
centre | linear | 0.00% | 91.76% | 0.10% (at 0.28%) | 44044 of 44044 values
sp | linear | 0.00% | 55.31% | 0.06% (at 0.06%) | 44044 of 44044 values
svp | linear | 0.00% | 93.48% | 0.10% (at 0.56%) | 44044 of 44044 values
glp | linear | 0.00% | 23.78% | 0.03% (at 0.05%) | 44044 of 44044 values
greens | linear | 0.00% | 40.09% | 0.05% (at 2.25%) | 44044 of 44044 values
other-parties | linear | 0.00% | 76.49% | 0.08% (at 0.08%) | 44044 of 44044 values
german | linear | 0.00% | 100.00% | 0.10% (at 0.10%) | 44044 of 44044 values
french | linear | 0.00% | 99.78% | 0.10% (at 0.10%) | 44044 of 44044 values
italian | linear | 0.00% | 96.84% | 0.10% (at 0.10%) | 44044 of 44044 values
romansh | linear | 0.00% | 92.77% | 0.10% (at 0.19%) | 44044 of 44044 values
area | logarithmic | 0.32 km² | 438.61 km² | 3.16 km² (at 438.61 km²) | 39820 of 39820 values
cattle | logarithmic | 0.000 | 9.853 | 0.090 (at 9.763) | 26149 of 26149 values

The longest link with all 21 limits (2013-03-03): its hash 428 characters, the whole address 505:
https://lukaspestalozzi.github.io/swiss-votation-visualisation/de/votes/5960/#inhabitants=999999-999999&foreigners=99999-99999&age-0-17=99999-99999&age-18-34=99999-99999&age-35-49=99999-99999&age-50-64=99999-99999&age-65=99999-99999&density=99999-99999&fdp=99999-99999&centre=99999-99999&sp=99999-99999&svp=99999-99999&glp=99999-99999&greens=99999-99999&other-parties=99999-99999&german=99999-99999&french=99999-99999&italian=99999-99999&romansh=99999-99999&area=999999-999999&cattle=99999-99999&abroad=no

Part 2: Chromium /opt/pw-browsers/chromium-1243/chrome-linux64/chrome
300 replaceState in a row, Playwright's flags: {"took":300,"error":null,"last":"#n=300","messages":[]}
300 replaceState in a row, without --disable-ipc-flooding-protection: {"took":200,"error":null,"last":"#n=200","messages":["warning: Throttling navigation to prevent the browser from hanging. See https://crbug.com/1038223. Command line switch --disable-ipc-flooding-protection can be used to bypass the protection"]}
a drag of 20 moves: {"input":20,"change":1,"hashchange":0}
20 presses of ArrowLeft: {"input":20,"change":20,"hashchange":0}
after replaceState: {"input":0,"change":0,"hashchange":0}
a link to the same page with another hash, opened in the tab: {"marker":"still here","hashchange":1,"hash":"#foreigners=-19.98","limits":1}
```
