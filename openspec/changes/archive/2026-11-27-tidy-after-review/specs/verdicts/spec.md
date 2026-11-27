## MODIFIED Requirements

### Requirement: What the sources say about the result

For a validated vote the page SHALL show the reference to the official publication in the page's
language, as "Quelle: " followed by it. For a vote that is not validated it SHALL show no
reference and no other text in its place. When the Federal Chancellery gives a note on the vote,
the page SHALL show it in full, in the page's language, under the heading "Hinweis der
Bundeskanzlei".

#### Scenario: A validated vote

- **WHEN** a visitor opens `/votes/5670`
- **THEN** it shows "Quelle: BBl 2013 3129" and no note

#### Scenario: A validated vote in French and Italian

- **WHEN** a visitor opens `/fr/votes/5670` and `/it/votes/5670`
- **THEN** they show the references "FF 2013 2759" and "FF 2013 2619"

#### Scenario: The annulled vote

- **WHEN** a visitor opens `/votes/5960`
- **THEN** it shows "Quelle: BBl 2019 4599" and, under "Hinweis der Bundeskanzlei", the note that
  begins "Das Bundesgericht hat mit Urteilen vom 10. April 2019"

#### Scenario: A result not validated yet

- **GIVEN** the data files of 2026-11-27, in which the Federal Chancellery gives no result for
  the vote 6850
- **WHEN** a visitor opens `/votes/6850`
- **THEN** it shows no "Quelle: ", no "Vorläufiges Ergebnis" and no "erwahrt"
