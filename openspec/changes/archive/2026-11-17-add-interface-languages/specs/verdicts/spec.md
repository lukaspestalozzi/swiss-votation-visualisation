## MODIFIED Requirements

### Requirement: A page for every vote

The build SHALL write a page at `/votes/<id>/` for every vote of the list, in each language of
the `interface-languages` capability. The page SHALL show the vote's title in the page's
language as its heading, its date, its kind and which majorities that kind needs:
"Braucht das Volksmehr und das Ständemehr." or "Braucht nur das Volksmehr.". A tie-break
question, which the calculation does not judge, shows neither; its page says what the
requirement "The tie-break question" asks for instead.

#### Scenario: The page of a vote

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the page's heading is "Volksinitiative «Für Ehe und Familie - gegen die
  Heiratsstrafe»", and it shows "28. Februar 2016", "Volksinitiative" and "Braucht das Volksmehr
  und das Ständemehr."

#### Scenario: The page of a vote in French

- **WHEN** a visitor opens `/fr/votes/5960/`
- **THEN** the page's heading is "Initiative populaire «Pour le couple et la famille - Non à la
  pénalisation du mariage»", and it shows "28 février 2016" and "Initiative populaire"

#### Scenario: A page for each of the votes

- **GIVEN** the data files of 2026-11-14
- **WHEN** the site is built
- **THEN** it holds 125 pages of votes in each language, one for each id of the list of votes

### Requirement: What the sources say about the result

For a validated vote the page SHALL show the reference to the official publication in the page's
language, as "Quelle: " followed by it. For a vote that is not validated it SHALL show
"Vorläufiges Ergebnis: vom Bundesrat noch nicht erwahrt." When the Federal Chancellery gives a
note on the vote, the page SHALL show it in full, in the page's language, under the heading
"Hinweis der Bundeskanzlei".

#### Scenario: A validated vote

- **WHEN** a visitor opens `/votes/5670`
- **THEN** it shows "Quelle: BBl 2013 3129", no note and no mark of a provisional result

#### Scenario: A validated vote in French and Italian

- **WHEN** a visitor opens `/fr/votes/5670` and `/it/votes/5670`
- **THEN** they show the references "FF 2013 2759" and "FF 2013 2619"

#### Scenario: The annulled vote

- **WHEN** a visitor opens `/votes/5960`
- **THEN** it shows "Quelle: BBl 2019 4599" and, under "Hinweis der Bundeskanzlei", the note that
  begins "Das Bundesgericht hat mit Urteilen vom 10. April 2019"

#### Scenario: A result not validated yet

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor opens `/votes/6850`
- **THEN** it shows "Vorläufiges Ergebnis: vom Bundesrat noch nicht erwahrt." and no "Quelle: "
