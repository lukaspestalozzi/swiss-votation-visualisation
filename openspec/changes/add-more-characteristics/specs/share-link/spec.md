# Spec Delta

## MODIFIED Requirements

### Requirement: The keys of the characteristics

Each of the 35 characteristics SHALL have one key in the address, the same in every language. A
key SHALL NOT change once a link can hold it: the 21 keys of before stay as they are.

#### Scenario: The keys

- **WHEN** the keys of the characteristics are listed in the order of the panel
- **THEN** they are `inhabitants`, `foreigners`, `born-abroad`, `age-0-17`, `age-18-34`,
  `age-35-49`, `age-50-64`, `age-65`, `density`, `fdp`, `centre`, `sp`, `svp`, `glp`, `greens`,
  `other-parties`, `german`, `french`, `italian`, `romansh`, `reformed`, `catholic`,
  `no-religion`, `higher-education`, `compulsory-education`, `owner-occupied`,
  `single-family-houses`, `jobs`, `primary-sector`, `secondary-sector`, `tertiary-sector`,
  `area`, `cattle`, `farms` and `organic-farmland`

#### Scenario: The keys in French

- **WHEN** a visitor on `/fr/votes/5960/` adds the limits "Habitants" and "Part des étrangers"
  and waits a second
- **THEN** the address is `/fr/votes/5960/#inhabitants=-&foreigners=-`

#### Scenario: A new characteristic in a link

- **WHEN** a visitor on `/de/votes/5960/` adds the limit "Arbeitsplätze je 100 Einwohner", moves
  no bound and waits a second
- **THEN** the address is `/de/votes/5960/#jobs=-`

#### Scenario: A link of before

- **WHEN** a visitor opens `/de/votes/5960/#foreigners=-19.98`, a link the site wrote before it
  had 35 characteristics
- **THEN** the page shows the limit "Ausländeranteil (Ende 2015): von 0.00% bis 19.98%"

### Requirement: The budget of a link

Each frame the browser draws after a link to the vote is opened in the tab that shows it SHALL
take at most 170 ms of work on the page's main thread, as it makes up to 35 tracks at once, and
at most 100 ms for a link with up to 21 limits, twice a jump's budget in the `limits`
capability. The browser tests measure it as they measure the limits' budget, and once more when
a frame exceeds it.

#### Scenario: All 21 limits in the same tab

- **WHEN** the browser tests open `/de/votes/5960/`, wait until the characteristics have loaded,
  and open in the same tab a link to it with the 21 limits the site had before it had 35, each
  narrowed on both sides
- **THEN** no frame after the hash changed took more than 100 ms of work on the main thread, in
  the first measurement or, when a frame exceeded it, in the second

#### Scenario: All 35 limits in the same tab

- **WHEN** the browser tests open `/de/votes/5960/`, wait until the characteristics have loaded,
  and open in the same tab a link to it with all 35 limits, each narrowed on both sides
- **THEN** no frame after the hash changed took more than 170 ms of work on the main thread, in
  the first measurement or, when a frame exceeded it, in the second
