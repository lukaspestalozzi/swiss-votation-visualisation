# Tasks

## 1. Investigation: the booklets, before any summary is written

- [x] 1.1 `investigations/vote-summaries.md` with a script in `investigations/vote-summaries/`
  (Python, standard library only): for each of the 44 vote days of `votes.json`, the address of
  the Federal Council's explanations as a PDF in German, French and Italian, on
  `https://www.admin.ch` from 2015-06-14 and Swissvotes' copies before (design, decision 14),
  how they were found, the answer to each request (status, content type), and the language of
  each document, read from its first page. Verify: the script prints 132 addresses, each
  answering 200 with `application/pdf`, and each document is in the language the file names.
- [x] 1.2 In the same file: the names the Federal Chancellery gives the document in French and
  Italian (design, decision 3), and what the Copyright Act, art. 5, says of the explanations,
  with the source of each. Verify: each statement cites its source; the link texts of the spec
  match, or the spec is corrected with Q before task 4.
- [x] 1.3 In the same file: the sample Q reviews, at least 15 votes from every year and of every
  kind, 5800 and 6650 among them, and three sample summaries (5960, 6650, 6823) in three
  languages, written by the rules of decision 8. Verify: Q approves the three, or the rules
  are changed with Q before task 3.

## 2. The pipeline: reading and checking the file of the summaries

- [x] 2.1 Made-up sources (`pipeline/tests/made_up.py`): a file of the summaries for the
  made-up votes and days. A reader and its checks (a module of its own, called from
  `update.py`): every vote has a summary in three languages of 120 to 450 characters, plain
  text, no line break; no summary without a vote; every vote day has three addresses on
  `https://www.admin.ch`. Tests first, one at a time, for each scenario of the requirements
  "The length and form of a summary" and "Every vote has a summary, and every summary a vote".
  Verify: `uv run --directory pipeline --locked pytest` passes; each new test failed before
  its check existed.
- [x] 2.2 `download.py`: request each address (`HEAD`, `GET` where refused) within the retries;
  stop naming the vote day, language and address on a status other than 200, a content type
  other than `application/pdf`, or another host, which is not requested. Tests with a fake
  opener for the scenarios of "The link to the explanations". Verify: `pytest` passes.
- [x] 2.3 `write.py`: `summary` and `explanations` after `note` for each vote; the record of the
  sources names `pipeline/vote-summaries.json` with its size and checksum. Tests: the scenarios
  of `vote-data` ("A vote's summary and explanations", "Three votes of one day share their
  explanations", "The record names the file of the summaries"), and the same bytes for the
  same inputs. Verify: `pytest`, `ruff format --check .`, `ruff check .` and `mypy` pass.
- [x] 2.4 `pipeline/README.md`: the file of the summaries, its rules, and the step in the
  procedure of a new vote day (write the summaries from the booklet before the update).
  Verify: the procedure names the file and the step.

## 3. The summaries

- [x] 3.1 `pipeline/vote-summaries.json`: the addresses of task 1.1 and a summary of each of the
  125 votes in German, French and Italian, each written from the booklet in its own language
  by the rules of decision 8, by vote day; the German ones through the `humanizer` pass.
  Verify: the reader of task 2.1 accepts the file (a test that reads the real file, or the
  update in 3.2).
- [ ] 3.2 Run the update: `uv run --directory pipeline --locked python -m pipeline update`.
  Verify: it passes every check and requests the 132 addresses; `git diff` of
  `app/static/data/` shows only the two new fields in `votes.json` and the new entry in
  `sources.json`; a second run changes nothing.
- [ ] 3.3 Q reviews the sample of task 1.3 in the file. Verify: Q approves, or the summaries
  are corrected and reviewed again (scenario "A sample is reviewed").

## 4. The app

- [ ] 4.1 `vote-data.ts`: `summary` and `explanations` in the type of a vote; `voteText` reads
  them, an error naming the vote and the language when one is missing. Unit test for the
  scenario "A summary of what a vote is about missing in one language". Verify: `pnpm run
  test` and `pnpm run check` pass.
- [ ] 4.2 `texts/`: the link's text in three languages (task 1.2) and the guide's sentence on
  the summaries; `texts.test.ts` still finds no French or Italian text equal to the German.
  Verify: `pnpm run test` passes.
- [ ] 4.3 A vote's page: the summary and the link below the sentence on the majorities, above
  the workbench, as a paragraph of the site; the link in the text's colour and at least 44
  pixels high on a touch screen. Browser tests for the scenarios of "The summary on a vote's
  page", one at a time. Verify: `pnpm run build` and those tests pass.
- [ ] 4.4 The comparison: `comparison.ts` gives each comparable vote its summary and address in
  the page's language, `ComparedVote.svelte` shows them under its head. Unit test and browser
  tests for "The summary on the comparison". Measure the comparison's page data before and
  after, with and without gzip, and record it in `investigations/vote-summaries.md`. Verify:
  the tests pass; the growth is within 25 KB with gzip, or Q is told the figure.
- [ ] 4.5 The guide: the sentence of the requirement "The sources" in three languages. Browser
  test of the scenario "The summaries of the votes". Verify: the test passes.
- [ ] 4.6 Verify the budgets: the budget tests of the limits, the map and the comparison pass
  unchanged (`pnpm run test:e2e`).

## 5. Docs and checks

- [ ] 5.1 `CLAUDE.md`: the status, the file of the summaries in "Where things are" and the code
  map (the pipeline's new module, the changed app files, the investigation);
  `docs/roadmap.md`: row 18; `README.md`: the summaries. Verify: `openspec validate --all
  --strict` passes.
- [ ] 5.2 Verify: `./scripts/verify-local.sh` passes all 11 steps.
- [ ] 5.3 On Q's request, the preview of the branch (`CLAUDE.md`, "The preview"). Verify: Q opens
  a vote's page with its summary on the phone.

## Workflow follow-up

- Verify the change (`/openspec-verify-change`), then archive it and mark row 18 done in
  `docs/roadmap.md`.
