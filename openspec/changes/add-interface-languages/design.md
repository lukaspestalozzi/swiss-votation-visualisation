# Design

## Context

See `proposal.md` for the why. The state this design starts from:

- **Routes:** `src/routes/+page.svelte` (the start page), `src/routes/guide/` and
  `src/routes/votes/[id]/`, all prerendered (`+layout.ts`: `prerender = true`,
  `trailingSlash = 'always'`) for the path `/swiss-votation-visualisation`.
- **Texts:** every text of the screen is in `src/lib/texts.ts`, in German. It holds constants and
  functions of figures. Six modules of `src/lib/` import it, and so do five Svelte files.
  `format.ts` takes the month names from it.
- **Data:** the data files hold every vote's title, reference and note in German, French and
  Italian (`investigations/languages.md`, 7). A municipality has one name, and a canton is shown
  by its abbreviation.
- **Tests:** the browser tests open pages, or expect an address, by paths relative to the site
  (`votes/5960/`): 75 calls of `goto` and `toHaveURL` in five files. Playwright's default locale
  is "en-US".
- **SvelteKit 3.2:**
  - it has the `handle` hook with `transformPageChunk`, which runs while prerendering;
  - a param matcher is a Standard Schema in version 3, no longer a `match` function;
  - `resolve` takes a route and its params.

## Goals / Non-Goals

**Goals:**
- One build writes every page in three languages, and a missing translation fails the check, not
  the visitor.
- No text of the screen is chosen at run time: each page is written in its language.
- The browser tests keep their present scenarios on the German pages, and test the languages
  apart.

**Non-Goals:**
- No `hreflang` links in the head, no sitemap. Nothing asks for them.
- No translation of the data. Its three languages are the BFS's and the Chancellery's.
- No change to the calculation, the pipeline, the data files or the budgets.

## Decisions

### 1. A page per language (Q)

Each page is written three times when the site is built, under `/de/`, `/fr/` and `/it/`. A page
holds only its own language's texts.

Alternatives considered:
- **One page that switches its texts in the browser.** One address per page, but the page holds
  or loads all three languages, a page without scripts is German only, and the language would be
  chosen after the page has shown.
- **A language in the query (`?lang=fr`).** Static hosting cannot answer it with another file,
  so the same problem.

### 2. All three under a prefix; the browser decides at the root (Q)

`/` has no content of its own. It opens `/de/`, `/fr/` or `/it/`:
- it takes the first of the three among the browser's preferred languages (`navigator.languages`,
  in order), a language counting by its part before the first "-";
- it takes German without one of them, and without scripts.

Nothing is stored, so `/` decides anew each time (spec `interface-languages`, "The address
without a language").

Alternatives considered:
- **German at `/`, French and Italian under a prefix.** German addresses stay as they are, but
  the languages are not equal, and a French browser lands in German.
- **`/` always German, with the switch.** No script, but a French or Italian reader must find the
  switch first.
- **Remembering the choice** in storage or a cookie. Q chose "the browser decides"; storage needs
  a notice and a way to forget.

### 3. The addresses of before follow the browser too (Q)

`/votes/<id>/` and `/guide/` become pages that redirect, by the same rule as `/`. Every address
without a language thus behaves the same way, and a French reader of an old shared link lands in
French.

Alternative considered: **always German** (a meta refresh, no script). The old page was German,
but a French reader would land in German.

### 4. Pages that redirect: a script in the head, a refresh without scripts

`/`, `/guide/` and `/votes/<id>/` are prerendered pages with `csr = false`: no SvelteKit script
is loaded and nothing hydrates. Each page holds:
- **in its head, a short inline script.** It picks the language and calls `location.replace` with
  the address of the page in that language. The address is written into the page when it is
  built (`votes/5960/`), so the script parses no path, and `/votes/5960` without its slash
  arrives too. `replace` keeps the redirecting page out of the history, so "back" works;
- **in its head, a `<noscript>` meta refresh** to the German page;
- **in its body, the three links "Deutsch", "Français", "Italiano"** to the page in each language,
  for whatever stops both.

The script's text is built by a function of `src/lib/languages.ts`. A unit test runs that very
text with a fake `navigator` and `location`; the browser tests run it with Playwright's `locale`,
and with `javaScriptEnabled: false` for the refresh.

Alternatives considered:
- **Redirect in `onMount`.** It waits for SvelteKit's scripts and hydration before it moves.
- **Server redirects.** GitHub Pages has none.
- **A `404.html` that redirects.** Every unknown address would then become a page, against
  `publishing`'s "An address that names no page".

### 5. Routes under `[lang]`, a language checked in its layout

The pages move to `src/routes/[lang]/` (`+page`, `guide/`, `votes/[id]/`):
- `[lang]/+layout.ts` returns the language from `load`;
- any other value is a 404 (`error(404)`), which prerendering never meets, since it follows only
  the entries;
- each page names its `entries`, which SvelteKit takes from a page, not from a layout: the start
  page and the guide the three languages, a vote every pair of language and id.

A param matcher would also keep `/en/` out. In SvelteKit 3 it is a Standard Schema, and the check
in the layout is three lines.

The routes `src/routes/+page.svelte`, `guide/` and `votes/[id]/` stay as the pages that redirect
(decision 4). A static segment wins over `[lang]`, so `/guide/` is the redirect and `/de/guide/`
is the guide.

### 6. `lang` written into every page by a hook

`app.html` writes `<html lang="%lang%">`. `src/hooks.server.ts` replaces it in `handle`, with
`transformPageChunk`:
- the first segment of the path after the base, when it is a language;
- "de" for the redirecting pages, whose links each carry their own `lang`.

The hook runs while prerendering, so every file is written with its language.

- **Within one language,** navigation stays in the browser, and the language does not change.
- **Across languages,** the switch's links carry `data-sveltekit-reload`, so a change of language
  is a new page with its own `lang`. That is also why the limits stay behind (spec, "Changing the
  language").

Alternative considered: **setting `document.documentElement.lang` in the layout.** It is right
only after hydration, and wrong in the prerendered file.

### 7. The texts: one module per language behind one type

`src/lib/texts.ts` becomes `src/lib/texts/`:
- `index.ts` holds the `Language` type, the three languages, the `Texts` interface and
  `textsOf(language)`;
- `de.ts`, `fr.ts` and `it.ts` each export one `Texts` object.

A text missing in one language is a type error, which `pnpm run check` catches. A text with
figures stays a function of them; a date is one too, so that each language writes its own
(decision 10).

A unit test also catches a text copied but not translated: no string of `fr` or `it` may equal
`de`'s, apart from a short list of names that are the same, such as the working title.

Alternatives considered:
- **One file with three objects.** About 800 lines to scroll, and three languages in one diff.
- **An i18n library** (Paraglide, svelte-i18n). It adds a dependency, string keys or generated
  code, and a run-time lookup, for 3 fixed languages known when the site is built.

### 8. The texts reach the code as a parameter

Every function of `src/lib/` that writes a text takes the `Texts` of the page's language as a
parameter: the list, the vote's page, the map's legend and details, the panel, a limit's label,
the date. No module keeps a "current language":
- prerendering writes pages of the three languages in one process;
- a module-level language would be wrong for some of them.

The other parts:
- **Pages:** each page's `load` returns its `lang`, and the components call
  `textsOf(data.lang)` or receive the texts as a prop.
- **Characteristics:** a definition keeps everything else language-free and gets a key; its name
  is looked up in the texts by that key. The tracks and the values of a limit stay the same in
  every language, so the selection is the same (spec `interface-languages`, "How the other
  capabilities hold in three languages").

Alternatives considered:
- **Svelte context.** It reaches the components, but not `src/lib/`, which is plain TypeScript.
- **A global set at start.** Wrong while prerendering, as above.

### 9. The vote's texts by language, or the build fails

A function of `src/lib/` takes a vote's title, reference or note in the page's language. It
throws, naming the vote and the language, when the text is missing or empty, so the build fails
(spec, "The vote's texts in the page's language"). The pipeline already refuses a missing title
or reference (`vote-data`), so this never happens with the committed files. It is the app's own
guard, in the way `vote-page.ts` already refuses a missing file of entries.

### 10. One number format, month names per language (Q)

Counts, shares and the half cantonal vote are written the same in the three languages, as they
are now: "1'609'152", "49.16%", "16½". Each language writes its date:
- German: "28. Februar 2016", "1. Juni 2008";
- French: "28 février 2016", "1er juin 2008";
- Italian: "28 febbraio 2016", "1° giugno 2008".

The French and Italian forms of the first day are those of the Constitution's footnotes
(`investigations/languages.md`, 6). `format.ts` keeps the parsing and the check of a date; the
texts of a language write the day, the month and the year.

Alternative considered: **each language's own number format** (French "1 609 152", "49,16 %").
Closer to each language's habits, but the same figure would read differently by language, and
the tests and the investigations cite one form.

### 11. The terms: the Confederation's, and where its sources differ (Q)

Claude writes the French and Italian texts, and Q reviews them in the pull request. They use the
terms of `investigations/languages.md`. Where its sources differ, Q chose the Constitution and the
figures' own sources:
- **"Standesstimmen":** "voix des cantons" (Constitution art. 139b and 142), not the linked
  data's "votes des cantons"; "voti dei Cantoni" in Italian (both sources);
- **the Greens:** "Verts" (STAT-TAB, the table of the party strengths) and "I Verdi" (the party
  register's short form), not the parliament's "VERT-E-S" and "VERDI";
- **the Centre in Italian:** "Il Centro" (the party register's name), not the parliament's
  "Alleanza del Centro". In French, "Le Centre" (register and parliament).

The other parts:
- **The Swiss abroad (Q):** paired like the German, "Suissesses et Suisses de l'étranger" and
  "Svizzere e Svizzeri all'estero", after the Swiss Abroad Act's "Suisses de l'étranger" and
  "Svizzeri all'estero".
- **How the texts are written:**
  - French addresses the reader as "vous", Italian with the formal "Lei", as the German uses
    "Sie";
  - French puts no space before a colon and quotes with « » without inner spaces, as federal
    French and the data's titles do (`investigations/languages.md`, 6).

Alternatives considered:
- **The parliament's and the linked data's names** ("votes des cantons", "VERT-E-S", "VERDI",
  "Alleanza del Centro").
- **The law's short form for the Swiss abroad.** Sourced and shorter, but the three languages
  would then differ in form.
- **A professional translator.** Better French and Italian, but outside this project's means;
  Q's review stands in for it.

### 12. The switch: three names at the top, the page's own not a link (Q)

A `nav` at the top of every page names "Deutsch", "Français" and "Italiano", in this order:
- each name has the `lang` of its language, and each link its `hreflang`;
- the page's own language is plain text with `aria-current="page"`;
- the other two link to the same page in their language. The layout writes the switch for
  every page.

While applying, Q chose how a link is built:
- The lint rule `svelte/no-navigation-without-resolve` refused the page's own address with its
  language segment replaced, and a `resolve` over the page's route as a union does not
  type-check.
- So the switch resolves each of the three routes (the start page, the guide, a vote's page) by
  name, typed. A route it does not know is an error, so a new route must be added there.
- `resolve` writes no final slash. GitHub Pages adds it; the test's server shows the same page
  without it (spec `verdicts`, "A vote's address without the final slash"). Q chose to accept
  both forms rather than add the slash with a type assertion.

Alternatives considered:
- **The codes DE · FR · IT.** Shorter, but less clear.
- **A select list that navigates.** One control, but it needs a script, and a select that
  navigates on change surprises keyboard users.

### 13. Places keep their names

The screen names a municipality by the register's name and a canton by its abbreviation, in every
language (spec, "Places keep their names"):
- the register gives one official name per municipality, bilingual ones with a slash;
- the abbreviations are the same in the three languages (`investigations/languages.md`, 7).

Alternative considered: **translated names** ("Genève", "Genf", "Ginevra" for a canton, in the
table). No data file holds them; a canton's name in three languages would be a new list to keep.
The table names cantons by abbreviation today, in German too.

### 14. First, the two suggestions of `add-limits` (Q)

Q chose to make these the change's first tasks, before any language:
- **The count and the set-aside move from `+page.svelte` into `src/lib/limits.ts`**, as two
  functions with unit tests. The count's sentence is a text, so it then takes the texts like
  every other function (decision 8).
- **The scenario "The elderly are the elderly"** (`limits`) gets its browser test on the German
  page.

### Tests

**Unit tests (Vitest):**
- `format.ts`: a date in each language, the first day of a month included;
- `texts/`: no untranslated string;
- `languages.ts`: the redirect script with fake browsers (fr-CH, en-US then it-CH, en-US, none);
- the vote's texts: a missing Italian title throws, naming the vote and the language;
- `limits.ts`: the count and the set-aside.

The present unit tests pass the German texts where a function now takes them.

**Browser tests (Playwright):**
- Every present test opens the German page: `votes/5960/` becomes `de/votes/5960/`, `./`
  becomes `de/`, `guide/` becomes `de/guide/`. A check of the task lists every `goto` and
  `toHaveURL`, so that no test reaches its page through a redirect by accident.
- A new `e2e/languages.spec.ts` covers the scenarios of `interface-languages`:
  - the three pages, `lang` and 404;
  - the root and the old addresses, with Playwright's `locale` and without scripts;
  - the switch, and the selection that stays behind;
  - the terms, the vote's texts, the places, dates in French and Italian;
  - one selection on the French page.
- The same-origin test of `app-shell` starts at `/`, so the redirecting page is checked too.
- The budget tests stay on the German page.

### Dependencies added

None.

### Performance budget

The change adds no work to an input of the page: the texts are chosen when the page is written,
and the budgets of 16 ms per frame and 50 ms for a jump hold unchanged, measured as before.
An address without a language costs one more page before the page itself: about 2 KB and a
script of under 1 ms, then `location.replace`.

## Risks / Trade-offs

- [The French and Italian texts read as translations] → the terms are the Confederation's, Q
  reviews every text in the pull request, and the untranslated-string test catches copies.
- [A browser test that still opens an old address passes through the redirect and hides it] → the
  task's check lists every `goto`; Playwright's "en-US" would land in German anyway, so the check
  is the guard.
- [The site and its build grow: about 40 MB of vote pages instead of 14 MB, three times the
  prerendering] → measured by the task that builds; well inside GitHub Pages' 1 GB
  (`investigations/languages.md`, 8).
- [`<noscript>` with a meta refresh in the head is not followed by some browser] → the body's
  three links remain; the browser test without scripts checks Chromium.
- [Links shared before this change go through a redirect] → they all still arrive; only the
  address in the bar changes.
- [The switch drops the limits] → it opens a new page, as the spec says; limits live with the
  page (`add-limits`, decision 18).

## Migration Plan

1. Merge and let CI publish as usual.
2. The old addresses redirect from the first deploy on.

Rollback: revert the merge. The old addresses then serve the German pages again, and the new
`/de/…` addresses answer 404.

## Open Questions

None. Q decides the wording of the French and Italian texts in the pull request; a change there
changes no spec scenario's terms, which are the investigation's.
