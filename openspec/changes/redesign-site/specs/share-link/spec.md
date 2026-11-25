# Spec Delta

## MODIFIED Requirements

### Requirement: The budget of a link

Each frame the browser draws after a link to the vote is opened in the tab that shows it SHALL
take at most 250 ms of work on the page's main thread, as it makes up to 35 tracks at once, and
at most 150 ms for a link with up to 21 limits, three times a jump's budget in the `limits`
capability. The browser tests measure it as they measure the limits' budget, and once more when
a frame exceeds it.

#### Scenario: All 21 limits in the same tab

- **WHEN** the browser tests open `/de/votes/5960/`, wait until the characteristics have loaded,
  and open in the same tab a link to it with the 21 limits the site had before it had 35, each
  narrowed on both sides
- **THEN** no frame after the hash changed took more than 150 ms of work on the main thread, in
  the first measurement or, when a frame exceeded it, in the second

#### Scenario: All 35 limits in the same tab

- **WHEN** the browser tests open `/de/votes/5960/`, wait until the characteristics have loaded,
  and open in the same tab a link to it with all 35 limits, each narrowed on both sides
- **THEN** no frame after the hash changed took more than 250 ms of work on the main thread, in
  the first measurement or, when a frame exceeded it, in the second
