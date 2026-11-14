# Spec Delta

## Purpose

The site a visitor opens in the browser: a set of static files that shows its start page without
a server of its own and loads everything it needs from the place it is served from.

## ADDED Requirements

### Requirement: The site is a set of static files

The build SHALL produce a directory of files that a static file server can serve as they are. A
browser that opens the root address of that server SHALL be shown the start page. No server-side
code, no database and no login SHALL be needed to show it.

#### Scenario: The built files are served by a static file server

- **GIVEN** the build has produced its directory of files
- **WHEN** a static file server serves that directory and a browser opens the root address
- **THEN** the server answers with the start page, and the browser shows the heading "Popular
  Vote Explorer"

### Requirement: The start page shows the cantons and their cantonal votes

The start page SHALL show the working title "Popular Vote Explorer" as its heading and a table
with one row for each of the 26 cantons, in the order and with the values that the
`result-calculation` capability defines. Each row SHALL show the canton's abbreviation and its
number of cantonal votes, written `1` or `0.5`. Below the rows the table SHALL show the total of
the cantonal votes.

#### Scenario: One row for each canton

- **WHEN** a visitor opens the start page
- **THEN** the table has exactly 26 rows of cantons, the first is `ZH` and the last is `JU`

#### Scenario: The six cantons with half a vote

- **WHEN** a visitor opens the start page
- **THEN** the rows of `OW`, `NW`, `BS`, `BL`, `AR` and `AI` each show `0.5`, and each of the
  other 20 rows shows `1`

#### Scenario: The total

- **WHEN** a visitor opens the start page
- **THEN** the table shows `23` as the total of the cantonal votes

### Requirement: The page requests nothing from other servers

Everything the page needs at run time (markup, scripts, styles, fonts, images and data) SHALL be
served from the same origin as the page. The page SHALL NOT send any request to another origin,
neither while it loads nor afterwards.

#### Scenario: All requests go to the site itself

- **WHEN** a browser opens the start page and waits until the page has stopped loading
- **THEN** every request the browser made for the page went to the origin that serves the page

#### Scenario: A resource from another server is caught

- **GIVEN** a version of the page that refers to a stylesheet, a script, a font or an image on
  another origin
- **WHEN** the automated checks run
- **THEN** the browser test fails and names the other origin
