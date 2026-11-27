# Proposal

## Why

A vote's page names the vote only by its official title, and many titles say little about what
was decided ("Bundesbeschluss über die Familienpolitik", "Änderung des Bundesgesetzes über …").
A visitor who does not remember the vote has to leave the site to learn what it was about before
the map and the limits mean anything. Q asked on 2026-11-27 for a short note on each vote that
says what it was about: a summary, as the change calls it (design, decision 9).

Off-roadmap: `docs/roadmap.md` does not name it; it becomes #18, after the changes of v1 and
#11 to #17. No source the pipeline reads holds such a text (the BFS feed, the Federal
Chancellery's linked data and the Swissvotes dataset have titles, results and links only;
explored on 2026-11-27), so the texts are the site's own, written from the Federal Council's
explanations (the voting booklet).

## What Changes

- A short summary of every vote, two or three sentences in German, French and Italian, saying
  neutrally what the proposal would have changed, without the result, a recommendation or a
  party's position. Written from the short text that opens each vote's part of the Federal
  Council's explanations ("Das Wichtigste in Kürze", "En bref", "In breve"), drafted by Claude
  and reviewed by Q on a sample.
- Under each summary, a link to the Federal Council's explanations of its vote day, the PDF in the
  page's language. www.admin.ch has them from 2015-06-14 on; for the 9 vote days before,
  the link goes to Swissvotes' copies in German and French, Italian pages to the French one;
  the French pages of 2016-02-28 link admin.ch's German booklet, as admin.ch has no French one.
- The summaries and the links are a reviewed input of the pipeline, `pipeline/vote-summaries.json`,
  like `known-differences.json`. The update checks them (every vote of the list has a summary in
  each language, within a length; no summary for a vote the list does not hold; every link
  answers) and writes them into `votes.json`. A vote without a summary stops the update, so a
  new vote day's summaries are written once its results exist, before its data is updated.
- The summary stands on a vote's page below its head, and on the comparison below each chosen
  vote's head. The tie-break question has a summary of its own.
- The guide's sources say that the summaries are the site's own of the Federal Council's
  explanations, not an official text.
- `investigations/vote-summaries.md`: where the explanations of every vote day since 2013 are
  published in each language, what the Copyright Act says about using them, and three sample
  summaries, before the 125 are written.

## Non-goals

- No text taken over unchanged from the booklets, and no other source of texts (Swissvotes'
  descriptions, newspapers, the parties' arguments).
- No arguments for and against, no recommendations of the Federal Council, Parliament or the
  parties, and no result in the summary: the page shows the result.
- No summary on the start page, in its rows or its search: the search still looks at titles only.
- No Romansh or English, and no summaries for votes before 2013.
- No copy of the booklets served with the site: the link goes to the Confederation's server,
  or for the vote days before 2015-06-14 to Swissvotes'.
- No change to a figure, a rule, the calculation or the map.

## Capabilities

### New Capabilities

- `vote-summaries`: the summary of each vote and the link to its explanations: what a summary
  says and how long it is, where the summaries are kept and how the pipeline checks them, and where the
  pages show them.

### Modified Capabilities

- `vote-data`: the list of votes holds each vote's summary and the address of its explanations in
  three languages; the record of the sources names the file of the summaries; adding a vote
  day needs the new votes' summaries.
- `interface-languages`: the vote's texts in the page's language include its summary and the
  link's address; one missing fails the build.
- `reading-guide`: the section "Quellen" names the summaries as the site's own of the
  Federal Council's explanations.

## Impact

- `pipeline/vote-summaries.json` (new, written by hand and reviewed), `pipeline/src/pipeline/`:
  a reader and checks of it in `update.py` or a module of its own, the check of the links in
  `download.py`, the new fields in `write.py`; the made-up sources and tests;
  `pipeline/README.md`'s procedure of a new vote day.
- `app/static/data/votes.json` (written by the update): about 150 KB more with the texts of
  three languages; it is read at build time only, so no page loads more than its own summary,
  except the comparison, whose page holds the summaries of the 124 votes it offers in its
  language (measured: about 64 KB, 18 KB with gzip; `investigations/vote-summaries.md`, 4).
- `app/src/lib/vote-data.ts` (the types), `vote-page.ts` and `comparison.ts` (the summary and
  the link), `texts/` (the link's words in three languages, the guide's sentence), the vote's
  page, `ComparedVote.svelte`, the guide.
- Browser tests of the summary and the link on a vote's page, on the comparison, in three
  languages, at 360 pixels and in both colour schemes.
- No new dependency in the app or the pipeline.
