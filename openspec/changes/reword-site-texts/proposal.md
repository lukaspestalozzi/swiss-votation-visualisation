# Proposal

## Why

Q asked for the site's texts to read as people write them (the `humanizer` pass of 2026-11-25).
The pass found no machine-made phrases, but a handful of German sentences that read as
translations of the English specs: "Karte und Ergebnis rechnen sofort neu", "Eine Abstimmung
nimmt … vor ihrem Tag", "eine Grenze ändert durch sie keine Zahl". Q: go ahead, with the French
and Italian counterparts, in the pull request of the budgets and the archive of `redesign-site`.

## What Changes

The wording of eight texts; no figure, rule, layout or behaviour changes.

- The start page's sentence: "Karte und Ergebnis werden sofort neu berechnet." (French and
  Italian already say it so.)
- The place of the selection's result: "Sobald Sie bei einem Merkmal eine Grenze setzen, steht
  hier das Ergebnis der Gemeinden, die übrig bleiben.", in French "Dès que vous fixez une limite
  pour une caractéristique, le résultat des communes restantes s'affiche ici.", in Italian
  "Appena fissa un limite per una caratteristica, qui appare il risultato dei Comuni rimasti."
- The details of a municipality without a result: "Kein eigenes Ergebnis: Seine Stimmen …", a
  capital after the colon, as a whole sentence follows (German only; French and Italian write a
  small letter there).
- The guide, "Die Merkmale": the paragraph on which figures apply to a vote, in three short
  sentences instead of one long one, in three languages; and "so, wie sie bei der Gemeinde
  angezeigt sind" for "stehen" (German only).
- The guide, municipalities without a result: "Ob eine Auswahl sie behält oder streicht, ändert
  am Ergebnis nichts." for "eine Grenze ändert durch sie keine Zahl", in three languages; and
  "Wenige Gemeinden" for "Einige wenige Gemeinden" (German only).
- The guide, the Swiss abroad: "…; das sind 1.0% bis 1.6% der gültigen Stimmen", in three
  languages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `vote-list`: the start page's sentence, quoted in "The list of votes".
- `verdicts`: the sentence of "The place of the selection's result".
- `result-map`: the sentence of "The details of a municipality without a result".
- `reading-guide`: the last sentence of the guide's paragraph on the figures that apply, quoted in
  the scenario "What the jobs count". Its other requirements say in English what the reworded
  paragraphs say, and stay true.

## Impact

- `app/src/lib/texts/de.ts`, `fr.ts`, `it.ts`.
- The tests that quote the texts: `app/e2e/vote-list.spec.ts`, `limits.spec.ts`,
  `result-map.spec.ts`, `guide.spec.ts`, and `app/src/lib/result-map.test.ts`.
- Not changed: `investigations/redesign/mockups/build.mjs`, whose mockups keep the texts of the
  day they were made.
- No data, no calculation, no layout; the texts' lengths change by a few words, which the tests of
  every page within 360 pixels and of no paragraph over 40rem check.
