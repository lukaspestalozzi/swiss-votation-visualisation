# Spec Delta

## MODIFIED Requirements

### Requirement: The switch between the languages

At its top, every page SHALL name the three languages in their own words, in this order:
"Deutsch", "Français", "Italiano"; in a window narrower than 640 pixels as "DE", "FR" and "IT",
each named with its word for assistive technology. The two others SHALL link to the same page in
them; the page's own SHALL NOT be a link. A link SHALL open that page anew, with the
selection the page's address holds (the `share-link` capability): the municipality clicked and the
map's view are not carried over.

#### Scenario: From German to French

- **WHEN** a visitor on `/de/votes/5960/` follows "Français"
- **THEN** the browser shows `/fr/votes/5960/`, whose language is "fr" and whose heading is
  "Initiative populaire «Pour le couple et la famille - Non à la pénalisation du mariage»"
- **AND** a server that does not add the final slash shows the same page at `/fr/votes/5960`, as
  the `verdicts` capability's "A vote's address without the final slash" says

#### Scenario: The switch on the start page and the guide

- **WHEN** a visitor opens `/it/` and `/it/guide/`
- **THEN** each names "Deutsch", linked to `/de/` and `/de/guide/`, "Français", linked to `/fr/`
  and `/fr/guide/`, and "Italiano", which is not a link

#### Scenario: A selection goes along

- **WHEN** a visitor on `/de/votes/5960/` clicks Zürich on the map, adds the limit
  "Ausländeranteil", moves its upper bound to step 327, waits a second and follows "Italiano"
- **THEN** the browser shows `/it/votes/5960/#foreigners=-19.98`, with the limit "Quota di
  stranieri (fine 2015): da 0.00% a 19.98%" and "Con la Sua selezione"
- **AND** no municipality is outlined on the map, and the panel of characteristics shows no
  municipality

#### Scenario: The switch in a narrow window

- **WHEN** a visitor opens `/de/votes/5960/` in a window 360 pixels wide
- **THEN** the switch writes "DE", "FR" and "IT"; "FR" is a link named "FR – Français" for
  assistive technology, which leads to `/fr/votes/5960/`; and "DE" is not a link

### Requirement: A page in each language

The build SHALL write every page three times: in German under `/de/`, in French under `/fr/`, in
Italian under `/it/`. Each SHALL declare its language (`lang` "de", "fr" or "it") and show every
text of the screen in it. The working title "Popular Vote Explorer" stays the same. A language
other than these three has no page.

#### Scenario: The three pages of a vote

- **GIVEN** the data files of 2026-11-14
- **WHEN** the site is built
- **THEN** it holds `/de/votes/5960/`, `/fr/votes/5960/` and `/it/votes/5960/`, whose languages
  are "de", "fr" and "it", and 125 pages of votes under each language

#### Scenario: The start page and the guide in each language

- **WHEN** a visitor opens `/fr/`, `/it/` and `/fr/guide/`
- **THEN** the two start pages have the headings "Comment la Suisse aurait-elle voté si seule une
  partie des communes s'était rendue aux urnes?" and "Come avrebbe votato la Svizzera se solo una
  parte dei Comuni si fosse recata alle urne?", each names "Popular Vote Explorer" in its head,
  and the language of each page is that of its address

#### Scenario: A language that has no page

- **WHEN** a browser opens `/en/` or `/rm/votes/5960/`
- **THEN** the answer has the status 404

### Requirement: The terms of the Confederation

The French and Italian texts SHALL use the Confederation's own terms, as
`investigations/languages.md` gives them with their sources. These are the terms for the kinds of
vote, the majorities, the verdicts, the cantonal votes, the figures, the Swiss abroad, the
parties, and the offices and their publications. Where the sources differ, a scenario here names
the one taken.

#### Scenario: The verdicts in French

- **WHEN** a visitor opens `/fr/votes/5960/`
- **THEN** it shows the kind "Initiative populaire", the figures "Pourcentage de oui" and
  "Participation", the verdicts "Majorité du peuple" and "Majorité des cantons", the outcome
  "Rejeté", and the column "Voix des cantons" of the table: the Constitution's "voix", not the
  linked data's "votes" (`investigations/languages.md`, 1 and 2)

#### Scenario: The verdicts in Italian

- **WHEN** a visitor opens `/it/votes/5960/`
- **THEN** it shows the kind "Iniziativa popolare", the figures "Percentuale di sì" and
  "Partecipazione", the verdicts "Maggioranza del popolo" and "Maggioranza dei Cantoni", the
  outcome "Respinto", and the column "Voti dei Cantoni" of the table

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

- **GIVEN** the data files of 2026-11-14
- **WHEN** a visitor opens `/fr/votes/6850/` and `/it/votes/6850/`
- **THEN** they show "Résultat provisoire: pas encore validé par le Conseil fédéral." and
  "Risultato provvisorio: non ancora accertato dal Consiglio federale.", after the Chancellery's
  "validation" and "accertamento" (`investigations/languages.md`, 1)

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
