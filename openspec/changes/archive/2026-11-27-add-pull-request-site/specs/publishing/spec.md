# Spec Delta

## MODIFIED Requirements

### Requirement: Nothing is published unless every check passed

A push to `main` with a failing check SHALL publish nothing, and the published site SHALL stay as
it was. A pull request SHALL publish nothing, whatever its checks.

#### Scenario: A push with a failing check

- **WHEN** a push to `main` fails a unit test
- **THEN** its CI run fails and publishes nothing, and the address still shows the site as the
  last successful run published it

#### Scenario: A pull request

- **WHEN** CI runs on a pull request that targets `main` and every check passes
- **THEN** the run publishes nothing, and the address still shows the site as it was

