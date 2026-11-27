## MODIFIED Requirements

### Requirement: The terms of the Confederation

The French and Italian texts SHALL use the Confederation's own terms, as
`investigations/languages.md` gives them with their sources. These are the terms for the kinds of
vote, the majorities, the verdicts, the cantonal votes, the figures, the Swiss abroad, the
parties, and the offices and their publications. Where the sources differ, a scenario here names
the one taken.

#### Scenario: The verdicts in French

- **WHEN** a visitor opens `/fr/votes/5960/`
- **THEN** it shows the kind "Initiative populaire", the votes "Oui" and "Non" and the figure
  "Participation", the verdicts "Majorité du peuple" and "Majorité des cantons", the outcome
  "Rejeté", and the columns "Pourcentage de oui" and "Voix des cantons" of the table: the
  Constitution's "voix", not the linked data's "votes" (`investigations/languages.md`, 1 and 2)

#### Scenario: The verdicts in Italian

- **WHEN** a visitor opens `/it/votes/5960/`
- **THEN** it shows the kind "Iniziativa popolare", the votes "Sì" and "No" and the figure
  "Partecipazione", the verdicts "Maggioranza del popolo" and "Maggioranza dei Cantoni", the
  outcome "Respinto", and the columns "Percentuale di sì" and "Voti dei Cantoni" of the table

#### Scenario: The kinds of vote

- **WHEN** the six kinds are written in French and in Italian
- **THEN** they read:
  - in French: "Référendum obligatoire", "Référendum facultatif", "Initiative populaire",
    "Initiative populaire avec contre-projet", "Contre-projet", "Question subsidiaire";
  - in Italian: "Referendum obbligatorio", "Referendum facoltativo", "Iniziativa popolare",
    "Iniziativa popolare con controprogetto", "Controprogetto", "Domanda risolutiva"

#### Scenario: The list's verdicts

- **WHEN** a visitor opens `/fr/` and `/it/`
- **THEN** the row of the vote 5960 shows "49.16% de oui" and "rejeté", and "49.16% di sì" and
  "respinto"
- **AND** the row of the vote 6790 shows "50.39% de oui" and "accepté", and "50.39% di sì" and
  "accettato"

#### Scenario: A result not validated yet

- **GIVEN** the data files of 2026-11-27, in which the Federal Chancellery gives no result for
  the vote 6850
- **WHEN** a visitor opens `/fr/votes/6850/` and `/it/votes/6850/`
- **THEN** neither shows "Résultat provisoire" or "Risultato provvisorio", nor a source

#### Scenario: The parties

- **WHEN** a visitor clicks Zürich on `/fr/votes/5960/` and on `/it/votes/5960/`
- **THEN** the party strengths are named:
  - in French: "PLR", "Le Centre (jusqu'en 2020 PDC et PBD)", "PS", "UDC", "PVL", "Verts",
    "Autres partis", after STAT-TAB's French and the party register's "Le Centre";
  - in Italian: "PLR", "Il Centro (fino al 2020 PPD e PBD)", "PS", "UDC", "PVL", "I Verdi",
    "Altri partiti", after the party register and the parliament, which STAT-TAB lacks in
    Italian (`investigations/languages.md`, 4)

#### Scenario: The Swiss abroad

- **WHEN** a visitor opens `/fr/votes/5960/` and `/it/votes/5960/`
- **THEN** the switch of the limits and the sentence below the map name "Suisses de l'étranger"
  and "Svizzeri all'estero", the words of the Swiss Abroad Act (`investigations/languages.md`, 3)

#### Scenario: The sources

- **WHEN** a visitor opens `/fr/guide/` and `/it/guide/`
- **THEN** the sources name "Office fédéral de la statistique (OFS)", "Chancellerie fédérale" and
  "Répertoire officiel des communes de Suisse" in French, and "Ufficio federale di statistica
  (UST)", "Cancelleria federale" and "Elenco ufficiale dei Comuni della Svizzera" in Italian
  (`investigations/languages.md`, 5)


## ADDED Requirements

### Requirement: The spaces of the French texts

The site's own French texts SHALL take a no-break space (U+00A0) before ":", after « and before
», and a narrow no-break space (U+202F) before ";", "?" and "!", as the official titles of the
votes and admin.ch write them, so that no line breaks before these signs. The vote's titles and
the Chancellery's notes SHALL be shown as the sources give them. Numbers keep the way the screen
writes them in every language ("49.16%").

#### Scenario: The start page's question

- **WHEN** a visitor opens `/fr/`
- **THEN** its heading ends "s'était rendue aux urnes ?", with a narrow no-break space before
  the question mark

#### Scenario: A label with a colon and a name in guillemets

- **WHEN** a visitor opens `/fr/guide/`
- **THEN** it says "apparaît au-dessous : « Avec votre sélection »", each of the three spaces a
  no-break space

#### Scenario: No French text without its space

- **WHEN** every French text of the screen is written with made-up figures
- **THEN** none holds ":", ";", "?", "!" or "»" after a character other than its no-break space,
  nor "«" before one, except in an address, a time or a figure such as "1 : 23"
