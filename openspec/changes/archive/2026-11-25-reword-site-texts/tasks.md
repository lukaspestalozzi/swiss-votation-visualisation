# Tasks

## 1. The texts

- [x] 1.1 Change the tests that quote the texts to the new wording, and see them fail: the browser
  tests of vote-list "The heading and the sentence", of limits "the selection's place", of
  result-map "Meienried", of guide "The Swiss abroad", "municipalities without a figure", "The
  characteristics" and "What the jobs count", and the unit test of `result-map.test.ts` for Meienried. Verify: each fails on
  the texts of before with the old wording as what it received.
- [x] 1.2 Reword the texts in `app/src/lib/texts/de.ts`, `fr.ts` and `it.ts`, as the proposal
  lists them. Verify: the tests of 1.1 pass, and `texts.test.ts` (no French or Italian text is
  the German one).
- [x] 1.3 Verify the pages still fit: the browser tests of small-screens "The other pages" and of
  site-style "no paragraph over 40rem" pass.

## 2. Close

- [x] 2.1 Update `CLAUDE.md` (the status: a change in flight) and `docs/roadmap.md` (a row 15).
  Verify: `openspec validate --all --strict` passes.
- [x] 2.2 Verify: `./scripts/verify-local.sh` passes all 11 steps.
