## MODIFIED Requirements

### Requirement: What an entry of the list shows

Each entry SHALL show the date of the vote, its title in the page's language as a link to the
vote's page, its kind and its official result: "angenommen" or "abgelehnt", followed by the yes
share of that result. The kinds SHALL read: "Obligatorisches Referendum", "Fakultatives
Referendum", "Volksinitiative", "Volksinitiative mit Gegenentwurf", "Gegenentwurf" and
"Stichfrage". A tie-break question SHALL show its share for the initiative instead of a verdict.

#### Scenario: A vote that failed

- **WHEN** a visitor opens the start page
- **THEN** the entry of the vote with id 5960 shows "28. Februar 2016", the title "Volksinitiative
  «Für Ehe und Familie - gegen die Heiratsstrafe»" as a link to `/votes/5960`, "Volksinitiative"
  and "abgelehnt, 49.16% Ja" (`investigations/data-sources.md`, "Reference values")

#### Scenario: The same vote in French and Italian

- **WHEN** a visitor opens `/fr/` and `/it/`
- **THEN** the entry of the vote with id 5960 shows "28 février 2016", the title "Initiative
  populaire «Pour le couple et la famille - Non à la pénalisation du mariage»" and "Initiative
  populaire" in French, and "28 febbraio 2016", the title "Iniziativa popolare «Per il
  matrimonio e la famiglia - No agli svantaggi per le coppie sposate»" and "Iniziativa popolare"
  in Italian, each title a link to the vote's page in the same language

#### Scenario: A vote that passed

- **WHEN** a visitor opens the start page
- **THEN** the entry of the vote with id 6790 shows "28. September 2025", "Fakultatives
  Referendum" and "angenommen, 50.39% Ja"

#### Scenario: The tie-break question

- **WHEN** a visitor opens the start page
- **THEN** the entry of the vote with id 6823 shows "8. März 2026", "Stichfrage" and "37.36% für
  die Initiative", and neither "angenommen" nor "abgelehnt"

#### Scenario: The official result where the municipal figures differ

- **WHEN** a visitor opens the start page
- **THEN** the entry of the vote with id 6650 shows "angenommen, 58.25% Ja", the yes share of the
  validated result (1,884,096 yes and 1,350,325 no votes)

### Requirement: How dates and numbers are written

Dates SHALL be written as day, month name and year in the page's language: "8. März 2026", "8
mars 2026", "8 marzo 2026"; the first day of a month as "1. März", "1er mars", "1° marzo". Counts
SHALL group their digits by three with an apostrophe ("1'609'152"). Shares SHALL be written as
percent with two decimals after a point, rounded half away from zero ("49.16%"). A half cantonal
vote SHALL be written "½" ("16½"). Numbers SHALL read the same in every language and browser.

#### Scenario: A count and a share

- **WHEN** the yes votes and the yes share of the vote with id 5960 are written
- **THEN** they read "1'609'152" and "49.16%" in German, French and Italian

#### Scenario: Cantonal votes with a half

- **WHEN** the cantonal votes 16.5 and 6.5 are written
- **THEN** they read "16½" and "6½"

#### Scenario: Rounding

- **WHEN** the shares 0.434644 and 0.37364 are written
- **THEN** they read "43.46%" and "37.36%"

#### Scenario: A date in each language

- **WHEN** the dates 2016-02-28 and 2026-03-08 are written
- **THEN** they read "28. Februar 2016" and "8. März 2026" in German, "28 février 2016" and "8 mars
  2026" in French, "28 febbraio 2016" and "8 marzo 2026" in Italian

#### Scenario: The first day of a month

- **WHEN** the date 2008-06-01 is written
- **THEN** it reads "1. Juni 2008" in German, "1er juin 2008" in French and "1° giugno 2008" in
  Italian, as the Constitution's footnotes write the first day (`investigations/languages.md`, 6)
