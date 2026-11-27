## MODIFIED Requirements

### Requirement: The comparison page

The build SHALL write a comparison page in each language, at `/de/compare/`, `/fr/compare/` and
`/it/compare/`, with the head of every page (the `site-style` capability) and the heading "Zwei
Abstimmungen vergleichen", "Comparer deux votations" or "Confrontare due votazioni". The two lists
of votes SHALL each take the width of the page's column, each below its label, the second below
the first with at least 1rem between them. Until a first vote is chosen, the page SHALL show the
two lists, the second disabled, and below them the sentence "Wählen Sie zwei Abstimmungen. Die
Gemeinden, die Sie danach auswählen, zählen in beiden.", and no limit and no result.

#### Scenario: A page in each language

- **WHEN** the site is built
- **THEN** it holds `/de/compare/`, `/fr/compare/` and `/it/compare/`, whose languages are "de",
  "fr" and "it" and whose headings are "Zwei Abstimmungen vergleichen", "Comparer deux votations"
  and "Confrontare due votazioni"

#### Scenario: The head of the comparison

- **WHEN** a visitor opens `/de/compare/`
- **THEN** its head names "Popular Vote Explorer", linked to `/de/`, "Vergleichen", which is not
  a link, "Lesehilfe", linked to `/de/guide/`, and "Deutsch", "Français" and "Italiano", the last
  two linked to `/fr/compare/` and `/it/compare/`
- **AND** the page shows the lists "Erste Abstimmung" and "Zweite Abstimmung", no limit and no
  result

#### Scenario: Before a vote is chosen

- **WHEN** a visitor opens `/de/compare/` in a window 1,280 pixels wide
- **THEN** both lists are as wide as the page's column, "Zweite Abstimmung" stands below the first
  list and its list below its label, and that list is disabled
- **AND** below the lists stands "Wählen Sie zwei Abstimmungen. Die Gemeinden, die Sie danach
  auswählen, zählen in beiden."

#### Scenario: The sentence in French and Italian

- **WHEN** a visitor opens `/fr/compare/` and `/it/compare/`
- **THEN** below the lists stands "Choisissez deux votations. Les communes que vous choisirez
  ensuite comptent dans les deux." and "Scelga due votazioni. I Comuni che sceglierà in seguito
  contano in entrambe."

#### Scenario: Once a first vote is chosen

- **WHEN** a visitor on `/de/compare/` chooses 5960 as the first vote
- **THEN** the sentence is gone, and "Zweite Abstimmung" can be chosen
