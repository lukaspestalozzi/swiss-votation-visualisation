# Spec Delta

## ADDED Requirements

### Requirement: The checks of the pipeline

The checks SHALL include, for the code of the pipeline and in this order: its formatting check,
its lint, its static analysis and its unit tests. The lint and the static analysis SHALL allow
no issue. `./scripts/verify-local.sh` SHALL run them after its other checks; CI SHALL run them
as a job of its own, independent of the other jobs.

#### Scenario: A test of the pipeline fails

- **WHEN** `./scripts/verify-local.sh` runs on a tree in which a unit test of the pipeline
  fails and every other check passes
- **THEN** it names the unit tests of the pipeline as the one failed step, reports the other
  ten as passed, and exits with a status other than zero

#### Scenario: A type error in the pipeline

- **WHEN** a file of the pipeline passes text where a whole number is declared
- **THEN** the static analysis of the pipeline fails and names the file and the line

### Requirement: The checks of the pipeline use pinned versions

The checks of the pipeline SHALL run with the version of the language and of every dependency
that the repository pins, locally and in CI alike, and SHALL fail when the pinned versions do
not match the declared dependencies. `./scripts/verify-local.sh` SHALL refuse to run, with a
message that names the tool, when the tool that runs the pipeline and its checks is not
installed.

#### Scenario: The pinned versions are out of date

- **WHEN** a dependency is added to the pipeline's declared dependencies without updating the
  pinned versions
- **THEN** each of the pipeline's four checks fails and says that the pinned versions do not
  match

#### Scenario: The tool that runs the pipeline is missing

- **WHEN** `./scripts/verify-local.sh` runs on a machine without the tool that runs the
  pipeline and its checks
- **THEN** it runs no check, says which tool is missing, and exits with a status other than
  zero

## MODIFIED Requirements

### Requirement: One set of checks, locally and in CI

`./scripts/verify-local.sh` and CI SHALL run the same checks: the OpenSpec validation; in this
order, the formatting check, the lint, the static analysis, the unit tests, the build and the
browser test against the built site; and the pipeline's checks. In CI the OpenSpec validation
is a job of its own, independent of the job with these six. The local script SHALL run every
check even after one has failed, name each failed check, and exit with a status other than zero
when at least one failed.

#### Scenario: All checks pass

- **WHEN** `./scripts/verify-local.sh` runs on a tree in which every check passes
- **THEN** it reports 11 of 11 steps as passed and exits with status 0

#### Scenario: One check fails

- **WHEN** `./scripts/verify-local.sh` runs on a tree in which a unit test fails
- **THEN** it still runs the build, the browser test and the checks of the pipeline, names the
  unit tests as the failed step, and exits with a status other than zero

#### Scenario: The quick check

- **WHEN** `./scripts/verify-local.sh --quick` runs
- **THEN** it runs the unit tests and the unit tests of the pipeline only, and exits with
  status 0 exactly when both pass

### Requirement: CI checks every change to main

CI SHALL run all checks on every pull request that targets `main` and on every push to `main`,
and SHALL report a failure when any check fails.

#### Scenario: A pull request with a failing check

- **WHEN** a pull request that targets `main` contains a change that fails a unit test
- **THEN** the CI run of that pull request fails

#### Scenario: The OpenSpec validation fails in CI

- **WHEN** a pull request that targets `main` fails the OpenSpec validation
- **THEN** the job with the OpenSpec validation fails, and the job with the other six checks
  and the job with the checks of the pipeline still run and report their own results

#### Scenario: A check of the pipeline fails in CI

- **WHEN** a pull request that targets `main` fails the lint of the pipeline
- **THEN** the job with the checks of the pipeline fails, and the two other jobs still run and
  report their own results
