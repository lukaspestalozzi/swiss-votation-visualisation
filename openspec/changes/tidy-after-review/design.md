# Design

## Context

Q and Claude each went through the built site after #18 (2026-11-27). Claude did it with
Playwright on the build, at 1,280 × 900 pixels, on the browsers' Pixel 7, and in the dark scheme.
It covered the start page, a vote's page (6880, 6823, 5960 in Italian), a selection, the comparison
with and without votes, the guide, the list of characteristics, and a click on Romoos. A fix made
before this change, `fix(app): nothing covers the link to the explanations`, is already on the
branch: the part of a vote's page that stays in the window covered the link to the explanations.
It was a bug of #18 that needed no spec change.

What the code does today, where this change touches it:

- `votes.json` holds `validated` per vote. The app reads it in three places: the start page's
  mark (`vote-list.ts`, `MARK_PROVISIONAL`), the vote page's note (`vote-page.ts`, `PROVISIONAL`)
  and the comparison's notes (`comparison.ts`). For every vote, `validated` is true exactly when
  `reference` is not null: `vote-data` requires a reference for a validated vote and none for any
  other.
- The start page's three buttons are one `kept` value of `listShown` (`vote-list.ts`). A row
  already carries its yes share as a number (`yesShare`) for its bar.
- The sentence at the limits is `THOUGHT_EXPERIMENT`, used by `Limits.svelte` on a vote's page
  and on the comparison.
- The years are a flex line with `overflow-x: auto` and a hidden scrollbar (design of
  redesign-site), so on a phone they run past the window's edge with no sign that they scroll.
- `.vote-row` has `margin: 0 -0.5rem` so that the ground of a row pointed at reaches past its
  text. Its top border reaches past it too, 8 pixels past the line above the vote day.
- The comparison's lists are inline `<select>` elements, as wide as their longest option and at
  most the page's width. With no first vote chosen, the second list has no option, so it is a few
  pixels wide and stands beside its label.
- The summaries write numbers as the booklets do: 13 per language with a decimal comma and 5
  with digits parted by a space. The site's French texts write ":" and «» without spaces, while
  the official French titles in the data write « … » with spaces.

## Goals / Non-Goals

**Goals:**

- Every finding of the review that Q took into this change, as the proposal lists it, with the
  specs saying what the site shows.
- The pipeline's checks keep the summaries' numbers and French spaces from drifting back.

**Non-Goals:**

- Those of the proposal. Also: no look at the Chancellery's lag for 2026; no new characteristic.

## Decisions

### 1. "vorläufig" goes from the screen and from the data (Q)

The mark, the vote page's note, the comparison's note and their texts go. `write.py` no longer
writes `validated`, and the type in `vote-data.ts` loses it. The pipeline keeps reading the
Chancellery and choosing its result where it has one, and keeps every check that needs a
validated vote, such as the known differences and the agreement on the verdict.

Alternatives: drop it from the screen only and keep the field (Claude's recommendation: a smaller
change, and easy to undo). Q chose screen and data. The field says nothing that `reference` does
not already say, so the data loses no information: a vote is validated when it has a reference.

`openspec/config.yaml` says in hard constraint 1 that a vote that is not validated is "marked as
not validated", and its glossary entry "Validated" says the same. Both change to: until a vote is
validated, the data holds the Federal Statistical Office's result, without a reference. That is
project context, which this change edits because Q decided it.

### 2. The sentence at the limits is its first sentence (Q)

`THOUGHT_EXPERIMENT` keeps its first sentence in each language. That a selection shows neither
how people voted nor a forecast stays where it is explained at length, in the guide's section
"Was die Auswahl nicht zeigt", which the link after the sentence leads to, and in the start page's
lead ("Ein Gedankenexperiment, keine Prognose."). The product's rule that the site makes this
clear still holds through those two places.

### 3. "Knappes Ergebnis" is a fourth button (Q)

`kept` takes a fourth value, `close`. A vote is close when its yes share, rounded to two decimals
as the row writes it, is from 47.00% to 53.00%, both included, whatever its verdict. The rounding
is the row's, so a visitor never sees "53.00% Ja" left out or "46.99% Ja" kept. The comparison
uses the row's `yesShare` in hundredths, as the bar does. A tie-break question has no yes share
and is never close.

Labels: "Knappes Ergebnis", "Résultat serré", "Esito risicato". The French and Italian are
ordinary words, not terms of the Confederation; investigations/languages.md has no source for
them.

Alternatives: a toggle that applies together with "Angenommen" or "Abgelehnt" (more states, a
second kind of control; Q chose the button); a range other than 47 to 53 (Q named it).

Budget: the list is filtered in `listShown` as the other buttons are, so the start page's budget
of 50 ms for a press holds (`vote-list`, "The budget of the list"); its browser test runs with
the new button too.

### 4. "Ihre Stimmen"

The German text of a municipality without a result says "Ihre": the details name a Gemeinde,
which is feminine. "Seine" was a slip that the spec quoted. French and Italian already say "ses"
and "i suoi", which agree with "commune" and "Comune".

### 5. The comparison before a vote is chosen

Both lists are `display: block; width: 100%`, the labels one below the other with 1rem between
them; the second list is `disabled` while it offers nothing. Until a first vote is chosen, a
sentence below the lists says what to do: "Wählen Sie zwei Abstimmungen. Die Gemeinden, die Sie
danach auswählen, zählen in beiden." (and its French and Italian). Once a first vote is chosen,
the sentence that the same municipalities count in both (`SAME_MUNICIPALITIES`) stands beside the
limits, as before.

Alternatives: lists at their natural width (as today; the empty one is the problem); no sentence
(the page would still be a heading and two lists with nothing to say what they are for).

### 6. The line between two rows

The row keeps its negative margin for the ground of a row pointed at. Its line is drawn by a
`::before` of the row, inset by 0.5rem on both sides, instead of its border, so that it starts and
ends where the row's text does and ends where the vote day's line ends. A browser test compares
the right ends of the two lines.

### 7. The years wrap

`.years` loses `overflow-x: auto` and gets `flex-wrap: wrap`. On a phone the 14 years take two
lines. The part that stays at the top grows by one line, which the page already measures
(`--finder`), so a heading a link leads to is still not hidden. Alternative: keep one line and
fade its right edge to show that it scrolls (hidden links stay hidden behind a gesture that a
visitor has to guess).

### 8. The summary of 6730

Its last sentence, "Dafür sind 4,9 Milliarden Franken vorgesehen." and its French and Italian,
goes. The cost was the campaign's main argument, and Q's rule for the summaries leaves out costs
argued over (design of add-vote-summaries). The `vote-summaries` spec now says so, as Q decided
it on the samples.

### 9. Numbers in the summaries as on the screen (Q)

The 18 summaries per language that write a number otherwise are rewritten: "9,5" → "9.5",
"10 100" → "10'100", "17,0 %" → "17.0%", "4000 Franken" → "4'000 Franken". `summaries.py` checks
each summary and stops the update, naming the vote and the language, on:

- a decimal comma: `\d,\d`;
- three digits parted by a space (an ordinary, no-break or narrow no-break one) from a digit
  before them: `\d[   ]\d{3}(?!\d)`;
- five digits or more in a row: `\d{5}`.

A four-digit amount is grouped by hand and read in review; a check cannot tell "4000 Franken"
from the year 2050.

Alternatives: the screen moves to the booklets' style (format.ts, the share link, every test with
figures; Q chose the screen's); leave both (two styles on one page).

### 10. French spaces as the Confederation writes them (Q)

The site's own French texts (`fr.ts`) and the French summaries take U+00A0 before ":" and inside
« », and U+202F before ";", "?" and "!". The vote's titles and the Chancellery's notes come from
the sources and are shown as they are. `unusableParts` and every function that writes «…» or a
colon in French take the spaces too. `cantonalVotes` stays "16½ : 6½" in every language, as now.

Checks:

- `summaries.py` stops the update on a French summary in which ":", ";", "?", "!" or "»" follows a
  character other than its space, or "«" is followed by one; an address (`https:`) is already
  refused.
- A unit test of the texts writes every French text with made-up figures and asserts the same, with
  the exceptions of the cantonal votes' " : " and the times and addresses no text has.

Alternatives: keep the site's style (a French page mixes two styles; Q chose the Confederation's);
ordinary spaces (a line could break before a colon or a question mark).

Italian takes no space before these signs and is not touched.

## Risks / Trade-offs

- **Shorter sentence at the limits.** A visitor who never opens the guide no longer reads next to
  the limits that a selection is not about people. → The start page's lead still says it is a
  thought experiment and not a forecast, and the link to the guide stays next to the sentence.
- **French tests.** Many browser and unit tests assert French texts with a colon or guillemets;
  each needs the new spaces. → Tasks list them by file; the texts' test catches any text missed.
- **Data shape.** An old `votes.json` with `validated` would still parse (an extra field), and a
  new one without it is what the app expects; only the app reads the file.
- **The Chancellery's lag.** The results of 2026-03-08 and 2026-06-14 are still the BFS's. Without
  the mark nobody sees that on the site; the data and the pipeline's report still tell.
