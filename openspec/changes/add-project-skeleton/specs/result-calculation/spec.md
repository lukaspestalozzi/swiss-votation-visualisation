# Spec Delta

## Purpose

Calculates the result of a national popular vote under the federal voting rules: the votes, the
cantonal votes, both majorities and the verdict.

## ADDED Requirements

### Requirement: The cantons and their cantonal votes

The calculation SHALL provide the 26 cantons by their official two-letter abbreviations, in the
order of article 1 of the Federal Constitution, each with its number of cantonal votes: exactly
0.5 for Obwalden, Nidwalden, Basel-Stadt, Basel-Landschaft, Appenzell Ausserrhoden and Appenzell
Innerrhoden, and exactly 1 for each other canton (Federal Constitution, art. 142 para. 4). It
SHALL give the total of the cantonal votes of a list of cantons as their exact sum.

#### Scenario: The 26 cantons in the order of the constitution

- **WHEN** the cantons are read
- **THEN** there are exactly 26, in this order: ZH, BE, LU, UR, SZ, OW, NW, GL, ZG, FR, SO, BS,
  BL, SH, AR, AI, SG, GR, AG, TG, TI, VD, VS, NE, GE, JU

#### Scenario: Six cantons have half a vote

- **WHEN** the cantonal votes of OW, NW, BS, BL, AR and AI are read
- **THEN** each is exactly 0.5

#### Scenario: Every other canton has one vote

- **WHEN** the cantonal votes of the 20 cantons other than OW, NW, BS, BL, AR and AI are read
- **THEN** each is exactly 1

#### Scenario: Schaffhausen and Appenzell Ausserrhoden are not swapped

- **WHEN** the cantonal votes of SH and AR are read
- **THEN** SH has exactly 1 and AR has exactly 0.5

#### Scenario: All cantons together have 23 cantonal votes

- **WHEN** the total of the cantonal votes of all 26 cantons is calculated
- **THEN** it is exactly 23 (20 × 1 + 6 × 0.5), with no tolerance
