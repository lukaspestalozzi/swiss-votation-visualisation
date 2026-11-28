# Proposal

## Why

Q asked on 2026-11-28, in a comment on the preview of the start page, to drop ", keine Prognose."
from its lead and to set "Ein Gedankenexperiment." on a line of its own.

## What Changes

- The start page's lead ends with "Karte und Ergebnis werden sofort neu berechnet."; below it,
  on a line of its own, "Ein Gedankenexperiment." In French "Une expérience de pensée.", in
  Italian "Un esperimento mentale."
- "Keine Prognose" stays where the guide explains it ("Was die Auswahl nicht zeigt").

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `vote-list`: the start page's sentence on what a visitor can do, and its line of its own.

## Impact

- `app/src/lib/texts/` (the lead in three languages and the new line), the start page's Svelte
  file, `app/e2e/vote-list.spec.ts`, `app/src/lib/texts/texts.test.ts`.
- No dependency, no data.

This change is off-roadmap: a wording Q asked for on the preview. It gets its own row in
`docs/roadmap.md`.

## Non-goals

- No other text of the start page or the guide changes.
