## MODIFIED Requirements

### Requirement: The marks of an entry

An entry SHALL carry the mark "Hinweis" when the Federal Chancellery gives a note on the vote. An
entry without a note SHALL carry no mark. No entry SHALL say whether its result is validated.

#### Scenario: The annulled vote

- **WHEN** a visitor opens the start page
- **THEN** the entry of the vote with id 5960 carries the mark "Hinweis"

#### Scenario: A result not validated yet

- **GIVEN** the data files of 2026-11-27, in which the Federal Chancellery gives no result for
  the votes of 8 March and 14 June 2026
- **WHEN** a visitor opens the start page
- **THEN** the entries of those 8 votes carry no mark, and no entry of the page shows "vorläufig"

#### Scenario: A vote with neither

- **WHEN** a visitor opens the start page
- **THEN** the entry of the vote with id 5670 carries no mark

### Requirement: The votes by their result

Above the list, four buttons SHALL keep every vote ("Alle"), the votes whose official result is
accepted ("Angenommen"), those whose result is rejected ("Abgelehnt"), or those whose official yes
share, as the list writes it with two decimals, is from 47.00% to 53.00%, both included
("Knappes Ergebnis"), whatever their verdict. One of them is pressed, "Alle" at first. The
tie-break question SHALL show under "Alle" only. A button and the words of the search SHALL apply
together.

#### Scenario: Accepted and rejected

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor on `/de/` presses "Angenommen", then "Abgelehnt", then "Alle"
- **THEN** the list shows 52 votes, then 72, then all 125; the tie-break question with id 6823
  only among the 125

#### Scenario: Close results

- **GIVEN** the data files of 2026-11-27
- **WHEN** a visitor on `/de/` presses "Knappes Ergebnis"
- **THEN** the list shows 17 votes, among them 6360 ("50.73% Ja", "abgelehnt": it missed the
  majority of the cantons), 6150 ("47.31% Ja") and 6870 ("52.46% Ja"), and not 6823, the
  tie-break question, nor 5840 ("46.59% Ja") and 6760 ("53.31% Ja"), the nearest outside
- **AND** the button "Knappes Ergebnis" is pressed and the other three are not

#### Scenario: A close result at the edges

- **GIVEN** a list of votes whose yes shares are written 46.99%, 47.00%, 53.00% and 53.01%
- **WHEN** the list keeps the close results
- **THEN** it keeps the two of 47.00% and 53.00%

#### Scenario: With a word

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor on `/de/` types "energie" and presses "Angenommen"
- **THEN** of the 6 votes with that word the list shows the 3 accepted, with the ids 6700, 6630
  and 6120

#### Scenario: The button in French and Italian

- **WHEN** a visitor opens `/fr/` and `/it/`
- **THEN** the fourth button reads "Résultat serré" and "Esito risicato"

### Requirement: The years of the list

Above the list, a link per year the list shows SHALL lead to that year's heading, written as an
entry of the head that links is (the `site-style` capability). The links SHALL wrap onto further
lines where one line does not hold them, so that every link lies within the window. The search
field, the buttons and these links SHALL stay at the top of the window while the list scrolls,
and SHALL hide no heading a link leads to.

#### Scenario: To a year

- **WHEN** a visitor on `/de/`, in a window 1,280 by 800 pixels, follows "2016"
- **THEN** the heading "2016" lies in the window, below the search field, and the field, the
  buttons and the years are still at the top of the window

#### Scenario: Every year in a phone's window

- **WHEN** a visitor opens `/fr/` on a phone 412 pixels wide
- **THEN** each of the 14 links from "2026" to "2013" lies wholly within the window, and a
  visitor who follows "2013" sees its heading below the part that stays
