# Spec Delta

## MODIFIED Requirements

### Requirement: The site is published at its address

On every push to `main` whose checks all pass, CI SHALL publish the site at
`https://lukaspestalozzi.github.io/swiss-votation-visualisation/`, in the same CI run as the
checks. The addresses the specs name, such as `/votes/5960/`, are under this address.

#### Scenario: A push to main that passes every check

- **WHEN** a push to `main` passes the OpenSpec validation, the six checks of the packages and
  the four checks of the pipeline
- **THEN** the same CI run publishes the site, and afterwards
  `https://lukaspestalozzi.github.io/swiss-votation-visualisation/` shows the start page with the
  heading "Wie hätte die Schweiz abgestimmt, wenn nur ein Teil der Gemeinden an die Urne gegangen
  wäre?", and `/votes/5960/` under it the page of the vote of 2016-02-28 with the heading
  "Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»"
