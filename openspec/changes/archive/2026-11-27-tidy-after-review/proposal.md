# Proposal

## Why

Q and Claude reviewed the built site page by page after #18 (2026-11-27). Both found things that
are noise, too long, inconsistent from one part of a page to the next, or missing: a mark that
adds nothing, a sentence that is too long for its place, a filter the start page lacks, and a
handful of small inconsistencies in wording, layout, numbers and French typography. One change
takes them together, so that the specs say what the site now shows.

## What Changes

From Q's review:

- **The mark "vorläufig" goes, from the screen and from the data.** The start page's mark
  "vorläufig", the note "Vorläufiges Ergebnis: vom Bundesrat noch nicht erwahrt." on a vote's
  page and on the comparison, and their French and Italian texts are removed. The list of votes
  (`votes.json`) no longer holds `validated`. The pipeline still takes a validated result from the
  Federal Chancellery and any other from the BFS, as before; a validated vote is still the one
  with a reference to the official publication. **BREAKING** for the data file's shape (only the
  app reads it).
- **The sentence at the limits keeps only its first sentence**: "Ein Gedankenexperiment: So wäre
  die Abstimmung ausgegangen, wenn nur die ausgewählten Gemeinden abgestimmt hätten.", followed by
  the link to the guide, as before. The guide still says that a selection shows neither how people
  voted nor a forecast.
- **A fourth button on the start page, "Knappes Ergebnis"**, keeps the votes whose official yes
  share is from 47.00% to 53.00%. Only one of the four buttons is pressed at a time, and it applies
  together with the words of the search, as the others do. The tie-break question is never close.

From Claude's review:

- The details of a municipality without a result say "Ihre Stimmen", not "Seine Stimmen": a
  Gemeinde is feminine.
- The comparison before a vote is chosen: both lists take the page's width, one below the other
  with room between them. The second is disabled until a first vote is chosen, and a sentence says
  what to do.
- The start page's line between two rows ends where the line above a vote day ends, not 8 pixels
  further right.
- On a phone the links to the years wrap onto a second line instead of running past the window's
  edge with no sign that they move sideways.
- The summary of 6730 (motorways, 2024-11-24) no longer names its cost, 4.9 billion francs. The
  cost was an argument of the campaign, which the summaries leave out.
- **One way to write numbers on a page.** The summaries write numbers as the rest of the screen
  does: a decimal point, and digits grouped by three with an apostrophe ("9.5 Millionen",
  "10'100 Franken", "17.0 auf 21.2 Prozent"), in all three languages. The update stops on a
  summary with a decimal comma or a group of digits parted by a space.
- **French typography of the Confederation.** The site's own French texts and the French summaries
  take a no-break space before ":" and inside « », and a narrow no-break space before ";", "?" and
  "!", as the official titles of the votes already do and as admin.ch writes. No line breaks at
  these spaces.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `vote-list`: the marks of an entry lose "vorläufig"; the buttons by result gain "Knappes
  Ergebnis"; the years wrap in a narrow window.
- `verdicts`: what the sources say about the result: no note for a result that is not validated.
- `reading-guide`: the sentence at the limits is its first sentence only.
- `result-map`: the details of a municipality without a result read "Ihre Stimmen".
- `vote-comparison`: the lists before a vote is chosen, and the sentence that says what to do.
- `vote-data`: the list of votes no longer holds whether a vote is validated.
- `vote-summaries`: how a summary writes numbers, and the French spaces; the update checks both.
- `interface-languages`: the French and Italian texts of a result not validated yet go; the French
  spaces; the new button's French and Italian words.

## Impact

- **App**: `app/src/lib/texts/` (three languages and the `Texts` type: the removed provisional
  texts, the first sentence, "Ihre", the button, the comparison's sentence, the French spaces),
  `vote-list.ts` (the fourth button), `vote-data.ts` (the type without `validated`),
  `vote-page.ts` and `comparison.ts` (no provisional note), the start page's and the comparison's
  Svelte files (the button, the years, the row's line, the lists), and their unit and browser
  tests.
- **Pipeline**: `write.py` (no `validated` in the list), `summaries.py` (the checks of numbers and
  French spaces), their tests, and `pipeline/README.md`.
- **Data**: `pipeline/vote-summaries.json` (numbers, French spaces, 6730), then one run of the
  update, which writes `app/static/data/votes.json` and `sources.json`.
- **Project context**: `openspec/config.yaml`, hard constraint 1 and the glossary's "Validated",
  which say the data marks a vote as not validated; they change to say that the data holds the
  BFS's result until then, without a mark.
- **Docs**: `docs/roadmap.md`, `CLAUDE.md`'s description of the start page and the code map,
  `README.md` where it names the mark.
- No new dependency.

This change is off-roadmap: it is a review pass after the changes of `docs/roadmap.md` that adds
one small feature (the button) that Q asked for while reviewing. It gets its own row there.

## Non-goals

- The percent sign and the decimal point in French and Italian ("49.16%" stays, not "49,16 %"):
  the screen's way of writing numbers is the share link's too, and stays as it is in every
  language.
- The titles of the votes stay as the BFS gives them, among them "Gegenvorschlag" in the
  tie-break question's German title and the hyphen in 5960's titles.
- The Federal Chancellery not yet giving the results of 2026-03-08 and 2026-06-14 as validated is
  not looked into here.
- No other filter on the start page (by kind, by year range, by turnout).
- Italian typography is not touched: it takes no space before these signs.
