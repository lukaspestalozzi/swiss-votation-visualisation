# Spec Delta

## Purpose

One selection of municipalities applied to two votes, on a page of its own: the same
municipalities, kept by the figures that apply to the first vote, count in both, and each vote's
real result stands beside its result with the selection.

The votes' entries are the files of entries of the `vote-data` capability, which the pipeline's
update command (`pipeline/README.md`) writes to `app/static/data/votes/` from the Federal
Statistical Office's vote-day files and the Federal Chancellery's validated results, on the list
of municipalities of 2026-01-01; the limits are those of the `limits` capability, on the
characteristics of the `characteristics` capability. The figures in the scenarios are those of
`investigations/vote-comparison.md` and `investigations/limits.md`.

## ADDED Requirements

### Requirement: The comparison page

The build SHALL write a comparison page in each language, at `/de/compare/`, `/fr/compare/` and
`/it/compare/`, with the head of every page (the `site-style` capability) and the heading "Zwei
Abstimmungen vergleichen", "Comparer deux votations" or "Confrontare due votazioni". Until a first
vote is chosen, it SHALL show the two lists of votes and no limit and no result.

#### Scenario: A page in each language

- **WHEN** the site is built
- **THEN** it holds `/de/compare/`, `/fr/compare/` and `/it/compare/`, whose languages are "de",
  "fr" and "it" and whose headings are "Zwei Abstimmungen vergleichen", "Comparer deux votations"
  and "Confrontare due votazioni"

#### Scenario: The head of the comparison

- **WHEN** a visitor opens `/de/compare/`
- **THEN** its head names "Popular Vote Explorer", linked to `/de/`, "Lesehilfe", linked to
  `/de/guide/`, and "Deutsch", "Français" and "Italiano", the last two linked to `/fr/compare/`
  and `/it/compare/`
- **AND** the page shows the lists "Erste Abstimmung" and "Zweite Abstimmung", no limit and no
  table

### Requirement: Choosing the votes

The list "Erste Abstimmung" SHALL offer every vote the calculation judges, newest first, each as
its date and title; "Zweite Abstimmung" the same votes but the first, those of the first vote's day
first, then the others newest first. The tie-break question SHALL NOT be offered. For each vote
chosen the page SHALL show its table; choosing another first vote keeps the selection, read anew on
that vote's tracks.

#### Scenario: The lists of a vote of 2016-02-28

- **WHEN** a visitor opens `/de/compare/#votes=5960`
- **THEN** "Erste Abstimmung" offers 124 votes, with "28. Februar 2016 · Volksinitiative «Für Ehe
  und Familie - gegen die Heiratsstrafe»" chosen, and "Zweite Abstimmung" 123 votes, none chosen,
  the first three those of 2016-02-28, 5970, 5980 and 5990
- **AND** neither list offers the tie-break question of 2026-03-08, `votes/6823/`

#### Scenario: Another first vote

- **WHEN** a visitor on `/de/compare/#votes=5960,5970&foreigners=-19.98` chooses 6310, of
  2020-09-27, as the first vote
- **THEN** the limit reads "Ausländeranteil (Ende 2019): von 0.00% bis 19.99%", the step of that
  vote's track nearest 19.98%, and 5970 stays the second vote (`investigations/vote-comparison.md`,
  1)

### Requirement: The same municipalities in both votes

The limits SHALL keep municipalities by the figures that apply to the first vote, with its tracks
and the dates in their labels, and exactly those SHALL count in both votes: an entry remains when
its municipality remains, the Swiss abroad of a canton when the switch counts them and an entry of
it remains. Above the limits the page SHALL say "Die Gemeinden werden nach den Zahlen der ersten
Abstimmung ausgewählt; in beiden Abstimmungen zählen dieselben Gemeinden."

#### Scenario: Two votes of one day

- **WHEN** a visitor opens `/de/compare/#votes=5960,5970&foreigners=-19.98`
- **THEN** the limit reads "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%"
- **AND** the table of 5960 shows "Mit Ihrer Auswahl" with 733'402 yes votes, 664'373 no votes and
  52.47%, the Volksmehr "Ja", the Ständemehr "Ja" with 18 : 4½, "Angenommen", and "In der
  Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis."
- **AND** the table of 5970 shows "Mit Ihrer Auswahl" with 654'548 yes votes, 769'763 no votes and
  45.96%, the Volksmehr "Nein", the Ständemehr "Nein" with 8½ : 14, "Abgelehnt", and "In der
  Auswahl: 1'455 von 2'103 Gemeinden mit eigenem Ergebnis." (`investigations/vote-comparison.md`,
  2)

#### Scenario: Two votes years apart

- **WHEN** a visitor opens `/de/compare/#votes=5960,6310&foreigners=-19.98`
- **THEN** the limit reads "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%", the figures of the
  first vote
- **AND** the table of 6310 shows "Mit Ihrer Auswahl" with 603'173 yes votes, 796'237 no votes and
  43.10%, the Ständemehr "Nein" with 4½ : 18, "Abgelehnt", and "In der Auswahl: 1'456 von 2'104
  Gemeinden mit eigenem Ergebnis.", the 1,462 municipalities of the list the population of the
  end of 2015 keeps (`investigations/vote-comparison.md`, 2)

### Requirement: The table of a vote

Each chosen vote's table SHALL be headed by its title, date and kind, with the rows "Ja-Stimmen",
"Nein-Stimmen", "Ja-Anteil", "Volksmehr" and "Ständemehr", each with its word and figure, and
"Vorlage" with the outcome, each word in its side's colour; the columns "Echtes Ergebnis", as the
vote's page shows it, and, while a selection applies, "Mit Ihrer Auswahl". Below it SHALL stand its
count while a selection applies, and the notes its vote's page has.

#### Scenario: The real results

- **WHEN** a visitor opens `/de/compare/#votes=5960,5970`
- **THEN** each table has the one column "Echtes Ergebnis"
- **AND** that of 5960 shows 1'609'152, 1'664'224, 49.16%, the Volksmehr "Nein", the Ständemehr
  "Ja" with 16½ : 6½, and "Abgelehnt"
- **AND** that of 5970 shows 1'375'098, 1'966'965, 41.15%, the Volksmehr "Nein", the Ständemehr
  "Nein" with 4½ : 18½, and "Abgelehnt" (`investigations/vote-comparison.md`, 2)

#### Scenario: A known difference

- **WHEN** a visitor opens `/de/compare/#votes=6650,6660`
- **THEN** below the table of 6650 stands "Das erwahrte Ergebnis zählt 1'350'325 Nein-Stimmen (BBl
  2024 996); die Zahlen der Gemeinden, aus denen hier gerechnet wird, ergeben 200 mehr.", as on its
  vote's page

#### Scenario: The colours of the tables

- **WHEN** a visitor opens `/de/compare/#votes=5960,5970&foreigners=-19.98` with a light and with a
  dark colour scheme
- **THEN** "Ja" and "Angenommen" are in the colour of yes, "Nein" and "Abgelehnt" in that of no, and
  every text has at least 4.5:1 against the colour behind it (the `site-style` capability)

### Requirement: The comparison in the address

While a vote is chosen, the address SHALL end in `#votes=` and the chosen ids, first then second,
joined by a comma, then `&` and the selection as the `share-link` capability writes it; it SHALL be
written and read by that capability's rules. The parts it cannot use SHALL be named as there, among
them a `votes` part with an id that is no vote's, the tie-break question's or the first's again;
the votes before such an id SHALL apply.

#### Scenario: A link to a comparison

- **WHEN** a visitor opens `/de/compare/#votes=5960,6310&foreigners=-19.98`
- **THEN** "Erste Abstimmung" shows 5960, "Zweite Abstimmung" 6310, and the limit "Ausländeranteil
  (Ende 2015): von 0.00% bis 19.98%"

#### Scenario: The address follows the choice

- **WHEN** a visitor on `/de/compare/#votes=5960` chooses 5970 as the second vote and waits a second
- **THEN** the address is `/de/compare/#votes=5960,5970`

#### Scenario: A vote the comparison cannot use

- **WHEN** a visitor opens `/de/compare/#votes=5960,6823&foreigners=-19.98`
- **THEN** "Erste Abstimmung" shows 5960, no second vote is chosen, the limit "Ausländeranteil" is
  applied, and the page says "Diese Angaben der Adresse liessen sich nicht anwenden:
  «votes=5960,6823»."

### Requirement: Loading the votes

The page SHALL load each chosen vote's file of entries once per visit, and the characteristics. While
a vote's file loads, its table SHALL say "Die Ergebnisse werden geladen."; when it cannot be
loaded, "Die Ergebnisse dieser Abstimmung lassen sich nicht laden.", and the other vote's table
SHALL show as usual. When the characteristics cannot be loaded, the tables SHALL show their real
results.

#### Scenario: A file that cannot be loaded

- **GIVEN** a browser in which every request for `data/votes/5970.json` fails
- **WHEN** a visitor opens `/de/compare/#votes=5960,5970`
- **THEN** the table of 5960 shows its real result, and that of 5970 says "Die Ergebnisse dieser
  Abstimmung lassen sich nicht laden."

#### Scenario: Each file once

- **WHEN** a visitor on `/de/compare/#votes=5960` chooses 5970, then 5980, then 5970 again as the
  second vote
- **THEN** the browser requested `data/votes/5960.json`, `data/votes/5970.json` and
  `data/votes/5980.json` once each, and nothing from another origin

### Requirement: From a vote's page

The page of a vote the calculation judges SHALL link "Mit einer anderen Abstimmung vergleichen",
below its limits, to the comparison in its language with that vote first and the page's selection,
no second vote chosen. The page of the tie-break question SHALL NOT.

#### Scenario: From a vote with a selection

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Ausländeranteil", moves its upper bound to
  step 327 and follows "Mit einer anderen Abstimmung vergleichen"
- **THEN** the browser shows `/de/compare/#votes=5960&foreigners=-19.98`, with the limit
  "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%", the table of 5960 with "Mit Ihrer
  Auswahl", and no second vote chosen

#### Scenario: No comparison of the tie-break question

- **WHEN** a visitor opens `/de/votes/6823/`
- **THEN** the page has no link "Mit einer anderen Abstimmung vergleichen"

### Requirement: The comparison on a phone

Below 640 pixels the second table SHALL stand below the first, and the page SHALL be no wider than a
window 360 pixels wide; from 640 pixels the tables SHALL stand side by side. On a touch screen the
two lists SHALL be at least 44 × 44 pixels. Below 640 pixels, while a selection applies and a table
is not wholly in the window, a bar at the bottom SHALL name each vote's outcome with the selection.

#### Scenario: Two tables in a narrow window

- **WHEN** a visitor opens `/de/compare/#votes=5960,5970&foreigners=-19.98`, `/fr/compare/` and
  `/it/compare/` with the same address, in a window 360 pixels wide
- **THEN** no page is wider than the window, and the table of 5970 stands below that of 5960

#### Scenario: The bar

- **WHEN** a visitor on a phone 360 pixels wide opens `/de/compare/#votes=5960,5970&foreigners=-19.98`
  and scrolls to the limits
- **THEN** a bar at the bottom of the window reads "Erste Abstimmung: Angenommen" and "Zweite
  Abstimmung: Abgelehnt", each outcome in the colour of its side

### Requirement: The budget of the comparison

With two votes chosen, each frame while a bound is dragged SHALL take at most 16 ms of work on the
page's main thread, and each frame after a jump at most 50 ms, as the `limits` capability's budget
says for a vote's page. The browser tests measure them as they do there, and once more when a frame
exceeds its budget.

#### Scenario: Dragging a bound with two votes

- **WHEN** the browser tests open `/de/compare/#votes=5960,5970&foreigners=-`, wait until both
  tables show, and drag the upper bound of "Ausländeranteil"
- **THEN** no frame of the drag took more than 16 ms of work on the main thread, in the first
  measurement or, when a frame exceeded it, in the second

#### Scenario: Jumps with two votes

- **WHEN** the browser tests, on the same page, add a limit, switch the Swiss abroad off and on,
  choose 5980 as the second vote, wait until its table shows, choose 5970 again, whose file has
  loaded, and return to the real result
- **THEN** no frame after these took more than 50 ms of work on the main thread, in the first
  measurement or, when a frame exceeded it, in the second
