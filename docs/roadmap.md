# Roadmap

Ordered list of planned OpenSpec changes. Each row becomes one change under `openspec/changes/`
(proposal → review → apply → verify → archive). Open decisions are asked in the change's
`design.md` before it is applied. The change and capability names are drafts until the change is
proposed.

| # | Change | Capabilities | Scope | Open decisions | Status |
|---|--------|--------------|-------|----------------|--------|
| 1 | `add-project-skeleton` | app-shell (new), build-checks (new), result-calculation (new) | The build of the static app (Svelte 5 and SvelteKit 3 with the static adapter, TypeScript 6) in a pnpm workspace on Node 24; the three modules as `calculation/`, `app/` and `pipeline/`, with their allowed dependencies enforced by the static analysis; the CI `build` job and the same steps in `scripts/verify-local.sh` (formatting, lint, static analysis, unit tests, build, browser tests), with `--quick` running the unit tests; the dependencies installed by the cloud hook; one visible result in the browser, the 26 cantons with their 23 cantonal votes, with everything the page needs served with it | None left: the archived change's `design.md` records each decision with the alternatives considered. The pipeline's toolchain moved to #3 | done, archived 2026-11-14 |
| 2 | `add-result-calculation` | result-calculation | The calculation module, without data loading and without a screen. From the entries that remain (a municipality, or the Swiss abroad of a canton that counts them apart): the yes votes, the valid votes and the yes share; the cantonal votes, built on the cantons and their half votes that #1 specified, with a canton whose yes and no votes are equal counted as voting no, and no vote for a canton that has no entry left; both majorities, a tie of cantonal votes being a rejection; the majorities a vote needs by its kind, for six kinds: a popular initiative voted on together with a counter-proposal and that counter-proposal are judged like any vote that needs both majorities, their tie-break question is not calculated; the verdict, failed when nothing remains. An entry that cannot be counted is an error. Tested against the official results of seven named votes with all their municipal entries | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-14 |
| 3 | `add-vote-data` | vote-data (new), municipalities (new), build-checks | The pipeline's first data, in Python with polars, run by uv. For every national vote since 2013 with a complete result: its date, its titles in German, French and Italian, its kind (the six of the calculation), and its official result, the Federal Chancellery's once validated and the Federal Statistical Office's until then, marked; per entry (a municipality, or the Swiss abroad of a canton) the registered voters, ballots cast, valid ballots, yes and no votes, under the canton it voted in; one list of municipalities for all votes, the one the BFS files state (2026-01-01), each municipality counted once and the ones without a result named per vote; the input checked where it enters the pipeline; the entries summing to the BFS's figures and to the official result, the one known difference named; a unit test that runs the calculation over every vote; the data files committed in `app/static/data/`; one command, run by hand, that adds a new vote day; the pipeline's checks in CI, in `scripts/verify-local.sh` and in the cloud hook | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-15 |
| 4 | `add-vote-list` | vote-list (new), verdicts (new), app-shell, result-calculation | The first screen, in German until #9. The start page lists every vote by year, newest first, each with its date, title, kind, official result (the tie-break question its share for the initiative) and the marks "Hinweis" and "vorläufig"; the cantons table goes. Each vote has its page at `/votes/<id>`, written at build time with the result the calculation gives over its entries: the yes and no votes, the yes share and the turnout; the majority of voters and the majority of cantons side by side, "nicht nötig" with the cantonal votes greyed out for a vote that needs only the first; the outcome; a table of the cantons, from the outcome of each canton that the calculation now gives; the tie-break question's figures without a verdict; the reference or the mark of a provisional result, the Federal Chancellery's note, and a note where the validated result differs from the entries. The browser loads no entries; numbers and dates are written by the app's own functions, and every text of the screen is in one module | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-15 |
| 5 | `publish-site` | publishing (new), app-shell, verdicts, vote-list | The built site is published on GitHub Pages at https://lukaspestalozzi.github.io/swiss-votation-visualisation/, so that the changes after it can be looked at there, on a phone too: on every push to `main` whose checks all pass, CI publishes the build its browser tests checked, one run of `main` at a time so that an older push never replaces a newer site; pull requests publish nothing and get no preview. The site is built for that path, and the browser tests run under it; every page is written as `<path>/index.html`, so a vote's address is `/votes/<id>/`, and `/votes/<id>` shows the same page; an address that names no page gets GitHub's "not found" | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-15 |
| 6 | `add-result-map` | result-map (new), municipalities, vote-data | The map of a vote on its page, below the outcome, for every vote the calculation judges (none for a tie-break question). Each municipality is coloured by the side with more votes and that side's share, in four classes of ten points per side: blue-green for yes, orange-red for no, so that red-green colour-blind viewers can tell the sides apart. A tie is light grey, a municipality without a result hatched. The cantons' borders and the 37 lakes, whole, lie on the outline of Switzerland in the lakes' colour; a legend, the source and a sentence on the Swiss abroad follow. Pointing at or clicking a municipality shows its name, canton, yes share and votes; the map zooms with buttons and the wheel and moves by dragging, within 16 ms per frame. The page holds each municipality's figures; the shapes and names are loaded once. The pipeline writes `map.json` from the BFS register's K4 boundaries of the list's reference date and the lakes of the BFS ThemaKart set 2026, and stops when they do not fit the list | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-15 |
| 7 | `add-characteristics` | characteristics (new), result-map, vote-data | The pipeline's second data and a panel beside the map. 21 characteristics per municipality, each with one definition (name, unit, source, the date of its figures, and its value as a quotient of counts): inhabitants, the share of foreigners, five age groups (0–17, 18–34, 35–49, 50–64, 65 and over) and inhabitants per km²; the strength of FDP, Die Mitte (until 2020 CVP and BDP), SP, SVP, GLP, Grüne and the other parties in the National Council elections; the shares of German, French, Italian and Romansh as main language in the census of 2000; the area of 2026; and cattle per inhabitant. A vote takes the figures of the last year and the last election before its day. The pipeline counts them from four BFS STAT-TAB tables and swisstopo's swissBOUNDARIES3D, brings each table onto the votes' list through the register's correspondences, checks every count and sum, stops when a table gives another list or lacks a year it needs, and writes `characteristics.json`. Clicking or tapping a municipality shows its characteristics in a panel beside the map (below it in a window narrower than 960 pixels), "keine Angabe" where there is no figure; a click may take 50 ms per frame until a later change revisits that budget | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-15 |
| 7a | `tighten-map-budget` | result-map | The look at performance after #7 (`investigations/performance.md`). One budget of 16 ms per frame again for every input of the map: zooming, moving, pointing (the first pointing after the page has loaded included) and clicking, which fills the panel; #7's relaxed 50 ms for clicking goes, as its long frames were the measurement's. The map's two loaded files are raw state, which brings the first pointing from 7 to 20 ms to 4 to 10 ms. The budget tests click 50 ms after the pointer arrives, as a person does, and run once more when they fail, as a busy machine can stretch a frame | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-16 |
| 8 | `add-limits` | limits (new), reading-guide (new), verdicts, result-map, characteristics | Limits on the 21 characteristics, added from a list with "Hinzufügen", each a lower and an upper bound on two of the browser's sliders over one track of 1,000 steps, linear or logarithmic (inhabitants, density, area, cattle), labelled with the characteristic, the date of its figures and both bounds as the panel writes them; a municipality remains only if it lies within all limits at once, compared as the panel writes its values, and a narrowed limit sets aside a municipality without a figure. A switch counts the Swiss abroad of each canton in which a municipality remains. While a limit is dragged, set-aside municipalities turn dark grey (`#2c2c2c`), those without a result stay hatched, and "Mit Ihrer Auswahl" shows the recalculated votes, both majorities and the outcome beside the real result, with the table of the cantons; a sentence counts what remains, and one button returns to the real result. 16 ms per frame while dragging, 50 ms for a jump. A sentence at the limits and a page "Lesehilfe" (`/guide/`) explain the thought experiment and name the sources | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-16 |
| 9 | `add-interface-languages` | interface-languages (new), app-shell, vote-list, verdicts | The interface and the vote titles in German, French and Italian. Every page is written in each, under `/de/`, `/fr/` and `/it/`, with its `lang`; the address without a language and the addresses of before (`/votes/<id>/`, `/guide/`) open the page in the first of the three among the browser's preferred languages, German without one or without scripts, and nothing is stored. A switch at the top of every page names "Deutsch", "Français", "Italiano" and opens the same page anew in another. The texts are one module per language behind one type, with the Confederation's terms (`investigations/languages.md`): the Chancellery's kinds and verdicts, the Constitution's "voix des cantons", the party register's and STAT-TAB's parties; a vote's title, reference and note are the data's in the page's language; one number format, month names per language ("1er", "1°"); municipalities and cantons keep their names. First, two suggestions of #8: the count and the set-aside in `limits.ts`, and a browser test of "65 Jahre und älter" | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-17 |
| 9a | `steady-budget-tests` | result-map | The budget tests' sensitivity to a busy machine, found while applying #9: the budget of dragging (16 ms) failed one try with frames of 17.5 and 18.8 ms, and the map's budget for zooming, moving and pointing one with a frame of 19.5 ms; each passed its retry. Measured with `investigations/limits/measure_drag.cjs`, a drag alone is the same before and after #9 (the longest frame of a run 9.3 ms on average, none over 16 ms in 30 runs), and goes over 16 ms in 3 to 6 of 10 runs while a second browser drags at the same time, as a second test worker does. Steadier budget tests before #10 adds touch inputs and their budgets (Q, 2026-11-17): the browser tests run one at a time (one worker), so no test runs beside a budget test, and a test keeps that setting; the budget tests keep their second try. With one worker, right after a build, the longest frame of a drag was 6.7 to 8.8 ms (`investigations/performance.md`, M12), and the suite takes about 50 s instead of about 32 s | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-18 |
| 10 | `add-small-screens` | small-screens (new), result-map | Usable on a phone (`investigations/small-screens.md`). Every page, in each language, fits a window 360 pixels wide, where 139 of 381 did not: a word too long for its line is broken within it, and the two verdict boxes stay side by side. On the map one finger moves it and two zoom and move it, and a finger on it neither scrolls nor zooms the page; a tap does what a click does, and the municipality last clicked or tapped is outlined, black on a white halo. On a touch screen the controls, a slider's thumbs included, are at least 44 × 44 pixels; below 640 pixels the zoom buttons stand above the map, and a bar at the bottom of the window repeats the selection's outcome and both majorities while its box is out of view. Zoom and move stay #6's own code rather than d3-zoom; the budget of 16 ms per frame holds for the frames of the fingers' moves and of the taps, on the browser tests' emulation of a phone; the phone itself is checked by hand after the merge | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-19 |
| 10a | `add-site-style` | site-style (new), reading-guide, result-map | The look of every page (`investigations/site-style.md`). Source Sans 3, served with the site, one Latin file of 28,872 bytes, the system's sans-serif until it loads; every colour named once, text `#1c1c1c` on white and links `#1a5fb4`, and, when the browser prefers it, a dark scheme on `#121212`, with no switch, no cookie and nothing in local storage; every text at least 4.5:1 against its ground, the controls' borders 3:1, a ring of 2 pixels on focus; the verdicts in the map's darkest yes and no (class 2 in the dark); a head on every page with the working title, "Lesehilfe" and the language switch, the start page's own link to the guide gone; no limit on the width, 16 pixels at each side, paragraphs at most 40rem. The map keeps its colours; its borders and the hatching's ground take the page's ground. Checked by a browser test of contrast and font in both schemes and three languages, and by Q's look at screenshots | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-19 |
| 11 | `add-share-link` | share-link (new), limits, interface-languages, reading-guide | A link reproduces a chosen vote together with all limits (`investigations/share-link.md`). A vote's page writes its selection after `#` in its address, by value: `/de/votes/5960/#foreigners=-19.98&abroad=no`, each characteristic by a key the same in every language, a bound as its label writes it and empty at its track's end. The address follows the selection half a second after its last change, replacing the history's entry, with no button; nothing is sent to the server. Opened, reloaded, or opened in the tab that shows the vote, a link applies once the characteristics have loaded, each bound at the step nearest its value; the parts it cannot use are named at the limits until the next change, and a tie-break question's page ignores its address. A vote that no longer exists gives the site's 404. The language switch carries the selection; the guide says that the address holds it. The budget of the frame after a link with all 21 limits is 100 ms | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-20 |
| 12 | `add-vote-comparison` | vote-comparison (new) | The same selection of municipalities applied to two votes side by side (`investigations/vote-comparison.md`), on a page of its own in each language, `/de/compare/`. "Erste Abstimmung" offers the 124 votes the calculation judges, newest first, "Zweite Abstimmung" the others, the first vote's day first; the tie-break question is not offered. The limits keep municipalities by the figures of the first vote, and exactly those count in both votes; another first vote reads the selection anew on its tracks. Each vote has a compact table, "Echtes Ergebnis" and, while a selection applies, "Mit Ihrer Auswahl", with its count and its vote page's notes; no map and no table of the cantons. The address holds both votes and the selection, `#votes=5960,5970&foreigners=-19.98`, written and read as a vote's page holds its selection, and the language switch carries it; each vote's file of entries is loaded once per visit. A judged vote's page links to it below its limits, with its selection. Below 640 pixels the tables stand one below the other and a bar names both outcomes; from 640 pixels side by side. The budgets of 16 ms per frame of a drag and 50 ms for a jump hold with two votes | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-22 |
| 13 | `add-more-characteristics` | characteristics, limits, result-map, share-link, reading-guide, vote-data | 14 characteristics beyond the predecessor's, 35 in all (`investigations/more-characteristics.md`): the share born abroad, of its own newest year; from the census of 2000, the newest figures per municipality, the Evangelical Reformed, the Roman Catholic and those without a religious affiliation, those with a university or higher vocational degree and with compulsory school or none (of those who named a level), the dwellings lived in by their owner and the single-family houses; the jobs per 100 inhabitants and the shares of the three sectors (STATENT); the farms per 1,000 inhabitants and the organic share of the farmland. The pipeline reads six more STAT-TAB tables and more of the farms table, 61 queries in all, each table checked against the register's list of its date (the jobs': 2024-01-01); a count the BFS withholds is none, never zero, also for a municipality made of several when one part has none, and such a figure reads "keine Angabe". The panel has eight groups, a line of another year than its group's heading naming its date; the list "Merkmal hinzufügen" stands under the panel's headings and is no wider than the page; six tracks are logarithmic; a link knows the 14 new keys and keeps the 21 of before, and its frame takes at most 170 ms with all 35 limits (71 to 126 ms measured) and 100 ms with up to 21. `characteristics.json` is 2.40 MB, 976 KB with gzip, one file. | None left in the change: the archived change's `design.md` records each decision with the alternatives considered. Left open by it (Q): **income**, until it is clear whether a script may download the Federal Tax Administration's files, whose server refuses the pipeline's client; **the urban or rural type and every other category**, as a limit on a category is another control; turnout at National Council elections, which holds up and was not chosen | done, archived 2026-11-23 |
| 14 | `redesign-site` | site-style, verdicts, limits, result-map, vote-list, vote-comparison, small-screens, interface-languages, reading-guide, characteristics, app-shell, publishing, share-link | A new layout and look for every page (`investigations/redesign.md`), asked for by Q as the site "does not look very modern". A vote's page becomes a workbench: in a window at least 1,024 pixels wide the result and the map stay in the window on the left, the limits stand on the right, the panel and the table of the cantons below. A result is a row of its outcome and two bars, the voters' with a mark at half and the cantons' with a segment per canton; the selection's result stands below the real one. A limit keeps its label and shows a histogram of its track and a mark for the municipality last clicked; one button with a list of the characteristics adds a limit. The legend is one scale; the panel's shares and the cantons' yes shares are drawn as bars. The mouse wheel over the map scrolls the page, and Ctrl or ⌘ with the wheel zooms. Links and controls take the text's colour, so that colour means a result; a page is at most 1,600 pixels wide; the head gains a mark and "Vergleichen". The start page opens with the question the site answers and lists the votes by vote day, each with a bar, with a search, a filter by result and links to the years, and no example. The comparison shows its two votes one below the other. Today's wording stays; the data, the calculation, the font and the map's colours do not change. Added after its merge, on Q's word: in a window narrower than 1,024 pixels the limits stand between the result and the map, so that a phone shows the selection's result while a limit is set; and the frame budgets hold on a slower machine, at least nine frames in ten of a step within 16 ms and none over 50 ms, and 150 and 250 ms for the frame after a link | None left: the change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-25 |
| 15 | `reword-site-texts` | vote-list, verdicts, result-map, reading-guide | The wording of eight texts, in German and, where they read the same way, in French and Italian, after a pass Q asked for on 2026-11-25: the sentences that read as translations of the English specs ("Karte und Ergebnis rechnen sofort neu", "Eine Abstimmung nimmt … vor ihrem Tag", "eine Grenze ändert durch sie keine Zahl") reworded, and a capital after a colon where a whole sentence follows. No figure, rule or layout changes | None | done, archived 2026-11-25 |
| 16 | `clarify-phone-window` | small-screens | What the verification of #14's additions after its merge and of #15 found on 2026-11-25: the phone requirement promised the selection's result and the first limit in one window "on a phone", while that holds only on one held upright in a window at least 700 pixels high (666 needed in three languages); tests of the French and Italian sentences of #15; the README's narrow order. No page changes | None | applied 2026-11-25, not archived |

v1 = changes #1–#10a: the idea of the predecessor done correctly for every national vote since
2013, in German, French and Italian, usable on a phone, styled, and published (user decisions,
2026-11-13 and 2026-11-14; 10a added on 2026-11-18). #11–#13 are decided scope and follow after
v1. #14 was not planned: Q asked for it on 2026-11-24, after a look at the site's design. Two
candidates are named and not decided: income per municipality, and a limit on categories such as
the urban or rural type (row 13, "Open decisions").

Decided while drafting (user decisions, 2026-11-13 and 2026-11-14):
- **Order.** The rules before the data and the screens (#2 before #3 and #4), so that the
  calculation is tested against official results before the data and the screens depend on it.
  Rejected: the screen first (the map decided before the performance budget is known, and
  verdicts shown before they are tested), and all data first (nothing visible until the fifth
  change).
- **Publishing** is a change of its own, after the first screen (#5). Rejected: with the
  skeleton, as the last change of v1, and after v1.
- **Adding new vote days** is part of #3, and **the reading guide and the sources** are part of
  #8, not changes of their own.
- **The visible result of #1** is the 26 cantons with their cantonal votes. This one fact of #2
  was taken forward, so that the skeleton shows something real and tested; #2 extends the
  requirement. Rejected: a placeholder value that #2 removes again, and a page with the title
  alone.
- **The pipeline's toolchain** is set up in #3, after the first investigation, not in #1.

## Investigations

Spikes run through `/openspec-explore`. Each writes a file under `investigations/` that names its
sources, the script and the output that produced its values, and the expected values with their
tolerances.

- **Data sources**, the first one, before #2 and #3. Done on 2026-11-14:
  `investigations/data-sources.md`, with its scripts in `investigations/data-sources/`. What it
  found, question by question:
  - The public sources offer the results per municipality for every national vote since 2013.
    The characteristics exist for matching years, on other lists of municipalities; area,
    language and religion per municipality were not found.
  - Votes that belong to no municipality on the map: the Swiss abroad are a separate entry in
    11 to 12 cantons (1.0% to 1.6% of the valid ballots), and five to seven municipalities of
    the canton of Bern have no result of their own.
  - The sources use today's list of municipalities for every vote, and convert the earlier
    results after each merger.
  - One case is not covered by the three kinds of hard constraint 2: an initiative, its
    counter-proposal and a tie-break question on 2026-03-08. A mandatory vote that needs only
    the majority of voters does not occur.
  - The official results are the Federal Chancellery's. The municipal data matches them
    exactly for 116 of 117 validated votes, among them the vote of 2016-02-28 on the taxation
    of couples (failure mode 3); for one vote it is 200 no votes off.

  The investigation lists nine points for the changes to decide. #2 decided point 5 (the
  initiative with a counter-proposal and its tie-break question), #3 decided points 1 to 4 and
  6 to 9, which `investigations/data-sources.md` notes point by point; the entries of the
  table above show both. The most visible: the official result is the Federal Chancellery's, with one
  named difference; all votes use today's list of municipalities, so the map of #6 is one map.
- **Map data**, found while proposing #6, on 2026-11-15: `investigations/map-data.md`, with its
  scripts in `investigations/map-data/`. The BFS register gives the K4 boundaries of exactly the
  list of municipalities of a date; the BFS ThemaKart set 2026 has the same municipalities,
  simplified differently, and the lakes, which both leave as holes; the distances of the map's
  colours under red-green colour vision deficiency; and the municipal figures the specs of the
  map cite.
  While proposing #3, three more facts were found and added to the investigation: the two
  sources share the BFS's id, they differ in the registered voters, and Moutier changed canton
  on 2026-01-01.
- **Characteristics**, the first investigation of #7, found while proposing it on 2026-11-15:
  `investigations/characteristics.md`, with its scripts in `investigations/characteristics/`.
  Four BFS STAT-TAB tables give the population, the elections, the cattle and the census of
  2000, each on the register's list of one date, which the register's correspondences bring
  onto the list of the votes; swisstopo's swissBOUNDARIES3D gives the area. Languages per
  municipality exist only in the census of 2000, cows only per canton. The election days come
  from the Federal Council's circulars to the cantons.
- **Performance**, the look after #7, on 2026-11-16: `investigations/performance.md`, with its
  scripts in `investigations/performance/`. The frames of 17 to 21 ms after a click were the
  measurement's: the browser test clicked 2 ms after the pointer arrived, and the arrival's
  measurement lasted until the click's frame was drawn. The first pointing after the page has
  loaded cost 7 to 20 ms, the map's names built through Svelte's deep proxy of the loaded file.
  A busy machine stretches a frame now and then, mostly right after a build. Change 7a,
  `tighten-map-budget`, takes these findings.
- **Limits**, found while proposing and applying #8, on 2026-11-16: `investigations/limits.md`,
  with its scripts in `investigations/limits/`. The Swiss abroad hold 1.0% to 1.6% of the valid
  votes and turn one verdict (2015-06-14); only the party strengths lack figures, in 5 to 7 small
  Bern municipalities; the results of six named selections; under red-green colour vision
  deficiency every mid grey matches a yes colour, so set-aside municipalities are dark grey; and
  a drag's frames were mostly Svelte rebuilding all 2,110 fills at every step, now repainting
  only the municipalities whose state changed.
- **Languages**, found while proposing #9, on 2026-11-17: `investigations/languages.md`, with its
  script in `investigations/languages/`. The official French and Italian terms of the kinds of
  vote, the majorities, the verdicts and the figures (the Chancellery's linked data and the
  Constitution), the Swiss abroad (the Swiss Abroad Act), the parties (STAT-TAB, the party
  register and the parliament, where they differ) and the offices and their publications; the
  data files already hold every title, reference and note in the three languages, and places
  have one name each; three languages make the vote pages about 40 MB.
- **Small screens**, found while proposing #10, on 2026-11-18, and while applying it, on
  2026-11-19: `investigations/small-screens.md`, with its scripts in
  `investigations/small-screens/`. 139 of the 381 pages were wider than 360 pixels (the Italian
  verdict boxes, long German words of titles); on a phone a dragged limit's result and the map lie
  out of view; the browser takes a finger on the map unless it has `touch-action: none`, and this
  machine's browser carries out no gesture of a finger by itself; the controls' sizes; the frames
  with the CPU slowed 4× and 6×; d3-zoom's size; and, while applying, a tap's lost click right
  after a finger and Chrome's moving of a tap to a neighbour, and the frame of a finger's
  touchdown.
- **Site style**, found while proposing #10a, on 2026-11-19, and while applying it the same day:
  `investigations/site-style.md`, with its scripts in `investigations/site-style/`. The pages
  were in the browser's serif; of five fonts that could be served, Source Sans 3 is the smallest
  (28,872 bytes) and the narrowest, its digits of one width, and the site's text lies wholly in
  its Latin face; the contrast of a light and a dark palette; the set-aside grey 11.1 apart from
  a ground of `#121212`; and, while applying, the pages still fit 360 pixels, a tap on a lake
  needs the Zürichsee zoomed in on a narrower map, and the slider moves 44 to 46 pixels when "Mit
  Ihrer Auswahl" appears.
- **Share link**, found while proposing #11, on 2026-11-19, and while applying it, on 2026-11-19
  and 2026-11-20: `investigations/share-link.md`, with its scripts in
  `investigations/share-link/`. Safari throws after 100 address changes in 10 seconds, Firefox
  past its own limit, and Chrome drops changes beyond 200; a held arrow key makes 10 to 30 a
  second; a link with all 21 limits is at most 505 characters; every value of a step comes back
  to a step of the same value. While applying: a shallow `goto` leaves `page.url` as it was and
  SvelteKit's announcer reads the page's title once; Chromium runs the listeners on `window` in
  the order they were added; and a link with all 21 limits takes 55 to 94 ms.
- **Vote comparison**, found while proposing #12, on 2026-11-20: `investigations/vote-comparison.md`,
  with its scripts in `investigations/vote-comparison/`. The same limits keep the same
  municipalities on one vote day and up to 336 of 2,110 others on a day years apart; a vote's file
  of entries is 57 to 60 KB, about 25 KB gzipped; one recalculation takes 0.066 ms in Node; a vote
  page's two result boxes stack at 360 pixels, 790 pixels together. While applying, on
  2026-11-22 (the archived change's `tasks.md`): a list is as wide as its longest option, some
  2,000 pixels for a vote's title, and Svelte binds no `undefined` to a prop that has a fallback.

- **More characteristics**, found while proposing #13, on 2026-11-22:
  `investigations/more-characteristics.md`, with its scripts in
  `investigations/more-characteristics/`. STAT-TAB has 96 tables per municipality in six themes.
  Education, religion and housing exist per municipality in the census of 2000 only, complete
  and whole. Those born abroad are complete for 2010 to 2025; the jobs by sector have about 100
  municipalities a year with a withheld count ("X"); the farms and their organic farmland are
  complete. The urban or rural type is a category of the register. Income comes from the
  Federal Tax Administration, whose server sends no reply to the pipeline's client; its files
  were not read. While applying, on 2026-11-23 (the archived change's `tasks.md`): the farms
  table goes back to 1975 and has no organic farmland before 1990; the data file is 2.40 MB,
  976 KB with gzip; an update of 61 queries took 24 minutes; a link with all 35 limits takes
  71 to 126 ms.
- **Redesign**, found while proposing #14, on 2026-11-24: `investigations/redesign.md`, with its
  scripts in `investigations/redesign/`. On a vote's page the result, the limits and the map lie
  on three screens: with two limits set, in a window 1,280 by 800 pixels, the map begins 1,225
  pixels down. Every figure but the map's is text. The start page is 6,205 pixels of running
  text, 14,897 on a phone. A broadcaster's result pages draw a result as a bar with a mark at
  half and the cantonal votes as dots. 155 of the 255 browser tests name today's structure, most
  through a few helpers. The drawings a new look adds cost 1 to 2 ms of a frame of a drag; the
  colours it adds are measured. The mockups of the new layout are written by the scripts in
  `investigations/redesign/mockups/` from the built site. Found while applying, on 2026-11-25:
  with two limits set the map begins 429 pixels down, beside the first slider; the result, the
  map and its legend end within the window in each of 216 windows measured; and nothing moves in
  the frame a selection first applies, which had been the longest of a drag. Found after the
  merge, on 2026-11-25: on a phone 360 by 740 pixels the first slider begins 621 pixels below the
  top of the selection's result with the limits above the map, 1,211 with the map between them;
  and on the machine the change was built on, seven of nine full runs of the browser tests failed
  a budget, with 31 of 4,443 frames over 16 ms and none over 50 ms.

## Failure modes of the predecessor (must not repeat)

1–5 were found by reading and running `lukaspestalozzi/votation-visualisation`; 6–8 are from its
README and its repository. The change named after each specifies against it.

1. The cantons in favour were miscalculated: per canton, only the last municipality processed
   counted instead of the sum (`computeMajorityCanton` in `visualisation/myscript.js`) (→ 2).
2. Schaffhausen was treated as a half canton and Appenzell Ausserrhoden as a full one (→ 1).
3. Merged municipalities appeared as several rows with identical figures and were counted more
   than once. For the vote of 2016-02-28 on the taxation of couples, the municipal yes votes sum
   to 1,622,968 against 1,609,152 in the official result (→ 3).
4. Every vote was judged by the double majority, including optional referendums (→ 2 for the
   rule, 3 for the kind of each vote, 4 for the verdicts shown).
5. The slider for the elderly took its range from the data on under-18-year-olds and filtered on
   the data on over-65-year-olds (→ 7 for the one definition of each characteristic, 8 for the
   control).
6. The sources were inconsistent, and nothing caught it early: mergers applied at different
   dates in different data sets, counts delivered as integers, floats or text, and one missing
   value in the vote results that surfaced far down the pipeline (→ 3, 7).
7. There were no automated tests and no CI. The only integrity check was a notebook run by hand
   (→ 1 for the tests and the CI build job, 3 for the pipeline's checks in the notebook's
   place).
8. The libraries were loaded from third-party servers at run time, one of them over plain HTTP
   (→ 1).
