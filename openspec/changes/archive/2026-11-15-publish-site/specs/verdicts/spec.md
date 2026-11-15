# Spec Delta

## MODIFIED Requirements

### Requirement: A page for every vote

The build SHALL write a page at `/votes/<id>/` for every vote of the list of votes. The page SHALL
show the vote's German title as its heading, its date, its kind and which majorities that kind
needs: "Braucht das Volksmehr und das Ständemehr." or "Braucht nur das Volksmehr.". A tie-break
question, which the calculation does not judge, shows neither; its page says what the
requirement "The tie-break question" asks for instead.

#### Scenario: The page of a vote

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the page's heading is "Volksinitiative «Für Ehe und Familie - gegen die
  Heiratsstrafe»", and it shows "28. Februar 2016", "Volksinitiative" and "Braucht das Volksmehr
  und das Ständemehr."

#### Scenario: A page for each of the votes

- **GIVEN** the data files of 2026-11-14
- **WHEN** the site is built
- **THEN** it holds 125 pages of votes, one for each id of the list of votes

## ADDED Requirements

### Requirement: A vote's address without the final slash

`/votes/<id>`, without the final slash, SHALL show the same page as `/votes/<id>/`, with all its
scripts and styles, also on a server that does not redirect it to the address with the slash.

#### Scenario: The address without the final slash

- **WHEN** a visitor opens `/votes/5960` and waits until the page has stopped loading
- **THEN** the page's heading is "Volksinitiative «Für Ehe und Familie - gegen die
  Heiratsstrafe»", and no request of the browser failed
