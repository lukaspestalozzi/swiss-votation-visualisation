# Spec Delta

## MODIFIED Requirements

### Requirement: The real result

The section "Das echte Ergebnis" SHALL say that the figures and the verdicts at the top of a vote's
page are the official result, calculated from the figures of the municipalities by the rules of
the Federal Constitution, and that a recalculated result appears below them, under "Mit Ihrer
Auswahl", only while municipalities are selected.

#### Scenario: The official result first

- **WHEN** a visitor opens `/guide/`
- **THEN** the section "Das echte Ergebnis" says "Oben auf der Seite einer Abstimmung steht ihr
  amtliches Ergebnis."

#### Scenario: Where the selection's result stands

- **WHEN** a visitor opens `/de/guide/`, `/fr/guide/` and `/it/guide/`
- **THEN** the section says that the second result stands below the first: in German "Erst wenn
  Sie Gemeinden auswählen, steht darunter ein zweites, neu berechnetes Ergebnis: «Mit Ihrer
  Auswahl».", and neither "daneben", "à côté" nor "accanto"
