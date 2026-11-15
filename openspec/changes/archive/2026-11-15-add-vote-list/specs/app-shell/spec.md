# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: The start page shows the cantons and their cantonal votes

**Reason**: The start page now shows the list of the votes (capability `vote-list`, change
`add-vote-list`). The table of the 26 cantons was the visible result of the skeleton (#1).

**Migration**: The cantons and their cantonal votes stay specified in `result-calculation`
("The cantons and their cantonal votes"); each vote's page shows them with their outcome
(capability `verdicts`, "The table of the cantons").
