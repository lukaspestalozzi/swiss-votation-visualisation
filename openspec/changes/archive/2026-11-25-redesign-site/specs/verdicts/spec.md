# Spec Delta

## MODIFIED Requirements

### Requirement: The two verdicts side by side

For every vote the calculation judges, the page SHALL show, under "Echtes Ergebnis", the outcome
the calculation gives, "Angenommen" or "Abgelehnt", and after it, next to each other, the majority
of voters, headed "Volksmehr", with its yes share, and the majority of cantons, headed
"Ständemehr", with its cantonal votes in favour and against, each with its bar. Each SHALL read
"Ja" when it is reached and "Nein" when it is not.

#### Scenario: The cantons in favour, the voters against

- **WHEN** a visitor opens `/votes/5960`
- **THEN** the outcome is "Abgelehnt", the Volksmehr reads "Nein" with "49.16%", and the
  Ständemehr reads "Ja" with "16½ : 6½" (`investigations/data-sources.md`, "Reference values")

#### Scenario: The voters in favour, the cantons against

- **WHEN** a visitor opens `/votes/5670`
- **THEN** the outcome is "Abgelehnt", the Volksmehr reads "Ja" with "54.35%", and the Ständemehr
  reads "Nein" with "10 : 13" (`investigations/data-sources.md`, "Reference values")

#### Scenario: In a window 1,280 pixels wide

- **WHEN** a visitor opens `/de/votes/5960/` in a window 1,280 pixels wide
- **THEN** under "Echtes Ergebnis", "Abgelehnt", "Volksmehr" and "Ständemehr" stand in one row,
  in this order from the left

### Requirement: A majority that is not needed

For a vote that needs only the majority of voters, the Ständemehr SHALL read "nicht nötig" and
SHALL show, greyed out, the cantonal votes the calculation gives, without a bar; the outcome SHALL
follow the majority of voters alone.

#### Scenario: An optional referendum the cantons were against

- **WHEN** a visitor opens `/votes/6790`
- **THEN** it shows "Braucht nur das Volksmehr.", the Volksmehr reads "Ja" with "50.39%" and has
  its bar, the Ständemehr reads "nicht nötig" with "7½ : 15½" greyed out and has no bar, and the
  outcome is "Angenommen" (`investigations/data-sources.md`, "Reference values")

### Requirement: The table of the cantons

For every vote the calculation judges, the page SHALL show, headed "Kantone", a table with one
row per canton that has an entry, in the order of the Federal Constitution: the canton's
abbreviation, its yes share, its cantonal votes ("1" or "½") and the side they count for ("Ja" or
"Nein"). A canton without valid votes SHALL show "–" as its yes share. For a vote that needs only
the majority of voters, the table SHALL be shown as well. While a selection applies, it follows
the selection.

#### Scenario: The cantons of a named vote

- **WHEN** a visitor opens `/votes/5960`
- **THEN** under "Kantone" the table has 26 rows from ZH to JU; the row of ZH reads "ZH",
  "43.46%", "1" and "Nein" (`investigations/data-sources.md`, "Reference data for the
  calculation"); the rows of OW, NW, BS, BL, AR and AI show "½"; and the cantonal votes of the
  rows that read "Ja" add up to 16½

#### Scenario: The cantons of a selection

- **WHEN** a visitor opens `/votes/5960/` and moves the upper bound of "Ausländeranteil" to step
  327, 19.98%
- **THEN** the table is headed "Mit Ihrer Auswahl", still has 26 rows; the row of BS reads "BS",
  "–", "keine Gemeinde übrig" and "–"; and the cantonal votes of the rows that read "Ja" add up to
  18 (`investigations/limits.md`, 5)

### Requirement: The tie-break question

For a tie-break question the page SHALL show, from the vote's result in the list of votes, the
votes for the initiative (its yes votes) and for the counter-proposal (its no votes), each with
its share of the two, a bar of the two shares, and the cantons for each side. It SHALL say that a
tie-break question counts only when the initiative and the counter-proposal both pass, and that
it is not judged here. It SHALL show neither verdicts nor an outcome nor a table of the cantons.

#### Scenario: The tie-break question of 2026-03-08

- **WHEN** a visitor opens `/votes/6823`
- **THEN** it shows "Für die Initiative: 1'098'341 (37.36%)", "Für den Gegenentwurf: 1'841'208
  (62.64%)" and "Stände: 2 für die Initiative, 21 für den Gegenentwurf", the sentence "Die
  Stichfrage zählt nur, wenn die Initiative und der Gegenentwurf beide angenommen sind; sie wird
  hier nicht beurteilt.", and no "Volksmehr", "Ständemehr", "Angenommen" or "Abgelehnt"
  (`investigations/data-sources.md`, "Output" of `reference_votes.py`)
- **AND** a bar whose left part, for the initiative, is 37.36% of its width, give or take 1
  pixel, with a mark at half

### Requirement: The result of the selection

A selection applies while a limit is narrowed or the Swiss abroad are not counted (the `limits`
capability). While it applies, the page SHALL show, below the result of the vote, under "Mit Ihrer
Auswahl", the yes votes, the no votes and the yes share the calculation gives over the entries
that remain, the outcome, and the Volksmehr and the Ständemehr as the vote's own are shown, each
bar below the vote's. The vote's own result SHALL stay as it is.

#### Scenario: The official result with nothing narrowed

- **WHEN** a visitor opens `/votes/5950/` and adds a limit without moving its bounds
- **THEN** the page shows no "Mit Ihrer Auswahl", and the vote's result reads 1'128'522 yes and
  1'124'873 no votes, "50.08%" and "Angenommen" (`investigations/limits.md`, 5; BBl 2015 6313)

#### Scenario: Without the Swiss abroad

- **WHEN** a visitor opens `/votes/5950/` and switches the Swiss abroad off
- **THEN** below the vote's result, "Mit Ihrer Auswahl" shows "1'107'734" yes and "1'113'998"
  no votes, the Volksmehr "Nein" with "49.86%", the Ständemehr "nicht nötig" with "6½ : 16½"
  greyed out, and "Abgelehnt"; the vote's own result still reads "50.08%" and "Angenommen"
  (`investigations/limits.md`, 5)

#### Scenario: A selection that turns the verdict

- **WHEN** a visitor opens `/votes/5960/` and moves the upper bound of "Ausländeranteil" to step
  327, 19.98%
- **THEN** "Mit Ihrer Auswahl" shows "733'402" yes and "664'373" no votes, the Volksmehr "Ja" with
  "52.47%", the Ständemehr "Ja" with "18 : 4½", and "Angenommen", below the vote's own "49.16%"
  and "Abgelehnt" (`investigations/limits.md`, 5)

#### Scenario: A selection on a logarithmic track

- **WHEN** a visitor opens `/votes/5960/` and moves the lower bound of "Einwohner" to step 500,
  3'508
- **THEN** "Mit Ihrer Auswahl" shows "1'137'986" yes and "1'266'006" no votes, the Volksmehr
  "Nein" with "47.34%", the Ständemehr "Ja" with "12½ : 10½", and "Abgelehnt"
  (`investigations/limits.md`, 5)

#### Scenario: Nothing remains

- **WHEN** a visitor opens `/votes/5960/` and moves the lower bounds of "Deutsch" and
  "Französisch" each to step 1,000
- **THEN** "Mit Ihrer Auswahl" shows "0" yes and "0" no votes, the Volksmehr "Nein" with "–", the
  Ständemehr "Nein" with "0 : 0", and "Abgelehnt"

#### Scenario: Bar below bar

- **WHEN** a visitor opens `/de/votes/5960/` in a window 1,280 pixels wide and moves the upper
  bound of "Ausländeranteil" to step 327
- **THEN** the Volksmehr's bar under "Mit Ihrer Auswahl" lies below the vote's, with the same left
  edge and the same width, give or take 1 pixel, and so does the Ständemehr's

## ADDED Requirements

### Requirement: The bars of a result

The Volksmehr's bar SHALL show the yes share from its left, as wide as that share of the bar, with
a mark at half. The Ständemehr's bar SHALL show one segment per canton that has a cantonal vote, a
half vote half as wide as a whole one: the cantons in favour from the left, then those against,
each in the order of the Federal Constitution, with a mark at half. With no valid vote, or no
cantonal vote, a bar SHALL be empty. The bars' colours are the `site-style` capability's.

#### Scenario: The bars of 2016-02-28

- **WHEN** a visitor opens `/de/votes/5960/`
- **THEN** the yes part of the Volksmehr's bar is 49.16% of its width, give or take 1 pixel
  (`investigations/data-sources.md`, "Reference values")
- **AND** the Ständemehr's bar has 26 segments: the 18 in favour, from LU to JU, then the 8
  against, from ZH to GE; those of OW, NW, BS, BL, AR and AI are half as wide as the others; and
  the segments in favour take 16½ of 23 parts of the bar

#### Scenario: A canton with nothing left

- **WHEN** that visitor moves the upper bound of "Ausländeranteil" to step 327
- **THEN** the Ständemehr's bar under "Mit Ihrer Auswahl" has 25 segments, none for BS, and the
  segments in favour take 18 of 22½ parts of the bar (`investigations/limits.md`, 5)

#### Scenario: Nothing remains

- **WHEN** a visitor on `/de/votes/5960/` moves the lower bounds of "Deutsch" and "Französisch"
  each to step 1,000
- **THEN** both bars under "Mit Ihrer Auswahl" are empty, with their marks at half

### Requirement: The place of the selection's result

Until a selection applies, the page of a vote the calculation judges SHALL say, where the
selection's result will stand: "Setzen Sie eine Grenze auf ein Merkmal: Hier steht dann das
Ergebnis der Gemeinden, die übrig bleiben." When the characteristics cannot be loaded, it SHALL
show nothing there. That place SHALL be as tall as the result that takes it.

#### Scenario: Before a limit

- **WHEN** a visitor opens `/de/votes/5960/` and the characteristics have loaded
- **THEN** below the vote's result stands that sentence, and no "Mit Ihrer Auswahl"

#### Scenario: With a selection

- **WHEN** that visitor adds the limit "Ausländeranteil" and moves its upper bound to step 327
- **THEN** the sentence is gone, and "Mit Ihrer Auswahl" stands in its place

#### Scenario: Nothing moves when a selection first applies

- **WHEN** a visitor on `/de/votes/5960/`, in a window 1,280 by 800 pixels and in one 1,024 by
  768, adds five limits and moves the lower bound of the last, "SVP", to step 50
- **THEN** the map and that limit's slider stand where they stood in the window

#### Scenario: Nothing moves in a narrow window

- **WHEN** a visitor on `/de/votes/5960/`, in a window 360 by 740 pixels and in one 800 by
  1,000, adds the limit "Einwohner", scrolls until the sentence in the selection's place lies at
  the top of the window, and moves that limit's lower bound to step 50
- **THEN** that limit's slider stands where it stood in the window

#### Scenario: The characteristics' file is missing

- **GIVEN** a browser in which every request for `data/characteristics.json` fails
- **WHEN** a visitor opens `/de/votes/5960/`
- **THEN** the page shows neither that sentence nor "Mit Ihrer Auswahl"

### Requirement: The bar of a canton

In the table of the cantons, each row SHALL show beside its yes share a bar on a track of 0 to
100%: from the track's middle to the canton's yes share, in the colour of its side. While a
selection applies, a mark on the track SHALL show the canton's yes share in the vote's real
result, and a sentence below the table SHALL say so. A canton without valid votes, or with no
municipality left, SHALL show no bar.

#### Scenario: The cantons' bars of 2016-02-28

- **WHEN** a visitor opens `/de/votes/5960/`
- **THEN** the bar of ZH, 43.46%, reaches from the middle of its track 6.54% of the track's width
  to the left, in the colour of no; that of JU, 60.07%, 10.07% to the right, in the colour of yes;
  each give or take 1 pixel (`investigations/data-sources.md`, "Reference data for the
  calculation")
- **AND** below the table stands "Jeder Balken reicht von 50% bis zum Ja-Anteil des Kantons."

#### Scenario: A share far from half

- **WHEN** a visitor opens `/de/votes/5680/`, where ZH has 70.20%
- **THEN** the bar of ZH reaches 20.20% of the track's width to the right

#### Scenario: The cantons' bars under a selection

- **WHEN** a visitor on `/de/votes/5960/` moves the upper bound of "Ausländeranteil" to step 327
- **THEN** each row with a yes share shows a mark at its real share, that of ZH at 43.46% of the
  track; the row of BS, with no municipality left, shows no bar and no mark
- **AND** below the table stands "Jeder Balken reicht von 50% bis zum Ja-Anteil des Kantons; der
  Strich zeigt sein echtes Ergebnis."
