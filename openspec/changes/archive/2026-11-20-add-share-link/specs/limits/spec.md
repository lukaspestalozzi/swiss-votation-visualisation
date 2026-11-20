# Spec Delta

## MODIFIED Requirements

### Requirement: Limits belong to the page

Opening a vote's page, also by a link from another vote's page, SHALL start with the selection its
address holds (the `share-link` capability), and with no limit and the switch on when its address
holds none.

#### Scenario: To another vote

- **WHEN** a visitor adds a limit on `/votes/5960/`, follows "Alle Abstimmungen" and opens
  `/votes/5670/`
- **THEN** that page shows no limit and the switch on

#### Scenario: A link with a selection

- **WHEN** a visitor opens `/de/votes/5960/#foreigners=-19.98&abroad=no`
- **THEN** the page shows the limit "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%" and the
  switch off
