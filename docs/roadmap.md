# Roadmap

Ordered list of planned OpenSpec changes. Each row becomes one change under `openspec/changes/`
(proposal → review → apply → verify → archive). Open decisions are asked in the change's
`design.md` before it is applied. The change and capability names are drafts until the change is
proposed.

| # | Change | Capabilities | Scope | Open decisions | Status |
|---|--------|--------------|-------|----------------|--------|
| 1 | `add-project-skeleton` | app-shell (new), build-checks (new), result-calculation (new) | The build of the static app (Svelte 5 and SvelteKit 3 with the static adapter, TypeScript 6) in a pnpm workspace on Node 24; the three modules as `calculation/`, `app/` and `pipeline/`, with their allowed dependencies enforced by the static analysis; the CI `build` job and the same steps in `scripts/verify-local.sh` (formatting, lint, static analysis, unit tests, build, browser tests), with `--quick` running the unit tests; the dependencies installed by the cloud hook; one visible result in the browser, the 26 cantons with their 23 cantonal votes, with everything the page needs served with it | None left: the archived change's `design.md` records each decision with the alternatives considered. The pipeline's toolchain moved to #3 | done, archived 2026-11-14 |
| 2 | `add-result-calculation` | result-calculation | The calculation module, without data loading and without a screen. From the entries that remain (a municipality, or the Swiss abroad of a canton that counts them apart): the yes votes, the valid votes and the yes share; the cantonal votes, built on the cantons and their half votes that #1 specified, with a canton whose yes and no votes are equal counted as voting no, and no vote for a canton that has no entry left; both majorities, a tie of cantonal votes being a rejection; the majorities a vote needs by its kind, for six kinds: a popular initiative voted on together with a counter-proposal and that counter-proposal are judged like any vote that needs both majorities, their tie-break question is not calculated; the verdict, failed when nothing remains. An entry that cannot be counted is an error. Tested against the official results of seven named votes with all their municipal entries | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-14 |
| 3 | `add-vote-data` | vote-data (new), municipalities (new), build-checks | The pipeline's first data, in Python with polars, run by uv. For every national vote since 2013 with a complete result: its date, its titles in German, French and Italian, its kind (the six of the calculation), and its official result, the Federal Chancellery's once validated and the Federal Statistical Office's until then, marked; per entry (a municipality, or the Swiss abroad of a canton) the registered voters, ballots cast, valid ballots, yes and no votes, under the canton it voted in; one list of municipalities for all votes, the one the BFS files state (2026-01-01), each municipality counted once and the ones without a result named per vote; the input checked where it enters the pipeline; the entries summing to the BFS's figures and to the official result, the one known difference named; a unit test that runs the calculation over every vote; the data files committed in `app/static/data/`; one command, run by hand, that adds a new vote day; the pipeline's checks in CI, in `scripts/verify-local.sh` and in the cloud hook | None left: the archived change's `design.md` records each decision with the alternatives considered | done, archived 2026-11-15 |
| 4 | `add-vote-list` | vote-list (new), verdicts (new) | The first screen. The national votes grouped by year, each with its date and official result; choosing one shows its result with the two verdicts side by side, the majority of voters and the majority of cantons, each marked as passed or failed; the result comes from the calculation module and the vote data and equals the official one | How a vote that needs only the majority of voters shows the majority of cantons, the language of the interface and of the titles until #9 | planned |
| 5 | `publish-site` | publishing (new) | The built site is published to static hosting from CI at a public address, so that the changes after it can be looked at there, on a phone too | The hosting target, the address, whether pull requests get a preview before they are merged | planned |
| 6 | `add-result-map` | result-map (new), municipalities | The map of the chosen vote: one colour per municipality by how strongly it said yes or no (shades of green for yes, shades of red for no), with the cantons and the lakes, on the one list of municipalities of the data (#3); zoom and move; pointing at a municipality shows its name and its result for this vote. The pipeline produces the map data | How the map is drawn, the source and the level of detail of the map data, how the map data follows the municipality mergers, the colour scale | planned |
| 7 | `add-characteristics` | characteristics (new), result-map | The pipeline's second data. The predecessor's characteristics for every municipality: inhabitants, age groups, share of foreigners, population density; the strength of FDP, CVP, SP, SVP, GLP, GPS and the other parties; the shares of German, French, Italian and Romansh speakers; area; cows per inhabitant. Each characteristic has one definition (name, unit, source, reference date) that everything else uses; the same checks on the input as in #3. Pointing at a municipality also shows its key figures | The sources and which year's figures apply to a vote (first investigation), the age groups, the list of parties over the period (CVP and BDP merged into Die Mitte on 2021-01-01), what a municipality without a figure shows | planned |
| 8 | `add-limits` | limits (new), verdicts, result-map, reading-guide (new) | A lower and an upper limit on every characteristic; a municipality remains only if it lies within all limits at once. Set-aside municipalities turn grey, and the map and both verdicts are recalculated while a limit is dragged, without a button. One step returns to the real result. Every control is labelled in plain words, and its range, its label and its filter come from the same characteristic. The app explains that this is a thought experiment about municipalities, not about people and not a forecast, and it names its sources | The performance budget (hard constraint 3), what a limit does with a municipality that has no figure, the form of the controls, where the explanation and the sources are shown | planned |
| 9 | `add-interface-languages` | interface-languages (new), and the capabilities of the screens | The interface and the vote titles in German, French and Italian | How the three languages are handled, how the language is chosen and which is the default, the source of the vote titles, the names of municipalities and cantons in each language | planned |
| 10 | `add-small-screens` | small-screens (new), and the capabilities of the screens | Usable on a phone: the map, the limits and the verdicts on a small touch screen | The layout, how a municipality's details are read without a pointer, the smallest screen supported | planned |
| 11 | `add-share-link` | share-link (new) | A link reproduces a chosen vote together with all limits | The form of the link, what a link shows when its vote or one of its characteristics no longer exists | planned |
| 12 | `add-vote-comparison` | vote-comparison (new) | The same selection of municipalities applied to two votes side by side | The layout, on a phone too | planned |
| 13 | `add-more-characteristics` | characteristics | More characteristics per municipality than the predecessor had | Which ones (named so far: income, education, religion, urban or rural type) | planned |

v1 = changes #1–#10: the idea of the predecessor done correctly for every national vote since
2013, in German, French and Italian, usable on a phone, and published (user decisions,
2026-11-13 and 2026-11-14). #11–#13 are decided scope and follow after v1. No candidates beyond
them are named yet.

Decided while drafting (user decisions, 2026-11-13 and 2026-11-14):
- **Order.** The rules before the data and the screens (#2 before #3 and #4), so that the
  calculation is tested against official results before the data and the screens depend on it.
  Rejected: the screen first (the map decided before the performance budget is known, and
  verdicts shown before they are tested), and all data first (nothing visible until the fifth
  change).
- **Publishing** is a change of its own, after the first screen (#5). Rejected: with the
  skeleton, as the last change of v1, and after v1.
- **Adding new vote days** is part of #3, and **the reading guide and the sources** are part of
  #8, not changes of their own.
- **The visible result of #1** is the 26 cantons with their cantonal votes. This one fact of #2
  was taken forward, so that the skeleton shows something real and tested; #2 extends the
  requirement. Rejected: a placeholder value that #2 removes again, and a page with the title
  alone.
- **The pipeline's toolchain** is set up in #3, after the first investigation, not in #1.

## Investigations

Spikes run through `/openspec-explore`. Each writes a file under `investigations/` that names its
sources, the script and the output that produced its values, and the expected values with their
tolerances.

- **Data sources**, the first one, before #2 and #3. Done on 2026-11-14:
  `investigations/data-sources.md`, with its scripts in `investigations/data-sources/`. What it
  found, question by question:
  - The public sources offer the results per municipality for every national vote since 2013.
    The characteristics exist for matching years, on other lists of municipalities; area,
    language and religion per municipality were not found.
  - Votes that belong to no municipality on the map: the Swiss abroad are a separate entry in
    11 to 12 cantons (1.0% to 1.6% of the valid ballots), and five to seven municipalities of
    the canton of Bern have no result of their own.
  - The sources use today's list of municipalities for every vote, and convert the earlier
    results after each merger.
  - One case is not covered by the three kinds of hard constraint 2: an initiative, its
    counter-proposal and a tie-break question on 2026-03-08. A mandatory vote that needs only
    the majority of voters does not occur.
  - The official results are the Federal Chancellery's. The municipal data matches them
    exactly for 116 of 117 validated votes, among them the vote of 2016-02-28 on the taxation
    of couples (failure mode 3); for one vote it is 200 no votes off.

  The investigation lists nine points for the changes to decide. #2 decided point 5 (the
  initiative with a counter-proposal and its tie-break question), #3 decided points 1 to 4 and
  6 to 9, which `investigations/data-sources.md` notes point by point; the entries of the
  table above show both. The most visible: the official result is the Federal Chancellery's, with one
  named difference; all votes use today's list of municipalities, so the map of #6 is one map.
  While proposing #3, three more facts were found and added to the investigation: the two
  sources share the BFS's id, they differ in the registered voters, and Moutier changed canton
  on 2026-01-01.

## Failure modes of the predecessor (must not repeat)

1–5 were found by reading and running `lukaspestalozzi/votation-visualisation`; 6–8 are from its
README and its repository. The change named after each specifies against it.

1. The cantons in favour were miscalculated: per canton, only the last municipality processed
   counted instead of the sum (`computeMajorityCanton` in `visualisation/myscript.js`) (→ 2).
2. Schaffhausen was treated as a half canton and Appenzell Ausserrhoden as a full one (→ 1).
3. Merged municipalities appeared as several rows with identical figures and were counted more
   than once. For the vote of 2016-02-28 on the taxation of couples, the municipal yes votes sum
   to 1,622,968 against 1,609,152 in the official result (→ 3).
4. Every vote was judged by the double majority, including optional referendums (→ 2 for the
   rule, 3 for the kind of each vote, 4 for the verdicts shown).
5. The slider for the elderly took its range from the data on under-18-year-olds and filtered on
   the data on over-65-year-olds (→ 7 for the one definition of each characteristic, 8 for the
   control).
6. The sources were inconsistent, and nothing caught it early: mergers applied at different
   dates in different data sets, counts delivered as integers, floats or text, and one missing
   value in the vote results that surfaced far down the pipeline (→ 3, 7).
7. There were no automated tests and no CI. The only integrity check was a notebook run by hand
   (→ 1 for the tests and the CI build job, 3 for the pipeline's checks in the notebook's
   place).
8. The libraries were loaded from third-party servers at run time, one of them over plain HTTP
   (→ 1).
