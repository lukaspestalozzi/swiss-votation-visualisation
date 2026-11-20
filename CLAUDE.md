# Popular Vote Explorer

A web app that shows how Switzerland voted in national popular votes, municipality by
municipality, and recalculates the result as if only municipalities of a certain kind had voted.
A static site for the curious public; everything runs in the browser. "Popular Vote Explorer" is
a working title: the name is not decided.

**Status:** the skeleton, the calculation, the vote data, the first screen, the map, the
characteristics, the limits, the languages, the small screens and the look. Every page is written in German, French and Italian,
under `/de/`, `/fr/` and `/it/`; the site's address and the addresses of before open the page in
the browser's language, German otherwise, and the head of every page, with the working title and a
link to the guide, holds a switch that opens it in another. Every page is set in Source Sans 3,
served with the site, in light colours or, when the browser prefers, dark ones, and a verdict
takes the map's colour of its side.
The start page lists the national votes by year, and each vote has its page with
its result, the two verdicts side by side, a map of the municipalities in the colours of their
result, which can be zoomed, moved, pointed at and clicked, or on a touch screen moved with one
finger, zoomed with two and tapped, a panel beside it with the 21 characteristics of the
municipality last clicked or tapped, which the map outlines, and a table of the cantons, calculated when the site is built; above the map, limits on the characteristics select municipalities, and the
selection's result ("Mit Ihrer Auswahl", beside the real one), the table of the cantons and the
map (set-aside municipalities dark grey) follow every step of a slider, in the browser, and the
page's address holds the selection after `#`, so that a link, a reload or the language switch
keeps it; on a
phone every page fits a window 360 pixels wide, the controls are at least 44 pixels, and a bar at
the bottom of the window repeats the selection's result while its box is out of view; a page
"Lesehilfe" (`/de/guide/`) explains the thought experiment and names the sources; the calculation gives the result of a vote from the entries that remain and the outcome of
each canton, and is tested against seven official votes; the pipeline writes the results of the
125 national votes since 2013, per municipality, the map's shapes and the characteristics'
counts to `app/static/data/`, and
a test runs the calculation over every one of them; the build, the checks, the module boundaries and CI are in
place, and CI publishes the site at https://lukaspestalozzi.github.io/swiss-votation-visualisation/
after every push to `main` whose checks pass. Changes #1 to #10a, 7a and 9a of `docs/roadmap.md`,
`add-project-skeleton`, `add-result-calculation`, `add-vote-data`, `add-vote-list`,
`publish-site`, `add-result-map`, `add-characteristics`, `tighten-map-budget` (the look at
performance after #7: one budget of 16 ms per frame for every input of the map), `add-limits`,
`add-interface-languages`, `steady-budget-tests` (the browser tests one at a time, so that no
test runs beside a budget test), `add-small-screens` and `add-site-style`, are archived, and
`openspec/specs/` holds their specs.
Nine investigations are done: `investigations/data-sources.md`, `investigations/map-data.md`,
`investigations/characteristics.md`, `investigations/performance.md`,
`investigations/limits.md`, `investigations/languages.md`, `investigations/small-screens.md`,
`investigations/site-style.md` and `investigations/share-link.md`.
v1, changes #1 to #10a, is complete. #11, `add-share-link`, the first change after v1, is applied;
its verification and archive come next.
`README.md` is the human-facing overview.

## Where things are

| Path | What |
|------|------|
| `openspec/config.yaml` | Project context and rules: product, hard constraints, decided stack and what is still open, module boundaries, quality bar, glossary. Read first. |
| `openspec/specs/` | Current truth: what the app does, one spec per capability: `app-shell`, `build-checks`, `characteristics`, `interface-languages`, `limits`, `municipalities`, `publishing`, `reading-guide`, `result-calculation`, `result-map`, `site-style`, `small-screens`, `verdicts`, `vote-data`, `vote-list`. |
| `openspec/changes/` | In-flight changes: proposal, spec deltas, design, tasks. Finished ones are under `openspec/changes/archive/`. |
| `docs/roadmap.md` | Ordered list of planned changes and their status, what counts as v1, the investigations, and the predecessor's failure modes with the change that specifies against each. |
| `investigations/` | Spikes and verified reference values (test oracles). `data-sources.md` is the first, `map-data.md` the second (the map's sources, the distances of its colours, the municipal figures its specs cite; scripts in `map-data/`, run as the file says), `characteristics.md` the third (the characteristics' sources, the list each uses, how they come onto the votes' list, and the figures the specs cite; scripts in `characteristics/`, run as the file says), `performance.md` the fourth (why frames after a click looked slow, the first pointing's cost, a busy machine's long frames; scripts in `performance/`, two in JavaScript on the global Playwright, two in Python that read their traces, `budget_tries.py`, which reads Playwright's JSON reports of the budget tests, and `budget_tests_traced.spec.ts`, the budget tests with a trace, copied into `app/e2e/` to run; all as the file says), `limits.md` the fifth (the Swiss abroad, missing figures, the tracks, named selections, the grey of set-aside municipalities, a drag's frames; scripts in `limits/`, two in Python on the data files and four in JavaScript on the global Playwright, run as the file says), `languages.md` the sixth (the official French and Italian terms and their sources, what the data holds in three languages, the names of places, the site's size; its script in `languages/`, Python, standard library only, run as the file says); `small-screens.md` the seventh (pages wider than 360 pixels and why, where a phone's screen shows the parts of a vote's page, what the map receives from fingers, what this machine's browser does not do with them, the controls' sizes, frames with the CPU slowed, d3-zoom's size, and, found while applying, a tap's lost click right after a finger, Chrome moving a tap to a neighbour, and the frame of a finger's touchdown; scripts in `small-screens/`, eight in JavaScript on the global Playwright and one in shell, run as the file says); `site-style.md` the eighth (the look of before, five fonts that could be served and the site's characters in Source Sans 3's Latin face, the contrast of a light and a dark palette, a dark ground beside the map's colours, the map's size by width, and, found while applying, every page still within 360 pixels, a tap on a lake with the map narrower, and a slider that moves while dragged; scripts in `site-style/`, three in JavaScript on the global Playwright (`lake_tap.mjs` imports the browser tests' `pointing.ts`), one in shell that packs the fonts outside the repository and runs one in Python with fontTools, and one in Python, standard library only, run as the file says); `share-link.md` the ninth (how often a page may change its address, SvelteKit's shallow `goto`, a link opened in the tab that shows its page, a link's length, values and steps, what a change of the data moves, and, found while applying, SvelteKit's announcer, `page.url` after a shallow `goto`, the order of listeners on `window` and the frame of a link with 21 limits; scripts in `share-link/`, `link.mjs`, which imports the app's `limits.ts` and `characteristics.ts`, and `listener_order.cjs`, both in JavaScript on the global Playwright, run as the file says); the first's scripts are in `data-sources/` (Python, standard library only; the downloads stay outside the repository). One of them, `write_reference_votes.py`, writes the reference data of the calculation; `investigations/data-sources/check_ids_and_cantons.py` shows the three facts found while proposing #3, and `check_tie_break.py` what the yes and no of a tie-break question stand for, found while proposing #4. Each file names its sources, the script and the output that produced its values, and the expected values with tolerances, so that specs and tests can cite it. |
| `calculation/`, `app/`, `pipeline/` | The three modules. The code map below lists their files. |
| `app/static/data/` | The data files of the app: `app/static/data/votes.json` (the list of votes), `app/static/data/votes/<id>.json` (one file per vote, its entries), `app/static/data/municipalities.json` (the list of municipalities and the Swiss abroad), `app/static/data/map.json` (the map's shapes: municipalities, cantons, the outline of Switzerland, lakes), `app/static/data/characteristics.json` (the counts of the characteristics of each municipality, per year and election), `app/static/data/sources.json` (the record of the source files, with the query of each answer to one). Written by the pipeline (`pipeline/README.md`), never by hand; committed, and served with the site as they are. Their shape is decision 12 of the design of `add-vote-data` (of `map.json`, decision 14 of the design of `add-result-map`; of `characteristics.json`, decision 12 of the design of `add-characteristics`), their types are in `app/src/lib/vote-data.ts`. |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` | The root of the pnpm workspace: the scripts of every check, pnpm pinned in `packageManager`, Node 24 required (`engineStrict`). |
| `eslint.config.js`, `prettier.config.js`, `.prettierignore` | The linter and the formatter, one configuration for both packages. Prettier leaves Markdown, `openspec/`, `docs/`, `.agents/`, `.claude/`, `.github/`, the calculation's reference data and the app's data files alone. ESLint leaves `investigations/` to Prettier: its scripts are spikes outside the three modules. |
| `.agents/skills/` | The OpenSpec workflows as skills, generated by `openspec init`; `.claude/skills/` holds a link to each. Not edited by hand: `openspec update` writes them again. |
| `.github/workflows/ci.yml` | CI: the jobs `specs`, `build` and `pipeline`, and `deploy`, which publishes the build the browser tests checked on GitHub Pages, on pushes to `main` only. It pins the OpenSpec version, the Node version and the version of `astral-sh/setup-uv`. |
| `scripts/verify-local.sh` | The same checks as CI, run locally. |
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
| `app/vite.config.ts` | The configuration of Vite and SvelteKit, with the static adapter, and of Vitest, which runs `src/**/*.test.ts` only, not the browser tests. There is no `svelte.config.js`. It holds the site's path, `/swiss-votation-visualisation`: the site is built for it, with absolute paths, and written to `app/build/swiss-votation-visualisation/`. |
| `app/tsconfig.json` | Extends the one SvelteKit generates. `rootDir` `.` makes an import from `pipeline/` fail. |
| `app/src/app.css` | The style of every page (spec site-style): Source Sans 3 from the package's faces, every colour of the page named once on `:root`, light and under `prefers-color-scheme: dark`, the text's line heights, the body 16 pixels from each side, paragraphs at most 40rem, the classes `secondary`, `side-yes` and `side-no`, buttons and lists in the page's colours, and the ring of focus. |
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
| `app/src/routes/[lang]/+layout.svelte` | The head of every page: the working title, linked to the start page, the guide's heading, linked to the guide, each text on its own page, and the switch: "Deutsch", "Français", "Italiano", the page's own as text, the others linking to the same page in them (by route, through `resolve`), with the hash of its address as SvelteKit knows it (`page.shallow?.url ?? page.url`) in the browser, so that the selection goes along, and loading it anew. It wraps between its parts, never within one. |
| `app/src/routes/[lang]/+page.server.ts` | The start page's data, at build time, in each language (`entries`): the list of `vote-list.ts`, from `app/static/data/votes.json`. |
| `app/src/routes/[lang]/+page.svelte` | The start page: the working title and the votes by year, each linked to its page in the same language, its result in the colour of its side. |
| `app/src/routes/[lang]/guide/+page.server.ts` | The guide's data, at build time, in each language: the list's reference date and the lakes' set, from `map.json`. |
| `app/src/routes/[lang]/guide/+page.svelte` | The page "Lesehilfe" (`/de/guide/`): six sections on the real result, the selection, what it does not show, the Swiss abroad, municipalities without a result or a figure and the characteristics, then the sources, with a link to `data/sources.json`. |
| `app/src/routes/[lang]/votes/[id]/+page.server.ts` | A vote's page, at build time: `entries()` names every vote of the list in each language; `load` reads the vote's file through `import.meta.glob` and returns what `vote-page.ts` gives, so the page holds its result and the browser loads no file of entries, and, for a judged vote, its entries per canton (`voteEntriesOf`, checked against `map.json`) and the majorities it needs, for the map and the selection. |
| `app/src/routes/[lang]/votes/[id]/+page.svelte` | A vote's page, with the texts of its language: the head, the figures, the two verdicts side by side and the outcome, with "Mit Ihrer Auswahl" beside them while a selection applies; the limits; the map; the table of the cantons, which follows the selection, or the tie-break question's figures; the sources and notes, and the link back; last, the bar of `SelectionBar.svelte`, given the box "Mit Ihrer Auswahl". It holds the limits and the switch, loads the characteristics, and derives the remaining municipalities and the selection's result, the count and the set-aside by `limits.ts`. Once the characteristics have loaded, a judged vote's page reads the selection its address holds by `share-link.ts`, and again on `hashchange`, and keeps the parts it could not use until the selection next changes; half a second after the selection's last change, and after each reading, it writes the selection after `#`, by a shallow `goto` of its own path that replaces the history's entry, when it differs from the browser's address or from the address as SvelteKit knows it. A tie-break question's page does neither. Its heading and the verdict boxes break a word too long for the line; below 640 pixels the boxes have less padding and smaller headings, so that they stay side by side at 360. The words of the verdicts, the outcomes and the table's sides take the class of their side (`side-yes`, `side-no`); the date and kind, sources and notes the class `secondary`. |
| `app/src/routes/[lang]/votes/[id]/Limits.svelte` | The section "Gemeinden auswählen": the sentence with the link to the guide, the parts of the page's address it could not use, the list "Merkmal hinzufügen" with "Hinzufügen", each limit with its label, two sliders on one track (which do not cross) and "Entfernen", the switch for the Swiss abroad, the count, and "Zurück zum echten Ergebnis"; a message while the characteristics load or when they cannot. On a touch screen (`pointer: coarse`) the list, the buttons and the switch's label are at least 44 × 44 pixels, and each thumb a 44-pixel square whose transparent border keeps the visible dot's size. The track, the thumbs and their rings of focus take the page's colour names. |
| `app/src/routes/[lang]/votes/[id]/SelectionBar.svelte` | The bar at the bottom of a window narrower than 640 pixels: while a selection applies and the box "Mit Ihrer Auswahl" is not wholly in the window (an `IntersectionObserver`), the outcome and the words of both majorities, each word in the colour of its side, its top border in `--border`. It sticks to the bottom, and at the end of the page stands below the last line; `aria-hidden`, as it repeats the box. |
| `app/src/routes/[lang]/votes/[id]/loaders.ts` | The loaders of the map's files and of the characteristics, one per visit, shared by the map, the panel and the limits. |
| `app/src/routes/[lang]/votes/[id]/ResultMap.svelte` | The map of a vote: it loads the shapes and the names once per visit, held as raw state (`$state.raw`), as the characteristics are, draws the outline in the lakes' colour, the municipalities in their colours or hatched, the lakes and the cantons as SVG, and the municipality last clicked or tapped outlined above them, black on a white halo; the box of details on pointing, clicking or tapping; zoom with the buttons, the wheel and two fingers, and moving with the mouse or one finger: fingers on it are its own (`touch-action: none`), it keeps the pointers pressed on it, and two make a pinch by `pinchFrom`; the legend, the source and the Swiss abroad; the message when it cannot load. The municipalities the selection sets aside are painted dark grey by an effect that changes only those whose state changed; the legend and the details name them. It loads the characteristics apart, without waiting for them, and keeps the municipality last clicked or tapped for the panel, which stands to its right in a window at least 960 pixels wide and below it otherwise. The box of details and the SVG share a box of their own, so that below 640 pixels the zoom buttons stand in a row above the map; on a touch screen they are at least 44 × 44 pixels. The borders between municipalities, the hatching's ground and the box of details take the page's ground, white or `#121212` in the dark scheme. |
| `app/src/routes/[lang]/votes/[id]/CharacteristicsPanel.svelte` | The panel beside the map: the characteristics of the municipality last clicked, in four groups headed with their dates, and their sources; a sentence before the first click, while they load, or when they cannot be loaded. |
| `app/src/lib/format.ts` | Counts, shares and quotients with decimals (rounded half away from zero, from the counts), a whole number of units with its decimals, cantonal votes and dates as the screen writes them, without the locale data of the machine. |
| `app/src/lib/format.test.ts` | Its unit tests. |
| `app/src/lib/texts/index.ts` | The `Language` (the data's), the three languages and their names in themselves, `isLanguage`, the `Texts` interface and `textsOf`: every text of the screen, one object per language, so that a missing text is a type error. A text with figures is a function of them; a date is written by its language. |
| `app/src/lib/texts/de.ts`, `fr.ts`, `it.ts` | The texts in German, French and Italian, with the Confederation's terms (`investigations/languages.md`). |
| `app/src/lib/texts/texts.test.ts` | No French or Italian text is the German one, apart from the working title and the dash; the six kinds in French and Italian. |
| `app/src/lib/languages.ts` | The script of a page that redirects: from the page's three addresses, the first of the three languages among the browser's preferred ones, German otherwise; `location.replace`. |
| `app/src/lib/languages.test.ts` | Its unit tests: the script's own text run with a made-up browser. |
| `app/src/lib/vote-list.ts` | The start page's list: the years from the newest, and for each vote its date, title, kind, official result, the side of its verdict and marks. An empty list is an error. |
| `app/src/lib/vote-list.test.ts` | Its unit tests, against `votes.json` up to 2026-09-27. |
| `app/src/lib/vote-page.ts` | What a vote's page shows, from its vote of the list and the result the calculation gives over its file. A missing file or a refused entry is an error that names the vote. `judgedOf` writes the figures, verdicts and table of any result, the vote's own and a selection's, a canton with nothing left saying so; each verdict, the outcome and each canton's row say the side they stand for (`Side`), for their colour. |
| `app/src/lib/vote-page.test.ts` | Its unit tests, against the data files and the figures of `investigations/data-sources.md`. |
| `app/src/lib/vote-data.ts` | The types of the data files in `app/static/data/`, `map.json` and `characteristics.json` included, and `voteText`: a vote's title, reference or note in a language, an error when it is missing. |
| `app/src/lib/characteristics.ts` | The characteristics: one definition each (a key, its name from the texts by `nameOf`, unit, source, the scale of its limit's track, value as a quotient of counts), the figures that apply to a vote (the last year and election before its day), a municipality's counts, a value as a whole number of units as the panel writes it (which a limit compares), with each unit's decimals (`DECIMALS`, which a link reads too), and the panel's groups and lines. |
| `app/src/lib/limits.ts` | A limit's track from its characteristic's definition (1,000 steps, linear or logarithmic, from the smallest to the largest value of a vote's figures), the value of a step, a limit's label, whether it is narrowed, the municipalities that remain under the limits, the set-aside ones and how many remain. |
| `app/src/lib/limits.test.ts` | Its unit tests, against `characteristics.json` and the figures of `investigations/limits.md`, the six named selections among them. |
| `app/src/lib/share-link.ts` | The selection in the address (spec share-link): `linkOf`, the limits and the switch as the part after `#` (each limit as `<key>=<lower>-<upper>` in the page's order, a bound as its label writes it and empty at its track's end, then `abroad=no`), and `selectionOf`, that part read back with `URLSearchParams` into limits on the tracks a function gives, each bound at the step nearest its value, of two the lower, and the parts it cannot use. |
| `app/src/lib/share-link.test.ts` | Its unit tests, against `characteristics.json` on the vote day of 2016-02-28: the forms, the nearest step, the unusable parts, and every step of every characteristic written and read back. |
| `app/src/lib/characteristics.test.ts` | Its unit tests, against `characteristics.json` and the figures of `investigations/characteristics.md`, and a made-up file. |
| `app/src/lib/result-map.ts` | What the map shows: the side and class of a municipality from its votes, compared in whole numbers; the colours, the dark grey of a set-aside municipality among them (the hatching's ground is the page's, from `app.css`); the legend and its entry for the set-aside; the details of a municipality; a vote's entries per canton (`voteEntriesOf`), checked against the map. |
| `app/src/lib/result-map.test.ts` | Its unit tests, with the figures of `investigations/map-data.md`. |
| `app/src/lib/map-view.ts` | The part of the map shown, as the SVG's view box: zoom around a point from 1 to 16 times, and moving by a distance on the screen, the view's centre kept inside Switzerland; and the view while two fingers pinch (`pinchFrom`), from the view and the fingers when the second touched. |
| `app/src/lib/map-view.test.ts` | Its unit tests. |
| `app/src/lib/map-data.ts` | Loads `map.json` and `municipalities.json` once, and `characteristics.json` once with a loader of its own, from addresses and a fetch function the page gives; a failed request rejects. |
| `app/src/lib/map-data.test.ts` | Its unit tests, with a fake fetch. |
| `app/src/lib/vote-data.test.ts` | The calculation over every vote of the data files: it gives each vote's yes and no votes, cantonal votes and verdict; four named votes against the official figures of `investigations/data-sources.md`; the map: its municipalities are the list's, every judged vote fits it; and the characteristics: their municipalities are the list's. |
| `app/static/data/` | The data files (see "Where things are"). |
| `app/playwright.config.ts` | The browser tests: they run against `app/build`, served as plain files on port 4173, under the site's path; the tests open pages by paths relative to it (`de/votes/5960/`). They run one at a time (one worker), so that no test runs beside a budget test. |
| `app/e2e/vote-list.spec.ts` | The browser tests of the start page, among them "all requests go to the site itself", which starts at the address without a language and opens the guide too; they compare with the site's own `data/votes.json`. |
| `app/e2e/vote-page.spec.ts` | The browser tests of the vote pages: named votes, the address without the final slash, no entries loaded, no other server, and an address that names no page (404). |
| `app/e2e/limits.spec.ts` | The browser tests of the limits and of what follows them: the section, adding and removing, the tracks, the two bounds by pointer and key, the labels, which municipalities remain, the Swiss abroad, "Mit Ihrer Auswahl", the table and the map under a selection, the count, the return to the real result, a link with a selection; and the budgets of 16 ms per frame while a bound is dragged and of 50 ms for a jump. |
| `app/e2e/languages.spec.ts` | The browser tests of the languages: the switch and the selection it carries, after a link opened in the tab too, the pages and their `lang`, a language without a page, the terms, the vote's texts, the names of places and the same selection in French, the address without a language and the addresses of before, in browsers that prefer each language or run no scripts. |
| `app/e2e/guide.spec.ts` | The browser tests of the reading guide: its sections and sentences, its sources, and the links to it from the head of the start page and of a vote's page, and from the limits. |
| `app/e2e/share-link.spec.ts` | The browser tests of the selection in the address: its forms and the keys in French, "Back" and nothing sent, one address change after a held key, a link, a value no step has (opened, and in the same tab), a reload, the characteristics not loaded, a link in the same tab, the parts a link cannot use and their sentence, a tie-break question, and the budget of 100 ms for the frame after a link with all 21 limits opened in the same tab, measured once more when it exceeds it. |
| `app/e2e/frames.ts` | The budget tests' measurement of each frame's work after an input, shared by the map's and the limits' tests; `MEASURE_HASHCHANGE` and `HASHCHANGE_HANDLED`, the frame after the address's hash changes, its start added before the page loads and its end after, as Chromium runs the listeners on `window` in the order they were added; and `fontsLoaded`, which a budget test awaits before its first input. |
| `app/e2e/pointing.ts` | `pointIn`: a point on the screen inside a municipality's shape, for the tests that point at the map; with a margin, one whose neighbours that many pixels away are the shape's too, for taps on a phone. |
| `app/e2e/fingers.ts` | The phone of the browser tests, Playwright's Pixel 7 in their Chromium, and `fingersOn`: fingers sent by Chrome's `Input.dispatchTouchEvent`, each with its id, moved in steps with an animation frame between them, or one touch event at a time (a third finger down and up). |
| `app/e2e/small-screens.spec.ts` | The browser tests of the small screens: pages no wider than a window 360 pixels wide (the longest word of a title, the verdicts in Italian, the other pages), the zoom buttons above the map on a phone and over it on a computer, controls of 44 × 44 pixels and a thumb that takes a press beside its centre, and the bar with the selection's result. |
| `app/e2e/site-style.spec.ts` | The browser tests of the look: the font, and the system's sans-serif without it; the contrast of every text in both schemes and three languages; a majority not needed; the scheme changing on an open page; no cookie and no local storage; the verdicts in the map's colours, and a tie-break question's figures in the text's; the head of every page; the width; the controls in both schemes, and the bar's border; the ring of focus. |
| `app/e2e/contrast.ts` | WCAG's contrast of every text of a page against the colour behind it, of named controls (border or fill, and text), and the colour of one pixel on the screen, for what the browser draws itself. |
| `app/e2e/result-map.spec.ts` | The browser tests of the map: its place, colours, hatching, legend, cantons and lakes, source and Swiss abroad; pointing and clicking; zoom and move; loading once and failing; the panel of characteristics, its place and its loading; and the budget of 16 ms per frame for zoom, move, pointing (the first pointing after the page loads included) and clicking, measured by a script added before the page loads, with 50 ms before each click and before the press of a drag, and a second run when a budget test fails; and that the configuration runs the browser tests one at a time. On a phone: one finger moves the map and two zoom and move it, a tap shows a municipality as a click does, the municipality last clicked or tapped is outlined (a tap on the Zürichsee with the map zoomed in once), and the budget of fingers, 16 ms for the frames of the fingers' moves and of the taps. In the dark scheme: the hatching on `#121212`, the borders between municipalities `#121212`, the colours of the classes kept. |

Generated and not in the repository: `app/.svelte-kit/` (types, written by `svelte-kit sync` on
every install) and `app/build/` (the site, in `app/build/swiss-votation-visualisation/`).

### pipeline

Python 3.13 with polars, run by uv: it turns the public sources into the data files of the app
and checks them. Nothing imports it, and it does not use the calculation.

| File | What |
|------|------|
| `pipeline/README.md` | The sources, the procedure that adds a vote day, what to do when the update stops. |
| `pipeline/pyproject.toml`, `pipeline/uv.lock`, `pipeline/.python-version` | The project, its dependencies and their pinned versions; the settings of ruff, mypy (strict) and pytest. |
| `pipeline/known-differences.json` | The differences between the entries and the official result that are written down (vote 6650, 200 no votes). A line the sources no longer show stops the update. |
| `pipeline/canton-changes.json` | The municipalities that changed canton, with their earlier canton and their last day there (Moutier, BE until 2025). |
| `pipeline/src/pipeline/__init__.py` | The package; it holds only its description. |
| `pipeline/src/pipeline/__main__.py` | The command line: `update`, with `--reuse-downloads`. |
| `pipeline/src/pipeline/update.py` | The steps of a run, the characteristics among them: download, read, check, write into a new directory that replaces `app/static/data/` only when every check has passed and no vote of the data files would be lost; the two lists above; the report. |
| `pipeline/src/pipeline/download.py` | The addresses of the sources (the map's two and the characteristics' among them), the Federal Chancellery's SPARQL query, STAT-TAB's queries, the list each STAT-TAB table gives, the election days, and the download with its retries. |
| `pipeline/src/pipeline/counts.py` | `SourceError`, and the one function every count passes: a whole number from zero, or the run stops. |
| `pipeline/src/pipeline/feed.py` | The reader of the BFS vote-day files: votes, kinds, titles, entries, and their checks. |
| `pipeline/src/pipeline/chancellery.py` | The reader of the Federal Chancellery's answer: the validated results. |
| `pipeline/src/pipeline/register.py` | The reader of the BFS register: the list of municipalities. |
| `pipeline/src/pipeline/boundaries.py` | The reader of the map's sources (with pyshp): the register's K4 boundaries of the municipalities, checked against the list, the cantons and the outline of Switzerland, and the ThemaKart set's lakes, as SVG path data in whole metres. |
| `pipeline/src/pipeline/characteristics.py` | The reader of the characteristics' sources: STAT-TAB's answers in json-stat2 (population, elections, cattle, census of 2000), the register's correspondences and swisstopo's areas, with the checks of every count and sum; the seven party groups; the adding up onto the list of the votes. |
| `pipeline/src/pipeline/checks.py` | The checks between the sources: the entries against the list, the canton an entry counts for, the sums, the official result. They apply no voting rule. |
| `pipeline/src/pipeline/write.py` | The data files, `map.json` and `characteristics.json` among them, and the record of the sources with each query: the same bytes for the same sources. |
| `pipeline/tests/made_up.py` | Made-up sources in the shape of the real ones, the map's ZIPs of shapefiles and the characteristics' STAT-TAB answers, correspondences and areas among them; each test breaks its own copy. |
| `pipeline/tests/test_*.py` | The unit tests (pytest), one file per module. |

Generated and not in the repository: `pipeline/.venv/` (written by `uv`) and
`pipeline/downloads/` (the source files of the last run, about 185 MB).

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
| `uv run --directory pipeline --locked python -m pipeline update` | Download the sources, check them and write the data files (`pipeline/README.md`). About 185 MB and a quarter of an hour, most of it waiting for STAT-TAB's limit of 50 queries in 15 seconds. |
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
