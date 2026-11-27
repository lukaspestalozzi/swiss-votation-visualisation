# Spec Delta

## MODIFIED Requirements

### Requirement: The vote's texts in the page's language

Every page SHALL show a vote's title, reference, note, summary and the address of
its explanations in the page's language. They come from the list of votes (`vote-data`: the
BFS's titles, the Chancellery's references and notes, and the site's summaries and the addresses of
the Federal Council's explanations from `pipeline/vote-summaries.json`, on the list of
2026-01-01, written by the pipeline's `update`). A text missing in the page's language SHALL
fail the build, naming the vote and the language.

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

#### Scenario: A summary of what a vote is about missing in one language

- **GIVEN** a list of votes whose vote 5960 has no French summary of what it is about
- **WHEN** the site is built
- **THEN** the build fails and names the vote 5960 and French
