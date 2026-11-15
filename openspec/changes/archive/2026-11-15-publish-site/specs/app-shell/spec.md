# Spec Delta

## MODIFIED Requirements

### Requirement: The site is a set of static files

The build SHALL produce a directory of files that a static file server can serve as they are,
under the path `/swiss-votation-visualisation/`, the path of the site's public address. A browser
that opens that path SHALL be shown the start page. Every address the specs name, such as
`/votes/5960/` or `/data/votes/`, is under that path. No server-side code, no database and no
login SHALL be needed to show it.

#### Scenario: The built files are served by a static file server

- **GIVEN** the build has produced its directory of files
- **WHEN** a static file server serves that directory under the path
  `/swiss-votation-visualisation/` and a browser opens that path
- **THEN** the server answers with the start page, and the browser shows the heading "Popular
  Vote Explorer"
