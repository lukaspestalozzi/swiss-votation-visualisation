# Spec Delta

## Purpose

Where and when the site reaches its visitors: the public address, when CI publishes the site and
from which files, and what the published site answers for an address that names no page.

## ADDED Requirements

### Requirement: The site is published at its address

On every push to `main` whose checks all pass, CI SHALL publish the site at
`https://lukaspestalozzi.github.io/swiss-votation-visualisation/`, in the same CI run as the
checks. The addresses the specs name, such as `/votes/5960/`, are under this address.

#### Scenario: A push to main that passes every check

- **WHEN** a push to `main` passes the OpenSpec validation, the six checks of the packages and
  the four checks of the pipeline
- **THEN** the same CI run publishes the site, and afterwards
  `https://lukaspestalozzi.github.io/swiss-votation-visualisation/` shows the start page with the
  heading "Popular Vote Explorer", and `/votes/5960/` under it the page of the vote of
  2016-02-28 with the heading "Volksinitiative «Für Ehe und Familie - gegen die Heiratsstrafe»"

### Requirement: Nothing is published unless every check passed

A push to `main` with a failing check SHALL publish nothing, and the published site SHALL stay as
it was. A pull request SHALL publish nothing, whatever its checks, and gets no preview.

#### Scenario: A push with a failing check

- **WHEN** a push to `main` fails a unit test
- **THEN** its CI run fails and publishes nothing, and the address still shows the site as the
  last successful run published it

#### Scenario: A pull request

- **WHEN** CI runs on a pull request that targets `main` and every check passes
- **THEN** the run publishes nothing, and the address still shows the site as it was

### Requirement: The published files are the tested files

The files CI publishes SHALL be the files that the browser tests of the same run were run
against. Publishing SHALL NOT build the site a second time.

#### Scenario: One build per run

- **WHEN** a push to `main` is published
- **THEN** its CI run built the site once, and the files it published are the build its browser
  tests were run against

### Requirement: A publishing that fails is reported

When the host refuses or does not complete the publishing, for example because GitHub Pages is
not switched on for the repository, the CI run SHALL fail and name the publishing step, and the
published site SHALL stay as it was.

#### Scenario: GitHub Pages is not switched on

- **GIVEN** GitHub Pages is not switched on for the repository
- **WHEN** a push to `main` passes every check
- **THEN** the publishing step fails, the CI run is reported as failed, and nothing is published

### Requirement: An address that names no page

An address under the site's address that names no page and no file SHALL be answered with the
status 404. The site has no page of its own for it: the server's own answer is shown, on GitHub
Pages its "not found" page.

#### Scenario: A vote that does not exist

- **WHEN** a browser opens `/votes/9999/`, the id of no vote
- **THEN** the answer has the status 404
