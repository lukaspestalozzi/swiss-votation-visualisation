## MODIFIED Requirements

### Requirement: The sentence at the limits

At the top of the section "Gemeinden auswählen" (the `limits` capability), the page of a vote
SHALL say "Ein Gedankenexperiment: So wäre die Abstimmung ausgegangen, wenn nur die ausgewählten
Gemeinden abgestimmt hätten.", followed by the link "Lesehilfe und Quellen" to `/guide/`, and
nothing more before the count of the municipalities that remain. That a selection shows neither
how individual people voted nor a forecast SHALL stay in the section "Was die Auswahl nicht
zeigt" of the guide.

#### Scenario: The sentence on a vote's page

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the section "Gemeinden auswählen" begins with that sentence and the link "Lesehilfe
  und Quellen", which opens `/guide/`
- **AND** it does not say "Es zeigt nicht, wie einzelne Menschen gestimmt haben"

#### Scenario: The sentence in French and Italian

- **WHEN** a visitor opens `/fr/votes/5960/` and `/it/votes/5960/`
- **THEN** the section begins with "Une expérience de pensée : voici l'issue qu'aurait eue la
  votation si seules les communes choisies avaient voté." (a no-break space before the colon, the
  `interface-languages` capability) and "Un esperimento mentale: ecco come sarebbe andata la
  votazione se avessero votato soltanto i Comuni scelti.", each followed by the link to the guide
