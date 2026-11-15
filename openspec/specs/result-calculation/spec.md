# result-calculation Specification

## Purpose

Calculates the result of a national popular vote under the federal voting rules: the votes, the
cantonal votes, both majorities and the verdict.

## Requirements

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

### Requirement: The entries of a vote

An entry SHALL be one line of the results of a vote: a municipality, or the Swiss abroad of a
canton that counts them apart. It has a canton, given by its abbreviation, and its yes votes and
its no votes, each a whole number from zero. The calculation SHALL take the entries that remain,
in any order, and SHALL count each of them exactly once.

#### Scenario: The order of the entries does not matter

- **GIVEN** the entries of the vote of 2016-02-28, number 596, in the order of the reference
  data, and the same entries in the reverse order
- **WHEN** the result is calculated for each
- **THEN** the two results are equal in every figure

#### Scenario: The Swiss abroad of a canton count for that canton

- **GIVEN** of the vote of 2016-02-28, number 596, only the 161 entries of the canton of Zürich,
  among them its Swiss abroad with 3,596 yes and 4,939 no votes
- **WHEN** the result is calculated
- **THEN** the yes votes are exactly 253,697 and the no votes exactly 329,992, the official
  figures of the canton (`investigations/data-sources.md`, "Reference data for the
  calculation")

### Requirement: The votes and the yes share

The calculation SHALL give the yes votes and the no votes as the sums over the entries that
remain, the valid votes as yes plus no, and the yes share as the yes votes divided by the valid
votes. With no valid vote there SHALL be no yes share: neither 0% nor 50% nor any other number.

#### Scenario: A named vote with all its entries

- **GIVEN** all 2,115 entries of the vote of 2016-02-28, number 596, "Für Ehe und Familie –
  gegen die Heiratsstrafe"
- **WHEN** the result is calculated
- **THEN** the yes votes are exactly 1,609,152, the no votes exactly 1,664,224, the valid votes
  exactly 3,273,376, and the yes share is 49.1588% within 0.00005 percentage points
  (`investigations/data-sources.md`, "Reference values", BBl 2019 4599)

#### Scenario: The same vote without one canton

- **GIVEN** the entries of the vote of 2016-02-28, number 596, without those of the canton of
  Zürich
- **WHEN** the result is calculated
- **THEN** the yes votes are exactly 1,355,455, the no votes exactly 1,334,232, the valid votes
  exactly 2,689,687, and the yes share is 50.3945% within 0.00005 percentage points

#### Scenario: Nothing remains

- **WHEN** the result is calculated for no entries
- **THEN** the yes votes, the no votes and the valid votes are exactly 0, and there is no yes
  share

### Requirement: The cantonal votes

For every canton with at least one entry remaining, the calculation SHALL count the canton's
cantonal votes in favour when the canton's yes votes are more than its no votes, and against
otherwise; a canton with as many yes as no votes, zero included, counts against. A canton with
no entry remaining SHALL have no cantonal vote, neither in favour nor against.

#### Scenario: A named vote with all its entries

- **GIVEN** all entries of the vote of 2016-02-28, number 596
- **WHEN** the result is calculated
- **THEN** the cantonal votes are exactly 16.5 in favour and 6.5 against
  (`investigations/data-sources.md`, "Reference values")

#### Scenario: A canton with no entry left has no cantonal vote

- **GIVEN** the entries of the vote of 2016-02-28, number 596, without those of the canton of
  Zürich, which voted against
- **WHEN** the result is calculated
- **THEN** the cantonal votes are exactly 16.5 in favour and 5.5 against, 22 in all

#### Scenario: A canton with as many yes as no votes counts against

- **GIVEN** two entries of the canton of Uri, one with 60 yes and 40 no votes, one with 40 yes
  and 60 no votes
- **WHEN** the result is calculated
- **THEN** the cantonal votes are exactly 0 in favour and 1 against

#### Scenario: A canton whose entries have no vote counts against

- **GIVEN** one entry of the canton of Uri with 0 yes and 0 no votes
- **WHEN** the result is calculated
- **THEN** the cantonal votes are exactly 0 in favour and 1 against

#### Scenario: A canton with half a vote

- **GIVEN** one entry of the canton of Obwalden with 60 yes and 40 no votes
- **WHEN** the result is calculated
- **THEN** the cantonal votes are exactly 0.5 in favour and 0 against

#### Scenario: Nothing remains

- **WHEN** the result is calculated for no entries
- **THEN** the cantonal votes are exactly 0 in favour and 0 against

### Requirement: The majority of voters

The majority of voters SHALL be reached when the yes votes are more than the no votes, that is,
more than half of the valid votes. With as many yes as no votes, zero included, it SHALL NOT be
reached.

#### Scenario: Reached by a few thousand votes

- **GIVEN** all entries of the vote of 2015-06-14, number 595, "Bundesgesetz über Radio und
  Fernsehen", with 1,128,522 yes and 1,124,873 no votes
- **WHEN** the result is calculated
- **THEN** the majority of voters is reached (`investigations/data-sources.md`, "Reference
  values", BBl 2015 6313)

#### Scenario: Missed by a few thousand votes

- **GIVEN** all entries of the vote of 2017-09-24, number 614, "Zusatzfinanzierung der AHV durch
  eine Erhöhung der Mehrwertsteuer", with 1,254,795 yes and 1,257,156 no votes
- **WHEN** the result is calculated
- **THEN** the majority of voters is not reached (`investigations/data-sources.md`, "Reference
  values", BBl 2017 7829)

#### Scenario: As many yes as no votes

- **GIVEN** one entry with 500 yes and 500 no votes
- **WHEN** the result is calculated
- **THEN** the majority of voters is not reached

#### Scenario: Nothing remains

- **WHEN** the result is calculated for no entries
- **THEN** the majority of voters is not reached

### Requirement: The majority of cantons

The majority of cantons SHALL be reached when the cantonal votes in favour are more than the
cantonal votes against. With as many in favour as against, zero included, it SHALL NOT be
reached. Only the cantons with an entry remaining count, so fewer cantonal votes are needed when
cantons have no entry left. The calculation SHALL give the majority of cantons for every vote,
also where the verdict does not need it.

#### Scenario: Reached

- **GIVEN** all entries of the vote of 2016-02-28, number 596, with cantonal votes of 16.5 in
  favour and 6.5 against
- **WHEN** the result is calculated
- **THEN** the majority of cantons is reached (`investigations/data-sources.md`, "Reference
  values")

#### Scenario: Not reached

- **GIVEN** all entries of the vote of 2020-11-29, number 636, "Für verantwortungsvolle
  Unternehmen", with cantonal votes of 8.5 in favour and 14.5 against
- **WHEN** the result is calculated
- **THEN** the majority of cantons is not reached (`investigations/data-sources.md`, "Reference
  values", BBl 2021 891)

#### Scenario: The cantonal votes are split evenly

- **GIVEN** one entry for each of the 26 cantons, with more yes than no votes in ZH, BE, LU, UR,
  SZ, GL, ZG, FR, SO, SH, SG and AR, and more no than yes votes in the other 14
- **WHEN** the result is calculated
- **THEN** the cantonal votes are exactly 11.5 in favour and 11.5 against, and the majority of
  cantons is not reached

#### Scenario: Fewer cantons remain

- **GIVEN** one entry each for ZH and BE with more yes than no votes, and one for LU with more
  no than yes votes
- **WHEN** the result is calculated
- **THEN** the cantonal votes are exactly 2 in favour and 1 against, and the majority of cantons
  is reached

#### Scenario: Nothing remains

- **WHEN** the result is calculated for no entries
- **THEN** the majority of cantons is not reached

### Requirement: The majorities a kind of vote needs

The calculation SHALL know six kinds of vote. A popular initiative, a mandatory referendum, a
popular initiative voted on together with a counter-proposal, and such a counter-proposal SHALL
need the majority of voters and the majority of cantons. An optional referendum SHALL need the
majority of voters only. A tie-break question SHALL NOT be calculated: for it the calculation
SHALL say that it is not calculated, and SHALL give no result (Federal Constitution, art. 139b
and 140 to 142).

#### Scenario: Popular initiative

- **WHEN** the majorities a popular initiative needs are asked for
- **THEN** they are the majority of voters and the majority of cantons

#### Scenario: Mandatory referendum

- **WHEN** the majorities a mandatory referendum needs are asked for
- **THEN** they are the majority of voters and the majority of cantons

#### Scenario: Optional referendum

- **WHEN** the majorities an optional referendum needs are asked for
- **THEN** they are the majority of voters only

#### Scenario: Popular initiative with a counter-proposal

- **WHEN** the majorities a popular initiative voted on together with a counter-proposal needs
  are asked for
- **THEN** they are the majority of voters and the majority of cantons

#### Scenario: Counter-proposal

- **WHEN** the majorities a counter-proposal needs are asked for
- **THEN** they are the majority of voters and the majority of cantons

#### Scenario: Tie-break question

- **WHEN** the majorities a tie-break question needs are asked for
- **THEN** the answer is that it is not calculated, and no result can be calculated with that
  answer

### Requirement: The verdict

A vote SHALL have passed when the majority of voters is reached and, where its kind needs both
majorities, the majority of cantons is reached too. Otherwise it SHALL have failed. When nothing
remains, it SHALL have failed, whatever its kind.

#### Scenario: Both majorities reached

- **GIVEN** all entries of the vote of 2013-03-03, number 568, popular initiative "gegen die
  Abzockerei", with 1,616,184 yes and 761,975 no votes and cantonal votes of 23 in favour and 0
  against
- **WHEN** the result is calculated with both majorities needed
- **THEN** the vote has passed (`investigations/data-sources.md`, "Reference values", BBl 2013
  3129)

#### Scenario: The voters in favour, the cantons against

- **GIVEN** all entries of the vote of 2013-03-03, number 567, mandatory referendum
  "Bundesbeschluss über die Familienpolitik", with 1,283,951 yes and 1,078,531 no votes and
  cantonal votes of 10 in favour and 13 against
- **WHEN** the result is calculated with both majorities needed
- **THEN** the vote has failed (`investigations/data-sources.md`, "Reference values", BBl 2013
  3129)

#### Scenario: The cantons in favour, the voters against

- **GIVEN** all entries of the vote of 2016-02-28, number 596, popular initiative, with
  1,609,152 yes and 1,664,224 no votes and cantonal votes of 16.5 in favour and 6.5 against
- **WHEN** the result is calculated with both majorities needed
- **THEN** the vote has failed (`investigations/data-sources.md`, "Reference values")

#### Scenario: Only the voters count

- **GIVEN** all entries of the vote of 2025-09-28, number 679, optional referendum "Bundesgesetz
  über den elektronischen Identitätsnachweis", with 1,384,586 yes and 1,363,362 no votes and
  cantonal votes of 7.5 in favour and 15.5 against
- **WHEN** the result is calculated with the majority of voters only
- **THEN** the vote has passed, and the majority of cantons is given as not reached
  (`investigations/data-sources.md`, "Reference values", BBl 2026 1165)

#### Scenario: Setting a canton aside changes the verdict

- **GIVEN** the entries of the vote of 2016-02-28, number 596, without those of the canton of
  Zürich: 1,355,455 yes and 1,334,232 no votes, cantonal votes of 16.5 in favour and 5.5 against
- **WHEN** the result is calculated with both majorities needed
- **THEN** the vote has passed

#### Scenario: Nothing remains

- **WHEN** the result is calculated for no entries, once with both majorities needed and once
  with the majority of voters only
- **THEN** the vote has failed both times

### Requirement: An entry that cannot be counted is refused

When an entry names a canton that is not one of the 26, or has yes or no votes that are not a
whole number from zero, the calculation SHALL fail with an error that names the canton the
entry gave, and SHALL give no result. It SHALL NOT skip the entry or count it as zero.

#### Scenario: A canton that does not exist

- **GIVEN** entries of which one has the canton `XX`
- **WHEN** the result is calculated
- **THEN** the calculation fails with an error that names `XX`, and gives no result

#### Scenario: Votes below zero

- **GIVEN** entries of which one, of the canton of Uri, has -1 yes votes
- **WHEN** the result is calculated
- **THEN** the calculation fails with an error that names `UR`, and gives no result

#### Scenario: Votes that are not whole

- **GIVEN** entries of which one, of the canton of Uri, has 1.5 no votes
- **WHEN** the result is calculated
- **THEN** the calculation fails with an error that names `UR`, and gives no result

### Requirement: The reference votes

The calculation SHALL reproduce the official yes votes, no votes, cantonal votes and verdict of
seven named votes from all their entries. The entries are the municipal results of the BFS file
of each vote day
(`https://ogd-static.voteinfo-app.ch/v1/ogd/sd-t-17-02-<yyyymmdd>-eidgAbstimmung.json`), on the
list of municipalities of 2026-01-01, written by
`investigations/data-sources/write_reference_votes.py`. The official figures are in
`investigations/data-sources.md`.

#### Scenario: 2013-03-03, number 567, mandatory referendum

- **WHEN** the result is calculated from all 2,114 entries, with both majorities needed
- **THEN** yes is exactly 1,283,951, no exactly 1,078,531, the cantonal votes exactly 10 in
  favour and 13 against, and the vote has failed (BBl 2013 3129)

#### Scenario: 2013-03-03, number 568, popular initiative

- **WHEN** the result is calculated from all 2,114 entries, with both majorities needed
- **THEN** yes is exactly 1,616,184, no exactly 761,975, the cantonal votes exactly 23 in favour
  and 0 against, and the vote has passed (BBl 2013 3129)

#### Scenario: 2015-06-14, number 595, optional referendum

- **WHEN** the result is calculated from all 2,115 entries, with the majority of voters only
- **THEN** yes is exactly 1,128,522, no exactly 1,124,873, and the vote has passed (BBl 2015
  6313); the cantonal votes are 6.5 in favour and 16.5 against, a figure calculated from the
  entries that no source publishes for this vote

#### Scenario: 2016-02-28, number 596, popular initiative

- **WHEN** the result is calculated from all 2,115 entries, with both majorities needed
- **THEN** yes is exactly 1,609,152, no exactly 1,664,224, the cantonal votes exactly 16.5 in
  favour and 6.5 against, and the vote has failed (BBl 2019 4599)

#### Scenario: 2017-09-24, number 614, mandatory referendum

- **WHEN** the result is calculated from all 2,115 entries, with both majorities needed
- **THEN** yes is exactly 1,254,795, no exactly 1,257,156, the cantonal votes exactly 9.5 in
  favour and 13.5 against, and the vote has failed (BBl 2017 7829)

#### Scenario: 2020-11-29, number 636, popular initiative

- **WHEN** the result is calculated from all 2,116 entries, with both majorities needed
- **THEN** yes is exactly 1,299,129, no exactly 1,261,680, the cantonal votes exactly 8.5 in
  favour and 14.5 against, and the vote has failed (BBl 2021 891)

#### Scenario: 2025-09-28, number 679, optional referendum

- **WHEN** the result is calculated from all 2,117 entries, with the majority of voters only
- **THEN** yes is exactly 1,384,586, no exactly 1,363,362, the cantonal votes exactly 7.5 in
  favour and 15.5 against, and the vote has passed (BBl 2026 1165; the cantonal votes are those
  of the BFS file, the Federal Chancellery gives none for an optional referendum)

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
