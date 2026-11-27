# Vote summaries

Found while applying `add-vote-summaries` (#18 of `docs/roadmap.md`), on 2026-11-27.

It answers what the change needs before any summary is written:
- where the Federal Council's explanations (the voting booklet) of each of the 44 vote days of
  `votes.json` are published, in German, French and Italian, and in which language each
  document really is;
- what the Chancellery calls the document in French and Italian, and what the law says of it;
- which votes Q reviews, and three sample summaries written by the rules of the change.

It decides nothing: the design of `add-vote-summaries` records the decisions (3, 11 and 14 use
what this file found).

## How to reproduce

```sh
python3 -I investigations/vote-summaries/find_explanations.py /tmp/booklets
```

The script is in `investigations/vote-summaries/`. It uses the standard library and
`pdftotext` (poppler), reads `app/static/data/votes.json`, and downloads the 132 documents into
the directory it is given, outside the repository (113 MB). It asks www.admin.ch and
swissvotes.ch over the network. Its output of 2026-11-27 is
`investigations/vote-summaries/find_explanations.out`: a line per vote day and language, then
the "days" object of `pipeline/vote-summaries.json`.

## 1. Where the explanations are

- **From 2015-06-14 (35 vote days):** www.admin.ch has a page per vote day in each language,
  which links one PDF under an opaque path, `https://www.admin.ch/dam/<lang>/sd-web/<id>/<name>.pdf`.
  The page is reached by the address of before,
  `https://www.admin.ch/gov/<lang>/start/dokumentation/abstimmungen/<yyyymmdd>.html`, which
  redirects to it, or, for 2026-09-27, only by its new slug
  (`/de/volksabstimmung-vom-27-september-2026`, `/fr/votation-populaire-du-27-septembre-2026`,
  `/it/votazione-popolare-del-27-settembre-2026`). The redirect of 2024-03-03 in German lands on
  a page whose slug says 2018 (`/de/volksabstimmung-vom-03-maerz-2018`) but which shows 2024.
- **2016-02-28, French:** every French page of that day (the day's and the four votes') links
  `…/dam/fr/sd-web/kOH6nJzClyOD/Erlaeuterungen_DE_bf.pdf`, which is the German booklet. admin.ch
  has no French one; Swissvotes has a French copy (`https://swissvotes.ch/vote/596.00/brochure-fr.pdf`,
  "Explications du Conseil fédéral"). Q chose the German admin.ch booklet for the French pages
  (design, decision 14).
- **Before 2015-06-14 (9 vote days, 2013-03-03 to 2015-03-08, 25 votes):** both forms of address
  answer 404 in the three languages, and the Chancellery's own vote-day pages
  (`https://www.bk.admin.ch/de/volksabstimmung?date=<yyyy-mm-dd>`) link no booklet. Swissvotes
  keeps copies in German and French, `https://swissvotes.ch/vote/<number>.00/brochure-<de|fr>.pdf`,
  one per vote: each is the whole booklet of its day (those of 567, 568 and 569 have the same 40
  pages, in files that differ byte for byte), so the script takes the copy of the day's lowest
  number. There is no Italian one (`brochure-it.pdf` answers 404). Q chose these, the Italian pages taking the French copy.
- **How the servers answer:** admin.ch answers a `HEAD` with 200. It answered 6 of the 132
  requests of a first, unpaced run with 403 and each of them with 200 when asked again a few
  seconds later; with a pause of one second between requests and a 403 tried again, the second
  run had none. swissvotes.ch answers a `HEAD` with 405 and a `GET` with a redirect to
  `https://swissvotes.ch/attachments/<hash>`, 200, `application/pdf`.
- **The language of each document** was read from the text of its first six pages, by counting
  ten common words of each language: every document is in the language its page names, except
  the French one of 2016-02-28 (German) and the Italian ones before 2015-06-14 (the French copy).

RESULTS

## 2. The document's names, and the law

- **Names.** The documents' own first pages and file names: "Erläuterungen des Bundesrates",
  "Explications du Conseil fédéral" and "Spiegazioni del Consiglio federale" (for example the
  files of 2017-05-21 and 2026-09-27, and the French copy of 2016-02-28). These are the link
  texts of the spec.
- **Federal Act on Political Rights, art. 11 para. 2** (SR 161.1, version of 2022-10-23, read
  from fedlex's file
  `…/eli/cc/1978/688_688_688/20221023/de/html/fedlex-data-admin-ch-eli-cc-1978-688_688_688-20221023-de-html-11.html`):
  "Der Abstimmungsvorlage wird eine kurze, sachliche Erläuterung des Bundesrates beigegeben,
  die auch den Auffassungen wesentlicher Minderheiten Rechnung trägt."
- **Copyright Act, art. 5 para. 1** (SR 231.1, version of 2025-07-01, fedlex's file
  `…/eli/cc/1993/1798_1798_1798/20250701/de/html/fedlex-data-admin-ch-eli-cc-1993-1798_1798_1798-20250701-de-html-7.html`):
  "Durch das Urheberrecht nicht geschützt sind: a. Gesetze, Verordnungen, völkerrechtliche
  Verträge und andere amtliche Erlasse; b. Zahlungsmittel; c. Entscheidungen, Protokolle und
  Berichte von Behörden und öffentlichen Verwaltungen; d. Patentschriften und veröffentlichte
  Patentgesuche." The explanations are not named; that they are "Berichte von Behörden" is an
  inference, not a ruling found.
- **admin.ch's terms** (`https://www.admin.ch/gov/de/start/rechtliches.html`, section
  "Copyright"): the rights in the content belong to the federal authorities, and reproducing it
  needs their written consent beforehand.
- **What follows for the change:** the summaries are written in the site's own words and the
  booklets are linked, not copied, so neither the uncertain reading of art. 5 nor the terms
  stand in the way. A summary does not take over a sentence of the booklet word for word.

## 3. The sample, and three summaries

Every booklet opens with a page "Darüber wird abgestimmt" ("Su che cosa si vota?") of three to
five sentences per vote, and each vote's part with "In Kürze" ("En bref", "In breve"), whose
paragraph "Die Initiative" / "Die Vorlage" says what changes. The summaries are written from
these, never from "Argumente" or the recommendation.

**The sample Q reviews (19 votes):** 5670 (mandatory referendum, 2013), 5800 (2014, against mass
immigration), 5950 (optional referendum, 2015), 5960 and 5970 (2016), 6150 (2017), 6240 (2018),
6280 (2019), 6360 (2020), 6380 and 6500 (2021), 6600 (2022), 6630 (2023), 6650 (2024, 13th AHV
pension), 6790 (2025), 6821, 6822, 6823 and 6860 (2026). Every year from 2013, every kind of
vote, the two vote days on Swissvotes' copies (5670, 5800) and the most disputed votes.

**Three samples**, the German ones after the humanizer pass (one passive turned active), with
their length in characters:

SAMPLES
