# Design

## Context

`startLead` writes one paragraph, `.lead`, three sentences. After `tidy-after-review` the sentence
at the limits no longer says that a selection is not a forecast; the guide's section "Was die
Auswahl nicht zeigt" still does ("Die Auswahl ist keine Prognose.").

## Goals / Non-Goals

**Goals:** the wording Q asked for, in three languages.

**Non-Goals:** any other text.

## Decisions

### 1. Two paragraphs in one block (Q's wording, Claude's layout)

`startLead` keeps the first two sentences; a new text, `START_NOTE`, holds "Ein
Gedankenexperiment." The page writes both as paragraphs inside the `.lead` block, the second
directly below the first without the gap between paragraphs. Alternative: a `<br>` inside one
paragraph (its text would read "berechnet.Ein" to assistive technology and to a test of the
text).

### 2. French and Italian follow

"Une expérience de pensée." and "Un esperimento mentale.", the words the lead already used.

## Risks / Trade-offs

- The start page no longer says "keine Prognose". → The guide says it, linked from the head of
  every page.
