# Spec Delta

## MODIFIED Requirements

### Requirement: The details of a municipality without a result

For a municipality without a result, the details SHALL show its name as above and "Kein
eigenes Ergebnis: Seine Stimmen sind mit denen einer anderen Gemeinde gezählt." instead of the
figures.

#### Scenario: Meienried in 2016

- **WHEN** a visitor opens `/votes/5960/` and points at Meienried
- **THEN** the map shows "Meienried (BE)" and "Kein eigenes Ergebnis: Seine Stimmen sind mit
  denen einer anderen Gemeinde gezählt."
