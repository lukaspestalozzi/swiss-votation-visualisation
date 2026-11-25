# Spec Delta

## MODIFIED Requirements

### Requirement: The selection's result while a limit is set on a phone

On a phone held upright, in a window at least 700 pixels high, the result "Mit Ihrer Auswahl" and
the sliders of the first limit SHALL lie within one window, the limits standing between the result
and the map (the `limits` capability). A lower window, or a phone held wide, is not held to it.

#### Scenario: The result and the first limit in one window

- **WHEN** a visitor opens `/de/votes/5960/`, `/fr/votes/5960/` and `/it/votes/5960/` on a phone
  360 by 700 pixels, adds the limit "Einwohner" ("Habitants", "Abitanti"), moves its lower bound
  to step 50, and scrolls until "Mit Ihrer Auswahl" ("Avec votre sélection", "Con la Sua
  selezione") lies with its top edge at the top of the window
- **THEN** both sliders of that limit lie wholly within the window
  (`investigations/redesign.md`, "Found after the merge": at most 666 pixels needed)
