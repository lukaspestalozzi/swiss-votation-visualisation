# Spec Delta

## MODIFIED Requirements

### Requirement: A municipality without a result

A municipality that the vote's file names as without a result SHALL be hatched with grey
diagonal lines on the page's ground, white, or `#121212` in the dark scheme (the `site-style`
capability), and SHALL take no colour of a class.

#### Scenario: The municipalities without a result in 2016

- **WHEN** a visitor opens `/votes/5960/`
- **THEN** the seven municipalities the vote's file names as without a result, among them 389
  Meienried, are hatched, and no other municipality is

#### Scenario: Hatched in the dark scheme

- **WHEN** a visitor whose browser prefers a dark colour scheme opens `/votes/5960/`
- **THEN** 389 Meienried is hatched with grey lines on `#121212`

## ADDED Requirements

### Requirement: The map in the dark scheme

When the browser prefers a dark colour scheme (the `site-style` capability), the map SHALL keep
its colours, the set-aside grey and the outline of the municipality last clicked or tapped among
them, and the borders between municipalities SHALL take the page's ground, `#121212`, as they
take white in the light scheme. The set-aside grey `#2c2c2c` lies 11.1 apart from that ground
(Delta E, OKLab times 100), also for a red-green colour vision deficiency
(`investigations/site-style.md`, 4).

#### Scenario: A selection on a dark map

- **WHEN** a visitor whose browser prefers a dark colour scheme opens `/de/votes/5960/`, moves the
  upper bound of "Ausländeranteil" to step 327 and clicks Zürich
- **THEN** 261 Zürich is filled with `#2c2c2c` and outlined black on white, 1 Aeugst am Albis
  keeps `#fbbea3`, and the borders between municipalities are `#121212`
  (`investigations/limits.md`, 3)

#### Scenario: The colours of the classes stay

- **WHEN** a visitor whose browser prefers a dark colour scheme opens `/votes/5960/`
- **THEN** 261 Zürich is filled with `#e5946f`, 351 Bern with `#c2673b` and 946 Wachseldorn with
  `#009c86`, as in the light scheme (`investigations/map-data.md`)
