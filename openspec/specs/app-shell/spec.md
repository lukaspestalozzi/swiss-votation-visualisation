# app-shell Specification

## Purpose

The site a visitor opens in the browser: a set of static files that shows its start page without
a server of its own and loads everything it needs from the place it is served from.

## Requirements

### Requirement: The site is a set of static files

The build SHALL produce a directory of files that a static file server can serve as they are,
under the path `/swiss-votation-visualisation/`, the path of the site's public address. A browser
that opens that path SHALL be shown the start page in its language, as the `interface-languages`
capability says. Every address the specs name, such as `/de/votes/5960/` or `/data/votes/`, is
under that path. No server-side code, no database and no login SHALL be needed to show it.

#### Scenario: The built files are served by a static file server

- **GIVEN** the build has produced its directory of files
- **WHEN** a static file server serves that directory under the path
  `/swiss-votation-visualisation/` and a browser that prefers "de-CH" opens that path
- **THEN** the browser shows the start page `/de/`, with the heading "Wie hätte die Schweiz
  abgestimmt, wenn nur ein Teil der Gemeinden an die Urne gegangen wäre?"

### Requirement: The page requests nothing from other servers

Everything a page of the site needs at run time (markup, scripts, styles, fonts, images and
data) SHALL be served from the same origin as the page. No page SHALL send any request to
another origin, neither while it loads nor afterwards. This holds for the start page and for the
page of every vote.

#### Scenario: All requests go to the site itself

- **WHEN** a browser opens the start page and waits until the page has stopped loading
- **THEN** every request the browser made for the page went to the origin that serves the page

#### Scenario: A vote's page requests nothing from other servers

- **WHEN** a browser opens the page of the vote of 2016-02-28, number 596, follows the link back
  to the start page, and waits until the page has stopped loading
- **THEN** every request the browser made went to the origin that serves the site

#### Scenario: A resource from another server is caught

- **GIVEN** a version of the page that refers to a stylesheet, a script, a font or an image on
  another origin
- **WHEN** the automated checks run
- **THEN** the browser test fails and names the other origin
