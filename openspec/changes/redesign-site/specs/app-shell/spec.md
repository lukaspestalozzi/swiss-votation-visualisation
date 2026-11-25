# Spec Delta

## MODIFIED Requirements

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
