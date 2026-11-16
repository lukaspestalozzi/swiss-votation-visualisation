# Spec Delta

## MODIFIED Requirements

### Requirement: The page holds its result

A vote's page SHALL hold the result calculated when the site is built and, for a vote the
calculation judges, the canton, the yes votes and the no votes of each of its entries, which the
selection of the `limits` capability recalculates from; the browser SHALL NOT load the vote's file
of entries. When a vote of the list has no file of entries, or the calculation refuses one of its
entries, the build SHALL fail and name the vote.

#### Scenario: The entries stay out of the browser

- **WHEN** a visitor opens `/votes/5960` and waits until the page has stopped loading
- **THEN** no request of the browser was for a file under `/data/votes/`

#### Scenario: The entries a selection needs are on the page

- **WHEN** a visitor opens `/votes/5950/`, switches the Swiss abroad off, and waits until the page
  has stopped loading
- **THEN** the page shows the selection's result, and no request of the browser was for a file
  under `/data/votes/`

#### Scenario: A vote without its file

- **GIVEN** a list of votes that names a vote for which there is no file of entries
- **WHEN** the site is built
- **THEN** the build fails and names the vote

### Requirement: The table of the cantons

For every vote the calculation judges, the page SHALL show a table with one row per canton that
has an entry, in the order of the Federal Constitution: the canton's abbreviation, its yes share,
its cantonal votes ("1" or "½") and the side they count for ("Ja" or "Nein"). A canton without
valid votes SHALL show "–" as its yes share. For a vote that needs only the majority of voters,
the table SHALL be shown as well. While a selection applies, it follows the selection.

#### Scenario: The cantons of a named vote

- **WHEN** a visitor opens `/votes/5960`
- **THEN** the table has 26 rows from ZH to JU; the row of ZH reads "ZH", "43.46%", "1" and
  "Nein" (`investigations/data-sources.md`, "Reference data for the calculation"); the rows of
  OW, NW, BS, BL, AR and AI show "½"; and the cantonal votes of the rows that read "Ja" add up to
  16½

#### Scenario: The cantons of a selection

- **WHEN** a visitor opens `/votes/5960/` and moves the upper bound of "Ausländeranteil" to step
  327, 19.98%
- **THEN** the table is headed "Mit Ihrer Auswahl", still has 26 rows; the row of BS reads "BS",
  "–", "keine Gemeinde übrig" and "–"; and the cantonal votes of the rows that read "Ja" add up to
  18 (`investigations/limits.md`, 5)

## ADDED Requirements

### Requirement: The cantons under a selection

While a selection applies, the table of the cantons SHALL be headed "Mit Ihrer Auswahl" and SHALL
show each canton's figures from the entries that remain. A canton with an entry in the vote and
none that remains SHALL keep its row, with "–" as its yes share and its side, and "keine Gemeinde
übrig" in place of its cantonal votes.

#### Scenario: Back to the real cantons

- **WHEN** a visitor on `/votes/5960/` moves the upper bound of "Ausländeranteil" to step 327 and
  then presses "Zurück zum echten Ergebnis"
- **THEN** the table has no heading "Mit Ihrer Auswahl", and the row of BS shows its yes share,
  "½" and its side

### Requirement: The result of the selection

A selection applies while a limit is narrowed or the Swiss abroad are not counted (the `limits`
capability). While it applies, the page SHALL show, beside the figures and verdicts of the vote,
under "Mit Ihrer Auswahl", the yes votes, the no votes and the yes share the calculation gives over
the entries that remain, the Volksmehr and the Ständemehr as the vote's own are shown, and the
outcome. The vote's own figures and verdicts SHALL stay as they are.

#### Scenario: The official result with nothing narrowed

- **WHEN** a visitor opens `/votes/5950/` and adds a limit without moving its bounds
- **THEN** the page shows no "Mit Ihrer Auswahl", and the vote's result reads 1'128'522 yes and
  1'124'873 no votes, "50.08%" and "Angenommen" (`investigations/limits.md`, 5; BBl 2015 6313)

#### Scenario: Without the Swiss abroad

- **WHEN** a visitor opens `/votes/5950/` and switches the Swiss abroad off
- **THEN** beside the vote's result, "Mit Ihrer Auswahl" shows "1'107'734" yes and "1'113'998"
  no votes, the Volksmehr "Nein" with "49.86%", the Ständemehr "nicht nötig" with "6½ : 16½"
  greyed out, and "Abgelehnt"; the vote's own result still reads "50.08%" and "Angenommen"
  (`investigations/limits.md`, 5)

#### Scenario: A selection that turns the verdict

- **WHEN** a visitor opens `/votes/5960/` and moves the upper bound of "Ausländeranteil" to step
  327, 19.98%
- **THEN** "Mit Ihrer Auswahl" shows "733'402" yes and "664'373" no votes, the Volksmehr "Ja" with
  "52.47%", the Ständemehr "Ja" with "18 : 4½", and "Angenommen", beside the vote's own "49.16%"
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
