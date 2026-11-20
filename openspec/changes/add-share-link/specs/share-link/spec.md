# Spec Delta

## Purpose

The selection of a vote's page in its address, so that a link, a reload or the language switch
shows the same limits and the same switch for the Swiss abroad.

A link names the characteristics of the `characteristics` capability, which the pipeline's update
command (`pipeline/README.md`) writes to `app/static/data/characteristics.json` from BFS STAT-TAB
tables, the BFS register's correspondences and swisstopo's swissBOUNDARIES3D, on the list of
2026-01-01; its bounds are values of the tracks of the `limits` capability. The figures in the
scenarios are those of `investigations/limits.md` and `investigations/share-link.md`.

## ADDED Requirements

### Requirement: The selection in the address

While a vote's page shows a limit or the switch for the Swiss abroad off, its address SHALL end in
`#` and the selection: each limit in the page's order as `<key>=<lower>-<upper>`, then `abroad=no`
while the switch is off, joined by `&`. A bound SHALL be written as its label writes it, without
unit and apostrophes, and SHALL be empty while its value is its track's end. With no limit and the
switch on, the address SHALL have no `#`.

#### Scenario: A limit

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Ausländeranteil", moves its upper bound
  to step 327, which reads 19.98%, and waits a second
- **THEN** the address is `/de/votes/5960/#foreigners=-19.98`

#### Scenario: Two limits and the switch

- **WHEN** the visitor then adds the limit "Einwohner", moves its lower bound to step 500, which
  reads 3'508, switches the Swiss abroad off and waits a second
- **THEN** the address is `/de/votes/5960/#foreigners=-19.98&inhabitants=3508-&abroad=no`

#### Scenario: A limit that sets nothing aside

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Ausländeranteil" and waits a second
- **THEN** the address is `/de/votes/5960/#foreigners=-`

#### Scenario: Back to the real result

- **WHEN** the visitor then presses "Zurück zum echten Ergebnis" and waits a second
- **THEN** the address is `/de/votes/5960/`

#### Scenario: Nothing is sent

- **WHEN** a visitor makes a selection on `/de/votes/5960/` and reloads the page
- **THEN** no request of the page carries the selection

### Requirement: The keys of the characteristics

The key of a characteristic in the address SHALL be the same in every language: `inhabitants`,
`foreigners`, `age-0-17`, `age-18-34`, `age-35-49`, `age-50-64`, `age-65`, `density`, `fdp`,
`centre`, `sp`, `svp`, `glp`, `greens`, `other-parties`, `german`, `french`, `italian`,
`romansh`, `area` and `cattle`, for the 21 characteristics in the order of the panel.

#### Scenario: The keys in French

- **WHEN** a visitor on `/fr/votes/5960/` adds the limits "Habitants" and "Part des étrangers"
  and waits a second
- **THEN** the address is `/fr/votes/5960/#inhabitants=-&foreigners=-`

### Requirement: The address follows the selection

The address SHALL take the selection once the selection has stayed the same for 500 ms, whatever
changed it: a step of a slider, adding or removing a limit, the switch, or "Zurück zum echten
Ergebnis". It SHALL replace the history's entry and add none, and it SHALL NOT change while the
selection keeps changing within 500 ms.

#### Scenario: A held key

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Ausländeranteil", focuses its upper
  bound and presses the left arrow key 100 times, one press every 33 ms
- **THEN** the page changed its address once, after the last press, to
  `/de/votes/5960/#foreigners=-54.99`, the value of step 900

#### Scenario: Back leaves the page

- **WHEN** a visitor opens `/de/`, follows "Volksinitiative «Für Ehe und Familie - gegen die
  Heiratsstrafe»", adds a limit, moves a bound, waits a second and goes back
- **THEN** the browser shows `/de/`

### Requirement: Opening a link

When a vote's page opens with a selection in its address, it SHALL apply that selection once the
characteristics have loaded: each limit in the address's order, each bound at the step whose value
is nearest the address's, of two the lower, an empty bound at its track's end, and the switch off
for `abroad=no`; then the address takes the selection as the page writes it. A bound MAY have
fewer decimals than its label writes. Until the characteristics have loaded, the address stays.

#### Scenario: A link

- **WHEN** a visitor opens `/de/votes/5960/#foreigners=-19.98`
- **THEN** the page shows the limit "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%", "Mit
  Ihrer Auswahl" with the yes share 52.47%, and "In der Auswahl: 1'455 von 2'103 Gemeinden mit
  eigenem Ergebnis." (`investigations/limits.md`, 5)

#### Scenario: A value no step has

- **WHEN** a visitor opens `/de/votes/5960/#foreigners=-20&inhabitants=3000-`
- **THEN** the page shows "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%", step 327, whose
  value lies 0.02 from 20.00 and step 328's 0.04, and "Einwohner (Ende 2015): von 2'987 bis
  396'955", step 483 (`investigations/share-link.md`, 5)
- **AND** a second later the address is `/de/votes/5960/#foreigners=-19.98&inhabitants=2987-`

#### Scenario: A reload

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Ausländeranteil", moves its upper bound
  to step 327, switches the Swiss abroad off, waits a second and reloads the page
- **THEN** the page shows the same limit, the switch off and the same result of the selection

#### Scenario: The characteristics cannot be loaded

- **GIVEN** a browser in which every request for `data/characteristics.json` fails
- **WHEN** a visitor opens `/de/votes/5960/#foreigners=-19.98`
- **THEN** the section shows "Ohne die Merkmale lassen sich keine Gemeinden auswählen.", the page
  shows the vote's own result and no "Mit Ihrer Auswahl", and the address stays as it was opened

### Requirement: A link in the same tab

When the address's part after `#` changes from outside the page, as when a link to the vote is
opened in the tab that shows it, the page SHALL replace its selection by the address's, as when
it opens.

#### Scenario: Another link to the same vote

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Einwohner", waits a second, and then
  opens `/de/votes/5960/#foreigners=-19.98` in the same tab
- **THEN** the page shows the limit "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%" and no
  limit "Einwohner", without loading the page again

### Requirement: The parts a link cannot use

The page SHALL apply the parts of the address it can use, and below the sentence that begins the
section "Gemeinden auswählen" SHALL say "Diese Angaben der Adresse liessen sich nicht anwenden:"
followed by the others, each as `<key>=<value>` in « », separated by commas: an unknown key, a key
given a second time, a bound that is no number or has more decimals than its label, a lower bound
above the upper, and `abroad` with any value but `no`.

#### Scenario: An unknown characteristic

- **WHEN** a visitor opens `/de/votes/5960/#rainfall=1-2&foreigners=-19.98`
- **THEN** the page shows the limit "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%" and says
  "Diese Angaben der Adresse liessen sich nicht anwenden: «rainfall=1-2»."

#### Scenario: Bounds that cannot be used

- **WHEN** a visitor opens `/de/votes/5960/#foreigners=30-20&inhabitants=1'000-&abroad=yes`
- **THEN** the page shows no limit, the switch on, and says "Diese Angaben der Adresse liessen
  sich nicht anwenden: «foreigners=30-20», «inhabitants=1'000-», «abroad=yes»."

#### Scenario: A characteristic twice

- **WHEN** a visitor opens `/de/votes/5960/#foreigners=-19.98&foreigners=10-`
- **THEN** the page shows one limit, "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%", and
  names «foreigners=10-»

### Requirement: The sentence goes with the next change

The sentence of the parts a link cannot use SHALL stay until the visitor next changes the
selection, and SHALL then go.

#### Scenario: Adding a limit

- **WHEN** a visitor opens `/de/votes/5960/#rainfall=1-2` and adds the limit "Einwohner"
- **THEN** the page no longer says "Diese Angaben der Adresse liessen sich nicht anwenden:"

### Requirement: A tie-break question ignores the address

The page of a tie-break question SHALL show the same whatever follows `#` in its address, and
SHALL NOT change its address.

#### Scenario: A link to a tie-break question

- **WHEN** a visitor opens `/de/votes/6823/#foreigners=-19.98` and waits a second
- **THEN** the page shows what `/de/votes/6823/` shows, and the address is still
  `/de/votes/6823/#foreigners=-19.98`

### Requirement: The budget of a link

Each frame the browser draws after a link to the vote is opened in the tab that shows it SHALL
take at most 100 ms of work on the page's main thread, twice a jump's budget in the `limits`
capability, as it makes up to 21 tracks at once. The browser tests measure it as they measure the
limits' budget, and once more when a frame exceeds it.

#### Scenario: All 21 limits in the same tab

- **WHEN** the browser tests open `/de/votes/5960/`, wait until the characteristics have loaded,
  and open in the same tab a link to it with all 21 limits, each narrowed on both sides
- **THEN** no frame after the hash changed took more than 100 ms of work on the main thread, in
  the first measurement or, when a frame exceeded it, in the second
