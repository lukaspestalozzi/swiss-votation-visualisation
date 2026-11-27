# Design

## Context

See proposal.md, "Why". What exists today, verified on 2026-11-27:

- `votes.json` holds per vote its BFS title in three languages, the Chancellery's reference and
  `note` (four votes have one), the result and the sums. It is read at build time only: the
  start page, a vote's page and the comparison import it in their server loads, and no page
  fetches it in the browser. It is 101.5 KB.
- No source the pipeline reads, nor the Swissvotes dataset, holds a text on what a vote is
  about. The BFS feed's `vorlagen` have titles in de/fr/it/rm/en and no description; the
  Chancellery's linked data has results, references and notes; Swissvotes' CSV has a headline
  in German (`kurzbetitel`, "Familienartikel scheitert am Ständemehr") and links, and its
  "Kurzbeschreibung" is a PDF of about two pages, in German and French only.
- The Federal Council's explanations (the voting booklet) open each vote's part with a short
  text ("Das Wichtigste in Kürze", "En bref", "In breve"). On www.admin.ch a vote day's page
  links its booklet as a PDF under an opaque path (`/dam/de/sd-web/<id>/<name>.pdf` for
  2024-03-03). Task 1.1 found, on 2026-11-27, a booklet in German, French and Italian for each
  of the 35 vote days from 2015-06-14 on, and none on www.admin.ch for the 9 days from
  2013-03-03 to 2015-03-08 (25 votes). Swissvotes keeps copies of those in German and French
  (`https://swissvotes.ch/vote/<number>.00/brochure-<de|fr>.pdf`), not in Italian; it refuses
  `HEAD` (405) and answers a `GET` with a redirect to the PDF.
- The list holds 125 votes on 44 vote days: 61 popular initiatives, 48 optional and 13
  mandatory referendums, and the initiative, counter-proposal and tie-break question of
  2026-03-08.
- `pipeline/known-differences.json` is the precedent for a hand-written, reviewed input of the
  pipeline that stops the update when it no longer fits the sources.

## Goals / Non-Goals

**Goals:**

- Every vote of the list has a summary in three languages before its page is built; none can
  be forgotten on a new vote day.
- A summary can be checked against the booklet it was written from, by anyone, through the link
  under it.
- The summaries are data, reviewed in a pull request like any other change of the data files.

**Non-Goals:**

- No check of a summary's content by a program beyond its form (length, plain text): accuracy
  and neutrality are reviewed by people (decision 8).
- No archive of the booklets: if the Confederation moves them, the update says so (decision 11).

## Decisions

1. **The site's own summaries, written from the booklet** (Q, 2026-11-27). Considered: links
   only, to the booklet or to Swissvotes (nothing to write and nothing to get wrong, but the
   visitor still leaves the site to learn what a vote was about, which is what Q asked to
   avoid); the booklet's own short texts, extracted from the PDFs and trimmed (official and in
   three languages, but 150 to 300 words long, laid out differently across the years, and once
   trimmed partly our text anyway); Swissvotes' descriptions (an editorial text of the
   Année Politique Suisse, two pages, no Italian). Chosen: two or three sentences of our own,
   which fit the page and read the same way across 13 years.

2. **The file of the summaries is an input of the pipeline** (Q). `pipeline/vote-summaries.json`,
   written by hand and reviewed, which the update checks and writes into `votes.json`. Considered:
   a TypeScript module in `app/src/lib/` keyed by vote id, with a unit test that fails on a
   missing one: simpler, but the texts on the votes would live outside the data files, the
   pipeline would not know about them, and a new vote day could be added without them. The
   chosen way keeps "the data files are written by the pipeline only" and makes a new vote day
   stop until its summaries exist (decision 7). Shape:

   ```json
   {
     "days": {
       "2016-02-28": {
         "explanations": {
           "de": { "address": "https://www.admin.ch/…", "language": "de" },
           "fr": { "address": "…", "language": "fr" },
           "it": { "address": "…", "language": "it" }
         }
       }
     },
     "votes": {
       "5960": { "de": "…", "fr": "…", "it": "…" }
     }
   }
   ```

   Keys sorted, two spaces, UTF-8, a final newline: the update reads it and never writes it.
   `votes.json` gains per vote `summary`, `{de, fr, it}`, and `explanations`, `{de, fr, it}` of
   `{address, language}`, after `note`; the explanations are repeated on each vote of a day, so
   that a page needs its vote only. `language` is the document's: it differs from the key only
   for Italian before 2015-06-14 (decision 14).

3. **The link goes to the Federal Council's explanations of the vote day, as a PDF in the page's
   language** (Q). Considered: Swissvotes' page, `https://swissvotes.ch/vote/<number>.00`, one
   pattern for every vote, but no Italian and not the official source; no link, which leaves a
   summary uncheckable. The link names the document, "Erläuterungen des Bundesrates (PDF)",
   "Explications du Conseil fédéral (PDF)", "Spiegazioni del Consiglio federale (PDF)", the
   names the Federal Chancellery uses (to be confirmed in task 1 for French and Italian). Before
   2015-06-14 the link goes to a copy on Swissvotes (decision 14).

4. **The guide says that the summaries are the site's own** (Q). Considered: a line under each
   summary as well, which says it where it is read but repeats itself on 125 pages and on the
   comparison twice. Chosen: one sentence in the guide's "Quellen".

5. **The tie-break question has its own summary** (Q), so that every vote has one and no page
   needs an exception: it says what the question asks.

6. **On a vote's page and on the comparison, not on the start page** (Q). On a vote's page the
   summary stands in the head, below the sentence on the majorities and above the workbench; it
   does not stay in the window with the result and the map. On the comparison it stands in each
   chosen vote's head (`ComparedVote.svelte`). The start page keeps one line per vote, and its
   search keeps looking at titles only.

7. **A vote without a summary stops the update** (Q, 2026-11-27, in the review of this
   change). Considered: building the page
   without a summary and listing the missing ones in the update's report, which would let a
   vote day's results go online sooner but could leave a vote without a summary unnoticed.
   A summary of a vote the update does not write stops it too, so the summaries of a vote day
   are written after it, once its results exist (Q, 2026-11-27, when applying the change found
   that summaries written ahead would stop every update until the vote day). Considered:
   grouping the summaries by vote day and accepting those of a coming day, which would let them
   be written from the booklet ahead, at the cost of a second shape of the file and a rule that
   depends on the day of the run. The procedure of a vote day (`pipeline/README.md`): run the
   update, which stops naming the new votes without a summary; write them; run it again.

8. **Q reviews a sample** (Q): at least 15 votes, chosen in `investigations/vote-summaries.md`
   to cover every year and kind and the most disputed votes (among them 5800, against mass
   immigration, and 6650, the 13th AHV pension), in the languages Q chooses. Every summary is
   drafted by Claude from its booklet in its own language (the French one from the French
   booklet, not translated from the German), and the German ones go through the `humanizer`
   pass that Q asks for on texts for readers. The rules a summary follows are those of the
   requirement "What a summary says": what the proposal changes, in its present tense; no
   result, argument, recommendation or position.

9. **"Summary", not "note"**. `votes.json` already holds `note`, the Chancellery's note on four
   votes, and the page shows it under "Hinweis der Bundeskanzlei". The new text is a `summary`
   in the data, the code and the specs, so that the two are never confused.

10. **120 to 450 characters per language, plain text**. Two or three sentences in German take
    about 200 to 400 characters; French and Italian run about 10 to 20 % longer. The bounds
    catch a summary left empty or a paragraph pasted from the booklet without asking for an
    exact count. No line break, markup or link, so that the page shows the text as it is
    (Svelte escapes it) and no summary links elsewhere. Checked by the update and, through the
    types, by the build.

11. **The update requests every address of the explanations**. 44 vote days × 3 languages, a
    `HEAD` request each (a `GET` where the server refuses `HEAD`), within the retries of
    `download.py`; each must answer 200 with `application/pdf`, from 2015-06-14 on
    `https://www.admin.ch`, before on `https://swissvotes.ch` (decision 14). A
    moved booklet then stops the update with its vote day, language and address, as an
    unreachable source does. admin.ch answered 6 of 132 requests in a row of task 1.1 with 403 and
    each of them with 200 a moment later, so the check waits a second between requests to it and
    retries a 403 like a failed connection. Considered: no check (links rot unseen); a check in CI (CI would
    fail on the Confederation's server, on pushes that change nothing of it). The answers are
    not read and not recorded in `sources.json`, which records files the data is made from; the
    file of the summaries is recorded there, with its size and checksum, so that the record
    still names everything `votes.json` holds.

12. **No budget changes**. Nothing is computed when the visitor acts: a vote's page holds its
    summary as text written at build time, and the comparison's page data holds the summary and
    addresses of each of the 124 votes it offers, in its language, so that choosing a vote
    only shows a string it has. The comparison's data grows by about 50 KB (15 to 20 KB with
    gzip, an estimate; task 4.4 measures it). The budgets of the limits, the map and the
    comparison stay as they are.

13. **No new dependency**. The pipeline's check uses `urllib` through `download.py`; the app
    needs nothing new, and the link is the only thing on the page that leaves the site, on the
    visitor's click.

14. **Swissvotes' copies for the vote days before 2015-06-14** (Q, 2026-11-27, after task 1.1).
    German and French pages link Swissvotes' copy in their language; Italian pages link the
    French copy, and the link says so ("Spiegazioni del Consiglio federale (PDF, in francese)").
    The summaries of those days are written from the German and French copies, the Italian one
    from the French. Considered: no link for those 25 votes (simplest, but they could not be
    checked from the page); searching web archives for the original Italian booklets (unknown
    result, and an archive's host). French over German for Italian readers, as it is the closer
    language for most of them; a judgement, not measured.

    On 2016-02-28 every French page of admin.ch links the German booklet, and admin.ch has no
    French one. Q chose that German booklet, marked "(PDF, en allemand)", over Swissvotes'
    French copy, keeping every link from 2015-06-14 on the Confederation's server.

## Risks / Trade-offs

- [A summary is wrong or leans to one side, on a disputed vote] → Written only from the
  booklet, which the Federal Council must write objectively (Federal Act on Political Rights,
  art. 11 para. 2), by the rules of decision 8; Q reviews a sample with the most disputed
  votes in it; the link under each summary lets a reader check it.
- [The Federal Council's booklet is itself contested as one-sided by some] → The summary takes
  its facts (what the proposal changes), never its arguments or recommendation.
- [The booklets of the early years are not on www.admin.ch] → Found in task 1.1; Q chose
  Swissvotes' copies (decision 14). A copy kept by a university project can move or go; the
  update stops then as for admin.ch, and Italian readers of those 9 days read French.
- [admin.ch moves its files again, as its new addresses of 2025 suggest] → The update stops and
  names each address (decision 11); the fix is new addresses in the file of the summaries.
- [A new vote day waits for its summaries] → Decision 7; the step is in the procedure, and the
  booklet comes six weeks ahead.
- [About 375 texts to write and check] → Drafted by vote day in batches, each against its
  booklet; the update checks the form of all, Q the content of a sample.
- [Copyright of the booklets] → The summaries are our own words, and the booklets are linked,
  not copied; whether the explanations are official works free to use (Copyright Act, art. 5)
  is checked in task 1 and recorded, in case a sentence is close to the booklet's.

## Migration Plan

None: the data files gain two fields per vote, written by an update; pages gain the summary.
Rollback is a revert of the change's commits, data files included.

## Open Questions

- Which 15 or more votes Q reviews, and in which languages: chosen in task 1, before drafting.
