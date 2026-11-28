## MODIFIED Requirements

### Requirement: The list of votes

The start page SHALL show as its heading the question the site answers, two sentences on what a
visitor can do and, on a line of its own below them, "Ein Gedankenexperiment.", and every vote of the list of votes, grouped under a heading per year and, within
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
  werden sofort neu berechnet.", and on a line of its own "Ein Gedankenexperiment."
- **AND** in French and Italian that line reads "Une expérience de pensée." and "Un esperimento
  mentale."
- **AND** the page's title in the browser is still "Popular Vote Explorer"

#### Scenario: The vote days of a year

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor opens `/de/`, `/fr/` and `/it/`
- **THEN** under 2026 stand "27. September" with two votes, "14. Juni" with two and "8. März"
  with six; in French "27 septembre", "14 juin" and "8 mars"; in Italian "27 settembre", "14
  giugno" and "8 marzo"
