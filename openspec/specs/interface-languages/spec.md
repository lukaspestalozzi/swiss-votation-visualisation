# interface-languages Specification

## Purpose

The languages of the site: every page in German, French and Italian, at an address of its own,
in the language the browser prefers; a switch between them; the official terms of each language;
and how the other capabilities, written for the German page, hold for all three.

## Requirements

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
- **THEN** the two start pages have the heading "Popular Vote Explorer", and the language of each
  page is that of its address

#### Scenario: A language that has no page

- **WHEN** a browser opens `/en/` or `/rm/votes/5960/`
- **THEN** the answer has the status 404

### Requirement: How the other capabilities hold in three languages

A requirement or scenario of another capability that names a page's address without a language,
such as `/votes/5960/` or `/guide/`, SHALL hold for that page in each language. Where it quotes a
text of the screen, it quotes the German page, and the French and Italian pages SHALL show it in
their language. Figures, places and the order of things SHALL be the same in all three.

#### Scenario: The details of a municipality in Italian

- **WHEN** a visitor opens `/it/votes/5960/` and points at Zürich, as the `result-map`
  capability's scenario does on `/votes/5960/`
- **THEN** the map shows "Zürich (ZH)", "Percentuale di sì: 31.85%", "Sì: 46'565" and "No:
  99'614", the figures of the German page (`investigations/map-data.md`)

#### Scenario: A selection in French

- **WHEN** a visitor opens `/fr/votes/5960/` and moves the upper bound of the share of foreigners
  to step 327, as the `limits` capability's scenarios do on `/votes/5960/`
- **THEN** the page shows the same count of remaining municipalities, the same municipalities in
  dark grey and the same result of the selection as the German page, in French

### Requirement: The address without a language

The site's address without a language (`/`) SHALL open the start page in the first of German,
French and Italian among the browser's preferred languages, in their order, a language counting
by its first part ("fr-CH" is French). With none of them, or without scripts, it SHALL open the
German one. The choice SHALL NOT be stored.

#### Scenario: A browser that prefers French

- **WHEN** a browser whose preferred language is "fr-CH" opens `/`
- **THEN** it shows `/fr/`

#### Scenario: The first of the three among the preferred languages

- **WHEN** a browser that prefers "en-US", then "it-CH", then "de-CH" opens `/`
- **THEN** it shows `/it/`

#### Scenario: A browser that prefers none of the three

- **WHEN** a browser whose only preferred language is "en-US" opens `/`
- **THEN** it shows `/de/`

#### Scenario: A browser without scripts

- **WHEN** a browser that runs no scripts and prefers "fr-CH" opens `/`
- **THEN** it shows `/de/`

#### Scenario: The choice is not remembered

- **WHEN** a browser that prefers "de-CH" opens `/`, follows "Italiano", and then opens `/` again
- **THEN** it shows `/de/`

### Requirement: The addresses of before

The addresses of the pages before this change, `/votes/<id>/` for every vote of the list and
`/guide/`, with or without the final slash, SHALL open that page in the language chosen as for
the address without a language. Any other address without a language that names no page SHALL
be answered with the status 404, as the `publishing` capability says.

#### Scenario: A vote's old address in a browser that prefers Italian

- **WHEN** a browser that prefers "it-CH" opens `/votes/5960/`
- **THEN** it shows `/it/votes/5960/`

#### Scenario: Without the final slash

- **WHEN** a browser that prefers "fr-CH" opens `/votes/5960`
- **THEN** it shows `/fr/votes/5960/`

#### Scenario: The guide's old address without scripts

- **WHEN** a browser that runs no scripts opens `/guide/`
- **THEN** it shows `/de/guide/`

#### Scenario: A vote that does not exist

- **WHEN** a browser opens `/votes/9999/`
- **THEN** the answer has the status 404

### Requirement: Changing the language

At its top, every page SHALL name the three languages in their own words, in this order:
"Deutsch", "Français", "Italiano". The two others SHALL link to the same page in them; the page's
own SHALL NOT be a link. A link SHALL open that page anew: limits, the municipality clicked and
the map's view are not carried over.

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

#### Scenario: A selection stays behind

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Ausländeranteil", moves its upper bound
  to step 327, and follows "Italiano"
- **THEN** `/it/votes/5960/` shows no limit, no result of a selection and no municipality in
  dark grey

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
- **THEN** the entry of the vote 5960 shows "rejeté, 49.16% de oui" and "respinto, 49.16% di sì"
- **AND** the entry of the vote 6790 shows "accepté, 50.39% de oui" and "accettato, 50.39% di sì"

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

### Requirement: The vote's texts in the page's language

Every page SHALL show a vote's title, reference and note in the page's language. They come from
the list of votes (`vote-data`: the BFS's titles and the Chancellery's references and notes, on
the list of 2026-01-01, written by the pipeline's `update`). A text missing in the page's
language SHALL fail the build, naming the vote and the language.

#### Scenario: The annulled vote in French

- **WHEN** a visitor opens `/fr/votes/5960/`
- **THEN** it shows "Source: FF 2019 4421" and, under "Note de la Chancellerie fédérale", the note
  that begins "Par arrêts du 10 avril 2019"

#### Scenario: The annulled vote in Italian

- **WHEN** a visitor opens `/it/votes/5960/`
- **THEN** its heading is "Iniziativa popolare «Per il matrimonio e la famiglia - No agli
  svantaggi per le coppie sposate»", and it shows "Fonte: FF 2019 3843" and, under "Nota della
  Cancelleria federale", the note that begins "Con sentenze del 10 aprile 2019"

#### Scenario: A title as the BFS gives it

- **WHEN** a visitor opens `/it/votes/6823/`
- **THEN** its heading is the BFS's title "Iniziativa denaro contante e controprogetto: domanda
  sussidiaria", and its kind is the Constitution's "Domanda risolutiva" (`investigations/
  languages.md`, 1)

#### Scenario: A title missing in one language

- **GIVEN** a list of votes whose vote 5960 has no Italian title
- **WHEN** the site is built
- **THEN** the build fails and names the vote 5960 and Italian

### Requirement: Places keep their names

In every language a municipality SHALL be named as the register of municipalities of 2026-01-01
names it (the pipeline's `update` writes the list from the BFS register), and a canton by its
abbreviation. No name of a place SHALL be translated.

#### Scenario: A municipality with two names

- **WHEN** a visitor opens `/it/votes/5960/` and `/fr/votes/5960/` and points at the municipality
  371
- **THEN** both show "Biel/Bienne (BE)", as the German page does

#### Scenario: The cantons in the table

- **WHEN** a visitor opens `/fr/votes/5960/` and `/it/votes/5960/`
- **THEN** the table of the cantons lists the abbreviations "ZH", "BE", "LU", … "JU" in the order
  of the German page
