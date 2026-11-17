# Proposal

## Why

The product is for the curious public of all of Switzerland, and `openspec/config.yaml` asks for
the interface and the vote titles in German, French and Italian. Until now every page is German.
Change #9 of `docs/roadmap.md`, `add-interface-languages`, implemented here, adds French and
Italian. It settles what the roadmap leaves open for it:
- how the three languages are handled;
- how the language is chosen, and which one is the default;
- the source of the vote titles;
- the names of municipalities and cantons in each language.

`investigations/languages.md` gives the official French and Italian terms, with their sources.

It also takes two of the four suggestions left open when `add-limits` was verified (its archived
`tasks.md`, "Verification and review"). Q chose to make them this change's first tasks:
- the count of the remaining municipalities and the set-aside ones are worked out in a module of
  `src/lib/`, not in the page;
- the label of "65 Jahre und älter" gets its browser test.

The other two were fixed in the archive.

## What Changes

- **A page per language.** Every page is written three times:
  - in German at `/de/…`, in French at `/fr/…`, in Italian at `/it/…`;
  - for example `/fr/votes/5960/` and `/it/guide/`;
  - each page declares its language in its markup.
- **The language is chosen by the browser.**
  - The site's address without a language (`/`) opens the start page in the first of German,
    French and Italian among the browser's preferred languages.
  - Without one of them, or without scripts, it opens the German one.
  - The choice is not remembered.
- **The addresses of before keep working.** `/votes/<id>/` and `/guide/` open the same page in
  the language chosen that way. Links shared before this change still lead to their page.
- **A switch on every page.** Each page links to itself in the two other languages. Each link is
  named in its own language: "Deutsch", "Français", "Italiano".
- **Every text in three languages.**
  - The texts of the screen, the reading guide included, are written in French and Italian.
  - They use the terms of the Confederation: the Chancellery's, the Constitution's, the BFS's
    and the party register's (`investigations/languages.md`).
  - The vote's title, its reference and the Chancellery's note come from the data files in the
    page's language. The data files already hold all three, so the pipeline does not change.
- **Dates in each language.**
  - French and Italian write the day, the month in lower case and the year: "28 février 2016",
    "28 febbraio 2016".
  - The first of a month is "1er" and "1°".
  - Counts and shares are written the same way in all three languages: "1'609'152", "49.16%".
- **Places keep their one name.**
  - Municipalities keep their official name in every language (Biel/Bienne stays Biel/Bienne).
  - Cantons keep their abbreviations.
- **Two cleanups from `add-limits`** (see above).

**BREAKING** for links: every page moves under a language. The old addresses redirect, so a link
to `/votes/5960/` still arrives, at `/de/votes/5960/` or at the page in the browser's language.

## Non-goals

- **No other language:**
  - no Romansh and no English;
  - a browser that prefers one of them gets German.
- **The language is not remembered:**
  - no cookie and no storage;
  - the address without a language decides anew each time.
- **The page's state stays behind.** Switching the language does not carry over the limits, the
  municipality clicked or the map's zoom: the switch opens the other page.
- **One number format.** The apostrophe and the decimal point stay in French and Italian too.
- **No translated place names.** "Bienne" alone, "Ginevra" or "Genf" are not shown; the
  register's names and the cantons' abbreviations are.
- **No change to the data or the pipeline.**

## Capabilities

### New Capabilities

- `interface-languages`: covers:
  - the three languages and the address of each page in each;
  - the choice at the address without a language, and the addresses of before;
  - the switch;
  - the official terms;
  - the vote's texts in the page's language;
  - the names of places;
  - how the other capabilities' addresses and German quotations are read for the three
    languages.

### Modified Capabilities

- `app-shell`: "The site is a set of static files". The site's path opens the start page in the
  browser's language, not the one German start page.
- `vote-list`: two requirements change.
  - "What an entry of the list shows": the title and the kind are in the page's language.
  - "How dates and numbers are written": the month name is in the page's language, with the
    French and Italian forms of a date.
- `verdicts`: two requirements change.
  - "A page for every vote": the heading is the title in the page's language, and the build
    writes the page in each language.
  - "What the sources say about the result": the reference and the note are in the page's
    language.

## Impact

- **App:**
  - the routes move under `src/routes/[lang]/`;
  - the address without a language and the old addresses become pages that redirect;
  - a hook writes each page's `lang`;
  - `src/lib/texts.ts` becomes one module per language behind one type, so that a missing
    translation fails the type check;
  - the functions of `src/lib/` that write a text take the texts of the page's language;
  - `format.ts` writes dates per language;
  - the page of a vote and the components take the language from the page's data.
- **Tests:**
  - the browser tests open the German pages (`de/votes/5960/`);
  - new browser tests cover the choice, the old addresses, the switch, `lang`, and the French and
    Italian terms and dates;
  - unit tests cover the date per language and the texts of the three languages.
- **Size:** the vote pages triple, from about 14 MB to about 40 MB of the site
  (`investigations/languages.md`, 8).
- **Docs:** `openspec/config.yaml` (the interface's languages are decided), `docs/roadmap.md`,
  `CLAUDE.md`, `README.md`.
- **Unchanged:** the calculation, the pipeline, the data files, the performance budgets and their
  measurement.
