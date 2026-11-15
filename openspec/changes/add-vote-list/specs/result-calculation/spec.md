# Spec Delta

## ADDED Requirements

### Requirement: The outcome of each canton

The result SHALL give, for every canton with at least one entry remaining and in the order of
the Federal Constitution, the canton's yes votes, no votes and yes share, its cantonal votes,
and whether they count in favour or against, by the rule of the cantonal votes. A canton with
no entry remaining SHALL NOT appear. The cantonal votes of the cantons in favour SHALL add up
exactly to the cantonal votes in favour of the result, and those of the others to the votes
against.

#### Scenario: A canton of a named vote

- **GIVEN** all entries of the vote of 2016-02-28, number 596
- **WHEN** the result is calculated
- **THEN** the canton of Zürich has 253,697 yes votes, 329,992 no votes, a yes share of 0.434644
  within 0.0000005, and 1 cantonal vote against (`investigations/data-sources.md`, "Reference
  data for the calculation")

#### Scenario: The cantons add up to the cantonal votes

- **GIVEN** all entries of the vote of 2016-02-28, number 596
- **WHEN** the result is calculated
- **THEN** it gives 26 cantons, from ZH to JU; the cantonal votes of those in favour add up to
  exactly 16.5 and those of the others to exactly 6.5 (`investigations/data-sources.md`,
  "Reference values")

#### Scenario: A canton with half a vote

- **GIVEN** one entry of the canton of Obwalden with 60 yes and 40 no votes
- **WHEN** the result is calculated
- **THEN** it gives one canton, OW, with a yes share of exactly 0.6 and 0.5 cantonal votes in
  favour

#### Scenario: A canton with as many yes as no votes

- **GIVEN** one entry of the canton of Uri with 50 yes and 50 no votes
- **WHEN** the result is calculated
- **THEN** the canton UR has 1 cantonal vote against

#### Scenario: A canton without valid votes

- **GIVEN** one entry of the canton of Uri with 0 yes and 0 no votes
- **WHEN** the result is calculated
- **THEN** the canton UR has no yes share and 1 cantonal vote against

#### Scenario: A canton with no entry left

- **GIVEN** the entries of the vote of 2016-02-28, number 596, without those of the canton of
  Zürich
- **WHEN** the result is calculated
- **THEN** it gives 25 cantons, and none of them is ZH
