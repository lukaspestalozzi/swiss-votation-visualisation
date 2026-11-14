# Data sources

The first investigation of `docs/roadmap.md`, before changes #2 and #3. It answers the five
questions the roadmap lists, from the live sources, on 2026-11-14. It decides nothing: the last
section names what the changes have to decide.

Words used here: the **table** is the BFS table of results per municipality, the **feed** is the
BFS file per vote day, the **Chancellery** is the Federal Chancellery's linked data, the
**register** is the BFS register of municipalities. A vote has a number at the Chancellery
(596) and an id at the BFS (5960, the number times ten; 6821 to 6823 for the three questions
of number 682).

## How to reproduce

The scripts are in `investigations/data-sources/`. They use Python 3 and its standard library
only; that says nothing about the language of the pipeline, which #3 decides. The downloads are
about 220 MB and stay outside the repository.

```sh
cd investigations/data-sources
python3 download.py /path/outside/the/repository   # about 15 minutes the first time
python3 check_table.py /path/outside/the/repository
python3 check_feed.py /path/outside/the/repository
python3 check_chancellery.py /path/outside/the/repository
python3 check_municipality_lists.py /path/outside/the/repository
python3 reference_votes.py /path/outside/the/repository
python3 write_reference_votes.py /path/outside/the/repository ../../calculation/src/reference-votes.json
```

| File | What |
|------|------|
| `sources.py` | The addresses of the sources, and one function that downloads a file. |
| `download.py` | Downloads everything the checks read; keeps what is there. |
| `readers.py` | Reads the downloads into one shape per source. |
| `check_table.py` | The table: its own consistency, and the entries that are no municipality. |
| `check_feed.py` | The feed: kinds, titles, consistency; against the table and Swissvotes. |
| `check_chancellery.py` | The Chancellery's results against the feed, and its notes. |
| `check_municipality_lists.py` | Which list of municipalities each source uses. |
| `reference_votes.py` | The votes in which the rules matter, with their figures. |
| `write_reference_votes.py` | Writes the reference data of the calculation; see "Reference data for the calculation". It downloads the six vote days it needs by itself. |

"Output" at the end of this file is what these scripts printed on 2026-11-14. The sources
change (see "The list of municipalities"), so a later run can differ; the reference values
below are the validated ones and do not.

## Sources

| Source | Address | What it gives | Publisher, terms |
|--------|---------|---------------|------------------|
| Table | `https://www.pxweb.bfs.admin.ch/api/v1/de/px-x-1703030000_101/px-x-1703030000_101.px` | Every national vote since 1960 per municipality: registered voters, ballots cast, turnout, valid ballots, yes, no, yes share. German titles only. | Federal Statistical Office (BFS); the answers carry "© BFS". Terms of use not read. |
| Feed | `https://ogd-static.voteinfo-app.ch/v1/ogd/sd-t-17-02-<yyyymmdd>-eidgAbstimmung.json` | One file per vote day: per vote its kind, whether it needs the double majority, its titles in German, French, Italian, Romansh and English, and the results for Switzerland, the cantons, the districts and the municipalities. | BFS. Terms of use not read. |
| Chancellery | `https://lindas.admin.ch/query` (SPARQL), data set `https://politics.ld.admin.ch/political-rights/popular-vote/` | The validated national result per vote: yes, no, cantonal votes, the reference in the Federal Gazette (BBl), and notes. No municipalities. | Federal Chancellery. Terms of use not read. |
| Register | `https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date=<dd-mm-yyyy>` | The municipalities, districts and cantons that existed on a date. | BFS. Terms of use not read. |
| Swissvotes | `https://swissvotes.ch/page/dataset/swissvotes_dataset.csv` | Every national vote since 1848 with its legal form and national figures. Used as an independent check only. | Année Politique Suisse, University of Bern; CC BY 4.0. |

Limits of the BFS statistics API (`https://www.pxweb.bfs.admin.ch/api/v1/de/?config`): 50 calls
in 15 seconds, 100,000 cells per call. A dimension that is left out of a query is summed up
silently, so the areas must be asked for explicitly.

The catalogue of opendata.swiss answered HTTP 403 from the investigation's environment and was
not used; the data is on the hosts above.

## Answers

### 1. Results per municipality for every national vote since 2013: yes

- The table has 123 votes on 43 days, 2013-03-03 to 2026-06-14.
- The feed has 129 votes on 45 days: 125 with a result, 2013-03-03 to 2026-09-27, and the four
  votes scheduled for 2026-11-29. A file for 2027-02-28 does not exist yet.
- For every vote, the municipal entries and the cantons each sum exactly to the national
  figures (table: 123 of 123, for registered, cast, valid, yes and no; feed: 125 of 125, for
  yes and no).
- Table and feed are identical in yes, no, valid and registered for all 123 votes they share.
- The feed marks the votes of 2026 as provisional. The Chancellery has no figures yet for the
  eight votes of 2026-03-08 and 2026-06-14; it has them for 2026-09-27 (BBl 2026 2971). Why the
  later day is there and the earlier two are not was not found out.

### 2. Votes that belong to no municipality on the map: two cases

**Swiss abroad.** Some cantons count them in a separate entry (codes 9010 to 9260 in both BFS
sources), not in a municipality:

| Period | Cantons | Share of the valid ballots |
|--------|---------|----------------------------|
| 2013-03-03 to 2014-09-28 | 11: LU, UR, FR, BS, AI, SG, AG, TG, VD, VS, GE | 1.00% to 1.20% |
| 2014-11-30 to 2026-06-14 | 12: the same and ZH | 1.05% to 1.57% |

The table lists 41 such entries (also "Korrespondenzweg" and "Anderes" for some cantons); only
the ones above have results since 2013.

**Municipalities without a result of their own.** Small municipalities of the canton of Bern
share a ballot box with a neighbour ("Gemeinsame Urne, Standort: ..." in the table), and their
votes are counted there. The table has them as rows without figures (`...`); the feed leaves
them out.

| Period | Municipalities |
|--------|----------------|
| 2013-03-03 to 2017-09-24 | 7: Meienried, Hellsau, Rüti bei Lyssach, Deisswil bei Münchenbuchsee, Oberhünigen, Jaberg, Niedermuhlern |
| 2018-03-04 to 2020-11-29 | 6: the same without Jaberg |
| 2021-03-07 to 2026-06-14 | 5: the same without Rüti bei Lyssach |

### 3. The list of municipalities: today's, for every vote

- The register has 2,408 municipalities on 2013-01-01, 2,294 on 2016-01-01, 2,131 on
  2024-01-01, 2,121 on 2025-01-01 and 2,110 on 2026-01-01.
- The table uses exactly the list of 2026-01-01 for every vote, back to 2013 (and 1960).
- The feed uses the same list without the municipalities of answer 2 that have no result. The
  files of the old vote days were written again on 2026-08-12.

So the BFS converts all earlier results to the current municipalities after a merger. Neither
source offers the results on the list that was valid on the day of the vote. With these
sources, a figure for a municipality that has merged since the vote is the sum of its parts.

The tables with characteristics use other lists (see "Characteristics").

### 4. Kinds of vote beyond the three: yes, once

The feed gives each vote a kind (`vorlagenArtId`) and says whether it needs the double majority
(`doppeltesMehr`):

| Kind | Votes | Double majority | What it is |
|------|-------|-----------------|------------|
| 1 | 14 | yes | Mandatory referendum. Four of them are direct counter-proposals to an initiative that was withdrawn (2014-02-09, 2014-05-18, 2017-09-24, 2018-09-23); Swissvotes calls these legal form 4. |
| 2 | 49 | no | Optional referendum. |
| 3 | 63 | yes | Popular initiative. |
| 4 | 1 | yes | Popular initiative that is voted on together with a counter-proposal. |
| 5 | 1 | yes | That counter-proposal. |
| 6 | 1 | yes | The tie-break question between the two. |

Kinds 4 to 6 occur on one day, 2026-03-08 (ids 6821, 6822, 6823, the initiative on cash). For
these three, the valid ballots are more than yes plus no, by 52,989, 125,960 and 141,476: a
voter may leave a question unanswered. For every other vote, valid ballots are exactly yes plus
no.

A mandatory vote that needs only the majority of voters (Federal Constitution, art. 140
para. 2) does not occur: every vote of kinds 1 and 3 to 6 needs the double majority.

Applied to the feed's national figures, the rules of hard constraint 2 (more yes than no votes,
and for a double majority more cantonal votes in favour than against) give the feed's own
`vorlageAngenommen` for all 122 votes of kinds 1 to 3.

Two rules have no case in the period: no canton has as many yes as no votes in any vote, and
the cantonal votes are never split evenly. Tests of these two rules need made-up figures.

### 5. Official results

The Chancellery's result is the official one: it names the Federal Gazette in which the Federal
Council validated it.

- Of the 125 votes with a result in the feed, 117 have figures at the Chancellery. For 116, yes
  and no are identical, and so are the cantonal votes where the double majority is needed.
- **One differs.** Number 665, 2024-03-03, popular initiative "Für ein besseres Leben im Alter
  (Initiative für eine 13. AHV-Rente)": the Chancellery has 1,350,325 no votes (BBl 2024 996);
  the table and the feed have 1,350,525, and their municipal entries sum to that. The yes votes
  agree (1,884,096). Swissvotes has the Chancellery's figure. Which side is wrong was not found
  out. The difference does not change the verdict.
- For optional referendums the Chancellery gives no cantonal votes. The feed gives them for
  the 34 since 2018-06-10 and for none of the 14 before.
- Swissvotes differs from the feed in five more votes (ids 6080, 6120, 6620, 6630, 6640), only
  in the number of registered voters. It has no figures for the 25 votes since 2024-06-09.

Notes of the Chancellery that matter:

- **Number 596, 2016-02-28, "Für Ehe und Familie – gegen die Heiratsstrafe"**: the Federal
  Supreme Court annulled the vote on 10 April 2019 (BBl 2019 4599). The figures are published
  unchanged.
- **Numbers 572 to 574, 2013-09-22**: the results of the canton of Geneva for two of the votes
  were corrected after the first publication (BBl 2014 6129). The feed agrees with the
  corrected figures.

## Reference values

Counts are exact (tolerance 0). The yes share is yes divided by yes plus no; a test compares it
to the value below within 0.00005 percentage points. "Cantons" is the cantonal votes in favour
and against. All are validated by the Chancellery, and table, feed and Chancellery agree on
every figure except where a row says otherwise.

| Vote | Number / id | Kind | Registered | Cast | Valid | Yes | No | Yes share | Cantons | Verdict | BBl |
|------|-------------|------|-----------:|-----:|------:|----:|---:|----------:|---------|---------|-----|
| 2016-02-28 Für Ehe und Familie – gegen die Heiratsstrafe | 596 / 5960 | initiative | 5,302,873 | 3,354,019 | 3,273,376 | 1,609,152 | 1,664,224 | 49.1588% | 16.5 : 6.5 | failed: cantons in favour, voters against | 2019 4599 |
| 2013-03-03 Bundesbeschluss über die Familienpolitik | 567 / 5670 | mandatory | 5,174,961 | 2,412,095 | 2,362,482 | 1,283,951 | 1,078,531 | 54.3475% | 10 : 13 | failed: voters in favour, cantons against | 2013 3129 |
| 2020-11-29 Für verantwortungsvolle Unternehmen | 636 / 6360 | initiative | 5,495,345 | 2,584,840 | 2,560,809 | 1,299,129 | 1,261,680 | 50.7312% | 8.5 : 14.5 | failed: voters in favour, cantons against | 2021 891 |
| 2025-09-28 Bundesgesetz über den elektronischen Identitätsnachweis | 679 / 6790 | optional | 5,641,040 | 2,796,897 | 2,747,948 | 1,384,586 | 1,363,362 | 50.3862% | 7.5 : 15.5 (feed only) | passed: only the voters count | 2026 1165 |
| 2017-09-24 Zusatzfinanzierung der AHV durch eine Erhöhung der Mehrwertsteuer | 614 / 6140 | mandatory | 5,372,748 | 2,546,386 | 2,511,951 | 1,254,795 | 1,257,156 | 49.9530% | 9.5 : 13.5 | failed, by 2,361 votes | 2017 7829 |
| 2015-06-14 Bundesgesetz über Radio und Fernsehen | 595 / 5950 | optional | 5,265,120 | 2,297,963 | 2,253,395 | 1,128,522 | 1,124,873 | 50.0810% | none given | passed, by 3,649 votes | 2015 6313 |
| 2013-03-03 Volksinitiative «gegen die Abzockerei» | 568 / 5680 | initiative | 5,174,961 | 2,418,825 | 2,378,159 | 1,616,184 | 761,975 | 67.9595% | 23 : 0 | passed: both majorities, plainly | 2013 3129 |
| 2024-03-03 Für ein besseres Leben im Alter | 665 / 6650 | initiative | 5,591,446 | 3,263,379 | Chancellery: not given; BFS: 3,234,621 | 1,884,096 | Chancellery: 1,350,325; BFS: 1,350,525 | Chancellery: 58.2514%; BFS: 58.2478% | 15 : 8 | passed | 2024 996 |

The vote of 2016-02-28 is the one of failure mode 3: the predecessor's municipal yes votes
summed to 1,622,968; the sources sum to 1,609,152.

Not validated yet, so not a reference value: 2026-03-08, Bundesgesetz über die
Individualbesteuerung (id 6850, optional), yes 1,662,477, no 1,401,322, cantons 10 : 13, passed.

## Reference data for the calculation

Added with the change `add-result-calculation`. The calculation is tested with all entries of
seven of the votes above, every one except number 665:
`calculation/src/reference-votes.json`.

- **What it holds.** Per vote its number, date, German title and kind, and per canton a list of
  `[BFS number, yes, no]`, one canton per line. An entry is a municipality, or the Swiss abroad
  of a canton that counts them apart (BFS numbers from 9010).
- **Where it comes from.** `write_reference_votes.py` downloads the feed's files of the six
  vote days and writes the file. It stops if the entries of a vote do not add up to what the
  feed gives for Switzerland.
- **The list of municipalities** is the one of 2026-01-01, as in every file of the feed
  (answer 3).
- **What a later run changes.** The BFS rewrites its files after a merger of municipalities.
  The entries and their count then change; the sums per canton and for Switzerland do not.
- **It is test data.** Its shape decides nothing about the data files of the app (#3), and the
  kinds' names in it are the calculation's, not the BFS's codes (1 mandatory referendum, 2
  optional referendum, 3 popular initiative).
- **The expected figures** of the tests are the reference values above, not the file.

What the script printed on 2026-11-14:

```
567 2013-03-03 mandatory-referendum entries 2114 | yes 1,283,951 no 1,078,531 | cantonal votes 10 : 13 | Bundesbeschluss über die Familienpolitik
568 2013-03-03 popular-initiative   entries 2114 | yes 1,616,184 no 761,975 | cantonal votes 23 : 0 | Volksinitiative «gegen die Abzockerei»
595 2015-06-14 optional-referendum  entries 2115 | yes 1,128,522 no 1,124,873 | cantonal votes 6.5 : 16.5 | Bundesgesetz über Radio und Fernsehen
596 2016-02-28 popular-initiative   entries 2115 | yes 1,609,152 no 1,664,224 | cantonal votes 16.5 : 6.5 | Volksinitiative «Für Ehe und Familie - gegen die H
614 2017-09-24 mandatory-referendum entries 2115 | yes 1,254,795 no 1,257,156 | cantonal votes 9.5 : 13.5 | Bundesbeschluss über die Zusatzfinanzierung der AH
636 2020-11-29 popular-initiative   entries 2116 | yes 1,299,129 no 1,261,680 | cantonal votes 8.5 : 14.5 | Volksinitiative «Für verantwortungsvolle Unternehm
679 2025-09-28 optional-referendum  entries 2117 | yes 1,384,586 no 1,363,362 | cantonal votes 7.5 : 15.5 | Bundesgesetz über den elektronischen Identitätsnac
```

The cantonal votes it prints are calculated from the entries. For the five votes that need the
double majority they equal the official ones. For the two optional referendums the Federal
Chancellery gives none: for number 679 the feed gives the same 7.5 : 15.5; for number 595 no
source gives a figure, and 6.5 : 16.5 is a calculated value only.

Figures that the specs of the calculation use and that are parts of these votes, not official
results of Switzerland:

| What | Entries | Yes | No | Cantonal votes | Verdict with both majorities |
|------|--------:|----:|---:|----------------|------------------------------|
| Number 596, only the canton of Zürich (160 municipalities and its Swiss abroad, who have 3,596 yes and 4,939 no votes) | 161 | 253,697 | 329,992 | 0 : 1 | failed |
| Number 596, without the canton of Zürich | 1,954 | 1,355,455 | 1,334,232 | 16.5 : 5.5 | passed |
| Number 596, all entries | 2,115 | 1,609,152 | 1,664,224 | 16.5 : 6.5 | failed |

The yes share of number 596 without the canton of Zürich is 50.3945%. The figures of the canton
of Zürich are the feed's result for that canton.

## Characteristics

Looked at only as far as the roadmap's first question asks ("the characteristics for matching
years"). Three tables of the BFS statistics API hold most of the predecessor's characteristics:

| Table | What | Years | Its list of municipalities |
|-------|------|-------|----------------------------|
| `px-x-0102010000_101` | Population by nationality (Swiss, foreign), sex and age in single years | every year, 2010 to 2025 | 2,115; closest to the register of 2025-01-01 (1 not in it, 7 of it missing) |
| `px-x-1702020000_105` | Votes and strength of 25 parties in the National Council elections | 2011, 2015, 2019, 2023 (and back to 1971) | 2,163; closest to the register of 2024-01-01 (33 not in it, 1 of it missing) |
| `px-x-0702000000_104` | Farms, farmland and livestock (cattle, not cows alone) | every year, 2010 to 2025 | 2,115; the table does not identify them by BFS number, not compared |

None of them uses the list of the votes. A change that adds characteristics has to bring them
onto one list itself.

Not found in the five themes of the catalogue that were searched (population, space and
environment, agriculture, politics, regional figures): area, language and religion per
municipality.

## What the changes have to decide

Nothing here is decided. Each point names the change it belongs to.

1. **What "matches the official result" means (hard constraint 1; #2, #3).** The municipal data
   reproduces the Chancellery's result exactly for 116 of 117 validated votes, and is 200 no
   votes off for one. The constraint as written cannot hold for that vote.
2. **One list of municipalities or one per vote (#3, #6).** The roadmap asks for "the list of
   municipalities valid at each vote" and a map "matching the municipalities at the time of the
   vote". The sources offer today's list for every vote, and change all earlier results after a
   merger.
3. **The Swiss abroad (#3, #8).** 1.0% to 1.6% of the valid ballots belong to no municipality.
   They are needed to match the official result; they cannot be judged by a characteristic.
4. **Municipalities without a result (#3, #6, #8).** Five to seven municipalities are on the
   map and have no result; their votes are in a neighbour's figures.
5. **The initiative with counter-proposal and tie-break question (#2, #4).** One case, three
   questions, with valid ballots that are not yes plus no.
6. **The annulled vote of 2016-02-28 (#3, #4).** It has an official result and no legal effect.
7. **Provisional results (#3).** The newest votes are in the feed before the Chancellery has
   validated them.
8. **Where the kind of a vote comes from (#3).** The feed states it and whether the double
   majority is needed; the table does not.
9. **Yearly re-generation (#3).** Because the sources follow the mergers, the data of every
   vote changes when the list of municipalities changes.

## Not verified

- Which of the two figures for number 665 is the error.
- Why the Chancellery has figures for 2026-09-27 and none for the two vote days before it.
- The terms of use of the BFS sources and of the Chancellery's data.
- The list of municipalities of the agriculture table, and sources for area, language and
  religion per municipality.
- How the register records a merger (only its snapshots by date were read).
- The geometry of the map, which belongs to #6.
- Whether the feed's file of a vote day keeps its address and its shape; the old files were
  rewritten in August 2026.

## Output

`python3 check_table.py <data>`:

```
votes since 2013: 123, on 43 days, 2013-03-03 to 2026-06-14
national row == sum of municipal entries == sum of cantons (registered, cast, valid, yes, no): 123 of 123
  valid ballots exceed yes + no by 52,989: 6821 2026-03-08 Volksinitiative «Ja zu einer unabhängigen, freien Schweizer 
  valid ballots exceed yes + no by 125,960: 6822 2026-03-08 Bundesbeschluss über die schweizerische Währung und die Barg
  valid ballots exceed yes + no by 141,476: 6823 2026-03-08 Bargeldinitiative und Gegenvorschlag: Stichfrage

municipalities without a result of their own:
  2013-03-03 to 2017-09-24: 7: Meienried, Hellsau, Rüti bei Lyssach, Deisswil bei Münchenbuchsee, Oberhünigen, Jaberg, Niedermuhlern
  2018-03-04 to 2020-11-29: 6: Meienried, Hellsau, Rüti bei Lyssach, Deisswil bei Münchenbuchsee, Oberhünigen, Niedermuhlern
  2021-03-07 to 2026-06-14: 5: Meienried, Hellsau, Deisswil bei Münchenbuchsee, Oberhünigen, Niedermuhlern

entries that are no municipality (Swiss abroad), with a result:
  2013-03-03 to 2014-09-28: 11 cantons (LU, UR, FR, BS, AI, SG, AG, TG, VD, VS, GE); 1.00% to 1.20% of the valid ballots
  2014-11-30 to 2026-06-14: 12 cantons (ZH, LU, UR, FR, BS, AI, SG, AG, TG, VD, VS, GE); 1.05% to 1.57% of the valid ballots

municipalities in the table: 2110; special entries: 41
```

`python3 check_feed.py <data>`:

```
votes in the feed: 129 on 45 days; with a result: 125, 20130303 to 20260927; not yet voted: ['20261129']
kind (vorlagenArtId) and whether the double majority is needed (doppeltesMehr):
  kind 1, double majority True: 14
  kind 2, double majority False: 49
  kind 3, double majority True: 63
  kind 4, double majority True: 1
  kind 5, double majority True: 1
  kind 6, double majority True: 1
titles in German, French and Italian: 129 of 129; also Romansh and English: 129
marked provisional: the votes of ['20260308', '20260614', '20260927', '20261129']
sum of municipal entries == national result (yes and no): 125 of 125
sum of cantons == national result (yes): 125 of 125
a canton with as many yes as no votes: []
cantonal votes split evenly: []

feed and table, yes, no, valid and registered: identical for 123 of 123 votes; in the feed only: ['20260927']
feed and Swissvotes: 100 votes with figures in both; Swissvotes has none for 25 votes since 20240609
  6080 20161127: registered 5,338,140 in the feed, 5,336,711 in Swissvotes
  6120 20170521: registered 5,356,575 in the feed, 5,356,538 in Swissvotes
  6620 20230618: registered 5,570,255 in the feed, 5,567,120 in Swissvotes
  6630 20230618: registered 5,570,255 in the feed, 5,567,120 in Swissvotes
  6640 20230618: registered 5,570,255 in the feed, 5,567,120 in Swissvotes
  6650 20240303: no 1,350,525 in the feed, 1,350,325 in Swissvotes; valid 3,234,621 in the feed, 3,234,421 in Swissvotes
```

`python3 check_chancellery.py <data>` (the notes are cut after 400 characters; a note that is
repeated is written once):

```
vote numbers at the Chancellery since 2013: 132
votes of the feed with a result: 125
  yes and no identical, and the cantonal votes where the double majority is needed: 116
  not validated yet at the Chancellery: 8, the votes of ['20260308', '20260614']
  different: 1
    6650 20240303 Volksinitiative «Für ein besseres Leben im Alter (Initiative: feed yes 1,884,096 no 1,350,525; Chancellery yes 1,884,096 no 1,350,325 (BBl 2024 996)

notes of the Chancellery:
  2013-09-22 no. 572, BBl 2014 6129: In der ursprünglichen Publikation (BBl 2013 8789) sind die Ergebnisse der Abstimmung über das Epidemiengesetz (EpG) und die Änderung des Arbeitsgesetzes (ArG) im Kanton Genf falsch wiedergegeben worden. Durch die nun erfolgte Korrektur hat sich auch das gesamtschweizerische Ergebnis der beiden Vorlagen leicht verändert. An der Annahme der beiden Vorlagen durch das Volk ändert sich nichts.
  2013-09-22 no. 573, BBl 2014 6129: (the same note)
  2013-09-22 no. 574, BBl 2014 6129: (the same note)
  2016-02-28 no. 596, BBl 2019 4599: Das Bundesgericht hat mit Urteilen vom 10. April 2019 (1C_315/2018, 1C_316/2018, 1C_329/2018, 1C_331/2018, 1C_335/2018, 1C_337/2018 und 1C_347/2018 sowie 1C_338/2018) die eidgenössische Volksabstimmung über die Volksinitiative vom 5. November 2012 «Für Ehe und Familie – gegen die Heiratsstrafe» aufgehoben. Mit Beschluss vom 21. Juni 2019 hat der Bundesrat die Aufhebung der Erwahrung des Ergebnisse
```

`python3 check_municipality_lists.py <data>`:

```
municipalities in the register: 2013-01-01: 2408, 2016-01-01: 2294, 2024-01-01: 2131, 2025-01-01: 2121, 2026-01-01: 2110
votes:
  table, every vote: 2110 municipalities; closest register: 2026-01-01 (0 not in it, 0 of it missing)
  feed, 20130303 to 20170924: 2103 municipalities; closest register: 2026-01-01 (0 not in it, 7 of it missing)
  feed, 20180304 to 20201129: 2104 municipalities; closest register: 2026-01-01 (0 not in it, 6 of it missing)
  feed, 20210307 to 20261129: 2105 municipalities; closest register: 2026-01-01 (0 not in it, 5 of it missing)
characteristics:
  px-x-0102010000_101, population by nationality, sex and age: years 2010 to 2025 (16)
      its list: 2115 municipalities; closest register: 2025-01-01 (1 not in it, 7 of it missing)
  px-x-1702020000_105, party strength in the National Council elections: years 1971 to 2023 (14)
      its list: 2163 municipalities; closest register: 2024-01-01 (33 not in it, 1 of it missing)
  px-x-0702000000_104, farms, farmland and livestock: years 1975 to 2025 (28)
    its list: 2115 municipalities, not identified by their BFS number (first codes: ['4', '5', '6']); not compared
```

`python3 reference_votes.py <data>` (the titles are cut after 58 characters):

```
double majority needed, voters in favour, cantons against:
  20130303 id 5670 kind 1 double | valid 2,362,482 yes 1,283,951 no 1,078,531 (54.3475%) | cantons 10 : 13 | failed | Bundesbeschluss über die Familienpolitik
  20201129 id 6360 kind 3 double | valid 2,560,809 yes 1,299,129 no 1,261,680 (50.7312%) | cantons 8.5 : 14.5 | failed | Volksinitiative «Für verantwortungsvolle Unternehmen – zum
double majority needed, cantons in favour, voters against:
  20160228 id 5960 kind 3 double | valid 3,273,376 yes 1,609,152 no 1,664,224 (49.1588%) | cantons 16.5 : 6.5 | failed | Volksinitiative «Für Ehe und Familie - gegen die Heiratsst
only the voters count, passed although the cantons were against:
  20250928 id 6790 kind 2 voters only | valid 2,747,948 yes 1,384,586 no 1,363,362 (50.3862%) | cantons 7.5 : 15.5 | passed | Bundesgesetz über den elektronischen Identitätsnachweis un
  20260308 id 6850 kind 2 voters only | valid 3,063,799 yes 1,662,477 no 1,401,322 (54.2619%) | cantons 10 : 13 | passed, provisional | Bundesgesetz über die Individualbesteuerung
the three closest results:
  20170924 id 6140 kind 1 double | valid 2,511,951 yes 1,254,795 no 1,257,156 (49.9530%) | cantons 9.5 : 13.5 | failed | Bundesbeschluss über die Zusatzfinanzierung der AHV durch 
  20150614 id 5950 kind 2 voters only | valid 2,253,395 yes 1,128,522 no 1,124,873 (50.0810%) | cantons none given | passed | Bundesgesetz über Radio und Fernsehen
  20200927 id 6350 kind 2 voters only | valid 3,203,163 yes 1,605,839 no 1,597,324 (50.1329%) | cantons 16 : 7 | passed | Bundesbeschluss über die Beschaffung neuer Kampfflugzeuge
an initiative, its counter-proposal and the tie-break question:
  20260308 id 6821 kind 4 double | valid 3,081,025 yes 1,381,191 no 1,646,845 (45.6134%) | cantons 9 : 14 | failed, provisional | Volksinitiative «Ja zu einer unabhängigen, freien Schweize
  20260308 id 6822 kind 5 double | valid 3,081,025 yes 2,169,303 no 785,762 (73.4097%) | cantons 23 : 0 | passed, provisional | Bundesbeschluss über die schweizerische Währung und die Ba
  20260308 id 6823 kind 6 double | valid 3,081,025 yes 1,098,341 no 1,841,208 (37.3643%) | cantons 2 : 21 | failed, provisional | Bargeldinitiative und Gegenvorschlag: Stichfrage
the vote of failure mode 3:
  20160228 id 5960 kind 3 double | valid 3,273,376 yes 1,609,152 no 1,664,224 (49.1588%) | cantons 16.5 : 6.5 | failed | Volksinitiative «Für Ehe und Familie - gegen die Heiratsst

verdict by the rules == 'accepted' of the feed, kinds 1 to 3: 122 of 122
```
