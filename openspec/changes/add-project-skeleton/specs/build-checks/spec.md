# Spec Delta

## Purpose

The automated checks that every change passes before it is merged: the same checks locally and
in CI, among them the boundaries between the three modules (pipeline, calculation, app).

## ADDED Requirements

### Requirement: The calculation depends on nothing else

The checks SHALL fail when a file of the calculation module imports from the app module or from
the pipeline module, imports the UI framework, or uses the browser's DOM. The failure SHALL name
the file and the import or the name it rejects.

#### Scenario: The calculation imports from the app

- **WHEN** a file of the calculation module imports a file of the app module, by a relative path
  or by the app's package name
- **THEN** the static analysis fails and names the file and the import

#### Scenario: The calculation imports from the pipeline

- **WHEN** a file of the calculation module imports a file of the pipeline module
- **THEN** the static analysis fails and names the file and the import

#### Scenario: The calculation imports the UI framework

- **WHEN** a file of the calculation module imports the UI framework
- **THEN** the static analysis fails and names the file and the import

#### Scenario: The calculation uses the DOM

- **WHEN** a file of the calculation module uses `document`
- **THEN** the static analysis fails and names the file and `document`

### Requirement: The app does not depend on the pipeline

The checks SHALL fail when a file of the app module imports from the pipeline module. The app
module MAY import the calculation module, by its package name.

#### Scenario: The app imports from the pipeline

- **WHEN** a file of the app module imports a file of the pipeline module
- **THEN** the static analysis fails and names the file and the import

#### Scenario: The app imports the calculation

- **WHEN** a file of the app module imports the calculation module by its package name
- **THEN** the static analysis passes

### Requirement: One set of checks, locally and in CI

`./scripts/verify-local.sh` and CI SHALL run the same checks: the OpenSpec validation and, in
this order, the formatting check, the lint, the static analysis, the unit tests, the build and
the browser test against the built site. In CI the OpenSpec validation is a job of its own,
independent of the job that runs the other six. The local script SHALL run every check even
after one has failed, name each failed check, and exit with a status other than zero when at
least one failed.

#### Scenario: All checks pass

- **WHEN** `./scripts/verify-local.sh` runs on a tree in which every check passes
- **THEN** it reports 7 of 7 steps as passed and exits with status 0

#### Scenario: One check fails

- **WHEN** `./scripts/verify-local.sh` runs on a tree in which a unit test fails
- **THEN** it still runs the build and the browser test, names the unit tests as the failed
  step, and exits with a status other than zero

#### Scenario: The quick check

- **WHEN** `./scripts/verify-local.sh --quick` runs
- **THEN** it runs the unit tests only, and exits with status 0 exactly when they pass

### Requirement: The lint allows no issue

The lint SHALL fail on every issue it reports, warnings included. A rule SHALL be switched off
for a line or a file only together with a written justification at that place.

#### Scenario: A warning fails the lint

- **WHEN** the lint reports one warning and no error
- **THEN** the lint check fails

### Requirement: The local checks use the versions CI uses

`./scripts/verify-local.sh` SHALL refuse to run, with a message that names the installed and the
expected version, when the installed major version of Node or the installed version of the
OpenSpec CLI differs from the one `.github/workflows/ci.yml` uses. Installing the project's
dependencies SHALL fail on an older major version of Node.

#### Scenario: Node is older than the version CI uses

- **WHEN** `./scripts/verify-local.sh` runs with Node 22 while CI uses Node 24
- **THEN** it runs no check, prints both versions and exits with a status other than zero

#### Scenario: The OpenSpec CLI differs from the version CI pins

- **WHEN** `./scripts/verify-local.sh` runs with an OpenSpec CLI whose version is not the one CI
  pins
- **THEN** it runs no check, prints both versions and exits with a status other than zero

### Requirement: CI checks every change to main

CI SHALL run all checks on every pull request that targets `main` and on every push to `main`,
and SHALL report a failure when any check fails.

#### Scenario: A pull request with a failing check

- **WHEN** a pull request that targets `main` contains a change that fails a unit test
- **THEN** the CI run of that pull request fails

#### Scenario: The OpenSpec validation fails in CI

- **WHEN** a pull request that targets `main` fails the OpenSpec validation
- **THEN** the job with the OpenSpec validation fails, and the job with the other six checks
  still runs and reports its own result
