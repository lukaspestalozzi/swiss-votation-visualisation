# Spec Delta

## MODIFIED Requirements

### Requirement: Every page fits a window 360 pixels wide

Every page of the site, in each of the three languages, SHALL be no wider than its window when
the window is 360 pixels wide or wider, so that it neither scrolls sideways nor shrinks. A word
too long for its line SHALL be broken within the word. Where a result has less than 448 pixels,
its outcome and its two majorities SHALL stand one below the other, each bar as wide as the
result. A window narrower than 360 pixels is not supported: a page may be wider than it.

#### Scenario: The longest word of a title

- **WHEN** a visitor opens `/de/votes/6400/` in a window 360 pixels wide
- **THEN** the page is no wider than the window, and its heading holds the whole title with
  "Wirtschaftspartnerschaftsabkommens", the longest word of a title, which made the page 532
  pixels wide (`investigations/small-screens.md`, 1)

#### Scenario: The verdicts in Italian

- **WHEN** a visitor on a touch screen 360 pixels wide opens `/it/votes/5960/`, adds the limit
  "Quota di stranieri", moves its upper bound to step 327 and taps Zürich
- **THEN** the page is no wider than the window, and "Maggioranza del popolo" stands above
  "Maggioranza dei Cantoni", for the vote and under "Con la Sua selezione", each of their bars
  328 pixels wide, give or take 1 (`investigations/redesign.md`, 6)

#### Scenario: The other pages

- **WHEN** a visitor opens, in a window 360 pixels wide, the start page, the guide, the comparison
  with two votes and a selection, and the page of the tie-break question `votes/6823/`, in each of
  the three languages, and `/fr/votes/5960/`
- **THEN** no page is wider than the window

### Requirement: Controls for a finger

On a touch screen, a screen whose main pointer is a finger, each of these controls SHALL offer at
least 44 × 44 pixels on which a tap acts on it: the map's "+", "−" and "Ganze Schweiz"; "Merkmal
hinzufügen", each characteristic of its list and "Schliessen"; each "Entfernen" and "Zurück zum
echten Ergebnis"; the switch for the Swiss abroad with its text; each thumb of a limit's sliders;
and the start page's search field and its three buttons.

#### Scenario: The controls on a phone

- **WHEN** a visitor on a touch screen 412 pixels wide opens `/de/votes/5960/`, adds the limit
  "Ausländeranteil" and moves its upper bound to step 327
- **THEN** each of the vote page's controls named is at least 44 pixels wide and 44 pixels tall,
  where they were 13 to 24 pixels tall (`investigations/small-screens.md`, 5)

#### Scenario: A thumb beside the finger

- **WHEN** that visitor presses 20 pixels to the left of the centre of the upper bound's thumb and
  moves 100 pixels to the left
- **THEN** the upper bound follows to a step below 327, and the lower bound stays at step 0

#### Scenario: The list of characteristics on a phone

- **WHEN** that visitor taps "Merkmal hinzufügen"
- **THEN** each characteristic of the list and "Schliessen" is at least 44 pixels wide and 44
  pixels tall, and the list is no wider than the window

#### Scenario: The start page's controls on a phone

- **WHEN** a visitor on a touch screen 412 pixels wide opens `/de/`
- **THEN** the search field, "Alle", "Angenommen" and "Abgelehnt" are each at least 44 pixels wide
  and 44 pixels tall

### Requirement: The selection's result at the bottom of a narrow window

In a window narrower than 640 pixels, while a selection applies (the `limits` capability) and
its result "Mit Ihrer Auswahl" does not lie wholly within the window, a bar at the bottom of the
window SHALL show "Mit Ihrer Auswahl: <outcome>" and "Volksmehr: <word> · Ständemehr: <word>",
with that result's outcome and verdict words, following every step as it does. Otherwise there
SHALL be no bar. The bar SHALL hide no part of the page.

#### Scenario: While dragging on a phone

- **WHEN** a visitor opens `/de/votes/5960/` in a window 412 pixels wide, adds the limit
  "Ausländeranteil", moves its upper bound to step 327 and keeps the slider in the middle of the
  window
- **THEN** a bar at the bottom of the window shows "Mit Ihrer Auswahl: Angenommen" and
  "Volksmehr: Ja · Ständemehr: Ja" (`investigations/limits.md`, 5)

#### Scenario: A majority that is not needed

- **WHEN** a visitor opens `/de/votes/5950/` in a window 412 pixels wide, switches the Swiss
  abroad off and scrolls until the switch is in the middle of the window
- **THEN** the bar shows "Mit Ihrer Auswahl: Abgelehnt" and "Volksmehr: Nein · Ständemehr: nicht
  nötig" (`investigations/limits.md`, 5)

#### Scenario: In French

- **WHEN** a visitor opens `/fr/votes/5960/` in a window 412 pixels wide, adds the limit "Part des
  étrangers", moves its upper bound to step 327 and keeps the slider in the middle of the window
- **THEN** the bar shows "Avec votre sélection: Accepté" and "Majorité du peuple: Oui · Majorité
  des cantons: Oui"

#### Scenario: The box in view

- **WHEN** that visitor on `/de/votes/5960/` scrolls back until the result "Mit Ihrer Auswahl"
  lies wholly within the window
- **THEN** there is no bar

#### Scenario: The end of the page

- **WHEN** that visitor scrolls to the end of the page
- **THEN** the bar is shown, and the page's last line lies above it

#### Scenario: No selection, or a wide window

- **WHEN** that visitor presses "Zurück zum echten Ergebnis", or a visitor does the same as in
  "While dragging on a phone" in a window 1,280 pixels wide
- **THEN** there is no bar
