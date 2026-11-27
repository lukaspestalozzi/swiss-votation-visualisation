# Spec Delta

## MODIFIED Requirements

### Requirement: Nothing is published unless every check passed

A push to `main` with a failing check SHALL publish nothing, and the published site SHALL stay as
it was. A pull request SHALL publish nothing, whatever its checks; what its run keeps is "The site
of a pull request".

#### Scenario: A push with a failing check

- **WHEN** a push to `main` fails a unit test
- **THEN** its CI run fails and publishes nothing, and the address still shows the site as the
  last successful run published it

#### Scenario: A pull request

- **WHEN** CI runs on a pull request that targets `main` and every check passes
- **THEN** the run publishes nothing, and the address still shows the site as it was

## ADDED Requirements

### Requirement: The site of a pull request

When every browser test of a CI run of a pull request to `main` passes, the run SHALL keep the
build those tests were run against as an artifact named `site-pr-<number>`, for 14 days: the
folder `swiss-votation-visualisation/` and a file `README.txt` that names the commit and says how
to look at the site with a local web server. A run whose browser tests fail, and a push to
`main`, SHALL keep no such artifact.

#### Scenario: A pull request whose checks pass

- **WHEN** CI runs on pull request 26 to `main` and every browser test passes
- **THEN** the run's artifacts include `site-pr-26`, kept 14 days, holding
  `swiss-votation-visualisation/index.html`, `swiss-votation-visualisation/de/votes/5960/index.html`,
  `swiss-votation-visualisation/data/map.json` and `README.txt`

#### Scenario: Looking at it offline

- **GIVEN** the artifact `site-pr-26`, downloaded and unpacked
- **WHEN** Python's built-in web server runs in the unpacked folder, as `README.txt` says, and a
  browser opens `/swiss-votation-visualisation/de/votes/5960/` on it
- **THEN** the page of the vote of 2016-02-28 shows its map, and a limit added there shows "Mit
  Ihrer Auswahl", without a request that fails

#### Scenario: A failing browser test

- **WHEN** a browser test of a pull request's run fails
- **THEN** the run keeps no artifact `site-pr-<number>`

#### Scenario: A push to main

- **WHEN** a push to `main` is published
- **THEN** its run keeps no artifact `site-pr-<number>`
