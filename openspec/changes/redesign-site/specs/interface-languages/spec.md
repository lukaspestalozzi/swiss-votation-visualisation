# Spec Delta

## MODIFIED Requirements

### Requirement: The switch between the languages

At its top, every page SHALL name the three languages in their own words, in this order:
"Deutsch", "Français", "Italiano"; in a window narrower than 640 pixels as "DE", "FR" and "IT",
each named with its word for assistive technology. The two others SHALL link to the same page in
them; the page's own SHALL NOT be a link. A link SHALL open that page anew, with the
selection the page's address holds (the `share-link` capability): the municipality clicked and the
map's view are not carried over.

#### Scenario: From German to French

- **WHEN** a visitor on `/de/votes/5960/` follows "Français"
- **THEN** the browser shows `/fr/votes/5960/`, whose language is "fr" and whose heading is
  "Initiative populaire «Pour le couple et la famille - Non à la pénalisation du mariage»"
- **AND** a server that does not add the final slash shows the same page at `/fr/votes/5960`, as
  the `verdicts` capability's "A vote's address without the final slash" says

#### Scenario: The switch on the start page and the guide

- **WHEN** a visitor opens `/it/` and `/it/guide/`
- **THEN** each names "Deutsch", linked to `/de/` and `/de/guide/`, "Français", linked to `/fr/`
  and `/fr/guide/`, and "Italiano", which is not a link

#### Scenario: A selection goes along

- **WHEN** a visitor on `/de/votes/5960/` clicks Zürich on the map, adds the limit
  "Ausländeranteil", moves its upper bound to step 327, waits a second and follows "Italiano"
- **THEN** the browser shows `/it/votes/5960/#foreigners=-19.98`, with the limit "Quota di
  stranieri (fine 2015): da 0.00% a 19.98%" and "Con la Sua selezione"
- **AND** no municipality is outlined on the map, and the panel of characteristics shows no
  municipality

#### Scenario: The switch in a narrow window

- **WHEN** a visitor opens `/de/votes/5960/` in a window 360 pixels wide
- **THEN** the switch writes "DE", "FR" and "IT"; "FR" is a link named "FR – Français" for
  assistive technology, which leads to `/fr/votes/5960/`; and "DE" is not a link
