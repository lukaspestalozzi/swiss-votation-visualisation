# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: The start page links to the guide`
- TO: `### Requirement: Every page links to the guide`

## MODIFIED Requirements

### Requirement: Every page links to the guide

Every page under `/de/`, `/fr/` and `/it/` SHALL link to the guide from its head, with the
guide's name "Lesehilfe" (the `site-style` capability, "The head of every page"); on the guide
itself the name is not a link. The start page SHALL show no other link to the guide below its
heading.

#### Scenario: From the start page

- **WHEN** a visitor opens the start page and follows "Lesehilfe" in its head
- **THEN** the page "Lesehilfe" opens
- **AND** the start page shows no link "Lesehilfe und Quellen"

#### Scenario: From a vote's page

- **WHEN** a visitor opens `/votes/5960/` and follows "Lesehilfe" in its head
- **THEN** the page "Lesehilfe" opens
