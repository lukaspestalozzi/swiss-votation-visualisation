# Spec Delta

## MODIFIED Requirements

### Requirement: From the list to a vote

Choosing an entry's title SHALL open the page of that vote at `/votes/<id>/`; the page of a vote
SHALL lead back to the start page with the link "Alle Abstimmungen".

#### Scenario: There and back

- **WHEN** a visitor chooses the title of the vote with id 5960 and then "Alle Abstimmungen"
- **THEN** the browser first shows the page `/votes/5960/` with that title as its heading, then
  the start page again
