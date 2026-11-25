# Spec Delta

## MODIFIED Requirements

### Requirement: The place of the selection's result

Until a selection applies, the page of a vote the calculation judges SHALL say, where the
selection's result will stand: "Sobald Sie bei einem Merkmal eine Grenze setzen, steht hier das
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
