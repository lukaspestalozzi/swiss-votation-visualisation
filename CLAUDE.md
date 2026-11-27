# Popular Vote Explorer

A web app that shows how Switzerland voted in national popular votes, municipality by
municipality, and recalculates the result as if only municipalities of a certain kind had voted.
A static site for the curious public; everything runs in the browser. "Popular Vote Explorer" is
a working title: the name is not decided.

**Status:** the skeleton, the calculation, the vote data, the first screen, the map, the
characteristics, 35 of them, the limits, the languages, the small screens, the look, the share link and the comparison of two votes. Every page is written in German, French and Italian,
under `/de/`, `/fr/` and `/it/`; the site's address and the addresses of before open the page in
the browser's language, German otherwise, and the head of every page, with the working title and
its mark, the comparison and the guide, holds a switch that opens it in another. Every page is set
in Source Sans 3, served with the site, in light colours or, when the browser prefers, dark ones.
Colour means a result: a verdict and a bar take the map's colour of their side, links and controls
the text's. A page is at most 1,600 pixels wide.
The start page asks the question the site answers and lists the national votes by year and vote
day, each a row with a bar of its yes share, below a search by title, four buttons for the result
and a link per year, which stay at the top of the window. Each vote has its page: its result as a
row with two bars, the voters' and the cantons', and below it the selection's ("Mit Ihrer
Auswahl"); a map of the municipalities in the colours of their result, with its legend as a scale,
which can be zoomed (its buttons, Ctrl or ⌘ with the wheel), moved, pointed at and clicked, or on a
touch screen moved with one finger, zoomed with two and tapped; from 1,024 pixels the limits on
the characteristics beside both, which stay in the window while the limits scroll, and in a narrower window between the result and the map; below, a panel
with the 35 characteristics of the municipality last clicked or tapped, in eight groups, which the
map outlines, and a table of the cantons with a bar per row. A limit, added with one button and
its list under the panel's headings, draws where the municipalities lie on its track and marks
the municipality last clicked; the limits select municipalities, and the selection's result, the
table of the cantons and the map (set-aside municipalities dark grey) follow every step of a
slider, in the browser, and the page's address holds the selection after `#`, so that a link, a
reload or the language switch keeps it; a page compares two votes (`/de/compare/`), the same
municipalities, kept by the first vote's figures, counting in both, each vote drawn as on its
page, the second below the first, and its address holding both votes and the selection; a judged
vote's page links to it below its limits; on a
phone every page fits a window 360 pixels wide, the controls are at least 44 pixels, and a bar at
the bottom of the window repeats the selection's result while that result is out of view; a page
"Lesehilfe" (`/de/guide/`) explains the thought experiment and names the sources; the calculation gives the result of a vote from the entries that remain and the outcome of
each canton, and is tested against seven official votes; the pipeline writes the results of the
125 national votes since 2013, per municipality, the map's shapes and the characteristics'
counts to `app/static/data/`, and
a test runs the calculation over every one of them; the build, the checks, the module boundaries and CI are in
place, and CI publishes the site at https://lukaspestalozzi.github.io/swiss-votation-visualisation/
after every push to `main` whose checks pass; a branch's preview is published, on Q's request, as
one private Claude Artifact ("The preview"). Changes #1 to #19, 7a, 9a and 10a of `docs/roadmap.md`,
`add-project-skeleton`, `add-result-calculation`, `add-vote-data`, `add-vote-list`,
`publish-site`, `add-result-map`, `add-characteristics`, `tighten-map-budget` (the look at
performance after #7: one budget of 16 ms per frame for every input of the map), `add-limits`,
`add-interface-languages`, `steady-budget-tests` (the browser tests one at a time, so that no
test runs beside a budget test), `add-small-screens`, `add-site-style`, `add-share-link`, `add-vote-comparison`,
`add-more-characteristics` (#13: 14 characteristics beyond the predecessor's, from six more
STAT-TAB tables: those born abroad; religion, education and housing of the census of 2000; the
jobs by sector; the farms and the organic farmland) and `redesign-site` (#14: a new layout and
look for every page, and, added after its merge, the limits above the map in a narrow window and
frame budgets that hold on a slower machine: at least nine frames in ten of a step within 16 ms
and none over 50 ms), `reword-site-texts` (#15: the wording of eight texts in three
languages) `clarify-phone-window` (#16: what the verification of #14 and #15 found),
`add-pull-request-site` (#17: the preview of a branch as a Claude Artifact) and
`add-vote-summaries` (#18: a summary of each vote in three languages with a link to the Federal
Council's explanations) and `tidy-after-review` (#19: what Q's and Claude's review of the built
site found), are archived, and
`openspec/specs/` holds their specs.
Each vote's page and the comparison show a summary of the vote in three languages, written for
the site from the Federal Council's explanations, with a link to them (change #18,
`add-vote-summaries`, archived).
Thirteen investigations are done: `investigations/data-sources.md`, `investigations/map-data.md`,
`investigations/characteristics.md`, `investigations/performance.md`,
`investigations/limits.md`, `investigations/languages.md`, `investigations/small-screens.md`,
`investigations/site-style.md`, `investigations/share-link.md`,
`investigations/vote-comparison.md`, `investigations/more-characteristics.md`,
`investigations/redesign.md` and `investigations/vote-summaries.md`.
v1, changes #1 to #10a, is complete, and #11, `add-share-link`, #12, `add-vote-comparison`,
#13, `add-more-characteristics`, #14, `redesign-site`, #15, `reword-site-texts`, #16,
`clarify-phone-window`, #17, `add-pull-request-site`, #18, `add-vote-summaries`, and #19, `tidy-after-review` (what Q's and Claude's review of the built site found: no mark of validation, a shorter sentence at the limits, the button "Knappes Ergebnis", the summaries' numbers and the French spaces), the changes after v1, are archived. #20, `cache-stat-tab-answers` (STAT-TAB's answers of final figures kept in the repository, so that an update asks only for what can still change), is in flight.
`docs/roadmap.md`
names income per municipality and a limit on categories as open.
`README.md` is the human-facing overview.

## Where things are

| Path | What |
|------|------|
| `openspec/config.yaml` | Project context and rules: product, hard constraints, decided stack and what is still open, module boundaries, quality bar, glossary. Read first. |
| `openspec/specs/` | Current truth: what the app does, one spec per capability: `app-shell`, `build-checks`, `characteristics`, `interface-languages`, `limits`, `municipalities`, `publishing`, `reading-guide`, `result-calculation`, `result-map`, `share-link`, `site-style`, `small-screens`, `verdicts`, `vote-comparison`, `vote-data`, `vote-list`, `vote-summaries`. |
| `openspec/changes/` | In-flight changes: proposal, spec deltas, design, tasks. Finished ones are under `openspec/changes/archive/`. |
| `docs/roadmap.md` | Ordered list of planned changes and their status, what counts as v1, the investigations, and the predecessor's failure modes with the change that specifies against each. |
| `investigations/` | Spikes and verified reference values (test oracles). `data-sources.md` is the first, `map-data.md` the second (the map's sources, the distances of its colours, the municipal figures its specs cite; scripts in `map-data/`, run as the file says), `characteristics.md` the third (the characteristics' sources, the list each uses, how they come onto the votes' list, and the figures the specs cite; scripts in `characteristics/`, run as the file says), `performance.md` the fourth (why frames after a click looked slow, the first pointing's cost, a busy machine's long frames; scripts in `performance/`, two in JavaScript on the global Playwright, two in Python that read their traces, `budget_tries.py`, which reads Playwright's JSON reports of the budget tests, and `budget_tests_traced.spec.ts`, the budget tests with a trace, copied into `app/e2e/` to run; all as the file says), `limits.md` the fifth (the Swiss abroad, missing figures, the tracks, named selections, the grey of set-aside municipalities, a drag's frames; scripts in `limits/`, two in Python on the data files and four in JavaScript on the global Playwright, run as the file says), `languages.md` the sixth (the official French and Italian terms and their sources, what the data holds in three languages, the names of places, the site's size; its script in `languages/`, Python, standard library only, run as the file says); `small-screens.md` the seventh (pages wider than 360 pixels and why, where a phone's screen shows the parts of a vote's page, what the map receives from fingers, what this machine's browser does not do with them, the controls' sizes, frames with the CPU slowed, d3-zoom's size, and, found while applying, a tap's lost click right after a finger, Chrome moving a tap to a neighbour, and the frame of a finger's touchdown; scripts in `small-screens/`, eight in JavaScript on the global Playwright and one in shell, run as the file says); `site-style.md` the eighth (the look of before, five fonts that could be served and the site's characters in Source Sans 3's Latin face, the contrast of a light and a dark palette, a dark ground beside the map's colours, the map's size by width, and, found while applying, every page still within 360 pixels, a tap on a lake with the map narrower, and a slider that moves while dragged; scripts in `site-style/`, three in JavaScript on the global Playwright (`lake_tap.mjs` imports the browser tests' `pointing.ts`), one in shell that packs the fonts outside the repository and runs one in Python with fontTools, and one in Python, standard library only, run as the file says); `share-link.md` the ninth (how often a page may change its address, SvelteKit's shallow `goto`, a link opened in the tab that shows its page, a link's length, values and steps, what a change of the data moves, and, found while applying, SvelteKit's announcer, `page.url` after a shallow `goto`, the order of listeners on `window` and the frame of a link with 21 limits; scripts in `share-link/`, `link.mjs`, which imports the app's `limits.ts` and `characteristics.ts`, and `listener_order.cjs`, both in JavaScript on the global Playwright, run as the file says); `vote-comparison.md` the tenth (the same limits on two vote days, two named comparisons, what a comparison page would load, the cost of recalculating two votes, the result boxes on a phone; scripts in `vote-comparison/`, five in JavaScript, `same_limits.mjs`, `calc_cost.mjs`, `sizes.mjs` and `first_vote.mjs` on the app's own modules and `layout.mjs` on the global Playwright, and `reference_comparisons.py`, Python, standard library only, run as the file says); `more-characteristics.md` the eleventh (which further figures STAT-TAB and the register give per municipality: income, whose source refuses the pipeline's client, religion, education and housing in the census of 2000, those born abroad, the jobs and their withheld counts, the farms and their farmland, turnout, the urban or rural type, the size of the data, the BFS's words in three languages, the figures of named municipalities, and, found while applying, the farms table's years without organic farmland, the data file's size as built, the time of an update and the frame of a link with 35 limits; scripts in `more-characteristics/`, eight in Python, standard library only, which reuse `figures.py` of `characteristics/`, run as the file says); `redesign.md` the twelfth (what a window shows of the pages today and how long they are, what a broadcaster's result pages draw, which browser tests name today's structure, the frames of a drag with the drawings a new look adds, the contrast of the colours it adds, the mockups of the new layout with where their parts stand by window, and, found while applying, the pages as built, the part that stays in the window, the frame in which a selection first applies, the longest frames of the budget tests and the start page's widths; scripts in `redesign/`: `look.cjs`, `drag_with_drawings.cjs` and, found while applying, `stays.cjs`, `first_step.cjs` and `start_page.cjs` in JavaScript on the global Playwright, `bars_cost.mjs`, found by the verification, on the app's own modules, `narrow_order.cjs` and `phone_heights.cjs`, found after the merge, on the global Playwright, `budget_frames.py`, found after the merge, in Python, standard library only, which reads the saved output of full runs of the browser tests, `colours.py` in Python, standard library only, and in `redesign/mockups/` the scripts that write the mockups from the built site, `extract.cjs`, `hist.mjs`, which imports the app's `limits.ts` and `characteristics.ts`, `build.mjs` and `shots.cjs`, with the mockups' stylesheet `mock.css`, the reference for the look of `redesign-site`; run as the file says); `vote-summaries.md` the thirteenth (where the Federal Council's explanations of each vote day are in German, French and Italian, on www.admin.ch from 2015-06-14 and as Swissvotes' copies before, the one French page of 2016-02-28 that links the German booklet, how admin.ch and Swissvotes answer a request, the law on the explanations, the sample of summaries Q reviews with three approved ones, and the comparison's size; its script `find_explanations.py` in `vote-summaries/`, standard library and `pdftotext`, which downloads the booklets outside the repository, with its output `find_explanations.out`, run as the file says); the first's scripts are in `data-sources/` (Python, standard library only; the downloads stay outside the repository). One of them, `write_reference_votes.py`, writes the reference data of the calculation; `investigations/data-sources/check_ids_and_cantons.py` shows the three facts found while proposing #3, and `check_tie_break.py` what the yes and no of a tie-break question stand for, found while proposing #4. Each file names its sources, the script and the output that produced its values, and the expected values with tolerances, so that specs and tests can cite it. |
| `calculation/`, `app/`, `pipeline/` | The three modules. The code map below lists their files. |
| `app/static/data/` | The data files of the app: `app/static/data/votes.json` (the list of votes, each with its summary and the addresses of its explanations from `pipeline/vote-summaries.json`), `app/static/data/votes/<id>.json` (one file per vote, its entries), `app/static/data/municipalities.json` (the list of municipalities and the Swiss abroad), `app/static/data/map.json` (the map's shapes: municipalities, cantons, the outline of Switzerland, lakes), `app/static/data/characteristics.json` (the counts of the characteristics of each municipality, per year and election, a count the source withholds as `null`), `app/static/data/sources.json` (the record of the source files, with the query of each answer to one). Written by the pipeline (`pipeline/README.md`), never by hand; committed, and served with the site as they are. Their shape is decision 12 of the design of `add-vote-data` (of `map.json`, decision 14 of the design of `add-result-map`; of `characteristics.json`, decision 12 of the design of `add-characteristics` and decision 10 of the design of `add-more-characteristics`), their types are in `app/src/lib/vote-data.ts`. |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` | The root of the pnpm workspace: the scripts of every check, pnpm pinned in `packageManager`, Node 24 required (`engineStrict`). |
| `eslint.config.js`, `prettier.config.js`, `.prettierignore` | The linter and the formatter, one configuration for both packages. Prettier leaves Markdown, `openspec/`, `docs/`, `.agents/`, `.claude/`, `.github/`, the calculation's reference data and the app's data files alone. ESLint leaves `investigations/` to Prettier: its scripts are spikes outside the three modules. |
| `.agents/skills/` | The OpenSpec workflows as skills, generated by `openspec init`; `.claude/skills/` holds a link to each. Not edited by hand: `openspec update` writes them again. |
| `.github/workflows/ci.yml` | CI: the jobs `specs`, `build` and `pipeline`, and `deploy`, which publishes the build the browser tests checked on GitHub Pages, on pushes to `main` only. It pins the OpenSpec version, the Node version and the version of `astral-sh/setup-uv`. |
| `scripts/verify-local.sh` | The same checks as CI, run locally. |
| `scripts/preview.mjs` | The preview of a branch as a Claude Artifact: builds it, packs its German pages with a launcher and writes the lists of files to publish ("The preview" below). |
| `.claude/hooks/session-start.sh` | Web sessions only: puts Node 24 on the `PATH`, installs pnpm, the OpenSpec CLI in CI's version (with its profile and workflows), the project's dependencies and the pipeline's Python and packages (`uv sync`). Registered in `.claude/settings.json`. |

## Code map

Three modules; `openspec/config.yaml` gives their boundaries. The last task of every change
keeps this map current.

### calculation

Pure TypeScript: the rules of a vote. It depends on nothing, neither on the other modules nor on
the DOM, Node or a UI framework.

| File | What |
|------|------|
| `calculation/package.json` | The package `calculation`. No dependencies. It exports `src/index.ts` as TypeScript source; there is no build step of its own. |
| `calculation/tsconfig.json` | No DOM and no Node types, `rootDir` `src`: this is what makes a forbidden import fail. |
| `calculation/src/index.ts` | What the package exports. |
| `calculation/src/cantons.ts` | The 26 cantons with their cantonal votes, and the total of a list of cantons. |
| `calculation/src/cantons.test.ts` | Its unit tests. Unit tests live next to the code as `*.test.ts`. |
| `calculation/src/kinds.ts` | The six kinds of vote and the majorities each needs; a tie-break question is not calculated. |
| `calculation/src/kinds.test.ts` | Its unit tests. |
| `calculation/src/result.ts` | `calculateResult`: from the entries that remain, the votes, the yes share, the cantonal votes, both majorities, the verdict, and the outcome of each canton with an entry, in the order of the constitution. It throws on an entry it cannot count. |
| `calculation/src/result.test.ts` | The rules, with made-up figures. The package has neither DOM nor Node types, so a test uses no `console` and no `performance`. |
| `calculation/src/reference-votes.json` | Test data: all municipal entries of seven official votes. Written by `investigations/data-sources/write_reference_votes.py`, not by hand, and not formatted. Only a test imports it. |
| `calculation/src/selection.ts` | The selection: `remainingMunicipalities`, the municipalities within every narrowed limit (a limit at the ends of its values sets nothing aside, a narrowed one sets aside a municipality without a figure); `entriesThatRemain`, their entries and, while the switch counts them, the Swiss abroad of each canton in which one remains. Plain numbers only. |
| `calculation/src/selection.test.ts` | Its unit tests, with made-up numbers and the vote of 2015-06-14, number 595, without its Swiss abroad. |
| `calculation/src/reference-votes.test.ts` | The seven votes against their official figures, which are those of `investigations/data-sources.md`. |

### app

The user interface: SvelteKit 3 with the static adapter, Svelte 5. It depends on `calculation`.
SvelteKit 3 has no `$lib`: the routes import `src/lib/` by relative paths. What a page shows is
worked out in plain TypeScript in `src/lib/`; the Svelte components only lay it out.

| File | What |
|------|------|
| `app/package.json` | The package `app`. `@playwright/test` is pinned exactly (see "Build and verify"); Vitest for the unit tests; the font, `@fontsource-variable/source-sans-3`, pinned at 5.3.1, whose files the build serves with the site. |
| `app/vite.config.ts` | The configuration of Vite and SvelteKit, with the static adapter, and of Vitest, which runs `src/**/*.test.ts` only, not the browser tests. There is no `svelte.config.js`. It holds the site's path, `/swiss-votation-visualisation`: the site is built for it, with absolute paths, and written to `app/build/swiss-votation-visualisation/`. With `PREVIEW=1`, the preview's build: relative addresses, written to `app/build/preview/` ("The preview"). |
| `app/tsconfig.json` | Extends the one SvelteKit generates. `rootDir` `.` makes an import from `pipeline/` fail. |
| `app/src/app.css` | The style of every page (spec site-style): Source Sans 3 from the package's faces, every colour of the page named once on `:root`, light and under `prefers-color-scheme: dark`, among them the two sides of a bar, the bins of a histogram outside a limit, the ground of a row pointed at, the empty part of a track and the hairline between rows; the text's line heights; a page at most 100rem wide, the start page and the guide at most 76rem, 32 pixels from each side and 16 below 640 pixels, paragraphs at most 40rem; links in the text's colour; the classes `secondary`, `side-yes`, `side-no` and `visually-hidden`; the look of a bar (`.bar`: its yes part, its no part and the mark at half, `.neutral` for one that judges nothing); buttons and lists in the page's colours, and the ring of focus. |
| `app/src/app.html` | The page template; its language is the page's (`lang="%lang%"`, which `hooks.server.ts` fills in). |
| `app/src/app.d.ts` | SvelteKit's place for the app's global types. |
| `app/src/hooks.server.ts` | Writes each page's language into its `lang` while the page is written, prerendering included: the first segment of the address, or "de" for a page that redirects. |
| `app/src/routes/+layout.svelte` | The layout of every page, those that redirect included: it imports `app.css` and preloads the font's Latin file. |
| `app/src/routes/+layout.ts` | `prerender = true`: every page is written as a file at build time; `trailingSlash = 'always'`: as `<path>/index.html`, at the address `<path>/` (`/de/votes/5960/`). |
| `app/src/routes/+page.ts`, `+page.svelte` | The site's address without a language: a page that redirects (`csr = false`) to the start page in the browser's language. |
| `app/src/routes/guide/+page.ts`, `+page.svelte` | The guide's address of before: a page that redirects to the guide in the browser's language. |
| `app/src/routes/votes/[id]/+page.ts`, `+page.svelte` | A vote's address of before, for every vote of the list: a page that redirects to the vote's page in the browser's language; any other id is a 404. |
| `app/src/routes/Redirect.svelte` | A page that redirects: the script of `languages.ts` in the head, a `<noscript>` refresh to the German page, and the three links "Deutsch", "Français", "Italiano" in the body. It loads no script of the app. |
| `app/src/routes/[lang]/+layout.server.ts` | The language of every page under it, from its address; any other value is a 404. |
| `app/src/routes/[lang]/+layout.svelte` | The head of every page: the working title with its mark, linked to the start page, the comparison ("Vergleichen") and the guide's heading, each a link except on its own page, where it is text marked as the page shown, and the switch: "Deutsch", "Français", "Italiano", below 640 pixels their codes, a link named by both, the page's own as text, the others linking to the same page in them (by route, through `resolve`, the comparison's among them), with the hash of its address as SvelteKit knows it (`page.shallow?.url ?? page.url`) in the browser, so that the selection goes along, and loading it anew. It marks the head of the start page and of the guide `narrow`, by which `app.css` makes those pages narrower. It wraps between its parts, never within one. |
| `app/src/routes/[lang]/+page.server.ts` | The start page's data, at build time, in each language (`entries`): the list of `vote-list.ts`, from `app/static/data/votes.json`, and the number of characteristics beyond the three the page's sentence names. |
| `app/src/routes/[lang]/+page.svelte` | The start page: the question the site answers as its heading, one sentence, and the votes by year and vote day. A row is its vote's title, a link in the same language that reaches over the whole row and is underlined while the row is pointed at, with the kind, the bar of the official yes share (`ShareBar.svelte`), the share, the result in the colour of its side and its mark "Hinweis"; a tie-break question has no bar. The line between two rows ends where the vote day's line ends. Above the list, staying at the top of the window: the field "Titel suchen", the buttons "Alle", "Angenommen", "Abgelehnt" and "Knappes Ergebnis", which wrap where one line does not hold them, and a link per year the list shows, on further lines where one does not hold them. The list is `listShown` of the words typed and the result kept, neither stored nor written to the address, and whole as built; the page measures the staying part's height, for the room a year's heading keeps below it. A row takes two lines below 1,024 pixels, the year and the day stand above their rows below 768, and on a touch screen the field and the buttons are at least 44 pixels. |
| `app/src/routes/[lang]/ShareBar.svelte` | A bar of a share: its yes part as wide as the share, its no part the rest, and a mark at half; empty without a share, `neutral` where it judges nothing. A result's row, the tie-break question, the map's details and the start page's rows use it; its look is `app.css`'s, and assistive technology passes it over. |
| `app/src/routes/[lang]/guide/+page.server.ts` | The guide's data, at build time, in each language: the list's reference date and the lakes' set, from `map.json`. |
| `app/src/routes/[lang]/guide/+page.svelte` | The page "Lesehilfe" (`/de/guide/`), one column of at most 42rem with a line between its sections: six sections on the real result, the selection, what it does not show, the Swiss abroad, municipalities without a result or a figure and the characteristics, then the sources, among them that the votes' summaries are the site's own, with a link to `data/sources.json`. |
| `app/src/routes/[lang]/compare/+page.server.ts` | The comparison's data, at build time, in each language: the votes of `comparableVotes`, from the list and the files of entries, and the numbers of the Swiss abroad. |
| `app/src/routes/[lang]/compare/+page.svelte` | The comparison of two votes: the heading, the lists "Erste Abstimmung" and "Zweite Abstimmung", each below its label and as wide as the column, the second disabled until a first vote is chosen and, until then, the sentence that says what to do, the parts of the address it could not use, each chosen vote's `ComparedVote`, the second below the first, and, beside them from 1,024 pixels and below them otherwise, the sentence that the same municipalities count in both and `Limits.svelte` on the first vote's tracks without its count; last the bar. It reads the votes its address names once it is in the browser, and again on `hashchange`, the selection once the characteristics have loaded and a first vote is chosen, and writes both as a vote's page writes its selection, nothing while a selection waits for a first vote; another first vote reads the selection anew on its tracks. It loads each chosen vote's file once, makes its real result and entries per canton when it arrives, and at each step only the selection's results, over the same municipalities (`resultsOf`). The lists take at most the page's width, and on a touch screen at least 44 × 44 pixels; the votes' column does not anchor the page's scroll, so that a limit stays under the pointer when a selection first applies. |
| `app/src/routes/[lang]/compare/ComparedVote.svelte` | A chosen vote: its title, date and kind, its summary with its link (`VoteSummary.svelte`), its results as rows of `ResultRow.svelte`, their headings one level below its title, the selection's below the real one, its count while a selection applies, and its notes; a sentence while its file loads or when it cannot. It gives its results up to the page, for the bar. |
| `app/src/routes/[lang]/compare/ComparisonBar.svelte` | The bar at the bottom of a window narrower than 640 pixels: while a selection applies and a vote's results are not wholly in the window (an `IntersectionObserver` on each), each vote's outcome with the selection, "Erste Abstimmung: Angenommen", in the colour of its side; sticky, its top border in `--border`, `aria-hidden`. |
| `app/src/routes/[lang]/compare/loaders.ts` | The loader of the votes' files of entries, one per visit; the characteristics come from the vote page's `loaders.ts`. |
| `app/src/routes/[lang]/votes/[id]/+page.server.ts` | A vote's page, at build time: `entries()` names every vote of the list in each language; `load` reads the vote's file through `import.meta.glob` and returns what `vote-page.ts` gives, so the page holds its result and the browser loads no file of entries, and, for a judged vote, its entries per canton (`voteEntriesOf`, checked against `map.json`) and the majorities it needs, for the map and the selection, and its id, for the link to the comparison. |
| `app/src/routes/[lang]/votes/[id]/+page.svelte` | A vote's page, with the texts of its language: the link back, the head, the sentence on the majorities, the summary with its link (`VoteSummary.svelte`); then the workbench. On its left the vote's result and, below it, the selection's (`ResultRow.svelte`) or, until a selection applies, a sentence in its place, as tall as a result, and the map (`ResultMap.svelte`): the two stay in a window at least 1,024 pixels wide and 700 high, with the map's notes (`MapNotes.svelte`) below them. On its right from 1,024 pixels, and in a narrower window between the result and the map, where the stylesheet alone shows them first and the document keeps result, map, limits, the limits and, for a judged vote, the link "Mit einer anderen Abstimmung vergleichen" to the comparison, with the vote and the page's current selection (`comparisonLinkOf`). Below both, the panel and the table of the cantons, which follows the selection, a bar per row from the middle to the canton's yes share and, under a selection, a mark of its real share; or the tie-break question's figures with their bar; the sources and notes; last, the bar of `SelectionBar.svelte`, given the selection's result. It holds the limits, the switch and the municipality last clicked, loads the characteristics, and derives the remaining municipalities and the selection's result, the count and the set-aside by `limits.ts`. Once the characteristics have loaded, a judged vote's page reads the selection its address holds by `share-link.ts`, and again on `hashchange`, and keeps the parts it could not use until the selection next changes; half a second after the selection's last change, and after each reading, it writes the selection after `#`, by a shallow `goto` of its own path that replaces the history's entry, when it differs from the browser's address or from the address as SvelteKit knows it. A tie-break question's page does neither. Its heading breaks a word too long for the line. Beside the limits the map's column does not anchor the page's scroll, so that a limit stays under the pointer. The table's sides take the class of their side (`side-yes`, `side-no`); the date and kind, sources and notes the class `secondary`. |
| `app/src/routes/[lang]/votes/[id]/VoteSummary.svelte` | A vote's summary and, below it, the link to its day's explanations (spec vote-summaries), on a vote's page below the sentence on the majorities and on the comparison below each vote's head; on a touch screen the link is at least 44 pixels high. |
| `app/src/routes/[lang]/votes/[id]/ResultRow.svelte` | A result as a row: its heading ("Echtes Ergebnis" or "Mit Ihrer Auswahl") and outcome; the majority of voters with its word, the yes share, its bar (`ShareBar.svelte`) and the yes and the no votes; the majority of cantons with its word, the cantonal votes, a bar of one segment per canton and, for the vote, the turnout. A majority that is not needed has no bar, and its cantonal votes are greyed. Each word takes the class of its side. It follows the room of the element that holds it: below 640 pixels the outcome stands above the two majorities, below 448 all three one below the other. It takes the level of its headings, 2 on a vote's page and 3 on the comparison. |
| `app/src/routes/[lang]/votes/[id]/Limits.svelte` | The section "Gemeinden auswählen": the sentence with the link to the guide, the parts of the page's address it could not use, the count with a bar of the municipalities that remain (none when it is given none, as on the comparison), each limit with its label (name, date and bounds), "Entfernen", the bars of where the municipalities lie on its track (`barsPathOf`, drawn twice, the drawing in the text's colour clipped to the part between the bounds), two sliders on one track (which do not cross) and, when the municipality last clicked has a figure, its mark below the track; "Merkmal hinzufügen" (`CharacteristicList.svelte`); the switch for the Swiss abroad, drawn as a switch; and "Zurück zum echten Ergebnis"; a message while the characteristics load or when they cannot. On a touch screen (`pointer: coarse`) the buttons and the switch's label are at least 44 × 44 pixels, and each thumb a 44-pixel square whose transparent border keeps the visible dot's size. The track, the thumbs and their rings of focus take the page's colour names. |
| `app/src/routes/[lang]/votes/[id]/CharacteristicList.svelte` | The button "Merkmal hinzufügen" and its list: a modal `<dialog>` headed as the button, the characteristics without a limit under the panel's headings (a group with none left is not offered), each a button that adds its limit and closes the list, and "Schliessen". The button cannot be pressed once every characteristic has a limit. On a touch screen each entry and "Schliessen" are at least 44 × 44 pixels. |
| `app/src/routes/[lang]/votes/[id]/SelectionBar.svelte` | The bar at the bottom of a window narrower than 640 pixels: while a selection applies and the selection's result, "Mit Ihrer Auswahl", is not wholly in the window (an `IntersectionObserver`), the outcome and the words of both majorities, each word in the colour of its side, its top border in `--border`. It sticks to the bottom, and at the end of the page stands below the last line; `aria-hidden`, as it repeats that result. |
| `app/src/routes/[lang]/votes/[id]/loaders.ts` | The loaders of the map's files and of the characteristics, one per visit, shared by the map, the panel and the limits. |
| `app/src/routes/[lang]/votes/[id]/ResultMap.svelte` | The map of a vote, headed for assistive technology only: it loads the shapes and the names once per visit, held as raw state (`$state.raw`), draws the outline in the lakes' colour, the municipalities in their colours or hatched, the lakes and the cantons as SVG, and the municipality last clicked or tapped outlined above them, black on a white halo; the box of details on pointing, clicking or tapping, with a bar of the yes share; zoom with the buttons, Ctrl or ⌘ with the wheel (the wheel alone scrolls the page) and two fingers, and moving with the mouse or one finger: fingers on it are its own (`touch-action: none`), it keeps the pointers pressed on it, and two make a pinch by `pinchFrom`; the legend, a scale of the eight classes with the yes shares at their borders, and its other entries beside or below it; the message when it cannot load. The municipalities the selection sets aside are painted dark grey by an effect that changes only those whose state changed; the legend and the details name them. It gives the municipality last clicked or tapped up to the page (`clicked`), for the panel and the limits' marks. Its frame, with the zoom buttons and the details, keeps the view's shape: where the result and the map stay in the window it is no taller than the window less the room of the result and the legend (17rem, 21.5rem or 26.5rem by its column's width) and stands in the middle of its column, and the legend's entries keep the room of three lines in a narrow column. Below 640 pixels the zoom buttons stand in a row above the map, which runs to the window's edges; on a touch screen they are at least 44 × 44 pixels. The borders between municipalities, the hatching's ground and the box of details take the page's ground, white or `#121212` in the dark scheme. |
| `app/src/routes/[lang]/votes/[id]/MapNotes.svelte` | The map's source line and the sentence on the Swiss abroad, below the part that stays in the window, with which they do not stay; from the map's file, by the shared loader. |
| `app/src/routes/[lang]/votes/[id]/CharacteristicsPanel.svelte` | The panel below the map, a heading of the page's second level: the municipality last clicked in its head, its characteristics in eight groups headed with their dates, in columns, each line a name, for a share a bar, and the value, and their sources; a sentence before the first click, while they load, or when they cannot be loaded. |
| `app/src/lib/format.ts` | Counts, shares and quotients with decimals (rounded half away from zero, from the counts; `shareHundredths`, a share in hundredths as it is written), a whole number of units with its decimals, cantonal votes and dates, with their year or as day and month, as the screen writes them, without the locale data of the machine. |
| `app/src/lib/format.test.ts` | Its unit tests. |
| `app/src/lib/texts/index.ts` | The `Language` (the data's), the three languages and their names in themselves, `isLanguage`, the keys of the 35 characteristics and of their eight groups, the `Texts` interface and `textsOf`: every text of the screen, one object per language, so that a missing text is a type error. A text with figures is a function of them; a date is written by its language. |
| `app/src/lib/texts/de.ts`, `fr.ts`, `it.ts` | The texts in German, French and Italian, with the Confederation's terms (`investigations/languages.md`), the comparison's and the start page's among them, the link to the explanations and the guide's sentence on the summaries, the French ones with the Confederation's spaces (a no-break space before ":" and inside « », a narrow one before ";", "?" and "!"), and the names of the 35 characteristics and of their groups (design of `add-more-characteristics`, decisions 2 and 3; the Italian names of the census and the farm survey are composed). |
| `app/src/lib/texts/texts.test.ts` | No French or Italian text is the German one, apart from the working title, the dash and the heading "Religion", which German and French share; the six kinds in French and Italian; no French text, written with made-up figures, with one of those signs without its space. |
| `app/src/lib/languages.ts` | The script of a page that redirects: from the page's three addresses, the first of the three languages among the browser's preferred ones, German otherwise; `location.replace`. |
| `app/src/lib/languages.test.ts` | Its unit tests: the script's own text run with a made-up browser. |
| `app/src/lib/vote-list.ts` | The start page's list: the years from the newest, each with its vote days, and for each vote its title, kind, the yes share of its official result as text and as a number, its result, the side of its verdict, whether it is close and its mark; `isClose`, a yes share from 47.00% to 53.00% as the row writes it; `listShown`, the list a search and a button leave: the votes whose title holds every word typed, whatever the case, and whose result is the one kept (all, accepted, rejected or close), without the days and the years that hold none. An empty list is an error. |
| `app/src/lib/vote-list.test.ts` | Its unit tests, against `votes.json` up to 2026-09-27: the years and the vote days, the entries in three languages, and the searches and results of spec vote-list, the close results among them (`isClose` at its edges, 17 votes). |
| `app/src/lib/vote-page.ts` | What a vote's page shows, from its vote of the list and the result the calculation gives over its file. A missing file or a refused entry is an error that names the vote. `judgedOf` writes the figures, verdicts and table of any result, the vote's own and a selection's, a canton with nothing left saying so; each verdict, the outcome and each canton's row say the side they stand for (`Side`), for their colour, and a result gives what its bars draw: the yes share in percent, a segment per canton with a vote left, those in favour first, and each canton's yes share. `summaryOf` gives a vote's summary and its link to the explanations, naming the document's language when it is not the page's. `judgedOfFile` gives the real result of a file of entries, as the comparison calculates it in the browser. |
| `app/src/lib/vote-page.test.ts` | Its unit tests, against the data files and the figures of `investigations/data-sources.md`; `judgedOfFile` gives every judged vote's page its figures; each vote's summary and link, in three languages; the summaries' numbers as the screen writes them, the French spaces, and 6730 without its cost. |
| `app/src/lib/vote-data.ts` | The types of the data files in `app/static/data/`, `map.json` and `characteristics.json` included (its seven sets of `add-more-characteristics` among them, the jobs' counts each a number or `null`), and `voteText`: a vote's title, reference, note or summary in a language, an error when it is missing; `explanationOf`, its day's explanations for a language, likewise. |
| `app/src/lib/characteristics.ts` | The 35 characteristics: one definition each (a key, its name from the texts by `nameOf`, its group, unit, source, the scale of its limit's track, value as a quotient of counts, none where a count is withheld), the figures that apply to a vote (the last year and election before its day; those born abroad, the jobs and the cattle with the farms each of their own year, the last of which the file has them and the population), a municipality's counts, a value as a whole number of units as the panel writes it (which a limit compares), with each unit's decimals (`DECIMALS`, which a link reads too; a rate has one), the date of a characteristic's figures as a limit's label and a line of the panel write it (`dateOf`), the eight groups (`GROUPS`), and the panel's groups and lines, a line of another year than its heading naming its date and a share's line giving its share for its bar. |
| `app/src/lib/limits.ts` | A limit's track from its characteristic's definition (1,000 steps, linear or logarithmic, from the smallest to the largest value of a vote's figures), the value of a step and the step of a value (`stepOf`), a limit's label and its parts (`labelPartsOf`, the French colon with its space among them), whether it is narrowed, the municipalities that remain under the limits, the set-aside ones and how many remain, where the municipalities lie on a track (`histogramOf`, 50 bins), the heights of its bars and their drawing as one path (`barHeightsOf`, `barsPathOf`: a bar with a municipality at least a fiftieth of the fullest), and the mark of a municipality on a track (`markOn`). |
| `app/src/lib/limits.test.ts` | Its unit tests, against `characteristics.json` and the figures of `investigations/limits.md`, the six named selections among them, a track and a label for each of the 35 characteristics, and the bars and marks of the tracks of 2016-02-28. |
| `app/src/lib/share-link.ts` | The selection in the address (spec share-link): `linkOf`, the limits and the switch as the part after `#` (each limit as `<key>=<lower>-<upper>` in the page's order, a bound as its label writes it and empty at its track's end, then `abroad=no`), and `selectionOf`, that part read back with `URLSearchParams` into limits on the tracks a function gives, each bound at the step nearest its value, of two the lower, and the parts it cannot use. |
| `app/src/lib/comparison.ts` | The comparison of two votes (spec vote-comparison): `comparableVotes`, the votes the calculation judges, newest first, each as the lists and its table write it, with its summary and its notes; `secondChoices`, the first vote's day first; `comparisonLinkOf` and `comparisonOf`, the address `#votes=<first>,<second>&<selection>` written and read, the parts of `votes` it cannot use among the unusable; `readAnew`, the selection on another first vote's tracks; `withSelection`, a vote's result and count over the municipalities that remain; `resultsOf`, a vote's results as rows for `ResultRow.svelte`, the real one with its turnout and, while a selection applies, the selection's with its count. |
| `app/src/lib/comparison.test.ts` | Its unit tests, against `votes.json`, the files of entries, `characteristics.json` and the figures of `investigations/vote-comparison.md`. |
| `app/src/lib/share-link.test.ts` | Its unit tests, against `characteristics.json` on the vote day of 2016-02-28: the forms, the nearest step, the unusable parts, and every step of every characteristic written and read back. |
| `app/src/lib/characteristics.test.ts` | Its unit tests, against `characteristics.json` and the figures of `investigations/characteristics.md` and `investigations/more-characteristics.md`, and a made-up file. They name a characteristic by its key. |
| `app/src/lib/result-map.ts` | What the map shows: the side and class of a municipality from its votes, compared in whole numbers; the colours, the dark grey of a set-aside municipality among them (the hatching's ground is the page's, from `app.css`); the legend, its eight classes as a scale with the yes shares at their borders, its other entries and its entry for the set-aside; the details of a municipality, with its yes share in percent for their bar; a vote's entries per canton (`voteEntriesOf`), checked against the map. |
| `app/src/lib/result-map.test.ts` | Its unit tests, with the figures of `investigations/map-data.md`. |
| `app/src/lib/map-view.ts` | The part of the map shown, as the SVG's view box: zoom around a point from 1 to 16 times, and moving by a distance on the screen, the view's centre kept inside Switzerland; and the view while two fingers pinch (`pinchFrom`), from the view and the fingers when the second touched. |
| `app/src/lib/map-view.test.ts` | Its unit tests. |
| `app/src/lib/map-data.ts` | Loads `map.json` and `municipalities.json` once, and `characteristics.json` once with a loader of its own, from addresses and a fetch function the page gives; a failed request rejects. `createEntriesLoader`: a vote's file of entries, by its id, once each. |
| `app/src/lib/map-data.test.ts` | Its unit tests, with a fake fetch. |
| `app/src/lib/vote-data.test.ts` | The calculation over every vote of the data files: it gives each vote's yes and no votes, cantonal votes and verdict; four named votes against the official figures of `investigations/data-sources.md`; the map: its municipalities are the list's, every judged vote fits it; and the characteristics: their municipalities are the list's, and each yearly set has its years.; and the 117 votes with a reference and the 8 without, none holding `validated` |
| `app/static/data/` | The data files (see "Where things are"). |
| `app/playwright.config.ts` | The browser tests: they run against `app/build`, served as plain files on port 4173, under the site's path; the tests open pages by paths relative to it (`de/votes/5960/`). They run one at a time (one worker), so that no test runs beside a budget test. |
| `app/e2e/vote-list.spec.ts` | The browser tests of the start page: its heading and sentence, the years and the vote days in three languages, what a row shows (a vote that failed with its bar, one that passed, the tie-break question, the official result, the marks), the whole row as a link, the search (a word, two words, in French, no vote left, the field emptied, without scripts), the four buttons alone and with a word, the close results, the line between two rows, a link to a year below the part that stays, the budget of 50 ms for a key or a press, and "all requests go to the site itself", which starts at the address without a language and opens the guide too; they compare with the site's own `data/votes.json`. |
| `app/e2e/vote-page.spec.ts` | The browser tests of the vote pages: named votes, the address without the final slash, no entries loaded, no other server, an address that names no page (404), a result as one row at 1,280 pixels, its bars (the yes share, a segment for each canton, none for a majority not needed), the tie-break question's bar, the cantons' bars, and the summary with its link, in three languages and on the tie-break question's page. |
| `app/e2e/limits.spec.ts` | The browser tests of the limits and of what follows them: the section, adding and removing, the list's headings in three languages, the tracks, the two bounds by pointer and key, the labels, which municipalities remain, the Swiss abroad, "Mit Ihrer Auswahl", the table and the map under a selection, the count with its bar, the return to the real result, a link with a selection, the button with its list (opened, chosen in, closed, by keys), the bars above a track and their clip between the bounds, the mark of the municipality last clicked, the selection's place, in French and Italian too, and that nothing moves when a selection first applies, a single half canton's bar; and the budgets of a step (nine frames in ten within 16 ms, none over 50 ms) while a bound is dragged, with one limit and with five and a municipality clicked, and after a step by key, and of 50 ms for a jump. |
| `app/e2e/languages.spec.ts` | The browser tests of the languages: the switch and the selection it carries, after a link opened in the tab too, the pages and their `lang`, a language without a page, the terms, the vote's texts, the names of places and the same selection in French, the address without a language and the addresses of before, in browsers that prefer each language or run no scripts. |
| `app/e2e/guide.spec.ts` | The browser tests of the reading guide: its sections and sentences, the reworded ones in French and Italian too, where the selection's result stands in three languages, its one column, its sources and the summaries named as the site's own, and the links to it from the head of the start page and of a vote's page, and from the limits.; the sentence at the limits, its first sentence only, in three languages |
| `app/e2e/share-link.spec.ts` | The browser tests of the selection in the address: its forms and the keys in French, "Back" and nothing sent, one address change after a held key, a link, a value no step has (opened, and in the same tab), a reload, the characteristics not loaded, a link in the same tab, the parts a link cannot use and their sentence, a tie-break question, a new characteristic's key and a link with the 21 keys of before, and the budgets of the frame after a link opened in the same tab, 150 ms with the 21 limits of before and 250 ms with all 35, measured once more when it exceeds them. |
| `app/e2e/compare.spec.ts` | The browser tests of the comparison: the page in each language and its head, the lists, before a vote is chosen (their width, the second disabled, the sentence in three languages) and once one is, the real results under each vote's heading and a known difference, a file that loads late and one that cannot be loaded, the characteristics that cannot, and each file once, two votes of one day and years apart, the address (a link, the choice followed, an unusable vote, a link in the same tab, the language switch, a link without votes, in a new tab and in the same), another first vote and the second chosen as the first, the link from a vote's page and none from the tie-break question's, the width at 360 pixels, the second vote below the first with the limits beside both and the four bars one above the other at 1,280, the lists for a finger, the bar, the colours in both schemes, each vote's summary, and the budgets of a drag (a step's: nine frames in ten within 16 ms, none over 50 ms) and of jumps (50 ms) with two votes, measured once more when a measurement exceeds them. |
| `app/e2e/frames.ts` | The budget tests' measurement of each frame's work after an input, shared by the map's and the limits' tests; `beyondBudget`, the budget of a step: of a measurement's frames at least nine in ten within 16 ms and none over 50 ms, giving the frames that break it; `MEASURE_HASHCHANGE` and `HASHCHANGE_HANDLED`, the frame after the address's hash changes, its start added before the page loads and its end after, as Chromium runs the listeners on `window` in the order they were added; and `fontsLoaded`, which a budget test awaits before its first input. |
| `app/e2e/frames.spec.ts` | The tests of `beyondBudget`, with made-up frames; they open no page. |
| `app/e2e/parts.ts` | How the browser tests reach the parts of a page, so that a part that changes its markup changes here and the tests keep their assertions: the button that adds a limit and its list, a limit with its label, bars and mark, the count's bar, a result with its headings, words, figures and bars, the selection's place, a canton's row and bar, the head and the switch, a vote's summary and its link, and the start page's rows, days, years, field and buttons. |
| `app/e2e/pointing.ts` | `pointIn`: a point on the screen inside a municipality's shape, for the tests that point at the map; with a margin, one whose neighbours that many pixels away are the shape's too, for taps on a phone. |
| `app/e2e/fingers.ts` | The phone of the browser tests, Playwright's Pixel 7 in their Chromium, and `fingersOn`: fingers sent by Chrome's `Input.dispatchTouchEvent`, each with its id, moved in steps with an animation frame between them, or one touch event at a time (a third finger down and up). |
| `app/e2e/small-screens.spec.ts` | The browser tests of the small screens: pages no wider than a window 360 pixels wide (the longest word of a title, the verdicts in Italian, the other pages, the list of the limits and the limit of the longest name in three languages), the zoom buttons above the map on a phone and over it on a computer, controls of 44 × 44 pixels (the link to the explanations among them), the list of characteristics and the start page's among them, and a thumb that takes a press beside its centre, the bar with the selection's result, a result that follows the room it has, and, on a phone 360 by 700 pixels in three languages, the selection's result and the first limit's sliders in one window.; and every year's link of the start page within a phone's window |
| `app/e2e/site-style.spec.ts` | The browser tests of the look: the font, and the system's sans-serif without it; the contrast of every text in both schemes and three languages; a majority not needed; the scheme changing on an open page; no cookie and no local storage; the verdicts in the map's colours, and a tie-break question's figures in the text's; the colours of a bar, and of a row pointed at; the head of every page, its mark and its entries, and the links to the years written as they are; the width, and no paragraph over 40rem; the controls in both schemes, the start page's among them, and the bar's border; the ring of focus. |
| `app/e2e/contrast.ts` | WCAG's contrast of every text of a page against the colour behind it, of named controls (border or fill, and text), and the colour of one pixel on the screen, for what the browser draws itself. |
| `app/e2e/result-map.spec.ts` | The browser tests of the map: its place, colours, hatching, legend and its scale, cantons and lakes, source and Swiss abroad; pointing and clicking, and the details' bar; zoom and move, the wheel alone scrolling the page and Ctrl or ⌘ with it zooming; loading once and failing; the panel of characteristics, its eight groups, the bars of its shares, a line of another year than its group, a withheld count, its place and its loading; the result and the map staying in the window, ending within it and scrolling away in a low one; and the budget of a step, nine frames in ten within 16 ms and none over 50 ms, for zoom, move, pointing (the first pointing after the page loads included) and clicking, measured by a script added before the page loads, with 50 ms before each click and before the press of a drag, and a second run when a budget test fails; and that the configuration runs the browser tests one at a time. On a phone: one finger moves the map and two zoom and move it, a tap shows a municipality as a click does, the municipality last clicked or tapped is outlined (a tap on the Zürichsee with the map zoomed in once), and the budget of fingers, a step's, for the frames of the fingers' moves and of the taps. In the dark scheme: the hatching on `#121212`, the borders between municipalities `#121212`, the colours of the classes kept. |

Generated and not in the repository: `app/.svelte-kit/` (types, written by `svelte-kit sync` on
every install) and `app/build/` (the site, in `app/build/swiss-votation-visualisation/`; the
preview's build in `app/build/preview/`, its pack in `app/build/preview-artifact/` and its lists
in `app/build/preview-files-*.json`).

### pipeline

Python 3.13 with polars, run by uv: it turns the public sources into the data files of the app
and checks them. Nothing imports it, and it does not use the calculation.

| File | What |
|------|------|
| `pipeline/README.md` | The sources, the procedure that adds a vote day, what to do when the update stops. |
| `pipeline/pyproject.toml`, `pipeline/uv.lock`, `pipeline/.python-version` | The project, its dependencies and their pinned versions; the settings of ruff, mypy (strict) and pytest. |
| `pipeline/vote-summaries.json` | Written by hand and reviewed: each vote's summary in German, French and Italian, and each vote day's addresses of the Federal Council's explanations with each document's language (spec vote-summaries; `pipeline/README.md`, "The summaries"). The update stops on a vote without a summary or a summary without a vote, so a vote day's summaries are written once its results exist. |
| `pipeline/stat-tab-cache/` | Written by the pipeline only: STAT-TAB's answers of final figures (the census of 2000, every election but the newest, every population year but the newest), gzipped, with `index.json`, each answer's query and checksum; a normal update takes them from here, `update --refresh` asks them anew (`pipeline/README.md`). |
| `pipeline/known-differences.json` | The differences between the entries and the official result that are written down (vote 6650, 200 no votes). A line the sources no longer show stops the update. |
| `pipeline/canton-changes.json` | The municipalities that changed canton, with their earlier canton and their last day there (Moutier, BE until 2025). |
| `pipeline/src/pipeline/__init__.py` | The package; it holds only its description. |
| `pipeline/src/pipeline/__main__.py` | The command line: `update`, with `--reuse-downloads` and `--refresh`. |
| `pipeline/src/pipeline/stat_tab_cache.py` | The cache of STAT-TAB's answers of final figures in `pipeline/stat-tab-cache/`: an answer read for the same query, written gzipped without a time so that the same answer gives the same bytes, the index checked against the files; `final_years`, every year but the newest. |
| `pipeline/src/pipeline/update.py` | The steps of a run, the file of the summaries read first and its votes and addresses checked before the characteristics, the characteristics among them (each table checked against the register's list of its date, the farms read for the cattle's years, each count of the jobs brought onto the list by itself): download (STAT-TAB's answers of final figures from the cache, unless `--refresh`), read, check, write into a new directory that replaces `app/static/data/` only when every check has passed and no vote of the data files would be lost; the two lists above; the report. |
| `pipeline/src/pipeline/download.py` | The addresses of the sources (the map's two and the characteristics' among them), the Federal Chancellery's SPARQL query, STAT-TAB's 61 queries of ten tables, the list each STAT-TAB table gives, the election days, the download with its retries, and `probe_pdf`, which asks an address of the explanations, paced, by `GET` where `HEAD` is refused, a 403 tried again. |
| `pipeline/src/pipeline/counts.py` | `SourceError`, and the one function every count passes: a whole number from zero, or the run stops. |
| `pipeline/src/pipeline/feed.py` | The reader of the BFS vote-day files: votes, kinds, titles, entries, and their checks. |
| `pipeline/src/pipeline/chancellery.py` | The reader of the Federal Chancellery's answer: the validated results. |
| `pipeline/src/pipeline/register.py` | The reader of the BFS register: the list of municipalities. |
| `pipeline/src/pipeline/boundaries.py` | The reader of the map's sources (with pyshp): the register's K4 boundaries of the municipalities, checked against the list, the cantons and the outline of Switzerland, and the ThemaKart set's lakes, as SVG path data in whole metres. |
| `pipeline/src/pipeline/characteristics.py` | The reader of the characteristics' sources: STAT-TAB's answers in json-stat2 (population, place of birth, jobs, elections, cattle and farms, and of the census of 2000 the languages, religion, education, dwellings and buildings), the register's correspondences and swisstopo's areas, with the checks of every count and sum; a count the jobs table withholds ("X") as none; municipalities named with or without dots; the seven party groups; the adding up onto the list of the votes, a part without a count leaving the sum without one where asked (`all_parts`). |
| `pipeline/src/pipeline/summaries.py` | The reader of `vote-summaries.json` and its checks: each summary of 120 to 450 characters of plain text, its numbers as the screen writes them and a French one's spaces, each address on www.admin.ch from 2015-06-14 and on swissvotes.ch before, a summary for every vote and none more, explanations for every vote day and none more; `check_explanations` asks each address. |
| `pipeline/src/pipeline/checks.py` | The checks between the sources: the entries against the list, the canton an entry counts for, the sums, the official result. They apply no voting rule. |
| `pipeline/src/pipeline/write.py` | The data files, each vote with its summary and explanations, `map.json` and `characteristics.json` among them (with the seven sets of `add-more-characteristics`, a withheld count as `null`), and the record of the sources with each query and, for a STAT-TAB answer, whether it came from the cache: the same bytes for the same sources. |
| `pipeline/tests/made_up.py` | Made-up sources in the shape of the real ones, a file of the summaries among them, the map's ZIPs of shapefiles and the characteristics' STAT-TAB answers (the jobs with withheld counts, the farms without the organic farmland of their first year), correspondences and areas among them; each test breaks its own copy. |
| `pipeline/tests/test_*.py` | The unit tests (pytest), one file per module. |

Generated and not in the repository: `pipeline/.venv/` (written by `uv`) and
`pipeline/downloads/` (the source files of the last run, about 190 MB).

## Workflow: no code without an approved change

1. `/openspec-explore` (optional): think an idea through, measure, run spikes.
2. `/openspec-propose <change-name>`: creates `openspec/changes/<change-name>/` with the proposal,
   the spec deltas, the design and the tasks.
3. Decisions that shape the change are asked while proposing and recorded in the design with the
   alternatives considered. The user reviews the whole change before it is applied.
4. `/openspec-apply-change`: implement the tasks in order; each task ends with its own
   verification step.
5. `/openspec-verify-change`: check the implementation against the change.
6. `/openspec-archive-change`: merge the spec deltas into `openspec/specs/`; update
   `docs/roadmap.md`.

So `openspec/specs/` is always the current truth of what the product does, the archive holds why
it is so, and CI validates both.

Also installed: `/openspec-update-change` (revise the artifacts of a change) and
`/openspec-sync-specs` (merge spec deltas without archiving). OpenSpec 2.0 installs skills only;
the `/opsx:*` commands of 1.x do not exist here.

Useful CLI: `openspec list`, `openspec show <name>`, `openspec validate --all --strict` (also run
by CI), `openspec instructions <artifact> --change <name>` (what the author of an artifact is
told: the context and the rules of `openspec/config.yaml`).

## Build and verify

Node 24 and pnpm 12.18.0 (pinned in `package.json`); uv for the pipeline. All commands run from
the root.

| Command | What |
|---------|------|
| `pnpm install` | The dependencies. It fails on Node older than 24. |
| `pnpm run dev` | The app with live reload, at `http://localhost:5173/swiss-votation-visualisation/`. |
| `pnpm run format` | Format the code. `pnpm run format:check` only checks. |
| `pnpm run lint` | ESLint, type-aware; warnings fail it. |
| `pnpm run check` | Static analysis: `tsc` for the calculation, `svelte-check` for the app. It enforces the module boundaries. |
| `pnpm run test` | The unit tests (Vitest) of the calculation and of the app; the app's run the calculation over the data files. |
| `pnpm run build` | The static site, written to `app/build/swiss-votation-visualisation`. |
| `pnpm run test:e2e` | The browser tests (Playwright) against `app/build`, under the site's path, one at a time; build first. |
| `node scripts/preview.mjs` | The preview of the branch, packed for its Claude Artifact ("The preview"). |
| `uv run --directory pipeline --locked python -m pipeline update` | Download the sources, check them and write the data files (`pipeline/README.md`). About 190 MB and a quarter of an hour to 25 minutes, most of it waiting for STAT-TAB, which answers 50 queries in 15 seconds at most and some days one in half a minute. |
| `uv run --directory pipeline --locked ruff format --check .` | The pipeline's formatting; `ruff format .` formats. |
| `uv run --directory pipeline --locked ruff check .` | The pipeline's lint. |
| `uv run --directory pipeline --locked mypy` | The pipeline's static analysis, strict. |
| `uv run --directory pipeline --locked pytest` | The pipeline's unit tests. |

- `./scripts/verify-local.sh`: the same checks as CI in the same order, 11 steps: the OpenSpec
  validation, then `format:check`, `lint`, `check`, `test`, `build`, `test:e2e`, then the
  pipeline's four (`ruff format --check`, `ruff check`, `mypy`, `pytest`). Run before every
  push. It refuses to run when Node's major version or the OpenSpec CLI is not the version CI
  uses, or when `uv` is missing.
- `./scripts/verify-local.sh --quick`: the unit tests only, of both packages and of the pipeline.
- CI (`.github/workflows/ci.yml`), on pushes to `main` and on pull requests targeting `main`: the
  `specs` job (OpenSpec validation), the `build` job (the six checks of the packages) and the
  `pipeline` job (the pipeline's four). The three are independent, so one run shows every
  failure. On a push to `main`, once all three have passed, the `deploy` job publishes the build
  the `build` job uploaded after its browser tests, on GitHub Pages
  (`actions/upload-pages-artifact`, `actions/deploy-pages`, pinned by major version like
  `actions/checkout`). Pull requests publish nothing. CI runs one run per branch at a time, in
  the order of the pushes (a waiting run is replaced by a newer one), so an older run of `main`
  never publishes over a newer site. GitHub Pages is switched on in the repository's settings
  (Pages → Source: "GitHub Actions").
- **The root `package.json` must not declare `svelte`.** The compiler also looks in the root
  `node_modules`, so the calculation could then import the UI framework. The Svelte plugins of
  ESLint and Prettier get `svelte` from pnpm as a peer.
- Pinned versions that must stay equal:
  - OpenSpec 2.0.0, in `.github/workflows/ci.yml` and in `.claude/hooks/session-start.sh`. After
    changing it, run `openspec update` and commit the skills it writes (`openspec update
    --dry-run` shows whether they are up to date).
  - Node 24, in `.github/workflows/ci.yml` (the jobs `specs` and `build`), in
    `.claude/hooks/session-start.sh` and in `engines` of `package.json`.
  - Python 3.13 in `pipeline/.python-version`, and every package of the pipeline in
    `pipeline/uv.lock`. Every `uv` command runs with `--locked`, so a lockfile that does not
    match `pipeline/pyproject.toml` fails; after changing a dependency, run `uv lock --directory
    pipeline` and commit the lockfile.
  - `astral-sh/setup-uv` v10.3.3 in `.github/workflows/ci.yml`. It publishes no tag per major
    version, so a newer release is taken by hand.
  - `@playwright/test` 1.63.0 in `app/package.json`, the version whose Chromium the cloud image
    ships. When the image changes it, the browser tests name the missing browser; change the
    version then.
- TypeScript stays on 6.0 until `svelte-check` and `typescript-eslint` support 7.
- pnpm holds back versions published very recently. If an install adds a
  `minimumReleaseAgeExclude` entry to `pnpm-workspace.yaml`, use the previous version of that
  package instead of keeping the entry.
- Outside web sessions, once: Node 24, `npm install -g pnpm@12.18.0`, `pnpm install`,
  `pnpm --filter app exec playwright install chromium`,
  `npm install -g @fission-ai/openspec@2.0.0`, and uv
  (https://docs.astral.sh/uv/getting-started/installation/). To generate the skills again, the global
  configuration must match: `openspec config set profile custom` and
  `openspec config set workflows '["propose","explore","apply","update","sync","archive","verify"]'`.
- Web sessions: the SessionStart hook does all of this, and `uv sync` for the pipeline (uv is
  part of the cloud image). The image's default is Node 22; the hook puts Node 24 first on the
  `PATH`.
- Running Python on the pipeline's code writes `__pycache__` directories; git ignores them.

## The preview

Q looks at a branch on the phone before it is merged in one private Claude Artifact,
https://claude.ai/artifact/4orzLS5WyndrhghV2vFWnQ, which every preview reuses: it is neither
deleted nor made anew (change `add-pull-request-site`). It is published by Claude on Q's request,
not by CI, which cannot publish to claude.ai. The procedure:

1. Commit the branch's state, so that the launcher names it. Run `node scripts/preview.mjs`: it
   builds the site with `PREVIEW=1` (relative addresses), adds to each page a line that writes
   an address ending in `index.html` as `.../`, which the client's routes need, and packs into
   `app/build/preview-artifact/` the launcher, `index.html` (the branch, the commit, the date and
   links to the start page, a vote, the comparison and the guide), and `site/`: the German pages,
   the scripts, the data files and the entries of the ten newest votes. It writes the lists of
   files to publish, at most 250 each, to `app/build/preview-files-1.json` and `-2.json`, prints
   the number of files and their size, and stops above 511 files, an Artifact's limit.
2. List the Artifact's files (the Artifact tool, `action: "list"`, `scope: "files"`, its URL).
   Those the lists do not name are stale: the scripts' hashed names change with the code.
3. Publish `app/build/preview-artifact/index.html` to the URL, with `root`
   `app/build/preview-artifact`, once per list, its files as `files`; in the last publish the
   stale paths as `null` too, `files` then a map (`{"site/…": "site/…", "<stale>": null}`). One
   publish takes at most 255 files.
4. Read the Artifact's `site/_app/version.json` (`action: "read"`, `path`); its version is the
   pack's. Give Q the URL.

The preview shows no French or Italian page, compares only the ten newest votes, and cannot be
reloaded inside the site (the Artifact serves `de/index.html` by name; the launcher is the way
back). The font's preload, an absolute address, fails; the stylesheet loads the font.

## Conventions

- Conventional commits: `type(scope): description`. Types: feat, fix, refactor, test, docs,
  chore, style, ci.
- Pull requests are merged by rebasing, so that the history stays linear. A branch is started
  from an updated `main`. After a merge the branch is deleted, not reused: `main` then holds its
  commits under new ids.
- Stage files individually (never `git add .`); review the diff before committing.
- The linter at zero issues; no suppressed warning without a written justification.
- Numeric behavior is tested against reference values with explicit tolerances; counts of votes
  and of cantonal votes are exact.
- The data files in `app/static/data/` are written by the pipeline only, never by hand. A change
  of them is a run of the update, reviewed in a pull request like any other change.
- Code, comments, specs, docs and commit messages are in English.
- The predecessor, `lukaspestalozzi/votation-visualisation`, is to learn from, not to port: its
  code and its data files are not copied.
