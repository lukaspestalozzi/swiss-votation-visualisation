# Spec Delta

## MODIFIED Requirements

### Requirement: The list of votes

The start page SHALL show as its heading the question the site answers, one sentence on what a
visitor can do, and every vote of the list of votes, grouped under a heading per year and, within
a year, under its vote day, written as day and month name. The years SHALL run from the newest to
the oldest, and within a year the vote days from the newest to the oldest; the votes of one day
SHALL keep the order of their ids. When the list of votes cannot be read or holds no vote, the
build SHALL fail.

#### Scenario: The years

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor opens the start page
- **THEN** it shows 14 year headings, from 2026 to 2013, and 125 votes in all

#### Scenario: The newest votes first

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor opens the start page
- **THEN** the first votes under 2026 are those of 27 September 2026, and the last ones under
  2013 are the three of 3 March 2013, with the ids 5670, 5680 and 5690 in this order

#### Scenario: No list of votes

- **GIVEN** a list of votes that holds no vote
- **WHEN** the site is built
- **THEN** the build fails and names the list of votes

#### Scenario: The heading and the sentence

- **WHEN** a visitor opens `/de/`
- **THEN** its heading is "Wie hätte die Schweiz abgestimmt, wenn nur ein Teil der Gemeinden an
  die Urne gegangen wäre?", followed by "Wählen Sie eine Abstimmung und grenzen Sie die Gemeinden
  ein: nach Einwohnerzahl, Alter, Parteistärke und 32 weiteren Merkmalen. Karte und Ergebnis
  rechnen sofort neu. Ein Gedankenexperiment, keine Prognose."
- **AND** the page's title in the browser is still "Popular Vote Explorer"

#### Scenario: The vote days of a year

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor opens `/de/`, `/fr/` and `/it/`
- **THEN** under 2026 stand "27. September" with two votes, "14. Juni" with two and "8. März"
  with six; in French "27 septembre", "14 juin" and "8 mars"; in Italian "27 settembre", "14
  giugno" and "8 marzo"

### Requirement: What an entry of the list shows

Each entry SHALL be a row that leads to the vote's page and shows the vote's title in the page's
language, its kind, a bar of the yes share of its official result, that share, "49.16% Ja", and
the result: "angenommen" or "abgelehnt". The kinds SHALL read: "Obligatorisches Referendum",
"Fakultatives Referendum", "Volksinitiative", "Volksinitiative mit Gegenentwurf", "Gegenentwurf"
and "Stichfrage". A tie-break question SHALL show its share for the initiative instead of a
verdict, and no bar.

#### Scenario: A vote that failed

- **WHEN** a visitor opens the start page
- **THEN** the entry of the vote with id 5960, under "28. Februar" of 2016, shows the title
  "Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»" as a link to `/votes/5960`,
  "Volksinitiative", "49.16% Ja" and "abgelehnt", and a bar whose yes part is 49.16% of its width,
  give or take 1 pixel (`investigations/data-sources.md`, "Reference values")

#### Scenario: The same vote in French and Italian

- **WHEN** a visitor opens `/fr/` and `/it/`
- **THEN** the entry of the vote with id 5960 stands under "28 février" and shows the title
  "Initiative populaire «Pour le couple et la famille - Non à la pénalisation du mariage»" and
  "Initiative populaire" in French, and under "28 febbraio" the title "Iniziativa popolare «Per
  il matrimonio e la famiglia - No agli svantaggi per le coppie sposate»" and "Iniziativa
  popolare" in Italian, each title a link to the vote's page in the same language

#### Scenario: A vote that passed

- **WHEN** a visitor opens the start page
- **THEN** the entry of the vote with id 6790, under "28. September" of 2025, shows "Fakultatives
  Referendum", "50.39% Ja" and "angenommen"

#### Scenario: The tie-break question

- **WHEN** a visitor opens the start page
- **THEN** the entry of the vote with id 6823, under "8. März" of 2026, shows "Stichfrage" and
  "37.36% für die Initiative", neither "angenommen" nor "abgelehnt", and no bar

#### Scenario: The official result where the municipal figures differ

- **WHEN** a visitor opens the start page
- **THEN** the entry of the vote with id 6650 shows "58.25% Ja" and "angenommen", the yes share of
  the validated result (1,884,096 yes and 1,350,325 no votes)

## ADDED Requirements

### Requirement: Finding a vote by its title

The start page SHALL show a field "Titel suchen". While it holds words, the list SHALL show only
the votes whose title, in the page's language, holds each of them, whatever the case; a vote day
or a year with no vote left SHALL NOT be shown. When no vote is left, the page SHALL say "Keine
Abstimmung passt zu dieser Suche." Nothing typed SHALL be stored, sent to a server or written to
the page's address. Without scripts the list SHALL be whole.

#### Scenario: A word

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor on `/de/` types "ahv" into "Titel suchen"
- **THEN** the list shows 7 votes, from 2024 back to 2015, under six years, and no other year

#### Scenario: Two words

- **WHEN** that visitor types "AHV Rente"
- **THEN** the list shows one vote, that with id 6650, under "3. März" of 2024

#### Scenario: In French

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor on `/fr/` types "mariage"
- **THEN** the list shows 2 votes, those with the ids 6470 and 5960

#### Scenario: No vote left

- **WHEN** a visitor on `/de/` types "xyz"
- **THEN** the list shows no year and no vote, and the page says "Keine Abstimmung passt zu
  dieser Suche."

#### Scenario: The field emptied

- **WHEN** that visitor empties the field
- **THEN** the list shows its 14 years and 125 votes again, and the page's address has not changed

#### Scenario: Without scripts

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor whose browser runs no scripts opens `/de/`
- **THEN** the list shows its 14 years and 125 votes, each row a link to its vote's page

### Requirement: The votes by their result

Above the list, three buttons SHALL keep every vote ("Alle"), the votes whose official result is
accepted ("Angenommen") or those whose result is rejected ("Abgelehnt"). One of them is pressed,
"Alle" at first. The tie-break question SHALL show under "Alle" only. A button and the words of
the search SHALL apply together.

#### Scenario: Accepted and rejected

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor on `/de/` presses "Angenommen", then "Abgelehnt", then "Alle"
- **THEN** the list shows 52 votes, then 72, then all 125; the tie-break question with id 6823
  only among the 125

#### Scenario: With a word

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor on `/de/` types "energie" and presses "Angenommen"
- **THEN** of the 6 votes with that word the list shows the 3 accepted, with the ids 6700, 6630
  and 6120

### Requirement: The years of the list

Above the list, a link per year the list shows SHALL lead to that year's heading, written as an
entry of the head that links is (the `site-style` capability). The search field, the three
buttons and these links SHALL stay at the top of the window while the list scrolls, and SHALL
hide no heading a link leads to.

#### Scenario: To a year

- **WHEN** a visitor on `/de/`, in a window 1,280 by 800 pixels, follows "2016"
- **THEN** the heading "2016" lies in the window, below the search field, and the field, the
  buttons and the years are still at the top of the window

### Requirement: The budget of the list

Each frame the browser draws after a key in the search field or a press of one of the three
buttons SHALL take at most 50 ms of work on the page's main thread. The browser tests measure it
as they measure the limits' jumps, and once more when a frame exceeds it.

#### Scenario: Typing and filtering

- **WHEN** the browser tests, on `/de/`, type "energie" key by key, press "Angenommen", press
  "Alle" and empty the field
- **THEN** no frame after these inputs took more than 50 ms of work on the main thread, in the
  first measurement or, when a frame exceeded it, in the second
