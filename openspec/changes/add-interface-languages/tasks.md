# Tasks

All commands run from the repository root, on a branch started from an updated `main`.

**Before this change:**
- `pnpm run test`: 52 passed in the calculation and 97 in the app;
- the browser tests: 103;
- `uv run --directory pipeline --locked pytest`: 134 passed;
- `./scripts/verify-local.sh`: 11 of 11 steps.

**How tests are written:**
- Each test is written first and seen to fail before the code that makes it pass, one at a time.
- A test that passes when written is seen to fail against a mutant, and the task says so in a
  note "As built".
- The numbers of tests are the plan. Where a count differs while building, the note says so
  too.

**Temporary edits** made for a verification step are removed before the task is ticked.
`git status --short` then shows nothing of them.

**The terms** are those of `investigations/languages.md` and of decision 11 of the design. The
script there is not changed while applying, except to fix a bug, which the note names.

## 1. Two suggestions of `add-limits`

Q chose to do these first (design, decision 14).

- [x] 1.1 The count and the set-aside move from `src/routes/votes/[id]/+page.svelte` into
  `src/lib/limits.ts`, as two functions of the remaining municipalities and the municipalities
  with an entry:
  - the set-aside ones;
  - how many remain.

  Write two unit tests with made-up numbers in `limits.test.ts`, one per function, then move the
  code; the page calls the functions.

  Verify:
  - `pnpm --filter app exec vitest run src/lib/limits.test.ts` passes with the two new tests;
  - `pnpm run test`: 52 and 99;
  - `pnpm run build && pnpm run test:e2e`: the 38 tests of `limits.spec.ts` still pass.
- [x] 1.2 Write the browser test of the scenario "The elderly are the elderly" (spec `limits`) in
  `limits.spec.ts`, on `votes/5960/`.

  Verify:
  - it passes;
  - it fails against a mutant: the limit of "65 Jahre und älter" built from the definition of
    "0–17 Jahre";
  - the browser tests: 104.

  As built: the test passed when written, since the code was right. Against the mutant, put into
  `Limits.svelte`'s `add` and removed again, it failed on the label. The browser tests: 104.

## 2. The texts behind one type, in German

Design, decisions 7 and 8. The screen does not change in this group.

- [ ] 2.1 `src/lib/texts.ts` becomes `src/lib/texts/`:
  - `index.ts` holds the type `Language` (only `'de'` until 3.1), the `Texts` interface and
    `textsOf(language)`;
  - `de.ts` holds today's texts as one `Texts` object;
  - the month names become the language's function that writes a date (day, month, year);
  - `texts.ts` is removed.

  Verify:
  - `pnpm run check`: 0 errors;
  - `pnpm run test`: 52 and 99 pass;
  - `git grep -n "lib/texts.ts" app/src` shows nothing.
- [ ] 2.2 Every function of `src/lib/` that writes a text takes the `Texts` as a parameter:
  - `vote-list.ts`, `vote-page.ts`;
  - `result-map.ts` (legend and details);
  - `characteristics.ts`: a key per definition, its name from the texts;
  - `limits.ts` (label and the count's sentence);
  - `format.ts` (`formatDate`).

  Their unit tests pass `textsOf('de')`.

  Verify:
  - `pnpm run check` and `pnpm run lint`: 0 issues;
  - `pnpm run test`: 52 and 99 pass, with no expected text changed.
- [ ] 2.3 The routes and components take the texts of the page's language: `'de'` from each
  page's data, `textsOf` in the component or as a prop.

  Verify:
  - `pnpm run build && pnpm run test:e2e`: 104 pass, with no expected text changed.

## 3. French and Italian texts

Design, decisions 9 to 11.

- [ ] 3.1 `Language` becomes `'de' | 'fr' | 'it'`, and `fr.ts` and `it.ts` hold every text:
  - the terms of `investigations/languages.md` as decision 11 chose them;
  - the guide in full;
  - French with "vous" and no space before a colon; Italian with "Lei";
  - « » without inner spaces.

  Verify:
  - `pnpm run check`: 0 errors;
  - a mutant that deletes one text from `it.ts` makes `pnpm run check` fail and name it.
- [ ] 3.2 The unit test "no untranslated string": no string of `fr` or `it` equals `de`'s, apart
  from a list of names in the test ("Popular Vote Explorer" and the like).

  Verify:
  - it passes;
  - it fails against a mutant: a German text copied into `fr.ts`.
- [ ] 3.3 Dates per language. Write the unit tests of the scenarios "A date in each language" and
  "The first day of a month" (spec `vote-list`), then each language's function.

  Verify:
  - both fail first, then pass;
  - `pnpm run test`: 52 and 102.
- [ ] 3.4 The vote's texts by language: one function gives a vote's title, reference or note in a
  language. It throws, naming the vote and the language, when the text is missing or empty. The
  list and the vote's page use it.

  Write two unit tests:
  - vote 5960's title, reference and note in French and Italian, against the data files;
  - a list whose vote 5960 has no Italian title throws, naming 5960 and Italian.

  Verify: both fail first, then pass.
- [ ] 3.5 Unit tests of the terms, through the functions and the data files, one at a time:
  - the entries of 5960 and 6790 in French and Italian (scenarios "The list's verdicts" and "The
    same vote in French and Italian");
  - the six kinds in both;
  - the figures, verdicts, outcome and table column of 5960 in both;
  - the provisional result of 6850 in both;
  - Zürich's details on 5960 in Italian;
  - the party names of the panel in both.

  Verify:
  - 6 tests, each seen to fail against a mutant of its term, since the texts exist from 3.1;
  - `pnpm run test`: 52 and 110.

## 4. A page in each language

Design, decisions 5, 6 and 12.

- [ ] 4.1 The pages move under `src/routes/[lang]/`:
  - `[lang]/+layout.ts` returns the language and answers 404 for any other;
  - each page names its entries: the three languages, and every pair of language and id;
  - every link is written by `resolve` with the page's language;
  - `app.html` writes `lang="%lang%"`, and `src/hooks.server.ts` replaces it.

  Every `goto` and `toHaveURL` of the browser tests opens or expects the German page
  (`de/votes/5960/`, `de/`, `de/guide/`).

  Verify:
  - `pnpm run build` writes 125 pages under each of `de/votes/`, `fr/votes/` and `it/votes/`,
    counted with `find`;
  - `grep -o 'lang="[a-z]*"' app/build/swiss-votation-visualisation/fr/votes/5960/index.html | head -1`
    gives `lang="fr"`;
  - `grep -nE "(goto|toHaveURL)\(" app/e2e/*.ts` lists no path without a language, apart from
    the test of an address that names no page;
  - `pnpm run test:e2e`: 104 pass.
- [ ] 4.2 The switch at the top of every page, from the layout: "Deutsch", "Français",
  "Italiano", with `lang` and `hreflang`, the page's own language not a link and marked
  `aria-current`, the others with `data-sveltekit-reload`.

  Write the browser tests, in a new `e2e/languages.spec.ts`, of the scenarios "From German to
  French", "The switch on the start page and the guide" and "A selection stays behind", one at a
  time.

  Verify: each fails first, then passes; the browser tests: 107.
- [ ] 4.3 Write the browser tests of the pages in French and Italian, in `languages.spec.ts`, one
  at a time. They cover these scenarios:
  - of `interface-languages`:
    - "The three pages of a vote", which counts the built pages with Node's `fs`;
    - "The start page and the guide in each language", "A language that has no page";
    - "The details of a municipality in Italian", "A selection in French";
    - "The verdicts in French", "The verdicts in Italian", "The list's verdicts";
    - "A result not validated yet", "The parties", "The Swiss abroad", "The sources";
    - "The annulled vote in French", "The annulled vote in Italian", "A title as the BFS gives
      it";
    - "A municipality with two names", "The cantons in the table";
  - of `vote-list` and `verdicts`: "The same vote in French and Italian", "The page of a vote in
    French", "A validated vote in French and Italian".

  The scenario "The kinds of vote" is covered by 3.5, and "A title missing in one language" by
  3.4.

  Verify:
  - each test fails first or against a mutant, and passes;
  - the browser tests: 107 + 20 = 127.

## 5. Addresses without a language

Design, decisions 2 to 4.

- [ ] 5.1 `src/lib/languages.ts` builds the script of a page that redirects, for the address of
  its page in a language.

  Write its unit tests: run the script's very text with a fake `navigator` and `location`. The
  preferred languages and the expected outcome:
  - "fr-CH" gives `fr/`;
  - "en-US", "it-CH", "de-CH" gives `it/`;
  - "en-US" gives `de/`;
  - none gives `de/`;
  - "frr" gives `de/`;
  - the target is called with `replace`, not set as `href`.

  Verify: they fail first, then pass; `pnpm run test`: 52 and 116.
- [ ] 5.2 The root, `/guide/` and `/votes/<id>/` become pages that redirect:
  - `csr = false`;
  - the script in the head;
  - a `<noscript>` meta refresh to the German page;
  - the three links in the body.

  Write the browser tests, one at a time:
  - the five scenarios of "The address without a language";
  - the four of "The addresses of before";
  - the scenario of `app-shell`, "The built files are served by a static file server".

  The same-origin test of `app-shell` starts at `/`.

  Verify:
  - each test fails first, then passes;
  - `grep -c "_app/immutable" app/build/swiss-votation-visualisation/votes/5960/index.html`
    gives 0;
  - the browser tests: 137.

## 6. Look and size

- [ ] 6.1 Look at the built site, in windows 1,280 and 800 pixels wide:
  - `/fr/votes/5960/` and `/it/votes/5960/` with a selection;
  - `/fr/`;
  - `/it/guide/`.

  Check the switch, and long French and Italian words in the verdicts, the table, the legend and
  the panel. Fix what overflows.

  Verify: the screenshots were looked at, and the note names what was fixed, or "nothing".
- [ ] 6.2 Measure the size and the time of `pnpm run build`, before (`main`) and after: the
  disk use of `app/build/swiss-votation-visualisation` and of its `*/votes/` directories.

  Verify: the note gives both, against `investigations/languages.md`, 8 (about 40 MB of vote
  pages).

## 7. Documentation and the whole

- [ ] 7.1 `openspec/config.yaml`:
  - the texts are one module per language in `app/src/lib/texts/`;
  - the item "how the three interface languages are handled" leaves "Not decided", for a line
    naming this change.

  Verify: `openspec validate --all --strict` passes.
- [ ] 7.2 `README.md`: the three languages and their addresses. `docs/roadmap.md`: #9's row says
  what it delivers, and the investigation `languages.md` joins the list of investigations.

  Verify: both read as the specs say, and the roadmap names the investigation.
- [ ] 7.3 Update `CLAUDE.md` for every file this change adds, moves or changes:
  - `app/src/lib/texts/` and `languages.ts`;
  - `src/hooks.server.ts` and `app.html`'s `lang`;
  - the routes under `[lang]` and the three pages that redirect;
  - `e2e/languages.spec.ts`;
  - `investigations/languages.md` and its script;
  - the status line.

  Verify: every file of `git diff --stat main` under `app/`, `investigations/` and
  `openspec/specs/` is named in the code map or the "Where things are" table.
- [ ] 7.4 Run `./scripts/verify-local.sh`.

  Verify: 11 of 11 steps pass, with:
  - 52 tests of the calculation and 116 of the app;
  - 137 browser tests;
  - 134 of the pipeline.

## Workflow follow-up

- `/openspec-verify-change`, then `/openspec-archive-change` once Q has reviewed the French and
  Italian texts in the pull request.
